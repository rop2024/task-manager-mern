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

  // Fetch drafts
  const fetchDrafts = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/drafts');
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
  }, []);

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



  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${isDark ? 'border-blue-400' : 'border-blue-500'}`}></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">


      {/* Drafts List */}
      {drafts.length === 0 ? (
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm p-12 text-center`}>
          <div className="text-6xl mb-4">📝</div>
          <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
            No Drafts Yet
          </h3>
          <p className={`mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Your drafted ideas will appear here when you save them for later
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {drafts.map((draft) => (
            <div
              key={draft._id}
              className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm 
                        hover:shadow-md transition-all duration-200 p-4 border border-gray-200`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  {/* Draft Name */}
                  <h3 className={`text-base font-medium mb-1 ${isDark ? 'text-white' : 'text-gray-900'} truncate`}>
                    {draft.title}
                  </h3>

                  {/* Draft Time */}
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {new Date(draft.createdAt).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>

                {/* Delete Button */}
                <button
                  onClick={() => handleDeleteDraft(draft._id)}
                  className={`p-2 rounded-lg transition-colors flex-shrink-0 ml-3
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DraftsList;