import express from 'express';
import { body, validationResult } from 'express-validator';
import Task from '../../models/Task.js';
import { protect } from '../../middleware/auth.js';
import { updateStatsAfterTaskChange } from '../../middleware/statsUpdater.js';

const router = express.Router();

// Helper function to handle validation errors
const handleValidationErrors = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  return null;
};

/**
 * @route   POST /api/tasks/quick
 * @desc    Quick capture - create minimal task in draft status
 * @access  Private
 * @body    { title } - minimal required data
 */
router.post(
  '/',
  protect,
  [
    body('title')
      .trim()
      .notEmpty()
      .withMessage('Title is required')
      .isLength({ max: 255 })
      .withMessage('Title must be less than 255 characters')
  ],
  updateStatsAfterTaskChange,
  async (req, res) => {
    try {
      const validationError = handleValidationErrors(req, res);
      if (validationError) return validationError;

      const { title } = req.body;

      // Quick capture creates minimal draft task
      const taskData = {
        title,
        status: 'draft',
        isQuickCapture: true,
        createdBy: req.user.id,
        user: req.user.id,
        priority: 'medium' // Default priority
      };

      const task = await Task.create(taskData);

      res.status(201).json({
        success: true,
        message: 'Quick task captured successfully',
        data: task
      });

    } catch (error) {
      console.error('Quick capture error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during quick capture',
        error: process.env.NODE_ENV !== 'production' ? error.message : undefined
      });
    }
  }
);

/**
 * @route   GET /api/tasks/quick
 * @desc    Get all quick capture tasks (drafts from quick capture)
 * @access  Private
 */
router.get('/', protect, async (req, res) => {
  try {
    const tasks = await Task.find({
      user: req.user.id,
      isQuickCapture: true,
      status: 'draft'
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: tasks.length,
      data: tasks
    });

  } catch (error) {
    console.error('Get quick tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching quick tasks',
      error: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
});

/**
 * @route   PUT /api/tasks/quick/:id/promote
 * @desc    Promote quick capture task to full task (draft -> pending)
 * @access  Private
 */
router.put(
  '/:id/promote',
  protect,
  [
    body('description')
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Description must be less than 2000 characters'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high'])
      .withMessage('Priority must be low, medium, or high'),
    body('dueDate')
      .optional()
      .isISO8601()
      .withMessage('Due date must be a valid date'),
    body('dueAt')
      .optional()
      .isISO8601()
      .withMessage('Due date must be a valid date'),
    body('tags')
      .optional()
      .isArray()
      .withMessage('Tags must be an array')
  ],
  updateStatsAfterTaskChange,
  async (req, res) => {
    try {
      const validationError = handleValidationErrors(req, res);
      if (validationError) return validationError;

      const task = await Task.findOne({
        _id: req.params.id,
        user: req.user.id,
        isQuickCapture: true,
        status: 'draft'
      });

      if (!task) {
        return res.status(404).json({
          success: false,
          message: 'Quick capture task not found'
        });
      }

      // Promote to full task with additional details
      const updates = {
        ...req.body,
        status: 'pending',
        isQuickCapture: false // No longer a quick capture
      };

      const updatedTask = await Task.findByIdAndUpdate(
        req.params.id,
        updates,
        { new: true, runValidators: true }
      );

      res.json({
        success: true,
        message: 'Task promoted successfully',
        data: updatedTask
      });

    } catch (error) {
      console.error('Promote task error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error promoting task',
        error: process.env.NODE_ENV !== 'production' ? error.message : undefined
      });
    }
  }
);

export default router;