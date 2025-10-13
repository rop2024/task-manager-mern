# 🚀 Secure Deployment Guide - Task Manager

## Overview
This guide walks you through securely deploying the Task Manager application across different environments with comprehensive security measures.

## 🏗️ Quick Setup

### 1. Generate Environment Configuration
```bash
# For development
npm run setup:dev

# For staging
npm run setup:staging

# For production
npm run setup:prod
```

### 2. Configure Environment Variables
After running the setup script, update the generated `.env` file:

```bash
# Update database connection
MONGODB_URI=your_mongodb_connection_string

# Update domain (staging/production)
FRONTEND_URL=https://yourdomain.com

# Configure email service (optional)
EMAIL_SERVICE=sendgrid
EMAIL_API_KEY=your_sendgrid_api_key
```

### 3. Run Security Tests
```bash
# Import Postman collection and run security tests
npm run test:security

# Run dependency security audit
npm run audit:security
```

## 🌍 Environment-Specific Deployment

### Development Environment

#### Setup
```bash
# 1. Generate development configuration
npm run setup:dev

# 2. Update database URL in .env
MONGODB_URI=mongodb://localhost:27017/task-manager-dev

# 3. Start development server
npm run dev
```

#### Security Level: **Relaxed**
- Rate limiting: Disabled/High limits
- CORS: Allows localhost
- HTTPS: Not required
- Error details: Verbose for debugging
- Security headers: Basic protection

#### Testing
- All security tests should pass
- Focus on functionality over strict security
- Test authentication flows
- Verify input validation

### Staging Environment

#### Prerequisites
- SSL certificate for staging domain
- MongoDB Atlas or secure database
- Domain/subdomain configured (e.g., staging.yourdomain.com)

#### Setup
```bash
# 1. Generate staging configuration
npm run setup:staging

# 2. Update configuration
# Edit .env.staging file:
MONGODB_URI=mongodb+srv://user:pass@cluster/staging-db
FRONTEND_URL=https://staging.yourdomain.com
SSL_CERT_PATH=/etc/letsencrypt/live/staging.yourdomain.com/fullchain.pem
SSL_KEY_PATH=/etc/letsencrypt/live/staging.yourdomain.com/privkey.pem

# 3. Install SSL certificates
sudo certbot --nginx -d staging.yourdomain.com

# 4. Start staging server
npm run start:staging
```

#### Security Level: **Production-like**
- Rate limiting: Enabled (200 req/15min)
- CORS: Strict domain validation
- HTTPS: Required
- Error details: Limited
- Security headers: Full protection
- Monitoring: Enabled

#### Testing
- Full security test suite
- Performance testing under load
- SSL/HTTPS validation
- Cross-browser compatibility

### Production Environment

#### Prerequisites
- Production SSL certificate
- Secured MongoDB instance
- Production domain configured
- Monitoring services set up
- Backup strategy implemented

#### Setup
```bash
# 1. Generate production configuration
npm run setup:prod

# 2. Update configuration securely
# Edit .env.production file with secure values:
MONGODB_URI=mongodb+srv://prod-user:SECURE_PASSWORD@prod-cluster/production-db
FRONTEND_URL=https://yourdomain.com
JWT_SECRET=GENERATED_64_CHAR_SECRET
SESSION_SECRET=GENERATED_64_CHAR_SECRET

# 3. Install and configure SSL
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# 4. Set up monitoring (optional)
SENTRY_DSN=your_sentry_dsn
NEW_RELIC_LICENSE_KEY=your_newrelic_key

# 5. Configure backup
BACKUP_ENABLED=true
AWS_BUCKET=your-backup-bucket

# 6. Start production server
npm run start:prod
```

#### Security Level: **Maximum**
- Rate limiting: Strict (100 req/15min, 3 auth/15min)
- CORS: Production domain only
- HTTPS: Enforced with HSTS
- Error details: Generic messages only
- Security headers: Maximum protection
- Monitoring: Full event logging
- Backup: Automated with encryption

## 🔐 Security Configuration Details

### JWT Security
```bash
# Development
JWT_SECRET=auto-generated-64-char-secret
JWT_EXPIRE=30d  # Longer for development convenience

# Production  
JWT_SECRET=cryptographically-strong-64-char-secret
JWT_EXPIRE=7d   # Shorter for security
```

### Rate Limiting
```bash
# Development
RATE_LIMIT_MAX_REQUESTS=1000  # Relaxed

# Staging
RATE_LIMIT_MAX_REQUESTS=200   # Moderate

# Production
RATE_LIMIT_MAX_REQUESTS=100   # Strict
AUTH_RATE_LIMIT_MAX=3         # Very strict for auth
PASSWORD_RESET_LIMIT_MAX=2    # Abuse prevention
```

### CORS Configuration
```bash
# Development
DEV_CORS_ORIGIN=*  # Allows all origins

# Staging
CORS_ORIGIN=https://staging.yourdomain.com

# Production
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
CORS_CREDENTIALS=true
```

### SSL/HTTPS Setup
```bash
# Production/Staging
FORCE_HTTPS=true
SSL_CERT_PATH=/etc/letsencrypt/live/yourdomain.com/fullchain.pem
SSL_KEY_PATH=/etc/letsencrypt/live/yourdomain.com/privkey.pem
HSTS_MAX_AGE=31536000  # 1 year
```

## 🏥 Health Checks & Monitoring

### Health Endpoints
- `GET /api/health` - Basic health check
- `GET /api/hello` - API connectivity test
- Database connectivity status included

