import mongoose from 'mongoose';

// Retry configuration for robust operations
const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  BASE_DELAY: 500, // ms
  MAX_DELAY: 2000, // ms
  JITTER: 0.2 // 20% random jitter
};

/**
 * Calculate delay with exponential backoff and jitter
 */
const calculateDelay = (attempt, baseDelay = RETRY_CONFIG.BASE_DELAY) => {
  const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
  const jitter = exponentialDelay * RETRY_CONFIG.JITTER * Math.random();
  return Math.min(exponentialDelay + jitter, RETRY_CONFIG.MAX_DELAY);
};

/**
 * Simulate random failures for testing
 */
const shouldSimulateFailure = () => {
  if (process.env.NODE_ENV === 'development' && process.env.SIMULATE_FAILURES === 'true') {
    // 30% chance of failure in development when enabled
    return Math.random() < 0.3;
  }
  return false;
};

/**
 * Simulate random delay for testing
 */
const simulateDelay = async (min = 500, max = 2000) => {
  if (process.env.NODE_ENV === 'development' && process.env.SIMULATE_DELAYS === 'true') {
    const delay = Math.random() * (max - min) + min;
    console.log(`🔧 SIMULATED DELAY: ${Math.round(delay)}ms`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
};

// Schema field definitions
const schemaFields = {
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot be more than 1000 characters']
  },
  content: {
    type: String,
    trim: true,
    maxlength: [5000, 'Content cannot exceed 5000 characters']
  },
  isPromoted: {
    type: Boolean,
    default: false
  },
  promotedAt: {
    type: Date
  },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },
  deletedAt: {
    type: Date
  },
  deletedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
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
inboxItemSchema.index({ userId: 1, createdAt: -1 });
inboxItemSchema.index({ userId: 1, isDeleted: 1, createdAt: -1 });

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
    const userQuery = {
      $or: [
        { user: userId },
        { userId: userId }
      ]
    };
    
    const [total, unpromoted, promoted] = await Promise.all([
      this.countDocuments({ ...userQuery, isDeleted: false }),
      this.countDocuments({ ...userQuery, isPromoted: false, isDeleted: false }),
      this.countDocuments({ ...userQuery, isPromoted: true, isDeleted: false })
    ]);

    return {
      total,
      unpromoted,
      promoted,
      promotionRate: total > 0 ? (promoted / total) * 100 : 0
    };
  },

  /**
   * Safely delete an inbox item with enhanced retry logic and exponential backoff
   * @param {string} itemId - The ID of the inbox item to delete
   * @param {string} userId - The ID of the user owning the item
   * @param {number} maxRetries - Maximum number of retry attempts (default: from RETRY_CONFIG)
   * @param {number} retryDelay - Base delay between retries in milliseconds (default: from RETRY_CONFIG)
   * @returns {Promise<Object>} Result object with success status and message
   */
  async safeDelete(itemId, userId, maxRetries = RETRY_CONFIG.MAX_RETRIES, retryDelay = RETRY_CONFIG.BASE_DELAY) {
    let lastError = null;
    const operationId = `delete_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`🔄 Starting safeDelete operation`, {
      operationId,
      itemId,
      userId,
      maxRetries,
      retryDelay,
      timestamp: new Date().toISOString()
    });
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Simulate random delay for testing
        await simulateDelay(300, 1200);
        
        // Simulate random failure for testing
        if (shouldSimulateFailure() && attempt < maxRetries) {
          throw new Error(`SIMULATED_FAILURE: Random database timeout on attempt ${attempt}`);
        }

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(itemId)) {
          throw new Error('Invalid inbox item ID format');
        }

        const session = await mongoose.startSession();
        
        try {
          session.startTransaction();
          
          console.log(`🔍 Attempting to delete item`, {
            operationId,
            attempt,
            totalAttempts: maxRetries,
            itemId,
            userId
          });

          const result = await this.findOneAndUpdate(
            { 
              _id: itemId, 
              $or: [
                { user: userId },
                { userId: userId }
              ],
              isDeleted: false
            },
            { 
              $set: { 
                isDeleted: true,
                deletedAt: new Date(),
                deletedBy: userId
              }
            },
            { 
              new: true,
              session: session,
              runValidators: true
            }
          );

          if (!result) {
            throw new Error('Inbox item not found, already deleted, or access denied');
          }

          await session.commitTransaction();
          
          console.log(`✅ Successfully deleted inbox item`, {
            operationId,
            itemId,
            userId,
            attempt,
            deletedAt: result.deletedAt
          });

          return {
            success: true,
            message: 'Inbox item deleted successfully',
            deletedItem: result,
            attempts: attempt,
            operationId
          };
          
        } catch (transactionError) {
          await session.abortTransaction();
          throw transactionError;
        } finally {
          await session.endSession();
        }
        
      } catch (error) {
        lastError = error;
        
        const logData = {
          operationId,
          error: error.message,
          stack: error.stack,
          userId,
          attempt,
          maxRetries,
          itemId,
          timestamp: new Date().toISOString()
        };

        // Different log levels based on error type
        if (error.message.includes('not found') || error.message.includes('Invalid inbox item ID')) {
          console.warn(`⚠️ Non-retryable error in safeDelete:`, logData);
          break; // Don't retry for these errors
        } else {
          console.error(`❌ Retryable error in safeDelete:`, logData);
        }
        
        // Don't delay on the last attempt
        if (attempt < maxRetries) {
          const delay = calculateDelay(attempt, retryDelay);
          console.log(`⏳ Retrying delete operation in ${Math.round(delay)}ms...`, {
            operationId,
            nextAttempt: attempt + 1,
            remainingAttempts: maxRetries - attempt
          });
          
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // All retries failed
    const finalError = {
      message: `Failed to delete inbox item after ${maxRetries} attempts`,
      operationId,
      itemId,
      userId,
      lastError: lastError?.message,
      totalAttempts: maxRetries,
      timestamp: new Date().toISOString()
    };
    
    console.error(`💥 All retry attempts exhausted:`, finalError);
    
    return {
      success: false,
      message: `Could not delete item after ${maxRetries} attempts. Please try again later.`,
      error: lastError,
      attempts: maxRetries,
      operationId
    };
  },

  /**
   * Alternative hard delete method (if needed)
   */
  async safeHardDelete(itemId, userId, maxRetries = 3, retryDelay = 500) {
    let lastError = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (!mongoose.Types.ObjectId.isValid(itemId)) {
          throw new Error('Invalid inbox item ID');
        }

        const session = await mongoose.startSession();
        
        try {
          session.startTransaction();
          
          // Verify the item exists and belongs to the user before deletion
          const item = await this.findOne({ 
            _id: itemId, 
            $or: [
              { user: userId },
              { userId: userId }
            ]
          }).session(session);

          if (!item) {
            throw new Error('Inbox item not found');
          }

          // Perform hard delete
          await this.deleteOne({ _id: itemId }).session(session);
          await session.commitTransaction();
          
          console.log(`Successfully hard deleted inbox item ${itemId} on attempt ${attempt}`);
          return {
            success: true,
            message: 'Inbox item permanently deleted'
          };
          
        } catch (transactionError) {
          await session.abortTransaction();
          throw transactionError;
        } finally {
          await session.endSession();
        }
        
      } catch (error) {
        lastError = error;
        console.error(`Failed to hard delete inbox item ${itemId} on attempt ${attempt}:`, error.message);
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }
    
    const finalError = `Failed to hard delete inbox item ${itemId} after ${maxRetries} attempts. Last error: ${lastError?.message}`;
    console.error(finalError);
    
    return {
      success: false,
      message: finalError,
      error: lastError
    };
  },

  /**
   * Get inbox items for sidebar display
   * @param {string} userId - The ID of the user
   * @param {Object} options - Options for query (limit, excludePromoted, etc.)
   * @returns {Promise<Array>} Array of inbox items with selected fields
   */
  async getSidebarItems(userId, options = {}) {
    try {
      const {
        limit = null,
        excludePromoted = false, // For future use if you have promoted items
        fields = 'title _id createdAt'
      } = options;

      // Base query for non-deleted user items
      let query = {
        $or: [
          { user: userId },
          { userId: userId }
        ],
        isDeleted: { $ne: true }
      };

      // Future: Exclude promoted items if needed
      if (excludePromoted) {
        query.isPromoted = { $ne: true };
      }

      let dbQuery = this.find(query)
        .select(fields)
        .sort({ createdAt: -1 });

      // Apply limit if specified
      if (limit && limit > 0) {
        dbQuery = dbQuery.limit(limit);
      }

      const items = await dbQuery.lean().exec();
      
      console.log(`Retrieved ${items.length} sidebar items for user ${userId}`);
      return items;

    } catch (error) {
      console.error('Error in getSidebarItems:', {
        error: error.message,
        userId: userId,
        options: options
      });
      throw error;
    }
  },

  /**
   * Get sidebar items count
   * @param {string} userId - The ID of the user
   * @returns {Promise<number>} Count of inbox items
   */
  async getSidebarCount(userId) {
    try {
      const count = await this.countDocuments({
        $or: [
          { user: userId },
          { userId: userId }
        ],
        isDeleted: { $ne: true }
      });
      
      return count;
    } catch (error) {
      console.error('Error in getSidebarCount:', error);
      throw error;
    }
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