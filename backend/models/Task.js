import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a task title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  // NEW: Enhanced date fields for calendar
  startAt: {
    type: Date,
    default: Date.now
  },
  dueAt: {
    type: Date
  },
  // Legacy field for backward compatibility
  dueDate: {
    type: Date
  },
  // NEW: Track when task was completed
  completedAt: {
    type: Date
  },
  // Reminders system
  reminders: [{
    type: Date
  }],
  isAllDay: {
    type: Boolean,
    default: false
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  group: {
    type: mongoose.Schema.ObjectId,
    ref: 'Group',
    required: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  isImportant: {
    type: Boolean,
    default: false
  },
  // NEW: Recurrence support
  recurrence: {
    pattern: {
      type: String,
      enum: ['none', 'daily', 'weekly', 'monthly', 'yearly'],
      default: 'none'
    },
    interval: {
      type: Number,
      default: 1
    },
    endDate: Date,
    count: Number
  }
}, {
  timestamps: true
});

// Update indexes to include date fields
taskSchema.index({ user: 1, createdAt: -1 });
taskSchema.index({ user: 1, status: 1 });
taskSchema.index({ user: 1, dueDate: 1 });
taskSchema.index({ user: 1, startAt: 1 });
taskSchema.index({ user: 1, dueAt: 1 });
taskSchema.index({ user: 1, 'reminders': 1 });
taskSchema.index({ user: 1, status: 1, dueAt: 1 });
// Index for completed tasks queries
taskSchema.index({ user: 1, status: 1, completedAt: -1 });
taskSchema.index({ user: 1, completedAt: -1 });

// Virtual for overdue status
taskSchema.virtual('isOverdue').get(function() {
  if (!this.dueAt || this.status === 'completed') return false;
  return this.dueAt < new Date();
});

// Virtual for days until due
taskSchema.virtual('daysUntilDue').get(function() {
  if (!this.dueAt) return null;
  const now = new Date();
  const due = new Date(this.dueAt);
  const diffTime = due - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for days since completion
taskSchema.virtual('daysSinceCompletion').get(function() {
  if (!this.completedAt) return null;
  const now = new Date();
  const completed = new Date(this.completedAt);
  const diffTime = now - completed;
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
});

// Method to check if reminder is due
taskSchema.methods.isReminderDue = function() {
  if (!this.reminders || this.reminders.length === 0) return false;
  
  const now = new Date();
  return this.reminders.some(reminder => {
    const reminderTime = new Date(reminder);
    return reminderTime <= now && reminderTime > new Date(now - 5 * 60 * 1000); // Within last 5 minutes
  });
};

// Method to mark task as completed
taskSchema.methods.markAsCompleted = function() {
  this.status = 'completed';
  this.completedAt = new Date();
  // Clear any pending reminders
  this.reminders = this.reminders.filter(reminder => new Date(reminder) > new Date());
  return this.save();
};

// Method to revive task (mark as pending)
taskSchema.methods.revive = function() {
  this.status = 'pending';
  this.completedAt = undefined;
  return this.save();
};

// Method to toggle completion status
taskSchema.methods.toggleCompletion = function() {
  if (this.status === 'completed') {
    return this.revive();
  } else {
    return this.markAsCompleted();
  }
};

// Pre-save middleware to handle completion and dueAt updates
taskSchema.pre('save', function(next) {
  // Set completedAt when task is marked completed
  if (this.isModified('status') && this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  
  // Clear completedAt when task is revived
  if (this.isModified('status') && this.status !== 'completed' && this.completedAt) {
    this.completedAt = undefined;
  }
  
  // If dueAt is set but startAt isn't, set startAt to now
  if (this.dueAt && !this.startAt) {
    this.startAt = new Date();
  }
  
  // For backward compatibility
  if (this.dueDate && !this.dueAt) {
    this.dueAt = this.dueDate;
  }
  
  // If task is completed and has recurrence, create next occurrence
  if (this.isModified('status') && this.status === 'completed' && this.recurrence?.pattern !== 'none') {
    this.handleRecurrence().catch(console.error);
  }
  
  next();
});

// Method to handle task recurrence
taskSchema.methods.handleRecurrence = async function() {
  if (!this.recurrence || this.recurrence.pattern === 'none') return;

  const nextDate = new Date(this.startAt);
  
  switch (this.recurrence.pattern) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + this.recurrence.interval);
      break;
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + (7 * this.recurrence.interval));
      break;
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + this.recurrence.interval);
      break;
    case 'yearly':
      nextDate.setFullYear(nextDate.getFullYear() + this.recurrence.interval);
      break;
  }

  // Check if we should stop recurring
  const shouldStop = (this.recurrence.endDate && nextDate > this.recurrence.endDate) ||
                    (this.recurrence.count && this.recurrence.count <= 1);

  if (shouldStop) return;

  // Create next occurrence
  const Task = mongoose.model('Task');
  const nextTask = new Task({
    ...this.toObject(),
    _id: undefined,
    status: 'pending',
    startAt: nextDate,
    dueAt: this.dueAt ? new Date(this.dueAt.getTime() + (nextDate - this.startAt)) : undefined,
    reminders: this.reminders?.map(reminder => new Date(reminder.getTime() + (nextDate - this.startAt))),
    recurrence: {
      ...this.recurrence,
      count: this.recurrence.count ? this.recurrence.count - 1 : undefined
    }
  });

  await nextTask.save();
};

