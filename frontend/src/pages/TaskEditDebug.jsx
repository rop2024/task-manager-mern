import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';

const TaskEditDebug = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [task, setTask] = useState(null);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    group: '',
    status: 'pending'
  });

  const addLog = (message, type = 'info') => {
    setLogs(prev => [...prev, { 
      time: new Date().toISOString(), 
      message, 
      type 
    }]);
    console.log(`[TaskEditDebug] ${message}`);
  };

  // Fetch task data
  const fetchTask = async () => {
    try {
      addLog(`Fetching task: ${taskId}`, 'info');
      const response = await axios.get(`/api/tasks/${taskId}`);
      const taskData = response.data.data;
      
      addLog(`Task fetched successfully: ${taskData.title}`, 'success');
      setTask(taskData);
      
      // Update form data
      setFormData({
        title: taskData.title || '',
        description: taskData.description || '',
        priority: taskData.priority || 'medium',
        group: taskData.group?._id || taskData.group || '',
        status: taskData.status || 'pending'
      });
      
      addLog(`Form initialized with: ${JSON.stringify({
        title: taskData.title,
        priority: taskData.priority,
        group: taskData.group?.name || taskData.group,
        status: taskData.status
      })}`, 'info');
      
    } catch (err) {
      addLog(`Error fetching task: ${err.message}`, 'error');
      setError(`Failed to fetch task: ${err.message}`);
    }
  };

  // Fetch groups
  const fetchGroups = async () => {
    try {
      addLog('Fetching groups...', 'info');
      const response = await axios.get('/api/groups');
      setGroups(response.data.data);
      addLog(`Fetched ${response.data.data.length} groups`, 'success');
    } catch (err) {
      addLog(`Error fetching groups: ${err.message}`, 'error');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      addLog('Loading page data...', 'info');
      await Promise.all([fetchTask(), fetchGroups()]);
      setLoading(false);
    };

    loadData();
  }, [taskId]);

  // Handle form changes
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    addLog(`Field changed: ${field} = ${value}`, 'info');
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      addLog('Submitting task update...', 'info');
      addLog(`Payload: ${JSON.stringify(formData)}`, 'info');

      const response = await axios.put(`/api/tasks/${taskId}`, formData);
      
      addLog(`Update successful: ${JSON.stringify(response.data)}`, 'success');
      
      // Navigate back or show success message
      setTimeout(() => {
        navigate('/tasks');
      }, 2000);

    } catch (err) {
      addLog(`Update failed: ${err.message}`, 'error');
      if (err.response?.data) {
        addLog(`Server response: ${JSON.stringify(err.response.data)}`, 'error');
      }
      setError(`Failed to update task: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} p-6`}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
            <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>Loading task data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} p-6`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/tasks')}
            className={`mb-4 px-4 py-2 rounded-lg transition-colors ${
              isDark 
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            ← Back to Tasks
          </button>
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Debug Task Edit: {task?.title}
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Edit Form */}
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
            <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Edit Task
            </h2>

            {error && (
              <div className="mb-4 p-4 bg-red-100 border border-red-200 text-red-800 rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  rows="3"
                />
              </div>

              {/* Priority */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => handleChange('priority', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              {/* Group */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Group
                </label>
                <select
                  value={formData.group}
                  onChange={(e) => handleChange('group', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="">Select a group</option>
                  {groups.map(group => (
                    <option key={group._id} value={group._id}>
                      {group.icon} {group.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="draft">Draft</option>
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={saving}
                className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                  saving
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {saving ? 'Updating...' : 'Update Task'}
              </button>
            </form>
          </div>

          {/* Debug Logs */}
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
            <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Debug Logs
            </h2>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {logs.map((log, index) => (
                <div
                  key={index}
                  className={`p-2 rounded text-sm ${
                    log.type === 'error' 
                      ? 'bg-red-100 text-red-800 border border-red-200'
                      : log.type === 'success'
                      ? 'bg-green-100 text-green-800 border border-green-200'
                      : isDark
                      ? 'bg-gray-700 text-gray-300 border border-gray-600'
                      : 'bg-gray-100 text-gray-700 border border-gray-200'
                  }`}
                >
                  <span className="text-xs opacity-75">
                    {new Date(log.time).toLocaleTimeString()}
                  </span>
                  <br />
                  {log.message}
                </div>
              ))}
            </div>

            {/* Current Form State */}
            <div className="mt-6">
              <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Current Form State
              </h3>
              <pre className={`text-xs p-3 rounded-lg overflow-auto ${
                isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
              }`}>
                {JSON.stringify(formData, null, 2)}
              </pre>
            </div>

            {/* Original Task Data */}
            {task && (
              <div className="mt-4">
                <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Original Task Data
                </h3>
                <pre className={`text-xs p-3 rounded-lg overflow-auto ${
                  isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                }`}>
                  {JSON.stringify(task, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskEditDebug;