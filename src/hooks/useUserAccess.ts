'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

// Define types locally since they don't exist in the Prisma schema
export type AccessArea = 
  | 'ADMIN' 
  | 'CALENDAR' 
  | 'REPORTS' 
  | 'FINANCE' 
  | 'PAYROLL' 
  | 'SETTINGS'
  | 'REPORTS_DAILY'
  | 'REPORTS_WEEKLY'
  | 'REPORTS_FINANCE'
  | 'REPORTS_EXPORTS'
export type Role = 'ADMIN' | 'MANAGER' | 'MEMBER' | 'VIEWER'

type TeamShape = { id: string; name: string } | null
export type UserAccessRecord = {
  id: string
  name: string | null
  email: string | null
  createdAt: string
  updatedAt: string
  accessAreas: AccessArea[]
  memberships: { id: string; role: Role; team: TeamShape }[]
}

type UsersResponse = { users: UserAccessRecord[] }
type TogglePayload = { userId: string; area: AccessArea; enabled: boolean }

async function fetchUsers(): Promise<UsersResponse> {
  const response = await fetch('/api/admin/users', { cache: 'no-store' })
  if (!response.ok) throw new Error('Failed to load users')
  return response.json()
}

async function patchAccess(payload: TogglePayload): Promise<UserAccessRecord> {
  const response = await fetch('/api/admin/users', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) throw new Error('Failed to update access')
  const data: { user: UserAccessRecord } = await response.json()
  if (!data.user) throw new Error('User not found')
  return data.user
}

export function useUserAccess() {
  const queryClient = useQueryClient()
  const queryKey = ['admin-users']

  const query = useQuery({ queryKey, queryFn: fetchUsers })

  const mutation = useMutation({
    mutationFn: patchAccess,
    onMutate: async payload => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<UsersResponse>(queryKey)
      if (previous) {
        queryClient.setQueryData<UsersResponse>(queryKey, {
          users: previous.users.map(user => {
            if (user.id !== payload.userId) return user
            const nextAreas = payload.enabled
              ? Array.from(new Set([...user.accessAreas, payload.area]))
              : user.accessAreas.filter(area => area !== payload.area)
            return { ...user, accessAreas: nextAreas }
          }),
        })
      }
      return { previous }
    },
    onError: (_error, _payload, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous)
      }
    },
    onSuccess: updated => {
      queryClient.setQueryData<UsersResponse>(queryKey, current => {
        if (!current) return { users: [updated] }
        return {
          users: current.users.map(user => (user.id === updated.id ? updated : user)),
        }
      })
    },
  })

  return {
    users: query.data?.users ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    toggleAccess: (payload: TogglePayload) => mutation.mutate(payload),
    setAccessAsync: mutation.mutateAsync,
    pendingKey:
      mutation.status === 'pending' && mutation.variables
        ? `${mutation.variables.userId}:${mutation.variables.area}`
        : null,
  }
}










