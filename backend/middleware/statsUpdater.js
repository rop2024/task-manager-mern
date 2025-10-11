import Task from '../models/Task.js';
import Stats from '../models/Stats.js';

/**
 * Enhanced middleware to update user task statistics
 * Skips draft tasks from main counting, tracks quick captures separately
 */
export const updateStatsAfterTaskChange = async (req, res, next) => {
  // Use 'finish' event which fires when the response is complete
  res.on('finish', async () => {
    // Only update stats if the request was successful (status code 2xx)
    if (res.statusCode < 200 || res.statusCode >= 300) {
      return; // Only update stats on successful requests
    }

    try {
      const userId = req.user?.id;
      if (!userId) return;

      // Count only non-draft tasks for main statistics
      const totalTasks = await Task.countDocuments({
        createdBy: userId,
        status: { $ne: 'draft' }
      });

      const pendingTasks = await Task.countDocuments({
        createdBy: userId,
        status: 'pending'
      });

      const inProgressTasks = await Task.countDocuments({
        createdBy: userId,
        status: 'in-progress'
      });

      const completedTasks = await Task.countDocuments({
        createdBy: userId,
        status: 'completed'
      });

      // Count quick capture tasks separately (including drafts)
      const quickCaptureTasks = await Task.countDocuments({
        createdBy: userId,
        isQuickCapture: true
      });

      // Update stats using the Stats model's updateUserStats method
      await Stats.updateUserStats(userId, {
        totalTasks,
        pendingTasks,
        inProgressTasks,
        completedTasks,
        quickCaptureTasks
      });

    } catch (error) {
      console.error('Stats update error:', error);
      // Don't fail the main request if stats update fails
    }
  });

  next();
};

// Middleware to update stats after group operations
export const updateStatsAfterGroupChange = async (req, res, next) => {
  // Use 'finish' event which fires when the response is complete
  res.on('finish', () => {
    // Only update stats if the request was successful (status code 2xx)
    if (req.user && req.user.id && res.statusCode >= 200 && res.statusCode < 300) {
      Stats.updateUserStats(req.user.id).catch(error => {
        console.error('Error updating stats after group change:', error);
      });
    }
  });

  next();
};

/**
 * Helper function to manually update stats for a user
 * Useful for batch operations or migration
 */
export const updateUserStats = async (userId) => {
  try {
    const totalTasks = await Task.countDocuments({
      createdBy: userId,
      status: { $ne: 'draft' }
    });

    const pendingTasks = await Task.countDocuments({
      createdBy: userId,
      status: 'pending'
    });

    const inProgressTasks = await Task.countDocuments({
      createdBy: userId,
      status: 'in-progress'
    });

    const completedTasks = await Task.countDocuments({
      createdBy: userId,
      status: 'completed'
    });

    const quickCaptureTasks = await Task.countDocuments({
      createdBy: userId,
      isQuickCapture: true
    });

    // Update stats using the Stats model's updateUserStats method
    await Stats.updateUserStats(userId, {
      totalTasks,
      pendingTasks,
      inProgressTasks,
      completedTasks,
      quickCaptureTasks
    });

    return {
      totalTasks,
      pendingTasks,
      inProgressTasks,
      completedTasks,
      quickCaptureTasks
    };
  } catch (error) {
    console.error('Manual stats update error:', error);
    throw error;
  }
};

// Initialize stats for new users - wrapper for backward compatibility
export const initializeUserStats = async (userId) => {
  try {
    await updateUserStats(userId);
  } catch (error) {
    console.error('Error initializing user stats:', error);
  }
};

