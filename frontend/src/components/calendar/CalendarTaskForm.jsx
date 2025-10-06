import React, { useState, useEffect } from 'react';

const CalendarTaskForm = ({ 
  task, 
  onSubmit, 
  onCancel, 
  loading, 
  groups,
  defaultStart,
  defaultEnd,
  defaultAllDay 
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    startAt: '',
    dueAt: '',
    isAllDay: false,
    reminders: [],
    group: '',
    tags: '',
    isImportant: false
  });

  const [newReminder, setNewReminder] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'pending',
        priority: task.priority || 'medium',
        startAt: task.startAt ? new Date(task.startAt).toISOString().slice(0, 16) : '',
        dueAt: task.dueAt ? new Date(task.dueAt).toISOString().slice(0, 16) : '',
        isAllDay: task.isAllDay || false,
        reminders: task.reminders || [],
        group: task.group?._id || '',
        tags: task.tags ? task.tags.join(', ') : '',
        isImportant: task.isImportant || false
      });
    } else {
      // Set default values for new task
      const now = new Date();
      const defaultStartTime = defaultStart ? new Date(defaultStart) : now;
      const defaultEndTime = defaultEnd ? new Date(defaultEnd) : new Date(now.getTime() + 60 * 60 * 1000); // +1 hour

      setFormData(prev => ({
        ...prev,
        startAt: defaultStartTime.toISOString().slice(0, 16),
        dueAt: defaultEndTime.toISOString().slice(0, 16),
        isAllDay: defaultAllDay || false,
        group: groups.length > 0 ? groups[0]._id : ''
      }));
    }
  }, [task, defaultStart, defaultEnd, defaultAllDay, groups]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleAddReminder = () => {
    if (!newReminder) return;

    const reminderTime = new Date(newReminder);
    if (isNaN(reminderTime.getTime())) {
      setErrors(prev => ({ ...prev, reminders: 'Invalid reminder time' }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      reminders: [...prev.reminders, reminderTime.toISOString()]
    }));
    setNewReminder('');
    setErrors(prev => ({ ...prev, reminders: '' }));
  };

  const handleRemoveReminder = (index) => {
    setFormData(prev => ({
      ...prev,
      reminders: prev.reminders.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.group) {
      newErrors.group = 'Group is required';
    }
    
    if (formData.startAt && formData.dueAt) {
      const start = new Date(formData.startAt);
      const due = new Date(formData.dueAt);
      if (due < start) {
        newErrors.dueAt = 'Due date cannot be before start date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const submitData = {
      ...formData,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      reminders: formData.reminders.map(reminder => new Date(reminder))
    };

    onSubmit(submitData);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        {task ? 'Edit Task' : 'Create New Task'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Group Selection */}
        <div>
          <label htmlFor="group" className="block text-sm font-medium text-gray-700">
            Group *
          </label>
          <select
            id="group"
            name="group"
            value={formData.group}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select a group</option>
            {groups.map(group => (
              <option key={group._id} value={group._id}>
                {group.icon} {group.name}
              </option>
            ))}
          </select>
          {errors.group && (
            <p className="mt-1 text-sm text-red-600">{errors.group}</p>
          )}
        </div>

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
              errors.title ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Enter task title"
            required
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows="3"
            value={formData.description}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter task description (optional)"
          />
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="startAt" className="block text-sm font-medium text-gray-700">
              Start Date & Time
            </label>
            <input
              type="datetime-local"
              id="startAt"
              name="startAt"
              value={formData.startAt}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="dueAt" className="block text-sm font-medium text-gray-700">
              Due Date & Time
            </label>
            <input
              type="datetime-local"
              id="dueAt"
              name="dueAt"
              value={formData.dueAt}
              onChange={handleChange}
              className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                errors.dueAt ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.dueAt && (
              <p className="mt-1 text-sm text-red-600">{errors.dueAt}</p>
            )}
          </div>
        </div>

        {/* All Day Checkbox */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isAllDay"
            name="isAllDay"
            checked={formData.isAllDay}
            onChange={handleChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="isAllDay" className="ml-2 block text-sm text-gray-700">
            All day event
          </label>
        </div>

        {/* Reminders */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reminders
          </label>
          <div className="flex space-x-2 mb-2">
            <input
              type="datetime-local"
              value={newReminder}
              onChange={(e) => setNewReminder(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="button"
              onClick={handleAddReminder}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Add
            </button>
          </div>
          {errors.reminders && (
            <p className="text-sm text-red-600 mb-2">{errors.reminders}</p>
          )}
          
          <div className="space-y-2">
            {formData.reminders.map((reminder, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                <span className="text-sm">
                  {new Date(reminder).toLocaleString()}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveReminder(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Status & Priority */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
              Priority
            </label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        {/* Tags & Important */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
              Tags
            </label>
            <input
              type="text"
              id="tags"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter tags separated by commas"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isImportant"
              name="isImportant"
              checked={formData.isImportant}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isImportant" className="ml-2 block text-sm text-gray-700">
              Mark as important
            </label>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto"></div>
            ) : task ? (
              'Update Task'
            ) : (
              'Create Task'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CalendarTaskForm;