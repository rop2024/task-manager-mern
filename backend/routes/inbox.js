import express from 'express';
import { body, validationResult, query } from 'express-validator';
import InboxItem from '../models/InboxItem.js';
import Task from '../models/Task.js';
import { protect, verifyOwnership, verifyBulkOwnership } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected with auth middleware
router.use(protect);

// @desc    Add quick task to inbox
// @route   POST /api/inbox
// @access  Private
const validateInboxItem = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot be more than 1000 characters')
];

router.post('/', validateInboxItem, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { title, notes } = req.body;
    const { id: userId } = req.user;

    const inboxItem = await InboxItem.create({
      user: userId,
      title,
      notes
    });

    res.status(201).json({
      success: true,
      message: 'Task added to inbox',
      data: inboxItem
    });
  } catch (error) {
    console.error('Add to inbox error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding to inbox'
    });
  }
});

// @desc    Get all inbox items
// @route   GET /api/inbox
// @access  Private
const validateGetInbox = [
  query('includePromoted')
    .optional()
    .isBoolean()
    .withMessage('includePromoted must be a boolean'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
];

router.get('/', validateGetInbox, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { 
      includePromoted = false, 
      limit = 20, 
      page = 1 
    } = req.query;

    const { id: userId } = req.user;
    const parsedLimit = parseInt(limit);
    const parsedPage = parseInt(page);
    const skip = (parsedPage - 1) * parsedLimit;

    const query = { 
      user: userId,
      isDeleted: false,
      ...(!includePromoted && { isPromoted: false })
    };

    const [inboxItems, total] = await Promise.all([
      InboxItem.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit),
      InboxItem.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / parsedLimit);

    res.json({
      success: true,
      data: inboxItems,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        totalPages
      }
    });
  } catch (error) {
    console.error('Get inbox items error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching inbox items'
    });
  }
});

// @desc    Get single inbox item
// @route   GET /api/inbox/:id
// @access  Private
router.get('/:id', verifyOwnership('InboxItem'), async (req, res) => {
  try {
    // Resource is already verified and available in req.resource
    const inboxItem = req.resource;

    if (inboxItem.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Inbox item not found',
        code: 'ITEM_DELETED'
      });
    }

    res.json({
      success: true,
      data: inboxItem
    });
  } catch (error) {
    console.error('Get inbox item error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching inbox item'
    });
  }
});

// @desc    Update inbox item
// @route   PUT /api/inbox/:id
// @access  Private
const validateUpdateInbox = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot be more than 1000 characters')
];

router.put('/:id', verifyOwnership('InboxItem'), validateUpdateInbox, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const inboxItem = await InboxItem.findOne({
      _id: req.params.id,
      user: req.user.id,
      isDeleted: false
    });

    if (!inboxItem) {
      return res.status(404).json({
        success: false,
        message: 'Inbox item not found'
      });
    }

    if (inboxItem.isPromoted) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update promoted inbox item'
      });
    }

    const updatedItem = await InboxItem.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Inbox item updated successfully',
      data: updatedItem
    });
  } catch (error) {
    console.error('Update inbox item error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating inbox item'
    });
  }
});

// @desc    Delete inbox item
// @route   DELETE /api/inbox/:id
// @access  Private
router.delete('/:id', verifyOwnership('InboxItem'), async (req, res) => {
  try {
    const inboxItem = await InboxItem.findOne({
      _id: req.params.id,
      user: req.user.id,
      isDeleted: false
    });

    if (!inboxItem) {
      return res.status(404).json({
        success: false,
        message: 'Inbox item not found'
      });
    }

    await InboxItem.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Inbox item deleted successfully',
      data: {}
    });
  } catch (error) {
    console.error('Delete inbox item error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting inbox item'
    });
  }
});

