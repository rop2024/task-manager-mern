import express from 'express';
import { body, validationResult, query } from 'express-validator';
import Task from '../models/Task.js';
import Group from '../models/Group.js';
import { protect } from '../middleware/auth.js';
import { updateStatsAfterTaskChange } from '../middleware/statsUpdater.js';

const router = express.Router();

// Input validation rules
const createTaskValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot be more than 500 characters'),
  body('status')
    .optional()
    .isIn(['pending', 'in-progress', 'completed'])
    .withMessage('Status must be pending, in-progress, or completed'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be low, medium, or high'),
  body('startAt')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  body('dueAt')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid date'),
  body('dueDate') // Legacy support
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid date'),
  body('isAllDay')
    .optional()
    .isBoolean()
    .withMessage('isAllDay must be a boolean'),
  body('reminders')
    .optional()
    .isArray()
    .withMessage('Reminders must be an array'),
  body('reminders.*')
    .optional()
    .isISO8601()
    .withMessage('Each reminder must be a valid date'),
  body('group')
    .notEmpty()
    .withMessage('Group is required')
    .isMongoId()
    .withMessage('Group must be a valid ID'),
  body('recurrence.pattern')
    .optional()
    .isIn(['none', 'daily', 'weekly', 'monthly', 'yearly'])
    .withMessage('Recurrence pattern must be none, daily, weekly, monthly, or yearly'),
  body('recurrence.interval')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Recurrence interval must be a positive integer'),
  body('recurrence.endDate')
    .optional()
    .isISO8601()
    .withMessage('Recurrence end date must be a valid date'),
  body('recurrence.count')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Recurrence count must be a positive integer')
];

const updateTaskValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot be more than 500 characters'),
  body('status')
    .optional()
    .isIn(['pending', 'in-progress', 'completed'])
    .withMessage('Status must be pending, in-progress, or completed'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be low, medium, or high'),
  body('startAt')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  body('dueAt')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid date'),
  body('dueDate') // Legacy support
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid date'),
  body('isAllDay')
    .optional()
    .isBoolean()
    .withMessage('isAllDay must be a boolean'),
  body('reminders')
    .optional()
    .isArray()
    .withMessage('Reminders must be an array'),
  body('reminders.*')
    .optional()
    .isISO8601()
    .withMessage('Each reminder must be a valid date'),
  body('group')
    .optional()
    .isMongoId()
    .withMessage('Group must be a valid ID'),
  body('recurrence.pattern')
    .optional()
    .isIn(['none', 'daily', 'weekly', 'monthly', 'yearly'])
    .withMessage('Recurrence pattern must be none, daily, weekly, monthly, or yearly'),
  body('recurrence.interval')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Recurrence interval must be a positive integer'),
  body('recurrence.endDate')
    .optional()
    .isISO8601()
    .withMessage('Recurrence end date must be a valid date'),
  body('recurrence.count')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Recurrence count must be a positive integer')
];

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

// ========================= ROUTES =========================

// @desc    Create new task
// @route   POST /api/tasks
// @access  Private
router.post(
  '/',
  protect,
  createTaskValidation,
  updateStatsAfterTaskChange,   // ✅ Added stats middleware
  async (req, res) => {
    try {
      const validationError = handleValidationErrors(req, res);
      if (validationError) return validationError;

      // Check if group is provided
      if (!req.body.group) {
        return res.status(400).json({
          success: false,
          message: 'Group is required'
        });
      }

      // Verify the group exists and belongs to the user
      const group = await Group.findOne({
        _id: req.body.group,
        user: req.user.id
      });

      if (!group) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or inaccessible group'
        });
      }

      const taskData = { ...req.body, user: req.user.id };

      const task = await Task.create(taskData);
      await task.populate('group', 'name color');

      res.status(201).json({
        success: true,
        message: 'Task created successfully',
        data: task
      });
    } catch (error) {
      console.error('Create task error:', error);
      
      // Return more specific error messages
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: Object.keys(error.errors).map(key => ({
            field: key,
            message: error.errors[key].message
          }))
        });
      } else if (error.name === 'CastError' && error.path === 'group') {
        return res.status(400).json({
          success: false,
          message: 'Invalid group ID format'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Server error while creating task',
        details: process.env.NODE_ENV !== 'production' ? error.message : undefined
      });
    }
  }
);

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
router.put(
  '/:id',
  protect,
  updateTaskValidation,
  updateStatsAfterTaskChange,   // ✅ Added stats middleware
  async (req, res) => {
    try {
      const validationError = handleValidationErrors(req, res);
      if (validationError) return validationError;

      if (req.body.group) {
        const group = await Group.findOne({
          _id: req.body.group,
          user: req.user.id
        });

        if (!group) {
          return res.status(400).json({
            success: false,
            message: 'Invalid group'
          });
        }
      }

      const updatedTask = await Task.findOneAndUpdate(
        { _id: req.params.id, user: req.user.id },
        req.body,
        { new: true, runValidators: true }
      ).populate('group', 'name color');

      if (!updatedTask) {
        return res.status(404).json({
          success: false,
          message: 'Task not found'
        });
      }

      res.json({
        success: true,
        message: 'Task updated successfully',
        data: updatedTask
      });
    } catch (error) {
      console.error('Update task error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while updating task'
      });
    }
  }
);

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
router.delete(
  '/:id',
  protect,
  updateStatsAfterTaskChange,   // ✅ Added stats middleware
  async (req, res) => {
    try {
      const task = await Task.findOneAndDelete({
        _id: req.params.id,
        user: req.user.id
      });

      if (!task) {
        return res.status(404).json({
          success: false,
          message: 'Task not found'
        });
      }

      res.json({
        success: true,
        message: 'Task deleted successfully',
        data: {}
      });
    } catch (error) {
      console.error('Delete task error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while deleting task'
      });
    }
  }
);

