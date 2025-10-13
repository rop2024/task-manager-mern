import React from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const RouteDebugInfo = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const location = useLocation();
  const params = useParams();

  return (
    <div className={`${isDark ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white border-gray-200 text-gray-800'} border rounded-lg p-4 mb-4`}>
      <h4 className="font-semibold mb-2">🐛 Route Debug Info</h4>
      <div className="space-y-2 text-sm">
        <div>
          <span className="font-medium">Current Path:</span> <code className={`${isDark ? 'bg-gray-700' : 'bg-gray-100'} px-1 rounded`}>{location.pathname}</code>
        </div>
        <div>
          <span className="font-medium">Search Params:</span> <code className={`${isDark ? 'bg-gray-700' : 'bg-gray-100'} px-1 rounded`}>{location.search || 'none'}</code>
        </div>
        <div>
          <span className="font-medium">URL Params:</span> <code className={`${isDark ? 'bg-gray-700' : 'bg-gray-100'} px-1 rounded`}>{JSON.stringify(params)}</code>
        </div>
        <div>
          <span className="font-medium">State:</span> <code className={`${isDark ? 'bg-gray-700' : 'bg-gray-100'} px-1 rounded`}>{location.state ? JSON.stringify(location.state) : 'none'}</code>
        </div>
      </div>
      <div className={`mt-3 p-2 rounded ${isDark ? 'bg-green-900 text-green-200' : 'bg-green-50 text-green-800'} text-xs`}>
        ✅ If you can see this, the route is working and the component is rendering!
      </div>
    </div>
  );
};

export default RouteDebugInfo;