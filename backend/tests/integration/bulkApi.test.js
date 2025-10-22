import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import supertest from 'supertest';
import jwt from 'jsonwebtoken';

let mongod;
let app;
let request;
let User;

beforeAll(async () => {
  jest.setTimeout(60000);
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  process.env.MONGODB_URI = uri;
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

  // Import server AFTER setting MONGODB_URI so it connects to memory server
  const serverModule = await import('../../server.js');
  app = serverModule.app;
  request = supertest(app);

  // Load User model
  const userModule = await import('../../models/User.js');
  User = userModule.default;

  // Wait for mongoose to connect
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

describe('Bulk API integration', () => {
  let token;
  let testUser;

  beforeEach(async () => {
    // Create a test user
    testUser = await User.create({ email: 'test@example.com', name: 'Tester', password: 'password123' });
    token = jwt.sign({ id: testUser._id, iat: Math.floor(Date.now() / 1000) }, process.env.JWT_SECRET);
  });

  afterEach(async () => {
    // Clean collections
    const collections = Object.keys(mongoose.connection.collections);
    for (const coll of collections) {
      await mongoose.connection.collections[coll].deleteMany({});
    }
  });

  test('POST /api/tasks/bulk/parse should parse markdown', async () => {
    const md = `- [ ] Alpha | priority:high\n- [x] Beta | tags:one,two`;
    const res = await request.post('/api/tasks/bulk/parse').set('Authorization', `Bearer ${token}`).send({ markdown: md });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.parsed)).toBe(true);
    expect(res.body.parsed.length).toBe(2);
  });

  test('POST /api/tasks/bulk/import should insert tasks', async () => {
    const tasks = [
      { title: 'Imported 1', status: 'pending', priority: 'medium' },
      { title: 'Imported 2', status: 'pending', priority: 'low' }
    ];

    const res = await request.post('/api/tasks/bulk/import').set('Authorization', `Bearer ${token}`).send({ tasks });
    expect([201,200]).toContain(res.status);
    expect(res.body.success).toBe(true);
    expect(res.body.createdCount).toBeGreaterThanOrEqual(1);
  });
});
