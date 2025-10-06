import React, { useState } from 'react';

const TaskItem = ({ task, onEdit, onDelete, onStatusChange, onMoveTask, groups, onToggleComplete }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const [completing, setCompleting] = useState(false);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 line-through';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No due date';
    return new Date(dateString).toLocaleDateString();
  };

  const isOverdue = (dueDate) => {
    if (!dueDate || task.status === 'completed') return false;
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
  };

  const handleStatusChange = (newStatus) => {
    onStatusChange(task._id, newStatus);
    setIsMenuOpen(false);
  };

  const handleMoveToGroup = (targetGroupId) => {
    onMoveTask(task._id, targetGroupId);
    setIsMenuOpen(false);
    setShowMoveMenu(false);
  };

  const handleToggleComplete = async () => {
    if (completing) return;
    
    setCompleting(true);
    try {
      await onToggleComplete(task._id);
    } catch (error) {
      console.error('Error toggling completion:', error);
    } finally {
      setCompleting(false);
    }
  };

  const handleQuickComplete = async (e) => {
    e.stopPropagation();
    await handleToggleComplete();
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-4 border-l-4 ${
      task.isImportant ? 'border-red-500' : 'border-gray-300'
    } hover:shadow-lg transition-shadow ${task.status === 'completed' ? 'opacity-75' : ''}`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 flex items-start space-x-3">
          {/* Completion Checkbox */}
          <button
            onClick={handleQuickComplete}
            disabled={completing}
            className={`flex-shrink-0 w-5 h-5 rounded-full border-2 mt-1 transition-colors ${
              task.status === 'completed'
                ? 'bg-green-500 border-green-500'
                : 'border-gray-300 hover:border-green-500'
            } ${completing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            title={task.status === 'completed' ? 'Mark as pending' : 'Mark as completed'}
          >
            {task.status === 'completed' && (
              <svg className="w-3 h-3 text-white mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>

          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold text-gray-800 text-lg mb-1 ${
              task.status === 'completed' ? 'line-through text-gray-500' : ''
            }`}>
              {task.title}
            </h3>
            {task.description && (
              <p className={`text-gray-600 text-sm mb-2 line-clamp-2 ${
                task.status === 'completed' ? 'line-through' : ''
              }`}>
                {task.description}
              </p>
            )}
          </div>
        </div>
        
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-1 rounded hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
              <div className="py-1">
                {/* Toggle Completion in Menu */}
                <button
                  onClick={() => {
                    handleToggleComplete();
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {task.status === 'completed' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    )}
                  </svg>
                  {task.status === 'completed' ? 'Mark as Pending' : 'Mark as Completed'}
                </button>

                <button
                  onClick={() => {
                    onEdit(task);
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>

                {/* Move to Group Submenu */}
                <div className="relative">
                  <button
                    onClick={() => setShowMoveMenu(!showMoveMenu)}
                    className="flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  >
                    <span>Move to Group</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  
                  {showMoveMenu && (
                    <div className="absolute left-full top-0 ml-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-20 max-h-48 overflow-y-auto">
                      {groups.filter(g => g._id !== task.group?._id).map(group => (
                        <button
                          key={group._id}
                          onClick={() => handleMoveToGroup(group._id)}
                          className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                        >
                          <span className="mr-2" style={{ color: group.color }}>
                            {group.icon}
                          </span>
                          <span className="truncate">{group.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    onDelete(task._id);
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
          {task.status.replace('-', ' ')}
        </span>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
          {task.priority} priority
        </span>
        {task.tags && task.tags.map((tag, index) => (
          <span key={index} className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
            {tag}
          </span>
        ))}
        {task.status === 'completed' && task.completedAt && (
          <span className="px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
            Completed: {new Date(task.completedAt).toLocaleDateString()}
          </span>
        )}
      </div>

      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <span className={`text-xs ${isOverdue(task.dueAt) ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
            📅 {formatDate(task.dueAt)}
            {isOverdue(task.dueAt) && ' (Overdue)'}
          </span>
          <span className="text-xs text-gray-500">
            Created: {new Date(task.createdAt).toLocaleDateString()}
          </span>
        </div>

        <div className="flex space-x-1">
          <button
            onClick={() => handleStatusChange('pending')}
            className={`p-1 rounded ${task.status === 'pending' ? 'bg-yellow-500 text-white' : 'bg-gray-200 text-gray-600'}`}
            title="Mark as Pending"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          <button
            onClick={() => handleStatusChange('in-progress')}
            className={`p-1 rounded ${task.status === 'in-progress' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}
            title="Mark as In Progress"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </button>
          <button
            onClick={() => handleStatusChange('completed')}
            className={`p-1 rounded ${task.status === 'completed' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}
            title="Mark as Completed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskItem;