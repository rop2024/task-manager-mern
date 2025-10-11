import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { TaskProvider } from '../context/TaskContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/layout/Sidebar';
import TaskForm from '../components/tasks/TaskForm';
import TaskList from '../components/tasks/TaskList';
import TaskItem from '../components/tasks/TaskItem';
import TaskStats from '../components/tasks/TaskStats';
import GroupForm from '../components/group/GroupForm';
import CompletedTasksPanel from '../components/tasks/CompletedTasksPanel';

const TasksPage = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
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
  const [taskFormErrors, setTaskFormErrors] = useState({});

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
      setTaskFormErrors({}); // Clear previous errors
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
      
      // Handle validation errors from backend
      if (error.response?.data?.errors) {
        const backendErrors = {};
        error.response.data.errors.forEach(err => {
          if (err.param) {
            backendErrors[err.param] = err.msg;
          } else if (err.field) {
            backendErrors[err.field] = err.message;
          }
        });
        setTaskFormErrors(backendErrors);
      } else if (error.response?.data?.message) {
        setTaskFormErrors({ general: error.response.data.message });
      } else {
        setTaskFormErrors({ general: 'An error occurred while creating the task' });
      }
      
      throw error;
    }
  };

  const handleUpdateTask = async (taskId, taskData) => {
    try {
      setTaskFormErrors({}); // Clear previous errors
      const response = await axios.put(`/api/tasks/${taskId}`, taskData);
      setTasks(prev => prev.map(task => 
        task._id === taskId ? response.data.data : task
      ));
      fetchStats();
      return response.data.data;
    } catch (error) {
      console.error('Error updating task:', error);
      
      // Handle validation errors from backend
      if (error.response?.data?.errors) {
        const backendErrors = {};
        error.response.data.errors.forEach(err => {
          if (err.param) {
            backendErrors[err.param] = err.msg;
          } else if (err.field) {
            backendErrors[err.field] = err.message;
          }
        });
        setTaskFormErrors(backendErrors);
      } else if (error.response?.data?.message) {
        setTaskFormErrors({ general: error.response.data.message });
      } else {
        setTaskFormErrors({ general: 'An error occurred while updating the task' });
      }
      
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
    <TaskProvider>
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
            <header className="mb-8">
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
                    <h1 className={`text-4xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {selectedGroup ? (
                        <div className="flex items-center">
                          <span 
                            className="mr-3 text-3xl"
                            style={{ color: selectedGroup.color }}
                          >
                            {selectedGroup.icon}
                          </span>
                          My Tasks
                        </div>
                      ) : 'My Tasks'}
                    </h1>
                    <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      {selectedGroup 
                        ? `Quickly capture ideas and manage your ${selectedGroup.name} tasks`
                        : 'Quickly capture ideas and manage your tasks'
                      }
                    </p>
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    Dashboard
                  </button>
                  <button
                    onClick={() => navigate('/calendar')}
                    className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Calendar
                  </button>
                  <button
                    onClick={() => navigate('/inbox')}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    Inbox
                  </button>
                </div>
              </div>
              
              {!selectedGroup && (
                <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-yellow-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <p className="text-yellow-800">
                      Select a group from the sidebar to start adding and managing tasks.
                    </p>
                  </div>
                </div>
              )}
            </header>

            {/* Stats */}
            <TaskStats stats={stats} loading={loading} />

            {/* Main Content Area */}
            <main className="space-y-6">
              {selectedGroup ? (
                <TaskList 
                  onTaskEdit={setEditingTask}
                  onTaskRefresh={() => {
                    fetchTasks();
                    fetchStats();
                    fetchGroups();
                  }}
                />
              ) : (
                <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center ${isDark ? 'bg-gray-800' : ''}`}>
                  <div className="text-6xl mb-4">📋</div>
                  <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    No Group Selected
                  </h3>
                  <p className={`mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    Choose a group from the sidebar to view and manage your tasks
                  </p>
                  <button
                    onClick={() => setSidebarVisible(true)}
                    className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Open Sidebar
                  </button>
                </div>
              )}
            </main>
          </div>
        </div>

        {/* Completed Tasks Panel */}
        <CompletedTasksPanel
          isOpen={showCompletedPanel}
          onClose={() => setShowCompletedPanel(false)}
          groupId={selectedGroup?._id}
        />

        {/* Enhanced Edit Task Modal */}
        {editingTask && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800">
                  {editingTask.status === 'draft' 
                    ? 'Complete Draft Task' 
                    : 'Edit Task'
                  }
                </h2>
                <button 
                  onClick={() => setEditingTask(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Close modal"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Modal Content */}
              <div className="p-6">
                <TaskForm
                  task={editingTask}
                  onSave={(updatedTask) => {
                    setEditingTask(null);
                    fetchTasks();
                    fetchStats();
                    fetchGroups();
                    console.log('Task updated:', updatedTask);
                  }}
                  onCancel={() => setEditingTask(null)}
                  groups={groups}
                  selectedGroupId={selectedGroup?._id}
                />
              </div>
            </div>
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
    </TaskProvider>
  );
};

export default TasksPage;