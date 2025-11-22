import { describe, it, expect, beforeEach, vi } from 'vitest'
import { POST as createTodo } from '@/app/api/todos/items/route'
import { NextRequest } from 'next/server'
import { setMockPrisma } from './utils/mockPrisma'
import { sendTodoNotificationEmail } from '@/lib/mailer'

vi.mock('@/lib/mailer', () => ({
  sendTodoNotificationEmail: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('@/lib/subscribe', () => ({
  subscribeUserToResource: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('@/lib/notify', () => ({
  emitChange: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('@/lib/session', () => ({
  getCurrentUser: vi.fn().mockResolvedValue({ id: 'user-1', name: 'Tester' }),
}))

describe('todos items API', () => {
  beforeEach(() => {
    setMockPrisma(null)
  })

  it('creates a todo with next position for list', async () => {
    const createSpy = vi.fn().mockResolvedValue({
      id: 'todo-1',
      title: 'Test',
      note: null,
      isCompleted: false,
      isImportant: false,
      myDay: true,
      dueAt: null,
      remindAt: null,
      repeatRule: null,
      position: 30,
      sortOrder: 30,
      createdAt: new Date(),
      updatedAt: new Date(),
      listId: 'list-1',
      steps: [],
    })

    const prisma = {
      todo: {
        aggregate: vi.fn().mockResolvedValue({ _max: { sortOrder: 20 } }),
        create: createSpy,
      },
      user: {
        upsert: vi.fn().mockResolvedValue(null),
      },
    }

    setMockPrisma(prisma as any)

    const req = new NextRequest('http://test/api/todos/items', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test', listId: 'list-1', myDay: true }),
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await createTodo(req)
    expect(res.status).toBe(201)
    expect(prisma.todo.aggregate).toHaveBeenCalledWith({ _max: { sortOrder: true }, where: { listId: 'list-1' } })
    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: 'Test',
          listId: 'list-1',
          myDay: true,
          position: 30,
          sortOrder: 30,
        }),
      }),
    )
  })

  it('emails list contact when notifications are enabled', async () => {
    const mailerSpy = sendTodoNotificationEmail as unknown as vi.Mock
    mailerSpy.mockClear()

    const createSpy = vi.fn().mockResolvedValue({
      id: 'todo-1',
      title: 'Notify Robert',
      note: 'Check fence status',
      isCompleted: false,
      isImportant: false,
      myDay: false,
      dueAt: null,
      remindAt: null,
      repeatRule: null,
      position: 10,
      sortOrder: 10,
      createdAt: new Date(),
      updatedAt: new Date(),
      listId: 'list-robert',
      steps: [],
      list: {
        id: 'list-robert',
        name: 'Robert',
        notificationEmail: 'robert@example.com',
        notifyOnNewTask: true,
      },
    })

    const prisma = {
      todo: {
        aggregate: vi.fn().mockResolvedValue({ _max: { sortOrder: 0 } }),
        create: createSpy,
      },
      user: {
        upsert: vi.fn().mockResolvedValue(null),
      },
    }

    setMockPrisma(prisma as any)

    const req = new NextRequest('http://test/api/todos/items', {
      method: 'POST',
      body: JSON.stringify({ title: 'Notify Robert', listId: 'list-robert' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await createTodo(req)
    expect(res.status).toBe(201)
    expect(mailerSpy).toHaveBeenCalledTimes(1)
    expect(mailerSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'robert@example.com',
        listName: 'Robert',
        todo: expect.objectContaining({
          title: 'Notify Robert',
          url: expect.stringContaining('todo-1'),
        }),
      }),
    )
  })
})
