import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import StatsOverview from '../components/scoreboard/StatsOverview';
import Leaderboard from '../components/scoreboard/Leaderboard';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [statsResponse, leaderboardResponse, rankResponse] = await Promise.all([
        axios.get('/api/stats'),
        axios.get('/api/stats/leaderboard'),
        axios.get('/api/stats/rank')
      ]);

      setStats(statsResponse.data.data);
      setLeaderboard(leaderboardResponse.data.data);
      setUserRank(rankResponse.data.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshStats = async () => {
    try {
      await axios.post('/api/stats/update');
      fetchStats();
    } catch (error) {
      console.error('Error refreshing stats:', error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Dashboard
            </h1>
            <p className="text-gray-600 mt-2">
              Track your productivity and progress
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={refreshStats}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Stats
            </button>
            <button
              onClick={() => navigate('/tasks')}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Go to Tasks
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg p-6 text-white mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                Welcome back, {user?.name}! 🎉
              </h2>
              <p className="opacity-90">
                {stats ? `You've completed ${stats.completedTasks} tasks with a ${stats.completionRate}% success rate.` 
                      : 'Start completing tasks to see your productivity statistics.'}
              </p>
            </div>
            {stats && (
              <div className="mt-4 md:mt-0 flex items-center space-x-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.currentStreak || 0}</div>
                  <div className="text-sm opacity-90">Day Streak</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.weeklyCompleted || 0}</div>
                  <div className="text-sm opacity-90">This Week</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📊 Overview
              </button>
              <button
                onClick={() => setActiveTab('leaderboard')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'leaderboard'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                🏆 Leaderboard
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'overview' && (
          <StatsOverview 
            stats={stats} 
            rank={userRank}
            loading={loading} 
          />
        )}

        {activeTab === 'leaderboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Leaderboard 
                data={leaderboard} 
                currentUserId={user?.id}
                loading={loading}
              />
            </div>
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Ranking</h3>
                {userRank ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-blue-600">{userRank.rank}</div>
                      <div className="text-sm text-gray-600">Current Rank</div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-lg font-semibold">{userRank.totalUsers}</div>
                        <div className="text-xs text-gray-600">Total Users</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold">Top {userRank.percentile}%</div>
                        <div className="text-xs text-gray-600">Percentile</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-4">
                    Complete tasks to get ranked!
                  </div>
                )}
              </div>

              {/* Tips */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-yellow-800 mb-3">💡 Improve Your Score</h3>
                <ul className="text-sm text-yellow-700 space-y-2">
                  <li>• Complete tasks consistently to build streaks</li>
                  <li>• Avoid overdue tasks to prevent score penalties</li>
                  <li>• Balance task priorities for optimal productivity</li>
                  <li>• Use groups to organize related tasks</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;