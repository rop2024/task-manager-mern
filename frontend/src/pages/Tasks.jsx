import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { TaskProvider } from '../context/TaskContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/layout/Sidebar';
import InboxSidebar from '../components/inbox/InboxSidebar';
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeView, setActiveView] = useState('tasks'); // 'tasks' or 'inbox'
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    search: ''
  });
  const [taskFormErrors, setTaskFormErrors] = useState({});
  const [formSubmissionKey, setFormSubmissionKey] = useState(0);

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

  // Handle new task creation
  const handleTaskCreated = (newTask) => {
    setTasks(prev => [newTask, ...prev]);
    setShowTaskForm(false);
    // Refresh form for next creation
    setFormSubmissionKey(prev => prev + 1);
  };

  // Handle task form cancellation
  const handleCancelTask = () => {
    setShowTaskForm(false);
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
        {sidebarVisible && !sidebarCollapsed && (
          <div className={`
            transition-all duration-300 ease-in-out border-r border-gray-200
            ${activeView === 'tasks' ? 'w-64' : 'w-80'}
          `}>
            {activeView === 'tasks' ? (
              <Sidebar
                groups={groups}
                onGroupCreate={handleCreateGroup}
                onGroupEdit={setEditingGroup}
                selectedGroup={selectedGroup}
                onGroupSelect={setSelectedGroup}
                onGroupDeleted={fetchGroups}
              />
            ) : (
              <InboxSidebar />
            )}
          </div>
        )}

        {/* Collapse/Expand Button */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className={`
            fixed z-20 bg-white border border-gray-300 rounded-lg p-2 shadow-sm 
            hover:shadow-md transition-all duration-200 hover:bg-gray-50
            ${sidebarCollapsed || !sidebarVisible ? 'top-4 left-4' : `top-4 ${activeView === 'tasks' ? 'left-60' : 'left-76'}`}
          `}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <div className={`transform transition-transform ${sidebarCollapsed ? 'rotate-0' : 'rotate-180'}`}>
            ←
          </div>
        </button>

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
                    {activeView === 'inbox' ? 'Inbox' : 'Tasks'}
                  </h1>
                  <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'} mt-1`}>
                    {activeView === 'inbox'
                      ? 'Capture and organize your ideas before turning them into tasks'
                      : 'Manage your tasks and refer to inbox items for ideas'
                    }
                  </p>
                </div>
              </div>
                
                <div className="flex items-center space-x-3">
                  {/* View Toggle Buttons */}
                  <div className={`flex ${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg p-1 mr-4`}>
                    <button
                      onClick={() => setActiveView('tasks')}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                        activeView === 'tasks'
                          ? isDark 
                            ? 'bg-gray-600 text-blue-300 shadow-sm'
                            : 'bg-white text-blue-600 shadow-sm'
                          : isDark
                            ? 'text-gray-300 hover:text-white'
                            : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Tasks
                    </button>
                    <button
                      onClick={() => setActiveView('inbox')}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                        activeView === 'inbox'
                          ? isDark 
                            ? 'bg-gray-600 text-blue-300 shadow-sm'
                            : 'bg-white text-blue-600 shadow-sm'
                          : isDark
                            ? 'text-gray-300 hover:text-white'
                            : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Inbox
                    </button>
                  </div>

                  {activeView === 'tasks' && selectedGroup && (
                    <button
                      onClick={() => setShowTaskForm(true)}
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
              
            {/* Task Creation Hint Banner */}
            {!sidebarCollapsed && sidebarVisible && activeView === 'inbox' && (
              <div className={`flex-shrink-0 ${isDark ? 'bg-blue-900' : 'bg-blue-50'} border-b ${isDark ? 'border-blue-800' : 'border-blue-200'} px-6 py-3`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`${isDark ? 'bg-blue-800' : 'bg-blue-100'} p-1 rounded`}>
                      <svg className={`h-4 w-4 ${isDark ? 'text-blue-300' : 'text-blue-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <p className={`text-sm ${isDark ? 'text-blue-200' : 'text-blue-800'}`}>
                      <strong>Pro Tip:</strong> Refer to your inbox list for quick ideas → delete when done.
                    </p>
                  </div>
                  <button 
                    onClick={() => setSidebarCollapsed(true)}
                    className={`${isDark ? 'text-blue-300 hover:text-blue-100' : 'text-blue-600 hover:text-blue-800'} text-sm font-medium`}
                  >
                    Hide sidebar
                  </button>
                </div>
              </div>
            )}

            {/* Content Area */}
            <div className="flex-1 flex">
              {/* Task Form & List */}
              <div className="flex-1 flex flex-col">
                {showTaskForm ? (
                  <div className={`flex-1 ${isDark ? 'bg-gray-800' : 'bg-white'} border-r ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className="max-w-2xl mx-auto p-6">
                      <div className="mb-6">
                        <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Create New Task</h2>
                        <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'} mt-1`}>
                          Add a new task to your list. Don't forget to check your inbox for inspiration!
                        </p>
                      </div>
                      
                      <TaskForm 
                        key={formSubmissionKey}
                        onTaskCreated={handleTaskCreated}
                        onCancel={handleCancelTask}
                        groups={groups}
                        selectedGroupId={selectedGroup?._id}
                      />
                    </div>
                  </div>
                ) : activeView === 'inbox' ? (
                  <div className={`flex-1 ${isDark ? 'bg-gray-800' : 'bg-white'} p-12 text-center`}>
                    <div className="text-6xl mb-4">📥</div>
                    <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      Inbox View
                    </h3>
                    <p className={`mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      Inbox functionality will be integrated here. Use the sidebar to manage your inbox items.
                    </p>
                  </div>
                ) : selectedGroup ? (
                  <div className="flex-1">
                    <TaskStats stats={stats} loading={loading} />
                    <TaskList
                      tasks={tasks}
                      onTasksChange={setTasks}
                      onTaskEdit={setEditingTask}
                      onTaskRefresh={() => {
                        fetchTasks();
                        fetchStats();
                        fetchGroups();
                      }}
                    />
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

              {/* Quick Inbox Preview (when sidebar is collapsed) */}
              {sidebarCollapsed && sidebarVisible && (
                <div className={`w-64 ${isDark ? 'bg-gray-800' : 'bg-white'} border-l ${isDark ? 'border-gray-700' : 'border-gray-200'} flex flex-col`}>
                  <div className={`flex-shrink-0 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} p-4`}>
                    <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'} text-sm`}>Inbox Preview</h3>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1`}>Recent items for reference</p>
                  </div>
                  
                  <div className="flex-1 p-4">
                    <div className="text-center py-8">
                      <svg className={`h-8 w-8 ${isDark ? 'text-gray-600' : 'text-gray-300'} mx-auto mb-2`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-4`}>
                        Inbox sidebar is collapsed
                      </p>
                      <button
                        onClick={() => setSidebarCollapsed(false)}
                        className={`${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'} text-sm font-medium`}
                      >
                        Show Inbox →
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
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
            <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
              {/* Modal Header */}
              <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  {editingTask.status === 'draft' 
                    ? 'Complete Draft Task' 
                    : 'Edit Task'
                  }
                </h2>
                <button 
                  onClick={() => setEditingTask(null)}
                  className={`p-2 ${isDark ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'} rounded-lg transition-colors`}
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
    </TaskProvider>
  );
};

export default TasksPage;