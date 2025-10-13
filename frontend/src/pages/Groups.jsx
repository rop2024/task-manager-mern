import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../hooks/useToast';
import axios from 'axios';
import GroupForm from '../components/group/GroupForm';

const Groups = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { addToast } = useToast();
  const isDark = theme === 'dark';
  
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [completingGroup, setCompletingGroup] = useState(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState(new Set());
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkActionType, setBulkActionType] = useState(null); // 'complete' | 'delete'

  // Fetch groups
  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/groups');
      setGroups(response.data.data);
    } catch (error) {
      console.error('Error fetching groups:', error);
      addToast('Failed to load groups', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  // Handle group creation
  const handleCreateGroup = async (groupData) => {
    try {
      const response = await axios.post('/api/groups', groupData);
      setGroups(prev => [...prev, response.data.data]);
      setShowGroupForm(false);
      addToast('Group created successfully', 'success');
      return response.data.data;
    } catch (error) {
      console.error('Error creating group:', error);
      addToast('Failed to create group', 'error');
      throw error;
    }
  };

  // Handle group update
  const handleUpdateGroup = async (groupId, groupData) => {
    try {
      const response = await axios.put(`/api/groups/${groupId}`, groupData);
      setGroups(prev => prev.map(group => 
        group._id === groupId ? response.data.data : group
      ));
      setEditingGroup(null);
      addToast('Group updated successfully', 'success');
      return response.data.data;
    } catch (error) {
      console.error('Error updating group:', error);
      addToast('Failed to update group', 'error');
      throw error;
    }
  };

  // Handle group completion toggle
  const handleToggleCompletion = async (groupId, isCompleted) => {
    try {
      const endpoint = isCompleted 
        ? `/api/groups/${groupId}/uncomplete`
        : `/api/groups/${groupId}/complete`;
      
      const response = await axios.patch(endpoint);
      setGroups(prev => prev.map(group => 
        group._id === groupId ? response.data.data : group
      ));
      
      const message = isCompleted 
        ? 'Group unmarked as completed'
        : 'Group marked as completed';
      addToast(message, 'success');
      
      setShowCompletionModal(false);
      setCompletingGroup(null);
    } catch (error) {
      console.error('Error toggling group completion:', error);
      addToast('Failed to update group status', 'error');
    }
  };

  // Handle group deletion
  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.delete(`/api/groups/${groupId}`);
      setGroups(prev => prev.filter(group => group._id !== groupId));
      addToast('Group deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting group:', error);
      const message = error.response?.data?.message || 'Failed to delete group';
      addToast(message, 'error');
    }
  };

  // Open completion modal
  const openCompletionModal = (group) => {
    setCompletingGroup(group);
    setShowCompletionModal(true);
  };

  // Bulk operations handlers
  const toggleBulkMode = () => {
    setBulkMode(!bulkMode);
    setSelectedGroups(new Set());
  };

  const toggleGroupSelection = (groupId) => {
    const newSelection = new Set(selectedGroups);
    if (newSelection.has(groupId)) {
      newSelection.delete(groupId);
    } else {
      newSelection.add(groupId);
    }
    setSelectedGroups(newSelection);
  };

  const selectAllGroups = () => {
    const allGroupIds = groups.map(g => g._id);
    setSelectedGroups(new Set(allGroupIds));
  };

  const clearSelection = () => {
    setSelectedGroups(new Set());
  };

  const handleBulkComplete = async () => {
    try {
      const selectedGroupIds = Array.from(selectedGroups);
      let completedCount = 0;

      for (const groupId of selectedGroupIds) {
        try {
          await axios.patch(`/api/groups/${groupId}/complete`);
          completedCount++;
        } catch (error) {
          console.error(`Error completing group ${groupId}:`, error);
        }
      }

      // Refresh groups
      await fetchGroups();
      
      addToast(`${completedCount} groups marked as completed`, 'success');
      setBulkMode(false);
      setSelectedGroups(new Set());
      setShowBulkModal(false);
      setBulkActionType(null);
    } catch (error) {
      console.error('Error in bulk completion:', error);
      addToast('Some groups could not be completed', 'error');
    }
  };

  const handleBulkDelete = async () => {
    try {
      const selectedGroupIds = Array.from(selectedGroups);
      let deletedCount = 0;

      for (const groupId of selectedGroupIds) {
        try {
          await axios.delete(`/api/groups/${groupId}`);
          deletedCount++;
        } catch (error) {
          console.error(`Error deleting group ${groupId}:`, error);
        }
      }

      // Refresh groups
      await fetchGroups();
      
      addToast(`${deletedCount} groups deleted successfully`, 'success');
      setBulkMode(false);
      setSelectedGroups(new Set());
      setShowBulkModal(false);
      setBulkActionType(null);
    } catch (error) {
      console.error('Error in bulk deletion:', error);
      addToast('Some groups could not be deleted', 'error');
    }
  };

  const executeBulkAction = async () => {
    if (bulkActionType === 'complete') {
      await handleBulkComplete();
    } else if (bulkActionType === 'delete') {
      await handleBulkDelete();
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${isDark ? 'border-blue-400' : 'border-blue-500'}`}></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Groups
              </h1>
              <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'} mt-2`}>
                Organize your tasks into meaningful projects and track their progress
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {/* Bulk Mode Toggle */}
              <button
                onClick={toggleBulkMode}
                className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2
                          ${bulkMode 
                            ? 'bg-purple-600 text-white hover:bg-purple-700' 
                            : isDark 
                              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{bulkMode ? 'Exit Bulk' : 'Bulk Actions'}</span>
              </button>

              <button
                onClick={() => setShowGroupForm(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium 
                         hover:bg-blue-700 transition-colors duration-200 
                         flex items-center space-x-2 shadow-sm"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>New Group</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {bulkMode && (
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm p-4 mb-6 border-l-4 border-purple-500`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {selectedGroups.size > 0 
                    ? `${selectedGroups.size} group${selectedGroups.size === 1 ? '' : 's'} selected`
                    : 'Select groups to perform bulk actions'
                  }
                </span>
                
                {groups.length > 0 && (
                  <div className="flex space-x-2">
                    <button
                      onClick={selectAllGroups}
                      className={`text-xs px-3 py-1 rounded-full transition-colors
                                ${isDark 
                                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      Select All
                    </button>
                    <button
                      onClick={clearSelection}
                      className={`text-xs px-3 py-1 rounded-full transition-colors
                                ${isDark 
                                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>

              {selectedGroups.size > 0 && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setBulkActionType('complete');
                      setShowBulkModal(true);
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg
                             hover:bg-green-700 transition-colors flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Mark Complete</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      setBulkActionType('delete');
                      setShowBulkModal(true);
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg
                             hover:bg-red-700 transition-colors flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Groups Grid */}
        {groups.length === 0 ? (
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm p-12 text-center`}>
            <div className="text-6xl mb-4">📁</div>
            <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
              No Groups Yet
            </h3>
            <p className={`mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Create your first group to start organizing your tasks
            </p>
            <button
              onClick={() => setShowGroupForm(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium 
                       hover:bg-blue-700 transition-colors duration-200"
            >
              Create Your First Group
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {groups.map((group) => (
              <div
                key={group._id}
                className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm 
                          hover:shadow-md transition-all duration-200 overflow-hidden relative
                          ${group.isCompleted ? 'opacity-75' : ''}
                          ${bulkMode && selectedGroups.has(group._id) ? 'ring-2 ring-purple-500' : ''}`}
              >
                {/* Bulk Selection Checkbox */}
                {bulkMode && (
                  <div className="absolute top-3 right-3 z-10">
                    <button
                      onClick={() => toggleGroupSelection(group._id)}
                      className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors
                                ${selectedGroups.has(group._id)
                                  ? 'bg-purple-600 border-purple-600 text-white'
                                  : isDark
                                    ? 'border-gray-500 hover:border-purple-500'
                                    : 'border-gray-300 hover:border-purple-500'
                                }`}
                    >
                      {selectedGroups.has(group._id) && (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  </div>
                )}
                {/* Group Header */}
                <div 
                  className="h-4"
                  style={{ backgroundColor: group.color }}
                />

                <div className="p-6">
                  {/* Group Icon and Title */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="text-2xl p-2 rounded-lg"
                        style={{ backgroundColor: `${group.color}20` }}
                      >
                        {group.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'} text-lg
                                      ${group.isCompleted ? 'line-through' : ''}`}>
                          {group.name}
                        </h3>
                        {group.isCompleted && (
                          <div className="flex items-center space-x-1 mt-1">
                            <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className={`text-sm ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                              Completed
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Menu */}
                    <div className="relative group">
                      <button className={`p-1 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} 
                                        transition-colors opacity-0 group-hover:opacity-100`}>
                        <svg className={`h-5 w-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Description */}
                  {group.description && (
                    <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-4 line-clamp-2`}>
                      {group.description}
                    </p>
                  )}

                  {/* End Goal and Expected Date */}
                  {(group.endGoal || group.expectedDate) && (
                    <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4 mb-4 space-y-3`}>
                      {/* End Goal */}
                      {group.endGoal && (
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <svg className={`h-4 w-4 ${isDark ? 'text-blue-400' : 'text-blue-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                            </svg>
                            <span className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                              Goal
                            </span>
                          </div>
                          <p className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-800'} leading-relaxed`}>
                            {group.endGoal}
                          </p>
                        </div>
                      )}

                      {/* Expected Completion Date */}
                      {group.expectedDate && (
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <svg className={`h-4 w-4 ${isDark ? 'text-green-400' : 'text-green-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                              Expected Completion
                            </span>
                          </div>
                          <p className={`text-sm font-medium ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                            {new Date(group.expectedDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        <span className="font-medium">{group.taskCount || 0}</span> tasks
                      </div>
                      {group.isDefault && (
                        <span className={`px-2 py-1 text-xs rounded-full 
                                      ${isDark ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'}`}>
                          Default
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {!bulkMode && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setEditingGroup(group)}
                        className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-colors
                                  ${isDark 
                                    ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' 
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                      >
                        Edit
                      </button>
                      
                      <button
                        onClick={() => openCompletionModal(group)}
                        className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-colors
                                  ${group.isCompleted
                                    ? isDark 
                                      ? 'bg-yellow-900 text-yellow-200 hover:bg-yellow-800'
                                      : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                    : isDark
                                      ? 'bg-green-900 text-green-200 hover:bg-green-800'
                                      : 'bg-green-100 text-green-800 hover:bg-green-200'
                                  }`}
                      >
                        {group.isCompleted ? 'Reopen' : 'Complete'}
                      </button>

                      {!group.isDefault && (
                        <button
                          onClick={() => handleDeleteGroup(group._id)}
                          className={`p-2 rounded-lg transition-colors
                                    ${isDark 
                                      ? 'text-red-400 hover:bg-red-900/20' 
                                      : 'text-red-500 hover:bg-red-50'}`}
                          title="Delete Group"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Group Form Modal */}
      {(showGroupForm || editingGroup) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 z-50 overflow-y-auto">
          <div className="min-h-full py-8 flex items-center justify-center">
            <GroupForm
              group={editingGroup}
              onSubmit={editingGroup ? 
                (data) => handleUpdateGroup(editingGroup._id, data) : 
                handleCreateGroup
              }
              onCancel={() => {
                setShowGroupForm(false);
                setEditingGroup(null);
              }}
              loading={false}
            />
          </div>
        </div>
      )}

      {/* Completion Confirmation Modal */}
      {showCompletionModal && completingGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-xl max-w-md w-full p-6`}>
            <div className="flex items-center mb-4">
              <div className={`p-2 rounded-full mr-3 ${
                completingGroup.isCompleted 
                  ? isDark ? 'bg-yellow-900' : 'bg-yellow-100'
                  : isDark ? 'bg-green-900' : 'bg-green-100'
              }`}>
                <svg className={`h-6 w-6 ${
                  completingGroup.isCompleted 
                    ? 'text-yellow-600' 
                    : 'text-green-600'
                }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d={completingGroup.isCompleted 
                          ? "M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                          : "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"} />
                </svg>
              </div>
              
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {completingGroup.isCompleted ? 'Reopen Group' : 'Complete Group'}
              </h3>
            </div>

            <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'} mb-6`}>
              {completingGroup.isCompleted 
                ? `Are you sure you want to reopen "${completingGroup.name}"? This will mark it as active again.`
                : `Are you sure you want to mark "${completingGroup.name}" as completed? This indicates you've achieved the group's goals.`
              }
            </p>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCompletionModal(false);
                  setCompletingGroup(null);
                }}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors
                          ${isDark 
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                Cancel
              </button>
              <button
                onClick={() => handleToggleCompletion(completingGroup._id, completingGroup.isCompleted)}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                  completingGroup.isCompleted 
                    ? 'bg-yellow-600 hover:bg-yellow-700'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {completingGroup.isCompleted ? 'Reopen Group' : 'Complete Group'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Confirmation Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-xl max-w-md w-full p-6`}>
            <div className="flex items-center mb-4">
              <div className={`p-2 rounded-full mr-3 ${
                bulkActionType === 'complete' 
                  ? isDark ? 'bg-green-900' : 'bg-green-100'
                  : bulkActionType === 'delete'
                    ? isDark ? 'bg-red-900' : 'bg-red-100'
                    : isDark ? 'bg-purple-900' : 'bg-purple-100'
              }`}>
                <svg className={`h-6 w-6 ${
                  bulkActionType === 'complete' 
                    ? 'text-green-600'
                    : bulkActionType === 'delete'
                      ? 'text-red-600'
                      : 'text-purple-600'
                }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d={bulkActionType === 'complete' 
                          ? "M5 13l4 4L19 7"
                          : bulkActionType === 'delete'
                            ? "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            : "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"} />
                </svg>
              </div>
              
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {bulkActionType === 'complete' ? 'Mark Groups Complete' : 
                 bulkActionType === 'delete' ? 'Delete Groups' : 
                 'Bulk Action Confirmation'}
              </h3>
            </div>

            <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'} mb-6`}>
              {bulkActionType === 'complete' 
                ? `Are you sure you want to mark ${selectedGroups.size} selected group${selectedGroups.size !== 1 ? 's' : ''} as completed?`
                : bulkActionType === 'delete'
                  ? `Are you sure you want to delete ${selectedGroups.size} selected group${selectedGroups.size !== 1 ? 's' : ''}? This action cannot be undone.`
                  : `Are you sure you want to perform this action on ${selectedGroups.size} selected group${selectedGroups.size !== 1 ? 's' : ''}?`
              }
            </p>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowBulkModal(false);
                  setBulkActionType(null);
                }}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors
                          ${isDark 
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                Cancel
              </button>
              <button
                onClick={executeBulkAction}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                  bulkActionType === 'complete' 
                    ? 'bg-green-600 hover:bg-green-700'
                    : bulkActionType === 'delete'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-purple-600 hover:bg-purple-700'
                }`}
              >
                {bulkActionType === 'complete' ? 'Mark Complete' : 
                 bulkActionType === 'delete' ? 'Delete Groups' : 
                 'Confirm Action'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Groups;