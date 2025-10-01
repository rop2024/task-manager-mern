import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoutes.jsx';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import './index.css';

// Updated Home component with navigation
function HomePage() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-4">
            🚀 Phase 2
          </h1>
          <p className="text-xl text-gray-600">
            User Authentication - Complete!
          </p>
          <div className="mt-4 flex justify-center gap-4 flex-wrap">
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              React
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
                  You're successfully authenticated and ready to explore the dashboard.
                </p>
                <a
                  href="/dashboard"
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors inline-block"
                >
                  Go to Dashboard
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Get Started with Authentication
                </h2>
                <p className="text-gray-600 mb-6">
                  Sign up for a new account or sign in to access your dashboard.
                </p>
                <div className="flex gap-4 justify-center">
                  <a
                    href="/signup"
                    className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                  >
                    Sign Up
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

        {/* Rest of the existing home page content */}
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;