// Static method to get task stats
taskSchema.statics.getTaskStats = async function(userId) {
  const stats = await this.aggregate([
    {
      $match: { user: new mongoose.Types.ObjectId(userId) }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const total = await this.countDocuments({ user: userId });
  
  const defaultStats = {
    pending: 0,
    'in-progress': 0,
    completed: 0,
    total: total
  };

  stats.forEach(stat => {
    defaultStats[stat._id] = stat.count;
  });

  return defaultStats;
};
// Update task count in group when task is saved
taskSchema.post('save', async function() {
  try {
    const Group = mongoose.model('Group');
    await Group.updateTaskCount(this.group);
  } catch (error) {
    console.error('Error updating group task count:', error);
  }
});

// Update task count in group when task is removed
taskSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    try {
      const Group = mongoose.model('Group');
      await Group.updateTaskCount(doc.group);
    } catch (error) {
      console.error('Error updating group task count after deletion:', error);
    }
  }
});

// Static method to get task stats by group
taskSchema.statics.getTaskStats = async function(userId, groupId = null) {
  const match = { user: new mongoose.Types.ObjectId(userId) };
  if (groupId) {
    match.group = new mongoose.Types.ObjectId(groupId);
  }

  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const total = await this.countDocuments(match);
  
  const defaultStats = {
    pending: 0,
    'in-progress': 0,
    completed: 0,
    total: total
  };

  stats.forEach(stat => {
    defaultStats[stat._id] = stat.count;
  });

  return defaultStats;
};

// Static method to get completed tasks
taskSchema.statics.getCompletedTasks = async function(userId, options = {}) {
  const {
    group,
    daysAgo,
    limit = 50,
    page = 1
  } = options;

  const query = { 
    user: userId, 
    status: 'completed' 
  };

  if (group) {
    query.group = group;
  }

  if (daysAgo) {
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - daysAgo);
    query.completedAt = { $gte: dateThreshold };
  }

  const skip = (page - 1) * limit;

  const tasks = await this.find(query)
    .populate('group', 'name color icon')
    .sort({ completedAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await this.countDocuments(query);

  return {
    tasks,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

// Static method to bulk complete tasks
taskSchema.statics.bulkComplete = async function(userId, taskIds) {
  const result = await this.updateMany(
    {
      _id: { $in: taskIds },
      user: userId,
      status: { $ne: 'completed' }
    },
    {
      status: 'completed',
      completedAt: new Date(),
      $set: { reminders: [] } // Clear reminders for completed tasks
    }
  );

  return result;
};

// Static method to bulk revive tasks
taskSchema.statics.bulkRevive = async function(userId, taskIds) {
  const result = await this.updateMany(
    {
      _id: { $in: taskIds },
      user: userId,
      status: 'completed'
    },
    {
      status: 'pending',
      $unset: { completedAt: 1 }
    }
  );

  return result;
};

// Static method to cleanup old completed tasks
taskSchema.statics.cleanupCompletedTasks = async function(userId, daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const result = await this.deleteMany({
    user: userId,
    status: 'completed',
    completedAt: { $lt: cutoffDate }
  });

  return result;
};

// Static method to get tasks for calendar view
taskSchema.statics.getCalendarTasks = async function(userId, startDate, endDate) {
  return await this.find({
    user: userId,
    $or: [
      { startAt: { $gte: startDate, $lte: endDate } },
      { dueAt: { $gte: startDate, $lte: endDate } },
      { 
        $and: [
          { startAt: { $lte: startDate } },
          { dueAt: { $gte: endDate } }
        ]
      }
    ]
  }).populate('group', 'name color icon');
};

// Static method to get upcoming reminders
taskSchema.statics.getUpcomingReminders = async function(userId, hours = 24) {
  const now = new Date();
  const reminderThreshold = new Date(now.getTime() + hours * 60 * 60 * 1000);
  
  return await this.find({
    user: userId,
    status: { $ne: 'completed' },
    reminders: {
      $elemMatch: {
        $gte: now,
        $lte: reminderThreshold
      }
    }
  }).populate('group', 'name color');
};

// Ensure virtual fields are serialized
taskSchema.set('toJSON', { virtuals: true });
taskSchema.set('toObject', { virtuals: true });

export default mongoose.model('Task', taskSchema);
