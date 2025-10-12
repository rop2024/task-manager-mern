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
import FloatingAddButton from '../components/ui/FloatingAddButton';
import DraftsList from '../components/tasks/DraftsList';

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
  const [editingGroup, setEditingGroup] = useState(null);
  const [showCompletedPanel, setShowCompletedPanel] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(() => {
    const saved = localStorage.getItem('sidebarVisible');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [activeTab, setActiveTab] = useState('active'); // 'active', 'completed', 'drafts'
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
      // Always include completed tasks since we have separate tabs
      params.append('includeCompleted', 'true');
      
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
  }, [selectedGroup, filters.status, filters.priority, groups.length]);

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
      setTasks(prev => [response.data.data, ...prev]);
      fetchStats();
      setShowTaskForm(false);
      setFormSubmissionKey(prev => prev + 1); // Refresh form for next creation
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
      <div className={`flex h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        {/* Sidebar */}
        {sidebarVisible && (
          <div className="w-64 transition-all duration-300 ease-in-out border-r border-gray-200">
            <Sidebar
              groups={groups}
              onGroupCreate={handleCreateGroup}
              onGroupEdit={setEditingGroup}
              selectedGroup={selectedGroup}
              onGroupSelect={setSelectedGroup}
              onGroupDeleted={fetchGroups}
            />
          </div>
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

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className={`flex-shrink-0 ${isDark ? 'bg-gray-800' : 'bg-white'} border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} px-6 py-4`}>
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
                  <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Tasks
                  </h1>
                  <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'} mt-1`}>
                    Manage your tasks and track your productivity
                  </p>
                </div>
              </div>
                
                <div className="flex items-center space-x-3">
                  {selectedGroup && (
                    <button
                      onClick={() => navigate('/tasks/new', { 
                        state: { selectedGroupId: selectedGroup._id } 
                      })}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium 
                               hover:bg-blue-700 transition-colors duration-200 
                               flex items-center space-x-2"
                    >
                      <span>+ New Task</span>
                    </button>
                  )}
                </div>
              </div>
            </header>

            {/* Tab Navigation */}
            {selectedGroup && (
              <nav className={`flex-shrink-0 ${isDark ? 'bg-gray-800' : 'bg-white'} border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} px-6`}>
                <div className="flex space-x-8">
                  <button
                    onClick={() => setActiveTab('active')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'active'
                        ? isDark
                          ? 'border-blue-400 text-blue-300'
                          : 'border-blue-500 text-blue-600'
                        : isDark
                          ? 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Active Tasks
                    {activeCount > 0 && (
                      <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                        activeTab === 'active'
                          ? isDark ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-600'
                          : isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {activeCount}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => setActiveTab('completed')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'completed'
                        ? isDark
                          ? 'border-green-400 text-green-300'
                          : 'border-green-500 text-green-600'
                        : isDark
                          ? 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Completed
                    {completedCount > 0 && (
                      <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                        activeTab === 'completed'
                          ? isDark ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-600'
                          : isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {completedCount}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => setActiveTab('drafts')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'drafts'
                        ? isDark
                          ? 'border-purple-400 text-purple-300'
                          : 'border-purple-500 text-purple-600'
                        : isDark
                          ? 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Drafts
                    <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                      activeTab === 'drafts'
                        ? isDark ? 'bg-purple-900 text-purple-200' : 'bg-purple-100 text-purple-600'
                        : isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                    }`}>
                      New
                    </span>
                  </button>
                </div>
              </nav>
            )}

            {/* Content Area */}
            <div className="flex-1 flex">
              {/* Task Form & List */}
              <div className="flex-1 flex flex-col">
                {selectedGroup ? (
                  <div className="flex-1">
                    {/* Stats - show for active and completed tabs */}
                    {(activeTab === 'active' || activeTab === 'completed') && (
                      <TaskStats stats={stats} loading={loading} />
                    )}
                    
                    {/* Active Tasks */}
                    {activeTab === 'active' && (
                      <TaskList
                        tasks={tasks.filter(task => task.status !== 'completed')}
                        onTasksChange={setTasks}
                        onTaskEdit={(task) => navigate(`/tasks/edit/${task._id}`)}
                        onTaskRefresh={() => {
                          fetchTasks();
                          fetchStats();
                          fetchGroups();
                        }}
                      />
                    )}

                    {/* Completed Tasks */}
                    {activeTab === 'completed' && (
                      <TaskList
                        tasks={tasks.filter(task => task.status === 'completed')}
                        onTasksChange={setTasks}
                        onTaskEdit={(task) => navigate(`/tasks/edit/${task._id}`)}
                        onTaskRefresh={() => {
                          fetchTasks();
                          fetchStats();
                          fetchGroups();
                        }}
                        showCompleted={true}
                      />
                    )}

                    {/* Drafts */}
                    {activeTab === 'drafts' && (
                      <DraftsList
                        onDraftPromoted={() => {
                          fetchTasks();
                          fetchStats();
                          fetchGroups();
                        }}
                      />
                    )}
                  </div>
                ) : (
                  <div className={`flex-1 ${isDark ? 'bg-gray-800' : 'bg-white'} p-12 text-center`}>
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
              </div>
            </div>
          </div>
        </div>

        {/* Completed Tasks Panel */}
        <CompletedTasksPanel
          isOpen={showCompletedPanel}
          onClose={() => setShowCompletedPanel(false)}
          groupId={selectedGroup?._id}
        />

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

        {/* Floating Add Button */}
        <FloatingAddButton />
    </TaskProvider>
  );
};

export default TasksPage;