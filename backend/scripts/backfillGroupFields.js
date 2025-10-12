import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

// Import models
import '../models/User.js';
import '../models/Group.js';
import '../models/Task.js';

const Group = mongoose.model('Group');
const Task = mongoose.model('Task');

/**
 * Migration Script: Backfill Group fields
 * 
 * This script adds default values for new Group fields:
 * - endGoal: '' (empty string)
 * - isCompleted: false
 * - completedAt: null
 * - completedBy: null
 */

async function backfillGroupFields() {
  try {
    console.log('🚀 Starting Group fields backfill migration');
    console.log('=============================================');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/phase1-db', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Find all groups that might be missing the new fields
    const allGroups = await Group.find({}).populate('user', 'name email');
    console.log(`📋 Found ${allGroups.length} total groups`);

    // Check which groups need updates
    const groupsNeedingUpdate = allGroups.filter(group => 
      group.endGoal === undefined || 
      group.isCompleted === undefined ||
      group.completedAt === undefined ||
      group.completedBy === undefined
    );

    console.log(`🔧 ${groupsNeedingUpdate.length} groups need field updates`);

    if (groupsNeedingUpdate.length === 0) {
      console.log('✨ All groups already have required fields. No migration needed.');
      await mongoose.disconnect();
      return;
    }

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    console.log('\n🔄 Starting backfill process...\n');

    // Update groups in batches for better performance
    const batchSize = 10;
    for (let i = 0; i < groupsNeedingUpdate.length; i += batchSize) {
      const batch = groupsNeedingUpdate.slice(i, i + batchSize);
      
      for (const group of batch) {
        try {
          console.log(`📝 Updating group: "${group.name}" (ID: ${group._id})`);

          // Prepare update data - only update fields that don't exist
          const updateData = {};
          
          if (group.endGoal === undefined) {
            updateData.endGoal = '';
            console.log(`   + Setting endGoal to empty string`);
          }
          
          if (group.isCompleted === undefined) {
            updateData.isCompleted = false;
            console.log(`   + Setting isCompleted to false`);
          }
          
          if (group.completedAt === undefined) {
            updateData.completedAt = null;
            console.log(`   + Setting completedAt to null`);
          }
          
          if (group.completedBy === undefined) {
            updateData.completedBy = null;
            console.log(`   + Setting completedBy to null`);
          }

          // Update the group
          await Group.findByIdAndUpdate(group._id, updateData, { 
            new: true, 
            runValidators: true 
          });

          console.log(`   ✅ Successfully updated group "${group.name}"`);
          successCount++;

        } catch (error) {
          console.error(`   ❌ Error updating group ${group._id}:`, error.message);
          errors.push({
            groupId: group._id,
            name: group.name,
            error: error.message
          });
          errorCount++;
        }
      }

      // Add small delay between batches
      if (i + batchSize < groupsNeedingUpdate.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log('\n📊 Backfill Summary:');
    console.log('====================');
    console.log(`✅ Successfully updated: ${successCount} groups`);
    console.log(`❌ Failed updates: ${errorCount} groups`);

    if (errors.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      errors.forEach(err => {
        console.log(`   - Group "${err.name}" (${err.groupId}): ${err.error}`);
      });
    }

    // Verification step
    console.log('\n🔍 Verification:');
    const updatedGroups = await Group.find({});
    const groupsWithAllFields = updatedGroups.filter(group => 
      group.endGoal !== undefined && 
      group.isCompleted !== undefined &&
      group.completedAt !== undefined &&
      group.completedBy !== undefined
    );
    
    console.log(`   - Total groups: ${updatedGroups.length}`);
    console.log(`   - Groups with all fields: ${groupsWithAllFields.length}`);

    if (groupsWithAllFields.length === updatedGroups.length) {
      console.log('✨ Backfill completed successfully! All groups have required fields.');
    } else {
      console.log('⚠️  Some groups still missing fields. Check errors above.');
    }

  } catch (error) {
    console.error('💥 Backfill migration failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

/**
 * Advanced migration: Intelligent completion detection
 * This function analyzes groups and suggests which ones might be completed
 * based on task completion patterns
 */
async function analyzeGroupCompletionPatterns() {
  try {
    console.log('🔍 Analyzing group completion patterns');
    console.log('=====================================');

    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/phase1-db');

    const groups = await Group.find({}).populate('user', 'name email');
    console.log(`📋 Analyzing ${groups.length} groups`);

    const analysisResults = [];

    for (const group of groups) {
      try {
        // Get tasks for this group
        const tasks = await Task.find({ group: group._id });
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(task => task.status === 'completed').length;
        const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        // Check if group hasn't had new tasks in a while
        const lastTaskCreated = tasks.length > 0 
          ? Math.max(...tasks.map(task => new Date(task.createdAt).getTime()))
          : null;
        
        const daysSinceLastTask = lastTaskCreated 
          ? Math.floor((Date.now() - lastTaskCreated) / (1000 * 60 * 60 * 24))
          : null;

        // Suggest completion if:
        // - 100% completion rate, OR
        // - 90%+ completion rate AND no new tasks in 30+ days, OR
        // - No tasks at all AND created 60+ days ago
        let suggestCompletion = false;
        let reason = '';

        if (totalTasks === 0) {
          const groupAge = Math.floor((Date.now() - new Date(group.createdAt).getTime()) / (1000 * 60 * 60 * 24));
          if (groupAge > 60) {
            suggestCompletion = true;
            reason = `Empty group created ${groupAge} days ago`;
          }
        } else if (completionRate === 100) {
          suggestCompletion = true;
          reason = 'All tasks completed';
        } else if (completionRate >= 90 && daysSinceLastTask >= 30) {
          suggestCompletion = true;
          reason = `${completionRate.toFixed(1)}% complete, inactive for ${daysSinceLastTask} days`;
        }

        analysisResults.push({
          group: {
            id: group._id,
            name: group.name,
            user: group.user?.name || 'Unknown',
            isCompleted: group.isCompleted || false
          },
          stats: {
            totalTasks,
            completedTasks,
            completionRate: Math.round(completionRate),
            daysSinceLastTask
          },
          suggestion: {
            suggestCompletion,
            reason
          }
        });

      } catch (error) {
        console.error(`Error analyzing group ${group._id}:`, error.message);
      }
    }

    // Display results
    console.log('\n📊 Group Completion Analysis:');
    console.log('=============================');

    const suggestionsByCategory = {
      alreadyCompleted: analysisResults.filter(r => r.group.isCompleted),
      suggestedForCompletion: analysisResults.filter(r => !r.group.isCompleted && r.suggestion.suggestCompletion),
      activeGroups: analysisResults.filter(r => !r.group.isCompleted && !r.suggestion.suggestCompletion)
    };

    console.log(`✅ Already completed: ${suggestionsByCategory.alreadyCompleted.length} groups`);
    console.log(`🎯 Suggested for completion: ${suggestionsByCategory.suggestedForCompletion.length} groups`);
    console.log(`🔄 Active groups: ${suggestionsByCategory.activeGroups.length} groups`);

    if (suggestionsByCategory.suggestedForCompletion.length > 0) {
      console.log('\n💡 Groups suggested for completion:');
      suggestionsByCategory.suggestedForCompletion.forEach(result => {
        console.log(`   📁 "${result.group.name}" (${result.group.user})`);
        console.log(`      → ${result.suggestion.reason}`);
        console.log(`      → Tasks: ${result.stats.completedTasks}/${result.stats.totalTasks} completed`);
      });
    }

    await mongoose.disconnect();
    return analysisResults;

  } catch (error) {
    console.error('💥 Analysis failed:', error);
    throw error;
  }
}

/**
 * Bulk completion utility
 * Marks multiple groups as completed based on analysis or manual selection
 */
async function bulkCompleteGroups(groupIds = [], markAll = false) {
  try {
    console.log('🎯 Bulk completing groups');
    console.log('=========================');

    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/phase1-db');

    let targetGroups = [];

    if (markAll) {
      // Get all suggested groups from analysis
      const analysis = await analyzeGroupCompletionPatterns();
      targetGroups = analysis
        .filter(r => !r.group.isCompleted && r.suggestion.suggestCompletion)
        .map(r => r.group.id);
    } else {
      targetGroups = groupIds;
    }

    if (targetGroups.length === 0) {
      console.log('ℹ️  No groups to complete');
      await mongoose.disconnect();
      return;
    }

    console.log(`📝 Completing ${targetGroups.length} groups...`);

    let successCount = 0;
    for (const groupId of targetGroups) {
      try {
        const group = await Group.findByIdAndUpdate(
          groupId,
          {
            isCompleted: true,
            completedAt: new Date(),
            // Note: completedBy would need to be passed as parameter for actual user
          },
          { new: true }
        );

        if (group) {
          console.log(`   ✅ Completed: "${group.name}"`);
          successCount++;
        }
      } catch (error) {
        console.error(`   ❌ Error completing group ${groupId}:`, error.message);
      }
    }

    console.log(`\n✨ Bulk completion finished: ${successCount}/${targetGroups.length} groups completed`);
    await mongoose.disconnect();

  } catch (error) {
    console.error('💥 Bulk completion failed:', error);
    throw error;
  }
}

// CLI interface
const command = process.argv[2];
const options = process.argv.slice(3);

if (command === 'backfill') {
  backfillGroupFields()
    .then(() => {
      console.log('\n🎉 Group backfill migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Group backfill migration failed:', error);
      process.exit(1);
    });
} else if (command === 'analyze') {
  analyzeGroupCompletionPatterns()
    .then(() => {
      console.log('\n🎉 Group analysis completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Group analysis failed:', error);
      process.exit(1);
    });
} else if (command === 'bulk-complete') {
  const groupIds = options.filter(opt => !opt.startsWith('--'));
  const markAll = options.includes('--suggested');
  
  bulkCompleteGroups(groupIds, markAll)
    .then(() => {
      console.log('\n🎉 Bulk completion finished!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Bulk completion failed:', error);
      process.exit(1);
    });
} else if (command === 'status') {
  // Check migration status
  (async () => {
    try {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/phase1-db');
      
      const allGroups = await Group.find({});
      const groupsWithAllFields = allGroups.filter(group => 
        group.endGoal !== undefined && 
        group.isCompleted !== undefined
      );
      const completedGroups = allGroups.filter(group => group.isCompleted === true);
      
      console.log('📊 Group Migration Status:');
      console.log('==========================');
      console.log(`Total groups: ${allGroups.length}`);
      console.log(`Groups with new fields: ${groupsWithAllFields.length}`);
      console.log(`Completed groups: ${completedGroups.length}`);
      
      if (groupsWithAllFields.length === allGroups.length) {
        console.log('✅ All groups have required fields');
      } else {
        console.log('⚠️  Some groups missing fields - backfill needed');
      }

      await mongoose.disconnect();
      process.exit(0);
    } catch (error) {
      console.error('Error checking status:', error);
      process.exit(1);
    }
  })();
} else {
  console.log(`
📚 Group Fields Migration Script
================================

Usage:
  node backfillGroupFields.js <command> [options]

Commands:
  backfill           - Add default values for endGoal, isCompleted fields
  analyze            - Analyze groups and suggest completion candidates
  bulk-complete      - Mark groups as completed (use with group IDs or --suggested)
  status             - Check current migration status

Examples:
  node backfillGroupFields.js backfill
  node backfillGroupFields.js analyze
  node backfillGroupFields.js bulk-complete --suggested
  node backfillGroupFields.js bulk-complete 64a1b2c3d4e5f6789 64a1b2c3d4e5f6790
  node backfillGroupFields.js status

⚠️  Important Notes:
- Always backup your database before running migrations
- Test in development environment first
- The analyze command provides completion suggestions based on task patterns
- Use bulk-complete with caution - it permanently marks groups as completed
`);
  process.exit(0);
}