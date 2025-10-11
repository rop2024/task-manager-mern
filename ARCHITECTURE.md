# Task Manager — Architecture Documentation

**Last updated: 2025-10-11**

This document provides a comprehensive technical overview of the Task Manager application, a full-stack MERN application designed for personal and team productivity management. The system supports task organization through groups, inbox management, calendar integration, productivity scoring, and real-time statistics.

## Executive Summary

The Task Manager is a modern full-stack application built with the MERN stack (MongoDB, Express.js, React, Node.js) featuring:

### Core Features
- **Task Management**: Create, update, delete, and organize tasks with priorities, due dates, and status tracking
- **Smart Inbox System**: Capture quick ideas and promote them to structured tasks
- **Group Organization**: Categorize tasks into color-coded groups with custom icons
- **Calendar Integration**: View tasks in calendar format with reminders and scheduling
- **Productivity Analytics**: Track completion rates, streaks, and productivity scores
- **Real-time Statistics**: Dashboard with leaderboards and personal metrics
- **Recurrence Support**: Set up recurring tasks with flexible patterns
- **Reminders System**: Background scheduler for task notifications

### Technology Stack
- **Frontend**: React 18 + Vite, React Router v6, Tailwind CSS, Axios
- **Backend**: Node.js with Express.js (ES6 modules), JWT authentication
- **Database**: MongoDB with Mongoose ODM
- **Build Tools**: Vite (frontend), Nodemon (backend development)
- **Security**: Helmet, CORS, bcrypt, express-rate-limit
- **Calendar**: React Big Calendar integration

## System Architecture

### Inbox System Architecture

#### Overview
The Inbox System provides a temporary holding area for quick ideas and notes that can be converted into formal tasks. It features a sidebar interface with reliable deletion and retry mechanisms, designed for rapid idea capture and organization.

#### Core Features
- **Quick Capture**: Minimal friction idea recording
- **Sidebar Integration**: Real-time inbox item display
- **Reliable Deletion**: Retry mechanisms with exponential backoff
- **Task Promotion**: Convert inbox items to structured tasks
- **Performance Optimized**: Efficient queries with strategic indexing

#### Backend Architecture

**API Endpoints**:

| Endpoint | Method | Auth | Description | Response Format |
|----------|--------|------|-------------|-----------------|
| `/api/inbox/sidebar` | GET | ✅ | Fetch user's inbox items for sidebar | `{ success, data[], count, message }` |
| `/api/inbox/:id/deleteManual` | POST | ✅ | Delete inbox item with retry logic | `{ success, message, data: { deletedItemId, deletedAt } }` |
| `/api/inbox/sidebar/limited` | GET | ✅ | Get limited inbox items (pagination) | `{ success, data[], count, limit, message }` |
| `/api/inbox/sidebar/count` | GET | ✅ | Get inbox items count for badges | `{ success, data: { count }, message }` |

**Data Model**:
```javascript
InboxItem {
  // Dual field support for migration compatibility
  user: ObjectId (ref: 'User', required, indexed),
  userId: ObjectId (ref: 'User', required, indexed),
  
  // Content with flexible field options
  title: String (required, 1-200 chars),
  notes: String (optional, max: 1000 chars),
  content: String (optional, max: 5000 chars),
  
  // Soft deletion support
  isDeleted: Boolean (default: false, indexed),
  deletedAt: Date,
  deletedBy: ObjectId (ref: 'User'),
  
  // Task promotion tracking
  isPromoted: Boolean (default: false),
  promotedAt: Date,
  
  // Automatic timestamps
  createdAt: Date,
  updatedAt: Date
}
```

**Key Features**:
- **Robust Deletion**: `safeDelete()` method with retry logic and exponential backoff
- **Performance Indexing**: Strategic indexes for efficient sidebar queries
- **Dual Field Support**: Backward compatibility with both `user` and `userId` fields
- **Query Optimization**: `.lean()` queries with `.maxTimeMS()` timeout protection

### High-Level Architecture Diagram
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │    Database     │
│   (React SPA)   │◄──►│  (Express API)  │◄──►│    (MongoDB)    │
│                 │    │                 │    │                 │
│ • React 18      │    │ • Express.js    │    │ • MongoDB Atlas │
│ • Vite          │    │ • JWT Auth      │    │ • Mongoose ODM  │
│ • Tailwind CSS  │    │ • Rate Limiting │    │ • Indexes       │
│ • Axios         │    │ • Middleware    │    │ • Aggregation   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         └──────────────►│  Background     │◄─────────────┘
                        │  Scheduler      │
                        │                 │
                        │ • Reminders     │
                        │ • Recurrence    │
                        │ • Stats Update  │
                        └─────────────────┘
```

### Application Components

#### 1. Frontend (Single Page Application)
**Location**: `frontend/` directory
**Entry Points**: `src/main.jsx` → `src/App.jsx`

**Core Architecture**:
- **React 18** with modern hooks and context patterns
- **Vite** as build tool for fast development and optimized production builds
- **React Router v6** for client-side routing with lazy loading
- **Context API** for state management (Auth, Theme, Task contexts)
- **Axios** for HTTP client with interceptors and request/response handling

**Component Structure**:
```
src/
├── components/           # Reusable UI components
│   ├── layout/          # Navigation, Sidebar, ThemeToggle
│   ├── tasks/           # Task-related components
│   ├── calendar/        # Calendar and reminder components
│   ├── inbox/           # Inbox management
│   ├── group/           # Group management
│   └── scoreboard/      # Analytics and stats
├── pages/               # Route-level page components
├── context/             # React Context providers
├── api/                 # API client functions
└── assets/              # Static assets
```

#### 2. Backend (REST API Server)
**Location**: `backend/` directory
**Entry Point**: `server.js`

**Architecture Pattern**: 
- **MVC-style** with routes, models, and middleware separation
- **ES6 Modules** throughout the codebase
- **Modular routing** with feature-based organization
- **Middleware pipeline** for cross-cutting concerns

**Core Structure**:
```
backend/
├── server.js            # Application entry point
├── models/              # Mongoose data models
├── routes/              # Express route handlers
├── middleware/          # Custom middleware functions
└── scripts/             # Utility scripts
```

#### 3. Database Layer
**MongoDB with Mongoose ODM**
- **Connection**: MongoDB Atlas (production) or local MongoDB
- **ODM**: Mongoose for schema definition and data validation
- **Indexes**: Strategic indexing for query performance
- **Aggregation**: Complex queries for statistics and analytics

#### 4. Background Services
**Reminder Scheduler**:
- Runs background checks every minute (production only)
- Identifies due reminders and triggers notifications
- Located in `middleware/reminders.js`

## Directory Structure & Key Files

### Root Level
```
/
├── package.json              # Root package manager (workspace commands)
├── README.md                 # Project documentation
├── ARCHITECTURE.md           # This file
└── docs/
    └── api.md               # API documentation
```

### Backend Structure (`backend/`)
```
backend/
├── server.js                 # Express app entry point & configuration
├── package.json              # Backend dependencies
├── models/                   # Mongoose data models
│   ├── User.js              # User authentication & profile
│   ├── Task.js              # Core task model with recurrence
│   ├── InboxItem.js         # Quick capture inbox items
│   ├── Group.js             # Task organization groups
│   └── Stats.js             # User productivity statistics
├── routes/                   # Express route handlers
│   ├── auth.js              # Authentication endpoints
│   ├── tasks.js             # Task CRUD operations
│   ├── groups.js            # Group management
│   ├── inbox.js             # Inbox item operations
│   ├── calendar.js          # Calendar view & reminders
│   ├── completed.js         # Completed task analytics
│   ├── stats.js             # Statistics & leaderboard
│   └── tasks/
│       └── quick.js         # Quick task creation
├── middleware/               # Custom middleware
│   ├── auth.js              # JWT authentication & authorization
│   ├── rateLimiter.js       # Request rate limiting
│   ├── reminders.js         # Background reminder system
│   └── statsUpdater.js      # Auto stats calculation
├── scripts/
│   └── migrateTasks.js      # Database migration utilities
└── test-api.js              # API testing utilities
```

### Frontend Structure (`frontend/`)
```
frontend/
├── index.html               # HTML entry point
├── package.json             # Frontend dependencies
├── vite.config.js          # Vite build configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── postcss.config.js       # PostCSS configuration
└── src/
    ├── main.jsx            # React application entry
    ├── App.jsx             # Root component with routing
    ├── index.css           # Global styles & Tailwind imports
    ├── api/
    │   └── tasks.js        # API client functions
    ├── components/
    │   ├── layout/
    │   │   ├── Navigation.jsx    # Top navigation bar
    │   │   ├── Sidebar.jsx       # Task groups sidebar
    │   │   └── ThemeToggle.jsx   # Dark/light theme
    │   ├── tasks/
    │   │   ├── TaskList.jsx      # Task listing component
    │   │   ├── TaskItem.jsx      # Individual task display
    │   │   ├── TaskForm.jsx      # Task creation/editing
    │   │   ├── QuickAddTask.jsx  # Quick task entry
    │   │   ├── TaskStats.jsx     # Task statistics
    │   │   └── CompletedTasksPanel.jsx
    │   ├── calendar/
    │   │   ├── CalendarView.jsx  # Main calendar display
    │   │   ├── CalendarTaskForm.jsx # Calendar task creation
    │   │   └── RemindersList.jsx # Upcoming reminders
    │   ├── inbox/
    │   │   ├── inboxItem.jsx     # Inbox item component
    │   │   ├── InboxStats.jsx    # Inbox statistics
    │   │   └── QuickAddInput.jsx # Quick capture input
    │   ├── group/
    │   │   └── GroupForm.jsx     # Group creation/editing
    │   ├── scoreboard/
    │   │   ├── StatsOverview.jsx # Personal statistics
    │   │   ├── Leaderboard.jsx   # User rankings
    │   │   ├── ProductivityScore.jsx # Score display
    │   │   └── StatsCard.jsx     # Metric cards
    │   ├── LoginForm.jsx         # User login
    │   ├── SignupForm.jsx        # User registration
    │   └── ProtectedRoutes.jsx   # Route protection
    ├── context/
    │   ├── AuthContext.jsx       # Authentication state
    │   ├── TaskContext.jsx       # Task management state
    │   └── ThemeContext.jsx      # Theme state
    └── pages/
        ├── LandingPage.jsx       # Public landing page
        ├── Home.jsx              # Authenticated home
        ├── Login.jsx             # Login page
        ├── Signup.jsx            # Registration page
        ├── Dashboard.jsx         # Analytics dashboard
        ├── Tasks.jsx             # Task management page
        ├── Calendar.jsx          # Calendar view page
        └── Inbox.jsx             # Inbox management page
```

## Technology Stack & Dependencies

### Frontend Technologies
| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.2.0 | Core UI framework with hooks & context |
| **Vite** | 7.1.7 | Build tool & development server |
| **React Router** | 6.14.1 | Client-side routing & navigation |
| **Tailwind CSS** | 3.3.3 | Utility-first CSS framework |
| **Axios** | 1.5.0 | HTTP client for API communication |
| **React Big Calendar** | 1.19.4 | Calendar component library |
| **Moment.js** | 2.30.1 | Date manipulation & formatting |

### Backend Technologies
| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | Latest LTS | JavaScript runtime environment |
| **Express.js** | 4.18.2 | Web application framework |
| **MongoDB** | 7.5.0 | NoSQL database |
| **Mongoose** | 7.5.0 | MongoDB ODM & schema validation |
| **JWT** | 9.0.2 | Token-based authentication |
| **Bcrypt** | 5.1.0 | Password hashing & security |

### Security & Middleware
| Package | Purpose |
|---------|---------|
| **Helmet** | Security headers |
| **CORS** | Cross-origin resource sharing |
| **Express Rate Limit** | Request rate limiting |
| **Express Validator** | Input validation & sanitization |
| **Morgan** | HTTP request logging |

### Development Tools
| Tool | Purpose |
|------|---------|
| **Nodemon** | Backend auto-restart during development |
| **PostCSS** | CSS processing & autoprefixer |
| **ESLint** | Code linting (planned) |
| **Prettier** | Code formatting (planned) |

## Data Models & Database Schema

### Database Design Principles
- **Mongoose ODM** for schema validation and middleware
- **Strategic indexing** for query performance optimization
- **Virtual fields** for computed properties
- **Pre/post hooks** for maintaining data consistency
- **Reference relationships** between related documents

### Core Data Models

#### 1. User Model (`models/User.js`)
```javascript
{
  name: String (required, 2-50 chars),
  email: String (required, unique, validated),
  password: String (required, hashed with bcrypt),
  role: String (enum: ['user', 'admin'], default: 'user'),
  isVerified: Boolean (default: false),
  createdAt: Date,
  updatedAt: Date
}
```
**Methods**: `matchPassword()`, `getSignedJwtToken()`
**Middleware**: Password hashing on save, timestamp updates

#### 2. Task Model (`models/Task.js`) - Core Entity
```javascript
{
  // Identity & Ownership
  user: ObjectId (ref: 'User', required),
  createdBy: ObjectId (ref: 'User', required),
  assignedTo: ObjectId (ref: 'User'),
  
  // Core Task Fields
  title: String (required, max: 100),
  description: String (max: 500),
  status: String (enum: ['draft', 'pending', 'in-progress', 'completed']),
  priority: String (enum: ['low', 'medium', 'high']),
  
  // Organization
  group: ObjectId (ref: 'Group'),
  tags: [String],
  inboxRef: ObjectId (ref: 'InboxItem'),
  
  // Scheduling & Timing
  startAt: Date,
  dueAt: Date,
  dueDate: Date (legacy compatibility),
  completedAt: Date,
  isAllDay: Boolean,
  
  // Features
  reminders: [Date],
  isQuickCapture: Boolean,
  isImportant: Boolean,
  estimatedMinutes: Number,
  actualMinutes: Number,
  
  // Recurrence System
  recurrence: {
    pattern: String (enum: ['none', 'daily', 'weekly', 'monthly', 'yearly']),
    interval: Number (default: 1),
    endDate: Date,
    count: Number
  }
}
```

**Indexes**: 
- `{ user: 1, createdAt: -1 }` - User task listing
- `{ user: 1, status: 1 }` - Status filtering
- `{ user: 1, dueAt: 1 }` - Due date queries
- `{ user: 1, reminders: 1 }` - Reminder lookups
- `{ user: 1, status: 1, completedAt: -1 }` - Completed tasks

**Virtual Fields**: `isOverdue`, `daysUntilDue`, `daysSinceCompletion`

**Instance Methods**:
- `isReminderDue()` - Check if reminders are due
- `markAsCompleted()` - Mark task complete
- `revive()` - Reopen completed task
- `toggleCompletion()` - Toggle completion status
- `handleRecurrence()` - Create next recurring instance

**Static Methods**:
- `getTaskStats(userId, groupId)` - Aggregate task statistics
- `getCompletedTasks(userId, options)` - Paginated completed tasks
- `bulkComplete(userId, taskIds)` - Bulk completion
- `bulkRevive(userId, taskIds)` - Bulk reopen
- `cleanupCompletedTasks(userId, daysOld)` - Cleanup old tasks
- `getCalendarTasks(userId, startDate, endDate)` - Calendar view
- `getUpcomingReminders(userId, hours)` - Reminder lookups

#### 3. InboxItem Model (`models/InboxItem.js`)
```javascript
{
  // User References (dual field support)
  user: ObjectId (ref: 'User', required, indexed),
  userId: ObjectId (ref: 'User', required, indexed),
  
  // Content Fields
  title: String (required, max: 200),
  notes: String (max: 1000),
  content: String (max: 5000),
  
  // Status Tracking
  isPromoted: Boolean (default: false),
  promotedAt: Date,
  isDeleted: Boolean (default: false, indexed),
  deletedAt: Date,
  deletedBy: ObjectId (ref: 'User'),
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```
**Indexes**: 
- `{ user: 1, createdAt: -1 }` - User inbox listing
- `{ userId: 1, createdAt: -1 }` - Alternative user field
- `{ userId: 1, isDeleted: 1, createdAt: -1 }` - Efficient filtering

**Virtual Fields**: `daysInInbox` - Days since creation

**Instance Methods**: 
- `markAsPromoted()` - Mark as converted to task

**Static Methods**: 
- `getInboxStats(userId)` - Inbox analytics
- `safeDelete(itemId, userId)` - Robust deletion with retry logic
- `safeHardDelete(itemId, userId)` - Permanent deletion
- `getSidebarItems(userId, options)` - Sidebar data retrieval
- `getSidebarCount(userId)` - Item count for badges

#### 4. Group Model (`models/Group.js`)
```javascript
{
  name: String (required, max: 50),
  description: String (max: 200),
  color: String (hex color, default: '#3B82F6'),
  icon: String (emoji, default: '📁'),
  user: ObjectId (ref: 'User', required),
  isDefault: Boolean (default: false),
  taskCount: Number (default: 0)
}
```
**Static Methods**: 
- `updateTaskCount(groupId)` - Maintain task counts
- `createDefaultGroups(userId)` - Create default groups for new users

#### 5. Stats Model (`models/Stats.js`)
```javascript
{
  user: ObjectId (ref: 'User', required, unique),
  
  // Task Metrics
  totalTasks: Number,
  completedTasks: Number,
  overdueTasks: Number,
  
  // Time-based Metrics
  weeklyCompleted: Number,
  monthlyCompleted: Number,
  currentStreak: Number,
  longestStreak: Number,
  
  // Productivity Score (0-100)
  productivityScore: Number,
  
  // Activity Tracking
  lastTaskCreated: Date,
  lastTaskCompleted: Date,
  averageCompletionTime: Number
}
```
**Virtual Fields**: `completionPercentage`, `productivityLevel`
**Static Methods**: `updateUserStats(userId)` - Recalculate all statistics

### Database Relationships
```mermaid
erDiagram
    User ||--o{ Task : creates
    User ||--o{ Group : owns
    User ||--o{ InboxItem : captures
    User ||--|| Stats : has
    Group ||--o{ Task : contains
    InboxItem ||--o| Task : promotes_to
```

## REST API Specification

### Base Configuration
- **Base URL**: `/api`
- **Authentication**: JWT Bearer tokens
- **Content Type**: `application/json`
- **Rate Limiting**: 100 requests/15min (general), 5 requests/15min (auth)

### API Response Format
```javascript
// Success Response
{
  "success": true,
  "message": "Operation completed successfully",  // Optional
  "data": { /* Response data */ },               // Optional
  "count": 10,                                   // Optional (for lists)
  "pagination": { /* Pagination info */ }        // Optional
}

// Error Response
{
  "success": false,
  "message": "Error description",
  "errors": [ /* Validation errors */ ]          // Optional
}
```

### Authentication Endpoints (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/signup` | Create new user account | No |
| POST | `/auth/login` | Authenticate user | No |
| GET | `/auth/me` | Get current user profile | Yes |
| POST | `/auth/logout` | Logout user (optional) | Yes |

**Example - User Registration**:
```javascript
POST /api/auth/signup
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword"
}

Response: 201 Created
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

### Task Management (`/api/tasks`)
| Method | Endpoint | Description | Query Parameters |
|--------|----------|-------------|------------------|
| GET | `/tasks` | List user tasks | `status`, `priority`, `group`, `search`, `page`, `limit` |
| POST | `/tasks` | Create new task | - |
| GET | `/tasks/:id` | Get task by ID | - |
| PUT | `/tasks/:id` | Update task | - |
| DELETE | `/tasks/:id` | Delete task | - |
| PATCH | `/tasks/bulk` | Bulk operations | - |
| GET | `/tasks/stats` | Task statistics | `group` |
| GET | `/tasks/calendar` | Calendar view tasks | `start`, `end` |
| GET | `/tasks/reminders` | Upcoming reminders | `hours` |

**Quick Task Endpoints** (`/api/tasks/quick`):
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/tasks/quick` | Create quick task |
| GET | `/tasks/quick` | List quick tasks |

### Group Management (`/api/groups`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/groups` | List user groups |
| POST | `/groups` | Create new group |
| GET | `/groups/:id` | Get group by ID |
| PUT | `/groups/:id` | Update group |
| DELETE | `/groups/:id` | Delete group |

### Inbox System (`/api/inbox`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/inbox` | List inbox items | Yes |
| POST | `/inbox` | Create inbox item | Yes |
| GET | `/inbox/:id` | Get inbox item | Yes |
| PUT | `/inbox/:id` | Update inbox item | Yes |
| DELETE | `/inbox/:id` | Delete inbox item | Yes |
| POST | `/inbox/:id/promote` | Promote to task | Yes |
| POST | `/inbox/:id/deleteManual` | Delete with retry logic | Yes |
| GET | `/inbox/stats` | Inbox statistics | Yes |
| GET | `/inbox/sidebar` | Get sidebar items | Yes |
| GET | `/inbox/sidebar/limited` | Get limited sidebar items | Yes |
| GET | `/inbox/sidebar/count` | Get items count | Yes |

### Calendar Integration (`/api/calendar`)
| Method | Endpoint | Description | Parameters |
|--------|----------|-------------|------------|
| GET | `/calendar/tasks` | Calendar tasks | `start`, `end`, `view` |
| GET | `/calendar/reminders` | Upcoming reminders | `hours` |
| POST | `/calendar/tasks` | Create calendar task | - |
| PUT | `/calendar/tasks/:id` | Update calendar task | - |
| POST | `/calendar/tasks/:id/reminders` | Add reminder | - |
| DELETE | `/calendar/tasks/:taskId/reminders/:reminderIndex` | Remove reminder | - |

### Completed Tasks (`/api/completed`)
| Method | Endpoint | Description | Parameters |
|--------|----------|-------------|------------|
| GET | `/completed` | List completed tasks | `group`, `daysAgo`, `page`, `limit` |
| POST | `/completed/revive` | Revive completed tasks | - |
| DELETE | `/completed/cleanup` | Cleanup old tasks | `daysOld` |
| GET | `/completed/stats` | Completion statistics | - |

### Statistics & Analytics (`/api/stats`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/stats` | User statistics |
| GET | `/stats/leaderboard` | Top users ranking |
| GET | `/stats/rank` | User rank position |
| POST | `/stats/update` | Refresh statistics |
| GET | `/stats/history` | Stats history (7 days) |

### Example API Request/Response

**Create Task with Reminders**:
```javascript
POST /api/tasks
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "title": "Complete Architecture Documentation",
  "description": "Write comprehensive system architecture documentation",
  "priority": "high",
  "group": "507f1f77bcf86cd799439011",
  "dueAt": "2025-10-12T15:00:00Z",
  "reminders": [
    "2025-10-12T14:30:00Z",
    "2025-10-12T09:00:00Z"
  ],
  "tags": ["documentation", "urgent"],
  "estimatedMinutes": 180
}

Response: 201 Created
{
  "success": true,
  "message": "Task created successfully",
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "title": "Complete Architecture Documentation",
    "description": "Write comprehensive system architecture documentation",
    "status": "draft",
    "priority": "high",
    "group": {
      "id": "507f1f77bcf86cd799439011",
      "name": "Work",
      "color": "#3B82F6",
      "icon": "💼"
    },
    "dueAt": "2025-10-12T15:00:00Z",
    "reminders": [
      "2025-10-12T09:00:00Z",
      "2025-10-12T14:30:00Z"
    ],
    "tags": ["documentation", "urgent"],
    "estimatedMinutes": 180,
    "createdAt": "2025-10-11T10:30:00Z",
    "updatedAt": "2025-10-11T10:30:00Z"
  }
}
```

### Error Handling Examples
```javascript
// Validation Error (400)
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "title",
      "message": "Title is required"
    },
    {
      "field": "dueAt",
      "message": "Due date must be a valid date"
    }
  ]
}

// Authentication Error (401)
{
  "success": false,
  "message": "Not authorized to access this route"
}

// Resource Not Found (404)
{
  "success": false,
  "message": "Task not found"
}
```

## Middleware Architecture & Cross-Cutting Concerns

### Middleware Pipeline Order
```javascript
// Express middleware pipeline
app.use(cors())                    // CORS handling
app.use(helmet())                  // Security headers
app.use(morgan())                  // Request logging
app.use(express.json())            // JSON parsing
app.use(generalLimiter)            // Rate limiting
// Route handlers
app.use('/api/auth', authRoutes)   // Authentication routes
app.use('/api/tasks', protect, taskRoutes) // Protected routes
```

### Custom Middleware Components

#### 1. Authentication Middleware (`middleware/auth.js`)
```javascript
export const protect = async (req, res, next) => {
  // Extract JWT from Authorization header
  // Verify token with JWT_SECRET
  // Attach user object to req.user
  // Handle authentication errors
}

export const authorize = (...roles) => {
  // Role-based authorization
  // Check req.user.role against allowed roles
}
```

**Usage**: Applied to all protected routes automatically
**Features**: 
- JWT token validation
- User object attachment
- Role-based access control
- Automatic error handling

#### 2. Rate Limiting (`middleware/rateLimiter.js`)
```javascript
// General API rate limiting
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                   // 100 requests per window
  message: "Too many requests..."
})

// Stricter limits for authentication
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5,                     // 5 requests per window
  message: "Too many authentication attempts..."
})
```

**Purpose**: Prevent API abuse and DDoS attacks
**Implementation**: IP-based request counting

#### 3. Statistics Updater (`middleware/statsUpdater.js`)
```javascript
export const updateStatsAfterTaskChange = async (req, res, next) => {
  // Listen for response completion
  res.on('finish', () => {
    if (successful response && req.user) {
      Stats.updateUserStats(req.user.id).catch(console.error)
    }
  })
  next()
}
```

**Purpose**: Automatically recalculate user statistics after task operations
**Trigger**: Task create, update, delete, completion
**Performance**: Asynchronous execution to avoid blocking responses

#### 4. Reminder System (`middleware/reminders.js`)
```javascript
const checkReminders = async () => {
  // Find tasks with due reminders (last 5 minutes)
  // Query tasks with reminders between now and 5 minutes ago
  // Log reminder notifications (ready for integration)
}

export const startReminderScheduler = () => {
  setInterval(checkReminders, 60 * 1000) // Every minute
}
```

**Features**:
- Background scheduler (production only)
- Minute-by-minute reminder checking
- Integration-ready notification system
- Performance optimized queries

#### 5. Input Validation (`express-validator`)
```javascript
// Example validation middleware
const createTaskValidation = [
  body('title').trim().notEmpty().isLength({ min: 1, max: 100 }),
  body('description').optional().isLength({ max: 500 }),
  body('status').optional().isIn(['draft', 'pending', 'in-progress', 'completed']),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  // ... more validations
]
```

**Applied to**: All input-accepting endpoints
**Features**: Sanitization, validation, error formatting

### Security Middleware

#### CORS Configuration
```javascript
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:3000",
  "http://localhost:5173"  // Vite development
].filter(Boolean)

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}))
```

#### Security Headers (Helmet)
```javascript
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}))
```

### Error Handling Pipeline
```javascript
// CORS error handling
app.use((err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ 
      success: false,
      error: 'CORS policy: Origin not allowed'
    })
  }
  // General error handling
  res.status(500).json({ 
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong!' 
      : err.message
  })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false,
    error: 'Route not found'
  })
})
```

## Security Architecture

### Authentication & Authorization

#### JWT Token Management
```javascript
// Token Generation
userSchema.methods.getSignedJwtToken = function () {
  return jwt.sign(
    { id: this._id, email: this.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '1h' }
  )
}
```

**Security Features**:
- **Algorithm**: HS256 (HMAC with SHA-256)
- **Secret**: Environment variable `JWT_SECRET` (must be cryptographically secure)
- **Expiration**: Configurable via `JWT_EXPIRE` (default: 1 hour)
- **Payload**: User ID and email only (minimal data exposure)

#### Password Security
```javascript
// Password hashing with bcrypt
const salt = await bcrypt.genSalt(Number(process.env.BCRYPT_ROUNDS) || 12)
this.password = await bcrypt.hash(this.password, salt)
```

**Configuration**:
- **Algorithm**: bcrypt with configurable salt rounds
- **Salt Rounds**: `BCRYPT_ROUNDS` environment variable (default: 12)
- **Storage**: Never store plain text passwords
- **Validation**: Minimum 6 characters requirement

### Input Validation & Sanitization

#### Request Validation Pipeline
```javascript
// Example validation chain
const createTaskValidation = [
  body('title')
    .trim()                    // Remove whitespace
    .notEmpty()               // Required field
    .isLength({ min: 1, max: 100 })  // Length constraints
    .escape(),                // HTML escape
  body('email')
    .isEmail()                // Email format
    .normalizeEmail(),        // Normalize format
  // ... additional validations
]
```

**Validation Types**:
- **Length constraints** on all text fields
- **Format validation** (email, dates, IDs)
- **Enumeration checks** for status/priority fields
- **HTML escaping** to prevent XSS
- **SQL injection prevention** via Mongoose ODM

### HTTP Security Headers (Helmet)

```javascript
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  // Additional default headers:
  // - X-Content-Type-Options: nosniff
  // - X-Frame-Options: DENY
  // - X-XSS-Protection: 1; mode=block
  // - Strict-Transport-Security (HTTPS only)
}))
```

### CORS (Cross-Origin Resource Sharing)

```javascript
const allowedOrigins = [
  process.env.FRONTEND_URL,     // Production frontend
  "http://localhost:3000",      // React development
  "http://localhost:5173"       // Vite development
].filter(Boolean)

app.use(cors({
  origin: allowedOrigins,
  credentials: true,            // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}))
```

### Rate Limiting Strategy

| Endpoint Category | Window | Limit | Purpose |
|------------------|--------|-------|---------|
| **Authentication** | 15 min | 5 requests | Prevent brute force attacks |
| **General API** | 15 min | 100 requests | Prevent API abuse |
| **Bulk Operations** | - | 50 items/request | Limit batch size |

### Environment Variables Security

#### Required Environment Variables
```bash
# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname

# JWT Configuration
JWT_SECRET=your-super-secure-secret-key  # Min 32 characters
JWT_EXPIRE=1h                            # Token expiration

# Security
BCRYPT_ROUNDS=12                         # Password hashing rounds

# CORS
FRONTEND_URL=https://your-frontend-domain.com

# Application
NODE_ENV=production                      # Environment mode
PORT=5000                               # Server port
```

#### Security Best Practices for Environment Variables
- **Never commit** `.env` files to version control
- **Use strong secrets** (minimum 32 characters for JWT_SECRET)
- **Rotate secrets** regularly in production
- **Separate environments** (dev/staging/production configs)

### Production Security Recommendations

#### 1. HTTPS Enforcement
```bash
# Use reverse proxy (nginx/apache) to enforce HTTPS
# Redirect all HTTP traffic to HTTPS
# Set HSTS headers via Helmet
```

#### 2. Database Security
```javascript
// MongoDB connection with authentication
const MONGODB_URI = process.env.MONGODB_URI || 
  'mongodb://username:password@host:port/database?authSource=admin'

// Connection options
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  // Additional production options
  maxPoolSize: 10,          // Limit connection pool
  serverSelectionTimeoutMS: 5000,  // Connection timeout
})
```

#### 3. Error Information Disclosure
```javascript
// Production error handling
app.use((err, req, res, next) => {
  res.status(500).json({ 
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error'  // Generic message
      : err.message              // Detailed message (dev only)
  })
})
```

#### 4. Logging & Monitoring
```javascript
// Request logging with Morgan
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))

// Additional production logging
// - Error tracking (Sentry, Bugsnag)
// - Performance monitoring (New Relic, DataDog)
// - Security monitoring (Failed auth attempts)
```

### Security Audit Checklist

- [ ] JWT secrets are cryptographically secure (32+ chars)
- [ ] Password hashing uses bcrypt with adequate rounds (12+)
- [ ] All inputs are validated and sanitized
- [ ] CORS is properly configured for production domains
- [ ] Rate limiting is enabled on all endpoints
- [ ] HTTPS is enforced in production
- [ ] Security headers are set via Helmet
- [ ] Environment variables are secured
- [ ] Database connections are authenticated
- [ ] Error messages don't leak sensitive information
- [ ] Logging captures security events
- [ ] Dependencies are regularly updated

## Performance Optimization & Database Indexing

### Database Index Strategy

#### Task Collection Indexes
```javascript
// Primary indexes for common queries
taskSchema.index({ user: 1, createdAt: -1 })     // User task listing (default sort)
taskSchema.index({ user: 1, status: 1 })         // Status filtering
taskSchema.index({ user: 1, dueAt: 1 })          // Due date queries
taskSchema.index({ user: 1, reminders: 1 })      // Reminder lookups
taskSchema.index({ user: 1, status: 1, completedAt: -1 }) // Completed tasks
taskSchema.index({ user: 1, status: 1, dueAt: 1 }) // Combined status/due queries
taskSchema.index({ status: 1, createdBy: 1 })    // Cross-user queries (admin)
taskSchema.index({ isQuickCapture: 1, createdAt: 1 }) // Quick task queries
```

#### Other Collection Indexes
```javascript
// InboxItem indexes
inboxItemSchema.index({ user: 1, createdAt: -1 })
inboxItemSchema.index({ user: 1, isPromoted: 1 })
inboxItemSchema.index({ user: 1, updatedAt: -1 })

// Group indexes
groupSchema.index({ user: 1, createdAt: -1 })
groupSchema.index({ user: 1, isDefault: 1 })

// Stats indexes (unique constraint)
statsSchema.index({ user: 1 }, { unique: true })
```

### Query Optimization Strategies

#### 1. Projection Optimization
```javascript
// Only select needed fields for list views
const tasks = await Task.find(query)
  .select('title status priority dueAt group createdAt')
  .populate('group', 'name color icon')  // Limit populated fields
  .sort({ createdAt: -1 })
```

#### 2. Pagination Strategy
```javascript
// Efficient pagination using cursor-based approach
const getPaginatedTasks = async (userId, lastCreatedAt, limit = 20) => {
  const query = { 
    user: userId,
    ...(lastCreatedAt && { createdAt: { $lt: lastCreatedAt } })
  }
  
  return Task.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
}
```

#### 3. Aggregation Pipeline Optimization
```javascript
// Optimized stats calculation
const getTaskStats = async (userId) => {
  return Task.aggregate([
    { $match: { user: new ObjectId(userId) } },  // Use index
    { 
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ])
}
```

### Frontend Performance Optimization

#### 1. Code Splitting & Lazy Loading
```javascript
// Lazy load page components
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Tasks = lazy(() => import('./pages/Tasks'))
const Calendar = lazy(() => import('./pages/Calendar'))

// Route-based code splitting
<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    <Route path="/dashboard" element={<Dashboard />} />
    {/* Other routes */}
  </Routes>
</Suspense>
```

#### 2. Vite Build Optimization
```javascript
// vite.config.js optimization
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          calendar: ['react-big-calendar', 'moment']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
})
```

#### 3. API Request Optimization
```javascript
// Batch API requests
const fetchDashboardData = async () => {
  const [stats, tasks, reminders] = await Promise.all([
    axios.get('/api/stats'),
    axios.get('/api/tasks?limit=10'),
    axios.get('/api/calendar/reminders')
  ])
  return { stats: stats.data, tasks: tasks.data, reminders: reminders.data }
}
```

### Caching Strategy

#### 1. In-Memory Caching (Backend)
```javascript
// Simple in-memory cache for frequently accessed data
const cache = new Map()

const getCachedUserStats = async (userId) => {
  const cacheKey = `stats:${userId}`
  
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)
  }
  
  const stats = await Stats.findOne({ user: userId })
  cache.set(cacheKey, stats, { ttl: 300 }) // 5 minutes
  return stats
}
```

#### 2. HTTP Caching Headers
```javascript
// Cache static data responses
app.get('/api/stats', (req, res) => {
  res.set('Cache-Control', 'private, max-age=300') // 5 minutes
  // ... response logic
})
```

### Performance Monitoring

#### 1. Database Query Monitoring
```javascript
// Enable Mongoose query logging in development
if (process.env.NODE_ENV === 'development') {
  mongoose.set('debug', true)
}

// Add query timing middleware
mongoose.plugin((schema) => {
  schema.pre(/^find/, function() {
    this.start = Date.now()
  })
  
  schema.post(/^find/, function() {
    console.log(`Query took ${Date.now() - this.start}ms`)
  })
})
```

#### 2. API Response Time Monitoring
```javascript
// Response time middleware
app.use((req, res, next) => {
  const start = Date.now()
  
  res.on('finish', () => {
    const duration = Date.now() - start
    console.log(`${req.method} ${req.url} - ${duration}ms`)
  })
  
  next()
})
```

### Performance Benchmarks & Targets

| Metric | Target | Current |
|--------|--------|---------|
| **API Response Time** | < 200ms | - |
| **Database Query Time** | < 50ms | - |
| **Page Load Time** | < 2s | - |
| **Bundle Size** | < 500KB | - |
| **Time to Interactive** | < 3s | - |

### Scalability Considerations

#### 1. Database Scaling
- **Read Replicas**: For read-heavy workloads
- **Sharding**: Horizontal scaling by user ID
- **Connection Pooling**: Optimize connection usage

#### 2. Application Scaling
- **Stateless Design**: JWT tokens eliminate session state
- **Horizontal Scaling**: Multiple Node.js instances
- **Load Balancing**: Distribute requests across instances

#### 3. Caching Layer
- **Redis**: Distributed caching for session data
- **CDN**: Static asset caching and delivery
- **Application-level**: In-memory caching for frequently accessed data

## Application Data Flow & Request Lifecycle

### High-Level Data Flow Diagram
```mermaid
sequenceDiagram
    participant U as User/Browser
    participant F as Frontend (React)
    participant A as API Server (Express)
    participant M as Middleware Stack
    participant D as Database (MongoDB)
    participant B as Background Services
    
    U->>F: User Interaction
    F->>A: HTTP Request + JWT
    A->>M: Authentication Check
    M->>M: Rate Limiting
    M->>M: Input Validation
    A->>D: Database Query
    D->>A: Query Result
    A->>B: Trigger Background Tasks
    A->>F: JSON Response
    F->>U: Updated UI
```

### Detailed Request Lifecycle

#### 1. User Authentication Flow
```
1. User submits login credentials
2. Frontend POST /api/auth/login
3. Backend validates credentials with bcrypt
4. Generate JWT token with user payload
5. Return token + user data to frontend
6. Frontend stores token (localStorage) + sets Axios header
7. All subsequent requests include Authorization: Bearer <token>
```

#### 2. Task Creation Flow (Detailed)
```mermaid
graph TD
    A[Frontend: Task Form Submit] --> B[POST /api/tasks]
    B --> C[CORS Middleware]
    C --> D[Rate Limiter]
    D --> E[JSON Parser]
    E --> F[Auth Middleware: protect]
    F --> G[Input Validation]
    G --> H[Route Handler]
    H --> I[Create Task in MongoDB]
    I --> J[Post-save Hook: Update Group Count]
    J --> K[Stats Updater Middleware]
    K --> L[Return JSON Response]
    L --> M[Frontend: Update State]
    M --> N[Re-render UI Components]
    
    style F fill:#e1f5fe
    style G fill:#f3e5f5
    style I fill:#e8f5e8
    style K fill:#fff3e0
```

#### 3. Background Process Flows

**Reminder System Flow**:
```
Production Server Startup
    ↓
Start Reminder Scheduler (every 60 seconds)
    ↓
Query tasks with reminders due (last 5 minutes)
    ↓
For each task: Log notification (integration ready)
    ↓
[Future: Send email/push notifications]
```

**Statistics Update Flow**:
```
Task Operation (Create/Update/Delete)
    ↓
Response sent to client
    ↓
'finish' event triggered
    ↓
Async: Stats.updateUserStats(userId)
    ↓
Aggregate task counts, completion rates, streaks
    ↓
Update/Create Stats document
```

### State Management Architecture

#### Frontend State Flow (React Context)
```javascript
// State management hierarchy
App.jsx
├── AuthProvider (User authentication state)
│   ├── TaskProvider (Task management state)
│   │   └── ThemeProvider (UI theme state)
│   └── All child components have access to contexts
```

#### Context Providers Structure
```javascript
// AuthContext manages:
- user: Current user object
- token: JWT token
- isAuthenticated: Boolean status
- loading: Authentication check status
- login(), logout(), signup() methods

// TaskContext manages:
- tasks: Array of user tasks
- groups: Array of user groups
- filters: Current filter state
- CRUD operations for tasks/groups

// ThemeContext manages:
- theme: 'light' | 'dark'
- toggleTheme() method
```

### Database Transaction Patterns

#### 1. Task Creation with Group Update
```javascript
// Atomic operation using Mongoose middleware
const task = new Task(taskData)
await task.save()
// Post-save hook automatically triggers:
// - Group.updateTaskCount(task.group)
// - Stats update (via middleware)
```

#### 2. Inbox Item Promotion
```javascript
// Multi-step operation
const session = await mongoose.startSession()
session.startTransaction()

try {
  // Mark inbox item as promoted
  await InboxItem.findByIdAndUpdate(id, { 
    isPromoted: true, 
    promotedAt: new Date() 
  }).session(session)
  
  // Create corresponding task
  const task = new Task({
    ...inboxData,
    inboxRef: id,
    user: userId
  })
  await task.save({ session })
  
  await session.commitTransaction()
} catch (error) {
  await session.abortTransaction()
  throw error
} finally {
  session.endSession()
}
```

### API Response Patterns

#### Success Response Format
```javascript
// Single resource
{
  "success": true,
  "message": "Task created successfully",
  "data": { /* Task object */ }
}

// List resource with pagination
{
  "success": true,
  "count": 25,
  "data": [/* Array of tasks */],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 25,
    "totalPages": 2
  }
}
```

#### Error Response Patterns
```javascript
// Validation errors
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "title", "message": "Title is required" },
    { "field": "dueAt", "message": "Invalid date format" }
  ]
}

// Authentication errors
{
  "success": false,
  "message": "Not authorized to access this route"
}
```

### Real-time Data Synchronization

#### Current Implementation
- **Client-side polling**: Frontend periodically fetches fresh data
- **Optimistic updates**: UI updates immediately, syncs with server
- **Error handling**: Rollback on server errors

#### Future Enhancement Opportunities
```javascript
// WebSocket integration for real-time updates
io.on('connection', (socket) => {
  socket.on('join-user-room', (userId) => {
    socket.join(`user-${userId}`)
  })
  
  // Broadcast task updates to user's room
  socket.to(`user-${userId}`).emit('task-updated', taskData)
})
```

### Performance & Caching Strategies

#### Frontend Caching
- **React Query/SWR**: Server state management with caching
- **Component memoization**: React.memo, useMemo, useCallback
- **Route-based code splitting**: Lazy loading of page components

#### Backend Caching
- **Database query caching**: Mongoose query result caching
- **Redis integration**: Session and frequently accessed data
- **HTTP caching headers**: Browser caching for static responses

## Deployment Architecture & Scaling Strategy

### Production Architecture Diagram
```mermaid
graph TB
    subgraph "Client Layer"
        U[Users/Browsers]
        M[Mobile Apps]
    end
    
    subgraph "CDN & Static Assets"
        CDN[CloudFlare/AWS CloudFront]
        S3[S3/Static Hosting]
    end
    
    subgraph "Application Layer"
        LB[Load Balancer]
        API1[Node.js API Instance 1]
        API2[Node.js API Instance 2]
        API3[Node.js API Instance N]
    end
    
    subgraph "Data Layer"
        DB[(MongoDB Atlas Cluster)]
        CACHE[(Redis Cache)]
    end
    
    subgraph "Background Services"
        WORKER[Worker Pool]
        QUEUE[Message Queue]
        SCHEDULER[Cron Scheduler]
    end
    
    subgraph "External Services"
        EMAIL[Email Provider]
        PUSH[Push Notifications]
        MONITORING[Monitoring/Logging]
    end
    
    U --> CDN
    M --> CDN
    CDN --> S3
    CDN --> LB
    LB --> API1
    LB --> API2
    LB --> API3
    API1 --> DB
    API2 --> DB
    API3 --> DB
    API1 --> CACHE
    API2 --> CACHE
    API3 --> CACHE
    API1 --> QUEUE
    QUEUE --> WORKER
    WORKER --> EMAIL
    WORKER --> PUSH
    SCHEDULER --> DB
    API1 --> MONITORING
```

### Deployment Environments

#### Development Environment
```yaml
# docker-compose.dev.yml
version: '3.8'
services:
  mongodb:
    image: mongo:7.0
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: dev
      MONGO_INITDB_ROOT_PASSWORD: password
    volumes:
      - mongodb_data:/data/db

  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      NODE_ENV: development
      MONGODB_URI: mongodb://dev:password@mongodb:27017/taskmanager?authSource=admin
      JWT_SECRET: dev-secret-key
    depends_on:
      - mongodb
    volumes:
      - ./backend:/app
      - /app/node_modules

  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    environment:
      VITE_API_URL: http://localhost:5000/api
    volumes:
      - ./frontend:/app
      - /app/node_modules
```

#### Production Environment (Docker + Kubernetes)
```yaml
# k8s-deployment.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: task-manager-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: task-manager-api
  template:
    metadata:
      labels:
        app: task-manager-api
    spec:
      containers:
      - name: api
        image: task-manager-api:latest
        ports:
        - containerPort: 5000
        env:
        - name: NODE_ENV
          value: "production"
        - name: MONGODB_URI
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: mongodb-uri
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: jwt-secret
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

### Hosting Platform Recommendations

#### 1. Cloud Platform Options

| Platform | Frontend | Backend | Database | Cost | Complexity |
|----------|----------|---------|----------|------|------------|
| **Vercel + Railway** | Vercel | Railway | MongoDB Atlas | Low | Low |
| **Netlify + Heroku** | Netlify | Heroku | MongoDB Atlas | Medium | Low |
| **AWS Full Stack** | S3+CloudFront | ECS/Lambda | DocumentDB | High | High |
| **Google Cloud** | Firebase Hosting | Cloud Run | MongoDB Atlas | Medium | Medium |
| **DigitalOcean** | App Platform | App Platform | Managed MongoDB | Low | Medium |

#### 2. Recommended Production Setup (Medium Scale)
```bash
# Frontend: Vercel (Auto-deploy from Git)
# Backend: Railway/Render (Container deployment)
# Database: MongoDB Atlas (Managed service)
# CDN: Integrated with hosting platform
# Monitoring: Built-in platform monitoring
```

### Scaling Strategies

#### Horizontal Scaling (Stateless Design)
```javascript
// Stateless API design principles
class TaskController {
  // ✅ Stateless - user from JWT token
  static async createTask(req, res) {
    const task = new Task({
      ...req.body,
      user: req.user.id  // From JWT, not session
    })
    await task.save()
    res.json({ success: true, data: task })
  }
  
  // ❌ Stateful - would require sticky sessions
  // static async createTask(req, res) {
  //   const task = new Task({
  //     ...req.body,
  //     user: req.session.userId  // Session-dependent
  //   })
  // }
}
```

#### Database Scaling Options
```javascript
// 1. Read Replicas (MongoDB Atlas)
const readConnection = mongoose.createConnection(MONGODB_READ_URI)
const writeConnection = mongoose.createConnection(MONGODB_WRITE_URI)

// 2. Sharding Strategy (by user ID)
const getShardedConnection = (userId) => {
  const shardKey = userId.slice(-1) // Last character
  return connections[parseInt(shardKey) % SHARD_COUNT]
}

// 3. Connection Pooling
mongoose.connect(MONGODB_URI, {
  maxPoolSize: 10,        // Maximum connections
  minPoolSize: 5,         // Minimum connections
  maxIdleTimeMS: 30000,   // Close idle connections
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
```

### Background Job Architecture

#### Current Implementation (Simple)
```javascript
// In-process scheduler (current)
if (process.env.NODE_ENV === 'production') {
  startReminderScheduler()  // setInterval every minute
}
```

#### Recommended Production Implementation
```javascript
// Redis + Bull Queue System
import Queue from 'bull'
import Redis from 'redis'

const redis = new Redis(process.env.REDIS_URL)
const reminderQueue = new Queue('reminder processing', {
  redis: { port: 6379, host: 'redis-server' }
})

// Producer (API server)
const scheduleReminder = async (taskId, reminderTime) => {
  await reminderQueue.add('send-reminder', 
    { taskId },
    { delay: reminderTime - Date.now() }
  )
}

// Consumer (Worker process)
reminderQueue.process('send-reminder', async (job) => {
  const { taskId } = job.data
  const task = await Task.findById(taskId)
  
  if (task && !task.isCompleted) {
    await sendNotification(task.user, task)
  }
})
```

### Inbox System Reliability Architecture

#### Retry Mechanism Implementation
The inbox system implements sophisticated retry logic for robust operation:

```javascript
// Exponential backoff configuration
const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  BASE_DELAY: 500, // ms
  MAX_DELAY: 2000, // ms
  JITTER: 0.2 // 20% random jitter
}

// Retry logic with transaction support
async safeDelete(itemId, userId, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const session = await mongoose.startSession()
      session.startTransaction()
      
      const result = await this.findOneAndUpdate(
        { _id: itemId, $or: [{ user: userId }, { userId: userId }], isDeleted: false },
        { $set: { isDeleted: true, deletedAt: new Date(), deletedBy: userId }},
        { new: true, session, runValidators: true }
      )
      
      await session.commitTransaction()
      return { success: true, deletedItem: result }
    } catch (error) {
      await session.abortTransaction()
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, calculateDelay(attempt)))
      }
    }
  }
  return { success: false, message: 'Failed after all retries' }
}
```

#### Frontend Reliability Features
- **Optimistic Updates**: Immediate UI feedback with server sync
- **Retry Indicators**: Visual feedback for retry attempts
- **Error Recovery**: Graceful degradation and user-friendly error messages
- **State Management**: Consistent state across retry cycles

#### Performance Optimizations
- **Query Timeouts**: `.maxTimeMS(10000)` prevents hanging requests
- **Lean Queries**: `.lean()` returns plain objects for better performance
- **Strategic Indexing**: Compound indexes for efficient filtering
- **Minimal Projections**: Select only required fields for sidebar display

### Performance Monitoring & Observability

#### Application Performance Monitoring
```javascript
// APM Integration (New Relic example)
import newrelic from 'newrelic'

app.use((req, res, next) => {
  newrelic.setTransactionName('api', req.route?.path || req.path)
  next()
})

// Custom metrics
const recordTaskCreation = () => {
  newrelic.recordMetric('Custom/TasksCreated', 1)
}
```

#### Health Check Endpoints
```javascript
// Comprehensive health check
app.get('/health', async (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
    environment: process.env.NODE_ENV,
    database: {
      status: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
      responseTime: await getDatabaseResponseTime()
    },
    memory: process.memoryUsage(),
    uptime: process.uptime()
  }
  
  const isHealthy = health.database.status === 'Connected'
  res.status(isHealthy ? 200 : 503).json(health)
})
```

### CI/CD Pipeline

#### GitHub Actions Workflow
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test
      - run: npm run lint

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy Frontend
        uses: vercel/action@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          
      - name: Deploy Backend
        uses: railway-deploy@v1
        with:
          token: ${{ secrets.RAILWAY_TOKEN }}
```

