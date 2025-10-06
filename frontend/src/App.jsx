import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoutes';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import './index.css';
import Calendar from './pages/Calendar';


// Updated Home component with navigation
function HomePage() {
  const { isAuthenticated, user, loading } = useAuth();

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

        {isAuthenticated ? (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Welcome back, {user?.name}! 👋
                </h2>
                <p className="text-gray-600 mb-6">
                  You're successfully authenticated and ready to manage your tasks with groups.
                </p>
                <div className="flex gap-4 justify-center flex-wrap">
                  <a
                    href="/tasks"
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors inline-block"
                  >
                    Go to Tasks
                  </a>
                  <a
                    href="/dashboard"
                    className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors inline-block"
                  >
                    Dashboard
                  </a>
                  <a
                    href="/calendar"
                    className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors inline-block"
                  >
                    Calendar
                  </a>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Get Started with Task Management
                </h2>
                <p className="text-gray-600 mb-6">
                  Sign up for a new account or sign in to organize your tasks with groups and projects.
                </p>
                <div className="flex gap-4 justify-center flex-wrap">
                  <a
                    href="/signup"
                    className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                  >
                    Create Account
                  </a>
                  <a
                    href="/login"
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                  >
                    Sign In
                  </a>
                </div>
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
                  <li>• Drag & drop between groups</li>
                  <li>• Bulk task movement</li>
                  <li>• Real-time updates</li>
                  <li>• Group-specific stats</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/tasks" 
            element={
              <ProtectedRoute>
                <Tasks />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/calendar" 
            element={
              <ProtectedRoute>
                <Calendar />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;