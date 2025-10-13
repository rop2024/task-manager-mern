import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../hooks/useToast';
import axios from 'axios';

const DraftsList = ({ onDraftPromoted, showInSidebar = false }) => {
  const { theme } = useTheme();
  const { addToast } = useToast();
  const isDark = theme === 'dark';
  
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'inbox', 'quick', 'taskform'
  const [promotingDraft, setPromotingDraft] = useState(null);

  // Fetch drafts
  const fetchDrafts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      // Only apply filters when not in sidebar mode
      if (!showInSidebar && filter !== 'all') {
        params.append('source', filter);
      }
      
      const response = await axios.get(`/api/drafts?${params}`);
      setDrafts(response.data.data);
    } catch (error) {
      console.error('Error fetching drafts:', error);
      addToast('Failed to load drafts', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrafts();
  }, [filter, showInSidebar]);

  // Handle draft promotion
  const handlePromoteDraft = async (draftId) => {
    try {
      setPromotingDraft(draftId);
      const response = await axios.post(`/api/drafts/${draftId}/promote`);
      
      // Remove from drafts list
      setDrafts(prev => prev.filter(draft => draft._id !== draftId));
      
      addToast('Draft promoted to task successfully!', 'success');
      
      // Call callback if provided
      if (onDraftPromoted) {
        onDraftPromoted(response.data.data);
      }
    } catch (error) {
      console.error('Error promoting draft:', error);
      addToast('Failed to promote draft', 'error');
    } finally {
      setPromotingDraft(null);
    }
  };

  // Handle draft deletion
  const handleDeleteDraft = async (draftId) => {
    if (!window.confirm('Are you sure you want to delete this draft?')) {
      return;
    }

    try {
      await axios.delete(`/api/drafts/${draftId}`);
      setDrafts(prev => prev.filter(draft => draft._id !== draftId));
      addToast('Draft deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting draft:', error);
      addToast('Failed to delete draft', 'error');
    }
  };

  const getSourceIcon = (source) => {
    switch (source) {
      case 'inbox':
        return '📥';
      case 'quick':
        return '⚡';
      case 'taskform':
        return '📝';
      default:
        return '📄';
    }
  };

  const getSourceLabel = (source) => {
    switch (source) {
      case 'inbox':
        return 'From Inbox';
      case 'quick':
        return 'Quick Capture';
      case 'taskform':
        return 'Task Form';
      default:
        return 'Draft';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${isDark ? 'border-blue-400' : 'border-blue-500'}`}></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Tabs - Only show when not in sidebar */}
      {!showInSidebar && (
        <div className={`flex space-x-1 ${isDark ? 'bg-gray-800' : 'bg-gray-100'} rounded-lg p-1`}>
          {[
            { value: 'all', label: 'All Drafts' },
            { value: 'quick', label: 'Quick Capture' },
            { value: 'inbox', label: 'From Inbox' },
            { value: 'taskform', label: 'Task Form' }
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                filter === tab.value
                  ? isDark 
                    ? 'bg-gray-700 text-blue-300'
                    : 'bg-white text-blue-600 shadow-sm'
                  : isDark
                    ? 'text-gray-300 hover:text-white'
                    : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Drafts List */}
      {drafts.length === 0 ? (
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm p-12 text-center`}>
          <div className="text-6xl mb-4">📝</div>
          <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
            No Drafts Yet
          </h3>
          <p className={`mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            {filter === 'all' 
              ? 'Your drafted ideas will appear here when you save them for later'
              : `No drafts from ${getSourceLabel(filter).toLowerCase()} yet`
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {drafts.map((draft) => (
            <div
              key={draft._id}
              className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm 
                        hover:shadow-md transition-all duration-200 p-6 border-l-4`}
              style={{ borderLeftColor: draft.isPromoted ? '#10B981' : '#3B82F6' }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Draft Header */}
                  <div className="flex items-center space-x-3 mb-3">
                    <span className="text-lg">{getSourceIcon(draft.source)}</span>
                    <div>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full
                                    ${isDark 
                                      ? 'bg-blue-900 text-blue-200' 
                                      : 'bg-blue-100 text-blue-800'}`}>
                        {getSourceLabel(draft.source)}
                      </span>
                      {draft.isPromoted && (
                        <span className={`ml-2 text-xs font-medium px-2 py-1 rounded-full
                                      ${isDark 
                                        ? 'bg-green-900 text-green-200' 
                                        : 'bg-green-100 text-green-800'}`}>
                          Promoted
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Draft Title */}
                  <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}
                                ${draft.isPromoted ? 'line-through opacity-60' : ''}`}>
                    {draft.title}
                  </h3>

                  {/* Draft Notes */}
                  {draft.notes && (
                    <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-4 
                                 ${draft.isPromoted ? 'opacity-60' : ''}`}>
                      {draft.notes}
                    </p>
                  )}

                  {/* Draft Meta */}
                  <div className={`flex items-center space-x-4 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    <span>Created {new Date(draft.createdAt).toLocaleDateString()}</span>
                    {draft.promotedAt && (
                      <span>Promoted {new Date(draft.promotedAt).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {!draft.isPromoted && (
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handlePromoteDraft(draft._id)}
                      disabled={promotingDraft === draft._id}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg
                               hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20
                               disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                               flex items-center space-x-2"
                    >
                      {promotingDraft === draft._id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Promoting...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 11l3-3m0 0l3 3m-3-3v8m0-13a9 9 0 110 18 9 9 0 010-18z" />
                          </svg>
                          <span>Promote</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleDeleteDraft(draft._id)}
                      className={`p-2 rounded-lg transition-colors
                                ${isDark 
                                  ? 'text-red-400 hover:bg-red-900/20' 
                                  : 'text-red-500 hover:bg-red-50'}`}
                      title="Delete Draft"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DraftsList;