### Environment-Specific Configurations

#### Production Environment Variables
```bash
# Database
MONGODB_URI=mongodb+srv://prod:***@cluster.mongodb.net/taskmanager

# Security
JWT_SECRET=ultra-secure-production-secret-minimum-32-characters
JWT_EXPIRE=1h
BCRYPT_ROUNDS=12

# CORS
FRONTEND_URL=https://taskmanager.yourdomain.com

# External Services
SMTP_HOST=smtp.sendgrid.net
SMTP_USER=apikey
SMTP_PASS=***

# Monitoring
NEW_RELIC_LICENSE_KEY=***
SENTRY_DSN=***

# Performance
NODE_ENV=production
WEB_CONCURRENCY=2  # Number of processes
WEB_MEMORY=512     # Memory limit (MB)
```

### Backup & Disaster Recovery

#### Database Backup Strategy
```bash
# Automated daily backups (MongoDB Atlas)
# - Point-in-time recovery
# - Cross-region replication
# - Automated failover

# Manual backup script
mongodump --uri="$MONGODB_URI" --out=/backups/$(date +%Y%m%d)
```

#### Application Recovery Plan
1. **Database Recovery**: Restore from MongoDB Atlas backup
2. **Code Deployment**: Redeploy from Git repository
3. **Environment Variables**: Restore from secure configuration management
4. **DNS/Load Balancer**: Update routing if needed
5. **Monitoring**: Verify all systems operational

