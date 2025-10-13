import React from 'react';
import ProductivityScore from './ProductivityScore';
import StatsCard from './StatsCard';

const StatsOverview = ({ stats, loading }) => {
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
          </div>
          <ProductivityScore score={productivityScore} size="large" />
        </div>
      </div>

      {/* Task Status Block */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          📋 Task Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-2xl font-bold text-blue-600">{stats.totalTasks || 0}</div>
            <div className="text-sm text-blue-700 font-medium">Total Tasks</div>
            <div className="text-xs text-blue-600 mt-1">All time</div>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="text-2xl font-bold text-green-600">{stats.completedTasks || 0}</div>
            <div className="text-sm text-green-700 font-medium">Completed</div>
            <div className="text-xs text-green-600 mt-1">{completionRate}% completion rate</div>
          </div>
          
          <div className="text-center p-4 bg-indigo-50 rounded-lg border border-indigo-200">
            <div className="text-2xl font-bold text-indigo-600">{stats.inProgressTasks || 0}</div>
            <div className="text-sm text-indigo-700 font-medium">In Progress</div>
            <div className="text-xs text-indigo-600 mt-1">Active tasks</div>
          </div>
          
          <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="text-2xl font-bold text-red-600">{stats.overdueTasks || 0}</div>
            <div className="text-sm text-red-700 font-medium">Overdue</div>
            <div className="text-xs text-red-600 mt-1">Need attention</div>
          </div>
        </div>
      </div>

      {/* Streak & Priority Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatsCard
          title="Current Streak"
          value={stats.currentStreak || 0}
          subtitle="Days in a row"
          icon="�"
          color="yellow"
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