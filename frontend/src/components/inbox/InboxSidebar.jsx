import React, { useState, useEffect } from 'react';
import axios from 'axios';
import InboxItemCard from './InboxItemCard';
import { useToast } from '../../hooks/useToast';
import Toast from '../ui/Toast';

const InboxSidebar = () => {
  const { toasts, addToast, removeToast, success, error: showError, warning } = useToast();
  const [inboxItems, setInboxItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingItems, setDeletingItems] = useState(new Set());
  const [retryCounts, setRetryCounts] = useState({});
  const [fetchRetryCount, setFetchRetryCount] = useState(0);
  const [fetchError, setFetchError] = useState(null);

  // Enhanced fetch function with retry logic
  const fetchInboxItems = async (isRetry = false) => {
    if (isRetry) {
      setFetchRetryCount(prev => prev + 1);
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get('/api/inbox/sidebar', {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 15000, // 15 second timeout
      });

      if (response.data.success) {
        setInboxItems(response.data.data);
        setFetchRetryCount(0); // Reset retry count on success
        setFetchError(null);
        
        console.log('✅ Successfully fetched inbox items', {
          count: response.data.data.length,
          requestId: response.data.requestId
        });

        if (response.data.data.length === 0) {
          addToast('Your inbox is empty', 'info', 2000);
        }
      } else {
        throw new Error(response.data.message || 'Failed to fetch inbox items');
      }
    } catch (err) {
      console.error('❌ Error fetching inbox items:', {
        error: err.message,
        retryCount: fetchRetryCount,
        isRetry,
        timestamp: new Date().toISOString()
      });

      const errorMessage = err.response?.data?.message || err.message || 'Failed to load inbox items';
      setError(errorMessage);
      setFetchError(errorMessage);

      // Auto-retry for network errors (up to 3 times)
      if (!isRetry && fetchRetryCount < 3 && 
          (err.code === 'NETWORK_ERROR' || err.message.includes('timeout'))) {
        
        console.log(`🔄 Auto-retrying inbox fetch in 2 seconds... (${fetchRetryCount + 1}/3)`);
        
        setTimeout(() => {
          fetchInboxItems(true);
        }, 2000);
      } else {
        showError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Delete inbox item
  const handleDeleteItem = async (itemId, isRetry = false) => {
    // If this is not a retry, add to deleting items set
    if (!isRetry) {
      setDeletingItems(prev => new Set(prev).add(itemId));
    }

    // Update retry count
    if (isRetry) {
      setRetryCounts(prev => ({
        ...prev,
        [itemId]: (prev[itemId] || 0) + 1
      }));
    }

    try {
      const response = await axios.post(
        `/api/inbox/${itemId}/deleteManual`,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000, // 10 second timeout
        }
      );

      if (response.data.success) {
        // Optimistic update - remove item from list
        setInboxItems(prev => prev.filter(item => item._id !== itemId));
        
        // Show success message
        if (isRetry) {
          success('Item deleted successfully after retry');
        } else {
          success('Item deleted successfully');
        }
      } else {
        throw new Error(response.data.message || 'Delete failed');
      }
    } catch (err) {
      console.error('Error deleting inbox item:', err);
      
      // If not a retry, show warning and throw for retry logic
      if (!isRetry) {
        warning('Failed to delete item. Retrying...', 2000);
        throw err;
      } else {
        // If retry also failed, show error
        const errorMessage = 'Failed to delete item. Please try again.';
        setError(errorMessage);
        showError(errorMessage);
        
        // Remove from deleting items after retry failure
        setTimeout(() => {
          setDeletingItems(prev => {
            const newSet = new Set(prev);
            newSet.delete(itemId);
            return newSet;
          });
        }, 2000);
      }
    } finally {
      // Only remove from deleting items if this wasn't a retry
      // (retry will handle its own state)
      if (!isRetry) {
        setTimeout(() => {
          setDeletingItems(prev => {
            const newSet = new Set(prev);
            newSet.delete(itemId);
            return newSet;
          });
        }, 1000);
      }
    }
  };

  // Load inbox items on component mount
  useEffect(() => {
    fetchInboxItems();
  }, []);

  return (
    <div className="w-80 bg-gray-50 border-r border-gray-200 h-screen overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Inbox</h2>
              <p className="text-sm text-gray-500">
                {loading ? 'Loading...' : `${inboxItems.length} items`}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                fetchInboxItems();
                addToast('Refreshing inbox...', 'info', 1000);
              }}
              disabled={loading}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh inbox"
            >
              <svg className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            
            <button
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Add new item"
              onClick={() => {/* Add new item functionality */}}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Task Creation Mode Banner */}
      <div className="flex-shrink-0 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200 p-3">
        <div className="flex items-center space-x-2">
          <div className="bg-blue-100 p-1 rounded">
            <svg className="h-3 w-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <p className="text-xs text-blue-700 flex-1">
            <strong>Task Creation Mode:</strong> Use these items as task ideas
          </p>
        </div>
      </div>

      {/* Error Message */}
      {fetchError && (
        <div className="flex-shrink-0 bg-red-50 border-b border-red-200 p-4">
          <div className="flex items-center space-x-2 text-red-700">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div className="flex-1">
              <span className="text-sm font-medium">{fetchError}</span>
              {fetchRetryCount > 0 && (
                <div className="text-xs text-red-600 mt-1">
                  Retried {fetchRetryCount} time{fetchRetryCount !== 1 ? 's' : ''}. 
                  {fetchRetryCount < 3 ? ' Retrying...' : ' Please refresh manually.'}
                </div>
              )}
            </div>
            <button
              onClick={() => {
                setFetchError(null);
                setFetchRetryCount(0);
              }}
              className="text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          // Loading state
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : inboxItems.length === 0 ? (
          // Empty state
          <div className="text-center py-12">
            <svg className="h-12 w-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="font-medium text-gray-900 mb-1">No items in inbox</h3>
            <p className="text-sm text-gray-500">Items you add will appear here</p>
          </div>
        ) : (
          // Items list
          <div className="space-y-3">
            {inboxItems.map((item) => (
              <InboxItemCard
                key={item._id}
                item={item}
                onDelete={handleDeleteItem}
                isDeleting={deletingItems.has(item._id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 bg-white border-t border-gray-200 p-4">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            {deletingItems.size > 0 
              ? `Deleting ${deletingItems.size} item${deletingItems.size > 1 ? 's' : ''}...`
              : 'All items loaded'
            }
          </span>
          <button
            onClick={() => {
              fetchInboxItems();
              addToast('Refreshing inbox...', 'info', 1000);
            }}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default InboxSidebar;