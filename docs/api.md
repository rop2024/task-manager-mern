# TaskFlow API Documentation

## 📋 Overview

The TaskFlow API provides a complete RESTful interface for managing tasks, groups, user authentication, and productivity analytics. All endpoints (except authentication) require JWT token authentication.

## 🔐 Authentication

All endpoints except `/auth/login` and `/auth/signup` require JWT authentication.

### Headers
```http
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
```

## 🌐 Base URL
```
https://your-backend-url.com/api
```

## 📊 Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "field_name",
      "message": "Validation error message"
    }
  ]
}
```

## 🔑 Authentication Endpoints

### Register User
```http
POST /auth/signup
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

### Login User
```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:** Same as signup response

### Get Current User
```http
GET /auth/me
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "isVerified": false,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Update User Profile
```http
PUT /auth/profile
```

**Request Body:**
```json
{
  "name": "John Smith"
}
```

## 📝 Tasks Endpoints

### Get All Tasks
```http
GET /tasks
```

**Query Parameters:**
- `status` (optional) - Filter by status: `pending`, `in-progress`, `completed`, `all`
- `priority` (optional) - Filter by priority: `low`, `medium`, `high`
- `group` (optional) - Filter by group ID
- `includeCompleted` (optional) - Include completed tasks (default: false)
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 10)
- `sortBy` (optional) - Sort field: `createdAt`, `dueAt`, `priority` (default: createdAt)
- `sortOrder` (optional) - Sort order: `asc`, `desc` (default: desc)

**Response:**
```json
{
  "success": true,
  "count": 5,
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 15,
    "totalPages": 2
  },
  "data": [
    {
      "_id": "task_id",
      "title": "Complete project proposal",
      "description": "Write and review the project proposal document",
      "status": "in-progress",
      "priority": "high",
      "startAt": "2024-01-15T09:00:00.000Z",
      "dueAt": "2024-01-20T17:00:00.000Z",
      "completedAt": null,
      "isAllDay": false,
      "reminders": ["2024-01-19T09:00:00.000Z"],
      "tags": ["work", "urgent"],
      "isImportant": true,
      "group": {
        "_id": "group_id",
        "name": "Work",
        "color": "#3B82F6",
        "icon": "💼"
      },
      "createdAt": "2024-01-10T10:00:00.000Z",
      "updatedAt": "2024-01-12T14:30:00.000Z"
    }
  ]
}
```

### Get Single Task
```http
GET /tasks/:id
```

### Create Task
```http
POST /tasks
```

**Request Body:**
```json
{
  "title": "Complete project proposal",
  "description": "Write and review the project proposal document",
  "status": "pending",
  "priority": "high",
  "startAt": "2024-01-15T09:00:00.000Z",
  "dueAt": "2024-01-20T17:00:00.000Z",
  "isAllDay": false,
  "reminders": ["2024-01-19T09:00:00.000Z"],
  "tags": ["work", "urgent"],
  "isImportant": true,
  "group": "group_id_here"
}
```

**Required Fields:** `title`, `group`

### Update Task
```http
PUT /tasks/:id
```

**Request Body:** Same as create, but all fields are optional

### Delete Task
```http
DELETE /tasks/:id
```

### Bulk Update Tasks
```http
PATCH /tasks/bulk
```

**Request Body:**
```json
{
  "taskIds": ["task_id_1", "task_id_2"],
  "updates": {
    "status": "completed",
    "priority": "high"
  }
}
```

## 📁 Groups Endpoints

### Get All Groups
```http
GET /groups
```

