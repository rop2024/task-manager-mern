import React, { useState } from 'react';

const InboxItemCard = ({ item, onDelete, isDeleting = false }) => {
  const [isRetrying, setIsRetrying] = useState(false);
  const [showRetryMessage, setShowRetryMessage] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [finalError, setFinalError] = useState(null);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const handleDeleteClick = async () => {
    // Reset states
    setFinalError(null);
    setRetryCount(0);
    
    try {
      await onDelete(item._id);
    } catch (error) {
      // If initial delete fails, show retry state
      const currentRetryCount = retryCount + 1;
      setRetryCount(currentRetryCount);
      setIsRetrying(true);
      setShowRetryMessage(true);
      
      console.warn(`🔄 Frontend retry triggered for item ${item._id}`, {
        retryCount: currentRetryCount,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      // Auto-retry after 1 second with exponential backoff
      const retryDelay = Math.min(1000 * Math.pow(2, currentRetryCount - 1), 5000);
      
      setTimeout(async () => {
        try {
          await onDelete(item._id, true);
          setIsRetrying(false);
          setShowRetryMessage(false);
          setRetryCount(0);
          console.log(`✅ Frontend retry successful for item ${item._id}`);
        } catch (retryError) {
          setIsRetrying(false);
          setFinalError('Could not delete, please try later.');
          console.error(`💥 Frontend retry failed for item ${item._id}:`, retryError);
        }
      }, retryDelay);
    }
  };

  const handleDismissError = () => {
    setFinalError(null);
    setRetryCount(0);
    setIsRetrying(false);
    setShowRetryMessage(false);
  };

  return (
    <div className={`
      group relative bg-white rounded-lg border border-gray-200 p-4 mb-3 
      transition-all duration-200 hover:shadow-md hover:border-gray-300
      ${isDeleting ? 'opacity-50 pointer-events-none' : ''}
      ${isRetrying ? 'border-yellow-200 bg-yellow-50' : ''}
      ${finalError ? 'border-red-200 bg-red-50' : ''}
    `}>
      {/* Retry Indicator */}
      {isRetrying && (
        <div className="absolute top-2 right-2 flex items-center space-x-1 bg-yellow-100 px-2 py-1 rounded-full">
          <svg className="h-3 w-3 text-yellow-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="text-xs text-yellow-700 font-medium">
            Retrying... ({retryCount})
          </span>
        </div>
      )}

      {/* Final Error Indicator */}
      {finalError && (
        <div className="absolute top-2 right-2 flex items-center space-x-1 bg-red-100 px-2 py-1 rounded-full">
          <svg className="h-3 w-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs text-red-700 font-medium">Failed</span>
        </div>
      )}
      
      {/* Content */}
      <div className={`${finalError ? 'pr-16' : 'pr-8'}`}>
        <h3 className="font-medium text-gray-900 text-sm leading-tight mb-2 line-clamp-2">
          {item.title}
        </h3>
        
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{formatDate(item.createdAt)}</span>
          </div>
        </div>

        {/* Final Error Message */}
        {finalError && (
          <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded text-xs text-red-700">
            <div className="flex items-center justify-between">
              <span>{finalError}</span>
              <button
                onClick={handleDismissError}
                className="text-red-500 hover:text-red-700 ml-2"
                title="Dismiss error"
              >
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Button */}
      {!finalError && (
        <button
          onClick={handleDeleteClick}
          disabled={isDeleting || isRetrying}
          className={`
            absolute top-3 right-3 p-1 rounded transition-all duration-200
            ${isDeleting || isRetrying 
              ? 'text-gray-400 cursor-not-allowed' 
              : 'text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100'
            }
          `}
          title={isRetrying ? `Retrying deletion... (${retryCount})` : "Delete item"}
        >
          {isRetrying ? (
            <svg className="h-4 w-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          )}
        </button>
      )}

      {/* Retry Message Toast */}
      {showRetryMessage && !finalError && (
        <div className="absolute bottom-2 left-2 right-2 bg-yellow-100 border border-yellow-300 rounded px-2 py-1">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-1">
              <svg className="h-3 w-3 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="text-yellow-700">
                Retrying deletion... (Attempt {retryCount})
              </span>
            </div>
            <button 
              onClick={() => setShowRetryMessage(false)}
              className="text-yellow-600 hover:text-yellow-800"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InboxItemCard;