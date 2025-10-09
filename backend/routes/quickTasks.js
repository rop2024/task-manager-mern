import express from 'express';
import QuickTask from '../models/QuickTask.js';
import Task from '../models/Task.js';

const router = express.Router();

// GET all quick tasks
router.get('/', async (req, res) => {
    try {
        const quickTasks = await QuickTask.find().sort({ createdAt: -1 });
        res.json(quickTasks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST new quick task
router.post('/', async (req, res) => {
    const quickTask = new QuickTask({
        title: req.body.title,
        priority: req.body.priority
    });

    try {
        const newQuickTask = await quickTask.save();
        res.status(201).json(newQuickTask);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// DELETE quick task
router.delete('/:id', async (req, res) => {
    try {
        const quickTask = await QuickTask.findById(req.params.id);
        if (!quickTask) {
            return res.status(404).json({ message: 'Quick task not found' });
        }
        await QuickTask.deleteOne({ _id: req.params.id });
        res.json({ message: 'Quick task deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Convert quick task to main task
router.post('/:id/convert', async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid task ID format' });
        }

        // Find quick task and ensure it exists
        const quickTask = await QuickTask.findById(req.params.id).session(session);
        if (!quickTask) {
            await session.abortTransaction();
            return res.status(404).json({ message: 'Quick task not found' });
        }

        // Validate and prepare due date
        let dueDate = req.body.dueDate ? new Date(req.body.dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        if (isNaN(dueDate.getTime())) {
            await session.abortTransaction();
            return res.status(400).json({ message: 'Invalid due date format' });
        }

        // Create new main task from quick task with additional validation
        const task = new Task({
            title: quickTask.title,
            priority: quickTask.priority,
            status: 'pending',
            dueDate: dueDate,
            description: req.body.description || '',
            assignedTo: req.user ? req.user._id : null, // If user authentication is available
            convertedFromQuickTask: true, // Track conversion source
            originalQuickTaskCreatedAt: quickTask.createdAt // Preserve creation timestamp
        });

        // Validate the new task
        const validationError = task.validateSync();
        if (validationError) {
            await session.abortTransaction();
            return res.status(400).json({ 
                message: 'Invalid task data', 
                errors: validationError.errors 
            });
        }

        // Save the new task
        await task.save({ session });

        // Delete the quick task only if main task was saved successfully
        const deleteResult = await QuickTask.deleteOne(
            { _id: req.params.id },
            { session }
        );

        if (deleteResult.deletedCount !== 1) {
            await session.abortTransaction();
            return res.status(500).json({ 
                message: 'Failed to delete quick task after conversion' 
            });
        }

        // Commit the transaction
        await session.commitTransaction();
        res.status(201).json(task);

    } catch (error) {
        await session.abortTransaction();
        console.error('Error converting quick task:', error);
        res.status(500).json({ 
            message: 'Error converting quick task',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        session.endSession();
    }
});

export default router;