## Observability & monitoring

- Add request logging (morgan is present) and structured logs (JSON) for production.
- Integrate a monitoring/alerting system (Prometheus + Grafana, Datadog, NewRelic) and APM for performance traces.
- Export metrics: request latency, error rate, DB connection status, queue length for workers.

## Backups & maintenance

- Regular DB backups (daily) with point-in-time recovery if using managed MongoDB.
- Retention policy for completed tasks: `Task.cleanupCompletedTasks(userId, daysOld)` exists — tune retention and optionally archive old data before deletion.

## Edge cases and failure modes

- Clock skew and timezone handling for reminders: store all dates in UTC, present in local timezone on client.
- Concurrent updates to the same task: consider optimistic concurrency control (Mongoose versioning) if conflicts become common.
- Long-running recurrence generation: move to background worker to avoid request timeouts.
- Rate-limiter false positives: ensure legitimate clients (mobile apps) are whitelisted if necessary.

## Testing, CI and quality gates

Short-term (low-risk) improvements to add immediately:
- Add unit tests for model logic (recurrence handling, markAsCompleted, virtuals) using Jest + mongodb-memory-server.
- Add API integration tests for critical endpoints using supertest.
- Add a linting step (ESLint) and a pre-commit hook (husky) to maintain code quality.
- Add a GitHub Actions workflow to run lint + tests on PRs.

