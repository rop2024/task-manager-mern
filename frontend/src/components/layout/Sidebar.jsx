import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import GroupForm from '../group/GroupForm';
import ThemeToggle from './ThemeToggle';
import { useTheme } from '../../context/ThemeContext';
import axios from 'axios';

const Sidebar = ({ groups, onGroupCreate, onGroupEdit, selectedGroup, onGroupSelect, onGroupDeleted, isMobileOpen, onMobileClose }) => {
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const location = useLocation();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const handleGroupCreate = async (groupData) => {
    await onGroupCreate(groupData);
    setShowGroupForm(false);
  };
  
  const handleDeleteClick = (group, e) => {
    e.stopPropagation();
    setGroupToDelete(group);
    setDeleteError(null);
    setShowDeleteConfirm(true);
  };
  
  const handleDeleteConfirm = async () => {
    if (!groupToDelete) return;
    
    try {
      setIsDeleting(true);
      await axios.delete(`/api/groups/${groupToDelete._id}`);
      
      // If the deleted group was selected, clear selection
      if (selectedGroup && selectedGroup._id === groupToDelete._id) {
        onGroupSelect(null);
      }
      
      // Refresh groups list
      if (onGroupDeleted) {
        onGroupDeleted();
      }
      
      setShowDeleteConfirm(false);
      setGroupToDelete(null);
    } catch (error) {
      console.error('Error deleting group:', error);
      if (error.response && error.response.data && error.response.data.message) {
        setDeleteError(error.response.data.message);
      } else {
        setDeleteError('An error occurred while deleting the group');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const isTasksPage = location.pathname === '/tasks';

  const handleLinkClick = () => {
    if (onMobileClose) onMobileClose();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        ${isDark ? 'bg-gray-800 text-white' : 'bg-white'} 
        shadow-lg h-screen fixed left-0 top-0 overflow-y-auto z-50
        transition-transform duration-300 ease-in-out
        w-64
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Task Manager</h1>
            <ThemeToggle />
          </div>
          <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Organize your work</p>
        </div>

        {/* Navigation */}
        <nav className="space-y-2 mb-8">
          <Link
            to="/tasks"
            className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
              isTasksPage && !selectedGroup
                ? `${isDark ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'} border-r-2 border-blue-600`
                : `${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`
            }`}
            onClick={() => {
              onGroupSelect(null);
              handleLinkClick();
            }}
          >
            <span className="mr-3">📋</span>
            All Tasks
          </Link>
          
          <Link
            to="/dashboard"
            className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
              location.pathname === '/dashboard'
                ? `${isDark ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-700'} border-r-2 border-green-600`
                : `${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`
            }`}
            onClick={handleLinkClick}
          >
            <span className="mr-3">📈</span>
            Dashboard
          </Link>
          
          <Link
            to="/calendar"
            className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
              location.pathname === '/calendar'
                ? `${isDark ? 'bg-purple-900 text-purple-300' : 'bg-purple-100 text-purple-700'} border-r-2 border-purple-600`
                : `${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`
            }`}
            onClick={handleLinkClick}
          >
            <span className="mr-3">📅</span>
            Calendar
          </Link>
          
          {!isTasksPage && (
            <Link
              to="/inbox"
              className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                location.pathname === '/inbox'
                  ? `${isDark ? 'bg-yellow-900 text-yellow-300' : 'bg-yellow-100 text-yellow-700'} border-r-2 border-yellow-600`
                  : `${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`
              }`}
              onClick={handleLinkClick}
            >
              <span className="mr-3">📥</span>
              Inbox
            </Link>
          )}
        </nav>

        {/* Groups Section */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-600'} uppercase tracking-wide`}>
              Groups
            </h2>
            <button
              onClick={() => {
                console.log('Create group button clicked');
                setShowGroupForm(true);
              }}
              className={`p-1 rounded ${isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'} transition-colors`}
              title="Create New Group"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          <div className="space-y-1">
            {groups.map(group => (
              <button
                key={group._id}
                onClick={() => {
                  onGroupSelect(group);
                  handleLinkClick();
                }}
                className={`flex items-center justify-between w-full px-3 py-2 rounded-lg transition-colors text-left group ${
                  selectedGroup?._id === group._id
                    ? `${isDark ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'} border-r-2 border-blue-600`
                    : `${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`
                }`}
              >
                <div className="flex items-center flex-1 min-w-0">
                  <span 
                    className="mr-3 text-lg"
                    style={{ color: group.color }}
                  >
                    {group.icon}
                  </span>
                  <span className="truncate flex-1">{group.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-xs ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'} px-1.5 py-0.5 rounded-full`}>
                    {group.taskCount}
                  </span>
                  {!group.isDefault && (
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onGroupEdit(group);
                        }}
                        className={`p-1 rounded ${isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'} transition-colors`}
                        title="Edit Group"
                      >
                        <svg className={`w-3 h-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => handleDeleteClick(group, e)}
                        className={`p-1 rounded ${isDark ? 'hover:bg-red-900' : 'hover:bg-red-100'} transition-colors`}
                        title="Delete Group"
                      >
                        <svg className={`w-3 h-3 ${isDark ? 'text-red-400' : 'text-red-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Group Form Modal */}
      {showGroupForm && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[100] overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              console.log('Backdrop clicked, closing modal');
              setShowGroupForm(false);
            }
          }}
        >
          <div className="w-full max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 rounded-lg shadow-xl">
            {console.log('GroupForm modal is rendering')}
            <GroupForm
              onSubmit={handleGroupCreate}
              onCancel={() => {
                console.log('GroupForm cancel clicked');
                setShowGroupForm(false);
              }}
              loading={false}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && groupToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} rounded-lg shadow-lg p-6 max-w-md w-full`}>
            <h3 className="text-xl font-bold mb-4">Delete Group</h3>
            
            <p className="mb-6">
              Are you sure you want to delete the group "{groupToDelete.name}"?
              {groupToDelete.taskCount > 0 && (
                <span className="block mt-2 text-red-500 font-semibold">
                  This group has {groupToDelete.taskCount} tasks. 
                  You cannot delete a group that contains tasks.
                </span>
              )}
            </p>
            
            {deleteError && (
              <div className="mb-6 p-3 bg-red-100 border border-red-200 text-red-800 rounded-md">
                {deleteError}
              </div>
            )}
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setGroupToDelete(null);
                }}
                className={`px-4 py-2 border rounded-md shadow-sm text-sm font-medium 
                ${isDark ? 'border-gray-600 bg-gray-700 text-white hover:bg-gray-600' : 
                'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}`}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting || groupToDelete.taskCount > 0}
                className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                ${isDeleting ? 'bg-gray-400 cursor-not-allowed' : 
                  groupToDelete.taskCount > 0 ? 'bg-gray-400 cursor-not-allowed' : 
                  'bg-red-600 hover:bg-red-700'}`}
              >
                {isDeleting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto"></div>
                ) : (
                  'Delete Group'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default Sidebar;