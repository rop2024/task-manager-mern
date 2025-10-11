const express = require('express');
const { body } = require('express-validator');
const Task = require('../../models/Task');
const auth = require('../../middleware/auth');
const validateRequest = require('../../middleware/validateRequest');
const router = express.Router();

/**
 * @route   POST /api/tasks/quick
 * @desc    Create a quick capture draft task
 * @access  Private
 * @body    { title: string }
 */
router.post(
  '/',
  [
    auth,
    [
      body('title')
        .trim()
        .notEmpty()
        .withMessage('Title is required for quick capture')
        .isLength({ max: 255 })
        .withMessage('Title must be less than 255 characters')
    ],
    validateRequest
  ],
  async (req, res) => {
    try {
      const { title, description } = req.body;

      // Create quick capture task
      const task = new Task({
        title,
        description: description || '', // Optional description
        status: 'draft',
        isQuickCapture: true,
        createdBy: req.user.id,
        // Optional fields that can be added later
        priority: 'medium', // Default priority
        tags: []
      });

      await task.save();
      
      // Populate createdBy for response
      await task.populate('createdBy', 'name email');

      res.status(201).json({
        success: true,
        message: 'Task captured successfully',
        data: task
      });

    } catch (error) {
      console.error('Quick capture error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during quick capture',
        error: error.message
      });
    }
  }
);

module.exports = router;