Longer-term:
- Add load tests to identify DB hotspots and tune indexes.
- Add end-to-end tests for user flows (Cypress).

## Development Roadmap & Recommendations

### Immediate Improvements (High Impact, Low Effort)

#### 1. Testing Infrastructure ⭐⭐⭐
```javascript
// Backend testing with Jest + Supertest
// tests/integration/auth.test.js
describe('Authentication', () => {
  test('should register new user', async () => {
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    }
    
    const response = await request(app)
      .post('/api/auth/signup')
      .send(userData)
      .expect(201)
    
    expect(response.body.success).toBe(true)
    expect(response.body.user.email).toBe(userData.email)
  })
})

// Frontend testing with React Testing Library
// src/components/__tests__/TaskItem.test.jsx
import { render, screen, fireEvent } from '@testing-library/react'
import TaskItem from '../TaskItem'

test('should mark task as completed', () => {
  const mockTask = { id: '1', title: 'Test Task', status: 'pending' }
  const mockOnComplete = jest.fn()
  
  render(<TaskItem task={mockTask} onComplete={mockOnComplete} />)
  
  fireEvent.click(screen.getByRole('checkbox'))
  expect(mockOnComplete).toHaveBeenCalledWith('1')
})
```

#### 2. CI/CD Pipeline ⭐⭐⭐
```yaml
# .github/workflows/ci.yml
name: Continuous Integration

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      mongodb:
        image: mongo:7.0
        ports:
          - 27017:27017
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm run install:all
      
      - name: Run linting
        run: |
          cd backend && npm run lint
          cd ../frontend && npm run lint
      
      - name: Run tests
        run: |
          cd backend && npm test
          cd ../frontend && npm test
        env:
          MONGODB_URI: mongodb://localhost:27017/test
          JWT_SECRET: test-secret-key
```

