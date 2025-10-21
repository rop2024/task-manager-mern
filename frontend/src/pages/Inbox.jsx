import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import QuickAddInput from '../components/inbox/QuickAddInput';
import InboxItem from '../components/inbox/InboxItem';
import InboxStats from '../components/inbox/InboxStats';
import usePageTitle from '../hooks/usePageTitle';

const Inbox = () => {
  usePageTitle('Inbox');
  const { user } = useAuth();
  const [inboxItems, setInboxItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [showProcessed, setShowProcessed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch inbox data
  const fetchInboxData = async () => {
    try {
      setLoading(true);
      const [itemsResponse, statsResponse] = await Promise.all([
        axios.get(`/api/inbox?includePromoted=${showProcessed}`),
        axios.get('/api/inbox/stats')
      ]);

      setInboxItems(itemsResponse.data.data);
      setStats(statsResponse.data.data);
    } catch (error) {
      console.error('Error fetching inbox data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInboxData();
  }, [showProcessed]);

  const refreshData = () => {
    setRefreshing(true);
    fetchInboxData();
  };

  // Handle new item added via quick input
  const handleItemAdded = (newItem) => {
    setInboxItems(prev => [newItem, ...prev]);
    refreshData(); // Refresh stats
  };

  // Promote item to task
  const handlePromoteItem = async (itemId) => {
    try {
      const response = await axios.post(`/api/inbox/${itemId}/promote`);
      
      // Remove from local state or update if showing processed
      if (!showProcessed) {
        setInboxItems(prev => prev.filter(item => item._id !== itemId));
      } else {
        setInboxItems(prev => prev.map(item => 
          item._id === itemId ? { ...item, isPromoted: true } : item
        ));
      }
      
      refreshData(); // Refresh stats
      
      // Optional: Show success message or navigate to tasks
      console.log('Item promoted:', response.data.data.task);
    } catch (error) {
      console.error('Error promoting item:', error);
      throw error;
    }
  };

  // Update inbox item
  const handleUpdateItem = async (itemId, updates) => {
    try {
      const response = await axios.put(`/api/inbox/${itemId}`, updates);
      setInboxItems(prev => prev.map(item => 
        item._id === itemId ? response.data.data : item
      ));
    } catch (error) {
      console.error('Error updating item:', error);
      throw error;
    }
  };

  // Delete inbox item
  const handleDeleteItem = async (itemId) => {
    try {
      await axios.delete(`/api/inbox/${itemId}`);
      setInboxItems(prev => prev.filter(item => item._id !== itemId));
      refreshData(); // Refresh stats
    } catch (error) {
      console.error('Error deleting item:', error);
      throw error;
    }
  };

  // Bulk delete all processed items
  const handleBulkDeleteProcessed = async () => {
    if (!window.confirm('Are you sure you want to delete all processed inbox items? This action cannot be undone.')) {
      return;
    }

    try {
      const processedIds = inboxItems
        .filter(item => item.isPromoted)
        .map(item => item._id);

      if (processedIds.length === 0) return;

      await axios.delete('/api/inbox/bulk', {
        data: { itemIds: processedIds }
      });

      setInboxItems(prev => prev.filter(item => !item.isPromoted));
      refreshData(); // Refresh stats
    } catch (error) {
      console.error('Error bulk deleting processed items:', error);
      alert('Error deleting processed items: ' + (error.response?.data?.message || error.message));
    }
  };

  const unpromotedItems = inboxItems.filter(item => !item.isPromoted);
  const promotedItems = inboxItems.filter(item => item.isPromoted);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inbox</h1>
            <p className="text-gray-600 mt-2">
              Capture ideas and tasks quickly. Process them later.
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={refreshData}
              disabled={refreshing}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
            >
              {refreshing ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              Refresh
            </button>
          </div>
        </div>

        {/* Quick Add Input */}
        <QuickAddInput 
          onItemAdded={handleItemAdded}
          placeholder="What's on your mind? Add a task, idea, or reminder..."
        />

        {/* Inbox Stats */}
        <InboxStats stats={stats} loading={loading} />

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showProcessed"
                  checked={showProcessed}
                  onChange={(e) => setShowProcessed(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="showProcessed" className="ml-2 block text-sm text-gray-700">
                  Show processed items
                </label>
              </div>
              
              {showProcessed && promotedItems.length > 0 && (
                <button
                  onClick={handleBulkDeleteProcessed}
                  className="text-sm text-red-600 hover:text-red-700 px-3 py-1 border border-red-200 rounded hover:bg-red-50 transition-colors"
                >
                  Clear All Processed
                </button>
              )}
            </div>
            
            <div className="text-sm text-gray-500">
              {unpromotedItems.length} to process
              {showProcessed && promotedItems.length > 0 && ` • ${promotedItems.length} processed`}
            </div>
          </div>
        </div>

        {/* Inbox Items */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : inboxItems.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {showProcessed ? 'No processed items' : 'Your inbox is empty'}
            </h3>
            <p className="text-gray-500">
              {showProcessed 
                ? 'Processed items will appear here when you promote inbox items to tasks.'
                : 'Start by adding tasks, ideas, or reminders using the input above.'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {inboxItems.map((item) => (
              <InboxItem
                key={item._id}
                item={item}
                onPromote={handlePromoteItem}
                onUpdate={handleUpdateItem}
                onDelete={handleDeleteItem}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Inbox;