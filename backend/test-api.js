import axios from 'axios';

// Set base URL for API requests
const api = axios.create({
  baseURL: 'http://localhost:5000'
});

// Test function to check various endpoints
async function testEndpoints() {
  try {
    // 1. Check server health
    console.log('Checking server health...');
    const healthResponse = await api.get('/api/health');
    console.log('Server health:', healthResponse.data);

    // Test QuickTasks API
    console.log('\nTesting QuickTasks API...');
    
    // Create a new quick task
    console.log('\nCreating new quick task...');
    const newQuickTask = await api.post('/api/quickTasks', {
      title: 'Test Quick Task',
      priority: 'High'
    });
    console.log('Created quick task:', newQuickTask.data);

    // Get all quick tasks
    console.log('\nGetting all quick tasks...');
    const quickTasks = await api.get('/api/quickTasks');
    console.log('Retrieved quick tasks:', quickTasks.data);

    // Convert quick task to main task
    console.log('\nConverting quick task to main task...');
    const convertedTask = await api.post(`/api/quickTasks/${newQuickTask.data._id}/convert`, {
      description: 'Converted from quick task'
    });
    console.log('Converted task:', convertedTask.data);

    // Try to get the deleted quick task (should fail)
    console.log('\nTrying to get deleted quick task...');
    try {
      await api.get(`/api/quickTasks/${newQuickTask.data._id}`);
    } catch (error) {
      console.log('Expected error (task converted):', error.response.status, error.response.data);
    }

    // 2. Try to get groups (will fail without auth)
    console.log('\nTrying to get groups (should fail without auth)...');
    try {
      await api.get('/api/groups');
    } catch (error) {
      console.log('Expected error (no auth):', error.response.status, error.response.data);
    }

    // 3. Try to get tasks with query params (will fail without auth)
    console.log('\nTrying to get tasks (should fail without auth)...');
    try {
      await api.get('/api/tasks?group=123');
    } catch (error) {
      console.log('Expected error (no auth):', error.response.status, error.response.data);
    }

    console.log('\nTesting complete!');
  } catch (error) {
    console.error('Test error:', error);
  }
}

// Run tests
testEndpoints();