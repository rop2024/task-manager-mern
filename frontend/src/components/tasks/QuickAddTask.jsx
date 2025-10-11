import React, { useState } from 'react';
import { quickAddTask } from '../../api/tasks';

const QuickAddTask = ({ onTaskCreated, onTaskRefresh, className = '' }) => {
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    
    try {
      const response = await quickAddTask(title.trim());
      
      if (response.data.success) {
        setTitle('');
        setIsExpanded(false);
        
        // Notify parent component
        if (onTaskCreated) {
          onTaskCreated(response.data.data);
        }
        
        // Optional refresh callback
        if (onTaskRefresh) {
          await onTaskRefresh();
        }
      }
    } catch (error) {
      console.error('Quick add task error:', error);
      alert('Failed to capture task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
    
    if (e.key === 'Escape') {
      setTitle('');
      setIsExpanded(false);
    }
  };

  const handleFocus = () => {
    setIsExpanded(true);
  };

  const handleBlur = (e) => {
    // Delay collapse to allow for click events
    if (!title.trim()) {
      setTimeout(() => setIsExpanded(false), 200);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 transition-all duration-200 ${
      isExpanded ? 'p-4' : 'p-3'
    } ${className}`}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={isExpanded ? "What task do you want to capture?" : "Quick capture a task... (Press Enter to save)"}
            className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ${
              isExpanded ? 'text-base' : 'text-sm'
            } ${isSubmitting ? 'pr-12' : ''}`}
            disabled={isSubmitting}
            maxLength={255}
          />
          
          {isSubmitting && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
            </div>
          )}
        </div>

        {isExpanded && (
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-3">
              <button
                type="submit"
                disabled={!title.trim() || isSubmitting}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Capturing...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Capture Task</span>
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setTitle('');
                  setIsExpanded(false);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 font-medium transition-colors"
              >
                Cancel
              </button>
            </div>

            <div className="text-xs text-gray-500">
              {title.length}/255 characters
            </div>
          </div>
        )}

        {!isExpanded && (
          <p className="text-xs text-gray-500 mt-2">
            Press Enter to quickly capture or click to expand
          </p>
        )}
      </form>
    </div>
  );
};

export default QuickAddTask;