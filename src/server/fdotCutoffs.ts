// src/server/fdotCutoffs.ts
import { Prisma } from '@prisma/client'
import { getPrisma } from '@/lib/db'
import { tryPrisma } from '@/lib/dbSafe'

export type FdotCutoffRecord = {
  id: string
  year: number
  cutoffDate: string
  label: string | null
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

export type CutoffInputRow = {
  id?: string | null
  cutoffDate: string
  label?: string | null
}

export type CutoffWindow = {
  year: number
  startDate: string
  endDate: string
  startDateUtc: Date
  endDateUtc: Date
  toCutoff: FdotCutoffRecord
  previousCutoff: FdotCutoffRecord | null
}

export async function fetchCutoffYears(): Promise<number[]> {
  return []
}

export async function fetchCutoffsForYear(year: number): Promise<FdotCutoffRecord[]> {
  return []
}

export async function fetchAllCutoffs(): Promise<Record<string, FdotCutoffRecord[]>> {
  return {}
}

export async function saveCutoffs(
  year: number,
  rows: CutoffInputRow[],
  userId: string | null,
): Promise<{ created: number; updated: number; deleted: number; records: FdotCutoffRecord[] }> {
  return { created: 0, updated: 0, deleted: 0, records: [] }
}

export async function resolveCutoffWindow(
  year: number,
  cutoffId: string,
): Promise<CutoffWindow | null> {
  return null
}

export async function generateAggregatedRows(window: CutoffWindow, page?: number, pageSize?: number): Promise<{ totalRows: number; page: number; pageSize: number; rows: any[]; grandTotal: any }> {
  return { totalRows: 0, page: page || 1, pageSize: pageSize || 100, rows: [], grandTotal: {} }
}

export async function exportAggregatedCsv(window: CutoffWindow): Promise<{ csv: string; rowCount: number }> {
  return { csv: '', rowCount: 0 }
}
