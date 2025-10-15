"use client";

import { useState } from 'react';
import Link from 'next/link';

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-3xl font-bold mb-2">Calendar</h1>
          <p className="text-gray-400 text-lg">Manage your events and schedule</p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-primary">
            ➕ Add Event
          </button>
          <Link href="/dashboard" className="btn">
            ← Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Calendar Placeholder */}
      <div className="card p-8">
        <h3 className="text-white text-lg font-semibold mb-4">Calendar View</h3>
        <div className="grid grid-cols-7 gap-2 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-gray-400 font-medium py-2">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }, (_, i) => {
            const day = i - 6; // Start from -6 to show previous month days
            const isCurrentMonth = day > 0 && day <= 31;
            const isToday = day === new Date().getDate();
            
            return (
              <div
                key={i}
                className={`h-16 border border-gray-700 rounded-md p-2 ${
                  isCurrentMonth ? 'bg-gray-800' : 'bg-gray-900'
                } ${isToday ? 'ring-2 ring-green-500' : ''}`}
              >
                <div className={`text-sm ${isCurrentMonth ? 'text-white' : 'text-gray-600'}`}>
                  {day > 0 ? day : ''}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Events List */}
      <div className="card p-6">
        <h3 className="text-white text-lg font-semibold mb-4">Upcoming Events</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-700 rounded-md">
            <div>
              <div className="text-white font-medium">Project Meeting</div>
              <div className="text-gray-400 text-sm">Today, 2:00 PM</div>
            </div>
            <div className="text-green-500 text-sm">Active</div>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-700 rounded-md">
            <div>
              <div className="text-white font-medium">Site Inspection</div>
              <div className="text-gray-400 text-sm">Tomorrow, 9:00 AM</div>
            </div>
            <div className="text-blue-500 text-sm">Scheduled</div>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-700 rounded-md">
            <div>
              <div className="text-white font-medium">Equipment Delivery</div>
              <div className="text-gray-400 text-sm">Friday, 1:00 PM</div>
            </div>
            <div className="text-yellow-500 text-sm">Pending</div>
          </div>
        </div>
      </div>
    </div>
  );
}
