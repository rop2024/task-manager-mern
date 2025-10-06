import React from 'react';

const RemindersList = ({ reminders, onReminderClick, onDismissReminder }) => {
  const formatReminderTime = (reminderTime) => {
    const now = new Date();
    const reminderDate = new Date(reminderTime);
    const diffMs = reminderDate - now;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 0) {
      return 'Now';
    } else if (diffMins < 60) {
      return `In ${diffMins} min`;
    } else if (diffHours < 24) {
      return `In ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    } else {
      return `In ${diffDays} day${diffDays > 1 ? 's' : ''}`;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  if (!reminders || reminders.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Upcoming Reminders</h3>
        <div className="text-center text-gray-500 py-8">
          <div className="text-4xl mb-2">🔔</div>
          <p>No upcoming reminders</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Upcoming Reminders</h3>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {reminders.map((reminder) => (
          <div
            key={reminder.id}
            className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
            onClick={() => onReminderClick(reminder)}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <span 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: reminder.task.group?.color || '#3B82F6' }}
                ></span>
                <span className="text-sm font-medium text-gray-900 truncate">
                  {reminder.title}
                </span>
              </div>
              <div className="flex items-center space-x-3 text-xs text-gray-500">
                <span className={getPriorityColor(reminder.task.priority)}>
                  {reminder.task.priority} priority
                </span>
                <span>{reminder.task.group?.name}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-blue-600 whitespace-nowrap">
                {formatReminderTime(reminder.reminderTime)}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDismissReminder(reminder);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title="Dismiss reminder"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RemindersList;