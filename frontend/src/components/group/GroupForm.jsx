import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';

const GroupForm = ({ group, onSubmit, onCancel, loading }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    icon: '📁',
    endGoal: '',
    expectedDate: ''
  });

  const [errors, setErrors] = useState({});

  const defaultIcons = [
    { emoji: '📁', label: 'Folder' },
    { emoji: '💼', label: 'Work' },
    { emoji: '🏠', label: 'Home' },
    { emoji: '🛒', label: 'Shopping' },
    { emoji: '💡', label: 'Ideas' },
    { emoji: '🎯', label: 'Goals' },
    { emoji: '📚', label: 'Study' },
    { emoji: '🏃', label: 'Fitness' },
    { emoji: '✈️', label: 'Travel' },
    { emoji: '❤️', label: 'Personal' }
  ];

  const defaultColors = [
    '#3B82F6', // blue
    '#10B981', // green
    '#8B5CF6', // purple
    '#F59E0B', // amber
    '#EF4444', // red
    '#06B6D4', // cyan
    '#84CC16', // lime
    '#F97316', // orange
    '#EC4899', // pink
    '#6B7280'  // gray
  ];

  useEffect(() => {
    if (group) {
      const expectedDate = group.expectedDate ? new Date(group.expectedDate).toISOString().split('T')[0] : '';
      setFormData({
        name: group.name || '',
        description: group.description || '',
        color: group.color || '#3B82F6',
        icon: group.icon || '📁',
        endGoal: group.endGoal || '',
        expectedDate: expectedDate
      });
    }
  }, [group]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleIconSelect = (icon) => {
    setFormData(prev => ({ ...prev, icon }));
  };

  const handleColorSelect = (color) => {
    setFormData(prev => ({ ...prev, color }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Group name is required';
    }
    
    if (formData.name.length > 50) {
      newErrors.name = 'Group name must be less than 50 characters';
    }

    if (formData.description.length > 200) {
      newErrors.description = 'Description must be less than 200 characters';
    }

    if (formData.endGoal.length > 500) {
      newErrors.endGoal = 'End goal must be less than 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    // Convert expected date to ISO string if provided
    const submitData = { ...formData };
    if (submitData.expectedDate) {
      submitData.expectedDate = new Date(submitData.expectedDate).toISOString();
    }

    onSubmit(submitData);
  };

  return (
    <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl border ${isDark ? 'border-gray-700' : 'border-gray-200'} p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto`}>
      <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'} mb-6`}>
        {group ? 'Edit Group' : 'Create New Group'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
            Group Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
              isDark
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500'
            } ${errors.name ? 'border-red-500' : ''}`}
            placeholder="Enter group name"
          />
          {errors.name && (
            <p className="mt-2 text-sm text-red-500">{errors.name}</p>
          )}
        </div>

        <div>
          <label htmlFor="description" className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows="3"
            value={formData.description}
            onChange={handleChange}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 resize-vertical transition-colors ${
              isDark
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500'
            } ${errors.description ? 'border-red-500' : ''}`}
            placeholder="Enter group description (optional)"
          />
          {errors.description && (
            <p className="mt-2 text-sm text-red-500">{errors.description}</p>
          )}
          <p className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {formData.description.length}/200 characters
          </p>
        </div>

        <div>
          <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-3`}>
            Icon
          </label>
          <div className="grid grid-cols-5 gap-2">
            {defaultIcons.map((iconObj, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleIconSelect(iconObj.emoji)}
                className={`p-3 rounded-lg text-xl transition-colors ${
                  formData.icon === iconObj.emoji 
                    ? isDark 
                      ? 'bg-blue-900 border-2 border-blue-500' 
                      : 'bg-blue-100 border-2 border-blue-500'
                    : isDark
                      ? 'border border-gray-600 hover:bg-gray-700'
                      : 'border border-gray-200 hover:bg-gray-100'
                }`}
                title={iconObj.label}
              >
                {iconObj.emoji}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-3`}>
            Color
          </label>
          <div className="grid grid-cols-5 gap-3">
            {defaultColors.map((color, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleColorSelect(color)}
                className={`w-10 h-10 rounded-full border-2 transition-all hover:scale-110 ${
                  formData.color === color 
                    ? 'border-gray-800 scale-110 shadow-lg' 
                    : isDark 
                      ? 'border-gray-600 hover:border-gray-400' 
                      : 'border-gray-300 hover:border-gray-500'
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="endGoal" className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
            End Goal
          </label>
          <textarea
            id="endGoal"
            name="endGoal"
            rows="3"
            value={formData.endGoal}
            onChange={handleChange}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 resize-vertical transition-colors ${
              isDark
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500'
            } ${errors.endGoal ? 'border-red-500' : ''}`}
            placeholder="Describe what you want to achieve with this group (optional)"
          />
          {errors.endGoal && (
            <p className="mt-2 text-sm text-red-500">{errors.endGoal}</p>
          )}
          <p className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {formData.endGoal.length}/500 characters
          </p>
        </div>

        <div>
          <label htmlFor="expectedDate" className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
            Expected Completion Date
          </label>
          <input
            type="date"
            id="expectedDate"
            name="expectedDate"
            value={formData.expectedDate}
            onChange={handleChange}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
              isDark
                ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500'
                : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500'
            }`}
          />
          <p className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            When do you aim to complete this group's goals? (optional)
          </p>
        </div>

        <div className={`flex justify-end space-x-3 pt-6 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <button
            type="button"
            onClick={onCancel}
            className={`px-6 py-3 border rounded-lg font-medium transition-colors ${
              isDark
                ? 'border-gray-600 text-gray-300 bg-gray-700 hover:bg-gray-600'
                : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
            }`}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 
                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                     flex items-center space-x-2"
          >
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            )}
            <span>
              {group ? 'Update Group' : 'Create Group'}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default GroupForm;