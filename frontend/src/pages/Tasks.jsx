import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { TaskProvider } from '../context/TaskContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/layout/Sidebar';
import usePageTitle from '../hooks/usePageTitle';
import TaskForm from '../components/tasks/TaskForm';
import TaskList from '../components/tasks/TaskList';
import TaskItem from '../components/tasks/TaskItem';
import TaskStats from '../components/tasks/TaskStats';
import GroupForm from '../components/group/GroupForm';
import CompletedTasksPanel from '../components/tasks/CompletedTasksPanel';
import FloatingAddButton from '../components/ui/FloatingAddButton';

const TasksPage = () => {
  usePageTitle('Tasks');
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
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskFormErrors, setTaskFormErrors] = useState({});
  const [formSubmissionKey, setFormSubmissionKey] = useState(0);
  const [sidebarVisible, setSidebarVisible] = useState(() => {
    const saved = localStorage.getItem('sidebarVisible');
    return saved !== null ? JSON.parse(saved) : true;
  });
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Check if we're on mobile
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  const [activeTab, setActiveTab] = useState('active'); // 'active', 'completed'
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
    if (groups.length >= 0) {  // Changed from > 0 to >= 0 to allow fetching even with no groups
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
        {/* Desktop Sidebar */}
        {!isMobile && sidebarVisible && (
          <div className="w-64 transition-all duration-300 ease-in-out border-r border-gray-200">
            <Sidebar
              groups={groups}
              onGroupCreate={handleCreateGroup}
              onGroupEdit={setEditingGroup}
              selectedGroup={selectedGroup}
              onGroupSelect={setSelectedGroup}
              onGroupDeleted={fetchGroups}
              isMobileOpen={false}
            />
          </div>
        )}

        {/* Mobile Sidebar */}
        {isMobile && (
          <Sidebar
            groups={groups}
            onGroupCreate={handleCreateGroup}
            onGroupEdit={setEditingGroup}
            selectedGroup={selectedGroup}
            onGroupSelect={setSelectedGroup}
            onGroupDeleted={fetchGroups}
            isMobileOpen={isMobileMenuOpen}
            onMobileClose={() => setIsMobileMenuOpen(false)}
          />
        )}



        {/* Fixed Sidebar Toggle (visible only when sidebar is hidden on desktop) */}
        {!isMobile && !sidebarVisible && (
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
          <header className={`flex-shrink-0 ${isDark ? 'bg-gray-800' : 'bg-white'} border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} px-4 lg:px-6 py-4`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {/* Mobile Hamburger Menu */}
                {isMobile ? (
                  <button 
                    onClick={() => setIsMobileMenuOpen(true)}
                    className={`mr-4 p-2 rounded-lg transition-colors flex items-center justify-center
                      ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
                    aria-label="Open Menu"
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                ) : (
                  /* Desktop Sidebar Toggle Button */
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
                )}
                
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
                  {/* Review Button */}
                  <button
                    onClick={() => navigate('/review')}
                    className={`px-4 py-2 rounded-lg font-medium border transition-colors duration-200 
                             flex items-center space-x-2 ${
                      isDark 
                        ? 'border-orange-600 text-orange-400 hover:bg-orange-900/20' 
                        : 'border-orange-500 text-orange-600 hover:bg-orange-50'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span>📊 Review</span>
                  </button>

                  {selectedGroup ? (
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
                  ) : (
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} bg-gray-100 px-3 py-2 rounded-lg`}>
                      Select a group to create tasks
                    </div>
                  )}
                </div>
              </div>
            </header>

            {/* Tab Navigation */}
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
              </div>
            </nav>

            {/* Group Header - Show group details prominently */}
            {selectedGroup && (
              <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} px-6 py-4`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    {/* Group Icon and Basic Info */}
                    <div 
                      className="p-3 rounded-xl text-2xl"
                      style={{ backgroundColor: `${selectedGroup.color}20` }}
                    >
                      {selectedGroup.icon}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {selectedGroup.name}
                        </h2>
                        {selectedGroup.isCompleted && (
                          <div className="flex items-center space-x-1">
                            <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className={`text-sm font-medium ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                              Completed
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {selectedGroup.description && (
                        <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-3`}>
                          {selectedGroup.description}
                        </p>
                      )}

                      {/* End Goal and Expected Date in a row */}
                      {(selectedGroup.endGoal || selectedGroup.expectedDate) && (
                        <div className="flex flex-col lg:flex-row lg:space-x-6 space-y-3 lg:space-y-0">
                          {/* End Goal */}
                          {selectedGroup.endGoal && (
                            <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-3 flex-1`}>
                              <div className="flex items-center space-x-2 mb-1">
                                <svg className={`h-4 w-4 ${isDark ? 'text-blue-400' : 'text-blue-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                </svg>
                                <span className={`text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                  END GOAL
                                </span>
                              </div>
                              <p className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-800'} leading-relaxed`}>
                                {selectedGroup.endGoal}
                              </p>
                            </div>
                          )}

                          {/* Expected Completion Date */}
                          {selectedGroup.expectedDate && (
                            <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-3 lg:w-64`}>
                              <div className="flex items-center space-x-2 mb-1">
                                <svg className={`h-4 w-4 ${isDark ? 'text-green-400' : 'text-green-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className={`text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                  TARGET DATE
                                </span>
                              </div>
                              <p className={`text-sm font-semibold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                                {new Date(selectedGroup.expectedDate).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                              {/* Show days remaining */}
                              {!selectedGroup.isCompleted && (
                                <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                  {(() => {
                                    const today = new Date();
                                    const targetDate = new Date(selectedGroup.expectedDate);
                                    const diffTime = targetDate - today;
                                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                    
                                    if (diffDays > 0) {
                                      return `${diffDays} days remaining`;
                                    } else if (diffDays === 0) {
                                      return 'Due today';
                                    } else {
                                      return `${Math.abs(diffDays)} days overdue`;
                                    }
                                  })()}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setEditingGroup(selectedGroup)}
                      className={`p-2 rounded-lg transition-colors ${
                        isDark 
                          ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' 
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                      }`}
                      title="Edit Group"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Content Area */}
            <div className="flex-1 flex">
              {/* Task Form & List */}
              <div className="flex-1 flex flex-col">
                <div className="flex-1">
                  {/* Show All Tasks header when no group selected */}
                  {!selectedGroup && (
                    <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} px-6 py-4`}>
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">📋</div>
                        <div>
                          <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            All Tasks
                          </h2>
                          <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                            View all your tasks across all groups
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

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
                </div>
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 z-50 overflow-y-auto">
            <div className="min-h-full py-8 flex items-center justify-center">
              <GroupForm
                group={editingGroup}
                onSubmit={(data) => handleUpdateGroup(editingGroup._id, data)}
                onCancel={() => setEditingGroup(null)}
                loading={loading}
              />
            </div>
          </div>
        )}

        {/* Floating Add Button */}
        <FloatingAddButton />
    </TaskProvider>
  );
};

export default TasksPage;