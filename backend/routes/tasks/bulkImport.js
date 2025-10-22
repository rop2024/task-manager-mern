import express from 'express';
import multer from 'multer';
import { body, validationResult } from 'express-validator';
import Task from '../../models/Task.js';
import Group from '../../models/Group.js';
import ImportJob from '../../models/ImportJob.js';
import { protect } from '../../middleware/auth.js';
import { parseMarkdown } from '../../utils/markdownParser.js';
import { bulkLimiter } from '../../middleware/rateLimiter.js';
import mongoose from 'mongoose';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 1_000_000 } });

const handleValidationErrors = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
  }
  return null;
};

// POST /api/tasks/bulk/parse
router.post('/parse', protect, bulkLimiter, [
  body('markdown').optional().isString().withMessage('markdown must be a string')
], async (req, res) => {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return validationError;

    const markdown = req.body.markdown || '';
    const result = parseMarkdown(markdown);

    res.json({ success: true, parsed: result.items, errors: result.errors });
  } catch (error) {
    console.error('Bulk parse error:', error);
    res.status(500).json({ success: false, message: 'Server error while parsing markdown' });
  }
});

// POST /api/tasks/bulk/upload-file
router.post('/upload-file', protect, bulkLimiter, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const text = req.file.buffer.toString('utf8');
    const result = parseMarkdown(text);
    res.json({ success: true, parsed: result.items, errors: result.errors });
  } catch (error) {
    console.error('File upload parse error:', error);
    res.status(500).json({ success: false, message: 'Server error while parsing uploaded file' });
  }
});

// POST /api/tasks/bulk/import
router.post('/import', protect, bulkLimiter, [
  body('tasks').isArray().withMessage('tasks must be an array')
], async (req, res) => {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return validationError;

    const tasks = req.body.tasks || [];
    // CHUNKING: handle large payloads server-side or instruct client to chunk
    const CHUNK_SIZE = process.env.BULK_CHUNK_SIZE ? Number(process.env.BULK_CHUNK_SIZE) : 50;

    if (tasks.length === 0) {
      return res.status(400).json({ success: false, message: 'No tasks provided' });
    }

    if (tasks.length > 1000) {
      // Prevent extremely large imports; ask client to chunk
      return res.status(413).json({ success: false, message: 'Payload too large; please split into smaller batches' });
    }

    // Normalize and validate tasks, collect docs and per-item errors
    const docs = [];
    const errors = [];

    for (let i = 0; i < tasks.length; i++) {
      const t = tasks[i];
      if (!t || typeof t !== 'object') {
        errors.push({ index: i, message: 'Invalid task object' });
        continue;
      }

      // Basic validation: title required
      if (!t.title || typeof t.title !== 'string' || !t.title.trim()) {
        errors.push({ index: i, message: 'Title is required' });
        continue;
      }

      // group resolution: accept group id or name
      let groupId = t.group;
      if (groupId && !mongoose.isValidObjectId(groupId)) {
        const g = await Group.findOne({ name: groupId, user: req.user.id });
        if (g) groupId = g._id;
        else {
          const defaultGroup = await Group.findOne({ user: req.user.id, isDefault: true });
          groupId = defaultGroup ? defaultGroup._id : undefined;
        }
      }

      const doc = {
        user: req.user.id,
        createdBy: req.user.id,
        title: String(t.title).trim().slice(0, 200),
        description: t.description,
        status: t.status || 'pending',
        priority: t.priority || 'medium',
        dueAt: t.dueAt ? new Date(t.dueAt) : undefined,
        tags: Array.isArray(t.tags) ? t.tags.map(String) : (t.tags ? [String(t.tags)] : []),
        estimatedMinutes: t.estimatedMinutes !== undefined ? Number(t.estimatedMinutes) : undefined,
        group: groupId
      };

      docs.push({ index: i, doc });
    }

    if (docs.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid tasks to import', errors });
    }

    // Create an ImportJob for audit/logging
    const job = await ImportJob.create({ user: req.user.id, total: tasks.length, meta: { originalCount: tasks.length } });

    // Process in chunks
    const created = [];
    for (let i = 0; i < docs.length; i += CHUNK_SIZE) {
      const chunk = docs.slice(i, i + CHUNK_SIZE);
      const chunkDocs = chunk.map(c => c.doc);

      try {
        // ordered:false to continue on errors, insertMany for performance
        const inserted = await Task.insertMany(chunkDocs, { ordered: false });
        created.push(...inserted);
      } catch (insErr) {
        console.error('Chunk insert error:', insErr && insErr.writeErrors ? insErr.writeErrors.length : insErr);
        // If insertMany failed with writeErrors, collect failed indices
        if (insErr && insErr.writeErrors && Array.isArray(insErr.writeErrors)) {
          const failedIndexes = insErr.writeErrors.map(w => w.index);
          // Add errors for each failed document referencing original index
          failedIndexes.forEach(fi => {
            const original = chunk[fi];
            errors.push({ index: original.index, message: insErr.writeErrors.find(w=>w.index===fi).errmsg || 'Insert error' });
          });
          // Collect successful ones from inserted docs if any
          if (insErr.insertedDocs) created.push(...insErr.insertedDocs);
        } else {
          // Fallback: try per-item insert for the chunk to capture per-item errors
          for (let j = 0; j < chunkDocs.length; j++) {
            try {
              const c = await Task.create(chunkDocs[j]);
              created.push(c);
            } catch (e) {
              errors.push({ index: chunk[j].index, message: e.message });
            }
          }
        }
      }
    }

    // Background: update group task counts and stats (non-blocking)
    (async () => {
      try {
        // Update group counts for affected groups
        const affectedGroupIds = Array.from(new Set(created.map(c => String(c.group)).filter(Boolean)));
        for (const gid of affectedGroupIds) {
          Group.updateTaskCount(gid).catch(e => console.error('Group update error:', e));
        }

        // Update user stats
        const Stats = (await import('../../models/Stats.js')).default;
        Stats.updateUserStats(req.user.id).catch(e => console.error('Stats update error:', e));
      } catch (bgErr) {
        console.error('Background update error:', bgErr);
      }
    })();

    // Update job with results
    job.createdCount = created.length;
    job.failedCount = errors.length;
    job.errors = errors;
    await job.save();

    res.status(201).json({ success: true, jobId: job._id, createdCount: created.length, errors });
  } catch (error) {
    console.error('Bulk import error:', error);
    res.status(500).json({ success: false, message: 'Server error while importing tasks' });
  }
});

// GET job status
router.get('/jobs/:id', protect, async (req, res) => {
  try {
    const job = await ImportJob.findOne({ _id: req.params.id, user: req.user.id });
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    res.json({ success: true, data: job });
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;

