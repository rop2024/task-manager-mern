#!/usr/bin/env node

/**
 * Security Configuration Setup Script
 * Helps set up secure environment configuration for different deployment stages
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Generate secure random strings
const generateSecret = (length = 64) => {
  return crypto.randomBytes(length).toString('hex');
};

const generateJWTSecret = () => {
  return crypto.randomBytes(64).toString('hex');
};

// Environment configurations
const environments = {
  development: {
    NODE_ENV: 'development',
    PORT: '5000',
    JWT_SECRET: generateJWTSecret(),
    JWT_EXPIRE: '30d',
    FRONTEND_URL: 'http://localhost:3000',
    SESSION_SECRET: generateSecret(32),
    RATE_LIMIT_WINDOW_MS: '900000',
    RATE_LIMIT_MAX_REQUESTS: '1000',
    FORCE_HTTPS: 'false',
    LOG_LEVEL: 'debug',
    SECURITY_LOGGING: 'true',
    DEV_CORS_ORIGIN: '*',
    DEV_ENABLE_DEBUG: 'true'
  },
  
  staging: {
    NODE_ENV: 'staging',
    PORT: '443',
    JWT_SECRET: generateJWTSecret(),
    JWT_EXPIRE: '7d',
    FRONTEND_URL: 'https://staging.yourdomain.com',
    SESSION_SECRET: generateSecret(32),
    RATE_LIMIT_WINDOW_MS: '900000',
    RATE_LIMIT_MAX_REQUESTS: '200',
    FORCE_HTTPS: 'true',
    LOG_LEVEL: 'info',
    SECURITY_LOGGING: 'true',
    SSL_CERT_PATH: '/etc/letsencrypt/live/staging.yourdomain.com/fullchain.pem',
    SSL_KEY_PATH: '/etc/letsencrypt/live/staging.yourdomain.com/privkey.pem'
  },
  
  production: {
    NODE_ENV: 'production',
    PORT: '443',
    JWT_SECRET: generateJWTSecret(),
    JWT_EXPIRE: '7d',
    FRONTEND_URL: 'https://yourdomain.com',
    SESSION_SECRET: generateSecret(32),
    RATE_LIMIT_WINDOW_MS: '900000',
    RATE_LIMIT_MAX_REQUESTS: '100',
    AUTH_RATE_LIMIT_MAX: '3',
    PASSWORD_RESET_LIMIT_MAX: '2',
    FORCE_HTTPS: 'true',
    LOG_LEVEL: 'warn',
    SECURITY_LOGGING: 'true',
    ERROR_REPORTING: 'true',
    SSL_CERT_PATH: '/etc/letsencrypt/live/yourdomain.com/fullchain.pem',
    SSL_KEY_PATH: '/etc/letsencrypt/live/yourdomain.com/privkey.pem',
    CORS_ORIGIN: 'https://yourdomain.com,https://www.yourdomain.com',
    CORS_CREDENTIALS: 'true',
    SESSION_SECURE: 'true',
    SESSION_SAME_SITE: 'strict',
    SESSION_MAX_AGE: '86400000',
    CSP_REPORT_URI: 'https://yourdomain.com/api/csp-report',
    HSTS_MAX_AGE: '31536000',
    EXPECT_CT_ENFORCE: 'true'
  }
};

// Generate .env file content
const generateEnvFile = (env, config) => {
  let content = `# 🔐 ${env.toUpperCase()} ENVIRONMENT CONFIGURATION\n`;
  content += `# Generated on ${new Date().toISOString()}\n`;
  content += `# DO NOT commit this file to version control\n\n`;
  
  // Group related settings
  const groups = {
    'APPLICATION SETTINGS': ['NODE_ENV', 'PORT'],
    'DATABASE CONFIGURATION': ['MONGODB_URI'],
    'JWT & AUTHENTICATION': ['JWT_SECRET', 'JWT_EXPIRE'],
    'FRONTEND CONFIGURATION': ['FRONTEND_URL', 'CORS_ORIGIN', 'CORS_CREDENTIALS'],
    'SECURITY SETTINGS': ['SESSION_SECRET', 'RATE_LIMIT_WINDOW_MS', 'RATE_LIMIT_MAX_REQUESTS', 'AUTH_RATE_LIMIT_MAX', 'PASSWORD_RESET_LIMIT_MAX'],
    'SSL/HTTPS CONFIGURATION': ['FORCE_HTTPS', 'SSL_CERT_PATH', 'SSL_KEY_PATH'],
    'LOGGING & MONITORING': ['LOG_LEVEL', 'SECURITY_LOGGING', 'ERROR_REPORTING'],
    'SESSION CONFIGURATION': ['SESSION_SECURE', 'SESSION_SAME_SITE', 'SESSION_MAX_AGE'],
    'SECURITY HEADERS': ['CSP_REPORT_URI', 'HSTS_MAX_AGE', 'EXPECT_CT_ENFORCE'],
    'DEVELOPMENT SETTINGS': ['DEV_CORS_ORIGIN', 'DEV_ENABLE_DEBUG']
  };
  
  for (const [groupName, keys] of Object.entries(groups)) {
    const groupConfig = {};
    let hasValues = false;
    
    keys.forEach(key => {
      if (config[key]) {
        groupConfig[key] = config[key];
        hasValues = true;
      }
    });
    
    if (hasValues) {
      content += `# ================================\n`;
      content += `# ${groupName}\n`;
      content += `# ================================\n`;
      
      Object.entries(groupConfig).forEach(([key, value]) => {
        content += `${key}=${value}\n`;
      });
      content += '\n';
    }
  }
  
  // Add database URI placeholder
  if (!config.MONGODB_URI) {
    content += `# Database connection - UPDATE THIS:\n`;
    if (env === 'development') {
      content += `MONGODB_URI=mongodb://localhost:27017/task-manager-dev\n\n`;
    } else {
      content += `MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/task-manager-${env}?retryWrites=true&w=majority\n\n`;
    }
  }
  
  // Add optional configurations
  content += `# ================================\n`;
  content += `# OPTIONAL SERVICES\n`;
  content += `# ================================\n`;
  content += `# Email service (for password reset)\n`;
  content += `EMAIL_SERVICE=\n`;
  content += `EMAIL_API_KEY=\n`;
  content += `EMAIL_FROM=noreply@yourdomain.com\n\n`;
  
  content += `# External monitoring (optional)\n`;
  content += `SENTRY_DSN=\n`;
  content += `NEW_RELIC_LICENSE_KEY=\n\n`;
  
  if (env === 'production') {
    content += `# Backup configuration (production)\n`;
    content += `BACKUP_ENABLED=true\n`;
    content += `BACKUP_SCHEDULE=0 2 * * *\n`;
    content += `BACKUP_RETENTION_DAYS=90\n`;
    content += `BACKUP_ENCRYPTION_KEY=${generateSecret(32)}\n\n`;
    
    content += `# Cloud storage for backups\n`;
    content += `AWS_ACCESS_KEY_ID=\n`;
    content += `AWS_SECRET_ACCESS_KEY=\n`;
    content += `AWS_REGION=us-east-1\n`;
    content += `AWS_BUCKET=\n\n`;
  }
  
  return content;
};

// Main setup function
const setupEnvironment = (env) => {
  console.log(`🔧 Setting up ${env} environment configuration...`);
  
  if (!environments[env]) {
    console.error(`❌ Unknown environment: ${env}`);
    console.log('Available environments: development, staging, production');
    process.exit(1);
  }
  
  const config = environments[env];
  const envContent = generateEnvFile(env, config);
  const filename = env === 'development' ? '.env' : `.env.${env}`;
  const filepath = path.join(__dirname, filename);
  
  // Check if file already exists
  if (fs.existsSync(filepath)) {
    console.log(`⚠️  ${filename} already exists. Creating backup...`);
    const backupPath = `${filepath}.backup.${Date.now()}`;
    fs.copyFileSync(filepath, backupPath);
    console.log(`📦 Backup created: ${path.basename(backupPath)}`);
  }
  
  // Write new configuration
  fs.writeFileSync(filepath, envContent);
  console.log(`✅ ${filename} created successfully!`);
  
  // Generate security checklist
  generateSecurityChecklist(env);
  
  console.log(`\\n🔐 Security Configuration Summary for ${env.toUpperCase()}:`);
  console.log(`   JWT Secret: ${config.JWT_SECRET.substring(0, 16)}...`);
  console.log(`   Session Secret: ${config.SESSION_SECRET.substring(0, 16)}...`);
  console.log(`   Rate Limit: ${config.RATE_LIMIT_MAX_REQUESTS} requests/${parseInt(config.RATE_LIMIT_WINDOW_MS)/60000} minutes`);
  console.log(`   HTTPS: ${config.FORCE_HTTPS === 'true' ? 'Enabled' : 'Disabled'}`);
  console.log(`   Logging: ${config.LOG_LEVEL} level`);
  
  console.log(`\\n📋 Next steps:`);
  console.log(`   1. Update MONGODB_URI with your database connection string`);
  console.log(`   2. Configure email service settings (if using password reset)`);
  if (env !== 'development') {
    console.log(`   3. Install SSL certificates and update paths`);
    console.log(`   4. Configure domain names in FRONTEND_URL and CORS settings`);
  }
  console.log(`   5. Review and test the configuration`);
  console.log(`   6. Run security tests with: npm run test:security`);
};

// Generate security checklist
const generateSecurityChecklist = (env) => {
  const checklistPath = path.join(__dirname, `security-checklist-${env}.md`);
  
  let checklist = `# 🛡️ Security Checklist - ${env.toUpperCase()}\n\n`;
  checklist += `Generated: ${new Date().toISOString()}\n\n`;
  
  checklist += `## Pre-deployment Security Checklist\n\n`;
  
  const checks = {
    development: [
      '[ ] Environment file created and configured',
      '[ ] Database connection tested',
      '[ ] JWT authentication working',
      '[ ] CORS configured for localhost',
      '[ ] Basic security headers enabled',
      '[ ] Input validation tested',
      '[ ] Rate limiting configured (relaxed)',
      '[ ] Error handling tested'
    ],
    staging: [
      '[ ] Environment file created and configured',
      '[ ] Database connection secured and tested',
      '[ ] SSL certificates installed and verified',
      '[ ] HTTPS redirection working',
      '[ ] JWT authentication with production settings',
      '[ ] CORS configured for staging domain',
      '[ ] Security headers fully enabled',
      '[ ] Rate limiting configured (production-like)',
      '[ ] Input validation and sanitization tested',
      '[ ] Security monitoring enabled',
      '[ ] Penetration testing completed',
      '[ ] Error responses sanitized'
    ],
    production: [
      '[ ] Environment file created and configured',
      '[ ] Database connection secured with authentication',
      '[ ] SSL certificates installed and auto-renewal configured',
      '[ ] HTTPS redirection and HSTS enabled',
      '[ ] JWT secrets rotated and secured',
      '[ ] CORS strictly configured for production domain only',
      '[ ] All security headers enabled and tested',
      '[ ] Rate limiting configured for production loads',
      '[ ] Input validation and sanitization comprehensive',
      '[ ] Security monitoring and alerting configured',
      '[ ] Backup strategy implemented and tested',
      '[ ] Error tracking and reporting enabled',
      '[ ] Security audit completed',
      '[ ] Incident response plan documented',
      '[ ] Database access properly restricted',
      '[ ] Server access logs configured',
      '[ ] Regular security updates scheduled'
    ]
  };
  
  checks[env].forEach(check => {
    checklist += `${check}\n`;
  });
  
  checklist += `\n## Security Testing\n\n`;
  checklist += `- [ ] Import Postman security test collection\n`;
  checklist += `- [ ] Run authentication tests\n`;
  checklist += `- [ ] Run authorization tests\n`;
  checklist += `- [ ] Run input validation tests\n`;
  checklist += `- [ ] Run rate limiting tests\n`;
  checklist += `- [ ] Verify security headers\n`;
  checklist += `- [ ] Test CORS configuration\n`;
  
  if (env === 'production') {
    checklist += `\n## Production Security Monitoring\n\n`;
    checklist += `- [ ] Set up security event alerting\n`;
    checklist += `- [ ] Configure error reporting (Sentry/similar)\n`;
    checklist += `- [ ] Enable performance monitoring\n`;
    checklist += `- [ ] Set up log aggregation and analysis\n`;
    checklist += `- [ ] Configure uptime monitoring\n`;
    checklist += `- [ ] Set up SSL certificate expiration alerts\n`;
  }
  
  fs.writeFileSync(checklistPath, checklist);
  console.log(`📋 Security checklist created: ${path.basename(checklistPath)}`);
};

// CLI interface
const main = () => {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('🔐 Task Manager Security Configuration Setup');
    console.log('');
    console.log('Usage: node setup-security.js <environment>');
    console.log('');
    console.log('Environments:');
    console.log('  development  - Local development with relaxed security');
    console.log('  staging      - Staging environment with production-like security');
    console.log('  production   - Production environment with maximum security');
    console.log('');
    console.log('Examples:');
    console.log('  node setup-security.js development');
    console.log('  node setup-security.js production');
    process.exit(0);
  }
  
  const environment = args[0].toLowerCase();
  setupEnvironment(environment);
};

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}

export { setupEnvironment, generateSecret, generateJWTSecret };