import React, { useState } from 'react';
import PromptSelector from '../components/tasks/PromptSelector';
import { useTheme } from '../context/ThemeContext';

// Demo page to test the prompt functionality
const PromptDemo = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [selectedPrompt, setSelectedPrompt] = useState('');
  const [showPrompts, setShowPrompts] = useState(true);

  const handlePromptSelect = (prompt) => {
    setSelectedPrompt(prompt);
    console.log('Prompt selected:', prompt);
  };

  return (
    <div className={`min-h-screen p-8 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            🧠 Task Creation Prompts Demo
          </h1>
          <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Test the mood-based task generation system with thinking prompts
          </p>
        </div>

        {/* Toggle Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowPrompts(!showPrompts)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            {showPrompts ? 'Hide Prompts' : 'Show Prompts'}
          </button>
        </div>

        {/* Prompt Selector */}
        {showPrompts && (
          <div className="mb-8">
            <PromptSelector
              onPromptSelect={handlePromptSelect}
              onClose={() => setShowPrompts(false)}
              isVisible={showPrompts}
            />
          </div>
        )}

        {/* Selected Prompt Display */}
        {selectedPrompt && (
          <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-6`}>
            <h3 className={`text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              ✨ Selected Prompt:
            </h3>
            <p className={`text-lg leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              "{selectedPrompt}"
            </p>
            
            <div className="mt-4">
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Your Task Title:
              </label>
              <input
                type="text"
                placeholder="Type your task based on the prompt..."
                defaultValue={selectedPrompt}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500'
                }`}
              />
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className={`mt-8 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-blue-50 border-blue-200'} border rounded-lg p-6`}>
          <h3 className={`text-lg font-semibold mb-3 ${isDark ? 'text-blue-300' : 'text-blue-900'}`}>
            🎯 How it works:
          </h3>
          <ul className={`space-y-2 ${isDark ? 'text-gray-300' : 'text-blue-800'}`}>
            <li>• <strong>Choose a mood category</strong> to get focused prompts for that context</li>
            <li>• <strong>Use "Mixed" mode</strong> for variety across different categories</li>
            <li>• <strong>Click "New Prompt"</strong> to cycle through different questions</li>
            <li>• <strong>Select "Use This Prompt"</strong> to fill your task title with the prompt</li>
            <li>• <strong>Edit as needed</strong> - prompts are starting points for your creativity</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PromptDemo;