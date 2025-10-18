import express from 'express';
import { query, validationResult } from 'express-validator';
import Task from '../models/Task.js';
import Stats from '../models/Stats.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get weekly review data
// @route   GET /api/review/weekly
// @access  Private
router.get('/weekly', protect, [
  query('weekOffset')
    .optional()
    .isInt({ min: -52, max: 0 })
    .withMessage('Week offset must be between -52 and 0'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO date')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { weekOffset = 0, startDate, endDate } = req.query;
    
    // Calculate week dates
    let weekStart, weekEnd;
    
    if (startDate && endDate) {
      weekStart = new Date(startDate);
      weekEnd = new Date(endDate);
    } else {
      const today = new Date();
      const currentDay = today.getDay();
      weekStart = new Date(today);
      weekStart.setDate(today.getDate() - currentDay + (weekOffset * 7));
      weekStart.setHours(0, 0, 0, 0);
      
      weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
    }

    // Fetch completed tasks for the week
    const completedTasks = await Task.find({
      user: req.user.id,
      status: 'completed',
      completedAt: {
        $gte: weekStart,
        $lte: weekEnd
      }
    }).populate('group', 'name color icon')
      .sort({ completedAt: -1 });

    // Fetch all tasks created in the week (for context)
    const allWeekTasks = await Task.find({
      user: req.user.id,
      createdAt: {
        $gte: weekStart,
        $lte: weekEnd
      }
    }).populate('group', 'name color icon');

    // Calculate comprehensive statistics
    const stats = {
      weekRange: { start: weekStart, end: weekEnd },
      totalCompleted: completedTasks.length,
      totalCreated: allWeekTasks.length,
      completionRate: allWeekTasks.length > 0 
        ? ((completedTasks.length / allWeekTasks.length) * 100).toFixed(1)
        : '0.0',
      
      // Time analysis
      totalTimeSpent: completedTasks.reduce((sum, task) => sum + (task.estimatedMinutes || 0), 0),
      averageTimePerTask: completedTasks.length > 0 
        ? Math.round(completedTasks.reduce((sum, task) => sum + (task.estimatedMinutes || 0), 0) / completedTasks.length)
        : 0,
      
      // Priority breakdown
      priorityBreakdown: completedTasks.reduce((acc, task) => {
        const priority = task.priority || 'medium';
        acc[priority] = (acc[priority] || 0) + 1;
        return acc;
      }, {}),
      
      // Group breakdown
      groupBreakdown: completedTasks.reduce((acc, task) => {
        const groupName = task.group?.name || 'No Group';
        acc[groupName] = {
          count: (acc[groupName]?.count || 0) + 1,
          color: task.group?.color || '#6B7280',
          icon: task.group?.icon || '📋'
        };
        return acc;
      }, {}),
      
      // Daily completion pattern
      dailyPattern: Array.from({ length: 7 }, (_, i) => {
        const date = new Date(weekStart);
        date.setDate(date.getDate() + i);
        
        const dayTasks = completedTasks.filter(task => {
          const taskDate = new Date(task.completedAt);
          return taskDate.toDateString() === date.toDateString();
        });
        
        return {
          date: date.toISOString().split('T')[0],
          dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
          dayNumber: date.getDate(),
          count: dayTasks.length,
          timeSpent: dayTasks.reduce((sum, task) => sum + (task.estimatedMinutes || 0), 0),
          tasks: dayTasks.map(task => ({
            id: task._id,
            title: task.title,
            priority: task.priority,
            completedAt: task.completedAt,
            estimatedMinutes: task.estimatedMinutes
          }))
        };
      }),
      
      // Most productive day
      mostProductiveDay: (() => {
        const dailyCounts = {};
        completedTasks.forEach(task => {
          const day = new Date(task.completedAt).getDay();
          dailyCounts[day] = (dailyCounts[day] || 0) + 1;
        });
        
        const maxDay = Object.entries(dailyCounts).reduce((a, b) => 
          dailyCounts[a[0]] > dailyCounts[b[0]] ? a : b, [0, 0]
        );
        
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return {
          day: dayNames[maxDay[0]],
          count: maxDay[1]
        };
      })(),
      
      // Productivity metrics
      dailyAverage: (completedTasks.length / 7).toFixed(1),
      weeklyGoalProgress: Math.min((completedTasks.length / 10) * 100, 100), // Assuming goal of 10 tasks/week
      
      // Task complexity analysis
      complexityAnalysis: {
        hasEstimates: completedTasks.filter(t => t.estimatedMinutes && t.estimatedMinutes > 0).length,
        hasDescriptions: completedTasks.filter(t => t.description && t.description.trim().length > 0).length,
        hasReminders: completedTasks.filter(t => t.reminders && t.reminders.length > 0).length,
        isImportant: completedTasks.filter(t => t.isImportant).length
      }
    };

    res.json({
      success: true,
      data: {
        stats,
        tasks: completedTasks,
        weekSummary: {
          period: `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
          isCurrentWeek: weekOffset === 0,
          weekOffset
        }
      }
    });

  } catch (error) {
    console.error('Weekly review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating weekly review'
    });
  }
});

// @desc    Get productivity insights and recommendations
// @route   GET /api/review/insights
// @access  Private
router.get('/insights', protect, [
  query('weekOffset')
    .optional()
    .isInt({ min: -52, max: 0 })
    .withMessage('Week offset must be between -52 and 0')
], async (req, res) => {
  try {
    const { weekOffset = 0 } = req.query;
    
    // Calculate current week
    const today = new Date();
    const currentDay = today.getDay();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - currentDay + (weekOffset * 7));
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // Get current week data
    const currentWeekTasks = await Task.find({
      user: req.user.id,
      status: 'completed',
      completedAt: { $gte: weekStart, $lte: weekEnd }
    });

    // Get previous week for comparison
    const prevWeekStart = new Date(weekStart);
    prevWeekStart.setDate(weekStart.getDate() - 7);
    const prevWeekEnd = new Date(weekEnd);
    prevWeekEnd.setDate(weekEnd.getDate() - 7);

    const previousWeekTasks = await Task.find({
      user: req.user.id,
      status: 'completed',
      completedAt: { $gte: prevWeekStart, $lte: prevWeekEnd }
    });

    // Get user's overall stats for context
    const userStats = await Stats.findOne({ user: req.user.id });
    
    // Generate insights
    const insights = {
      productivity: {
        currentWeek: currentWeekTasks.length,
        previousWeek: previousWeekTasks.length,
        trend: currentWeekTasks.length > previousWeekTasks.length ? 'up' : 
               currentWeekTasks.length < previousWeekTasks.length ? 'down' : 'stable',
        improvement: currentWeekTasks.length - previousWeekTasks.length
      },
      
      patterns: {
        mostProductiveDay: (() => {
          const dailyCounts = {};
          currentWeekTasks.forEach(task => {
            const day = new Date(task.completedAt).getDay();
            dailyCounts[day] = (dailyCounts[day] || 0) + 1;
          });
          
          const maxDay = Object.entries(dailyCounts).reduce((a, b) => 
            dailyCounts[a[0]] > dailyCounts[b[0]] ? a : b, [0, 0]
          );
          
          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          return dayNames[maxDay[0]];
        })(),
        
        preferredPriority: (() => {
          const priorityCounts = currentWeekTasks.reduce((acc, task) => {
            acc[task.priority || 'medium'] = (acc[task.priority || 'medium'] || 0) + 1;
            return acc;
          }, {});
          
          return Object.entries(priorityCounts).reduce((a, b) => 
            priorityCounts[a[0]] > priorityCounts[b[0]] ? a : b, ['medium', 0]
          )[0];
        })(),
        
        averageCompletionTime: (() => {
          const completionHours = currentWeekTasks.map(task => 
            new Date(task.completedAt).getHours()
          );
          
          if (completionHours.length === 0) return null;
          
          const avgHour = Math.round(
            completionHours.reduce((a, b) => a + b, 0) / completionHours.length
          );
          
          return `${avgHour}:00`;
        })()
      },
      
      recommendations: (() => {
        const recs = [];
        
        // Performance-based recommendations
        if (currentWeekTasks.length >= 8) {
          recs.push({
            type: 'achievement',
            icon: '🎉',
            title: 'Outstanding Performance!',
            message: `You completed ${currentWeekTasks.length} tasks this week. You're crushing your goals!`,
            action: 'Consider setting more challenging targets or taking on bigger projects.'
          });
        } else if (currentWeekTasks.length >= 5) {
          recs.push({
            type: 'positive',
            icon: '👍',
            title: 'Great Progress',
            message: `${currentWeekTasks.length} completed tasks shows solid productivity.`,
            action: 'Try to maintain this momentum and aim for 7-8 tasks next week.'
          });
        } else if (currentWeekTasks.length >= 2) {
          recs.push({
            type: 'improvement',
            icon: '📈',
            title: 'Room for Growth',
            message: 'Your completion rate could be improved.',
            action: 'Try breaking larger tasks into smaller, manageable chunks.'
          });
        } else {
          recs.push({
            type: 'focus',
            icon: '🎯',
            title: 'Let\'s Get Started',
            message: 'Focus on completing small, achievable tasks first.',
            action: 'Set a goal of 3-4 tasks for next week and build from there.'
          });
        }
        
        // Trend-based recommendations
        if (currentWeekTasks.length > previousWeekTasks.length) {
          recs.push({
            type: 'trend',
            icon: '⬆️',
            title: 'Upward Trend',
            message: `${currentWeekTasks.length - previousWeekTasks.length} more tasks completed than last week!`,
            action: 'Keep up the excellent momentum!'
          });
        } else if (currentWeekTasks.length < previousWeekTasks.length) {
          recs.push({
            type: 'trend',
            icon: '💡',
            title: 'Refocus Opportunity',
            message: 'Slight dip from last week - that\'s normal!',
            action: 'Review what worked well last week and apply those strategies again.'
          });
        }
        
        // Pattern-based recommendations
        const highPriorityTasks = currentWeekTasks.filter(t => t.priority === 'high').length;
        if (highPriorityTasks === 0 && currentWeekTasks.length > 0) {
          recs.push({
            type: 'priority',
            icon: '🚀',
            title: 'Priority Focus',
            message: 'No high-priority tasks completed this week.',
            action: 'Consider tackling at least one high-impact task next week.'
          });
        }
        
        return recs.slice(0, 4); // Limit to 4 recommendations
      })()
    };

    res.json({
      success: true,
      data: insights
    });

  } catch (error) {
    console.error('Insights generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating insights'
    });
  }
});

