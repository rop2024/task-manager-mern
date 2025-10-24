import React, { useState } from 'react';
import { updateTask, deleteTask } from '../../api/tasks';

const TaskItem = ({ task, onEdit, onUpdate }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

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

  const getCardBackgroundColor = (status, isOverdue, daysUntilDue) => {
    // Completed tasks: green background
    if (status === 'completed') {
      return 'bg-green-50 border-green-200';
    }
    // In-progress tasks: blue background
    if (status === 'in-progress') {
      return 'bg-blue-50 border-blue-200';
    }
    // Overdue or urgent (0-2 days): red background
    if (isOverdue || (daysUntilDue !== null && daysUntilDue <= 2)) {
      return 'bg-red-50 border-red-200';
    }
    // Default: gray/white background
    return 'bg-white border-gray-200';
  };

  const calculateDaysUntilDue = (dueDate) => {
    if (!dueDate) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diffTime = due - now;
    const daysUntilDue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return daysUntilDue;
  };

  const getDaysUntilDueColor = (daysUntilDue) => {
    if (daysUntilDue === null) return '';
    if (daysUntilDue < 0) return 'bg-red-500 text-white'; // Overdue
    if (daysUntilDue === 0) return 'bg-red-500 text-white'; // Due today
    if (daysUntilDue <= 2) return 'bg-orange-500 text-white'; // Urgent (1-2 days)
    if (daysUntilDue <= 7) return 'bg-yellow-500 text-white'; // Soon (3-7 days)
    return 'bg-green-500 text-white'; // Plenty of time (7+ days)
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No due date';
    return new Date(dateString).toLocaleDateString();
  };

  const isOverdue = (dueDate) => {
    if (!dueDate || task.status === 'completed') return false;
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
  };

  const daysUntilDue = calculateDaysUntilDue(task.dueAt || task.dueDate);
  const daysUntilDueLabel = daysUntilDue !== null ? (
    daysUntilDue < 0 
      ? `${Math.abs(daysUntilDue)} days overdue`
      : daysUntilDue === 0
        ? 'Due today'
        : `${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''} left`
  ) : null;

  const handleStatusChange = async (newStatus) => {
    if (isUpdating) return;

    try {
      setIsUpdating(true);
      const response = await updateTask(task._id, { status: newStatus });
      
      if (response.data.success) {
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      alert('Failed to update task status');
    } finally {
      setIsUpdating(false);
    }
    setIsMenuOpen(false);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      setIsUpdating(true);
      const response = await deleteTask(task._id);
      
      if (response.data.success) {
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Failed to delete task');
    } finally {
      setIsUpdating(false);
    }
    setIsMenuOpen(false);
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(task);
    }
    setIsMenuOpen(false);
  };

  const handleToggleComplete = async () => {
    if (isUpdating) return;
    
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    await handleStatusChange(newStatus);
  };

  const handleQuickComplete = async (e) => {
    e.stopPropagation();
    await handleToggleComplete();
  };

  const isDraft = task.status === 'draft';
  const isCompleted = task.status === 'completed';

  return (
    <div className={`rounded-lg border border-l-4 p-3 sm:p-4 ${
      task.isImportant ? 'border-l-red-500' : 
      task.status === 'draft' ? 'border-l-yellow-500' : 
      task.status === 'completed' ? 'border-l-green-500' :
      task.status === 'in-progress' ? 'border-l-blue-500' : 'border-l-gray-400'
    } ${getCardBackgroundColor(task.status, isOverdue(task.dueAt || task.dueDate), daysUntilDue)} hover:shadow-sm transition-all duration-200 ${isCompleted ? 'opacity-70' : ''} ${
      isUpdating ? 'opacity-50 pointer-events-none' : ''
    }`}>
      
      {/* Main content row */}
      <div className="flex items-center justify-between">
        {/* Left: Checkbox + Title + Priority indicator */}
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {/* Status/Action Button */}
          {!isDraft ? (
            <button
              onClick={handleQuickComplete}
              disabled={isUpdating}
              className={`flex-shrink-0 w-6 h-6 sm:w-5 sm:h-5 rounded-full border-2 transition-colors ${
                task.status === 'completed'
                  ? 'bg-green-500 border-green-500'
                  : 'border-gray-300 hover:border-green-500'
              } ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              title={task.status === 'completed' ? 'Mark as pending' : 'Mark as completed'}
            >
              {task.status === 'completed' && (
                <svg className="w-3 h-3 sm:w-3 sm:h-3 text-white mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ) : (
            <div className="flex-shrink-0 w-6 h-6 sm:w-5 sm:h-5 bg-yellow-500 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 sm:w-3 sm:h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
          )}

          {/* Title and meta */}
          <div className="flex-1 min-w-0 cursor-pointer" onClick={handleEdit}>
            <div className="flex items-center space-x-2">
            <h3 className={`font-medium text-sm sm:text-base text-gray-900 ${
                task.status === 'completed' ? 'line-through text-gray-500' : ''
              }`}>
                {task.title}
            </h3>              {/* Compact indicators */}
              {task.priority === 'high' && (
                <div className="flex-shrink-0 w-2 h-2 bg-red-500 rounded-full" title="High Priority"></div>
              )}
              {isOverdue(task.dueDate) && (
                <div className="flex-shrink-0 w-2 h-2 bg-red-500 rounded-full animate-pulse" title="Overdue"></div>
              )}
            </div>
            
            {/* Compact meta info */}
            <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1">
              {task.dueDate && (
                <span className={isOverdue(task.dueDate) ? 'text-red-600 font-medium' : ''}>
                  Due: {formatDate(task.dueDate)}
                </span>
              )}
              {task.status !== 'pending' && task.status !== 'completed' && (
                <span className="capitalize">{task.status.replace('-', ' ')}</span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Days remaining + Actions */}
        <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
          {/* Days remaining badge */}
          {daysUntilDueLabel && task.status !== 'draft' && (
            <div className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getDaysUntilDueColor(daysUntilDue)}`}>
              {daysUntilDueLabel}
            </div>
          )}

          {/* Quick status toggle for non-completed tasks */}
          {!isDraft && task.status !== 'completed' && (
            <button
              onClick={() => handleStatusChange(task.status === 'in-progress' ? 'pending' : 'in-progress')}
              disabled={isUpdating}
              className={`p-2 sm:p-1 rounded transition-colors ${
                task.status === 'in-progress' 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
              } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={task.status === 'in-progress' ? 'Mark as Pending' : 'Mark as In Progress'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </button>
          )}

          {/* Menu */}
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 sm:p-1 text-gray-400 hover:text-gray-600 rounded"
              title="More actions"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                <div className="py-1">
                  <button
                    onClick={handleEdit}
                    className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </button>
                  
                  <div className="border-t border-gray-100"></div>
                  
                  <button
                    onClick={handleDelete}
                    disabled={isUpdating}
                    className="flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left disabled:opacity-50"
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
      </div>
    </div>
  );
};

export default TaskItem;