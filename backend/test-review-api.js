import axios from 'axios';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Base URL for API testing
const BASE_URL = 'http://localhost:5000';
let authToken = null;

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test user credentials (create or use existing)
const testUser = {
  email: 'test@example.com',
  password: 'testpassword123',
  name: 'Test User'
};

// Login or create test user
async function authenticate() {
  try {
    log('\n🔐 Authenticating test user...', 'cyan');
    
    // Try to login first
    try {
      const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: testUser.email,
        password: testUser.password
      });
      
      if (loginResponse.data.success) {
        authToken = loginResponse.data.token;
        log(`✅ Login successful!`, 'green');
        return;
      }
    } catch (loginError) {
      // User doesn't exist, try to create
      log('⚠️  User not found, creating new test user...', 'yellow');
    }

    // Create new user
    const signupResponse = await axios.post(`${BASE_URL}/api/auth/signup`, testUser);
    
    if (signupResponse.data.success) {
      authToken = signupResponse.data.token;
      log(`✅ User created and logged in successfully!`, 'green');
    } else {
      throw new Error('Failed to create test user');
    }
    
  } catch (error) {
    log(`❌ Authentication failed: ${error.message}`, 'red');
    throw error;
  }
}

// Set up axios default headers
function setupAxios() {
  if (authToken) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
    log('📡 Authorization headers set', 'blue');
  }
}

// Test individual endpoint
async function testEndpoint(name, method, url, params = {}) {
  try {
    log(`\n🧪 Testing ${name}...`, 'cyan');
    
    let response;
    if (method === 'GET') {
      response = await axios.get(`${BASE_URL}${url}`, { params });
    } else if (method === 'POST') {
      response = await axios.post(`${BASE_URL}${url}`, params);
    }
    
    if (response.data.success) {
      log(`✅ ${name} - SUCCESS`, 'green');
      
      // Log data structure summary
      if (response.data.data) {
        const dataKeys = Object.keys(response.data.data);
        log(`   📊 Data keys: ${dataKeys.join(', ')}`, 'blue');
        
        // Show sample data structure for each endpoint
        if (name.includes('Weekly Review')) {
          const stats = response.data.data.stats;
          if (stats) {
            log(`   📈 Stats: ${stats.totalCompleted} completed, ${stats.totalCreated} created`, 'blue');
            log(`   📅 Week: ${response.data.data.weekSummary?.period}`, 'blue');
          }
        } else if (name.includes('Insights')) {
          const insights = response.data.data;
          log(`   💡 Recommendations: ${insights.recommendations?.length || 0}`, 'blue');
          log(`   📊 Trend: ${insights.productivity?.trend}`, 'blue');
        } else if (name.includes('Trends')) {
          const trends = response.data.data.trends;
          log(`   📈 Weeks analyzed: ${trends?.length || 0}`, 'blue');
          log(`   🏆 Average: ${response.data.data.summary?.averageCompletion}`, 'blue');
        } else if (name.includes('Quick Stats')) {
          const stats = response.data.data;
          log(`   ⚡ Completed this week: ${stats.completedThisWeek}`, 'blue');
          log(`   🔥 Streak: ${stats.streak} days`, 'blue');
        }
      }
      
      return { success: true, data: response.data };
    } else {
      log(`❌ ${name} - API returned success: false`, 'red');
      return { success: false, error: response.data.message };
    }
    
  } catch (error) {
    log(`❌ ${name} - ERROR: ${error.message}`, 'red');
    if (error.response?.data) {
      log(`   📄 Response: ${JSON.stringify(error.response.data)}`, 'yellow');
    }
    return { success: false, error: error.message };
  }
}

// Create some test data if needed
async function createTestData() {
  try {
    log('\n📝 Creating test task data...', 'cyan');
    
    // Check if we have any groups first
    const groupsResponse = await axios.get(`${BASE_URL}/api/groups`);
    let groupId = null;
    
    if (groupsResponse.data.data && groupsResponse.data.data.length > 0) {
      groupId = groupsResponse.data.data[0]._id;
      log(`✅ Using existing group: ${groupsResponse.data.data[0].name}`, 'green');
    } else {
      // Create a test group
      const newGroup = await axios.post(`${BASE_URL}/api/groups`, {
        name: 'Test Group',
        color: '#3B82F6',
        icon: '📋'
      });
      groupId = newGroup.data.data._id;
      log(`✅ Created test group`, 'green');
    }
    
    // Create some test tasks with different dates in the current week
    const today = new Date();
    const currentDay = today.getDay();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - currentDay);
    
    const testTasks = [
      {
        title: 'Test Task 1 - High Priority',
        description: 'This is a test task with high priority',
        priority: 'high',
        group: groupId,
        estimatedMinutes: 60,
        status: 'completed'
      },
      {
        title: 'Test Task 2 - Medium Priority',
        description: 'This is a test task with medium priority',
        priority: 'medium',
        group: groupId,
        estimatedMinutes: 30,
        status: 'completed'
      },
      {
        title: 'Test Task 3 - Low Priority',
        description: 'This is a test task with low priority',
        priority: 'low',
        group: groupId,
        estimatedMinutes: 15,
        status: 'completed'
      }
    ];
    
    for (let i = 0; i < testTasks.length; i++) {
      const task = testTasks[i];
      try {
        const taskResponse = await axios.post(`${BASE_URL}/api/tasks`, task);
        
        if (taskResponse.data.success) {
          // Mark task as completed with a date in this week
          const completedDate = new Date(weekStart);
          completedDate.setDate(weekStart.getDate() + i + 1); // Spread across week
          
          await axios.put(`${BASE_URL}/api/tasks/${taskResponse.data.data._id}`, {
            status: 'completed',
            isCompleted: true,
            completedAt: completedDate.toISOString()
          });
          
          log(`✅ Created and completed test task: ${task.title}`, 'green');
        }
      } catch (taskError) {
        log(`⚠️  Task creation warning: ${taskError.message}`, 'yellow');
      }
    }
    
  } catch (error) {
    log(`⚠️  Test data creation warning: ${error.message}`, 'yellow');
    log('   ℹ️  Continuing with existing data...', 'blue');
  }
}

