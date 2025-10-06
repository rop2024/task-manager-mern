import React from 'react';

const TaskStats = ({ stats, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          </div>
        ))}
      </div>
    );
  }

  const statItems = [
    { label: 'Total Tasks', value: stats.total, color: 'bg-blue-500', textColor: 'text-blue-600' },
    { label: 'Pending', value: stats.pending, color: 'bg-yellow-500', textColor: 'text-yellow-600' },
    { label: 'In Progress', value: stats['in-progress'], color: 'bg-blue-500', textColor: 'text-blue-600' },
    { label: 'Completed', value: stats.completed, color: 'bg-green-500', textColor: 'text-green-600' }
  ];

  const getPercentage = (value, total) => {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {statItems.map((item, index) => (
        <div key={index} className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{item.label}</p>
              <p className="text-2xl font-bold text-gray-900">{item.value}</p>
              {item.label !== 'Total Tasks' && (
                <p className="text-xs text-gray-500 mt-1">
                  {getPercentage(item.value, stats.total)}% of total
                </p>
              )}
            </div>
            <div className={`w-12 h-12 rounded-full ${item.color} bg-opacity-20 flex items-center justify-center`}>
              <div className={`w-8 h-8 rounded-full ${item.color} flex items-center justify-center`}>
                <span className="text-white text-sm font-bold">{item.value}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TaskStats;