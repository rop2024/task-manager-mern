import mongoose from 'mongoose';

const quickTaskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        minlength: [1, 'Title cannot be empty'],
        maxlength: [200, 'Title is too long (max 200 characters)']
    },
    priority: {
        type: String,
        required: [true, 'Priority is required'],
        enum: {
            values: ['High', 'Medium', 'Low'],
            message: 'Priority must be either High, Medium, or Low'
        },
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        immutable: true // Prevents modification after creation
    }
}, {
    // Add timestamps for better tracking
    timestamps: true,
    // Add validation to ensure no unknown fields are added
    strict: true
});

// Pre-save middleware to ensure data consistency
quickTaskSchema.pre('save', function(next) {
    // Ensure priority is properly capitalized
    if (this.priority) {
        this.priority = this.priority.charAt(0).toUpperCase() + this.priority.slice(1).toLowerCase();
    }
    next();
});

// Custom validation method to check if a QuickTask exists
quickTaskSchema.statics.exists = async function(id) {
    try {
        const task = await this.findById(id);
        return !!task;
    } catch {
        return false;
    }
};

export default mongoose.model('QuickTask', quickTaskSchema);