import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CompletedTasksPanel = ({ isOpen, onClose, groupId }) => {
  const [completedTasks, setCompletedTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({});
  const [daysFilter, setDaysFilter] = useState(7);

  const fetchCompletedTasks = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        daysAgo: daysFilter.toString()
      });
      
      if (groupId) {
        params.append('group', groupId);
      }

      const response = await axios.get(`/api/completed?${params}`);
      setCompletedTasks(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching completed tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCompletedTasks();
    }
  }, [isOpen, groupId, daysFilter]);

  const handleReviveTask = async (taskId) => {
    try {
      await axios.post(`/api/completed/${taskId}/revive`);
      // Remove from local state
      setCompletedTasks(prev => prev.filter(task => task._id !== taskId));
    } catch (error) {
      console.error('Error reviving task:', error);
      alert('Error reviving task: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleBulkRevive = async () => {
    if (!completedTasks.length) return;
    
    try {
      const taskIds = completedTasks.map(task => task._id);
      await axios.post('/api/completed/bulk-revive', { taskIds });
      setCompletedTasks([]);
      onClose();
    } catch (error) {
      console.error('Error bulk reviving tasks:', error);
      alert('Error reviving tasks: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleCleanup = async () => {
    if (!window.confirm('Are you sure you want to permanently delete all completed tasks older than 30 days? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.delete('/api/completed/cleanup?daysOld=30');
      fetchCompletedTasks(); // Refresh the list
      alert('Old completed tasks cleaned up successfully');
    } catch (error) {
      console.error('Error cleaning up tasks:', error);
      alert('Error cleaning up tasks: ' + (error.response?.data?.message || error.message));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Completed Tasks</h2>
            <p className="text-gray-600 mt-1">
              {groupId ? 'Tasks completed in this group' : 'All completed tasks'}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {/* Days Filter */}
            <select
              value={daysFilter}
              onChange={(e) => setDaysFilter(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
              <option value={365}>Last year</option>
              <option value={0}>All time</option>
            </select>

            <button
              onClick={handleBulkRevive}
              disabled={completedTasks.length === 0}
              className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Revive All
            </button>
            <button
              onClick={handleCleanup}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Cleanup
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-2 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : completedTasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No Completed Tasks</h3>
              <p className="text-gray-600">Tasks you complete will appear here for review.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {completedTasks.map(task => (
                <div
                  key={task._id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <div className={`w-3 h-3 rounded-full bg-green-500`}></div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-800 line-through">{task.title}</h4>
                      <div className="flex items-center space-x-3 text-sm text-gray-500 mt-1">
                        <span>Completed: {new Date(task.completedAt).toLocaleDateString()}</span>
                        {task.group && (
                          <span className="flex items-center">
                            <span 
                              className="w-2 h-2 rounded-full mr-1"
                              style={{ backgroundColor: task.group.color }}
                            ></span>
                            {task.group.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleReviveTask(task._id)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      Revive
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-6">
              <button
                onClick={() => fetchCompletedTasks(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => fetchCompletedTasks(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompletedTasksPanel;