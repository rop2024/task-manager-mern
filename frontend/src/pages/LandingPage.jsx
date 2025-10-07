import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from '../components/layout/ThemeToggle';

const LandingPage = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

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
          </div>
        </header>

        {/* Login/Signup Boxes */}
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
          {/* Login Box */}
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'} mb-4 text-center`}>
              Sign In
            </h2>
            <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'} mb-6 text-center`}>
              Already have an account? Sign in to continue where you left off.
            </p>
            <div className="flex justify-center">
              <Link
                to="/login"
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors inline-block"
              >
                Login
              </Link>
            </div>
          </div>

          {/* Sign Up Box */}
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'} mb-4 text-center`}>
              Create Account
            </h2>
            <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'} mb-6 text-center`}>
              New to TaskMaster? Sign up for free and get started today.
            </p>
            <div className="flex justify-center">
              <Link
                to="/signup"
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors inline-block"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="max-w-4xl mx-auto mt-12">
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'} mb-6`}>
              Key Features
            </h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className={`border ${isDark ? 'border-gray-700' : 'border-gray-200'} rounded-lg p-4 hover:shadow-md transition-shadow`}>
                <div className={`${isDark ? 'text-blue-400' : 'text-blue-500'} text-lg font-semibold mb-2`}>📋 Task Management</div>
                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Create, organize, and complete tasks with deadlines and priorities
                </p>
              </div>

              <div className={`border ${isDark ? 'border-gray-700' : 'border-gray-200'} rounded-lg p-4 hover:shadow-md transition-shadow`}>
                <div className={`${isDark ? 'text-green-400' : 'text-green-500'} text-lg font-semibold mb-2`}>📊 Progress Tracking</div>
                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Monitor your productivity and track completion rates
                </p>
              </div>

              <div className={`border ${isDark ? 'border-gray-700' : 'border-gray-200'} rounded-lg p-4 hover:shadow-md transition-shadow`}>
                <div className={`${isDark ? 'text-purple-400' : 'text-purple-500'} text-lg font-semibold mb-2`}>📅 Calendar Integration</div>
                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  View your tasks in a calendar format with reminders
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="max-w-4xl mx-auto mt-8 text-center">
          <div className={`${isDark ? 'bg-gradient-to-r from-blue-800 to-purple-900' : 'bg-gradient-to-r from-blue-500 to-purple-600'} rounded-xl shadow-lg p-8 text-white`}>
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="mb-6 opacity-90 text-lg">
              Join now and boost your productivity today!
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to="/signup"
                className={`${isDark ? 'bg-gray-800 text-blue-300 hover:bg-gray-700' : 'bg-white text-blue-600 hover:bg-gray-100'} px-8 py-3 rounded-lg font-semibold transition-colors inline-block shadow-md`}
              >
                Create Free Account
              </Link>
              <Link
                to="/login"
                className="bg-transparent text-white border border-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors inline-block"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;