// @desc    Get productivity trends over multiple weeks
// @route   GET /api/review/trends
// @access  Private
router.get('/trends', protect, [
  query('weeks')
    .optional()
    .isInt({ min: 2, max: 12 })
    .withMessage('Weeks must be between 2 and 12')
], async (req, res) => {
  try {
    const { weeks = 4 } = req.query;
    
    const trends = [];
    
    for (let i = 0; i < weeks; i++) {
      const today = new Date();
      const currentDay = today.getDay();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - currentDay - (i * 7));
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const weekTasks = await Task.find({
        user: req.user.id,
        status: 'completed',
        completedAt: { $gte: weekStart, $lte: weekEnd }
      });

      trends.unshift({
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
        weekLabel: `Week ${i === 0 ? 'Current' : i === 1 ? 'Last' : `${i} ago`}`,
        completed: weekTasks.length,
        totalTime: weekTasks.reduce((sum, task) => sum + (task.estimatedMinutes || 0), 0),
        highPriority: weekTasks.filter(t => t.priority === 'high').length,
        mediumPriority: weekTasks.filter(t => t.priority === 'medium').length,
        lowPriority: weekTasks.filter(t => t.priority === 'low').length
      });
    }

    res.json({
      success: true,
      data: {
        trends,
        summary: {
          totalWeeks: weeks,
          averageCompletion: (trends.reduce((sum, week) => sum + week.completed, 0) / weeks).toFixed(1),
          bestWeek: trends.reduce((best, week) => week.completed > best.completed ? week : best, trends[0]),
          totalCompleted: trends.reduce((sum, week) => sum + week.completed, 0)
        }
      }
    });

  } catch (error) {
    console.error('Trends analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while analyzing trends'
    });
  }
});

