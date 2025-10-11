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

  const formatDate = (dateString) => {
    if (!dateString) return 'No due date';
    return new Date(dateString).toLocaleDateString();
  };

  const isOverdue = (dueDate) => {
    if (!dueDate || task.status === 'completed') return false;
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
  };

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
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 border-l-4 ${
      task.isImportant ? 'border-l-red-500' : 
      isDraft ? 'border-l-yellow-500' : 'border-l-blue-500'
    } hover:shadow-md transition-all duration-200 ${isCompleted ? 'opacity-75' : ''} ${
      isUpdating ? 'opacity-50 pointer-events-none' : ''
    } ${isDraft ? 'bg-yellow-50' : ''}`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 flex items-start space-x-3">
          {/* Completion Checkbox - Hide for drafts */}
          {!isDraft && (
            <button
              onClick={handleQuickComplete}
              disabled={isUpdating}
              className={`flex-shrink-0 w-5 h-5 rounded-full border-2 mt-1 transition-colors ${
                task.status === 'completed'
                  ? 'bg-green-500 border-green-500'
                  : 'border-gray-300 hover:border-green-500'
              } ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              title={task.status === 'completed' ? 'Mark as pending' : 'Mark as completed'}
            >
              {task.status === 'completed' && (
                <svg className="w-3 h-3 text-white mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          )}
          
          {/* Draft indicator */}
          {isDraft && (
            <div className="flex-shrink-0 w-5 h-5 bg-yellow-500 rounded-full mt-1 flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
          )}

          <div 
            className="flex-1 min-w-0 cursor-pointer"
            onClick={handleEdit}
          >
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
            className={`p-2 rounded-lg hover:bg-gray-100 transition-colors ${
              isMenuOpen ? 'bg-gray-100' : ''
            }`}
            title="More actions"
          >
            <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10 animate-in fade-in duration-200">
              <div className="py-2">
                {/* Toggle Completion in Menu - Hide for drafts */}
                {!isDraft && (
                  <button
                    onClick={handleToggleComplete}
                    disabled={isUpdating}
                    className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 w-full text-left disabled:opacity-50 transition-colors rounded-lg mx-1"
                  >
                    <div className={`w-5 h-5 mr-3 rounded-full flex items-center justify-center ${
                      task.status === 'completed' ? 'bg-green-100' : 'bg-blue-100'
                    }`}>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {task.status === 'completed' ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        )}
                      </svg>
                    </div>
                    {task.status === 'completed' ? 'Mark as Pending' : 'Mark as Completed'}
                  </button>
                )}

                <button
                  onClick={handleEdit}
                  className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 w-full text-left transition-colors rounded-lg mx-1"
                >
                  <div className="w-5 h-5 mr-3 rounded-full bg-blue-100 flex items-center justify-center">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  Edit Task
                </button>

                <div className="border-t border-gray-100 my-1"></div>

                <button
                  onClick={handleDelete}
                  disabled={isUpdating}
                  className="flex items-center px-4 py-3 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 w-full text-left disabled:opacity-50 transition-colors rounded-lg mx-1"
                >
                  <div className="w-5 h-5 mr-3 rounded-full bg-red-100 flex items-center justify-center">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                  Delete Task
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(task.status)} border ${
          task.status === 'completed' ? 'border-green-200' : 
          task.status === 'in-progress' ? 'border-blue-200' : 'border-yellow-200'
        }`}>
          {task.status.replace('-', ' ').toUpperCase()}
        </span>
        
        {task.isQuickCapture && (
          <span className="px-3 py-1 bg-cyan-100 text-cyan-800 rounded-full text-xs font-semibold border border-cyan-200">
            ⚡ QUICK CAPTURE
          </span>
        )}
        
        {task.priority && task.priority !== 'medium' && (
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(task.priority)} ${
            task.priority === 'high' ? 'border-red-200' : 
            task.priority === 'medium' ? 'border-orange-200' : 'border-gray-200'
          }`}>
            {task.priority.toUpperCase()} PRIORITY
          </span>
        )}
        
        {task.tags && task.tags.map((tag, index) => (
          <span key={index} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold border border-purple-200">
            #{tag}
          </span>
        ))}
        
        {task.status === 'completed' && task.completedAt && (
          <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-semibold border border-green-200">
            ✅ {new Date(task.completedAt).toLocaleDateString()}
          </span>
        )}
      </div>

      <div className="flex justify-between items-center pt-3 border-t border-gray-100">
        <div className="flex items-center space-x-4">
          {task.dueDate && (
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-medium ${
              isOverdue(task.dueDate) 
                ? 'bg-red-100 text-red-700 border border-red-200' 
                : 'bg-gray-100 text-gray-600 border border-gray-200'
            }`}>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{formatDate(task.dueDate)}</span>
              {isOverdue(task.dueDate) && <span className="font-semibold">(OVERDUE)</span>}
            </div>
          )}
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{new Date(task.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Quick Status Actions - Hide for drafts */}
        {!isDraft && (
          <div className="flex space-x-2">
            <button
              onClick={() => handleStatusChange('pending')}
              disabled={isUpdating}
              className={`p-2 rounded-lg transition-all duration-200 ${
                task.status === 'pending' 
                  ? 'bg-yellow-500 text-white shadow-sm' 
                  : 'bg-gray-100 text-gray-600 hover:bg-yellow-100 hover:text-yellow-700'
              } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Mark as Pending"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <button
              onClick={() => handleStatusChange('in-progress')}
              disabled={isUpdating}
              className={`p-2 rounded-lg transition-all duration-200 ${
                task.status === 'in-progress' 
                  ? 'bg-blue-500 text-white shadow-sm' 
                  : 'bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-700'
              } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Mark as In Progress"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </button>
            <button
              onClick={() => handleStatusChange('completed')}
              disabled={isUpdating}
              className={`p-2 rounded-lg transition-all duration-200 ${
                task.status === 'completed' 
                  ? 'bg-green-500 text-white shadow-sm' 
                  : 'bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-700'
              } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Mark as Completed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
          </div>
        )}

        {/* Draft actions */}
        {isDraft && (
          <div className="flex space-x-2">
            <button
              onClick={handleEdit}
              className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors shadow-sm"
            >
              Edit Draft
            </button>
            <button
              onClick={handleDelete}
              disabled={isUpdating}
              className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 shadow-sm"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskItem;