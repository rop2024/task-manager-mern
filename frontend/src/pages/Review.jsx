import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import WeeklyStats from '../components/review/WeeklyStats';
import CompletedTasksReview from '../components/review/CompletedTasksReview';
import axios from 'axios';
import usePageTitle from '../hooks/usePageTitle';

const Review = () => {
  usePageTitle('Review');
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState(0); // 0 = current week, -1 = last week, etc.
  const [weeklyData, setWeeklyData] = useState({
    stats: null,
    completedTasks: [],
    weekRange: { start: null, end: null }
  });
  const [insights, setInsights] = useState(null);
  const [trends, setTrends] = useState(null);
  const [quickStats, setQuickStats] = useState(null);
  const [error, setError] = useState(null);

  // Calculate week start and end dates
  const getWeekRange = (weekOffset = 0) => {
    const today = new Date();
    const currentDay = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - currentDay + (weekOffset * 7));
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    return { start: startOfWeek, end: endOfWeek };
  };

  // Fetch weekly review data
  const fetchWeeklyData = async (weekOffset = 0) => {
    try {
      setLoading(true);
      setError(null);
      
      // Use the comprehensive review endpoint
      const reviewResponse = await axios.get('/api/review/weekly', {
        params: {
          weekOffset: weekOffset
        }
      });

      const reviewData = reviewResponse.data.data;
      
      setWeeklyData({
        stats: reviewData.stats || null,
        completedTasks: reviewData.tasks || [],
        weekRange: { 
          start: new Date(reviewData.stats.weekRange.start), 
          end: new Date(reviewData.stats.weekRange.end) 
        },
        weekSummary: reviewData.weekSummary
      });
    } catch (error) {
      console.error('Error fetching weekly data:', error);
      setError(`Failed to load weekly review data: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch insights data
  const fetchInsights = async (weekOffset = 0) => {
    try {
      const response = await axios.get('/api/review/insights', {
        params: { weekOffset }
      });
      setInsights(response.data.data);
    } catch (error) {
      console.error('Error fetching insights:', error);
    }
  };

  // Fetch trends data
  const fetchTrends = async (weeks = 4) => {
    try {
      const response = await axios.get('/api/review/trends', {
        params: { weeks }
      });
      setTrends(response.data.data);
    } catch (error) {
      console.error('Error fetching trends:', error);
    }
  };

  // Fetch quick stats
  const fetchQuickStats = async () => {
    try {
      const response = await axios.get('/api/review/quick-stats');
      setQuickStats(response.data.data);
    } catch (error) {
      console.error('Error fetching quick stats:', error);
    }
  };

  // Load data when component mounts or week changes
  useEffect(() => {
    fetchWeeklyData(selectedWeek);
    fetchInsights(selectedWeek);
    if (selectedWeek === 0) {
      fetchTrends(4);
      fetchQuickStats();
    }
  }, [selectedWeek]);

  // Handle week navigation
  const handleWeekChange = (direction) => {
    setSelectedWeek(prev => prev + direction);
  };

  // Format date range for display
  const formatWeekRange = () => {
    if (!weeklyData.weekRange.start || !weeklyData.weekRange.end) return '';
    
    const start = weeklyData.weekRange.start;
    const end = weeklyData.weekRange.end;
    
    const startStr = start.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
    const endStr = end.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
    
    return `${startStr} - ${endStr}`;
  };

  // Get week title
  const getWeekTitle = () => {
    if (selectedWeek === 0) return 'This Week';
    if (selectedWeek === -1) return 'Last Week';
    if (selectedWeek < -1) return `${Math.abs(selectedWeek)} Weeks Ago`;
    return 'Future Week';
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Loading weekly review...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                📊 Weekly Review
              </h1>
              <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Analyze your productivity and accomplishments
              </p>
            </div>
            
            {/* Week Navigation */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => handleWeekChange(-1)}
                className={`p-2 rounded-lg transition-colors ${
                  isDark 
                    ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
                aria-label="Previous week"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <div className="text-center min-w-[200px]">
                <div className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {getWeekTitle()}
                </div>
                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {formatWeekRange()}
                </div>
              </div>
              
              <button
                onClick={() => handleWeekChange(1)}
                disabled={selectedWeek >= 0}
                className={`p-2 rounded-lg transition-colors ${
                  selectedWeek >= 0
                    ? `${isDark ? 'text-gray-600' : 'text-gray-400'} cursor-not-allowed`
                    : isDark 
                      ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
                aria-label="Next week"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Weekly Statistics */}
        <WeeklyStats 
          stats={weeklyData.stats} 
          completedTasks={weeklyData.completedTasks}
          weekRange={weeklyData.weekRange}
          isDark={isDark}
        />

        {/* Completed Tasks Review */}
        <CompletedTasksReview 
          tasks={weeklyData.completedTasks}
          weekRange={weeklyData.weekRange}
          isDark={isDark}
        />

        {/* Insights and Recommendations */}
        {insights && (
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm border ${isDark ? 'border-gray-700' : 'border-gray-200'} p-6`}>
            <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-6`}>
              💡 Weekly Insights & Recommendations
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Productivity Analysis */}
              <div>
                <h3 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'} mb-3`}>
                  📊 Productivity Analysis
                </h3>
                <div className="space-y-2">
                  <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    This week: <span className="font-semibold">{insights.productivity.currentWeek} tasks</span>
                  </p>
                  <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    Previous week: <span className="font-semibold">{insights.productivity.previousWeek} tasks</span>
                  </p>
                  <div className={`flex items-center text-sm ${
                    insights.productivity.trend === 'up' ? 'text-green-600' :
                    insights.productivity.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    <span className="mr-1">
                      {insights.productivity.trend === 'up' ? '📈' :
                       insights.productivity.trend === 'down' ? '📉' : '➡️'}
                    </span>
                    {insights.productivity.improvement > 0 ? '+' : ''}
                    {insights.productivity.improvement} tasks
                    {insights.productivity.trend === 'up' ? ' improvement' :
                     insights.productivity.trend === 'down' ? ' decrease' : ' (stable)'}
                  </div>
                </div>
              </div>

              {/* Patterns */}
              <div>
                <h3 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'} mb-3`}>
                  🔍 Your Patterns
                </h3>
                <div className="space-y-2">
                  <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    Most productive day: <span className="font-semibold">{insights.patterns.mostProductiveDay}</span>
                  </p>
                  <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    Preferred priority: <span className="font-semibold capitalize">{insights.patterns.preferredPriority}</span>
                  </p>
                  {insights.patterns.averageCompletionTime && (
                    <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      Peak completion time: <span className="font-semibold">{insights.patterns.averageCompletionTime}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <h3 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'} mb-3`}>
                  💡 Recommendations
                </h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {insights.recommendations.map((rec, index) => (
                    <div key={index} className={`p-2 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <p className={`text-xs font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'} mb-1`}>
                        {rec.icon} {rec.title}
                      </p>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {rec.message}
                      </p>
                      {rec.action && (
                        <p className={`text-xs ${isDark ? 'text-blue-400' : 'text-blue-600'} mt-1`}>
                          {rec.action}
                        </p>
                      )}
                    </div>
                  ))}
                  {insights.recommendations.length === 0 && (
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Keep up the great work! 🎉
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Productivity Trends (only show for current week) */}
        {selectedWeek === 0 && trends && (
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm border ${isDark ? 'border-gray-700' : 'border-gray-200'} p-6`}>
            <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-6`}>
              📈 4-Week Productivity Trends
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Trends Chart */}
              <div>
                <h3 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>
                  Completed Tasks Over Time
                </h3>
                <div className="space-y-3">
                  {trends.trends.map((week, index) => (
                    <div key={index} className="flex items-center">
                      <div className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} w-20`}>
                        {week.weekLabel}
                      </div>
                      <div className="flex-1 mx-3">
                        <div className={`h-3 ${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded-full overflow-hidden`}>
                          <div 
                            className="h-full bg-gradient-to-r from-green-500 to-blue-600 rounded-full transition-all duration-300"
                            style={{ width: `${Math.max(5, (week.completed / Math.max(...trends.trends.map(t => t.completed), 1)) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'} w-8 text-right`}>
                        {week.completed}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary Stats */}
              <div>
                <h3 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>
                  Summary Statistics
                </h3>
                <div className="space-y-3">
                  <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Average Completion: {trends.summary.averageCompletion} tasks/week
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Best Week: {trends.summary.bestWeek.completed} tasks
                    </p>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {new Date(trends.summary.bestWeek.weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Total Completed: {trends.summary.totalCompleted} tasks
                    </p>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Last {trends.summary.totalWeeks} weeks
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats Widget (only show for current week) */}
        {selectedWeek === 0 && quickStats && (
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm border ${isDark ? 'border-gray-700' : 'border-gray-200'} p-6`}>
            <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-6`}>
              ⚡ Quick Performance Stats
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className={`text-center p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {quickStats.completedThisWeek}
                </div>
                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Completed This Week
                </div>
              </div>
              
              <div className={`text-center p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {quickStats.dailyAverage}
                </div>
                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Daily Average
                </div>
              </div>
              
              <div className={`text-center p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {Math.round(quickStats.goalProgress)}%
                </div>
                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Weekly Goal
                </div>
              </div>
              
              <div className={`text-center p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {quickStats.streak}
                </div>
                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Day Streak
                </div>
              </div>
            </div>
            
            {quickStats.totalTime > 0 && (
              <div className="mt-4 text-center">
                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Total time invested this week: <span className="font-semibold">
                    {quickStats.totalTime < 60 ? `${quickStats.totalTime}m` : 
                     `${Math.floor(quickStats.totalTime / 60)}h ${quickStats.totalTime % 60}m`}
                  </span>
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Review;