#### 3. Code Quality Tools ⭐⭐
```json
// package.json - Root level scripts
{
  "scripts": {
    "lint": "npm run lint:backend && npm run lint:frontend",
    "lint:backend": "cd backend && eslint .",
    "lint:frontend": "cd frontend && eslint src/",
    "format": "prettier --write \"**/*.{js,jsx,json,md}\"",
    "test": "npm run test:backend && npm run test:frontend",
    "test:backend": "cd backend && jest",
    "test:frontend": "cd frontend && vitest"
  }
}

// .eslintrc.js - Shared configuration
module.exports = {
  extends: [
    "eslint:recommended",
    "@typescript-eslint/recommended",
    "prettier"
  ],
  rules: {
    "no-console": "warn",
    "no-unused-vars": "error",
    "prefer-const": "error"
  }
}
```

### Short-term Enhancements (1-2 weeks)

#### 4. Background Job System ⭐⭐
```javascript
// Upgrade from setInterval to proper job queue
import Bull from 'bull'
import { createBullBoard } from '@bull-board/api'
import { BullAdapter } from '@bull-board/api/bullAdapter'
import { ExpressAdapter } from '@bull-board/express'

// Job queue setup
const reminderQueue = new Bull('reminder queue', process.env.REDIS_URL)
const recurringTaskQueue = new Bull('recurring tasks', process.env.REDIS_URL)

// Job processors
reminderQueue.process('send-reminder', async (job) => {
  const { taskId, userId } = job.data
  await sendReminderNotification(taskId, userId)
})

recurringTaskQueue.process('create-recurring', async (job) => {
  const { taskId } = job.data
  await createRecurringTaskInstance(taskId)
})

// Bull Board for monitoring
const serverAdapter = new ExpressAdapter()
createBullBoard({
  queues: [
    new BullAdapter(reminderQueue),
    new BullAdapter(recurringTaskQueue)
  ],
  serverAdapter
})
serverAdapter.setBasePath('/admin/queues')
app.use('/admin/queues', serverAdapter.getRouter())
```

