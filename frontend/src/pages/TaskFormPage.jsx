import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import TaskForm from '../components/tasks/TaskForm';
import axios from 'axios';

const TaskFormPage = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { taskId } = useParams();
  const location = useLocation();
  const isDark = theme === 'dark';
  
  const [groups, setGroups] = useState([]);
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Get initial data from navigation state
  const selectedGroupId = location.state?.selectedGroupId;
  const draftData = location.state?.draft;

  // Fetch groups
  const fetchGroups = async () => {
    try {
      const response = await axios.get('/api/groups');
      setGroups(response.data.data);
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  // Fetch task if editing
  const fetchTask = async () => {
    if (taskId) {
      try {
        const response = await axios.get(`/api/tasks/${taskId}`);
        setTask(response.data.data);
      } catch (error) {
        console.error('Error fetching task:', error);
        navigate('/tasks'); // Redirect if task not found
      }
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchGroups();
      if (taskId) {
        await fetchTask();
      }
      setLoading(false);
    };

    loadData();
  }, [taskId]);

  const handleSave = async (taskData) => {
    try {
      if (taskId) {
        // Update existing task
        await axios.put(`/api/tasks/${taskId}`, taskData);
      } else {
        // Create new task
        await axios.post('/api/tasks', taskData);
      }
      
      // Navigate back to tasks page
      navigate('/tasks', { 
        state: { 
          message: taskId ? 'Task updated successfully' : 'Task created successfully',
          groupId: taskData.group 
        }
      });
    } catch (error) {
      console.error('Error saving task:', error);
      throw error; // Let TaskForm handle the error
    }
  };

  const handleCancel = () => {
    navigate(-1); // Go back to previous page
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <header className={`${isDark ? 'bg-gray-800' : 'bg-white'} border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} px-6 py-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleCancel}
              className={`p-2 rounded-lg transition-colors ${
                isDark 
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
              aria-label="Go back"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {taskId ? 'Edit Task' : 'New Task'}
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 max-w-4xl">
        <TaskForm
          task={task}
          draft={draftData}
          onSave={handleSave}
          onCancel={handleCancel}
          groups={groups}
          selectedGroupId={selectedGroupId}
          initialMode="page"
        />
      </main>
    </div>
  );
};

export default TaskFormPage;