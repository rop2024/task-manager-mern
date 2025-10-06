import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import Sidebar from '../components/layout/Sidebar';
import TaskForm from '../components/tasks/TaskForm';
import TaskItem from '../components/tasks/TaskItem';
import TaskStats from '../components/tasks/TaskStats';
import GroupForm from '../components/group/GroupForm';
import CompletedTasksPanel from '../components/tasks/CompletedTasksPanel';

const Tasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [stats, setStats] = useState({ total: 0, pending: 0, 'in-progress': 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editingGroup, setEditingGroup] = useState(null);
  const [showCompletedPanel, setShowCompletedPanel] = useState(false);
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    search: ''
  });

  // Fetch groups
  const fetchGroups = async () => {
    try {
      const response = await axios.get('/api/groups');
      setGroups(response.data.data);
      
      if (!selectedGroup && response.data.data.length > 0) {
        setSelectedGroup(response.data.data[0]);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  // Fetch tasks
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.priority) params.append('priority', filters.priority);
      if (selectedGroup) params.append('group', selectedGroup._id);
      params.append('includeCompleted', showCompletedTasks.toString());
      
      const response = await axios.get(`/api/tasks?${params}`);
      setTasks(response.data.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      let url = '/api/tasks/stats';
      if (selectedGroup) {
        url = `/api/groups/${selectedGroup._id}/stats`;
      }
      
      const response = await axios.get(url);
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    if (groups.length > 0) {
      fetchTasks();
      fetchStats();
    }
  }, [selectedGroup, filters.status, filters.priority, groups.length, showCompletedTasks]);

  // Toggle task completion
  const handleToggleComplete = async (taskId) => {
    try {
      const response = await axios.post(`/api/completed/${taskId}/toggle`);
      const updatedTask = response.data.data;
      
      // Update local state
      setTasks(prev => prev.map(task => 
        task._id === taskId ? updatedTask : task
      ));
      
      fetchStats();
      fetchGroups(); // Refresh groups to update task counts
    } catch (error) {
      console.error('Error toggling task completion:', error);
      throw error;
    }
  };

  // Handler functions
  const handleCreateGroup = async (groupData) => {
    try {
      const response = await axios.post('/api/groups', groupData);
      setGroups(prev => [...prev, response.data.data]);
      setSelectedGroup(response.data.data);
      return response.data.data;
    } catch (error) {
      console.error('Error creating group:', error);
      throw error;
    }
  };

  const handleUpdateGroup = async (groupId, groupData) => {
    try {
      const response = await axios.put(`/api/groups/${groupId}`, groupData);
      setGroups(prev => prev.map(group => 
        group._id === groupId ? response.data.data : group
      ));
      if (selectedGroup && selectedGroup._id === groupId) {
        setSelectedGroup(response.data.data);
      }
      setEditingGroup(null);
      return response.data.data;
    } catch (error) {
      console.error('Error updating group:', error);
      throw error;
    }
  };

  const handleCreateTask = async (taskData) => {
    try {
      const response = await axios.post('/api/tasks', {
        ...taskData,
        group: selectedGroup._id
      });
      setTasks(prev => [...prev, response.data.data]);
      fetchStats();
      setShowTaskForm(false);
      return response.data.data;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await axios.delete(`/api/tasks/${taskId}`);
      setTasks(prev => prev.filter(task => task._id !== taskId));
      fetchStats();
      return true;
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const response = await axios.put(`/api/tasks/${taskId}/status`, { status: newStatus });
      setTasks(prev => prev.map(task => 
        task._id === taskId ? response.data.data : task
      ));
      fetchStats();
      return response.data.data;
    } catch (error) {
      console.error('Error updating task status:', error);
      throw error;
    }
  };

  const handleMoveTask = async (taskId, newGroupId) => {
    try {
      const response = await axios.put(`/api/tasks/${taskId}/move`, { group: newGroupId });
      // Remove from local state if moved to another group
      if (selectedGroup && selectedGroup._id !== newGroupId) {
        setTasks(prev => prev.filter(task => task._id !== taskId));
      } else {
        setTasks(prev => prev.map(task => 
          task._id === taskId ? response.data.data : task
        ));
      }
      fetchStats();
      return response.data.data;
    } catch (error) {
      console.error('Error moving task:', error);
      throw error;
    }
  };

  // Filter tasks based on search
  const filteredTasks = tasks.filter(task => 
    task.title.toLowerCase().includes(filters.search.toLowerCase()) ||
    (task.description && task.description.toLowerCase().includes(filters.search.toLowerCase()))
  );

  // Count completed tasks
  const completedCount = tasks.filter(task => task.status === 'completed').length;
  const activeCount = tasks.length - completedCount;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        groups={groups}
        onGroupCreate={handleCreateGroup}
        onGroupEdit={setEditingGroup}
        selectedGroup={selectedGroup}
        onGroupSelect={setSelectedGroup}
      />

      {/* Main Content */}
      <div className="flex-1 ml-64">
        <div className="py-8 px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {selectedGroup ? (
                    <div className="flex items-center">
                      <span 
                        className="mr-3 text-2xl"
                        style={{ color: selectedGroup.color }}
                      >
                        {selectedGroup.icon}
                      </span>
                      {selectedGroup.name}
                    </div>
                  ) : 'All Tasks'}
                </h1>
                <p className="text-gray-600 mt-2">
                  {selectedGroup?.description || 'Manage all your tasks across all groups'}
                  {selectedGroup && ` (${activeCount} active, ${completedCount} completed)`}
                </p>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowCompletedPanel(true)}
                  className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Completed ({completedCount})
                </button>
                <button
                  onClick={() => setShowTaskForm(true)}
                  disabled={!selectedGroup}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-semibold transition-colors flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Task
                </button>
              </div>
            </div>
            
            {!selectedGroup && (
              <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800">
                  Select a group from the sidebar to start adding tasks.
                </p>
              </div>
            )}
          </div>

          {/* Stats */}
          <TaskStats stats={stats} loading={loading} />

          {/* Filters and Actions */}
          {selectedGroup && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    {showCompletedTasks && <option value="completed">Completed</option>}
                  </select>

                  <select
                    value={filters.priority}
                    onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Priority</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>

                  {/* Show Completed Toggle */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="showCompleted"
                      checked={showCompletedTasks}
                      onChange={(e) => setShowCompletedTasks(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="showCompleted" className="ml-2 block text-sm text-gray-700">
                      Show Completed
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ... existing modals and task grid ... */}

          {/* Task Items */}
          {filteredTasks.map(task => (
            <TaskItem
              key={task._id}
              task={task}
              onEdit={setEditingTask}
              onDelete={handleDeleteTask}
              onStatusChange={handleStatusChange}
              onMoveTask={handleMoveTask}
              onToggleComplete={handleToggleComplete}
              groups={groups}
            />
          ))}

        </div>
      </div>

      {/* Completed Tasks Panel */}
      <CompletedTasksPanel
        isOpen={showCompletedPanel}
        onClose={() => setShowCompletedPanel(false)}
        groupId={selectedGroup?._id}
      />

      {/* ... existing modals ... */}
    </div>
  );
};

export default Tasks;