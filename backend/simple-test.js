// Simple API endpoint test for Review routes
import axios from 'axios';

const BASE_URL = 'http://localhost:5001';

// Test with sample authorization token
const testToken = 'your-test-token'; // Replace with actual token

axios.defaults.headers.common['Authorization'] = `Bearer ${testToken}`;

async function testReviewAPIs() {
  console.log('🧪 Testing Review API Endpoints...\n');

  const tests = [
    {
      name: 'Weekly Review - Current Week',
      endpoint: '/api/review/weekly',
      method: 'GET'
    },
    {
      name: 'Weekly Review - Last Week', 
      endpoint: '/api/review/weekly?weekOffset=-1',
      method: 'GET'
    },
    {
      name: 'Productivity Insights',
      endpoint: '/api/review/insights',
      method: 'GET'
    },
    {
      name: 'Productivity Trends',
      endpoint: '/api/review/trends?weeks=4',
      method: 'GET'
    },
    {
      name: 'Quick Stats',
      endpoint: '/api/review/quick-stats',
      method: 'GET'
    }
  ];

  let passCount = 0;
  let failCount = 0;

  for (const test of tests) {
    try {
      console.log(`Testing: ${test.name}`);
      const response = await axios.get(`${BASE_URL}${test.endpoint}`);
      
      if (response.data.success) {
        console.log(`✅ PASS - ${test.name}`);
        console.log(`   Status: ${response.status}`);
        console.log(`   Data keys: ${Object.keys(response.data.data || {}).join(', ')}`);
        passCount++;
      } else {
        console.log(`❌ FAIL - ${test.name}: API returned success: false`);
        console.log(`   Message: ${response.data.message}`);
        failCount++;
      }
    } catch (error) {
      console.log(`❌ FAIL - ${test.name}: ${error.message}`);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Response: ${JSON.stringify(error.response.data, null, 2)}`);
      }
      failCount++;
    }
    console.log('');
  }

  console.log('📊 Test Summary:');
  console.log(`✅ Passed: ${passCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📈 Success Rate: ${((passCount / (passCount + failCount)) * 100).toFixed(1)}%`);
}

// Export for manual testing
export { testReviewAPIs };

// Auto-run if called directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  testReviewAPIs().catch(console.error);
}