// @desc    Bulk update tasks
// @route   PATCH /api/tasks/bulk
// @access  Private
router.patch(
  '/bulk',
  protect,
  updateStatsAfterTaskChange,   // ✅ Added stats middleware
  async (req, res) => {
    try {
      const validationError = handleValidationErrors(req, res);
      if (validationError) return validationError;

      const { taskIds, updates } = req.body;

      if (updates.group) {
        const group = await Group.findOne({
          _id: updates.group,
          user: req.user.id
        });

        if (!group) {
          return res.status(400).json({
            success: false,
            message: 'Invalid group'
          });
        }
      }

      const result = await Task.updateMany(
        { _id: { $in: taskIds }, user: req.user.id },
        updates,
        { runValidators: true }
      );

      res.json({
        success: true,
        message: `${result.modifiedCount} tasks updated successfully`,
        data: { modifiedCount: result.modifiedCount }
      });
    } catch (error) {
      console.error('Bulk update error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while bulk updating tasks'
      });
    }
  }
);

// @desc    Get task statistics
// @route   GET /api/tasks/stats
// @access  Private
router.get('/stats', protect, async (req, res) => {
  try {
    const stats = await Task.getTaskStats(req.user.id);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting task stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching task statistics'
    });
  }
});

// @desc    Get all tasks or filter by query params
// @route   GET /api/tasks
// @access  Private
router.get('/', protect, [
  query('includeCompleted')
    .optional()
    .isBoolean()
    .withMessage('includeCompleted must be a boolean'),
  query('status')
    .optional()
    .isIn(['pending', 'in-progress', 'completed', 'all'])
    .withMessage('Status must be pending, in-progress, completed, or all')
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

    const { 
      status, 
      priority, 
      group, 
      search,
      includeCompleted = false,
      page = 1, 
      limit = 50, 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = req.query;
    
    // Build filter object
    const filter = { user: req.user.id };
    
    // Handle status filtering
    if (status && status !== 'all') {
      filter.status = status;
    } else if (!includeCompleted) {
      // Default: exclude completed tasks unless explicitly included
      filter.status = { $ne: 'completed' };
    }
    
    if (priority) filter.priority = priority;
    if (group) filter.group = group;
    
    // Search in title or description
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Determine sort order
    let sort = {};
    sort[sortBy || 'createdAt'] = sortOrder === 'asc' ? 1 : -1;
    
    // Custom sort configurations
    if (sortBy === 'priority') sort = { priority: 1, createdAt: -1 };
    else if (sortBy === 'dueDate' || sortBy === 'dueAt') sort = { dueAt: 1, createdAt: -1 };
    else if (sortBy === 'status') sort = { status: 1, createdAt: -1 };
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Execute query with pagination
    const tasks = await Task.find(filter)
      .populate('group', 'name color icon')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count for pagination
    const totalTasks = await Task.countDocuments(filter);
    
    res.json({
      success: true,
      count: tasks.length,
      total: totalTasks,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalTasks / limit)
      },
      data: tasks
    });
  } catch (error) {
    console.error('Error getting tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching tasks'
    });
  }
});
  

// @desc    Get task by ID
// @route   GET /api/tasks/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user.id
    }).populate('group', 'name color icon');
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    
    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('Error getting task by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching task'
    });
  }
});

// @desc    Get tasks for calendar view
// @route   GET /api/tasks/calendar
// @access  Private
router.get('/calendar', protect, async (req, res) => {
  try {
    const { start, end } = req.query;
    
    if (!start || !end) {
      return res.status(400).json({
        success: false,
        message: 'Start and end dates are required'
      });
    }
    
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
    }
    
    const tasks = await Task.getCalendarTasks(req.user.id, startDate, endDate);
    
    res.json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    console.error('Error getting calendar tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching calendar tasks'
    });
  }
});

// @desc    Get upcoming reminders
// @route   GET /api/tasks/reminders
// @access  Private
router.get('/reminders', protect, async (req, res) => {
  try {
    const { hours = 24 } = req.query;
    
    const reminders = await Task.getUpcomingReminders(req.user.id, parseInt(hours));
    
    res.json({
      success: true,
      count: reminders.length,
      data: reminders
    });
  } catch (error) {
    console.error('Error getting reminders:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching reminders'
    });
  }
});



export default router;
