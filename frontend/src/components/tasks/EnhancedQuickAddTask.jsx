import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import PromptSelector from './PromptSelector';
import { quickAddTask } from '../../api/tasks';

const EnhancedQuickAddTask = ({ onTaskCreated, onTaskRefresh, className = '' }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPrompts, setShowPrompts] = useState(false);
  const [promptUsed, setPromptUsed] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    
    try {
      const response = await quickAddTask(title.trim());
      
      if (response.data.success) {
        setTitle('');
        setIsExpanded(false);
        setShowPrompts(false);
        setPromptUsed(false);
        
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
      console.error('Quick add error:', error);
      alert('Failed to create task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePromptSelect = (promptText) => {
    setTitle(promptText);
    setPromptUsed(true);
    setShowPrompts(false);
    setIsExpanded(true);
  };

  const handleInputChange = (e) => {
    setTitle(e.target.value);
    if (e.target.value.trim() && showPrompts) {
      setShowPrompts(false);
    }
  };

  const handleFocus = () => {
    setIsExpanded(true);
    if (!title.trim()) {
      setShowPrompts(true);
    }
  };

  const handleCancel = () => {
    setTitle('');
    setIsExpanded(false);
    setShowPrompts(false);
    setPromptUsed(false);
  };

  return (
    <div className={className}>
      {/* Prompt Selector - only shown when expanded and no title */}
      {showPrompts && isExpanded && (
        <div className="mb-4">
          <PromptSelector
            onPromptSelect={handlePromptSelect}
            onClose={() => setShowPrompts(false)}
            isVisible={showPrompts}
          />
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className={`relative ${isExpanded ? 'space-y-3' : ''}`}>
          {/* Main Input */}
          <div className={`flex items-center space-x-2 ${
            isExpanded 
              ? `p-4 border-2 rounded-lg ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`
              : `p-3 border rounded-lg ${isDark ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' : 'bg-gray-50 border-gray-200 hover:bg-white'} transition-colors cursor-text`
          }`}>
            <input
              type="text"
              value={title}
              onChange={handleInputChange}
              onFocus={handleFocus}
              placeholder={
                showPrompts 
                  ? "Choose a prompt or type your own task..." 
                  : isExpanded 
                    ? "What needs to be done?" 
                    : "Quick add a task..."
              }
              className={`flex-1 bg-transparent border-0 outline-none ${
                isDark ? 'text-white placeholder-gray-400' : 'text-gray-900 placeholder-gray-500'
              }`}
              disabled={isSubmitting}
            />
            
            {/* Prompt Button - only when expanded */}
            {isExpanded && (
              <button
                type="button"
                onClick={() => setShowPrompts(!showPrompts)}
                className={`px-2 py-1 rounded transition-colors text-sm ${
                  showPrompts
                    ? 'bg-purple-500 text-white hover:bg-purple-600'
                    : isDark 
                      ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' 
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
                title={showPrompts ? "Hide thinking prompts" : "Get thinking prompts"}
              >
                🧠
              </button>
            )}
            
            {/* Add Button */}
            <button
              type="submit"
              disabled={!title.trim() || isSubmitting}
              className={`px-4 py-2 rounded font-medium transition-colors ${
                !title.trim() || isSubmitting
                  ? isDark ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {isSubmitting ? '...' : isExpanded ? 'Add Task' : '+'}
            </button>
          </div>

          {/* Expanded Controls */}
          {isExpanded && (
            <div className="flex items-center justify-between">
              {/* Status Indicators */}
              <div className="flex items-center space-x-4 text-xs">
                {promptUsed && (
                  <span className={`${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                    ✨ Prompt used
                  </span>
                )}
                <span className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Press Enter to add • ESC to cancel
                </span>
              </div>
              
              {/* Cancel Button */}
              <button
                type="button"
                onClick={handleCancel}
                className={`text-sm px-3 py-1 rounded transition-colors ${
                  isDark 
                    ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </form>
      
      {/* Keyboard Shortcuts */}
      {isExpanded && (
        <div className="sr-only">
          <input
            type="text"
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                handleCancel();
              }
            }}
            style={{ position: 'absolute', left: '-9999px' }}
            autoFocus
          />
        </div>
      )}
    </div>
  );
};

export default EnhancedQuickAddTask;