**Response:**
```json
{
  "success": true,
  "count": 4,
  "data": [
    {
      "_id": "group_id",
      "name": "Work",
      "description": "Work-related tasks",
      "color": "#3B82F6",
      "icon": "💼",
      "isDefault": true,
      "taskCount": 5,
      "user": "user_id",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

### Get Single Group
```http
GET /groups/:id
```

**Response:** Includes tasks belonging to the group

### Create Group
```http
POST /groups
```

**Request Body:**
```json
{
  "name": "Personal Projects",
  "description": "My personal coding projects",
  "color": "#10B981",
  "icon": "🚀"
}
```

**Required Fields:** `name`

### Update Group
```http
PUT /groups/:id
```

### Delete Group
```http
DELETE /groups/:id
```

**Note:** Cannot delete default groups

### Get Group Statistics
```http
GET /groups/:id/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 10,
    "pending": 3,
    "in-progress": 4,
    "completed": 3
  }
}
```

### Move Tasks Between Groups
```http
PATCH /groups/move-tasks
```

**Request Body:**
```json
{
  "taskIds": ["task_id_1", "task_id_2"],
  "targetGroupId": "new_group_id"
}
```

## ✅ Completed Tasks Endpoints

### Get Completed Tasks
```http
GET /completed
```

**Query Parameters:**
- `group` (optional) - Filter by group ID
- `daysAgo` (optional) - Show tasks completed in last N days (1-365)
- `limit` (optional) - Items per page (1-100, default: 20)
- `page` (optional) - Page number (default: 1)

### Mark Task as Completed
```http
POST /completed/:id
```

### Revive Task (Mark as Pending)
```http
POST /completed/:id/revive
```

### Toggle Completion Status
```http
POST /completed/:id/toggle
```

### Bulk Complete Tasks
```http
POST /completed/bulk
```

**Request Body:**
```json
{
  "taskIds": ["task_id_1", "task_id_2"]
}
```

### Bulk Revive Tasks
```http
POST /completed/bulk-revive
```

### Cleanup Old Completed Tasks
```http
DELETE /completed/cleanup
```

**Query Parameters:**
- `daysOld` (optional) - Delete tasks older than N days (1-365, default: 30)

**Response:**
```json
{
  "success": true,
  "message": "15 old completed tasks cleaned up",
  "data": {
    "deletedCount": 15
  }
}
```

### Get Completion Statistics
```http
GET /completed/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalCompleted": 45,
    "completedThisWeek": 8,
    "completedThisMonth": 25,
    "completionTimes": {
      "avgCompletionTime": 3.5,
      "minCompletionTime": 0.1,
      "maxCompletionTime": 15.2
    }
  }
}
```

## 📅 Calendar Endpoints

### Get Calendar Tasks
```http
GET /calendar/tasks
```

**Query Parameters:**
- `start` (optional) - Start date (ISO string)
- `end` (optional) - End date (ISO string)
- `view` (optional) - Calendar view: `month`, `week`, `day`, `agenda`

**Response:**
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": "task_id",
        "title": "Team Meeting",
        "start": "2024-01-15T10:00:00.000Z",
        "end": "2024-01-15T11:00:00.000Z",
        "allDay": false,
        "color": "#3B82F6",
        "textColor": "#FFFFFF",
        "resource": {
          "taskId": "task_id",
          "status": "pending",
          "priority": "medium",
          "group": {
            "_id": "group_id",
            "name": "Work",
            "color": "#3B82F6",
            "icon": "💼"
          },
          "description": "Weekly team sync",
          "isImportant": false,
          "reminders": ["2024-01-15T09:30:00.000Z"]
        }
      }
    ],
    "dateRange": {
      "start": "2024-01-01T00:00:00.000Z",
      "end": "2024-01-31T23:59:59.999Z"
    }
  }
}
```

### Update Task Dates (Drag & Drop)
```http
PUT /calendar/tasks/:id/dates
```

**Request Body:**
```json
{
  "startAt": "2024-01-16T10:00:00.000Z",
  "dueAt": "2024-01-16T11:00:00.000Z",
  "isAllDay": false
}
```

### Get Upcoming Reminders
```http
GET /calendar/reminders
```

