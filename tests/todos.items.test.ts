import { describe, it, expect, beforeEach, vi } from 'vitest'
import { POST as createTodo } from '@/app/api/todos/items/route'
import { NextRequest } from 'next/server'
import { setMockPrisma } from './utils/mockPrisma'

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
      position: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
      listId: 'list-1',
      steps: [],
    })

    const prisma = {
      todo: {
        aggregate: vi.fn().mockResolvedValue({ _max: { position: 2 } }),
        create: createSpy,
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
    expect(prisma.todo.aggregate).toHaveBeenCalledWith({ _max: { position: true }, where: { listId: 'list-1' } })
    expect(createSpy).toHaveBeenCalledWith({
      data: expect.objectContaining({
        title: 'Test',
        listId: 'list-1',
        myDay: true,
        position: 3,
      }),
      include: { steps: { orderBy: { position: 'asc' } } },
    })
  })
})
