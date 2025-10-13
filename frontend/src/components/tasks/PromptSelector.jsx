import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import DiagnosticComponent from '../debug/DiagnosticComponent';
import { 
  PROMPT_CATEGORIES, 
  getRandomPrompt, 
  getMixedPrompts, 
  getAllCategories,
  getCategoryById 
} from '../../data/taskPrompts';

const PromptSelector = ({ onPromptSelect, onClose, isVisible = true }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [promptHistory, setPromptHistory] = useState([]);

  // Initialize with a random prompt
  useEffect(() => {
    if (isVisible) {
      const initialPrompts = getMixedPrompts();
      setCurrentPrompt(initialPrompts[0]);
      setPromptHistory([initialPrompts[0]]);
    }
  }, [isVisible]);

  const generateNewPrompt = (categoryId = null) => {
    setIsAnimating(true);
    
    setTimeout(() => {
      let newPrompt;
      
      // Avoid repeating recent prompts
      let attempts = 0;
      do {
        newPrompt = getRandomPrompt(categoryId);
        attempts++;
      } while (promptHistory.includes(newPrompt) && attempts < 10);

      setCurrentPrompt(newPrompt);
      setPromptHistory(prev => {
        const updated = [newPrompt, ...prev];
        return updated.slice(0, 5); // Keep last 5 prompts to avoid repetition
      });
      
      setIsAnimating(false);
    }, 150);
  };

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId === selectedCategory ? null : categoryId);
    generateNewPrompt(categoryId === selectedCategory ? null : categoryId);
  };

  const handleUsePrompt = () => {
    onPromptSelect(currentPrompt);
    if (onClose) onClose();
  };

  const getCategoryColor = (category) => {
    const colors = {
      purple: isDark ? 'bg-purple-900 text-purple-200 border-purple-700' : 'bg-purple-100 text-purple-800 border-purple-300',
      blue: isDark ? 'bg-blue-900 text-blue-200 border-blue-700' : 'bg-blue-100 text-blue-800 border-blue-300',
      green: isDark ? 'bg-green-900 text-green-200 border-green-700' : 'bg-green-100 text-green-800 border-green-300',
      orange: isDark ? 'bg-orange-900 text-orange-200 border-orange-700' : 'bg-orange-100 text-orange-800 border-orange-300',
      pink: isDark ? 'bg-pink-900 text-pink-200 border-pink-700' : 'bg-pink-100 text-pink-800 border-pink-300',
      gray: isDark ? 'bg-gray-800 text-gray-200 border-gray-600' : 'bg-gray-100 text-gray-700 border-gray-300',
      indigo: isDark ? 'bg-indigo-900 text-indigo-200 border-indigo-700' : 'bg-indigo-100 text-indigo-800 border-indigo-300'
    };
    return colors[category.color] || colors.gray;
  };

  const getSelectedCategoryStyle = (category) => {
    const colors = {
      purple: isDark ? 'bg-purple-600 text-white border-purple-500' : 'bg-purple-500 text-white border-purple-600',
      blue: isDark ? 'bg-blue-600 text-white border-blue-500' : 'bg-blue-500 text-white border-blue-600',
      green: isDark ? 'bg-green-600 text-white border-green-500' : 'bg-green-500 text-white border-green-600',
      orange: isDark ? 'bg-orange-600 text-white border-orange-500' : 'bg-orange-500 text-white border-orange-600',
      pink: isDark ? 'bg-pink-600 text-white border-pink-500' : 'bg-pink-500 text-white border-pink-600',
      gray: isDark ? 'bg-gray-600 text-white border-gray-500' : 'bg-gray-500 text-white border-gray-600',
      indigo: isDark ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-indigo-500 text-white border-indigo-600'
    };
    return colors[category.color] || colors.gray;
  };

  if (!isVisible) return null;

  const categories = getAllCategories();
  const selectedCategoryData = selectedCategory ? getCategoryById(selectedCategory) : null;

  return (
    <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-4 mb-4`}>
      <DiagnosticComponent 
        componentName="PromptSelector" 
        props={{ isVisible, currentPrompt: currentPrompt.substring(0, 20) + '...' }} 
      />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">🧠</span>
          <h3 className={`font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
            Task Creation Prompts
          </h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className={`text-sm ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'} transition-colors`}
          >
            ✕
          </button>
        )}
      </div>

      {/* Category Filter */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-2 mb-3">
          <button
            onClick={() => handleCategorySelect(null)}
            className={`px-3 py-1 rounded-full text-sm font-medium border transition-all ${
              !selectedCategory
                ? isDark ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-indigo-500 text-white border-indigo-600'
                : isDark ? 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
            }`}
          >
            🎲 Mixed
          </button>
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => handleCategorySelect(category.id)}
              className={`px-3 py-1 rounded-full text-sm font-medium border transition-all ${
                selectedCategory === category.id
                  ? getSelectedCategoryStyle(category)
                  : getCategoryColor(category) + ' hover:opacity-80'
              }`}
              title={category.description}
            >
              {category.icon} {category.name}
            </button>
          ))}
        </div>
        
        {selectedCategoryData && (
          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
            {selectedCategoryData.description}
          </p>
        )}
      </div>

      {/* Current Prompt Display */}
      <div className={`${isDark ? 'bg-gray-900 border-gray-600' : 'bg-gray-50 border-gray-200'} border rounded-lg p-4 mb-4 relative overflow-hidden`}>
        <div className={`transition-all duration-300 ${isAnimating ? 'opacity-0 transform translate-y-2' : 'opacity-100 transform translate-y-0'}`}>
          <div className="flex items-start space-x-3">
            <span className="text-2xl mt-1">💭</span>
            <div className="flex-1">
              <p className={`${isDark ? 'text-gray-200' : 'text-gray-800'} leading-relaxed font-medium`}>
                {currentPrompt}
              </p>
            </div>
          </div>
        </div>
        
        {/* Subtle animation indicator */}
        {isAnimating && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`animate-spin rounded-full h-6 w-6 border-2 border-t-transparent ${
              isDark ? 'border-gray-600' : 'border-gray-400'
            }`}></div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-2">
        <button
          onClick={handleUsePrompt}
          className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
        >
          <span>✨</span>
          <span>Use This Prompt</span>
        </button>
        
        <button
          onClick={() => generateNewPrompt(selectedCategory)}
          disabled={isAnimating}
          className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 ${
            isDark 
              ? 'bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600' 
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
          } ${isAnimating ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <span className={isAnimating ? 'animate-spin' : ''}>🔄</span>
          <span>New Prompt</span>
        </button>
      </div>

      {/* Tips */}
      <div className={`mt-3 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'} text-center`}>
        💡 Click a mood category for focused prompts, or use "Mixed" for variety
      </div>
    </div>
  );
};

export default PromptSelector;