// @desc    Get quick weekly summary for widgets
// @route   GET /api/review/quick-stats
// @access  Private
router.get('/quick-stats', protect, async (req, res) => {
  try {
    // Calculate current week
    const today = new Date();
    const currentDay = today.getDay();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - currentDay);
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // Get this week's completed tasks
    const completedTasks = await Task.find({
      user: req.user.id,
      status: 'completed',
      completedAt: { $gte: weekStart, $lte: weekEnd }
    });

    // Calculate quick stats
    const quickStats = {
      completedThisWeek: completedTasks.length,
      dailyAverage: (completedTasks.length / 7).toFixed(1),
      totalTime: completedTasks.reduce((sum, task) => sum + (task.estimatedMinutes || 0), 0),
      goalProgress: Math.min((completedTasks.length / 10) * 100, 100), // 10 tasks per week goal
      topPriority: (() => {
        const priorityCounts = completedTasks.reduce((acc, task) => {
          acc[task.priority || 'medium'] = (acc[task.priority || 'medium'] || 0) + 1;
          return acc;
        }, {});
        
        return Object.entries(priorityCounts).reduce((a, b) => 
          priorityCounts[a[0]] > priorityCounts[b[0]] ? a : b, ['medium', 0]
        )[0];
      })(),
      streak: await calculateCompletionStreak(req.user.id),
      weeklyRank: await calculateWeeklyRank(req.user.id, completedTasks.length)
    };

    res.json({
      success: true,
      data: quickStats
    });

  } catch (error) {
    console.error('Quick stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching quick stats'
    });
  }
});

// Helper function to calculate completion streak
async function calculateCompletionStreak(userId) {
  try {
    let streak = 0;
    let checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);

    while (true) {
      const dayStart = new Date(checkDate);
      const dayEnd = new Date(checkDate);
      dayEnd.setHours(23, 59, 59, 999);

      const dayTasks = await Task.find({
        user: userId,
        status: 'completed',
        completedAt: { $gte: dayStart, $lte: dayEnd }
      });

      if (dayTasks.length > 0) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }

      // Prevent infinite loop
      if (streak > 100) break;
    }

    return streak;
  } catch (error) {
    console.error('Streak calculation error:', error);
    return 0;
  }
}

// Helper function to calculate weekly rank among all users
async function calculateWeeklyRank(userId, userCompletions) {
  try {
    // For now, return a simulated rank
    // In production, you'd calculate against all users
    const totalUsers = await Stats.countDocuments();
    const simulatedRank = Math.max(1, Math.floor(totalUsers * 0.3)); // Top 30%
    
    return {
      rank: simulatedRank,
      totalUsers,
      percentile: Math.round(((totalUsers - simulatedRank) / totalUsers) * 100)
    };
  } catch (error) {
    console.error('Rank calculation error:', error);
    return { rank: 1, totalUsers: 1, percentile: 100 };
  }
}

export default router;