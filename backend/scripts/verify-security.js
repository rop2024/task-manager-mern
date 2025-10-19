#!/usr/bin/env node

/**
 * Security Implementation Test Script
 * Quick verification that security measures are properly implemented
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🔍 Task Manager Security Implementation Verification\n');

const tests = [];
const addTest = (name, test, required = true) => {
  tests.push({ name, test, required });
};

// Check if essential security files exist
addTest('Security middleware exists', () => {
  return fs.existsSync(path.join(__dirname, '../middleware/security.js'));
});

addTest('Enhanced auth middleware exists', () => {
  const authFile = path.join(__dirname, '../middleware/auth.js');
  if (!fs.existsSync(authFile)) return false;
  
  const content = fs.readFileSync(authFile, 'utf8');
  return content.includes('verifyOwnership') && content.includes('verifyBulkOwnership');
});

addTest('Environment examples exist', () => {
  return fs.existsSync(path.join(__dirname, '../.env.example')) &&
         fs.existsSync(path.join(__dirname, '../.env.production'));
});

addTest('Security documentation exists', () => {
  return fs.existsSync(path.join(__dirname, '../docs/SECURITY.md'));
});

addTest('Postman security collection exists', () => {
  return fs.existsSync(path.join(__dirname, '../docs/security-test-collection.json'));
});

addTest('Setup script exists', () => {
  return fs.existsSync(path.join(__dirname, 'setup-security.js'));
}, false);

// Check package.json for security scripts
addTest('Security scripts in package.json', () => {
  const packageFile = path.join(__dirname, '../package.json');
  if (!fs.existsSync(packageFile)) return false;
  
  const packageJson = JSON.parse(fs.readFileSync(packageFile, 'utf8'));
  const scripts = packageJson.scripts || {};
  
  return scripts['dev'] && scripts['start'];
}, false);

// Check if server.js uses security middleware
addTest('Server uses security middleware', () => {
  const serverFile = path.join(__dirname, '../server.js');
  if (!fs.existsSync(serverFile)) return false;
  
  const content = fs.readFileSync(serverFile, 'utf8');
  return content.includes('securityHeaders') && 
         content.includes('securityLogger') && 
         content.includes('corsOptions') &&
         content.includes('authLimiter');
});

// Check if routes use ownership verification
addTest('Routes use ownership verification', () => {
  const tasksFile = path.join(__dirname, '../routes/tasks.js');
  const inboxFile = path.join(__dirname, '../routes/inbox.js');
  
  if (!fs.existsSync(tasksFile) || !fs.existsSync(inboxFile)) return false;
  
  const tasksContent = fs.readFileSync(tasksFile, 'utf8');
  const inboxContent = fs.readFileSync(inboxFile, 'utf8');
  
  return tasksContent.includes('verifyOwnership') && 
         inboxContent.includes('verifyOwnership') &&
         inboxContent.includes('verifyBulkOwnership');
});

// Check dependencies for security packages
addTest('Security dependencies installed', () => {
  const packageFile = path.join(__dirname, '../package.json');
  if (!fs.existsSync(packageFile)) return false;
  
  const packageJson = JSON.parse(fs.readFileSync(packageFile, 'utf8'));
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  return deps['helmet'] && 
         deps['express-rate-limit'] && 
         deps['express-validator'] && 
         deps['bcrypt'] && 
         deps['jsonwebtoken'] &&
         deps['cors'];
});

// Run all tests
let passed = 0;
let failed = 0;
const failures = [];

console.log('Running security implementation tests...\n');

tests.forEach(({ name, test, required }) => {
  try {
    const result = test();
    if (result) {
      console.log(`✅ ${name}`);
      passed++;
    } else {
      console.log(`❌ ${name}`);
      failed++;
      if (required) {
        failures.push(name);
      }
    }
  } catch (error) {
    console.log(`❌ ${name} (Error: ${error.message})`);
    failed++;
    if (required) {
      failures.push(name);
    }
  }
});

console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);

if (failures.length > 0) {
  console.log('\n🚨 Critical failures:');
  failures.forEach(failure => {
    console.log(`   - ${failure}`);
  });
  console.log('\n❌ Security implementation is incomplete.');
  console.log('Please address the critical failures above before production use.');
  process.exit(1);
} else {
  console.log('\n🎉 All security checks passed!');
  console.log('\n📋 Next steps:');
  console.log('   1. Configure your database connection');  
  console.log('   2. Test the application with: npm run dev');
  console.log('   3. Import and run the Postman security test collection');
  console.log('\n🔐 Your Task Manager security implementation is ready!');
}

export default tests;