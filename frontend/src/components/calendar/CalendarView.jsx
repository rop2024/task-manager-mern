import React, { useState, useCallback } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

const CalendarView = ({ events, onEventSelect, onSlotSelect, onEventResize, onEventDrop }) => {
  const [view, setView] = useState('month');
  const [date, setDate] = useState(new Date());

  const handleSelectEvent = useCallback((event) => {
    onEventSelect(event);
  }, [onEventSelect]);

  const handleSelectSlot = useCallback((slotInfo) => {
    onSlotSelect(slotInfo);
  }, [onSlotSelect]);

  const handleEventResize = useCallback((resizeInfo) => {
    onEventResize(resizeInfo);
  }, [onEventResize]);

  const handleEventDrop = useCallback((dropInfo) => {
    onEventDrop(dropInfo);
  }, [onEventDrop]);

  const eventStyleGetter = (event) => {
    const backgroundColor = event.color || '#3174ad';
    const style = {
      backgroundColor,
      borderRadius: '4px',
      opacity: 0.8,
      color: 'white',
      border: '0px',
      display: 'block'
    };
    
    // Style based on task status
    if (event.resource.status === 'completed') {
      style.opacity = 0.6;
      style.textDecoration = 'line-through';
    } else if (event.resource.status === 'in-progress') {
      style.borderLeft = '4px solid #f59e0b';
    }
    
    // Style based on priority
    if (event.resource.priority === 'high') {
      style.fontWeight = 'bold';
      style.borderBottom = '2px solid #dc2626';
    } else if (event.resource.priority === 'medium') {
      style.borderBottom = '2px solid #f59e0b';
    }

    return {
      style: style
    };
  };

  const dayPropGetter = (date) => {
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return {
        style: {
          backgroundColor: '#f0f9ff'
        }
      };
    }
    return {};
  };

  return (
    <div className="h-screen bg-white rounded-lg shadow-sm">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        view={view}
        date={date}
        onView={setView}
        onNavigate={setDate}
        selectable
        onSelectEvent={handleSelectEvent}
        onSelectSlot={handleSelectSlot}
        onEventResize={handleEventResize}
        onEventDrop={handleEventDrop}
        eventPropGetter={eventStyleGetter}
        dayPropGetter={dayPropGetter}
        popup
        resizable
        showMultiDayTimes
        step={60}
        views={['month', 'week', 'day', 'agenda']}
        messages={{
          next: "Next",
          previous: "Previous",
          today: "Today",
          month: "Month",
          week: "Week",
          day: "Day",
          agenda: "Agenda",
          date: "Date",
          time: "Time",
          event: "Task",
          noEventsInRange: "No tasks in this range"
        }}
        formats={{
          eventTimeRangeFormat: () => '', // Hide time range for events
          timeGutterFormat: (date, culture, localizer) =>
            localizer.format(date, 'HH:mm', culture),
        }}
      />
    </div>
  );
};

export default CalendarView;