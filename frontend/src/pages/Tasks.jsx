import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';
import Sidebar from '../components/layout/Sidebar';
import TaskForm from '../components/tasks/TaskForm';
import TaskItem from '../components/tasks/TaskItem';
import TaskStats from '../components/tasks/TaskStats';
import GroupForm from '../components/group/GroupForm';
import CompletedTasksPanel from '../components/tasks/CompletedTasksPanel';

const Tasks = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
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
  const [sidebarVisible, setSidebarVisible] = useState(() => {
    const saved = localStorage.getItem('sidebarVisible');
    return saved !== null ? JSON.parse(saved) : true;
  });
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
      } else if (selectedGroup && !response.data.data.find(g => g._id === selectedGroup._id)) {
        // If the currently selected group no longer exists (e.g., was deleted)
        setSelectedGroup(response.data.data.length > 0 ? response.data.data[0] : null);
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

  const handleUpdateTask = async (taskId, taskData) => {
    try {
      const response = await axios.put(`/api/tasks/${taskId}`, taskData);
      setTasks(prev => prev.map(task => 
        task._id === taskId ? response.data.data : task
      ));
      fetchStats();
      return response.data.data;
    } catch (error) {
      console.error('Error updating task:', error);
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
      const response = await axios.put(`/api/tasks/${taskId}`, { status: newStatus });
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
    <div className={`flex min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Sidebar */}
      {sidebarVisible && (
        <Sidebar
          groups={groups}
          onGroupCreate={handleCreateGroup}
          onGroupEdit={setEditingGroup}
          selectedGroup={selectedGroup}
          onGroupSelect={setSelectedGroup}
          onGroupDeleted={fetchGroups}
        />
      )}

      {/* Fixed Sidebar Toggle (visible only when sidebar is hidden) */}
      {!sidebarVisible && (
        <button
          onClick={() => {
            setSidebarVisible(true);
            localStorage.setItem('sidebarVisible', 'true');
          }}
          className={`fixed left-0 top-1/2 transform -translate-y-1/2 p-2 rounded-r-lg shadow-md transition-colors z-20
            ${isDark ? 'bg-blue-800 text-blue-100 hover:bg-blue-700' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
          title="Show Sidebar"
          aria-label="Show Sidebar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      )}

      {/* Main Content */}
      <div className={`flex-1 ${sidebarVisible ? 'ml-64' : 'ml-0'} transition-all duration-300`}>
        <div className="py-8 px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {/* Sidebar Toggle Button */}
                <button 
                  onClick={() => {
                    const newValue = !sidebarVisible;
                    setSidebarVisible(newValue);
                    localStorage.setItem('sidebarVisible', JSON.stringify(newValue));
                  }}
                  className={`mr-4 p-2 rounded-lg transition-colors flex items-center justify-center
                    ${isDark 
                      ? sidebarVisible 
                        ? 'bg-blue-900 text-blue-300 border border-blue-800' 
                        : 'border border-gray-700 text-gray-300 hover:bg-gray-800' 
                      : sidebarVisible 
                        ? 'bg-blue-50 text-blue-600 border border-blue-200' 
                        : 'border border-gray-300 text-gray-700 hover:bg-gray-100'
                    }`}
                  aria-label={sidebarVisible ? "Hide Sidebar" : "Show Sidebar"}
                  title={sidebarVisible ? "Hide Sidebar" : "Show Sidebar"}
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className={`h-5 w-5 transition-transform duration-300 ${sidebarVisible ? 'rotate-0' : 'rotate-180'}`} 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
                
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

      {/* Task Form Modal */}
      {showTaskForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <TaskForm
            onSubmit={handleCreateTask}
            onCancel={() => setShowTaskForm(false)}
            loading={loading}
            groups={groups}
            selectedGroupId={selectedGroup?._id}
          />
        </div>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <TaskForm
            task={editingTask}
            onSubmit={(updatedData) => {
              handleUpdateTask(editingTask._id, updatedData);
              setEditingTask(null);
            }}
            onCancel={() => setEditingTask(null)}
            loading={loading}
            groups={groups}
          />
        </div>
      )}

      {/* Edit Group Modal */}
      {editingGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <GroupForm
            group={editingGroup}
            onSubmit={(data) => handleUpdateGroup(editingGroup._id, data)}
            onCancel={() => setEditingGroup(null)}
            loading={loading}
          />
        </div>
      )}
    </div>
  );
};

export default Tasks;