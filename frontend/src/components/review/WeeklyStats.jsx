import React from 'react';

const WeeklyStats = ({ stats, completedTasks, weekRange, isDark }) => {
  // Calculate completion metrics - use stats if available, fallback to calculating from tasks
  const totalCompleted = stats?.totalCompleted || completedTasks.length;
  const completionsByPriority = stats?.priorityBreakdown || completedTasks.reduce((acc, task) => {
    acc[task.priority || 'medium'] = (acc[task.priority || 'medium'] || 0) + 1;
    return acc;
  }, {});
  
  const completionsByGroup = stats?.groupBreakdown || completedTasks.reduce((acc, task) => {
    const groupName = task.group?.name || 'No Group';
    acc[groupName] = (acc[groupName] || 0) + 1;
    return acc;
  }, {});

  // Calculate daily completions for the week - use backend data if available
  const dailyCompletions = stats?.dailyPattern || Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekRange.start);
    date.setDate(date.getDate() + i);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    const count = completedTasks.filter(task => {
      const taskDate = new Date(task.completedAt);
      return taskDate.toDateString() === date.toDateString();
    }).length;
    return { day: dayName, count, date: date.getDate() };
  });

  const maxDailyCount = Math.max(...dailyCompletions.map(d => d.count), 1);

  // Calculate estimated time saved - use backend data if available
  const totalEstimatedMinutes = stats?.totalTimeSpent || completedTasks.reduce((total, task) => {
    return total + (task.estimatedMinutes || 0);
  }, 0);

  const formatTime = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Overview Cards */}
      <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Completed */}
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl p-4 border ${isDark ? 'border-gray-700' : 'border-gray-200'} shadow-sm`}>
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${isDark ? 'bg-green-900/20' : 'bg-green-50'}`}>
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="ml-3">
              <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Completed
              </p>
              <p className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {totalCompleted}
              </p>
            </div>
          </div>
        </div>

        {/* High Priority Completed */}
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl p-4 border ${isDark ? 'border-gray-700' : 'border-gray-200'} shadow-sm`}>
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${isDark ? 'bg-red-900/20' : 'bg-red-50'}`}>
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                High Priority
              </p>
              <p className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {completionsByPriority.high || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Time Invested */}
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl p-4 border ${isDark ? 'border-gray-700' : 'border-gray-200'} shadow-sm`}>
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${isDark ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Time Invested
              </p>
              <p className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {totalEstimatedMinutes > 0 ? formatTime(totalEstimatedMinutes) : '0m'}
              </p>
            </div>
          </div>
        </div>

        {/* Average per Day */}
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl p-4 border ${isDark ? 'border-gray-700' : 'border-gray-200'} shadow-sm`}>
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${isDark ? 'bg-purple-900/20' : 'bg-purple-50'}`}>
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Daily Avg
              </p>
              <p className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {(totalCompleted / 7).toFixed(1)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Activity Chart */}
      <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 border ${isDark ? 'border-gray-700' : 'border-gray-200'} shadow-sm`}>
        <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>
          Daily Activity
        </h3>
        <div className="space-y-3">
          {dailyCompletions.map((day, index) => (
            <div key={index} className="flex items-center">
              <div className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} w-8`}>
                {day.dayName || day.day}
              </div>
              <div className="flex-1 mx-3">
                <div className={`h-2 ${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded-full overflow-hidden`}>
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-300"
                    style={{ width: `${(day.count / maxDailyCount) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'} w-6 text-right`}>
                {day.count}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Priority & Group Breakdown */}
      {totalCompleted > 0 && (
        <>
          {/* Priority Breakdown */}
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 border ${isDark ? 'border-gray-700' : 'border-gray-200'} shadow-sm`}>
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>
              By Priority
            </h3>
            <div className="space-y-3">
              {Object.entries(completionsByPriority).map(([priority, count]) => {
                const percentage = (count / totalCompleted) * 100;
                const priorityColors = {
                  high: 'bg-red-500',
                  medium: 'bg-yellow-500',
                  low: 'bg-green-500'
                };
                return (
                  <div key={priority} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full ${priorityColors[priority]} mr-2`}></div>
                      <span className={`text-sm capitalize ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        {priority}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'} mr-2`}>
                        {count}
                      </span>
                      <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        ({percentage.toFixed(0)}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Group Breakdown */}
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 border ${isDark ? 'border-gray-700' : 'border-gray-200'} shadow-sm lg:col-span-2`}>
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>
              By Project/Group
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(completionsByGroup).map(([group, groupData]) => {
                // Handle both old format (number) and new format (object with count, color, icon)
                const count = typeof groupData === 'number' ? groupData : groupData.count;
                const color = typeof groupData === 'object' ? groupData.color : '#6B7280';
                const icon = typeof groupData === 'object' ? groupData.icon : '📋';
                const percentage = (count / totalCompleted) * 100;
                
                return (
                  <div key={group} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2" 
                        style={{ backgroundColor: color }}
                      ></div>
                      <span className="mr-1">{icon}</span>
                      <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'} truncate`}>
                        {group}
                      </span>
                    </div>
                    <div className="flex items-center ml-2">
                      <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'} mr-2`}>
                        {count}
                      </span>
                      <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        ({percentage.toFixed(0)}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default WeeklyStats;