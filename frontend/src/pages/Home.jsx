import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Link } from 'react-router-dom';
import axios from 'axios';
import ThemeToggle from '../components/layout/ThemeToggle';

const Home = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [backendData, setBackendData] = useState(null);
  const [healthStatus, setHealthStatus] = useState(null);
  const [loadingHealth, setLoadingHealth] = useState(true);

  // Fetch backend health status
  const fetchHealthStatus = async () => {
    try {
      setLoadingHealth(true);
      const response = await axios.get('/api/health');
      setHealthStatus(response.data);
    } catch (error) {
      setHealthStatus({
        status: 'Error',
        database: 'Disconnected',
        error: error.message
      });
    } finally {
      setLoadingHealth(false);
    }
  };

  // Fetch sample backend data
  const fetchBackendData = async () => {
    try {
      const response = await axios.get('/api/hello');
      setBackendData(response.data);
    } catch (error) {
      console.error('Failed to fetch backend data:', error);
    }
  };

  useEffect(() => {
    fetchHealthStatus();
    fetchBackendData();
  }, []);

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100'} flex items-center justify-center`}>
        <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${isDark ? 'border-blue-400' : 'border-blue-500'}`}></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100'}`}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-end mb-4">
          <ThemeToggle />
        </div>
        {/* Hero Section */}
        <header className="text-center mb-12">
          <h1 className={`text-4xl md:text-6xl font-bold ${isDark ? 'text-white' : 'text-gray-800'} mb-4`}>
            ✓ TaskMaster
          </h1>
          <p className={`text-xl ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Organize your life, one task at a time
          </p>
          <div className="mt-4 flex justify-center gap-2 flex-wrap">
            <span className={`${isDark ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'} px-3 py-1 rounded-full text-sm font-medium`}>
              Simple
            </span>
            <span className={`${isDark ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'} px-3 py-1 rounded-full text-sm font-medium`}>
              Powerful
            </span>
            <span className={`${isDark ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800'} px-3 py-1 rounded-full text-sm font-medium`}>
              Fast
            </span>
            <span className={`${isDark ? 'bg-cyan-900 text-cyan-200' : 'bg-cyan-100 text-cyan-800'} px-3 py-1 rounded-full text-sm font-medium`}>
              Intuitive
            </span>
            <span className={`${isDark ? 'bg-purple-900 text-purple-200' : 'bg-purple-100 text-purple-800'} px-3 py-1 rounded-full text-sm font-medium`}>
              Secure
            </span>
            <span className={`${isDark ? 'bg-pink-900 text-pink-200' : 'bg-pink-100 text-pink-800'} px-3 py-1 rounded-full text-sm font-medium`}>
              Collaborative
            </span>
          </div>
        </header>

        {/* Authentication Status Section */}
        <div className="max-w-4xl mx-auto mb-8">
          {isAuthenticated ? (
            <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
              <div className="text-center">
                <div className="flex justify-center items-center mb-4">
                  <div className="w-4 h-4 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    Welcome back, {user?.name}! 👋
                  </h2>
                </div>
                <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'} mb-6`}>
                  You're successfully authenticated and ready to manage your tasks with groups.
                </p>
                <div className="flex gap-4 justify-center flex-wrap">
                  <Link
                    to="/tasks"
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors inline-block"
                  >
                    Go to Tasks
                  </Link>
                  <Link
                    to="/dashboard"
                    className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors inline-block"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={fetchHealthStatus}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                  >
                    Refresh Status
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
              <div className="text-center">
                <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'} mb-4`}>
                  Get Started with Task Management
                </h2>
                <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'} mb-6`}>
                  Sign up for a new account or sign in to organize your tasks with groups and projects.
                </p>
                <div className="flex gap-4 justify-center flex-wrap">
                  <Link
                    to="/signup"
                    className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                  >
                    Create Account
                  </Link>
                  <Link
                    to="/login"
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                  >
                    Sign In
                  </Link>
                  <button
                    onClick={fetchHealthStatus}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                  >
                    Check Status
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* System Status Section */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'} mb-4`}>
              System Status
            </h2>
            
            {loadingHealth ? (
              <div className="flex items-center justify-center p-4">
                <div className={`animate-spin rounded-full h-6 w-6 border-b-2 ${isDark ? 'border-blue-400' : 'border-blue-500'} mr-3`}></div>
                <span className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Checking system status...</span>
              </div>
            ) : healthStatus ? (
              <div className="grid md:grid-cols-3 gap-4">
                <div className={`p-4 rounded-lg ${
                  healthStatus.status === 'OK' 
                    ? (isDark ? 'bg-green-900 border border-green-700' : 'bg-green-50 border border-green-200') 
                    : (isDark ? 'bg-red-900 border border-red-700' : 'bg-red-50 border border-red-200')
                }`}>
                  <h3 className={`font-semibold mb-2 ${isDark ? 'text-gray-200' : ''}`}>Backend Status</h3>
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-2 ${
                      healthStatus.status === 'OK' ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <span className={isDark ? 'text-gray-300' : ''}>{healthStatus.status || 'Unknown'}</span>
                  </div>
                </div>

                <div className={`p-4 rounded-lg ${
                  healthStatus.database === 'Connected' 
                    ? (isDark ? 'bg-green-900 border border-green-700' : 'bg-green-50 border border-green-200') 
                    : (isDark ? 'bg-red-900 border border-red-700' : 'bg-red-50 border border-red-200')
                }`}>
                  <h3 className={`font-semibold mb-2 ${isDark ? 'text-gray-200' : ''}`}>Database</h3>
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-2 ${
                      healthStatus.database === 'Connected' ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <span className={isDark ? 'text-gray-300' : ''}>{healthStatus.database || 'Disconnected'}</span>
                  </div>
                </div>

                <div className={`${isDark ? 'bg-blue-900 border border-blue-700' : 'bg-blue-50 border border-blue-200'} p-4 rounded-lg`}>
                  <h3 className={`font-semibold mb-2 ${isDark ? 'text-gray-200' : ''}`}>Version</h3>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                    <span className={isDark ? 'text-gray-300' : ''}>{healthStatus.version || '4.0.0'}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className={`${isDark ? 'bg-yellow-900 border border-yellow-700 text-yellow-200' : 'bg-yellow-50 border border-yellow-200 text-yellow-800'} rounded-lg p-4`}>
                <p>Unable to connect to backend service.</p>
              </div>
            )}
          </div>
        </div>

        {/* Backend Connection Test */}
        {backendData && (
          <div className="max-w-4xl mx-auto mb-8">
            <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'} mb-4`}>
                Backend Connection
              </h2>
              <div className={`${isDark ? 'bg-green-900 border-green-700 text-green-200' : 'bg-green-50 border-green-200'} border rounded-lg p-4 mb-4`}>
                <div className="flex items-center">
                  <div className={`${isDark ? 'text-green-300' : 'text-green-500'} mr-3`}>✅</div>
                  <div>
                    <h3 className={`${isDark ? 'text-green-200' : 'text-green-800'} font-semibold`}>Successfully Connected!</h3>
                    <p className={`${isDark ? 'text-green-300' : 'text-green-600'}`}>Frontend and backend are communicating properly</p>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4`}>
                  <h4 className={`font-semibold ${isDark ? 'text-gray-200' : 'text-gray-700'} mb-2`}>Backend Response</h4>
                  <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{backendData.backend}</p>
                </div>

                <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4`}>
                  <h4 className={`font-semibold ${isDark ? 'text-gray-200' : 'text-gray-700'} mb-2`}>Database Response</h4>
                  <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{backendData.database}</p>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                    {new Date(backendData.databaseTimestamp).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className={`${isDark ? 'bg-blue-900 text-blue-300' : 'bg-blue-50 text-blue-600'} rounded-lg p-4 mt-4`}>
                <h4 className={`font-semibold ${isDark ? 'text-blue-200' : 'text-blue-700'} mb-2`}>Status</h4>
                <p>{backendData.status}</p>
              </div>
            </div>
          </div>
        )}

        {/* Features Section */}
        <div className="max-w-4xl mx-auto">
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'} mb-6`}>
              Powerful Features
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className={`border ${isDark ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'} rounded-lg p-4 hover:shadow-md transition-shadow`}>
                <div className={`${isDark ? 'text-blue-400' : 'text-blue-500'} text-lg font-semibold mb-2`}>📁 Task Groups</div>
                <h3 className={`font-semibold ${isDark ? 'text-gray-200' : 'text-gray-700'} mb-2`}>Smart Organization</h3>
                <ul className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'} space-y-1`}>
                  <li>• Create custom groups</li>
                  <li>• Color-coded projects</li>
                  <li>• Icon selection</li>
                  <li>• Task counting</li>
                </ul>
              </div>

              <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="text-green-500 text-lg font-semibold mb-2">� Calendar</div>
                <h3 className="font-semibold text-gray-700 mb-2">Schedule & Plan</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Visual calendar view</li>
                  <li>• Due date tracking</li>
                  <li>• Reminder system</li>
                  <li>• Event scheduling</li>
                </ul>
              </div>

              <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="text-purple-500 text-lg font-semibold mb-2">� Statistics</div>
                <h3 className="font-semibold text-gray-700 mb-2">Track Progress</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Productivity metrics</li>
                  <li>• Completion rates</li>
                  <li>• Performance trends</li>
                  <li>• Visual dashboards</li>
                </ul>
              </div>

              <div className={`border ${isDark ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'} rounded-lg p-4 hover:shadow-md transition-shadow`}>
                <div className={`${isDark ? 'text-yellow-400' : 'text-yellow-500'} text-lg font-semibold mb-2`}>🔐 Secure</div>
                <h3 className={`font-semibold ${isDark ? 'text-gray-200' : 'text-gray-700'} mb-2`}>Data Protection</h3>
                <ul className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'} space-y-1`}>
                  <li>• Modern authentication</li>
                  <li>• Protected private data</li>
                  <li>• Session management</li>
                  <li>• User profiles</li>
                </ul>
              </div>

              <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="text-cyan-500 text-lg font-semibold mb-2">⚡ Task Manager</div>
                <h3 className="font-semibold text-gray-700 mb-2">Stay Organized</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Priority levels</li>
                  <li>• Status tracking</li>
                  <li>• Deadline management</li>
                  <li>• Tag system</li>
                </ul>
              </div>

              <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="text-red-500 text-lg font-semibold mb-2">📱 Responsive</div>
                <h3 className="font-semibold text-gray-700 mb-2">Any Device</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Mobile optimization</li>
                  <li>• Desktop experience</li>
                  <li>• Tablet friendly</li>
                  <li>• Consistent interface</li>
                </ul>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-blue-600">10+</div>
                <div className="text-sm text-blue-800">Features</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-green-600">99.9%</div>
                <div className="text-sm text-green-800">Uptime</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-purple-600">100%</div>
                <div className="text-sm text-purple-800">Secure</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-yellow-600">Free</div>
                <div className="text-sm text-yellow-800">To Start</div>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        {!isAuthenticated && (
          <div className="max-w-4xl mx-auto mt-8 text-center">
            <div className={`${isDark ? 'bg-gradient-to-r from-blue-800 to-purple-900' : 'bg-gradient-to-r from-blue-500 to-purple-600'} rounded-xl shadow-lg p-8 text-white`}>
              <h2 className="text-3xl font-bold mb-4">Ready to Take Control of Your Tasks?</h2>
              <p className="mb-6 opacity-90 text-lg">
                Join thousands of users who are boosting their productivity every day.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  to="/signup"
                  className={`${isDark ? 'bg-gray-800 text-blue-300 hover:bg-gray-700' : 'bg-white text-blue-600 hover:bg-gray-100'} px-8 py-3 rounded-lg font-semibold transition-colors inline-block shadow-md`}
                >
                  Get Started - It's Free
                </Link>
                <Link
                  to="/login"
                  className="bg-transparent text-white border border-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors inline-block"
                >
                  Login to Your Account
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;