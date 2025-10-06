import Task from '../models/Task.js';

// Check for due reminders and send notifications
const checkReminders = async () => {
  try {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    
    const tasksWithDueReminders = await Task.find({
      status: { $ne: 'completed' },
      reminders: {
        $elemMatch: {
          $gte: fiveMinutesAgo,
          $lte: now
        }
      }
    }).populate('user', 'email name').populate('group', 'name');

    console.log(`Found ${tasksWithDueReminders.length} tasks with due reminders`);

    // In a real application, you would:
    // 1. Send email notifications
    // 2. Send push notifications
    // 3. Send in-app notifications
    // For now, we'll just log them
    
    tasksWithDueReminders.forEach(task => {
      console.log(`Reminder for task: "${task.title}" - User: ${task.user.email}`);
      
      // Here you would integrate with your notification service
      // sendEmailReminder(task.user.email, task);
      // sendPushNotification(task.user._id, task);
    });

  } catch (error) {
    console.error('Error checking reminders:', error);
  }
};

// Schedule reminder checks (run every minute)
const startReminderScheduler = () => {
  setInterval(checkReminders, 60 * 1000); // Check every minute
  console.log('Reminder scheduler started');
};

// Middleware to validate reminder dates
const validateReminders = (req, res, next) => {
  if (req.body.reminders && Array.isArray(req.body.reminders)) {
    const invalidReminders = req.body.reminders.filter(reminder => {
      const reminderDate = new Date(reminder);
      return isNaN(reminderDate.getTime());
    });

    if (invalidReminders.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reminder dates provided'
      });
    }
  }
  next();
};

export {
  checkReminders,
  startReminderScheduler,
  validateReminders
};