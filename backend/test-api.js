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