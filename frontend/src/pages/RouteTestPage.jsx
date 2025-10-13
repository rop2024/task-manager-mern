import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const RouteTestPage = () => {
  const { isAuthenticated } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const routes = [
    // Public routes
    { path: '/', label: 'Landing Page', auth: false },
    { path: '/home', label: 'Home Page', auth: false },
    { path: '/login', label: 'Login', auth: false },
    { path: '/signup', label: 'Signup', auth: false },
    
    // Protected routes
    { path: '/dashboard', label: 'Dashboard', auth: true },
    { path: '/tasks', label: 'Tasks (plural)', auth: true },
    { path: '/tasks/new', label: 'New Task (tasks/new)', auth: true },
    { path: '/task/new', label: 'New Task (task/new) - THE ROUTE YOU WANT', auth: true, highlight: true },
    { path: '/calendar', label: 'Calendar', auth: true },
    { path: '/inbox', label: 'Inbox', auth: true },
    { path: '/groups', label: 'Groups', auth: true },
  ];

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} p-8`}>
      <div className="max-w-4xl mx-auto">
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-6`}>
          <h1 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            🧪 Route Testing Page
          </h1>
          
          <div className={`mb-6 p-4 rounded-lg ${
            isAuthenticated 
              ? 'bg-green-100 text-green-800 border border-green-200'
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            <p className="font-medium">
              Authentication Status: {isAuthenticated ? '✅ Logged In' : '❌ Not Logged In'}
            </p>
            {!isAuthenticated && (
              <p className="text-sm mt-1">
                You need to be logged in to access protected routes.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {routes.map(route => (
              <Link
                key={route.path}
                to={route.path}
                className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                  route.highlight
                    ? 'border-purple-500 bg-purple-50 text-purple-800 hover:bg-purple-100'
                    : route.auth && !isAuthenticated
                      ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed'
                      : isDark
                        ? 'border-gray-600 bg-gray-700 text-gray-200 hover:bg-gray-600'
                        : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
                onClick={e => {
                  if (route.auth && !isAuthenticated) {
                    e.preventDefault();
                    alert('Please log in first to access this route');
                  }
                }}
              >
                <div>
                  <div className="font-medium">{route.label}</div>
                  <div className={`text-sm ${route.highlight ? 'text-purple-600' : 'text-gray-500'}`}>
                    {route.path}
                  </div>
                </div>
                <div className="text-lg">
                  {route.auth 
                    ? (isAuthenticated ? '🔒' : '🚫')
                    : '🌐'
                  }
                </div>
              </Link>
            ))}
          </div>

          <div className={`mt-8 p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-blue-50'}`}>
            <h3 className={`font-semibold mb-2 ${isDark ? 'text-blue-300' : 'text-blue-900'}`}>
              🎯 Testing Instructions:
            </h3>
            <ul className={`text-sm space-y-1 ${isDark ? 'text-gray-300' : 'text-blue-800'}`}>
              <li>• Make sure you're logged in to test protected routes</li>
              <li>• The highlighted route <code>/task/new</code> should now work with prompts</li>
              <li>• Both <code>/task/new</code> and <code>/tasks/new</code> point to the same component</li>
              <li>• The new task form should show thinking prompts automatically</li>
              <li>• Look for the 🧠 prompt button in the form</li>
            </ul>
          </div>

          <div className={`mt-4 p-4 rounded-lg ${isDark ? 'bg-red-900 text-red-200' : 'bg-red-50 text-red-800'}`}>
            <h3 className="font-semibold mb-2">🐛 Troubleshooting Checklist:</h3>
            <ol className="text-sm space-y-1 list-decimal list-inside">
              <li>Check browser console for JavaScript errors (F12 → Console)</li>
              <li>Verify backend is running on port 5000/5001</li>
              <li>Ensure you're logged in to access /task/new</li>
              <li>Look for green "Component OK" indicators on pages</li>
              <li>Check Network tab for failed API requests</li>
              <li>Try refreshing the page or hard refresh (Ctrl+F5)</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteTestPage;