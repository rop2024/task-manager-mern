import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const QuickNavigation = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const navItems = [
    { path: '/task/new', label: 'New Task (singular)', icon: '➕' },
    { path: '/tasks/new', label: 'New Task (plural)', icon: '📝' },
    { path: '/tasks', label: 'All Tasks', icon: '📋' },
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/calendar', label: 'Calendar', icon: '📅' },
    { path: '/inbox', label: 'Inbox', icon: '📥' },
  ];

  return (
    <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-4`}>
      <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        🧭 Quick Navigation
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {navItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center space-x-2 p-3 rounded-lg transition-colors ${
              isDark 
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-200 hover:text-white' 
                : 'bg-gray-50 hover:bg-gray-100 text-gray-700 hover:text-gray-900'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
      
      <div className={`mt-4 p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-blue-50'}`}>
        <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-blue-800'}`}>
          <strong>Route Testing:</strong> Both <code>/task/new</code> and <code>/tasks/new</code> now work and include the new prompting system!
        </p>
      </div>
    </div>
  );
};

export default QuickNavigation;