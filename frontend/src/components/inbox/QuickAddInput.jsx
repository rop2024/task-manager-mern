import React, { useState } from 'react';
import axios from 'axios';

const QuickAddInput = ({ onItemAdded, placeholder = "What's on your mind?" }) => {
  const [title, setTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || isAdding) return;

    setIsAdding(true);
    try {
      const response = await axios.post('/api/inbox/quick-add', {
        title: title.trim()
      });
      
      setTitle('');
      onItemAdded?.(response.data.data);
    } catch (error) {
      console.error('Error adding to inbox:', error);
      alert('Error adding to inbox: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsAdding(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <form onSubmit={handleSubmit} className="flex items-center space-x-3">
        <div className="flex-1">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={isAdding}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
            autoFocus
          />
        </div>
        <button
          type="submit"
          disabled={!title.trim() || isAdding}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center"
        >
          {isAdding ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            'Add'
          )}
        </button>
      </form>
      <p className="text-xs text-gray-500 mt-2">
        Press Enter to quickly add to your inbox
      </p>
    </div>
  );
};

export default QuickAddInput;