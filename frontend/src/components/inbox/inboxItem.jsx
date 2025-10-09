import React, { useState } from 'react';

const InboxItem = ({ item, onPromote, onEdit, onDelete, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(item.title);
  const [editNotes, setEditNotes] = useState(item.notes || '');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) return;

    setIsProcessing(true);
    try {
      await onUpdate(item._id, {
        title: editTitle.trim(),
        notes: editNotes.trim()
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating inbox item:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditTitle(item.title);
    setEditNotes(item.notes || '');
    setIsEditing(false);
  };

  const handlePromote = async () => {
    setIsProcessing(true);
    try {
      await onPromote(item._id);
    } catch (error) {
      console.error('Error promoting inbox item:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this item from your inbox?')) {
      return;
    }

    setIsProcessing(true);
    try {
      await onDelete(item._id);
    } catch (error) {
      console.error('Error deleting inbox item:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isEditing) {
    return (
      <div className="bg-white border border-blue-300 rounded-lg p-4 shadow-sm">
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Item title"
          autoFocus
        />
        <textarea
          value={editNotes}
          onChange={(e) => setEditNotes(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Additional notes (optional)"
          rows="3"
        />
        <div className="flex justify-end space-x-2">
          <button
            onClick={handleCancelEdit}
            disabled={isProcessing}
            className="px-3 py-1 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveEdit}
            disabled={!editTitle.trim() || isProcessing}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isProcessing ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border rounded-lg p-4 hover:shadow-md transition-shadow ${
      item.isPromoted ? 'border-green-200 bg-green-50' : 'border-gray-200'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-800 text-lg mb-1">
            {item.title}
            {item.isPromoted && (
              <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Processed
              </span>
            )}
          </h3>
          {item.notes && (
            <p className="text-gray-600 text-sm mb-2 whitespace-pre-wrap">
              {item.notes}
            </p>
          )}
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <span>Added: {formatDate(item.createdAt)}</span>
            {item.daysInInbox > 0 && (
              <span>{item.daysInInbox} day{item.daysInInbox === 1 ? '' : 's'} in inbox</span>
            )}
            {item.isPromoted && item.promotedAt && (
              <span>Processed: {formatDate(item.promotedAt)}</span>
            )}
          </div>
        </div>
        
        {!item.isPromoted && (
          <div className="flex items-center space-x-2 ml-4">
            <button
              onClick={() => setIsEditing(true)}
              disabled={isProcessing}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
              title="Edit"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            
            <button
              onClick={handlePromote}
              disabled={isProcessing}
              className="p-2 text-green-500 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
              title="Promote to Task"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
            
            <button
              onClick={handleDelete}
              disabled={isProcessing}
              className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Delete"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}
        
        {item.isPromoted && (
          <button
            onClick={handleDelete}
            disabled={isProcessing}
            className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors ml-4"
            title="Delete"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
      
      {isProcessing && (
        <div className="mt-2 flex items-center text-sm text-blue-600">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
          Processing...
        </div>
      )}
    </div>
  );
};

export default InboxItem;