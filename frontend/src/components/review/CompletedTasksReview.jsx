import React, { useState } from 'react';

const CompletedTasksReview = ({ tasks, weekRange, isDark }) => {
  const [groupBy, setGroupBy] = useState('day'); // 'day', 'priority', 'group'
  const [sortBy, setSortBy] = useState('completed'); // 'completed', 'priority', 'title'
  const [filterPriority, setFilterPriority] = useState('all'); // 'all', 'high', 'medium', 'low'

  // Filter tasks by priority
  const filteredTasks = filterPriority === 'all' 
    ? tasks 
    : tasks.filter(task => task.priority === filterPriority);

  // Group tasks based on groupBy setting
  const groupedTasks = () => {
    switch (groupBy) {
      case 'day':
        return filteredTasks.reduce((groups, task) => {
          const date = new Date(task.completedAt);
          const dayKey = date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'short', 
            day: 'numeric' 
          });
          if (!groups[dayKey]) groups[dayKey] = [];
          groups[dayKey].push(task);
          return groups;
        }, {});
      
      case 'priority':
        return filteredTasks.reduce((groups, task) => {
          const priority = task.priority || 'medium';
          if (!groups[priority]) groups[priority] = [];
          groups[priority].push(task);
          return groups;
        }, {});
      
      case 'group':
        return filteredTasks.reduce((groups, task) => {
          const group = task.group?.name || 'No Group';
          if (!groups[group]) groups[group] = [];
          groups[group].push(task);
          return groups;
        }, {});
      
      default:
        return { 'All Tasks': filteredTasks };
    }
  };

  // Sort tasks within each group
  const sortTasks = (tasks) => {
    return [...tasks].sort((a, b) => {
      switch (sortBy) {
        case 'completed':
          return new Date(b.completedAt) - new Date(a.completedAt);
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return (priorityOrder[b.priority] || 2) - (priorityOrder[a.priority] || 2);
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityColorDark = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-900/20 border-red-800';
      case 'medium': return 'text-yellow-400 bg-yellow-900/20 border-yellow-800';
      case 'low': return 'text-green-400 bg-green-900/20 border-green-800';
      default: return 'text-gray-400 bg-gray-800/50 border-gray-700';
    }
  };

  const formatCompletionTime = (completedAt) => {
    const date = new Date(completedAt);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (filteredTasks.length === 0) {
    return (
      <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm border ${isDark ? 'border-gray-700' : 'border-gray-200'} p-8`}>
        <div className="text-center">
          <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'} mb-4`}>
            <svg className={`h-6 w-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
            No completed tasks
          </h3>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {filterPriority !== 'all' 
              ? `No ${filterPriority} priority tasks completed this week.`
              : 'No tasks were completed during this week.'
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm border ${isDark ? 'border-gray-700' : 'border-gray-200'} p-6`}>
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-4 sm:mb-0`}>
          📋 Completed Tasks ({filteredTasks.length})
        </h2>
        
        <div className="flex flex-wrap gap-3">
          {/* Priority Filter */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className={`text-sm border rounded-lg px-3 py-2 ${
              isDark 
                ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
            } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>

          {/* Group By */}
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value)}
            className={`text-sm border rounded-lg px-3 py-2 ${
              isDark 
                ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
            } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
          >
            <option value="day">Group by Day</option>
            <option value="priority">Group by Priority</option>
            <option value="group">Group by Project</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={`text-sm border rounded-lg px-3 py-2 ${
              isDark 
                ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
            } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
          >
            <option value="completed">Sort by Completion</option>
            <option value="priority">Sort by Priority</option>
            <option value="title">Sort by Title</option>
          </select>
        </div>
      </div>

      {/* Grouped Tasks */}
      <div className="space-y-6">
        {Object.entries(groupedTasks()).map(([groupName, groupTasks]) => (
          <div key={groupName}>
            <h3 className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-3 uppercase tracking-wide`}>
              {groupName} ({groupTasks.length})
            </h3>
            
            <div className="space-y-2">
              {sortTasks(groupTasks).map((task, index) => (
                <div 
                  key={task._id || index}
                  className={`p-4 rounded-lg border transition-colors ${
                    isDark ? 'bg-gray-750 border-gray-600 hover:bg-gray-700' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        {/* Completion Check */}
                        <div className="flex-shrink-0">
                          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>

                        {/* Task Title */}
                        <h4 className={`text-base font-medium ${isDark ? 'text-white' : 'text-gray-900'} truncate`}>
                          {task.title}
                        </h4>

                        {/* Priority Badge */}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${
                          isDark ? getPriorityColorDark(task.priority) : getPriorityColor(task.priority)
                        }`}>
                          {(task.priority || 'medium').charAt(0).toUpperCase() + (task.priority || 'medium').slice(1)}
                        </span>
                      </div>

                      {/* Task Details */}
                      <div className="flex items-center gap-4 text-sm">
                        {/* Completion Time */}
                        <div className={`flex items-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {formatCompletionTime(task.completedAt)}
                        </div>

                        {/* Group */}
                        {task.group && (
                          <div className={`flex items-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            {task.group.name}
                          </div>
                        )}

                        {/* Estimated Time */}
                        {task.estimatedMinutes && (
                          <div className={`flex items-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            {task.estimatedMinutes < 60 
                              ? `${task.estimatedMinutes}m` 
                              : `${Math.floor(task.estimatedMinutes / 60)}h ${task.estimatedMinutes % 60}m`
                            }
                          </div>
                        )}
                      </div>

                      {/* Task Description */}
                      {task.description && (
                        <p className={`mt-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'} line-clamp-2`}>
                          {task.description}
                        </p>
                      )}

                      {/* Tags */}
                      {task.tags && task.tags.length > 0 && (
                        <div className="flex items-center gap-2 mt-2">
                          {task.tags.slice(0, 3).map((tag, tagIndex) => (
                            <span 
                              key={tagIndex}
                              className={`px-2 py-1 text-xs rounded-full ${
                                isDark ? 'bg-blue-900/20 text-blue-400' : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              #{tag}
                            </span>
                          ))}
                          {task.tags.length > 3 && (
                            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              +{task.tags.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CompletedTasksReview;