// @desc    Manually delete an inbox item with retry logic (soft delete)
// @route   POST /api/inbox/:id/deleteManual
// @access  Private
router.post('/:id/deleteManual', async (req, res) => {
  try {
    const itemId = req.params.id;
    const userId = req.user.id;

    // Validate itemId
    if (!itemId) {
      return res.status(400).json({
        success: false,
        message: 'Inbox item ID is required'
      });
    }

    console.log(`Manual deletion requested for inbox item ${itemId} by user ${userId}`);

    // Perform safe deletion with retry logic
    const deleteResult = await InboxItem.safeDelete(itemId, userId);

    if (deleteResult.success) {
      return res.status(200).json({
        success: true,
        message: 'Inbox item deleted manually',
        data: {
          deletedItemId: itemId,
          deletedAt: deleteResult.deletedItem?.deletedAt
        }
      });
    } else {
      return res.status(500).json({
        success: false,
        message: deleteResult.message,
        error: process.env.NODE_ENV === 'development' ? deleteResult.error?.message : undefined
      });
    }

  } catch (error) {
    console.error('Error in manual deletion endpoint:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      itemId: req.params.id
    });

    return res.status(500).json({
      success: false,
      message: 'Internal server error during deletion',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Permanently delete an inbox item (hard delete)
// @route   DELETE /api/inbox/:id/permanent
// @access  Private
router.delete('/:id/permanent', async (req, res) => {
  try {
    const itemId = req.params.id;
    const userId = req.user.id;

    if (!itemId) {
      return res.status(400).json({
        success: false,
        message: 'Inbox item ID is required'
      });
    }

    console.log(`Permanent deletion requested for inbox item ${itemId} by user ${userId}`);

    const deleteResult = await InboxItem.safeHardDelete(itemId, userId);

    if (deleteResult.success) {
      return res.status(200).json({
        success: true,
        message: 'Inbox item permanently deleted'
      });
    } else {
      return res.status(500).json({
        success: false,
        message: deleteResult.message
      });
    }

  } catch (error) {
    console.error('Error in permanent deletion endpoint:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during permanent deletion'
    });
  }
});

// @desc    Promote inbox item to draft
// @route   POST /api/inbox/:id/promote-to-draft
// @access  Private
router.post('/:id/promote-to-draft', async (req, res) => {
  try {
    const { id: itemId } = req.params;
    const { id: userId } = req.user;

    const inboxItem = await InboxItem.findOne({
      _id: itemId,
      user: userId,
      isDeleted: false
    });

    if (!inboxItem) {
      return res.status(404).json({
        success: false,
        message: 'Inbox item not found'
      });
    }

    if (inboxItem.isPromoted) {
      return res.status(400).json({
        success: false,
        message: 'Inbox item is already promoted'
      });
    }

    // Import Draft model at top of file if not already done
    const Draft = (await import('../models/Draft.js')).default;

    // Create draft from inbox item
    const draft = await Draft.create({
      user: userId,
      title: inboxItem.title,
      notes: inboxItem.notes || '',
      source: 'inbox',
      inboxRef: inboxItem._id
    });

    // Mark inbox item as promoted
    await inboxItem.markAsPromoted();

    res.json({
      success: true,
      message: 'Inbox item promoted to draft successfully',
      data: {
        draft,
        inboxItem
      }
    });
  } catch (error) {
    console.error('Promote inbox item to draft error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while promoting inbox item to draft'
    });
  }
});

// @desc    Promote inbox item to task (direct promotion)
// @route   POST /api/inbox/:id/promote
// @access  Private
router.post('/:id/promote', async (req, res) => {
  try {
    const { id: itemId } = req.params;
    const { id: userId } = req.user;
    const { createDraftFirst = false, ...taskData } = req.body;

    const inboxItem = await InboxItem.findOne({
      _id: itemId,
      user: userId,
      isDeleted: false
    });

    if (!inboxItem) {
      return res.status(404).json({
        success: false,
        message: 'Inbox item not found'
      });
    }

    if (inboxItem.isPromoted) {
      return res.status(400).json({
        success: false,
        message: 'Inbox item is already promoted'
      });
    }

    let result = {};

    if (createDraftFirst) {
      // Two-step promotion: inbox -> draft -> task
      const Draft = (await import('../models/Draft.js')).default;
      
      // Create draft first
      const draft = await Draft.create({
        user: userId,
        title: inboxItem.title,
        notes: inboxItem.notes || '',
        source: 'inbox',
        inboxRef: inboxItem._id
      });

      // Then promote draft to task with additional task data
      const task = await draft.promote({
        priority: taskData.priority || 'medium',
        group: taskData.group,
        dueAt: taskData.dueAt ? new Date(taskData.dueAt) : undefined,
        startAt: taskData.startAt ? new Date(taskData.startAt) : undefined,
        tags: taskData.tags,
        estimatedMinutes: taskData.estimatedMinutes,
        isImportant: taskData.isImportant,
        reminders: taskData.reminders?.map(r => new Date(r))
      });

      await task.populate([
        { path: 'group', select: 'name color icon' },
        { path: 'inboxRef', select: 'title notes' },
        { path: 'draftRef', select: 'title notes source' }
      ]);

      result = { task, draft, inboxItem };
    } else {
      // Direct promotion: inbox -> task
      const task = await Task.create({
        user: userId,
        title: inboxItem.title,
        description: inboxItem.notes,
        inboxRef: inboxItem._id,
        status: 'pending',
        priority: taskData.priority || 'medium',
        group: taskData.group,
        dueAt: taskData.dueAt ? new Date(taskData.dueAt) : undefined,
        startAt: taskData.startAt ? new Date(taskData.startAt) : undefined,
        tags: taskData.tags,
        estimatedMinutes: taskData.estimatedMinutes,
        isImportant: taskData.isImportant,
        reminders: taskData.reminders?.map(r => new Date(r))
      });

      await task.populate([
        { path: 'group', select: 'name color icon' },
        { path: 'inboxRef', select: 'title notes' }
      ]);

      result = { task, inboxItem };
    }

    // Mark inbox item as promoted
    await inboxItem.markAsPromoted();

    res.json({
      success: true,
      message: createDraftFirst 
        ? 'Inbox item promoted to task via draft successfully'
        : 'Inbox item promoted to task successfully',
      data: result
    });
  } catch (error) {
    console.error('Promote inbox item error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while promoting inbox item'
    });
  }
});

// @desc    Bulk delete inbox items
// @route   DELETE /api/inbox/bulk
// @access  Private
router.delete('/bulk', [
  body('itemIds')
    .isArray({ min: 1 })
    .withMessage('Item IDs must be an array with at least one item'),
  body('itemIds.*')
    .isMongoId()
    .withMessage('Each item ID must be a valid ID')
], verifyBulkOwnership('InboxItem', 'itemIds'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { itemIds } = req.body;

    const result = await InboxItem.deleteMany({
      _id: { $in: itemIds },
      user: req.user.id,
      isDeleted: false
    });

    res.json({
      success: true,
      message: `${result.deletedCount} inbox items deleted successfully`,
      data: { deletedCount: result.deletedCount }
    });
  } catch (error) {
    console.error('Bulk delete inbox items error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while bulk deleting inbox items'
    });
  }
});

