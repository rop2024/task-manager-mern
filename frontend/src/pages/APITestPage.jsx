import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';

const APITestPage = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const addResult = (test, success, data, error = null) => {
    setResults(prev => [...prev, {
      test,
      success,
      data,
      error,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const runTest = async (testName, request) => {
    setLoading(true);
    try {
      const result = await request();
      addResult(testName, true, result.data);
    } catch (error) {
      addResult(testName, false, null, error.message);
    } finally {
      setLoading(false);
    }
  };

  const tests = [
    {
      name: 'Health Check',
      run: () => axios.get('/api/health')
    },
    {
      name: 'Get Groups',
      run: () => axios.get('/api/groups')
    },
    {
      name: 'Get Tasks',
      run: () => axios.get('/api/tasks')
    },
    {
      name: 'Get Stats',
      run: () => axios.get('/api/tasks/stats')
    }
  ];

  const clearResults = () => {
    setResults([]);
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} p-6`}>
      <div className="max-w-6xl mx-auto">
        <h1 className={`text-3xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          API Test Suite
        </h1>

        {/* Test Buttons */}
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6 mb-6`}>
          <div className="flex flex-wrap gap-4 mb-4">
            {tests.map((test) => (
              <button
                key={test.name}
                onClick={() => runTest(test.name, test.run)}
                disabled={loading}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  loading
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                Test {test.name}
              </button>
            ))}
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={() => {
                tests.forEach(test => runTest(test.name, test.run));
              }}
              disabled={loading}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                loading
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              Run All Tests
            </button>
            
            <button
              onClick={clearResults}
              className={`px-4 py-2 rounded-lg font-medium border transition-colors ${
                isDark
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-100'
              }`}
            >
              Clear Results
            </button>
          </div>
        </div>

        {/* Results */}
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
          <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Test Results ({results.length})
          </h2>
          
          {results.length === 0 ? (
            <p className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              No tests run yet. Click a test button above to start.
            </p>
          ) : (
            <div className="space-y-4">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    result.success
                      ? 'bg-green-50 border-green-200 text-green-800'
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold">
                      {result.success ? '✅' : '❌'} {result.test}
                    </h3>
                    <span className="text-sm opacity-75">
                      {result.timestamp}
                    </span>
                  </div>
                  
                  {result.success ? (
                    <details className="mt-2">
                      <summary className="cursor-pointer font-medium">
                        Success - Click to view response
                      </summary>
                      <pre className="mt-2 p-2 bg-white rounded text-xs overflow-auto max-h-40">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </details>
                  ) : (
                    <div className="mt-2">
                      <p className="font-medium">Error:</p>
                      <p className="text-sm">{result.error}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default APITestPage;