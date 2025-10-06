import mongoose from 'mongoose';

const statsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  // Task counts
  totalTasks: {
    type: Number,
    default: 0
  },
  completedTasks: {
    type: Number,
    default: 0
  },
  pendingTasks: {
    type: Number,
    default: 0
  },
  inProgressTasks: {
    type: Number,
    default: 0
  },
  overdueTasks: {
    type: Number,
    default: 0
  },
  // Priority breakdown
  highPriorityTasks: {
    type: Number,
    default: 0
  },
  mediumPriorityTasks: {
    type: Number,
    default: 0
  },
  lowPriorityTasks: {
    type: Number,
    default: 0
  },
  // Group stats
  totalGroups: {
    type: Number,
    default: 0
  },
  // Productivity metrics
  completionRate: {
    type: Number,
    default: 0 // Percentage
  },
  averageCompletionTime: {
    type: Number,
    default: 0 // Hours
  },
  productivityScore: {
    type: Number,
    default: 0
  },
  // Streaks
  currentStreak: {
    type: Number,
    default: 0 // Days with task completion
  },
  longestStreak: {
    type: Number,
    default: 0
  },
  // Weekly/Monthly stats
  weeklyCompleted: {
    type: Number,
    default: 0
  },
  monthlyCompleted: {
    type: Number,
    default: 0
  },
  // Timestamps
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for better performance
statsSchema.index({ user: 1 });
statsSchema.index({ productivityScore: -1 });
statsSchema.index({ lastUpdated: -1 });

// Static method to calculate productivity score
statsSchema.statics.calculateProductivityScore = function(stats) {
  const {
    completedTasks,
    totalTasks,
    currentStreak,
    completionRate,
    overdueTasks
  } = stats;

  if (totalTasks === 0) return 0;

  // Base score from completion rate (0-50 points)
  const completionScore = (completionRate / 100) * 50;

  // Streak bonus (0-30 points)
  const streakScore = Math.min(currentStreak * 2, 30);

  // Overdue penalty (0-20 points deduction)
  const overduePenalty = Math.min(overdueTasks * 5, 20);

  // Activity bonus based on recent activity (0-20 points)
  const daysSinceLastActivity = Math.floor((new Date() - new Date(stats.lastActivity)) / (1000 * 60 * 60 * 24));
  const activityScore = Math.max(0, 20 - (daysSinceLastActivity * 2));

  return Math.max(0, completionScore + streakScore - overduePenalty + activityScore);
};

