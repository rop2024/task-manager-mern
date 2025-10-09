import React from 'react';

const InboxStats = ({ stats, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Inbox Overview</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="text-sm font-medium text-gray-600">Total Items</div>
          <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="text-sm font-medium text-gray-600">To Process</div>
          <div className="text-2xl font-bold text-blue-600">{stats.unpromoted}</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="text-sm font-medium text-gray-600">Processed</div>
          <div className="text-2xl font-bold text-green-600">{stats.promoted}</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="text-sm font-medium text-gray-600">Process Rate</div>
          <div className="text-2xl font-bold text-purple-600">
            {Math.round(stats.promotionRate)}%
          </div>
        </div>
      </div>

      {stats.recentPromotions && stats.recentPromotions.length > 0 && (
        <div className="mt-6 bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <h4 className="font-medium text-gray-800 mb-3">Recently Processed</h4>
          <div className="space-y-2">
            {stats.recentPromotions.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="text-gray-700 truncate flex-1 mr-2">{item.title}</span>
                <span className="text-gray-500 text-xs whitespace-nowrap">
                  {new Date(item.promotedAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default InboxStats;