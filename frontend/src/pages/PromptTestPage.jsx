import React, { useState } from 'react';
import PromptSelector from '../components/tasks/PromptSelector';
import { useTheme } from '../context/ThemeContext';

const PromptTestPage = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [showPrompts, setShowPrompts] = useState(true);
  const [selectedPrompt, setSelectedPrompt] = useState('');
  const [testResults, setTestResults] = useState([]);

  const addTestResult = (test, success, message) => {
    setTestResults(prev => [...prev, {
      test,
      success,
      message,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const runTests = () => {
    setTestResults([]);
    
    try {
      // Test 1: Import data
      const { PROMPT_CATEGORIES, getRandomPrompt } = require('../data/taskPrompts');
      addTestResult('Data Import', true, 'taskPrompts.js imported successfully');
      
      // Test 2: Get categories
      if (PROMPT_CATEGORIES && Object.keys(PROMPT_CATEGORIES).length > 0) {
        addTestResult('Categories', true, `Found ${Object.keys(PROMPT_CATEGORIES).length} categories`);
      } else {
        addTestResult('Categories', false, 'No categories found');
      }
      
      // Test 3: Get random prompt
      const randomPrompt = getRandomPrompt();
      if (randomPrompt && randomPrompt.length > 0) {
        addTestResult('Random Prompt', true, `Generated: "${randomPrompt.substring(0, 30)}..."`);
      } else {
        addTestResult('Random Prompt', false, 'Could not generate random prompt');
      }
      
    } catch (error) {
      addTestResult('Import Error', false, error.message);
    }
  };

  const handlePromptSelect = (prompt) => {
    setSelectedPrompt(prompt);
    addTestResult('Prompt Selection', true, `Selected: "${prompt.substring(0, 30)}..."`);
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} p-8`}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-6`}>
          <h1 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            🧪 Prompt System Test Page
          </h1>
          
          <div className="flex space-x-4 mb-6">
            <button
              onClick={runTests}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              🔍 Run Tests
            </button>
            
            <button
              onClick={() => setShowPrompts(!showPrompts)}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg"
            >
              {showPrompts ? 'Hide' : 'Show'} Prompts
            </button>
          </div>

          {testResults.length > 0 && (
            <div className="mb-6">
              <h3 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Test Results:
              </h3>
              <div className="space-y-2">
                {testResults.map((result, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg ${
                      result.success
                        ? 'bg-green-100 text-green-800 border border-green-200'
                        : 'bg-red-100 text-red-800 border border-red-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {result.success ? '✅' : '❌'} {result.test}
                      </span>
                      <span className="text-xs opacity-75">{result.timestamp}</span>
                    </div>
                    <div className="text-sm mt-1">{result.message}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {showPrompts && (
          <PromptSelector
            onPromptSelect={handlePromptSelect}
            onClose={() => setShowPrompts(false)}
            isVisible={showPrompts}
          />
        )}

        {selectedPrompt && (
          <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-6`}>
            <h3 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Selected Prompt:
            </h3>
            <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <p className={`${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                "{selectedPrompt}"
              </p>
            </div>
          </div>
        )}

        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-6`}>
          <h3 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            📋 Debug Instructions:
          </h3>
          <ul className={`text-sm space-y-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            <li>1. Click "Run Tests" to verify the prompt system components</li>
            <li>2. Check for green diagnostic indicators in the top-right corner</li>
            <li>3. Test the prompt selector above</li>
            <li>4. Open browser console (F12) to see any error messages</li>
            <li>5. If everything works here but not on /task/new, the issue is with TaskForm integration</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PromptTestPage;