// Update stats when tasks change
statsSchema.statics.updateUserStats = async function(userId) {
  try {
    const Task = mongoose.model('Task');
    const Group = mongoose.model('Group');
    // Get task counts
    const taskCounts = await Task.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] } },
          highPriority: { $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] } },
          mediumPriority: { $sum: { $cond: [{ $eq: ['$priority', 'medium'] }, 1, 0] } },
          lowPriority: { $sum: { $cond: [{ $eq: ['$priority', 'low'] }, 1, 0] } }
        }
      }
    ]);

    // Get overdue tasks
    const overdueCount = await Task.countDocuments({
      user: userId,
      dueDate: { $lt: new Date() },
      status: { $ne: 'completed' }
    });

    // Get group count
    const groupCount = await Group.countDocuments({ user: userId });

    // Calculate weekly and monthly completed tasks
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const weeklyCompleted = await Task.countDocuments({
      user: userId,
      status: 'completed',
      updatedAt: { $gte: oneWeekAgo }
    });

    const monthlyCompleted = await Task.countDocuments({
      user: userId,
      status: 'completed',
      updatedAt: { $gte: oneMonthAgo }
    });

    // Calculate completion rate
    const counts = taskCounts[0] || { total: 0, completed: 0 };
    const completionRate = counts.total > 0 ? (counts.completed / counts.total) * 100 : 0;

    // Calculate streaks (simplified version)
    const completedTasks = await Task.find({
      user: userId,
      status: 'completed'
    }).sort({ updatedAt: -1 }).limit(10);

    let currentStreak = 0;
    let lastDate = null;

    for (const task of completedTasks) {
      const taskDate = task.updatedAt.toDateString();
      if (!lastDate) {
        lastDate = taskDate;
        currentStreak = 1;
        continue;
      }

      const prevDate = new Date(lastDate);
      prevDate.setDate(prevDate.getDate() - 1);

      if (taskDate === prevDate.toDateString()) {
        currentStreak++;
        lastDate = taskDate;
      } else {
        break;
      }
    }

    // Calculate average completion time (simplified)
    let averageCompletionTime = 0;
    const completedTasksWithTime = await Task.find({
      user: userId,
      status: 'completed',
      createdAt: { $exists: true },
      updatedAt: { $exists: true }
    }).limit(50);

    if (completedTasksWithTime.length > 0) {
      const totalTime = completedTasksWithTime.reduce((sum, task) => {
        const completionTime = task.updatedAt - task.createdAt;
        return sum + completionTime;
      }, 0);
      averageCompletionTime = totalTime / completedTasksWithTime.length / (1000 * 60 * 60); // Convert to hours
    }

    // Prepare stats data
    const statsData = {
      totalTasks: counts.total || 0,
      completedTasks: counts.completed || 0,
      pendingTasks: counts.pending || 0,
      inProgressTasks: counts.inProgress || 0,
      overdueTasks: overdueCount,
      highPriorityTasks: counts.highPriority || 0,
      mediumPriorityTasks: counts.mediumPriority || 0,
      lowPriorityTasks: counts.lowPriority || 0,
      totalGroups: groupCount,
      completionRate: Math.round(completionRate),
      averageCompletionTime: Math.round(averageCompletionTime * 100) / 100, // Round to 2 decimal places
      weeklyCompleted,
      monthlyCompleted,
      currentStreak,
      lastActivity: new Date()
    };

    // Update longest streak if current is higher
    const existingStats = await this.findOne({ user: userId });
    if (existingStats && currentStreak > existingStats.longestStreak) {
      statsData.longestStreak = currentStreak;
    } else if (!existingStats) {
      statsData.longestStreak = currentStreak;
    }

    // Calculate productivity score
    statsData.productivityScore = Math.round(this.calculateProductivityScore(statsData));

    // Update or create stats
    const stats = await this.findOneAndUpdate(
      { user: userId },
      { ...statsData, lastUpdated: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return stats;
  } catch (error) {
    console.error('Error updating user stats:', error);
    throw error;
  }
};

// Method to get user rank
statsSchema.statics.getUserRank = async function(userId) {
  try {
    const userStats = await this.findOne({ user: userId });
    
    if (!userStats) {
      return { rank: null, totalUsers: 0, percentile: 0 };
    }

    // Count users with higher productivity score
    const higherScoreCount = await this.countDocuments({
      productivityScore: { $gt: userStats.productivityScore }
    });

    const totalUsers = await this.countDocuments();
    const rank = higherScoreCount + 1;
    const percentile = totalUsers > 0 ? Math.round(((totalUsers - rank) / totalUsers) * 100) : 0;

    return { rank, totalUsers, percentile };
  } catch (error) {
    console.error('Error getting user rank:', error);
    throw error;
  }
};

// Method to get leaderboard
statsSchema.statics.getLeaderboard = async function(limit = 10) {
  try {
    const leaderboard = await this.find({})
      .populate('user', 'name email')
      .sort({ productivityScore: -1, completedTasks: -1, currentStreak: -1 })
      .limit(limit)
      .select('user productivityScore completedTasks totalTasks completionRate currentStreak weeklyCompleted');

    return leaderboard;
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    throw error;
  }
};

// Method to reset stats (for testing/debugging)
statsSchema.statics.resetUserStats = async function(userId) {
  try {
    await this.findOneAndDelete({ user: userId });
    return await this.updateUserStats(userId);
  } catch (error) {
    console.error('Error resetting user stats:', error);
    throw error;
  }
};

// Virtual for tasks completion percentage
statsSchema.virtual('completionPercentage').get(function() {
  return this.totalTasks > 0 ? (this.completedTasks / this.totalTasks) * 100 : 0;
});

// Virtual for productivity level
statsSchema.virtual('productivityLevel').get(function() {
  if (this.productivityScore >= 80) return 'excellent';
  if (this.productivityScore >= 60) return 'good';
  if (this.productivityScore >= 40) return 'average';
  return 'needs-improvement';
});

// Pre-save middleware to ensure productivity score is calculated
statsSchema.pre('save', function(next) {
  if (this.isModified()) {
    this.productivityScore = Math.round(this.constructor.calculateProductivityScore(this));
  }
  next();
});

// Ensure virtual fields are serialized
statsSchema.set('toJSON', { virtuals: true });
statsSchema.set('toObject', { virtuals: true });

const Stats = mongoose.models.Stats || mongoose.model('Stats', statsSchema);

export default Stats;
