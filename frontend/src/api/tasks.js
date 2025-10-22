import axios from 'axios';

const API_URL = '/api/tasks';

// Existing task API methods
export const getTasks = (params = {}) => axios.get(API_URL, { params });
export const createTask = (taskData) => axios.post(API_URL, taskData);
export const updateTask = (id, taskData) => axios.put(`${API_URL}/${id}`, taskData);
export const deleteTask = (id) => axios.delete(`${API_URL}/${id}`);

// New quick add method
export const quickAddTask = (title, description = '') => 
  axios.post(`${API_URL}/quick`, { title, description });

// Get tasks with drafts included
export const getTasksWithDrafts = () => 
  getTasks({ includeDrafts: true });

// Get only draft tasks
export const getDraftTasks = () => 
  getTasks({ status: 'draft' });

// Bulk endpoints
export const parseBulk = (markdown) => axios.post('/api/tasks/bulk/parse', { markdown });
export const uploadBulkFile = (formData) => axios.post('/api/tasks/bulk/upload-file', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const importBulk = (tasks) => axios.post('/api/tasks/bulk/import', { tasks });