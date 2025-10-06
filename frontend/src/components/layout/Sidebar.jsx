import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import GroupForm from '../group/GroupForm';

const Sidebar = ({ groups, onGroupCreate, onGroupEdit, selectedGroup, onGroupSelect }) => {
  const [showGroupForm, setShowGroupForm] = useState(false);
  const location = useLocation();

  const handleGroupCreate = async (groupData) => {
    await onGroupCreate(groupData);
    setShowGroupForm(false);
  };

  const isTasksPage = location.pathname === '/tasks';

  return (
    <div className="w-64 bg-white shadow-lg h-screen fixed left-0 top-0 overflow-y-auto">
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-xl font-bold text-gray-800">Task Manager</h1>
          <p className="text-sm text-gray-600">Organize your work</p>
        </div>

        {/* Navigation */}
        <nav className="space-y-2 mb-8">
          <Link
            to="/tasks"
            className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
              isTasksPage && !selectedGroup
                ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-600'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            onClick={() => onGroupSelect(null)}
          >
            <span className="mr-3">📋</span>
            All Tasks
          </Link>
        </nav>

        {/* Groups Section */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
              Groups
            </h2>
            <button
              onClick={() => setShowGroupForm(true)}
              className="p-1 rounded hover:bg-gray-100 transition-colors"
              title="Create New Group"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          <div className="space-y-1">
            {groups.map(group => (
              <button
                key={group._id}
                onClick={() => onGroupSelect(group)}
                className={`flex items-center justify-between w-full px-3 py-2 rounded-lg transition-colors text-left group ${
                  selectedGroup?._id === group._id
                    ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
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
                  <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">
                    {group.taskCount}
                  </span>
                  {!group.isDefault && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onGroupEdit(group);
                      }}
                      className="p-1 rounded hover:bg-gray-200 transition-colors opacity-0 group-hover:opacity-100"
                      title="Edit Group"
                    >
                      <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Group Form Modal */}
      {showGroupForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <GroupForm
            onSubmit={handleGroupCreate}
            onCancel={() => setShowGroupForm(false)}
            loading={false}
          />
        </div>
      )}
    </div>
  );
};

export default Sidebar;