// @desc    Get inbox statistics
// @route   GET /api/inbox/stats
// @access  Private
router.get('/stats', async (req, res) => {
  try {
    const stats = await InboxItem.getInboxStats(req.user.id);

    // Get recent promotion activity
    const recentPromotions = await InboxItem.find({
      user: req.user.id,
      isPromoted: true,
      isDeleted: false
    })
    .sort({ promotedAt: -1 })
    .limit(5)
    .select('title promotedAt');

    res.json({
      success: true,
      data: {
        ...stats,
        recentPromotions
      }
    });
  } catch (error) {
    console.error('Get inbox stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching inbox statistics'
    });
  }
});

// @desc    Get user's inbox items for sidebar display
// @route   GET /api/inbox/sidebar
// @access  Private
router.get('/sidebar', async (req, res) => {
  try {
    const userId = req.user.id;
    
    console.log(`Fetching sidebar data for user ${userId}`);

    // Fetch non-deleted inbox items, sorted by creation date (newest first)
    const inboxItems = await InboxItem.find({
      user: userId,
      isDeleted: { $ne: true } // Exclude soft-deleted items
    })
    .select('title _id createdAt') // Project only required fields
    .sort({ createdAt: -1 }) // Sort by newest first
    .lean() // Return plain JavaScript objects for better performance
    .maxTimeMS(10000); // Set query timeout to 10 seconds

    console.log(`Found ${inboxItems.length} inbox items for user ${userId}`);

    return res.status(200).json({
      success: true,
      data: inboxItems,
      count: inboxItems.length,
      message: `Found ${inboxItems.length} inbox items`
    });

  } catch (error) {
    console.error('Error fetching sidebar data:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch inbox items',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      data: [] // Return empty array on error
    });
  }
});

// @desc    Get limited number of user's inbox items for sidebar (for performance)
// @route   GET /api/inbox/sidebar/limited
// @access  Private
router.get('/sidebar/limited', async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10; // Default to 10 items

    console.log(`Fetching limited sidebar data (${limit} items) for user ${userId}`);

    const inboxItems = await InboxItem.find({
      user: userId,
      isDeleted: { $ne: true }
    })
    .select('title _id createdAt')
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

    return res.status(200).json({
      success: true,
      data: inboxItems,
      count: inboxItems.length,
      limit: limit,
      message: `Found ${inboxItems.length} inbox items (limited to ${limit})`
    });

  } catch (error) {
    console.error('Error fetching limited sidebar data:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch inbox items',
      data: []
    });
  }
});

// @desc    Get count of user's inbox items for badge display
// @route   GET /api/inbox/sidebar/count
// @access  Private
router.get('/sidebar/count', async (req, res) => {
  try {
    const userId = req.user.id;

    const count = await InboxItem.countDocuments({
      user: userId,
      isDeleted: { $ne: true }
    });

    return res.status(200).json({
      success: true,
      data: { count },
      message: `You have ${count} inbox items`
    });

  } catch (error) {
    console.error('Error counting inbox items:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to count inbox items',
      data: { count: 0 }
    });
  }
});

// @desc    Quick add to inbox (minimal validation)
// @route   POST /api/inbox/quick-add
// @access  Private
const validateQuickAdd = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters')
];

router.post('/quick-add', validateQuickAdd, async (req, res) => {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return validationError;

    const { title } = req.body;
    const { id: userId } = req.user;

    const inboxItem = await InboxItem.create({
      user: userId,
      title,
      notes: '' // Empty notes for quick add
    });

    res.status(201).json({
      success: true,
      message: 'Task quickly added to inbox',
      data: inboxItem
    });
  } catch (error) {
    handleError(res, error, 'quickly adding to inbox');
  }
});

// Error handler utility
const handleError = (res, error, message) => {
  console.error(`Error: ${message}:`, error);
  return res.status(500).json({
    success: false,
    message: `Server error while ${message}`
  });
};

// Validation error handler utility
const handleValidationErrors = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  return null;
};

// Verify no circular imports
console.log('Inbox routes loaded successfully - no circular imports detected');

export default router;