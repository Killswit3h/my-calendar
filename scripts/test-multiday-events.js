#!/usr/bin/env node

/**
 * Test script to add multi-day events for verification
 * Run with: node scripts/test-multiday-events.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addTestEvents() {
  try {
    console.log('Adding test multi-day events...');
    
    // Clear existing test events first
    await prisma.event.deleteMany({
      where: {
        title: {
          startsWith: '[TEST]'
        }
      }
    });
    
    // Add test events
    const testEvents = [
      {
        title: '[TEST] Multi-Day Event 1',
        description: 'This event spans 3 days',
        startsAt: new Date('2025-01-15T09:00:00Z'),
        endsAt: new Date('2025-01-17T17:00:00Z'),
        allDay: false,
        calendarId: 'cme9wqhpe0000ht8sr5o3a6wf',
        type: 'construction'
      },
      {
        title: '[TEST] All-Day Event 2',
        description: 'This all-day event spans 2 days',
        startsAt: new Date('2025-01-20T00:00:00Z'),
        endsAt: new Date('2025-01-22T00:00:00Z'),
        allDay: true,
        calendarId: 'cme9wqhpe0000ht8sr5o3a6wf',
        type: 'maintenance'
      },
      {
        title: '[TEST] Week-Long Event',
        description: 'This event spans a full week',
        startsAt: new Date('2025-01-27T08:00:00Z'),
        endsAt: new Date('2025-02-02T18:00:00Z'),
        allDay: false,
        calendarId: 'cme9wqhpe0000ht8sr5o3a6wf',
        type: 'inspection'
      }
    ];
    
    for (const event of testEvents) {
      const created = await prisma.event.create({
        data: event
      });
      console.log(`✅ Created: ${created.title} (${created.startsAt.toISOString()} to ${created.endsAt.toISOString()})`);
    }
    
    console.log('\n🎉 Test events added successfully!');
    console.log('Navigate to /calendar to see the multi-day spanning in action.');
    console.log('Look for events with [TEST] prefix - they should span across multiple days.');
    
  } catch (error) {
    console.error('❌ Error adding test events:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addTestEvents();
