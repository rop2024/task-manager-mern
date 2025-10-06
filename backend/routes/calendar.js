import express from 'express';
import { body, validationResult, query } from 'express-validator';
import Task from '../models/Task.js';
import { protect } from '../middleware/auth.js';
import { validateReminders } from '../middleware/reminders.js';
const router = express.Router();

// @desc    Get tasks for calendar view
// @route   GET /api/calendar/tasks
// @access  Private
router.get('/tasks', protect, [
  query('start')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO date'),
  query('end')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO date'),
  query('view')
    .optional()
    .isIn(['month', 'week', 'day', 'agenda'])
    .withMessage('View must be month, week, day, or agenda')
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

    const { start, end, view = 'month' } = req.query;
    
    // Default date range based on view
    let startDate, endDate;
    
    if (start && end) {
      startDate = new Date(start);
      endDate = new Date(end);
    } else {
      const now = new Date();
      switch (view) {
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          break;
        case 'week':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - now.getDay());
          endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 6);
          break;
        case 'day':
          startDate = new Date(now);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(now);
          endDate.setHours(23, 59, 59, 999);
          break;
        default:
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 30);
          endDate = new Date(now);
          endDate.setDate(now.getDate() + 30);
      }
    }

    const tasks = await Task.getCalendarTasks(req.user.id, startDate, endDate);

    // Format tasks for calendar
    const calendarTasks = tasks.map(task => ({
      id: task._id,
      title: task.title,
      start: new Date(task.startAt),
      end: task.dueAt ? new Date(task.dueAt) : new Date(task.startAt),
      allDay: task.isAllDay,
      resource: {
        taskId: task._id,
        status: task.status,
        priority: task.priority,
        group: task.group,
        description: task.description,
        isImportant: task.isImportant,
        reminders: task.reminders
      },
      color: task.group?.color || '#3B82F6',
      textColor: getContrastColor(task.group?.color || '#3B82F6')
    }));

    res.json({
      success: true,
      data: {
        tasks: calendarTasks,
        dateRange: {
          start: startDate,
          end: endDate
        }
      }
    });
  } catch (error) {
    console.error('Get calendar tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching calendar tasks'
    });
  }
});

// @desc    Get upcoming reminders
// @route   GET /api/calendar/reminders
// @access  Private
router.get('/reminders', protect, [
  query('hours')
    .optional()
    .isInt({ min: 1, max: 168 }) // Max 1 week
    .withMessage('Hours must be between 1 and 168')
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

    const hours = parseInt(req.query.hours) || 24;
    const reminders = await Task.getUpcomingReminders(req.user.id, hours);

    // Format reminders for frontend
    const formattedReminders = reminders.flatMap(task => 
      task.reminders
        .filter(reminder => {
          const reminderTime = new Date(reminder);
          const now = new Date();
          const threshold = new Date(now.getTime() + hours * 60 * 60 * 1000);
          return reminderTime >= now && reminderTime <= threshold;
        })
        .map(reminder => ({
          id: `${task._id}-${reminder.getTime()}`,
          taskId: task._id,
          title: task.title,
          reminderTime: new Date(reminder),
          task: {
            title: task.title,
            group: task.group,
            priority: task.priority,
            status: task.status
          }
        }))
    ).sort((a, b) => a.reminderTime - b.reminderTime);

    res.json({
      success: true,
      data: formattedReminders
    });
  } catch (error) {
    console.error('Get reminders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching reminders'
    });
  }
});

// @desc    Update task dates (for drag & drop in calendar)
// @route   PUT /api/calendar/tasks/:id/dates
// @access  Private
router.put('/tasks/:id/dates', protect, [
  body('startAt')
    .isISO8601()
    .withMessage('Start date must be a valid ISO date'),
  body('dueAt')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid ISO date'),
  body('isAllDay')
    .optional()
    .isBoolean()
    .withMessage('isAllDay must be a boolean')
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

    const { startAt, dueAt, isAllDay } = req.body;

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

    // Update dates
    task.startAt = new Date(startAt);
    if (dueAt) {
      task.dueAt = new Date(dueAt);
    }
    if (isAllDay !== undefined) {
      task.isAllDay = isAllDay;
    }

    await task.save();

    res.json({
      success: true,
      message: 'Task dates updated successfully',
      data: task
    });
  } catch (error) {
    console.error('Update task dates error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating task dates'
    });
  }
});

// @desc    Add reminder to task
// @route   POST /api/calendar/tasks/:id/reminders
// @access  Private
router.post('/tasks/:id/reminders', protect, validateReminders, [
  body('reminderTime')
    .isISO8601()
    .withMessage('Reminder time must be a valid ISO date')
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

    const { reminderTime } = req.body;

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

    // Add reminder if not already exists
    const reminderDate = new Date(reminderTime);
    const existingReminder = task.reminders.find(r => 
      r.getTime() === reminderDate.getTime()
    );

    if (!existingReminder) {
      task.reminders.push(reminderDate);
      task.reminders.sort((a, b) => a - b); // Sort chronologically
      await task.save();
    }

    res.json({
      success: true,
      message: 'Reminder added successfully',
      data: {
        reminders: task.reminders
      }
    });
  } catch (error) {
    console.error('Add reminder error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding reminder'
    });
  }
});

// @desc    Remove reminder from task
// @route   DELETE /api/calendar/tasks/:id/reminders/:reminderIndex
// @access  Private
router.delete('/tasks/:id/reminders/:reminderIndex', protect, async (req, res) => {
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

    const reminderIndex = parseInt(req.params.reminderIndex);
    
    if (reminderIndex < 0 || reminderIndex >= task.reminders.length) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reminder index'
      });
    }

    task.reminders.splice(reminderIndex, 1);
    await task.save();

    res.json({
      success: true,
      message: 'Reminder removed successfully',
      data: {
        reminders: task.reminders
      }
    });
  } catch (error) {
    console.error('Remove reminder error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while removing reminder'
    });
  }
});

// Helper function to get contrast color for text
function getContrastColor(hexcolor) {
  hexcolor = hexcolor.replace("#", "");
  const r = parseInt(hexcolor.substr(0, 2), 16);
  const g = parseInt(hexcolor.substr(2, 2), 16);
  const b = parseInt(hexcolor.substr(4, 2), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? '#000000' : '#FFFFFF';
}

export default router;