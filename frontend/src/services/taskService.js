import axios from 'axios';

const API_BASE = '/api';

export const taskService = {
  // Create a new task
  async createTask(taskData) {
    const response = await axios.post(`${API_BASE}/tasks`, taskData);
    return response.data;
  },

  // Get all tasks
  async getTasks() {
    const response = await axios.get(`${API_BASE}/tasks`);
    return response.data;
  },

  // Update a task
  async updateTask(taskId, updates) {
    const response = await axios.put(`${API_BASE}/tasks/${taskId}`, updates);
    return response.data;
  },

  // Complete a task
  async completeTask(taskId) {
    const response = await axios.put(`${API_BASE}/tasks/${taskId}/complete`);
    return response.data;
  },

  // Delete a task
  async deleteTask(taskId) {
    const response = await axios.delete(`${API_BASE}/tasks/${taskId}`);
    return response.data;
  }
};