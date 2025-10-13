import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import PromptSelector from '../components/tasks/PromptSelector';
import EnhancedQuickAddTask from '../components/tasks/EnhancedQuickAddTask';
import { PROMPT_CATEGORIES, getAllCategories } from '../data/taskPrompts';

const TaskPromptShowcase = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState('quickadd');
  const [createdTasks, setCreatedTasks] = useState([]);

  const handleTaskCreated = (task) => {
    setCreatedTasks(prev => [task, ...prev]);
  };

  const tabs = [
    { id: 'quickadd', name: 'Quick Add with Prompts', icon: '⚡' },
    { id: 'standalone', name: 'Standalone Prompts', icon: '🧠' },
    { id: 'categories', name: 'Category Overview', icon: '🏷️' }
  ];

  const categories = getAllCategories();

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className={`text-4xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            🧠 Mood-Based Task Creation
          </h1>
          <p className={`text-xl ${isDark ? 'text-gray-300' : 'text-gray-600'} max-w-3xl mx-auto`}>
            Overcome blank page syndrome with intelligent thinking prompts categorized by mood and context.
            Never wonder "what should I work on?" again.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-500 text-white'
                  : isDark
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {tab.icon} {tab.name}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-8">
          {/* Quick Add Demo */}
          {activeTab === 'quickadd' && (
            <div>
              <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <h2 className={`text-2xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  ⚡ Enhanced Quick Add
                </h2>
                <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'} mb-6`}>
                  Click in the input field to see prompts appear automatically. The brain icon toggles prompt visibility.
                </p>
                
                <EnhancedQuickAddTask 
                  onTaskCreated={handleTaskCreated}
                  className="max-w-2xl"
                />
                
                {/* Created Tasks Preview */}
                {createdTasks.length > 0 && (
                  <div className="mt-6">
                    <h3 className={`text-lg font-semibold mb-3 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                      ✅ Recently Created Tasks:
                    </h3>
                    <div className="space-y-2">
                      {createdTasks.slice(0, 5).map((task, index) => (
                        <div 
                          key={index}
                          className={`p-3 rounded border-l-4 border-l-green-500 ${isDark ? 'bg-gray-700' : 'bg-green-50'}`}
                        >
                          <span className={isDark ? 'text-gray-200' : 'text-gray-800'}>
                            {task.title}
                          </span>
                          <span className={`ml-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            Just created
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Standalone Prompts Demo */}
          {activeTab === 'standalone' && (
            <div>
              <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <h2 className={`text-2xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  🧠 Standalone Prompt Selector
                </h2>
                <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'} mb-6`}>
                  This is how the prompt selector works as a standalone component, perfect for integration into forms and task creation workflows.
                </p>
                
                <PromptSelector
                  onPromptSelect={(prompt) => {
                    alert(`Prompt selected: "${prompt}"`);
                  }}
                  isVisible={true}
                />
              </div>
            </div>
          )}

          {/* Categories Overview */}
          {activeTab === 'categories' && (
            <div>
              <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <h2 className={`text-2xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  🏷️ Prompt Categories
                </h2>
                <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'} mb-8`}>
                  Each category is designed for specific contexts and mental states. Choose the mood that matches your current situation.
                </p>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categories.map(category => (
                    <div 
                      key={category.id}
                      className={`p-6 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}
                    >
                      <div className="flex items-center mb-3">
                        <span className="text-2xl mr-3">{category.icon}</span>
                        <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {category.name}
                        </h3>
                      </div>
                      
                      <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
                        {category.description}
                      </p>
                      
                      {/* Sample prompts */}
                      <div className="space-y-2">
                        <p className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wide`}>
                          Sample Prompts:
                        </p>
                        <div className="space-y-1">
                          {/* Show first 2 prompts from each category */}
                          {category.id === 'creative' && (
                            <>
                              <p className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                                • "What's something new you'd like to learn this week?"
                              </p>
                              <p className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                                • "What project idea excites you most right now?"
                              </p>
                            </>
                          )}
                          {category.id === 'focus' && (
                            <>
                              <p className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                                • "If you could only do one thing today, what would it be?"
                              </p>
                              <p className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                                • "What's important but keeps getting ignored?"
                              </p>
                            </>
                          )}
                          {category.id === 'progress' && (
                            <>
                              <p className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                                • "What could move a project forward, even a little?"
                              </p>
                              <p className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                                • "What would make tomorrow easier if you did it now?"
                              </p>
                            </>
                          )}
                          {category.id === 'cleanup' && (
                            <>
                              <p className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                                • "What's been sitting around too long and needs closure?"
                              </p>
                              <p className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                                • "What takes less than 10 minutes but keeps getting postponed?"
                              </p>
                            </>
                          )}
                          {category.id === 'reflection' && (
                            <>
                              <p className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                                • "What task would remove a source of stress?"
                              </p>
                              <p className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                                • "What are you avoiding because it feels too big?"
                              </p>
                            </>
                          )}
                          {category.id === 'system' && (
                            <>
                              <p className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                                • "What repetitive thing could you automate?"
                              </p>
                              <p className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                                • "What's broken that you could fix in 30 minutes?"
                              </p>
                            </>
                          )}
                          {category.id === 'general' && (
                            <>
                              <p className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                                • "What's one thing you've been meaning to start?"
                              </p>
                              <p className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                                • "What would make your day feel complete?"
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Implementation Guide */}
        <div className={`mt-12 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-blue-50 border-blue-200'} border rounded-xl p-6`}>
          <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-blue-300' : 'text-blue-900'}`}>
            🚀 Implementation Benefits
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className={`font-semibold mb-2 ${isDark ? 'text-blue-200' : 'text-blue-800'}`}>
                ✨ User Experience Benefits
              </h3>
              <ul className={`space-y-1 text-sm ${isDark ? 'text-gray-300' : 'text-blue-700'}`}>
                <li>• Eliminates blank page syndrome</li>
                <li>• Contextual prompts match user's mental state</li>
                <li>• Reduces decision fatigue</li>
                <li>• Encourages thoughtful task creation</li>
                <li>• Provides inspiration when stuck</li>
              </ul>
            </div>
            <div>
              <h3 className={`font-semibold mb-2 ${isDark ? 'text-blue-200' : 'text-blue-800'}`}>
                🛠️ Technical Implementation
              </h3>
              <ul className={`space-y-1 text-sm ${isDark ? 'text-gray-300' : 'text-blue-700'}`}>
                <li>• Modular component design</li>
                <li>• Category-based prompt organization</li>
                <li>• Smart prompt history to avoid repetition</li>
                <li>• Smooth animations and transitions</li>
                <li>• Mobile-responsive design</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskPromptShowcase;