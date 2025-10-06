import express from 'express';
import { body, validationResult, query } from 'express-validator';
import mongoose from 'mongoose';
import { protect } from '../middleware/auth.js';
import { updateStatsAfterTaskChange } from '../middleware/statsUpdater.js';

// Get Task model
const Task = mongoose.model('Task');
const router = express.Router();

// @desc    Get completed tasks
// @route   GET /api/completed
// @access  Private
router.get('/', protect, [
  query('group')
    .optional()
    .isMongoId()
    .withMessage('Group must be a valid ID'),
  query('daysAgo')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Days ago must be between 1 and 365'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { group, daysAgo, limit = 20, page = 1 } = req.query;

    const result = await Task.getCompletedTasks(req.user.id, {
      group,
      daysAgo: daysAgo ? parseInt(daysAgo) : undefined,
      limit: parseInt(limit),
      page: parseInt(page)
    });

    res.json({
      success: true,
      data: result.tasks,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Get completed tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching completed tasks'
    });
  }
});

// @desc    Mark task as completed
// @route   POST /api/completed/:id
// @access  Private
router.post('/:id', protect, updateStatsAfterTaskChange, async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    if (task.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Task is already completed'
      });
    }

    await task.markAsCompleted();

    res.json({
      success: true,
      message: 'Task marked as completed',
      data: task
    });
  } catch (error) {
    console.error('Mark task completed error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while marking task as completed'
    });
  }
});

// @desc    Revive task (mark as pending)
// @route   POST /api/completed/:id/revive
// @access  Private
router.post('/:id/revive', protect, updateStatsAfterTaskChange, async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    if (task.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Task is not completed'
      });
    }

    await task.revive();

    res.json({
      success: true,
      message: 'Task revived successfully',
      data: task
    });
  } catch (error) {
    console.error('Revive task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while reviving task'
    });
  }
});

// @desc    Toggle task completion status
// @route   POST /api/completed/:id/toggle
// @access  Private
router.post('/:id/toggle', protect, updateStatsAfterTaskChange, async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    await task.toggleCompletion();

    const action = task.status === 'completed' ? 'completed' : 'revived';

    res.json({
      success: true,
      message: `Task ${action} successfully`,
      data: task
    });
  } catch (error) {
    console.error('Toggle task completion error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while toggling task completion'
    });
  }
});

// @desc    Bulk complete tasks
// @route   POST /api/completed/bulk
// @access  Private
router.post('/bulk', protect, updateStatsAfterTaskChange, [
  body('taskIds')
    .isArray({ min: 1 })
    .withMessage('Task IDs must be an array with at least one item'),
  body('taskIds.*')
    .isMongoId()
    .withMessage('Each task ID must be a valid ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { taskIds } = req.body;

    const result = await Task.bulkComplete(req.user.id, taskIds);

    res.json({
      success: true,
      message: `${result.modifiedCount} tasks marked as completed`,
      data: { modifiedCount: result.modifiedCount }
    });
  } catch (error) {
    console.error('Bulk complete error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while bulk completing tasks'
    });
  }
});

// @desc    Bulk revive tasks
// @route   POST /api/completed/bulk-revive
// @access  Private
router.post('/bulk-revive', protect, updateStatsAfterTaskChange, [
  body('taskIds')
    .isArray({ min: 1 })
    .withMessage('Task IDs must be an array with at least one item'),
  body('taskIds.*')
    .isMongoId()
    .withMessage('Each task ID must be a valid ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { taskIds } = req.body;

    const result = await Task.bulkRevive(req.user.id, taskIds);

    res.json({
      success: true,
      message: `${result.modifiedCount} tasks revived`,
      data: { modifiedCount: result.modifiedCount }
    });
  } catch (error) {
    console.error('Bulk revive error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while bulk reviving tasks'
    });
  }
});

// @desc    Cleanup old completed tasks
// @route   DELETE /api/completed/cleanup
// @access  Private
router.delete('/cleanup', protect, [
  query('daysOld')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Days old must be between 1 and 365')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const daysOld = parseInt(req.query.daysOld) || 30;

    const result = await Task.cleanupCompletedTasks(req.user.id, daysOld);

    res.json({
      success: true,
      message: `${result.deletedCount} old completed tasks cleaned up`,
      data: { deletedCount: result.deletedCount }
    });
  } catch (error) {
    console.error('Cleanup completed tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while cleaning up completed tasks'
    });
  }
});

// @desc    Get completion statistics
// @route   GET /api/completed/stats
// @access  Private
router.get('/stats', protect, async (req, res) => {
  try {
    const totalCompleted = await Task.countDocuments({
      user: req.user.id,
      status: 'completed'
    });

    const completedThisWeek = await Task.countDocuments({
      user: req.user.id,
      status: 'completed',
      completedAt: {
        $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      }
    });

    const completedThisMonth = await Task.countDocuments({
      user: req.user.id,
      status: 'completed',
      completedAt: {
        $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      }
    });

    // Average completion time (for completed tasks with start dates)
    const completionTimes = await Task.aggregate([
      {
        $match: {
          user: req.user.id,
          status: 'completed',
          startAt: { $exists: true },
          completedAt: { $exists: true }
        }
      },
      {
        $project: {
          completionTime: {
            $divide: [
              { $subtract: ['$completedAt', '$startAt'] },
              1000 * 60 * 60 * 24 // Convert to days
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          avgCompletionTime: { $avg: '$completionTime' },
          minCompletionTime: { $min: '$completionTime' },
          maxCompletionTime: { $max: '$completionTime' }
        }
      }
    ]);

    const stats = {
      totalCompleted,
      completedThisWeek,
      completedThisMonth,
      completionTimes: completionTimes[0] || {
        avgCompletionTime: 0,
        minCompletionTime: 0,
        maxCompletionTime: 0
      }
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get completion stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching completion statistics'
    });
  }
});

export default router;