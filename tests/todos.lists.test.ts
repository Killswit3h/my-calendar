import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET as getLists, POST as postList } from '@/app/api/todos/lists/route'
import { setMockPrisma } from './utils/mockPrisma'
import { NextRequest } from 'next/server'

describe('todos lists API', () => {
  beforeEach(() => {
    setMockPrisma(null)
  })

  it('returns lists with smart counts applied', async () => {
    const todoListData = [
      { id: 'my', name: 'My Day', color: null, icon: null, position: 0, isSmart: true },
      { id: 'imp', name: 'Important', color: null, icon: null, position: 1, isSmart: true },
      { id: 'plan', name: 'Planned', color: null, icon: null, position: 2, isSmart: true },
      { id: 'A', name: 'Operations', color: 'emerald', icon: null, position: 3, isSmart: false },
    ]

    const prisma = {
      todoList: {
        findMany: vi.fn().mockResolvedValue(todoListData),
      },
      todo: {
        groupBy: vi.fn().mockResolvedValue([
          { listId: 'A', _count: { _all: 5 } },
        ]),
        count: vi
          .fn()
          .mockResolvedValueOnce(2) // my day
          .mockResolvedValueOnce(3) // important
          .mockResolvedValueOnce(4), // planned
      },
    }

    setMockPrisma(prisma as any)

    const res = await getLists()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.lists).toEqual([
      expect.objectContaining({ id: 'my', incompleteCount: 2 }),
      expect.objectContaining({ id: 'imp', incompleteCount: 3 }),
      expect.objectContaining({ id: 'plan', incompleteCount: 4 }),
      expect.objectContaining({ id: 'A', incompleteCount: 5 }),
    ])
  })

  it('creates a new list with incremental position', async () => {
    const prisma = {
      todoList: {
        aggregate: vi.fn().mockResolvedValue({ _max: { position: 3 } }),
        create: vi.fn().mockResolvedValue({
          id: 'list-new',
          name: 'New List',
          color: 'emerald',
          icon: null,
          position: 4,
          isSmart: false,
        }),
      },
      todo: {
        count: vi.fn(),
        groupBy: vi.fn(),
      },
    }
    setMockPrisma(prisma as any)

    const req = new NextRequest('http://test/api/todos/lists', {
      method: 'POST',
      body: JSON.stringify({ name: 'New List', color: 'emerald' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await postList(req)
    expect(res.status).toBe(201)
    const payload = await res.json()
    expect(payload).toEqual(
      expect.objectContaining({ id: 'list-new', name: 'New List', position: 4, color: 'emerald' }),
    )
    expect(prisma.todoList.create).toHaveBeenCalledWith({
      data: {
        name: 'New List',
        color: 'emerald',
        icon: null,
        position: 4,
        isSmart: false,
      },
      select: {
        id: true,
        name: true,
        color: true,
        icon: true,
        position: true,
        isSmart: true,
      },
    })
  })
})
