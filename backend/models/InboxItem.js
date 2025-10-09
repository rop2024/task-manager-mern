import mongoose from 'mongoose';

// Schema field definitions
const schemaFields = {
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Inbox item title is required'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot be more than 1000 characters']
  },
  isPromoted: {
    type: Boolean,
    default: false
  },
  promotedAt: {
    type: Date
  }
};

// Schema options
const schemaOptions = {
  timestamps: true,
  versionKey: false // Disable the __v field
};

// Create the schema
const inboxItemSchema = new mongoose.Schema(schemaFields, schemaOptions);

// Indexes for better query performance
inboxItemSchema.index({ user: 1, createdAt: -1 });
inboxItemSchema.index({ user: 1, isPromoted: 1 });
inboxItemSchema.index({ user: 1, updatedAt: -1 });

// Utility function for date calculations
const calculateDays = (startDate) => {
  const now = new Date();
  const start = new Date(startDate);
  const diffTime = now - start;
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

// Virtual for days in inbox
inboxItemSchema.virtual('daysInInbox').get(function() {
  return calculateDays(this.createdAt);
});

// Instance methods using ES6 syntax
Object.assign(inboxItemSchema.methods, {
  async markAsPromoted() {
    Object.assign(this, {
      isPromoted: true,
      promotedAt: new Date()
    });
    return this.save();
  }
});

// Static methods using ES6 syntax
Object.assign(inboxItemSchema.statics, {
  async getInboxStats(userId) {
    const [total, unpromoted, promoted] = await Promise.all([
      this.countDocuments({ user: userId }),
      this.countDocuments({ user: userId, isPromoted: false }),
      this.countDocuments({ user: userId, isPromoted: true })
    ]);

    return {
      total,
      unpromoted,
      promoted,
      promotionRate: total > 0 ? (promoted / total) * 100 : 0
    };
  }
});

// Schema configuration
inboxItemSchema.set('toJSON', { virtuals: true });
inboxItemSchema.set('toObject', { virtuals: true });

// Pre-save middleware
inboxItemSchema.pre('save', function(next) {
  // Any pre-save validation or modifications can go here
  next();
});

// Create and export the model
export default mongoose.model('InboxItem', inboxItemSchema);