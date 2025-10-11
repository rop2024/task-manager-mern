import mongoose from 'mongoose';
import Task from '../models/Task.js';
import dotenv from 'dotenv';

dotenv.config();

const migrateTasks = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/taskmanager');
    console.log('Connected to database');

    // Run migration
    console.log('Starting task migration...');
    const migrationResult = await Task.migrateExistingTasks();
    
    console.log('Migration completed successfully:', migrationResult);
    
    // Verify migration
    const totalTasks = await Task.countDocuments();
    const tasksWithStatus = await Task.countDocuments({ status: { $exists: true } });
    const tasksWithQuickCapture = await Task.countDocuments({ isQuickCapture: { $exists: true } });
    
    console.log('\nMigration Verification:');
    console.log(`Total tasks: ${totalTasks}`);
    console.log(`Tasks with status field: ${tasksWithStatus}`);
    console.log(`Tasks with isQuickCapture field: ${tasksWithQuickCapture}`);
    console.log(`Migration success rate: ${((tasksWithStatus / totalTasks) * 100).toFixed(2)}%`);
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateTasks();
}

export default migrateTasks;