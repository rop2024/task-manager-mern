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
import '../models/Draft.js';

const Task = mongoose.model('Task');
const Draft = mongoose.model('Draft');

/**
 * Migration Script: Convert draft status Tasks to Draft collection
 * 
 * This script migrates existing Task documents with status: 'draft' 
 * to the new Draft collection and either deletes or updates the original tasks.
 */

async function migrateDraftTasksToDrafts() {
  try {
    console.log('🚀 Starting migration: Draft Tasks → Draft Collection');
    console.log('================================================');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/phase1-db', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Find all tasks with draft status
    const draftTasks = await Task.find({ status: 'draft' }).populate('user', 'name email');
    console.log(`📋 Found ${draftTasks.length} draft tasks to migrate`);

    if (draftTasks.length === 0) {
      console.log('✨ No draft tasks found. Migration not needed.');
      await mongoose.disconnect();
      return;
    }

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    console.log('\n🔄 Starting migration process...\n');

    for (const task of draftTasks) {
      try {
        console.log(`📝 Migrating task: "${task.title}" (ID: ${task._id})`);

        // Determine source based on task properties
        let source = 'migrated';
        if (task.isQuickCapture) {
          source = 'quick';
        } else if (task.inboxRef) {
          source = 'inbox';
        } else if (task.description && task.description.length > 50) {
          source = 'taskform';
        }

        // Create new Draft document
        const draftData = {
          user: task.user._id || task.user,
          title: task.title,
          notes: task.description || '',
          source: source,
          inboxRef: task.inboxRef || undefined,
          createdAt: task.createdAt || new Date(),
          updatedAt: task.updatedAt || new Date()
        };

        const newDraft = new Draft(draftData);
        await newDraft.save();

        console.log(`   ✅ Created draft (ID: ${newDraft._id}) with source: ${source}`);

        // Option 1: Delete the original task (recommended)
        await Task.findByIdAndDelete(task._id);
        console.log(`   🗑️  Deleted original task (ID: ${task._id})`);

        // Option 2: Alternative - Update task status to pending (uncomment if preferred)
        // await Task.findByIdAndUpdate(task._id, { 
        //   status: 'pending',
        //   draftRef: newDraft._id 
        // });
        // console.log(`   🔄 Updated task status to pending with draft reference`);

        successCount++;

      } catch (error) {
        console.error(`   ❌ Error migrating task ${task._id}:`, error.message);
        errors.push({
          taskId: task._id,
          title: task.title,
          error: error.message
        });
        errorCount++;
      }

      // Add small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    console.log('\n📊 Migration Summary:');
    console.log('===================');
    console.log(`✅ Successfully migrated: ${successCount} tasks`);
    console.log(`❌ Failed migrations: ${errorCount} tasks`);

    if (errors.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      errors.forEach(err => {
        console.log(`   - Task "${err.title}" (${err.taskId}): ${err.error}`);
      });
    }

    // Verification step
    console.log('\n🔍 Verification:');
    const remainingDraftTasks = await Task.countDocuments({ status: 'draft' });
    const newDraftCount = await Draft.countDocuments({ source: { $in: ['migrated', 'quick', 'inbox', 'taskform'] } });
    
    console.log(`   - Remaining draft tasks: ${remainingDraftTasks}`);
    console.log(`   - Total drafts in Draft collection: ${newDraftCount}`);

    if (remainingDraftTasks === 0) {
      console.log('✨ Migration completed successfully! No draft tasks remaining.');
    } else {
      console.log('⚠️  Some draft tasks still exist. Check errors above.');
    }

  } catch (error) {
    console.error('💥 Migration failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

/**
 * Rollback function (for emergency use)
 * Converts Draft documents back to Task documents with draft status
 */
async function rollbackMigration() {
  try {
    console.log('🔄 Starting rollback: Draft Collection → Draft Tasks');
    console.log('================================================');

    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/phase1-db', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const migratedDrafts = await Draft.find({ 
      source: { $in: ['migrated', 'quick', 'inbox', 'taskform'] },
      isPromoted: false 
    });

    console.log(`📋 Found ${migratedDrafts.length} drafts to rollback`);

    let rollbackCount = 0;
    for (const draft of migratedDrafts) {
      try {
        // Create task from draft
        const taskData = {
          user: draft.user,
          title: draft.title,
          description: draft.notes,
          status: 'draft',
          isQuickCapture: draft.source === 'quick',
          inboxRef: draft.inboxRef,
          createdAt: draft.createdAt,
          updatedAt: draft.updatedAt
        };

        const newTask = new Task(taskData);
        await newTask.save();

        // Delete the draft
        await Draft.findByIdAndDelete(draft._id);

        rollbackCount++;
        console.log(`✅ Rolled back: "${draft.title}"`);

      } catch (error) {
        console.error(`❌ Error rolling back draft ${draft._id}:`, error.message);
      }
    }

    console.log(`\n✨ Rollback completed: ${rollbackCount} items restored`);

  } catch (error) {
    console.error('💥 Rollback failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
  }
}

// CLI interface
const command = process.argv[2];

if (command === 'migrate') {
  migrateDraftTasksToDrafts()
    .then(() => {
      console.log('\n🎉 Migration script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Migration script failed:', error);
      process.exit(1);
    });
} else if (command === 'rollback') {
  rollbackMigration()
    .then(() => {
      console.log('\n🎉 Rollback completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Rollback failed:', error);
      process.exit(1);
    });
} else if (command === 'status') {
  // Check migration status
  (async () => {
    try {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/phase1-db');
      
      const draftTaskCount = await Task.countDocuments({ status: 'draft' });
      const draftCollectionCount = await Draft.countDocuments();
      const migratedDraftCount = await Draft.countDocuments({ source: { $in: ['migrated', 'quick', 'inbox', 'taskform'] } });
      
      console.log('📊 Migration Status:');
      console.log('===================');
      console.log(`Tasks with status 'draft': ${draftTaskCount}`);
      console.log(`Total documents in Draft collection: ${draftCollectionCount}`);
      console.log(`Migrated drafts: ${migratedDraftCount}`);
      
      if (draftTaskCount === 0) {
        console.log('✅ Migration appears complete - no draft tasks found');
      } else {
        console.log('⚠️  Migration may be needed - draft tasks still exist');
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
📚 Draft Task Migration Script
=============================

Usage:
  node migrateDraftTasksToDrafts.js <command>

Commands:
  migrate   - Migrate draft tasks to Draft collection
  rollback  - Rollback migration (emergency use)
  status    - Check current migration status

Examples:
  node migrateDraftTasksToDrafts.js migrate
  node migrateDraftTasksToDrafts.js status
  node migrateDraftTasksToDrafts.js rollback

⚠️  Important Notes:
- Always backup your database before running migrations
- Test in development environment first
- The migrate command will DELETE original draft tasks by default
- Use rollback only if migration needs to be undone
`);
  process.exit(0);
}