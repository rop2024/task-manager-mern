import mongoose from 'mongoose';

// Define the Task schema
const taskSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [5000, 'Description cannot be more than 5000 characters']
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
  group: {
    type: mongoose.Schema.ObjectId,
    ref: 'Group'
  },
  // NEW: Reference to original inbox item
  inboxRef: {
    type: mongoose.Schema.ObjectId,
    ref: 'InboxItem'
  },
  tags: [{
    type: String,
    trim: true
  }],
  estimatedMinutes: {
    type: Number,
    min: 0
  },
  actualMinutes: {
    type: Number,
    min: 0
  },
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

// Virtual getters using ES6 syntax
taskSchema.virtual('isOverdue').get(() => {
  if (!this.dueAt || this.status === 'completed') return false;
  return this.dueAt < new Date();
});

taskSchema.virtual('daysUntilDue').get(() => {
  if (!this.dueAt) return null;
  const now = new Date();
  const due = new Date(this.dueAt);
  const diffTime = due - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

taskSchema.virtual('daysSinceCompletion').get(() => {
  if (!this.completedAt) return null;
  const now = new Date();
  const completed = new Date(this.completedAt);
  const diffTime = now - completed;
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
});

// Instance methods using ES6 syntax
Object.assign(taskSchema.methods, {
  isReminderDue() {
    if (!this.reminders?.length) return false;
    
    const now = new Date();
    return this.reminders.some(reminder => {
      const reminderTime = new Date(reminder);
      return reminderTime <= now && reminderTime > new Date(now - 5 * 60 * 1000); // Within last 5 minutes
    });
  },

  markAsCompleted() {
    this.status = 'completed';
    this.completedAt = new Date();
    // Clear any pending reminders
    this.reminders = this.reminders.filter(reminder => new Date(reminder) > new Date());
    return this.save();
  },

  revive() {
    this.status = 'pending';
    this.completedAt = undefined;
    return this.save();
  },

  toggleCompletion() {
    return this.status === 'completed' ? this.revive() : this.markAsCompleted();
  }
});

// Pre-save middleware using ES6 syntax
taskSchema.pre('save', async function(next) {
  // Set completedAt when task is marked completed
  if (this.isModified('status')) {
    if (this.status === 'completed' && !this.completedAt) {
      this.completedAt = new Date();
    } else if (this.status !== 'completed' && this.completedAt) {
      this.completedAt = undefined;
    }
  }
  
  // Auto-set startAt if only dueAt is provided
  if (this.dueAt && !this.startAt) {
    this.startAt = new Date();
  }
  
  // Backward compatibility: dueDate -> dueAt
  if (this.dueDate && !this.dueAt) {
    this.dueAt = this.dueDate;
  }
  
  // Handle recurrence for completed tasks
  if (this.isModified('status') && 
      this.status === 'completed' && 
      this.recurrence?.pattern !== 'none') {
    await this.handleRecurrence().catch(console.error);
  }
  
  next();
});

// Method to handle task recurrence using ES6 syntax
taskSchema.methods.handleRecurrence = async function() {
  if (!this.recurrence?.pattern || this.recurrence.pattern === 'none') return;

  const nextDate = new Date(this.startAt);
  const { interval = 1 } = this.recurrence;
  
  // Calculate next occurrence date
  const dateCalculators = {
    daily: () => nextDate.setDate(nextDate.getDate() + interval),
    weekly: () => nextDate.setDate(nextDate.getDate() + (7 * interval)),
    monthly: () => nextDate.setMonth(nextDate.getMonth() + interval),
    yearly: () => nextDate.setFullYear(nextDate.getFullYear() + interval)
  };

  dateCalculators[this.recurrence.pattern]?.();

  // Check recurrence end conditions
  const shouldStop = (this.recurrence.endDate && nextDate > this.recurrence.endDate) ||
                    (this.recurrence.count && this.recurrence.count <= 1);

  if (shouldStop) return;

  // Create next occurrence with ES6 object spread
  const Task = mongoose.model('Task');
  const nextTask = new Task({
    ...this.toObject(),
    _id: undefined,
    status: 'pending',
    startAt: nextDate,
    dueAt: this.dueAt && new Date(this.dueAt.getTime() + (nextDate - this.startAt)),
    reminders: this.reminders?.map(reminder => 
      new Date(reminder.getTime() + (nextDate - this.startAt))
    ),
    recurrence: {
      ...this.recurrence,
      count: this.recurrence.count > 1 ? this.recurrence.count - 1 : undefined
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
// Post-save and post-delete hooks using ES6 syntax
taskSchema.post('save', async function() {
  try {
    const Group = mongoose.model('Group');
    await Group.updateTaskCount(this.group);
  } catch (error) {
    console.error('Error updating group task count:', error);
  }
});

taskSchema.post('findOneAndDelete', async function(doc) {
  if (!doc) return;
  
  try {
    const Group = mongoose.model('Group');
    await Group.updateTaskCount(doc.group);
  } catch (error) {
    console.error('Error updating group task count after deletion:', error);
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

// Add static methods using ES6 syntax
Object.assign(taskSchema.statics, {
  async getTaskStats(userId, groupId = null) {
    const match = { 
      user: new mongoose.Types.ObjectId(userId),
      ...(groupId && { group: new mongoose.Types.ObjectId(groupId) })
    };

    const [stats, total] = await Promise.all([
      this.aggregate([
        { $match: match },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      this.countDocuments(match)
    ]);
    
    const defaultStats = {
      pending: 0,
      'in-progress': 0,
      completed: 0,
      total
    };

    return stats.reduce((acc, { _id, count }) => ({ ...acc, [_id]: count }), defaultStats);
  },

  async getCompletedTasks(userId, { group, daysAgo, limit = 50, page = 1 } = {}) {
    const query = { 
      user: userId, 
      status: 'completed',
      ...(group && { group }),
      ...(daysAgo && { 
        completedAt: { 
          $gte: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000) 
        } 
      })
    };

    const skip = (page - 1) * limit;

    const [tasks, total] = await Promise.all([
      this.find(query)
        .populate('group', 'name color icon')
        .sort({ completedAt: -1 })
        .skip(skip)
        .limit(limit),
      this.countDocuments(query)
    ]);

    return {
      tasks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  async bulkComplete(userId, taskIds) {
    return this.updateMany(
      {
        _id: { $in: taskIds },
        user: userId,
        status: { $ne: 'completed' }
      },
      {
        status: 'completed',
        completedAt: new Date(),
        $set: { reminders: [] }
      }
    );
  },

  async bulkRevive(userId, taskIds) {
    return this.updateMany(
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
  },

  async cleanupCompletedTasks(userId, daysOld = 30) {
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
    
    return this.deleteMany({
      user: userId,
      status: 'completed',
      completedAt: { $lt: cutoffDate }
    });
  },

  async getCalendarTasks(userId, startDate, endDate) {
    return this.find({
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
  },

  async getUpcomingReminders(userId, hours = 24) {
    const now = new Date();
    const reminderThreshold = new Date(now.getTime() + hours * 60 * 60 * 1000);
    
    return this.find({
      user: userId,
      status: { $ne: 'completed' },
      reminders: {
        $elemMatch: {
          $gte: now,
          $lte: reminderThreshold
        }
      }
    }).populate('group', 'name color');
  }
});

// Configure schema options
taskSchema.set('toJSON', { virtuals: true });
taskSchema.set('toObject', { virtuals: true });

// Export the model using ES6 export
export default mongoose.model('Task', taskSchema);
