import express from "express";
import { body, validationResult, param } from "express-validator";
import Group from "../models/Group.js";
import Task from "../models/Task.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

export default router;

// Input validation rules
const createGroupValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Group name must be between 1 and 50 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description cannot be more than 200 characters'),
  body('color')
    .optional()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .withMessage('Color must be a valid hex color'),
  body('icon')
    .optional()
    .isLength({ max: 5 })
    .withMessage('Icon must be a single emoji or short text')
];

const updateGroupValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Group name must be between 1 and 50 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description cannot be more than 200 characters'),
  body('color')
    .optional()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .withMessage('Color must be a valid hex color'),
  body('icon')
    .optional()
    .isLength({ max: 5 })
    .withMessage('Icon must be a single emoji or short text')
];

// @desc    Get all groups for user
// @route   GET /api/groups
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const groups = await Group.find({ user: req.user.id })
      .sort({ isDefault: -1, createdAt: 1 });

    res.json({
      success: true,
      count: groups.length,
      data: groups
    });
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching groups'
    });
  }
});

// @desc    Get single group with tasks
// @route   GET /api/groups/:id
// @access  Private
router.get('/:id', protect, [
  param('id').isMongoId().withMessage('Invalid group ID')
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

    const group = await Group.findOne({ 
      _id: req.params.id, 
      user: req.user.id 
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Get tasks for this group
    const tasks = await Task.find({ 
      group: req.params.id,
      user: req.user.id 
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        ...group.toObject(),
        tasks
      }
    });
  } catch (error) {
    console.error('Get group error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching group'
    });
  }
});

// @desc    Create new group
// @route   POST /api/groups
// @access  Private
router.post('/', protect, createGroupValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const groupData = {
      ...req.body,
      user: req.user.id
    };

    const group = await Group.create(groupData);

    res.status(201).json({
      success: true,
      message: 'Group created successfully',
      data: group
    });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating group'
    });
  }
});

// @desc    Update group
// @route   PUT /api/groups/:id
// @access  Private
router.put('/:id', protect, updateGroupValidation, [
  param('id').isMongoId().withMessage('Invalid group ID')
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

    let group = await Group.findOne({ 
      _id: req.params.id, 
      user: req.user.id 
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Prevent updating default groups' core properties
    if (group.isDefault) {
      delete req.body.isDefault;
      delete req.body.user;
    }

    group = await Group.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Group updated successfully',
      data: group
    });
  } catch (error) {
    console.error('Update group error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating group'
    });
  }
});

// @desc    Delete group
// @route   DELETE /api/groups/:id
// @access  Private
router.delete('/:id', protect, [
  param('id').isMongoId().withMessage('Invalid group ID')
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

    const group = await Group.findOne({ 
      _id: req.params.id, 
      user: req.user.id 
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Prevent deleting default groups
    if (group.isDefault) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete default groups'
      });
    }

    // Check if group has tasks
    const taskCount = await Task.countDocuments({ group: req.params.id });
    if (taskCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete group with ${taskCount} tasks. Move or delete tasks first.`
      });
    }

    await Group.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Group deleted successfully',
      data: {}
    });
  } catch (error) {
    console.error('Delete group error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting group'
    });
  }
});

// @desc    Get group statistics
// @route   GET /api/groups/:id/stats
// @access  Private
router.get('/:id/stats', protect, [
  param('id').isMongoId().withMessage('Invalid group ID')
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

    const group = await Group.findOne({ 
      _id: req.params.id, 
      user: req.user.id 
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    const stats = await Task.getTaskStats(req.user.id, req.params.id);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get group stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching group statistics'
    });
  }
});

// @desc    Move tasks between groups
// @route   PATCH /api/groups/move-tasks
// @access  Private
router.patch('/move-tasks', protect, [
  body('taskIds')
    .isArray({ min: 1 })
    .withMessage('Task IDs must be an array with at least one item'),
  body('targetGroupId')
    .isMongoId()
    .withMessage('Target group ID must be a valid ID')
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

    const { taskIds, targetGroupId } = req.body;

    // Verify target group exists and belongs to user
    const targetGroup = await Group.findOne({
      _id: targetGroupId,
      user: req.user.id
    });

    if (!targetGroup) {
      return res.status(404).json({
        success: false,
        message: 'Target group not found'
      });
    }

    // Move tasks
    const result = await Task.updateMany(
      { 
        _id: { $in: taskIds }, 
        user: req.user.id 
      },
      { group: targetGroupId }
    );

    // Update task counts for affected groups
    const movedTasks = await Task.find({ _id: { $in: taskIds } });
    const sourceGroupIds = [...new Set(movedTasks.map(task => task.group.toString()))];
    
    for (const groupId of sourceGroupIds) {
      await Group.updateTaskCount(groupId);
    }
    await Group.updateTaskCount(targetGroupId);

    res.json({
      success: true,
      message: `${result.modifiedCount} tasks moved to ${targetGroup.name}`,
      data: { modifiedCount: result.modifiedCount }
    });
  } catch (error) {
    console.error('Move tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while moving tasks'
    });
  }
});

export const module = router;

