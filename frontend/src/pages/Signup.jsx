import React from 'react';
import SignupForm from '../components/SignupForm';

const Signup = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-center text-3xl font-extrabold text-gray-900">
            Join Phase 2
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            Create your account in seconds
          </p>
        </div>
        <SignupForm />
      </div>
    </div>
  );
};

export default Signup;