// Main test function
async function runTests() {
  try {
    log('🚀 Starting Review API Tests', 'cyan');
    log('=' * 50, 'cyan');
    
    // Step 1: Authenticate
    await authenticate();
    setupAxios();
    
    // Step 2: Create test data
    await createTestData();
    
    // Step 3: Test all endpoints
    const tests = [
      {
        name: 'Weekly Review (Current Week)',
        method: 'GET',
        url: '/api/review/weekly',
        params: {}
      },
      {
        name: 'Weekly Review (Last Week)',
        method: 'GET',
        url: '/api/review/weekly',
        params: { weekOffset: -1 }
      },
      {
        name: 'Weekly Review (Custom Dates)',
        method: 'GET',
        url: '/api/review/weekly',
        params: {
          startDate: '2025-10-06T00:00:00.000Z',
          endDate: '2025-10-12T23:59:59.999Z'
        }
      },
      {
        name: 'Productivity Insights',
        method: 'GET',
        url: '/api/review/insights',
        params: {}
      },
      {
        name: 'Productivity Insights (Last Week)',
        method: 'GET',
        url: '/api/review/insights',
        params: { weekOffset: -1 }
      },
      {
        name: 'Productivity Trends (4 weeks)',
        method: 'GET',
        url: '/api/review/trends',
        params: { weeks: 4 }
      },
      {
        name: 'Productivity Trends (8 weeks)',
        method: 'GET',
        url: '/api/review/trends',
        params: { weeks: 8 }
      },
      {
        name: 'Quick Stats',
        method: 'GET',
        url: '/api/review/quick-stats',
        params: {}
      }
    ];
    
    const results = [];
    for (const test of tests) {
      const result = await testEndpoint(test.name, test.method, test.url, test.params);
      results.push({ ...test, result });
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Step 4: Summary
    log('\n📊 TEST SUMMARY', 'cyan');
    log('=' * 50, 'cyan');
    
    const successful = results.filter(r => r.result.success).length;
    const failed = results.filter(r => !r.result.success).length;
    
    log(`✅ Successful: ${successful}/${results.length}`, 'green');
    log(`❌ Failed: ${failed}/${results.length}`, failed > 0 ? 'red' : 'green');
    
    if (failed > 0) {
      log('\n❌ Failed Tests:', 'red');
      results.filter(r => !r.result.success).forEach(test => {
        log(`   • ${test.name}: ${test.result.error}`, 'red');
      });
    }
    
    log('\n🎉 Review API testing completed!', 'cyan');
    
  } catch (error) {
    log(`💥 Fatal error: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Input validation tests
async function testValidation() {
  try {
    log('\n🛡️  Testing Input Validation...', 'cyan');
    
    const validationTests = [
      {
        name: 'Invalid Week Offset (too negative)',
        url: '/api/review/weekly',
        params: { weekOffset: -100 }
      },
      {
        name: 'Invalid Week Offset (positive)',
        url: '/api/review/weekly',
        params: { weekOffset: 5 }
      },
      {
        name: 'Invalid Date Format',
        url: '/api/review/weekly',
        params: { startDate: 'invalid-date' }
      },
      {
        name: 'Invalid Trends Weeks (too many)',
        url: '/api/review/trends',
        params: { weeks: 20 }
      }
    ];
    
    for (const test of validationTests) {
      try {
        const response = await axios.get(`${BASE_URL}${test.url}`, { params: test.params });
        if (response.status === 400) {
          log(`✅ ${test.name} - Properly rejected`, 'green');
        } else {
          log(`⚠️  ${test.name} - Should have been rejected but wasn't`, 'yellow');
        }
      } catch (error) {
        if (error.response?.status === 400) {
          log(`✅ ${test.name} - Properly rejected`, 'green');
        } else {
          log(`❌ ${test.name} - Unexpected error: ${error.message}`, 'red');
        }
      }
    }
    
  } catch (error) {
    log(`❌ Validation testing error: ${error.message}`, 'red');
  }
}

// Run all tests
(async () => {
  await runTests();
  await testValidation();
  
  log('\n🏁 All tests completed!', 'cyan');
  process.exit(0);
})();