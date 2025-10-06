import React from 'react';

const Leaderboard = ({ data, currentUserId }) => {
  const getRankColor = (rank) => {
    switch (rank) {
      case 1: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 2: return 'bg-gray-100 text-gray-800 border-gray-200';
      case 3: return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-white text-gray-800 border-gray-200';
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Leaderboard</h3>
        <div className="text-center text-gray-500 py-8">
          No data available yet. Complete some tasks to appear on the leaderboard!
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Performers</h3>
      <div className="space-y-3">
        {data.map((item, index) => {
          const rank = index + 1;
          const isCurrentUser = item.user?._id === currentUserId;
          
          return (
            <div
              key={item._id || index}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                getRankColor(rank)
              } ${isCurrentUser ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  rank <= 3 ? 'bg-white' : 'bg-gray-100'
                }`}>
                  {getRankIcon(rank)}
                </div>
                <div>
                  <div className="font-medium">
                    {isCurrentUser ? 'You' : item.user?.name || 'Anonymous'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {item.completedTasks} tasks completed
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-lg">{item.productivityScore}</div>
                <div className="text-xs text-gray-500">Score</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Leaderboard;