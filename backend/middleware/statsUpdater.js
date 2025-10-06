import Stats from '../models/Stats.js';

// Middleware to update stats after task operations
export const updateStatsAfterTaskChange = async (req, res, next) => {
  // Use 'finish' event which fires when the response is complete
  res.on('finish', () => {
    // Only update stats if the request was successful (status code 2xx)
    if (req.user && req.user.id && res.statusCode >= 200 && res.statusCode < 300) {
      Stats.updateUserStats(req.user.id).catch(error => {
        console.error('Error updating stats after task change:', error);
      });
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

// Initialize stats for new users
export const initializeUserStats = async (userId) => {
  try {
    await Stats.updateUserStats(userId);
  } catch (error) {
    console.error('Error initializing user stats:', error);
  }
};

