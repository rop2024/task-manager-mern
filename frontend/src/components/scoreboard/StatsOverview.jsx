import React from 'react';
import ProductivityScore from './ProductivityScore';
import StatsCard from './StatsCard';

const StatsOverview = ({ stats, rank, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <div className="text-gray-400 text-6xl mb-4">📊</div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">No Statistics Yet</h3>
        <p className="text-gray-600">Complete some tasks to see your productivity statistics.</p>
      </div>
    );
  }

  const completionRate = stats.completionRate || 0;
  const productivityScore = stats.productivityScore || 0;

  return (
    <div className="space-y-6">
      {/* Productivity Score */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row items-center justify-between">
          <div className="text-center lg:text-left mb-6 lg:mb-0">
            <h2 className="text-2xl font-bold text-gray-800">Productivity Overview</h2>
            <p className="text-gray-600 mt-2">
              Your performance based on task completion, streaks, and activity
            </p>
            {rank && (
              <div className="mt-3 flex items-center justify-center lg:justify-start space-x-4 text-sm">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                  Rank: {rank.rank} of {rank.totalUsers}
                </span>
                <span className="text-gray-600">
                  Top {rank.percentile}%
                </span>
              </div>
            )}
          </div>
          <ProductivityScore score={productivityScore} size="large" />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Tasks"
          value={stats.totalTasks || 0}
          subtitle="All time"
          icon="📋"
          color="blue"
        />

        <StatsCard
          title="Completed"
          value={stats.completedTasks || 0}
          subtitle={`${completionRate}% completion rate`}
          icon="✅"
          color="green"
          trend={{
            direction: stats.weeklyCompleted > 0 ? 'up' : 'neutral',
            value: `${stats.weeklyCompleted || 0} this week`,
            period: ''
          }}
        />

        <StatsCard
          title="Current Streak"
          value={stats.currentStreak || 0}
          subtitle="Days in a row"
          icon="🔥"
          color="yellow"
        />

        <StatsCard
          title="Overdue"
          value={stats.overdueTasks || 0}
          subtitle="Need attention"
          icon="⏰"
          color="red"
        />
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatsCard
          title="In Progress"
          value={stats.inProgressTasks || 0}
          subtitle="Active tasks"
          icon="🔄"
          color="indigo"
        />

        <StatsCard
          title="High Priority"
          value={stats.highPriorityTasks || 0}
          subtitle="Urgent tasks"
          icon="🚨"
          color="red"
        />

        <StatsCard
          title="Groups"
          value={stats.totalGroups || 0}
          subtitle="Projects"
          icon="📁"
          color="purple"
        />
      </div>

      {/* Weekly/Monthly Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatsCard
          title="Weekly Progress"
          value={stats.weeklyCompleted || 0}
          subtitle="Tasks completed this week"
          icon="📅"
          color="green"
        />

        <StatsCard
          title="Monthly Progress"
          value={stats.monthlyCompleted || 0}
          subtitle="Tasks completed this month"
          icon="📊"
          color="blue"
        />
      </div>
    </div>
  );
};

export default StatsOverview;