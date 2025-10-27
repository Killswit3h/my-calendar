'use client'

import useSWR from 'swr'
import type { FinanceLaborResponse } from '@/lib/finance/labor'

const fetcher = async (url: string) => {
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) {
    throw new Error(`Request failed with status ${res.status}`)
  }
  return (await res.json()) as FinanceLaborResponse
}

const buildUrl = ({ from, to }: { from?: string; to?: string }) => {
  const params = new URLSearchParams()
  if (from) params.set('from', from)
  if (to) params.set('to', to)
  const query = params.toString()
  return `/api/finance/labor${query ? `?${query}` : ''}`
}

export const useLaborFinance = (range: { from?: string; to?: string }, options?: { disabled?: boolean }) => {
  const url = options?.disabled ? null : buildUrl(range)
  const { data, error, isLoading, mutate } = useSWR<FinanceLaborResponse>(url, fetcher)
  return { data, error, isLoading, mutate }
}

export const getLaborFinance = async (range: { from?: string; to?: string } = {}) => {
  const res = await fetch(buildUrl(range), { cache: 'no-store' })
  if (!res.ok) {
    throw new Error(`Request failed with status ${res.status}`)
  }
  return (await res.json()) as FinanceLaborResponse
}
