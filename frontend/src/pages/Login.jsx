import React from 'react';
import LoginForm from '../components/LoginForm';
import ThemeToggle from '../components/layout/ThemeToggle';
import { useTheme } from '../context/ThemeContext';
import usePageTitle from '../hooks/usePageTitle';

const Login = () => {
  usePageTitle('Login');
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100'} flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8`}>
      <div className="max-w-md w-full space-y-8">
        <div className="flex flex-col items-center">
          <div className="self-end mb-4">
            <ThemeToggle />
          </div>
          <h1 className={`text-center text-3xl font-extrabold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            TaskMaster Login
          </h1>
          <p className={`mt-2 text-center text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Sign in to your account
          </p>
        </div>
        <LoginForm isDark={isDark} />
      </div>
    </div>
  );
};

export default Login;