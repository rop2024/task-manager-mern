/*
 Lightweight load test for bulk import endpoint.
 Usage: node scripts/loadTestBulkImport.js
 Make sure backend is running locally on PORT and you have a valid JWT in env BULK_TEST_TOKEN
*/

import fetch from 'node-fetch';

const URL = process.env.BULK_TEST_URL || 'http://localhost:5000/api/tasks/bulk/import';
const TOKEN = process.env.BULK_TEST_TOKEN || '';

const makeTasks = (n, start = 0) => {
  const arr = [];
  for (let i = 0; i < n; i++) {
    arr.push({ title: `Load test task ${start + i}`, status: 'pending', priority: 'medium' });
  }
  return arr;
};

const run = async () => {
  console.log('Starting load test to', URL);
  const batchSize = 100; // intentionally larger than recommended to exercise chunking
  const totalBatches = 5;

  for (let b = 0; b < totalBatches; b++) {
    const payload = { tasks: makeTasks(batchSize, b * batchSize) };
    const start = Date.now();
    try {
      const res = await fetch(URL, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` }, body: JSON.stringify(payload) });
      const data = await res.json();
      console.log(`Batch ${b+1}/${totalBatches} - status ${res.status} - created ${data.createdCount} - errors ${data.errors?.length || 0} - took ${Date.now()-start}ms`);
    } catch (e) {
      console.error('Batch error', e.message);
    }
    // small pause between batches
    await new Promise(r => setTimeout(r, 500));
  }
  console.log('Load test finished');
};

run().catch(e => { console.error(e); process.exit(1); });