### Security Monitoring
```bash
# Enable comprehensive logging
SECURITY_LOGGING=true
LOG_LEVEL=warn  # Production
LOG_LEVEL=info  # Staging
LOG_LEVEL=debug # Development
```

### External Monitoring Integration
```bash
# Error tracking
SENTRY_DSN=your_sentry_dsn

# Performance monitoring
NEW_RELIC_LICENSE_KEY=your_key

# Custom monitoring
CSP_REPORT_URI=https://yourdomain.com/api/csp-report
```

## 🛡️ Security Testing Workflow

### 1. Automated Testing
```bash
# Run security audit
npm run audit:security

# Import and run Postman collection
# File: docs/security-test-collection.json
# Tests: Authentication, Authorization, Input Validation, Rate Limiting
```

### 2. Manual Security Checks

#### Authentication Testing
- [ ] Valid login works
- [ ] Invalid credentials rejected
- [ ] Token validation working
- [ ] Token expiration handled
- [ ] Password requirements enforced

#### Authorization Testing
- [ ] Users can only access own resources
- [ ] Cross-user access blocked
- [ ] Bulk operations verified
- [ ] Admin privileges (if applicable)

#### Input Validation Testing
- [ ] SQL injection attempts blocked
- [ ] XSS attempts sanitized
- [ ] Invalid ObjectIds rejected
- [ ] Oversized requests handled
- [ ] Special characters handled

#### Infrastructure Testing
- [ ] HTTPS redirection working
- [ ] Security headers present
- [ ] CORS properly configured
- [ ] Rate limiting active
- [ ] Error messages sanitized

### 3. Performance Testing
```bash
# Load testing with rate limits
# Use tools like Artillery, k6, or Apache Bench
ab -n 1000 -c 10 https://yourdomain.com/api/health

# Monitor response times and error rates
# Verify rate limiting kicks in appropriately
```

## 🚨 Security Incident Response

### 1. Detection
- Monitor security event logs
- Set up alerts for suspicious activity
- Review error reports regularly
- Monitor performance anomalies

### 2. Response Procedures
```bash
# Immediate response to security incident:

# 1. Assess the threat
tail -f /var/log/security.log

# 2. Block malicious IPs (if applicable)
sudo ufw deny from MALICIOUS_IP

# 3. Rotate secrets if compromised
npm run setup:prod  # Generate new secrets
# Update environment variables
# Restart services

# 4. Review and patch vulnerabilities
npm audit fix
npm update

# 5. Document incident and lessons learned
```

### 3. Recovery
- Restore from backup if necessary
- Update security measures based on incident
- Notify users if data was compromised
- Review and improve security procedures

## 🔄 Maintenance & Updates

### Weekly Tasks
- [ ] Review security logs
- [ ] Check for dependency updates
- [ ] Monitor SSL certificate expiration
- [ ] Review error reports

### Monthly Tasks
- [ ] Rotate JWT secrets
- [ ] Security audit with latest tools
- [ ] Performance review
- [ ] Backup verification

### Quarterly Tasks
- [ ] Comprehensive penetration testing
- [ ] Security procedure review
- [ ] Disaster recovery testing
- [ ] Security training update

## 📋 Production Checklist

### Pre-deployment
- [ ] All security tests passing
- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] Database secured and backed up
- [ ] Monitoring configured
- [ ] Error tracking enabled
- [ ] Performance baselines established

### Post-deployment
- [ ] Health checks passing
- [ ] Security headers verified
- [ ] HTTPS redirection working
- [ ] Rate limiting functional
- [ ] Authentication flows tested
- [ ] Cross-user access blocked
- [ ] Error responses sanitized
- [ ] Monitoring alerts configured

### Ongoing Operations
- [ ] Daily health check reviews
- [ ] Weekly security log analysis
- [ ] Monthly security updates
- [ ] Quarterly security audits
- [ ] Annual disaster recovery testing

## 🆘 Troubleshooting

### Common Issues

#### CORS Errors
```bash
# Check allowed origins in environment
echo $CORS_ORIGIN

# Verify frontend URL matches
echo $FRONTEND_URL

# Test with curl
curl -H "Origin: https://yourdomain.com" -v https://api.yourdomain.com/api/health
```

#### JWT Token Issues
```bash
# Verify JWT secret is set
echo $JWT_SECRET | wc -c  # Should be 128+ characters

# Check token expiration
# Use jwt.io to decode and inspect tokens

# Verify user exists in database
```

#### Rate Limiting Issues
```bash
# Check if rate limiting is enabled
echo $RATE_LIMIT_MAX_REQUESTS

# Monitor rate limit headers in responses
curl -v https://yourdomain.com/api/tasks

# Adjust limits if needed for legitimate traffic
```

#### SSL/HTTPS Issues
```bash
# Check certificate validity
openssl x509 -in /etc/letsencrypt/live/yourdomain.com/cert.pem -text -noout

# Test SSL configuration
curl -I https://yourdomain.com

# Renew certificate if needed
sudo certbot renew
```

### Getting Help
- Review security documentation: `/docs/SECURITY.md`
- Check application logs for detailed error information
- Use security testing collection for systematic debugging
- Monitor security events for patterns

## 🎯 Success Criteria

Your deployment is secure when:
- ✅ All security tests pass
- ✅ Users can only access their own data
- ✅ Input validation prevents injection attacks
- ✅ Rate limiting prevents abuse
- ✅ HTTPS is properly configured
- ✅ Security headers are present
- ✅ Error responses don't leak information
- ✅ Monitoring is capturing security events
- ✅ Backup and recovery procedures work
- ✅ Performance meets requirements under security constraints