**Query Parameters:**
- `hours` (optional) - Hours to look ahead (1-168, default: 24)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "task_id-reminder_timestamp",
      "taskId": "task_id",
      "title": "Team Meeting",
      "reminderTime": "2024-01-15T09:30:00.000Z",
      "task": {
        "title": "Team Meeting",
        "group": {
          "name": "Work",
          "color": "#3B82F6"
        },
        "priority": "medium",
        "status": "pending"
      }
    }
  ]
}
```

### Add Reminder to Task
```http
POST /calendar/tasks/:id/reminders
```

**Request Body:**
```json
{
  "reminderTime": "2024-01-15T09:30:00.000Z"
}
```

### Remove Reminder from Task
```http
DELETE /calendar/tasks/:id/reminders/:reminderIndex
```

## 📊 Statistics Endpoints

### Get User Statistics
```http
GET /stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "stats_id",
    "user": "user_id",
    "totalTasks": 50,
    "completedTasks": 35,
    "pendingTasks": 8,
    "inProgressTasks": 7,
    "overdueTasks": 2,
    "highPriorityTasks": 12,
    "mediumPriorityTasks": 25,
    "lowPriorityTasks": 13,
    "totalGroups": 4,
    "completionRate": 70,
    "productivityScore": 82,
    "currentStreak": 5,
    "longestStreak": 12,
    "weeklyCompleted": 8,
    "monthlyCompleted": 25,
    "lastUpdated": "2024-01-15T14:30:00.000Z",
    "lastActivity": "2024-01-15T14:30:00.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-15T14:30:00.000Z"
  }
}
```

### Get User Rank
```http
GET /stats/rank
```

**Response:**
```json
{
  "success": true,
  "data": {
    "rank": 3,
    "totalUsers": 150,
    "percentile": 98
  }
}
```

### Update Statistics (Manual Trigger)
```http
POST /stats/update
```

### Get Statistics History
```http
GET /stats/history
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "date": "2024-01-15",
      "completedTasks": 5,
      "productivityScore": 82
    }
  ]
}
```

## 🗂️ Data Models

### User Model
```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  password: String (hashed),
  role: String ('user' | 'admin'),
  isVerified: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Task Model
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  status: String ('pending' | 'in-progress' | 'completed'),
  priority: String ('low' | 'medium' | 'high'),
  startAt: Date,
  dueAt: Date,
  completedAt: Date,
  isAllDay: Boolean,
  reminders: [Date],
  tags: [String],
  isImportant: Boolean,
  user: ObjectId (ref: 'User'),
  group: ObjectId (ref: 'Group'),
  recurrence: {
    pattern: String ('none' | 'daily' | 'weekly' | 'monthly' | 'yearly'),
    interval: Number,
    endDate: Date,
    count: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Group Model
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  color: String,
  icon: String,
  user: ObjectId (ref: 'User'),
  isDefault: Boolean,
  taskCount: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### Stats Model
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: 'User'),
  totalTasks: Number,
  completedTasks: Number,
  pendingTasks: Number,
  inProgressTasks: Number,
  overdueTasks: Number,
  highPriorityTasks: Number,
  mediumPriorityTasks: Number,
  lowPriorityTasks: Number,
  totalGroups: Number,
  completionRate: Number,
  productivityScore: Number,
  currentStreak: Number,
  longestStreak: Number,
  weeklyCompleted: Number,
  monthlyCompleted: Number,
  lastUpdated: Date,
  lastActivity: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## ⚠️ Error Handling

### Common Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid or missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `429` - Too Many Requests (rate limiting)
- `500` - Internal Server Error

### Validation Errors
When validation fails, the API returns detailed error messages:
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Email must be a valid email address"
    },
    {
      "field": "password", 
      "message": "Password must be at least 6 characters long"
    }
  ]
}
```

## 🔒 Rate Limiting

- **Authentication endpoints**: 5 requests per 15 minutes
- **All other endpoints**: 100 requests per 15 minutes
- **Bulk operations**: Limited to 50 items per request

## 🎯 Productivity Score Algorithm

The productivity score (0-100) is calculated based on:

1. **Completion Rate** (50 points max)
   - `(completedTasks / totalTasks) * 50`

2. **Current Streak** (30 points max)
   - `Math.min(currentStreak * 2, 30)`

3. **Overdue Penalty** (20 points deduction)
   - `Math.min(overdueTasks * 5, 20)`

4. **Activity Bonus** (20 points bonus)
   - Based on recent activity: `20 - (daysSinceLastActivity * 2)`

## 🔄 Webhooks & Real-time Updates

Stats are automatically updated when:
- Tasks are created, updated, or deleted
- Groups are created, updated, or deleted  
- Tasks are moved between groups
- Task completion status changes

## 📱 Client Integration Examples

### JavaScript/React Example
```javascript
// Setup axios with auth token
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

// Create a task
const createTask = async (taskData) => {
  try {
    const response = await axios.post('/api/tasks', taskData);
    return response.data;
  } catch (error) {
    console.error('Error creating task:', error.response?.data);
    throw error;
  }
};

// Get tasks with filtering
const getTasks = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const response = await axios.get(`/api/tasks?${params}`);
  return response.data;
};
```

### cURL Examples
```bash
# Get tasks
curl -H "Authorization: Bearer $TOKEN" \
  "https://api.taskflow.com/api/tasks?status=pending&priority=high"

# Create a task
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"New Task","group":"group_id"}' \
  "https://api.taskflow.com/api/tasks"
```

## 🚀 Deployment Notes

### Environment Variables
```env
# Backend
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-super-secret-key
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://your-frontend.vercel.app

# Frontend
VITE_API_URL=https://your-backend.onrender.com
```

### Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "OK",
  "database": "Connected",
  "timestamp": "2024-01-15T14:30:00.000Z",
  "version": "1.0.0"
}
```

---

**Need Help?**
- Check the [GitHub Repository](https://github.com/your-username/taskflow)
- Open an issue for bug reports
- Contact support for additional help

*Last Updated: January 2024*