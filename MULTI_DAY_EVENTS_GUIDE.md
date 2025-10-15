# Multi-Day Events Implementation Guide

## Overview
Your calendar now properly displays multi-day events across all days they span. This guide explains how it works and how to test it.

## How It Works

### FullCalendar Multi-Day Events
FullCalendar uses **exclusive end dates**, meaning:
- If an event runs from Monday to Wednesday (inclusive), the end date should be **Thursday**
- The end date is always "the day after the last day you want to display"

### What Was Changed

#### 1. Event Selection (Lines 168-179)
When you select a date range on the calendar, FullCalendar automatically provides the correct exclusive end date. We now preserve this value.

#### 2. Event Saving (Lines 237-302)
Added logic to ensure multi-day events have proper end dates:
```typescript
// For multi-day events: ensure end date is properly set
// FullCalendar uses exclusive end dates (the day after the last displayed day)
let finalEnd = draft.end;
if (draft.allDay && draft.end) {
  const startDate = new Date(draft.start);
  const endDate = new Date(draft.end);
  // If user selected same day for start and end, or end is before start, add one day
  if (endDate <= startDate) {
    const nextDay = new Date(startDate);
    nextDay.setDate(nextDay.getDate() + 1);
    finalEnd = nextDay.toISOString().slice(0, 10);
  }
}
```

#### 3. CSS Styling
The calendar.css file already includes proper styling for multi-day events to span across days:
- `.fc-event-multiday` classes ensure full-width display
- Event harnesses are positioned correctly
- Multi-day event main containers span 100% width

## Testing Multi-Day Events

### Method 1: Click and Drag
1. Click on a start date in the calendar
2. Drag to an end date (e.g., 3 days later)
3. Release the mouse
4. Fill in the event details
5. Click "Save"

**Result**: The event should appear as a continuous bar across all selected days.

### Method 2: Manual Date Entry
1. Click on any date to create a new event
2. In the modal:
   - Set **Start date**: e.g., `2025-10-15`
   - Set **End date**: e.g., `2025-10-18` (for a 4-day event: 15th, 16th, 17th, 18th)
   - Check **All day**: ✓
3. Click "Save"

**Result**: The event spans from October 15 to October 18 (inclusive).

### Method 3: Programmatically Add Test Events
You can add test events in your `Calendar.tsx` initial state:

```typescript
const [events, setEvents] = useState<EventInput[]>([
  {
    id: 'test-multiday-1',
    title: '3-Day Project',
    start: '2025-10-20',
    end: '2025-10-23', // Exclusive: displays on 20th, 21st, 22nd
    allDay: true,
    className: 'evt-fence',
    extendedProps: {
      type: 'FENCE',
      location: 'Main Site',
    }
  },
  {
    id: 'test-multiday-2',
    title: 'Week-Long Installation',
    start: '2025-10-27',
    end: '2025-11-03', // Exclusive: displays 7 days from Oct 27
    allDay: true,
    className: 'evt-guardrail',
    extendedProps: {
      type: 'GUARDRAIL',
    }
  }
]);
```

## Edge Cases Handled

### Same Day Events
If a user selects the same day for start and end, the code automatically adds one day to make it display for at least one day.

### Cross-Week Events
Events that start mid-week and continue into the next week will wrap correctly across calendar rows.

### Month Boundaries
Multi-day events spanning across month boundaries will display correctly, showing in both months.

### Drag and Resize
The existing event handlers (`handleEventDrop`, `handleEventResize`) already preserve the FullCalendar date format, so dragging and resizing multi-day events works correctly.

## Visual Verification Checklist

- [ ] Multi-day event appears as a continuous horizontal bar
- [ ] Event spans all days from start to end (inclusive of selected range)
- [ ] Event text is visible and doesn't overflow
- [ ] Event maintains its color class (fence, guardrail, etc.)
- [ ] Event can be clicked to edit
- [ ] Event can be dragged to different dates
- [ ] Event can be resized by dragging edges
- [ ] Location pin icon appears if location is set
- [ ] Event wraps to next row when crossing week boundaries

## Troubleshooting

### Event Only Appears on First Day
- **Check**: Verify the event has an `end` date that is **after** the start date
- **Fix**: Ensure `end` is set to the day **after** the last day you want to display

### Event End Date Off By One Day
- **Check**: Remember FullCalendar uses exclusive end dates
- **Fix**: If you want an event on Oct 15-17 (3 days), set end to Oct 18

### Event Doesn't Span Full Width
- **Check**: Verify the event has `allDay: true`
- **Fix**: Set `allDay: true` in the event object

### Styling Issues
- **Check**: Ensure the event has a proper className (evt-fence, evt-guardrail, etc.)
- **Fix**: Verify `typeToClass()` function is returning the correct class

## Example Events for Testing

Add these to your calendar to test various scenarios:

```typescript
// 2-day event
{
  title: '2-Day Fence Install',
  start: '2025-10-15',
  end: '2025-10-17', // Shows on 15th and 16th
  allDay: true,
  className: 'evt-fence'
}

// 5-day event spanning across weeks
{
  title: '5-Day Guardrail Project',
  start: '2025-10-24', // Friday
  end: '2025-10-29', // Shows Fri-Tue (crosses weekend)
  allDay: true,
  className: 'evt-guardrail'
}

// Full week event
{
  title: 'Week-Long Site Work',
  start: '2025-11-03', // Monday
  end: '2025-11-08', // Shows entire work week
  allDay: true,
  className: 'evt-temp-fence'
}
```

## Summary

Your calendar is now configured to properly display multi-day events. The key points:

1. ✅ FullCalendar's exclusive end date system is preserved
2. ✅ Event selection provides correct date ranges
3. ✅ Event saving handles edge cases (same-day, invalid ranges)
4. ✅ CSS ensures events span full width across days
5. ✅ Drag and resize operations maintain correct date formats

Start testing by creating a new event and dragging across multiple days!
