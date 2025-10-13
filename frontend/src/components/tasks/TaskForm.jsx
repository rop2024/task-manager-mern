import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../context/ThemeContext';
import PromptSelector from './PromptSelector';
import axios from 'axios';

const TaskForm = ({ 
  draft = null, 
  task = null, 
  onSave, 
  onCancel, 
  groups = [], 
  selectedGroupId = '',
  initialMode = 'modal' // 'modal', 'drawer', or 'page'
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [mode, setMode] = useState(initialMode); // 'modal', 'drawer', or 'page'
  const [currentDraft, setCurrentDraft] = useState(draft);
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPromoting, setIsPromoting] = useState(false);
  const [saveDebounceTimeout, setSaveDebounceTimeout] = useState(null);
  
  // Form data - starts with basic info for modal, expands for drawer
  const [formData, setFormData] = useState({
    title: '',
    notes: '',
    // Drawer-specific fields
    priority: 'medium',
    group: selectedGroupId || '',
    dueAt: '',
    tags: [],
    isImportant: false,
    estimatedMinutes: '',
    reminders: []
  });
  
  // Prompting system state - initialize after formData
  const [showPrompts, setShowPrompts] = useState(false);
  const [promptUsed, setPromptUsed] = useState(false);

  // Initialize form data from draft, task, or defaults
  useEffect(() => {
    if (draft) {
      setFormData(prev => ({
        ...prev,
        title: draft.title || '',
        notes: draft.notes || '',
        // Keep existing drawer fields if switching from draft
      }));
      setCurrentDraft(draft);
      setShowPrompts(false); // Don't show prompts for existing drafts
    } else if (task) {
      const dueDate = task.dueAt ? new Date(task.dueAt).toISOString().split('T')[0] : '';
      
      setFormData({
        title: task.title || '',
        notes: task.description || '',
        priority: task.priority || 'medium',
        group: task.group?._id || task.group || selectedGroupId || '',
        dueAt: dueDate,
        tags: task.tags || [],
        isImportant: task.isImportant || false,
        estimatedMinutes: task.estimatedMinutes || '',
        reminders: task.reminders || []
      });
      setMode('drawer'); // Tasks always open in drawer mode
      setShowPrompts(false); // Don't show prompts for existing tasks
    } else {
      // New task - show prompts if no title (check after state initialization)
      const initialTitle = formData.title?.trim() || '';
      setShowPrompts(!initialTitle && !draft && !task);
    }
  }, [draft, task, selectedGroupId]);

  // Debounced autosave for drafts
  const debouncedSave = useCallback((data) => {
    if (saveDebounceTimeout) {
      clearTimeout(saveDebounceTimeout);
    }
    
    const timeout = setTimeout(async () => {
      if (currentDraft && data.title.trim()) {
        try {
          await axios.put(`/api/drafts/${currentDraft._id}`, {
            title: data.title,
            notes: data.notes
          });
        } catch (error) {
          console.error('Autosave failed:', error);
        }
      }
    }, 750); // 750ms debounce
    
    setSaveDebounceTimeout(timeout);
  }, [currentDraft, saveDebounceTimeout]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newData = {
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    };
    
    setFormData(newData);
    
    // Autosave for modal fields (title, notes) when in draft mode
    if (mode === 'drawer' && currentDraft && (name === 'title' || name === 'notes')) {
      debouncedSave(newData);
    }
    
    // Hide prompts when user starts typing
    if (name === 'title' && value.trim() && showPrompts) {
      setShowPrompts(false);
    }
  };

  // Handle prompt selection
  const handlePromptSelect = (promptText) => {
    setFormData(prev => ({
      ...prev,
      title: promptText
    }));
    setPromptUsed(true);
    setShowPrompts(false);
  };

  // Toggle prompt visibility
  const togglePrompts = () => {
    setShowPrompts(!showPrompts);
  };

  // Create initial draft from modal
  const createDraft = async () => {
    if (!formData.title.trim()) return;
    
    setIsCreatingDraft(true);
    try {
      const response = await axios.post('/api/drafts', {
        title: formData.title,
        notes: formData.notes,
        source: 'taskform'
      });
      
      setCurrentDraft(response.data.data);
      setMode('drawer');
    } catch (error) {
      console.error('Error creating draft:', error);
    } finally {
      setIsCreatingDraft(false);
    }
  };

  // Save draft (drawer mode)
  const saveDraft = async () => {
    if (!currentDraft) return;
    
    setIsSaving(true);
    try {
      await axios.put(`/api/drafts/${currentDraft._id}`, {
        title: formData.title,
        notes: formData.notes
      });
      
      if (onSave) {
        onSave(currentDraft);
      }
    } catch (error) {
      console.error('Error saving draft:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Promote draft to task
  const promoteDraft = async () => {
    if (!currentDraft) return;
    
    setIsPromoting(true);
    try {
      const taskData = {
        priority: formData.priority,
        group: formData.group,
        isImportant: formData.isImportant
      };
      
      if (formData.dueAt) taskData.dueAt = new Date(formData.dueAt).toISOString();
      if (formData.tags.length > 0) taskData.tags = formData.tags;
      if (formData.estimatedMinutes) taskData.estimatedMinutes = parseInt(formData.estimatedMinutes);
      
      const response = await axios.post(`/api/drafts/${currentDraft._id}/promote`, taskData);
      
      if (onSave) {
        onSave(response.data.data.task);
      }
    } catch (error) {
      console.error('Error promoting draft:', error);
    } finally {
      setIsPromoting(false);
    }
  };

  // Handle direct task creation/update for page mode
  const handleTaskSubmit = async () => {
    setIsSaving(true);
    try {
      const taskData = {
        title: formData.title,
        notes: formData.notes,
        priority: formData.priority,
        group: formData.group,
        isImportant: formData.isImportant
      };

      if (formData.dueAt) taskData.dueAt = new Date(formData.dueAt).toISOString();
      if (formData.tags.length > 0) taskData.tags = formData.tags;
      if (formData.estimatedMinutes) taskData.estimatedMinutes = parseInt(formData.estimatedMinutes);

      if (onSave) {
        await onSave(taskData);
      }
    } catch (error) {
      console.error('Error saving task:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Modal Phase 1: Simple title and notes input
  const renderModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div 
        className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-xl w-full max-w-md`}
        style={{ maxHeight: '420px' }}
      >
        {/* Modal Header */}
        <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Quick Capture
          </h2>
          <button
            onClick={onCancel}
            className={`p-2 rounded-lg transition-colors ${
              isDark 
                ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' 
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {/* Prompt Selector - Show for new tasks */}
          {showPrompts && (
            <PromptSelector
              onPromptSelect={handlePromptSelect}
              onClose={() => setShowPrompts(false)}
              isVisible={showPrompts}
            />
          )}

          <div className="space-y-4">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder={showPrompts ? "Or type your own task..." : "What needs to be done?"}
                  className={`flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  autoFocus={!showPrompts}
                />
                
                {/* Prompt Toggle Button */}
                <button
                  type="button"
                  onClick={togglePrompts}
                  className={`px-3 py-3 rounded-lg transition-colors ${
                    showPrompts
                      ? 'bg-purple-500 text-white hover:bg-purple-600'
                      : isDark 
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300'
                  }`}
                  title={showPrompts ? "Hide prompts" : "Get prompt inspiration"}
                >
                  <span className="text-sm">🧠</span>
                </button>
              </div>
              
              {promptUsed && !showPrompts && (
                <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-2`}>
                  ✨ Prompt used! Edit as needed or continue with more details.
                </div>
              )}
            </div>

            <div>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Add some notes... (optional)"
                rows={3}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors resize-none ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className={`flex justify-end space-x-3 p-6 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <button
            onClick={onCancel}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              isDark
                ? 'text-gray-300 hover:bg-gray-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={createDraft}
            disabled={!formData.title.trim() || isCreatingDraft}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center space-x-2"
          >
            {isCreatingDraft && (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            )}
            <span>Continue Editing →</span>
          </button>
        </div>
      </div>
    </div>
  );

  // Drawer Phase 2: Full task editing
  const renderDrawer = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
      <div 
        className={`${isDark ? 'bg-gray-800' : 'bg-white'} shadow-xl flex flex-col`}
        style={{ 
          width: 'min(700px, 95vw)', 
          maxHeight: '95vh' 
        }}
      >
        {/* Drawer Header - Sticky */}
        <div className={`sticky top-0 flex items-center justify-between p-6 border-b ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} z-10`}>
          <div>
            <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {task ? 'Edit Task' : currentDraft ? 'Complete Task' : 'New Task'}
            </h2>
            {currentDraft && (
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                Draft created • Auto-saving changes
              </p>
            )}
          </div>
          <button
            onClick={onCancel}
            className={`p-2 rounded-lg transition-colors ${
              isDark 
                ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' 
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Drawer Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Prompt Selector for new tasks */}
          {showPrompts && !task && (
            <PromptSelector
              onPromptSelect={handlePromptSelect}
              onClose={() => setShowPrompts(false)}
              isVisible={showPrompts}
            />
          )}

          {/* Basic Fields */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Title
              </label>
              {!task && (
                <button
                  type="button"
                  onClick={togglePrompts}
                  className={`text-xs px-2 py-1 rounded transition-colors ${
                    showPrompts
                      ? 'bg-purple-500 text-white hover:bg-purple-600'
                      : isDark 
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title={showPrompts ? "Hide thinking prompts" : "Get thinking prompts"}
                >
                  🧠 {showPrompts ? 'Hide' : 'Prompts'}
                </button>
              )}
            </div>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                isDark
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500'
              }`}
              placeholder="What needs to be done?"
            />
          </div>

          <div>
            <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors resize-none ${
                isDark
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500'
              }`}
              placeholder="Add detailed notes..."
            />
          </div>

          {/* Priority and Group Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                Priority
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500'
                    : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'
                }`}
              >
                <option value="low">🟢 Low</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🔴 High</option>
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                Group
              </label>
              <select
                name="group"
                value={formData.group}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500'
                    : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'
                }`}
              >
                <option value="">Select a group</option>
                {groups.map(group => (
                  <option key={group._id} value={group._id}>
                    {group.icon} {group.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Due Date Field */}
          <div>
            <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              Due Date
            </label>
            <input
              type="date"
              name="dueAt"
              value={formData.dueAt}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                isDark
                  ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500'
                  : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'
              }`}
            />
          </div>

          {/* Important Toggle */}
          <div className={`flex items-center p-4 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
            <input
              type="checkbox"
              id="isImportant"
              name="isImportant"
              checked={formData.isImportant}
              onChange={handleChange}
              className="h-5 w-5 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
            />
            <label htmlFor="isImportant" className={`ml-3 flex items-center text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              <span className="text-yellow-500 mr-2">⭐</span>
              Mark as important
            </label>
          </div>

          {/* Estimated Time */}
          <div>
            <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              Estimated Time (minutes)
            </label>
            <input
              type="number"
              name="estimatedMinutes"
              value={formData.estimatedMinutes}
              onChange={handleChange}
              min="1"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                isDark
                  ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500'
                  : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'
              }`}
              placeholder="How long will this take?"
            />
          </div>
        </div>

        {/* Drawer Footer - Sticky */}
        <div className={`sticky bottom-0 flex justify-end space-x-3 p-6 border-t ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
          <button
            onClick={onCancel}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              isDark
                ? 'text-gray-300 hover:bg-gray-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Cancel
          </button>
          
          {currentDraft && (
            <button
              onClick={saveDraft}
              disabled={isSaving}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                isDark
                  ? 'bg-gray-600 text-white hover:bg-gray-500'
                  : 'bg-gray-500 text-white hover:bg-gray-600'
              } disabled:opacity-50`}
            >
              {isSaving ? 'Saving...' : 'Save Draft'}
            </button>
          )}
          
          <button
            onClick={currentDraft ? promoteDraft : saveDraft}
            disabled={!formData.title.trim() || !formData.group || isPromoting}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center space-x-2"
          >
            {isPromoting && (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            )}
            <span>
              {currentDraft ? 'Create Task' : task ? 'Update' : 'Create Task'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );

  // Page mode: Renders form content for standalone page use
  const renderPage = () => (
    <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm border ${isDark ? 'border-gray-700' : 'border-gray-200'} p-6 space-y-6`}>
      {/* Prompt Selector for new tasks */}
      {showPrompts && !task && (
        <PromptSelector
          onPromptSelect={handlePromptSelect}
          onClose={() => setShowPrompts(false)}
          isVisible={showPrompts}
        />
      )}

      {/* Basic Fields */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Title
          </label>
          {!task && (
            <button
              type="button"
              onClick={togglePrompts}
              className={`text-sm px-3 py-1 rounded transition-colors ${
                showPrompts
                  ? 'bg-purple-500 text-white hover:bg-purple-600'
                  : isDark 
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={showPrompts ? "Hide thinking prompts" : "Get thinking prompts"}
            >
              🧠 {showPrompts ? 'Hide Prompts' : 'Get Prompts'}
            </button>
          )}
        </div>
        
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder={showPrompts ? "Choose a prompt or type your own..." : "Task title"}
          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
            isDark
              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500'
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500'
          }`}
        />
        
        {promptUsed && !showPrompts && (
          <div className={`text-sm ${isDark ? 'text-purple-400' : 'text-purple-600'} mt-2`}>
            ✨ Prompt used! Edit as needed or continue with more details.
          </div>
        )}
      </div>

      <div>
        <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
          Notes
        </label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Additional details (optional)"
          rows={4}
          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 resize-vertical transition-colors ${
            isDark
              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500'
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500'
          }`}
        />
      </div>

      {/* Priority and Group */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
            Priority
          </label>
          <select
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
              isDark
                ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500'
                : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500'
            }`}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>

        <div>
          <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
            Group
          </label>
          <select
            name="group"
            value={formData.group}
            onChange={handleChange}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
              isDark
                ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500'
                : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500'
            }`}
          >
            <option value="">Select a group</option>
            {groups.map(group => (
              <option key={group._id} value={group._id}>
                {group.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Due Date */}
      <div>
        <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
          Due Date
        </label>
        <input
          type="date"
          name="dueAt"
          value={formData.dueAt}
          onChange={handleChange}
          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
            isDark
              ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500'
              : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500'
          }`}
        />
      </div>

      {/* Estimated Time and Important Flag */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
            Estimated Time (minutes)
          </label>
          <input
            type="number"
            name="estimatedMinutes"
            value={formData.estimatedMinutes}
            onChange={handleChange}
            placeholder="e.g., 30"
            min="1"
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
              isDark
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500'
            }`}
          />
        </div>

        <div className="flex items-center">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              name="isImportant"
              checked={formData.isImportant}
              onChange={handleChange}
              className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            />
            <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Mark as Important
            </span>
          </label>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            isDark
              ? 'text-gray-300 bg-gray-700 hover:bg-gray-600 border border-gray-600'
              : 'text-gray-700 bg-white hover:bg-gray-50 border border-gray-300'
          }`}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleTaskSubmit}
          disabled={!formData.title.trim() || !formData.group || isSaving}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center space-x-2"
        >
          {isSaving && (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
          )}
          <span>
            {task ? 'Update Task' : 'Create Task'}
          </span>
        </button>
      </div>
    </div>
  );

  return mode === 'modal' ? renderModal() : mode === 'drawer' ? renderDrawer() : renderPage();
};

export default TaskForm;