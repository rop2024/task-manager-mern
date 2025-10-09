import axios from 'axios';
import mongoose from 'mongoose';
import { expect } from 'chai';

const api = axios.create({
  baseURL: 'http://localhost:5000'
});

describe('QuickTasks API Tests', () => {
  let testQuickTaskId;
  let initialTaskCount;

  before(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/phase1-db-test');
    
    // Clear the collections before testing
    await mongoose.model('QuickTask').deleteMany({});
    await mongoose.model('Task').deleteMany({});
  });

  describe('POST /api/quickTasks', () => {
    it('should create a valid quick task', async () => {
      const response = await api.post('/api/quickTasks', {
        title: 'Test Quick Task',
        priority: 'High'
      });

      expect(response.status).to.equal(201);
      expect(response.data).to.have.property('title', 'Test Quick Task');
      expect(response.data).to.have.property('priority', 'High');
      expect(response.data).to.have.property('createdAt');
      testQuickTaskId = response.data._id;
    });

    it('should return 400 when title is missing', async () => {
      try {
        await api.post('/api/quickTasks', {
          priority: 'High'
        });
        throw new Error('Should have failed');
      } catch (error) {
        expect(error.response.status).to.equal(400);
        expect(error.response.data).to.have.property('message').that.includes('Title is required');
      }
    });

    it('should return 400 when priority is invalid', async () => {
      try {
        await api.post('/api/quickTasks', {
          title: 'Test Task',
          priority: 'INVALID'
        });
        throw new Error('Should have failed');
      } catch (error) {
        expect(error.response.status).to.equal(400);
        expect(error.response.data).to.have.property('message').that.includes('Priority must be');
      }
    });

    it('should normalize priority capitalization', async () => {
      const response = await api.post('/api/quickTasks', {
        title: 'Priority Test',
        priority: 'medium'
      });

      expect(response.status).to.equal(201);
      expect(response.data.priority).to.equal('Medium');
    });
  });

  describe('GET /api/quickTasks', () => {
    before(async () => {
      // Add multiple tasks to test sorting
      await api.post('/api/quickTasks', {
        title: 'Task 1',
        priority: 'Low'
      });
      await new Promise(resolve => setTimeout(resolve, 100)); // Ensure different timestamps
      await api.post('/api/quickTasks', {
        title: 'Task 2',
        priority: 'Medium'
      });
    });

    it('should return tasks sorted by createdAt descending', async () => {
      const response = await api.get('/api/quickTasks');
      
      expect(response.status).to.equal(200);
      expect(response.data).to.be.an('array');
      expect(response.data.length).to.be.at.least(2);
      
      // Verify descending order
      for (let i = 0; i < response.data.length - 1; i++) {
        const current = new Date(response.data[i].createdAt);
        const next = new Date(response.data[i + 1].createdAt);
        expect(current >= next).to.be.true;
      }
    });
  });

  describe('DELETE /api/quickTasks/:id', () => {
    it('should delete quick task without affecting main tasks', async () => {
      // Create a main task first
      const mainTask = await mongoose.model('Task').create({
        title: 'Main Task',
        status: 'pending',
        priority: 'High'
      });

      // Get initial count of main tasks
      initialTaskCount = await mongoose.model('Task').countDocuments();

      // Delete quick task
      const response = await api.delete(`/api/quickTasks/${testQuickTaskId}`);
      expect(response.status).to.equal(200);

      // Verify quick task is deleted
      try {
        await api.get(`/api/quickTasks/${testQuickTaskId}`);
        throw new Error('Quick task should be deleted');
      } catch (error) {
        expect(error.response.status).to.equal(404);
      }

      // Verify main task collection is unchanged
      const finalTaskCount = await mongoose.model('Task').countDocuments();
      expect(finalTaskCount).to.equal(initialTaskCount);

      // Clean up
      await mongoose.model('Task').deleteOne({ _id: mainTask._id });
    });

    it('should return 404 for non-existent task', async () => {
      try {
        await api.delete('/api/quickTasks/5f7d0a1c8f3d2a1d1c9b4c1a');
        throw new Error('Should have failed');
      } catch (error) {
        expect(error.response.status).to.equal(404);
      }
    });
  });

  describe('POST /api/quickTasks/:id/convert', () => {
    let quickTaskId;

    before(async () => {
      // Create a quick task to convert
      const response = await api.post('/api/quickTasks', {
        title: 'Convert Test Task',
        priority: 'High'
      });
      quickTaskId = response.data._id;
    });

    it('should properly convert quick task to main task', async () => {
      const response = await api.post(`/api/quickTasks/${quickTaskId}/convert`, {
        description: 'Converted task description'
      });

      expect(response.status).to.equal(201);
      expect(response.data).to.have.property('title', 'Convert Test Task');
      expect(response.data).to.have.property('priority', 'High');
      expect(response.data).to.have.property('description', 'Converted task description');
      expect(response.data).to.have.property('status', 'pending');

      // Verify quick task is deleted
      try {
        await api.get(`/api/quickTasks/${quickTaskId}`);
        throw new Error('Quick task should be deleted');
      } catch (error) {
        expect(error.response.status).to.equal(404);
      }
    });

    it('should return 404 when converting non-existent task', async () => {
      try {
        await api.post('/api/quickTasks/5f7d0a1c8f3d2a1d1c9b4c1a/convert');
        throw new Error('Should have failed');
      } catch (error) {
        expect(error.response.status).to.equal(404);
      }
    });
  });

  after(async () => {
    // Clean up
    await mongoose.model('QuickTask').deleteMany({});
    await mongoose.model('Task').deleteMany({});
    await mongoose.disconnect();
  });
});