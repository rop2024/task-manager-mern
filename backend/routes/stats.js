import express from 'express';
import Stats from '../models/Stats.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get user stats
// @route   GET /api/stats
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let stats = await Stats.findOne({ user: req.user.id });

    // If no stats exist, create them
    if (!stats) {
      stats = await Stats.updateUserStats(req.user.id);
    }

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching statistics'
    });
  }
});

// @desc    Get user rank
// @route   GET /api/stats/rank
// @access  Private
router.get('/rank', protect, async (req, res) => {
  try {
    const userStats = await Stats.findOne({ user: req.user.id });

    if (!userStats) {
      return res.json({
        success: true,
        data: { rank: null, totalUsers: 0 }
      });
    }

    // Count users with higher productivity score
    const higherScoreCount = await Stats.countDocuments({
      productivityScore: { $gt: userStats.productivityScore }
    });

    const totalUsers = await Stats.countDocuments();
    const rank = higherScoreCount + 1;

    res.json({
      success: true,
      data: {
        rank,
        totalUsers,
        percentile:
          totalUsers > 0
            ? Math.round(((totalUsers - rank) / totalUsers) * 100)
            : 0
      }
    });
  } catch (error) {
    console.error('Get rank error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user rank'
    });
  }
});

// @desc    Update user stats (manual trigger)
// @route   POST /api/stats/update
// @access  Private
router.post('/update', protect, async (req, res) => {
  try {
    const stats = await Stats.updateUserStats(req.user.id);

    res.json({
      success: true,
      message: 'Statistics updated successfully',
      data: stats
    });
  } catch (error) {
    console.error('Update stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating statistics'
    });
  }
});

// @desc    Get stats history (simplified - last 7 days)
// @route   GET /api/stats/history
// @access  Private
router.get('/history', protect, async (req, res) => {
  try {
    const stats = await Stats.findOne({ user: req.user.id });

    if (!stats) {
      return res.json({
        success: true,
        data: []
      });
    }

    // Simulate historical data (in production, store daily snapshots)
    const history = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      // Simulate some variation in completed tasks
      const dailyCompleted = Math.max(
        0,
        Math.floor(
          (stats.weeklyCompleted / 7) * (0.7 + Math.random() * 0.6)
        )
      );

      history.push({
        date: date.toISOString().split('T')[0],
        completedTasks: dailyCompleted,
        productivityScore: Math.max(
          0,
          stats.productivityScore -
            (6 - i) * 2 +
            Math.random() * 4
        )
      });
    }

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Get stats history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching statistics history'
    });
  }
});

export default router;
