import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">
              Dashboard
            </h1>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-green-800 mb-2">
              🎉 Authentication Successful!
            </h2>
            <p className="text-green-600">
              Welcome to your dashboard. You are now authenticated and your JWT token is securely stored.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-blue-700 mb-2">User Information</h3>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Name:</span> {user?.name}</p>
                <p><span className="font-medium">Email:</span> {user?.email}</p>
                <p><span className="font-medium">Role:</span> {user?.role}</p>
                <p><span className="font-medium">User ID:</span> {user?.id}</p>
              </div>
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <h3 className="font-semibold text-purple-700 mb-2">Authentication Status</h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm">JWT Token Active</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm">Session Valid</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm">Backend Connected</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-gray-50 rounded-lg p-6">
            <h3 className="font-semibold text-gray-700 mb-4">What's Next?</h3>
            <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
              <li>Your authentication token is automatically included in API requests</li>
              <li>Protected routes are now accessible</li>
              <li>User session persists across page refreshes</li>
              <li>Ready for Phase 3 features!</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;