#### 5. Enhanced Authentication ⭐⭐
```javascript
// Refresh token implementation
const refreshTokenSchema = new mongoose.Schema({
  user: { type: ObjectId, ref: 'User', required: true },
  token: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
  isActive: { type: Boolean, default: true }
})

// Auth endpoints
app.post('/api/auth/refresh', async (req, res) => {
  const { refreshToken } = req.cookies
  
  const tokenDoc = await RefreshToken.findOne({ 
    token: refreshToken, 
    isActive: true,
    expiresAt: { $gt: new Date() }
  }).populate('user')
  
  if (!tokenDoc) {
    return res.status(403).json({ message: 'Invalid refresh token' })
  }
  
  const newAccessToken = tokenDoc.user.getSignedJwtToken()
  res.json({ accessToken: newAccessToken })
})
```

### Medium-term Features (1-2 months)

#### 6. TypeScript Migration ⭐⭐
```typescript
// Start with model definitions
// backend/models/Task.ts
interface ITask extends Document {
  title: string
  description?: string
  status: 'draft' | 'pending' | 'in-progress' | 'completed'
  priority: 'low' | 'medium' | 'high'
  user: Types.ObjectId
  group?: Types.ObjectId
  dueAt?: Date
  reminders: Date[]
  
  // Methods
  markAsCompleted(): Promise<ITask>
  isReminderDue(): boolean
}

const TaskSchema = new Schema<ITask>({
  title: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['draft', 'pending', 'in-progress', 'completed'],
    default: 'draft'
  }
  // ... rest of schema
})
```

#### 7. Real-time Features ⭐⭐
```javascript
// WebSocket integration
import { Server } from 'socket.io'

const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL }
})

io.use(socketAuth) // JWT middleware for sockets

io.on('connection', (socket) => {
  socket.on('join-user-room', (userId) => {
    socket.join(`user-${userId}`)
  })
  
  socket.on('task-updated', (taskData) => {
    socket.to(`user-${taskData.user}`).emit('task-updated', taskData)
  })
})

// Task update with real-time notification
const updateTask = async (req, res) => {
  const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true })
  
  // Emit real-time update
  req.io.to(`user-${task.user}`).emit('task-updated', task)
  
  res.json({ success: true, data: task })
}
```

#### 8. Mobile App Foundation ⭐
```javascript
// React Native setup
// mobile/App.tsx
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import { TaskProvider } from './contexts/TaskContext'
import TaskListScreen from './screens/TaskListScreen'
import TaskDetailScreen from './screens/TaskDetailScreen'

const Stack = createStackNavigator()

export default function App() {
  return (
    <TaskProvider>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="Tasks" component={TaskListScreen} />
          <Stack.Screen name="TaskDetail" component={TaskDetailScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </TaskProvider>
  )
}
```

### Long-term Vision (3-6 months)

#### 9. Advanced Analytics ⭐
- **Time tracking**: Pomodoro timer integration
- **Productivity insights**: Weekly/monthly reports
- **Goal setting**: OKR-style objective tracking
- **Team collaboration**: Shared workspaces and assignments

#### 10. Integration Ecosystem ⭐
- **Calendar sync**: Google Calendar, Outlook integration
- **Email**: Gmail, Outlook task creation from emails
- **Slack/Teams**: Bot for task management
- **API webhooks**: Third-party service integration

### Performance & Scalability Improvements

#### Database Optimization
```javascript
// Advanced indexing strategy
db.tasks.createIndex({ 
  "user": 1, 
  "status": 1, 
  "dueAt": 1 
}, { 
  name: "user_status_due_compound" 
})

// Aggregation pipeline optimization
const getTaskAnalytics = (userId) => Task.aggregate([
  { $match: { user: new ObjectId(userId) } },
  { $facet: {
    statusCounts: [
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ],
    priorityCounts: [
      { $group: { _id: "$priority", count: { $sum: 1 } } }
    ],
    completionTrend: [
      { $match: { status: "completed" } },
      { $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$completedAt" } },
        completed: { $sum: 1 }
      }},
      { $sort: { _id: 1 } },
      { $limit: 30 }
    ]
  }}
])
```

#### Caching Strategy
```javascript
// Redis caching layer
import Redis from 'ioredis'
const redis = new Redis(process.env.REDIS_URL)

const cacheMiddleware = (ttl = 300) => async (req, res, next) => {
  const key = `cache:${req.user.id}:${req.originalUrl}`
  const cached = await redis.get(key)
  
  if (cached) {
    return res.json(JSON.parse(cached))
  }
  
  res.sendResponse = res.json
  res.json = (body) => {
    redis.setex(key, ttl, JSON.stringify(body))
    res.sendResponse(body)
  }
  
  next()
}

// Apply to expensive endpoints
app.get('/api/stats', protect, cacheMiddleware(300), getStats)
```

### Success Metrics & KPIs

| Metric | Current | Target | Measurement |
|--------|---------|---------|-------------|
| **API Response Time** | - | < 200ms | New Relic/DataDog |
| **Test Coverage** | 0% | 80% | Jest/Coverage reports |
| **Code Quality Score** | - | A+ | SonarQube/CodeClimate |
| **User Satisfaction** | - | 4.5/5 | User feedback surveys |
| **System Uptime** | - | 99.9% | Monitoring alerts |
| **Security Score** | - | A+ | Security audit tools |

This roadmap provides a clear path for evolving the Task Manager application from its current state into a robust, scalable, and feature-rich productivity platform.

## Local Development Setup

### Prerequisites
- **Node.js**: Version 18+ (LTS recommended)
- **MongoDB**: Local installation or MongoDB Atlas account
- **Git**: For version control
- **VS Code**: Recommended IDE with extensions:
  - ES7+ React/Redux/React-Native snippets
  - Prettier - Code formatter
  - ESLint
  - Thunder Client (API testing)

### Quick Start Guide

#### 1. Clone Repository
```bash
git clone https://github.com/yourusername/task-manager-mern.git
cd task-manager-mern
```

#### 2. Install Dependencies
```bash
# Install root workspace dependencies
npm install

# Install all project dependencies (root, backend, frontend)
npm run install:all
```

#### 3. Environment Configuration

**Backend Environment** (`.env` in `backend/` directory):
```bash
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/taskmanager
# For MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/taskmanager

# JWT Configuration
JWT_SECRET=your-super-secure-secret-key-minimum-32-characters
JWT_EXPIRE=24h

# Security Configuration
BCRYPT_ROUNDS=12

# CORS Configuration
FRONTEND_URL=http://localhost:5173

# Server Configuration
NODE_ENV=development
PORT=5000
```

**Frontend Environment** (`.env` in `frontend/` directory):
```bash
# API Configuration
VITE_API_URL=http://localhost:5000/api

# Development Configuration
VITE_DEV_MODE=true
```

#### 4. Database Setup

**Option A: Local MongoDB**
```bash
# Install MongoDB Community Edition
# Start MongoDB service
mongod --dbpath /data/db

# MongoDB will be available at mongodb://localhost:27017
```

**Option B: MongoDB Atlas (Recommended)**
```bash
# 1. Create account at https://www.mongodb.com/atlas
# 2. Create free cluster
# 3. Get connection string
# 4. Update MONGODB_URI in backend/.env
```

#### 5. Start Development Servers

**Terminal 1 - Backend**:
```bash
npm run dev:backend
# Backend server starts at http://localhost:5000
# API endpoints available at http://localhost:5000/api
```

**Terminal 2 - Frontend**:
```bash
npm run dev:frontend
# Frontend development server starts at http://localhost:5173
# Hot reload enabled for development
```

#### 6. Verify Installation
```bash
# Test backend health
curl http://localhost:5000/api/health

# Access frontend
# Open browser to http://localhost:5173
```

### Development Workflow

#### Project Scripts
```json
{
  "scripts": {
    "install:all": "npm install && cd backend && npm install && cd ../frontend && npm install",
    "dev:backend": "cd backend && npm run dev",
    "dev:frontend": "cd frontend && npm run dev",
    "build:frontend": "cd frontend && npm run build",
    "test:backend": "cd backend && npm test",
    "test:frontend": "cd frontend && npm test"
  }
}
```

#### Backend Development
```bash
# Backend directory structure for development
backend/
├── server.js          # Main server file with hot reload
├── .env              # Environment variables (create from template)
├── nodemon.json      # Nodemon configuration
└── package.json      # Dependencies and scripts

# Start with automatic restart on file changes
cd backend
npm run dev  # Uses nodemon for auto-restart
```

#### Frontend Development
```bash
# Frontend development with Vite
cd frontend
npm run dev

# Features available in development:
# - Hot Module Replacement (HMR)
# - Fast refresh for React components
# - Instant server start
# - Built-in dev server with proxy support
```

### Database Migration & Seeding

#### Initial Data Setup
```javascript
// Run migration script to add new fields to existing tasks
cd backend
npm run migrate:tasks

// This script handles:
// - Adding status field to existing tasks
// - Setting default values for new fields
// - Creating indexes for performance
```

#### Create Test Data
```javascript
// Example script to create sample data
const createSampleData = async () => {
  // Create sample user
  const user = await User.create({
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123'
  })

  // Create default groups
  await Group.createDefaultGroups(user._id)

  // Create sample tasks
  const sampleTasks = [
    { title: 'Review architecture docs', priority: 'high' },
    { title: 'Update API documentation', priority: 'medium' },
    { title: 'Fix calendar view bugs', priority: 'low' }
  ]

  for (const taskData of sampleTasks) {
    await Task.create({
      ...taskData,
      user: user._id,
      createdBy: user._id
    })
  }
}
```

### Development Tools & Debugging

#### API Testing
```bash
# Using Thunder Client (VS Code Extension)
# Import collection from docs/api-collection.json

# Or using curl
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```

#### Database Inspection
```bash
# MongoDB Compass (GUI)
# Connect to: mongodb://localhost:27017/taskmanager

# MongoDB Shell
mongosh mongodb://localhost:27017/taskmanager

# View collections
show collections
db.tasks.find().pretty()
db.users.find().pretty()
```

