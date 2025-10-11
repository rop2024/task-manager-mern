import React, { useState, useEffect } from 'react';
import { getTasksWithDrafts } from '../../api/tasks';
import TaskItem from './TaskItem';
import QuickAddTask from './QuickAddTask';
import axios from 'axios';

const TaskList = ({ showDrafts = false, onTaskEdit, onTaskRefresh }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, active, completed, drafts
  const [refreshFlag, setRefreshFlag] = useState(0);

  useEffect(() => {
    loadTasks();
  }, [refreshFlag, showDrafts]);

  const handleTaskComplete = async (taskId) => {
    try {
      const response = await axios.put(`/api/tasks/${taskId}/complete`);
      if (response.data.success) {
        setTasks(prev => prev.filter(task => task._id !== taskId));
        setRefreshFlag(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const loadTasks = async () => {
    try {
      setLoading(true);
      const response = await getTasksWithDrafts();
      
      if (response.data.success) {
        setTasks(response.data.data);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
      alert('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = tasks.filter(task => {
    switch (filter) {
      case 'active':
        return task.status === 'pending' || task.status === 'in-progress';
      case 'completed':
        return task.status === 'completed';
      case 'drafts':
        return task.status === 'draft';
      default:
        return true;
    }
  });

  const draftTasks = tasks.filter(task => task.status === 'draft');
  const activeTasks = tasks.filter(task => 
    task.status === 'pending' || task.status === 'in-progress'
  );
  const completedTasks = tasks.filter(task => task.status === 'completed');

  const handleTaskCreated = (newTask) => {
    // Add task to local state and trigger refresh
    setTasks(prev => [newTask, ...prev]);
    setRefreshFlag(prev => prev + 1);
    console.log('New task captured:', newTask);
    
    // Optional external refresh callback
    if (onTaskRefresh) {
      onTaskRefresh();
    }
  };

  const handleTaskUpdate = () => {
    setRefreshFlag(prev => prev + 1);
    loadTasks();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
        <p className="text-gray-600 text-lg font-medium">Loading tasks...</p>
        <p className="text-gray-500 text-sm mt-2">Please wait while we fetch your tasks</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Add Section */}
      <div className="sticky top-0 z-10 bg-gray-50 pb-4">
        <QuickAddTask 
          onTaskCreated={handleTaskCreated}
          onTaskRefresh={handleTaskUpdate}
          className="mb-4"
        />
      </div>

      {/* Task List Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Task Statistics */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
              <span className="text-sm text-gray-600">
                All: <span className="font-semibold text-gray-800">{tasks.length}</span>
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-600">
                Active: <span className="font-semibold text-blue-600">{activeTasks.length}</span>
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">
                Completed: <span className="font-semibold text-green-600">{completedTasks.length}</span>
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-sm text-gray-600">
                Drafts: <span className="font-semibold text-yellow-600">{draftTasks.length}</span>
              </span>
            </div>
          </div>

          {/* Filter Dropdown and View Toggle */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label htmlFor="task-filter" className="text-sm font-medium text-gray-700">
                Filter:
              </label>
              <select 
                id="task-filter"
                value={filter} 
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm"
              >
                <option value="all">All Tasks</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="drafts">Drafts</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
            <div className="text-center">
              {filter === 'drafts' ? (
                <>
                  <div className="text-6xl mb-4">📝</div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">No draft tasks</h3>
                  <p className="text-gray-600 mb-6">Use the quick capture above to create draft tasks</p>
                  <button
                    onClick={() => setFilter('all')}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    View All Tasks
                  </button>
                </>
              ) : filter === 'completed' ? (
                <>
                  <div className="text-6xl mb-4">🎯</div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">No completed tasks yet</h3>
                  <p className="text-gray-600 mb-6">Complete some tasks to see them here</p>
                  <button
                    onClick={() => setFilter('active')}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    View Active Tasks
                  </button>
                </>
              ) : filter === 'active' ? (
                <>
                  <div className="text-6xl mb-4">⚡</div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">No active tasks</h3>
                  <p className="text-gray-600 mb-6">All caught up! Create a new task or view completed ones</p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={() => setFilter('all')}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      View All Tasks
                    </button>
                    <button
                      onClick={() => setFilter('completed')}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      View Completed
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-gray-100 rounded-full p-6 w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                    <svg className="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">No tasks found</h3>
                  <p className="text-gray-600 mb-6">Create your first task using the quick capture above. Remember to check your inbox for ideas and inspiration!</p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                    <div className="flex items-center space-x-2 text-blue-700">
                      <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <p className="text-sm">
                        <strong>Tip:</strong> Your inbox items can be converted into tasks. Keep both lists organized!
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Task Count Header */}
            <div className="flex items-center justify-between px-1">
              <h2 className="text-lg font-semibold text-gray-800">
                {filter === 'all' ? 'All Tasks' : 
                 filter === 'active' ? 'Active Tasks' :
                 filter === 'completed' ? 'Completed Tasks' : 'Draft Tasks'}
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'})
                </span>
              </h2>
              
              {filteredTasks.length > 1 && (
                <button
                  onClick={loadTasks}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Refresh tasks"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              )}
            </div>

            {/* Task Items */}
            {filteredTasks.map(task => (
              <TaskItem
                key={task._id}
                task={task}
                onEdit={onTaskEdit}
                onUpdate={handleTaskUpdate}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default TaskList;