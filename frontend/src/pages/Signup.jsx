import React from 'react';
import SignupForm from '../components/SignupForm';
import ThemeToggle from '../components/layout/ThemeToggle';
import { useTheme } from '../context/ThemeContext';

const Signup = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-green-50 to-teal-100'} flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8`}>
      <div className="max-w-md w-full space-y-8">
        <div className="flex flex-col items-center">
          <div className="self-end mb-4">
            <ThemeToggle />
          </div>
          <h1 className={`text-center text-3xl font-extrabold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Create Account
          </h1>
          <p className={`mt-2 text-center text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Get started with TaskMaster in seconds
          </p>
        </div>
        <SignupForm isDark={isDark} />
      </div>
    </div>
  );
};

export default Signup;