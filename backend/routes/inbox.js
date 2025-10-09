import express from 'express';
import { body, validationResult, query } from 'express-validator';
import InboxItem from '../models/InboxItem.js';
import Task from '../models/Task.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

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

router.post('/', protect, validateInboxItem, async (req, res) => {
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

router.get('/', protect, validateGetInbox, async (req, res) => {
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
router.get('/:id', protect, async (req, res) => {
  try {
    const { id: itemId } = req.params;
    const { id: userId } = req.user;

    const inboxItem = await InboxItem.findOne({
      _id: itemId,
      user: userId
    });

    if (!inboxItem) {
      return res.status(404).json({
        success: false,
        message: 'Inbox item not found'
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

router.put('/:id', protect, validateUpdateInbox, async (req, res) => {
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
      user: req.user.id
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
router.delete('/:id', protect, async (req, res) => {
  try {
    const inboxItem = await InboxItem.findOne({
      _id: req.params.id,
      user: req.user.id
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

// @desc    Promote inbox item to task
// @route   POST /api/inbox/:id/promote
// @access  Private
router.post('/:id/promote', protect, async (req, res) => {
  try {
    const { id: itemId } = req.params;
    const { id: userId } = req.user;

    const inboxItem = await InboxItem.findOne({
      _id: itemId,
      user: userId
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

    // Create task from inbox item using object spread
    const task = await Task.create({
      user: userId,
      title: inboxItem.title,
      description: inboxItem.notes,
      inboxRef: inboxItem._id,
      status: 'pending',
      priority: 'medium'
    });

    // Mark inbox item as promoted
    await inboxItem.markAsPromoted();

    res.json({
      success: true,
      message: 'Inbox item promoted to task successfully',
      data: {
        task,
        inboxItem
      }
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
router.delete('/bulk', protect, [
  body('itemIds')
    .isArray({ min: 1 })
    .withMessage('Item IDs must be an array with at least one item'),
  body('itemIds.*')
    .isMongoId()
    .withMessage('Each item ID must be a valid ID')
], async (req, res) => {
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
      user: req.user.id
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
router.get('/stats', protect, async (req, res) => {
  try {
    const stats = await InboxItem.getInboxStats(req.user.id);

    // Get recent promotion activity
    const recentPromotions = await InboxItem.find({
      user: req.user.id,
      isPromoted: true
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

router.post('/quick-add', protect, validateQuickAdd, async (req, res) => {
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

export default router;