import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import CalendarView from '../components/calendar/CalendarView';
import RemindersList from '../components/calendar/RemindersList';
import CalendarTaskForm from '../components/calendar/CalendarTaskForm';
import usePageTitle from '../hooks/usePageTitle';
import FloatingAddButton from '../components/ui/FloatingAddButton';

const Calendar = () => {
  usePageTitle('Calendar');
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch calendar data
  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      const [eventsResponse, remindersResponse, groupsResponse] = await Promise.all([
        axios.get('/api/calendar/tasks'),
        axios.get('/api/calendar/reminders?hours=24'),
        axios.get('/api/groups')
      ]);

      setEvents(eventsResponse.data.data.tasks);
      setReminders(remindersResponse.data.data);
      setGroups(groupsResponse.data.data);
    } catch (error) {
      console.error('Error fetching calendar data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCalendarData();
  }, []);

  const refreshData = () => {
    setRefreshing(true);
    fetchCalendarData();
  };

  // Event handlers for calendar
  const handleEventSelect = (event) => {
    setSelectedEvent(event);
    setShowTaskForm(true);
  };

  const handleSlotSelect = (slotInfo) => {
    setSelectedSlot(slotInfo);
    setSelectedEvent(null);
    setShowTaskForm(true);
  };

  const handleEventResize = async (resizeInfo) => {
    try {
      const { event, start, end } = resizeInfo;
      
      await axios.put(`/api/calendar/tasks/${event.resource.taskId}/dates`, {
        startAt: start,
        dueAt: end,
        isAllDay: event.allDay
      });

      refreshData();
    } catch (error) {
      console.error('Error resizing event:', error);
      alert('Error updating task dates: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleEventDrop = async (dropInfo) => {
    try {
      const { event, start, end } = dropInfo;
      
      await axios.put(`/api/calendar/tasks/${event.resource.taskId}/dates`, {
        startAt: start,
        dueAt: end,
        isAllDay: event.allDay
      });

      refreshData();
    } catch (error) {
      console.error('Error moving event:', error);
      alert('Error updating task dates: ' + (error.response?.data?.message || error.message));
    }
  };

  // Task form handlers
  const handleCreateTask = async (taskData) => {
    try {
      await axios.post('/api/tasks', taskData);
      setShowTaskForm(false);
      setSelectedEvent(null);
      setSelectedSlot(null);
      refreshData();
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Error creating task: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleUpdateTask = async (taskData) => {
    try {
      await axios.put(`/api/tasks/${selectedEvent.resource.taskId}`, taskData);
      setShowTaskForm(false);
      setSelectedEvent(null);
      refreshData();
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Error updating task: ' + (error.response?.data?.message || error.message));
    }
  };

  // Reminder handlers
  const handleReminderClick = (reminder) => {
    // Find the corresponding event
    const event = events.find(e => e.resource.taskId === reminder.taskId);
    if (event) {
      handleEventSelect(event);
    }
  };

  const handleDismissReminder = async (reminder) => {
    try {
      // Remove the specific reminder
      await axios.delete(`/api/calendar/tasks/${reminder.taskId}/reminders/0`); // Simplified - would need to find exact index
      refreshData();
    } catch (error) {
      console.error('Error dismissing reminder:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Calendar</h1>
            <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">
              Manage your tasks and deadlines visually
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:space-x-0">
            <button
              onClick={refreshData}
              disabled={refreshing}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors flex items-center justify-center text-sm sm:text-base"
            >
              {refreshing ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              <span className="hidden sm:inline">Refresh</span>
              <span className="sm:hidden">Refresh</span>
            </button>
            <button
              onClick={() => {
                setSelectedEvent(null);
                setSelectedSlot(null);
                setShowTaskForm(true);
              }}
              className="bg-green-500 hover:bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors flex items-center justify-center text-sm sm:text-base"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">New Task</span>
              <span className="sm:hidden">New</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
          {/* Reminders Sidebar - Show on top on mobile */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <RemindersList
              reminders={reminders}
              onReminderClick={handleReminderClick}
              onDismissReminder={handleDismissReminder}
            />
          </div>

          {/* Calendar - Show on top on mobile */}
          <div className="lg:col-span-3 order-1 lg:order-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-6">
              <CalendarView
                events={events}
                onEventSelect={handleEventSelect}
                onSlotSelect={handleSlotSelect}
                onEventResize={handleEventResize}
                onEventDrop={handleEventDrop}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Task Form Modal */}
      {showTaskForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <CalendarTaskForm
            task={selectedEvent ? {
              ...selectedEvent.resource,
              _id: selectedEvent.resource.taskId,
              title: selectedEvent.title,
              startAt: selectedEvent.start,
              dueAt: selectedEvent.end,
              isAllDay: selectedEvent.allDay,
              group: selectedEvent.resource.group?._id
            } : null}
            onSubmit={selectedEvent ? handleUpdateTask : handleCreateTask}
            onCancel={() => {
              setShowTaskForm(false);
              setSelectedEvent(null);
              setSelectedSlot(null);
            }}
            loading={false}
            groups={groups}
            defaultStart={selectedSlot?.start}
            defaultEnd={selectedSlot?.end}
            defaultAllDay={selectedSlot?.action === 'select'}
          />
        </div>
      )}

      {/* Floating Add Button */}
      <FloatingAddButton />
    </div>
  );
};

export default Calendar;