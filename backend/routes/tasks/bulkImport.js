import express from 'express';
import multer from 'multer';
import { body, validationResult } from 'express-validator';
import Task from '../../models/Task.js';
import Group from '../../models/Group.js';
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
  body('tasks').isArray({ max: 50 }).withMessage('tasks must be an array with at most 50 items')
], async (req, res) => {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return validationError;

    const tasks = req.body.tasks || [];

    // Prepare documents and per-item errors
    const docs = [];
    const errors = [];

    for (let i = 0; i < tasks.length; i++) {
      const t = tasks[i];
      // Basic validation: title required
      if (!t.title || typeof t.title !== 'string' || !t.title.trim()) {
        errors.push({ index: i, message: 'Title is required' });
        continue;
      }

      // group resolution: accept group id or name
      let groupId = t.group;
      if (groupId && !mongoose.isValidObjectId(groupId)) {
        // try resolve by name
        const g = await Group.findOne({ name: groupId, user: req.user.id });
        if (g) groupId = g._id;
        else {
          // fallback to user's default group
          const defaultGroup = await Group.findOne({ user: req.user.id, isDefault: true });
          groupId = defaultGroup ? defaultGroup._id : undefined;
        }
      }

      const doc = {
        user: req.user.id,
        createdBy: req.user.id,
        title: t.title.trim().slice(0, 200),
        description: t.description,
        status: t.status || 'pending',
        priority: t.priority || 'medium',
        dueAt: t.dueAt ? new Date(t.dueAt) : undefined,
        tags: Array.isArray(t.tags) ? t.tags.map(String) : (t.tags ? [String(t.tags)] : []),
        estimatedMinutes: t.estimatedMinutes !== undefined ? Number(t.estimatedMinutes) : undefined,
        group: groupId
      };

      docs.push(doc);
    }

    // If no docs to insert
    if (docs.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid tasks to import', errors });
    }

    // Insert many with validation
    const session = await Task.startSession();
    let created = [];
    try {
      session.startTransaction();
      created = await Task.insertMany(docs, { session });
      await session.commitTransaction();
    } catch (insErr) {
      await session.abortTransaction();
      console.error('InsertMany error:', insErr);
      // Fall back to per-item insert to capture which failed
      for (let i = 0; i < docs.length; i++) {
        try {
          const c = await Task.create(docs[i]);
          created.push(c);
        } catch (e) {
          errors.push({ index: i, message: e.message });
        }
      }
    } finally {
      session.endSession();
    }

    res.status(201).json({ success: true, createdCount: created.length, data: created, errors });
  } catch (error) {
    console.error('Bulk import error:', error);
    res.status(500).json({ success: false, message: 'Server error while importing tasks' });
  }
});

export default router;
