import express from 'express';
import Draft from '../models/Draft.js';
import Task from '../models/Task.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// @desc    Get all drafts for authenticated user
// @route   GET /api/drafts
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { source, isPromoted, limit, page } = req.query;
    
    const options = {
      source,
      isPromoted: isPromoted !== undefined ? isPromoted === 'true' : undefined,
      limit: parseInt(limit) || 50,
      page: parseInt(page) || 1
    };

    const result = await Draft.getDraftsByUser(req.user.id, options);

    res.json({
      success: true,
      data: result.drafts,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Get drafts error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching drafts'
    });
  }
});

// @desc    Get draft statistics for authenticated user
// @route   GET /api/drafts/stats
// @access  Private
router.get('/stats', async (req, res) => {
  try {
    const stats = await Draft.getDraftStats(req.user.id);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get draft stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching draft statistics'
    });
  }
});

// @desc    Get single draft by ID
// @route   GET /api/drafts/:id
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const draft = await Draft.findOne({ 
      _id: req.params.id, 
      user: req.user.id 
    }).populate('inboxRef', 'title notes');

    if (!draft) {
      return res.status(404).json({
        success: false,
        error: 'Draft not found'
      });
    }

    res.json({
      success: true,
      data: draft
    });
  } catch (error) {
    console.error('Get single draft error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching draft'
    });
  }
});

// @desc    Create new draft
// @route   POST /api/drafts
// @access  Private
router.post('/', async (req, res) => {
  try {
    const { title, notes, source, inboxRef } = req.body;

    if (!title || title.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Title is required'
      });
    }

    const draft = new Draft({
      user: req.user.id,
      title: title.trim(),
      notes: notes?.trim() || '',
      source: source || 'quick',
      inboxRef: inboxRef || undefined
    });

    await draft.save();

    // Populate inboxRef if it exists
    if (draft.inboxRef) {
      await draft.populate('inboxRef', 'title notes');
    }

    res.status(201).json({
      success: true,
      data: draft
    });
  } catch (error) {
    console.error('Create draft error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: errors.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      error: 'Server error while creating draft'
    });
  }
});

// @desc    Update draft
// @route   PUT /api/drafts/:id
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const { title, notes, source } = req.body;

    const draft = await Draft.findOne({ 
      _id: req.params.id, 
      user: req.user.id 
    });

    if (!draft) {
      return res.status(404).json({
        success: false,
        error: 'Draft not found'
      });
    }

    if (draft.isPromoted) {
      return res.status(400).json({
        success: false,
        error: 'Cannot update a promoted draft'
      });
    }

    // Update fields if provided
    if (title !== undefined) {
      if (!title.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Title cannot be empty'
        });
      }
      draft.title = title.trim();
    }

    if (notes !== undefined) {
      draft.notes = notes.trim();
    }

    if (source !== undefined) {
      draft.source = source;
    }

    await draft.save();

    // Populate inboxRef if it exists
    if (draft.inboxRef) {
      await draft.populate('inboxRef', 'title notes');
    }

    res.json({
      success: true,
      data: draft
    });
  } catch (error) {
    console.error('Update draft error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: errors.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      error: 'Server error while updating draft'
    });
  }
});

// @desc    Promote draft to task
// @route   POST /api/drafts/:id/promote
// @access  Private
router.post('/:id/promote', async (req, res) => {
  try {
    const draft = await Draft.findOne({ 
      _id: req.params.id, 
      user: req.user.id 
    });

    if (!draft) {
      return res.status(404).json({
        success: false,
        error: 'Draft not found'
      });
    }

    if (draft.isPromoted) {
      return res.status(400).json({
        success: false,
        error: 'Draft has already been promoted'
      });
    }

    if (!draft.canPromote) {
      return res.status(400).json({
        success: false,
        error: 'Draft cannot be promoted (missing required fields)'
      });
    }

    // Extract additional task data from request body
    const {
      priority,
      group,
      dueAt,
      startAt,
      tags,
      estimatedMinutes,
      isImportant,
      reminders
    } = req.body;

    const taskData = {
      ...(priority && { priority }),
      ...(group && { group }),
      ...(dueAt && { dueAt: new Date(dueAt) }),
      ...(startAt && { startAt: new Date(startAt) }),
      ...(tags && { tags }),
      ...(estimatedMinutes && { estimatedMinutes }),
      ...(isImportant !== undefined && { isImportant }),
      ...(reminders && { reminders: reminders.map(r => new Date(r)) })
    };

    // Use the draft's promote method which handles the transaction
    const task = await draft.promote(taskData);

    // Populate task relations
    await task.populate([
      { path: 'group', select: 'name color icon' },
      { path: 'inboxRef', select: 'title notes' }
    ]);

    res.status(201).json({
      success: true,
      data: {
        task,
        draft
      },
      message: 'Draft successfully promoted to task'
    });
  } catch (error) {
    console.error('Promote draft error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: errors.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      error: 'Server error while promoting draft'
    });
  }
});

// @desc    Delete draft
// @route   DELETE /api/drafts/:id
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const draft = await Draft.findOne({ 
      _id: req.params.id, 
      user: req.user.id 
    });

    if (!draft) {
      return res.status(404).json({
        success: false,
        error: 'Draft not found'
      });
    }

    await Draft.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Draft deleted successfully'
    });
  } catch (error) {
    console.error('Delete draft error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while deleting draft'
    });
  }
});

// @desc    Bulk delete drafts
// @route   DELETE /api/drafts
// @access  Private
router.delete('/', async (req, res) => {
  try {
    const { ids, deletePromoted = false } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Draft IDs array is required'
      });
    }

    const deleteQuery = { 
      _id: { $in: ids }, 
      user: req.user.id 
    };

    // If deletePromoted is false, only delete unpromoted drafts
    if (!deletePromoted) {
      deleteQuery.isPromoted = false;
    }

    const result = await Draft.deleteMany(deleteQuery);

    res.json({
      success: true,
      message: `${result.deletedCount} drafts deleted successfully`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Bulk delete drafts error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while deleting drafts'
    });
  }
});

export default router;