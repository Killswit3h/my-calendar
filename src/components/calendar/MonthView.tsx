'use client';

import { useMemo } from 'react';
import { addDays, endOfMonth, startOfMonth, isSameDay, differenceInDays } from 'date-fns';

type CalEvent = {
  id: string;
  title: string;
  startsAt: string | Date;
  endsAt: string | Date;
  color?: string | null;
  type?: string | null;
};

type EventSpan = {
  id: string;
  title: string;
  startCol: number;
  span: number;
  lane: number;
  color: string;
};

type WeekData = {
  weekStart: Date;
  events: EventSpan[];
};

const JOB_TYPE_COLORS = {
  construction: '#f97316', // orange
  maintenance: '#16a34a',  // green
  inspection: '#eab308',   // yellow
  guardrail: '#16a34a',    // green
  fence: '#f97316',        // orange
  attenuator: '#ef4444',   // red
  'temp-fence': '#eab308', // yellow
  handrail: '#3b82f6',     // blue
};

function getJobTypeColor(type?: string | null): string {
  if (!type) return '#6b7280'; // gray default
  return JOB_TYPE_COLORS[type.toLowerCase() as keyof typeof JOB_TYPE_COLORS] || '#6b7280';
}

function clampToWeek(event: CalEvent, weekStart: Date): EventSpan | null {
  const start = new Date(event.startsAt);
  const end = new Date(event.endsAt);
  const weekEnd = addDays(weekStart, 6);
  
  // Check if event overlaps with this week
  if (end < weekStart || start > weekEnd) {
    return null;
  }
  
  // Clamp event to week boundaries
  const clampedStart = start < weekStart ? weekStart : start;
  const clampedEnd = end > weekEnd ? weekEnd : end;
  
  // Calculate column and span
  const startCol = Math.max(1, differenceInDays(clampedStart, weekStart) + 1);
  const span = Math.min(7 - startCol + 1, differenceInDays(clampedEnd, clampedStart) + 1);
  
  return {
    id: event.id,
    title: event.title,
    startCol,
    span,
    lane: 0, // Will be calculated later
    color: getJobTypeColor(event.type),
  };
}

function packEventsInLanes(events: EventSpan[]): EventSpan[] {
  const lanes: number[] = [];
  const result: EventSpan[] = [];
  
  // Sort events by start column, then by span (larger first)
  const sortedEvents = [...events].sort((a, b) => a.startCol - b.startCol || b.span - a.span);
  
  for (const event of sortedEvents) {
    // Find the first lane where this event can fit
    let lane = 0;
    while (lane < lanes.length && lanes[lane] > event.startCol) {
      lane++;
    }
    
    // If no lane found, create a new one
    if (lane >= lanes.length) {
      lanes.push(0);
    }
    
    // Place the event in this lane
    event.lane = lane;
    lanes[lane] = event.startCol + event.span;
    result.push(event);
  }
  
  return result;
}

export default function MonthView({ monthDate, events }: { monthDate: Date; events: CalEvent[] }) {
  const monthStart = startOfMonth(monthDate);
  const firstGridDay = addDays(monthStart, -monthStart.getDay()); // Sunday start
  
  // Generate 6 weeks of days (42 days total)
  const days = useMemo(() => {
    return Array.from({ length: 42 }, (_, i) => addDays(firstGridDay, i));
  }, [firstGridDay]);
  
  // Process events for each week
  const weeks = useMemo(() => {
    const weekData: WeekData[] = [];
    
    for (let week = 0; week < 6; week++) {
      const weekStart = addDays(firstGridDay, week * 7);
      const weekEvents = events
        .map(event => clampToWeek(event, weekStart))
        .filter((event): event is EventSpan => event !== null);
      
      const packedEvents = packEventsInLanes(weekEvents);
      
      weekData.push({
        weekStart,
        events: packedEvents,
      });
    }
    
    return weekData;
  }, [firstGridDay, events]);
  
  return (
    <div className="month-view">
      {/* Day headers */}
      <div className="month-header">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="day-header">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className="month-grid">
        {days.map((day, index) => {
          const weekIndex = Math.floor(index / 7);
          const dayIndex = index % 7;
          const isCurrentMonth = day.getMonth() === monthDate.getMonth();
          const isToday = isSameDay(day, new Date());
          
          return (
            <div
              key={day.toISOString()}
              className={`day-cell ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}`}
            >
              {/* Day number */}
              <div className="day-number">
                {day.getDate()}
              </div>
              
              {/* Events for this week (only render on first day of week) */}
              {dayIndex === 0 && (
                <div className="week-events">
                  {weeks[weekIndex]?.events.map(event => (
                    <div
                      key={event.id}
                      className="event-span"
                      style={{
                        gridColumn: `${event.startCol} / span ${event.span}`,
                        gridRow: event.lane + 1,
                        backgroundColor: event.color,
                      }}
                      title={event.title}
                    >
                      <div className="event-dot" style={{ backgroundColor: event.color }} />
                      <span className="event-title">{event.title}</span>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Add button */}
              <button className="day-add-btn">+</button>
            </div>
          );
        })}
      </div>
      
      <style jsx>{`
        .month-view {
          background: #1c1c1e;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid #3a3a3c;
        }
        
        .month-header {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          background: #2c2c2e;
          border-bottom: 1px solid #3a3a3c;
        }
        
        .day-header {
          padding: 12px 8px;
          text-align: center;
          font-weight: 600;
          color: #f2f2f7;
          font-size: 14px;
        }
        
        .month-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          grid-template-rows: repeat(6, minmax(100px, 1fr));
          gap: 1px;
          background: #3a3a3c;
          min-height: 600px;
        }
        
        .day-cell {
          background: #1c1c1e;
          position: relative;
          padding: 8px;
          display: flex;
          flex-direction: column;
          min-height: 100px;
          overflow: visible;
        }
        
        .day-cell.other-month {
          background: #0f0f0f;
          opacity: 0.5;
        }
        
        .day-cell.today .day-number {
          background: #16a34a;
          color: white;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .day-number {
          font-size: 14px;
          font-weight: 500;
          color: #f2f2f7;
          margin-bottom: 4px;
        }
        
        .week-events {
          position: absolute;
          top: 32px;
          left: 8px;
          right: 8px;
          bottom: 32px;
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          grid-template-rows: repeat(4, 1fr);
          gap: 2px;
        }
        
        .event-span {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 8px;
          border-radius: 6px;
          background: rgba(34, 197, 94, 0.8);
          border: 1px solid rgba(34, 197, 94, 1);
          color: white;
          font-size: 12px;
          font-weight: 500;
          overflow: hidden;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        
        .event-span:hover {
          opacity: 0.8;
        }
        
        .event-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        
        .event-title {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          flex: 1;
        }
        
        .day-add-btn {
          position: absolute;
          bottom: 8px;
          right: 8px;
          width: 24px;
          height: 24px;
          border-radius: 6px;
          border: 1px solid #3a3a3c;
          background: #2c2c2e;
          color: #f2f2f7;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          cursor: pointer;
          transition: background 0.2s;
        }
        
        .day-add-btn:hover {
          background: #3a3a3c;
        }
      `}</style>
    </div>
  );
}