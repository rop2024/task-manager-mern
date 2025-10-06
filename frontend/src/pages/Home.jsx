import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Home = () => {
  const { user, isAuthenticated, loading } = useAuth();
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-4">
            🚀 Phase 4
          </h1>
          <p className="text-xl text-gray-600">
            Groups & Projects - Complete!
          </p>
          <div className="mt-4 flex justify-center gap-2 flex-wrap">
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              React 18
            </span>
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              Express
            </span>
            <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
              MongoDB
            </span>
            <span className="bg-cyan-100 text-cyan-800 px-3 py-1 rounded-full text-sm font-medium">
              Tailwind
            </span>
            <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
              JWT Auth
            </span>
            <span className="bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-sm font-medium">
              Groups
            </span>
          </div>
        </header>

        {/* Authentication Status Section */}
        <div className="max-w-4xl mx-auto mb-8">
          {isAuthenticated ? (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="text-center">
                <div className="flex justify-center items-center mb-4">
                  <div className="w-4 h-4 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    Welcome back, {user?.name}! 👋
                  </h2>
                </div>
                <p className="text-gray-600 mb-6">
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
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Get Started with Task Management
                </h2>
                <p className="text-gray-600 mb-6">
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
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              System Status
            </h2>
            
            {loadingHealth ? (
              <div className="flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-3"></div>
                <span className="text-gray-600">Checking system status...</span>
              </div>
            ) : healthStatus ? (
              <div className="grid md:grid-cols-3 gap-4">
                <div className={`p-4 rounded-lg ${
                  healthStatus.status === 'OK' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}>
                  <h3 className="font-semibold mb-2">Backend Status</h3>
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-2 ${
                      healthStatus.status === 'OK' ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <span>{healthStatus.status || 'Unknown'}</span>
                  </div>
                </div>

                <div className={`p-4 rounded-lg ${
                  healthStatus.database === 'Connected' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}>
                  <h3 className="font-semibold mb-2">Database</h3>
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-2 ${
                      healthStatus.database === 'Connected' ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <span>{healthStatus.database || 'Disconnected'}</span>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Version</h3>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                    <span>{healthStatus.version || '4.0.0'}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800">Unable to connect to backend service.</p>
              </div>
            )}
          </div>
        </div>

        {/* Backend Connection Test */}
        {backendData && (
          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Backend Connection
              </h2>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex items-center">
                  <div className="text-green-500 mr-3">✅</div>
                  <div>
                    <h3 className="text-green-800 font-semibold">Successfully Connected!</h3>
                    <p className="text-green-600">Frontend and backend are communicating properly</p>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-700 mb-2">Backend Response</h4>
                  <p className="text-gray-600">{backendData.backend}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-700 mb-2">Database Response</h4>
                  <p className="text-gray-600">{backendData.database}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(backendData.databaseTimestamp).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 mt-4">
                <h4 className="font-semibold text-blue-700 mb-2">Status</h4>
                <p className="text-blue-600">{backendData.status}</p>
              </div>
            </div>
          </div>
        )}

        {/* Features Section */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Phase 4 Features
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="text-blue-500 text-lg font-semibold mb-2">📁 Groups</div>
                <h3 className="font-semibold text-gray-700 mb-2">Project Organization</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Create custom groups</li>
                  <li>• Color-coded projects</li>
                  <li>• Icon selection</li>
                  <li>• Task counting</li>
                </ul>
              </div>

              <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="text-green-500 text-lg font-semibold mb-2">🚀 Sidebar</div>
                <h3 className="font-semibold text-gray-700 mb-2">Easy Navigation</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Group management</li>
                  <li>• Quick task access</li>
                  <li>• Visual indicators</li>
                  <li>• Responsive design</li>
                </ul>
              </div>

              <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="text-purple-500 text-lg font-semibold mb-2">🔄 Move Tasks</div>
                <h3 className="font-semibold text-gray-700 mb-2">Flexible Organization</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Move between groups</li>
                  <li>• Bulk task movement</li>
                  <li>• Real-time updates</li>
                  <li>• Group-specific stats</li>
                </ul>
              </div>

              <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="text-yellow-500 text-lg font-semibold mb-2">🔐 Security</div>
                <h3 className="font-semibold text-gray-700 mb-2">Authentication</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• JWT token management</li>
                  <li>• Protected routes</li>
                  <li>• Session persistence</li>
                  <li>• User profiles</li>
                </ul>
              </div>

              <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="text-cyan-500 text-lg font-semibold mb-2">⚡ CRUD</div>
                <h3 className="font-semibold text-gray-700 mb-2">Task Management</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Create, read, update tasks</li>
                  <li>• Status tracking</li>
                  <li>• Priority levels</li>
                  <li>• Due dates & tags</li>
                </ul>
              </div>

              <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="text-red-500 text-lg font-semibold mb-2">📱 UX</div>
                <h3 className="font-semibold text-gray-700 mb-2">User Experience</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Loading states</li>
                  <li>• Error handling</li>
                  <li>• Form validation</li>
                  <li>• Mobile responsive</li>
                </ul>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-blue-600">4</div>
                <div className="text-sm text-blue-800">Phases</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-green-600">10+</div>
                <div className="text-sm text-green-800">API Routes</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-purple-600">100%</div>
                <div className="text-sm text-purple-800">Auth Coverage</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-yellow-600">✓</div>
                <div className="text-sm text-yellow-800">Groups Ready</div>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        {!isAuthenticated && (
          <div className="max-w-4xl mx-auto mt-8 text-center">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg p-8 text-white">
              <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
              <p className="mb-6 opacity-90">
                Join thousands of users who are already organizing their tasks efficiently with groups and projects.
              </p>
              <Link
                to="/signup"
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-block"
              >
                Create Your Account Now
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;