#### Debugging Setup
```javascript
// VS Code launch.json for debugging
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Backend",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/backend/server.js",
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal",
      "restart": true,
      "runtimeExecutable": "nodemon",
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

### Common Development Issues & Solutions

#### Issue: CORS Errors
```javascript
// Solution: Check CORS configuration in backend/server.js
// Ensure frontend URL is in allowedOrigins array
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",  // Vite default port
  process.env.FRONTEND_URL
]
```

#### Issue: MongoDB Connection Failed
```bash
# Check MongoDB service status
brew services list | grep mongodb  # macOS
sudo systemctl status mongod        # Linux
net start MongoDB                   # Windows

# Check connection string in .env
MONGODB_URI=mongodb://localhost:27017/taskmanager
```

#### Issue: JWT Token Errors
```javascript
// Ensure JWT_SECRET is set and secure
JWT_SECRET=minimum-32-character-secret-key-for-security

// Check token format in frontend requests
Authorization: Bearer <actual-jwt-token>
```

### Development Best Practices

#### Code Organization
- **Feature-based structure**: Group related files together
- **Consistent naming**: Use camelCase for JavaScript, kebab-case for files
- **Environment separation**: Different configs for dev/staging/production
- **Error handling**: Comprehensive error handling and logging

#### Git Workflow
```bash
# Feature development workflow
git checkout -b feature/new-feature-name
# Make changes
git add .
git commit -m "feat: add new feature description"
git push origin feature/new-feature-name
# Create pull request
```

## Reference Documentation

### Quick File Location Guide

#### Backend Core Files
| File | Purpose | Key Features |
|------|---------|--------------|
| `backend/server.js` | Express server entry point | CORS, middleware, route mounting |
| `backend/package.json` | Backend dependencies | Express, Mongoose, JWT, security packages |

#### Data Models (`backend/models/`)
| Model | File | Key Responsibilities |
|-------|------|---------------------|
| **User** | `User.js` | Authentication, JWT tokens, password hashing |
| **Task** | `Task.js` | Core task management, recurrence, reminders |
| **InboxItem** | `InboxItem.js` | Quick capture, promotion to tasks |
| **Group** | `Group.js` | Task organization, color coding |
| **Stats** | `Stats.js` | Productivity metrics, leaderboard |

#### Route Handlers (`backend/routes/`)
| Route File | Endpoints | Functionality |
|------------|-----------|---------------|
| `auth.js` | `/api/auth/*` | User registration, login, profile |
| `tasks.js` | `/api/tasks/*` | CRUD operations, filtering, bulk actions |
| `groups.js` | `/api/groups/*` | Group management, task counts |
| `inbox.js` | `/api/inbox/*` | Inbox items, promotion workflow |
| `calendar.js` | `/api/calendar/*` | Calendar view, reminders |
| `completed.js` | `/api/completed/*` | Completed task analytics |
| `stats.js` | `/api/stats/*` | User statistics, leaderboard |
| `tasks/quick.js` | `/api/tasks/quick/*` | Quick task creation |

#### Middleware (`backend/middleware/`)
| Middleware | Purpose |
|------------|---------|
| `auth.js` | JWT authentication & authorization |
| `rateLimiter.js` | Request rate limiting (general & auth) |
| `reminders.js` | Background reminder scheduler |
| `statsUpdater.js` | Automatic statistics updates |

#### Frontend Core Files
| File | Purpose |
|------|---------|
| `frontend/index.html` | HTML entry point |
| `frontend/src/main.jsx` | React application bootstrap |
| `frontend/src/App.jsx` | Root component with routing |
| `frontend/package.json` | Frontend dependencies |
| `frontend/vite.config.js` | Vite build configuration |
| `frontend/tailwind.config.js` | Tailwind CSS configuration |

#### Frontend Components (`frontend/src/components/`)
| Directory | Components | Purpose |
|-----------|------------|---------|
| `layout/` | Navigation, Sidebar, ThemeToggle | App layout structure |
| `tasks/` | TaskList, TaskItem, TaskForm, QuickAdd | Task management UI |
| `calendar/` | CalendarView, CalendarTaskForm, RemindersList | Calendar features |
| `inbox/` | InboxItemCard, InboxSidebar, InboxStats, QuickAddInput | Inbox management with retry UI |
| `group/` | GroupForm | Group creation/editing |
| `scoreboard/` | StatsOverview, Leaderboard, ProductivityScore | Analytics dashboard |

**Inbox System Components Detail**:
- `InboxItemCard`: Individual inbox item with delete functionality and retry states
- `InboxSidebar`: Main sidebar container with real-time updates and error handling
- `InboxStats`: Analytics and metrics for captured ideas
- `QuickAddInput`: Rapid idea capture interface

#### Context Providers (`frontend/src/context/`)
| Context | State Management |
|---------|------------------|
| `AuthContext.jsx` | User authentication, JWT tokens |
| `TaskContext.jsx` | Task and group state management |
| `ThemeContext.jsx` | Light/dark theme switching |

#### Page Components (`frontend/src/pages/`)
| Page | Route | Purpose |
|------|-------|---------|
| `LandingPage.jsx` | `/` | Public homepage |
| `Login.jsx` | `/login` | User authentication |
| `Signup.jsx` | `/signup` | User registration |
| `Dashboard.jsx` | `/dashboard` | Analytics and overview |
| `Tasks.jsx` | `/tasks` | Main task management |
| `Calendar.jsx` | `/calendar` | Calendar view |
| `Inbox.jsx` | `/inbox` | Inbox management |

### Environment Configuration

#### Backend Environment Variables
```bash
# Database
MONGODB_URI=mongodb://localhost:27017/taskmanager

# Authentication
JWT_SECRET=your-secure-secret-key
JWT_EXPIRE=24h
BCRYPT_ROUNDS=12

# CORS
FRONTEND_URL=http://localhost:5173

# Server
NODE_ENV=development
PORT=5000
```

#### Frontend Environment Variables
```bash
# API Configuration
VITE_API_URL=http://localhost:5000/api
```

### Development Commands

#### Root Level Commands
```bash
npm run install:all        # Install all dependencies
npm run dev:backend        # Start backend development server
npm run dev:frontend       # Start frontend development server
npm run build:frontend     # Build frontend for production
```

#### Backend Commands
```bash
cd backend
npm run dev                # Start with nodemon (auto-restart)
npm start                  # Start production server
npm run migrate:tasks      # Run database migrations
```

#### Frontend Commands
```bash
cd frontend
npm run dev                # Start Vite dev server
npm run build              # Build for production
npm run preview            # Preview production build
```

### Database Schema Summary

#### Collections Overview
- **users**: User accounts and authentication
- **tasks**: Core task entities with full feature set
- **inboxitems**: Quick capture items for later processing
- **groups**: Task organization categories
- **stats**: Aggregated user productivity metrics

#### Key Relationships
- User → owns multiple Tasks, Groups, InboxItems, and one Stats record
- Group → contains multiple Tasks
- InboxItem → can be promoted to one Task
- Task → belongs to one User and optionally one Group

### API Endpoint Summary

#### Authentication Flow
1. `POST /api/auth/signup` - Create account
2. `POST /api/auth/login` - Get JWT token
3. Use JWT in `Authorization: Bearer <token>` header for protected routes

#### Core Operations
- **Tasks**: Full CRUD + filtering, bulk operations, calendar view
- **Groups**: Organization and categorization
- **Inbox**: Quick capture and promotion workflow
- **Statistics**: Personal metrics and leaderboard

### Security Implementation
- **JWT Authentication**: Stateless token-based auth
- **Password Security**: bcrypt hashing with configurable rounds
- **Input Validation**: express-validator on all endpoints
- **Rate Limiting**: Protection against abuse
- **CORS**: Controlled cross-origin access
- **Security Headers**: Helmet middleware protection

### Inbox System Implementation Summary

The Inbox System represents a robust implementation of temporary idea storage with the following key characteristics:

#### Technical Highlights
- **Dual Field Architecture**: Supports both `user` and `userId` fields for seamless migration
- **Advanced Retry Logic**: Implements exponential backoff with jitter for reliable operations
- **Performance Optimized**: Strategic indexing and query optimization for sidebar performance
- **Transaction Safety**: MongoDB transactions ensure data consistency during operations
- **Error Resilience**: Comprehensive error handling with user-friendly feedback

#### API Design Patterns
- **RESTful Endpoints**: Following REST principles with clear resource-based URLs
- **Consistent Response Format**: Standardized `{ success, data, message }` response structure
- **Authentication Integration**: JWT-based protection on all endpoints
- **Query Optimization**: Timeout protection and lean queries for optimal performance

#### Frontend Integration
- **Real-time Updates**: Immediate UI feedback with background synchronization
- **Retry State Management**: Visual indicators for retry attempts and failure states
- **Toast Notifications**: User-friendly feedback system for operations
- **Optimistic Updates**: Immediate UI response with server validation

#### Data Flow Architecture
```
User Action (Delete) → Frontend Optimistic Update → API Call with Retry Logic → 
Database Transaction → Success/Failure Response → UI State Reconciliation
```

This implementation provides a solid foundation for idea capture and management while maintaining high reliability and performance standards.

---

## Architecture Documentation Complete

This comprehensive architecture documentation covers:

✅ **System Overview**: High-level architecture and technology stack  
✅ **Directory Structure**: Complete file organization and purpose  
✅ **Data Models**: Detailed database schema and relationships  
✅ **API Specification**: Complete REST API documentation  
✅ **Security Architecture**: Authentication, authorization, and protection  
✅ **Performance Optimization**: Indexing, caching, and scaling strategies  
✅ **Development Setup**: Local development environment guide  
✅ **Deployment Strategy**: Production deployment and scaling  
✅ **Development Roadmap**: Future enhancements and improvements  

The task manager application is well-architected with modern best practices, comprehensive security measures, and a clear path for future growth. The documentation provides both high-level understanding for stakeholders and detailed technical information for developers.
