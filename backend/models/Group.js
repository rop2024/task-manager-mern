import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a group name'],
    trim: true,
    maxlength: [50, 'Group name cannot be more than 50 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot be more than 200 characters']
  },
  color: {
    type: String,
    default: '#3B82F6', // Default blue color
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Color must be a valid hex color']
  },
  icon: {
    type: String,
    default: '📁',
    maxlength: 5
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  taskCount: {
    type: Number,
    default: 0
  },
  endGoal: {
    type: String,
    trim: true,
    maxlength: [500, 'End goal cannot be more than 500 characters']
  },
  expectedDate: {
    type: Date
  },
  isCompleted: {
    type: Boolean,
    default: false,
    index: true
  },
  completedAt: {
    type: Date
  },
  completedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for better query performance
groupSchema.index({ user: 1, createdAt: -1 });
groupSchema.index({ user: 1, isDefault: 1 });
groupSchema.index({ user: 1, isCompleted: 1 });

// Update task count when tasks are added/removed
groupSchema.statics.updateTaskCount = async function(groupId) {
  try {
    const Task = mongoose.model('Task');
    const taskCount = await Task.countDocuments({ group: groupId });
    await this.findByIdAndUpdate(groupId, { taskCount });
    return taskCount;
  } catch (error) {
    console.error('Error updating task count:', error);
    return 0;
  }
};

// Mark group as completed
groupSchema.statics.markCompleted = async function(groupId, userId) {
  const group = await this.findOne({ _id: groupId, user: userId });
  
  if (!group) {
    throw new Error('Group not found or access denied');
  }

  group.isCompleted = true;
  group.completedAt = new Date();
  group.completedBy = userId;
  
  await group.save();
  
  // Optionally, you can add logic here to handle tasks in the group
  // e.g., mark all tasks as completed, move them, or show a modal
  
  return group;
};

// Unmark group as completed
groupSchema.statics.unmarkCompleted = async function(groupId, userId) {
  const group = await this.findOne({ _id: groupId, user: userId });
  
  if (!group) {
    throw new Error('Group not found or access denied');
  }

  group.isCompleted = false;
  group.completedAt = undefined;
  group.completedBy = undefined;
  
  await group.save();
  
  return group;
};

// Create default groups for new users
groupSchema.statics.createDefaultGroups = async function(userId) {
  const defaultGroups = [
    { name: 'Personal', icon: '🏠', color: '#10B981', isDefault: true },
    { name: 'Work', icon: '💼', color: '#3B82F6', isDefault: true },
    { name: 'Shopping', icon: '🛒', color: '#8B5CF6', isDefault: true },
    { name: 'Ideas', icon: '💡', color: '#F59E0B', isDefault: true }
  ];

  const groups = await this.insertMany(
    defaultGroups.map(group => ({ ...group, user: userId }))
  );

  return groups;
};

const Group = mongoose.model('Group', groupSchema);
export default Group;
