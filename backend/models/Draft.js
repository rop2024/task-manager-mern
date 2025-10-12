import mongoose from 'mongoose';

const draftSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Draft title is required'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [5000, 'Notes cannot be more than 5000 characters']
  },
  source: {
    type: String,
    enum: ['inbox', 'quick', 'taskform'],
    default: 'quick'
  },
  inboxRef: {
    type: mongoose.Schema.ObjectId,
    ref: 'InboxItem'
  },
  isPromoted: {
    type: Boolean,
    default: false,
    index: true
  },
  promotedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
draftSchema.index({ user: 1, createdAt: -1 });
draftSchema.index({ user: 1, source: 1 });
draftSchema.index({ user: 1, isPromoted: 1 });
draftSchema.index({ source: 1, createdAt: -1 });

// Pre-save middleware to update the updatedAt field
draftSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Set promotedAt when isPromoted is set to true
  if (this.isModified('isPromoted') && this.isPromoted && !this.promotedAt) {
    this.promotedAt = new Date();
  }
  
  next();
});

// Instance methods
draftSchema.methods.promote = async function(taskData = {}) {
  const Task = mongoose.model('Task');
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Check if already promoted
    if (this.isPromoted) {
      throw new Error('Draft has already been promoted');
    }
    
    // Create task from draft
    const task = new Task({
      user: this.user,
      title: this.title,
      description: this.notes || '',
      status: 'pending', // Start as pending, not draft
      inboxRef: this.inboxRef,
      draftRef: this._id, // Reference back to the draft
      ...taskData // Allow additional task data to be passed
    });
    
    await task.save({ session });
    
    // Mark draft as promoted
    this.isPromoted = true;
    this.promotedAt = new Date();
    await this.save({ session });
    
    await session.commitTransaction();
    return task;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// Static methods
draftSchema.statics.getDraftsByUser = async function(userId, options = {}) {
  const {
    source,
    isPromoted,
    limit = 50,
    page = 1
  } = options;

  const query = { user: userId };
  
  if (source) {
    query.source = source;
  }
  
  if (isPromoted !== undefined) {
    query.isPromoted = isPromoted;
  }

  const skip = (page - 1) * limit;

  const [drafts, total] = await Promise.all([
    this.find(query)
      .populate('inboxRef', 'title notes')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    this.countDocuments(query)
  ]);

  return {
    drafts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

draftSchema.statics.getDraftStats = async function(userId) {
  const stats = await this.aggregate([
    {
      $match: { user: new mongoose.Types.ObjectId(userId) }
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        promoted: { $sum: { $cond: ['$isPromoted', 1, 0] } },
        unpromoted: { $sum: { $cond: ['$isPromoted', 0, 1] } },
        bySource: {
          $push: {
            source: '$source',
            count: 1
          }
        }
      }
    }
  ]);

  if (stats.length === 0) {
    return {
      total: 0,
      promoted: 0,
      unpromoted: 0,
      bySource: {
        inbox: 0,
        quick: 0,
        taskform: 0
      }
    };
  }

  const result = stats[0];
  
  // Process bySource to get counts
  const sourceStats = result.bySource.reduce((acc, item) => {
    acc[item.source] = (acc[item.source] || 0) + 1;
    return acc;
  }, {});

  return {
    total: result.total,
    promoted: result.promoted,
    unpromoted: result.unpromoted,
    bySource: {
      inbox: sourceStats.inbox || 0,
      quick: sourceStats.quick || 0,
      taskform: sourceStats.taskform || 0
    }
  };
};

// Virtual for checking if draft can be promoted
draftSchema.virtual('canPromote').get(function() {
  return !this.isPromoted && this.title && this.title.trim().length > 0;
});

// Configure schema options
draftSchema.set('toJSON', { virtuals: true });
draftSchema.set('toObject', { virtuals: true });

const Draft = mongoose.model('Draft', draftSchema);
export default Draft;