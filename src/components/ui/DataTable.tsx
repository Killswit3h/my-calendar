'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { useCallback, useMemo, useState } from 'react'
import { Download, Maximize2, Minimize2 } from 'lucide-react'

import { cn } from '@/lib/theme'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/Skeleton'

export type TableColumn<T> = {
  key: keyof T | string
  header: string
  width?: number
  minWidth?: number
  maxWidth?: number
  align?: 'left' | 'right' | 'center'
  hrefKey?: keyof T | string
}

export type DataTableProps<T> = {
  data: T[]
  columns: TableColumn<T>[]
  density?: 'comfortable' | 'compact'
  emptyMessage?: ReactNode
  toolbar?: ReactNode
  isLoading?: boolean
  skeletonCount?: number
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  density: densityProp = 'comfortable',
  emptyMessage = 'No records to display.',
  toolbar,
  isLoading = false,
  skeletonCount = 5,
}: DataTableProps<T>) {
  const [density, setDensity] = useState<'comfortable' | 'compact'>(densityProp)
  const [columnWidths, setColumnWidths] = useState<Record<string, number | undefined>>(() => {
    return Object.fromEntries(columns.map(col => [String(col.key), col.width]))
  })

  const handleResize = useCallback((key: string, delta: number) => {
    setColumnWidths(prev => {
      const current = prev[key] ?? columns.find(col => String(col.key) === key)?.width ?? 160
      const min = columns.find(col => String(col.key) === key)?.minWidth ?? 120
      const max = columns.find(col => String(col.key) === key)?.maxWidth ?? 480
      const next = Math.min(Math.max(current + delta, min), max)
      return { ...prev, [key]: next }
    })
  }, [columns])

  const exportCsv = useCallback(() => {
    if (!data.length) return
    const headers = columns.map(col => JSON.stringify(col.header))
    const rows = data.map(row =>
      columns
        .map(col => {
          const value = row[col.key as keyof T]
          if (value == null) return ''
          if (typeof value === 'string') return JSON.stringify(value)
          if (typeof value === 'number') return value
          if (typeof value === 'boolean') return value ? 'true' : 'false'
          return JSON.stringify(String(value))
        })
        .join(','),
    )
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'export.csv'
    anchor.click()
    URL.revokeObjectURL(url)
  }, [columns, data])

  const rowClass = density === 'compact' ? 'h-10' : 'h-14'
  const toolbarNode = toolbar ? <div className="flex-1 text-sm text-muted-foreground">{toolbar}</div> : null

  return (
    <div className="glass overflow-hidden rounded-2xl border border-border/60">
      <div className="flex flex-col gap-3 border-b border-border/40 px-4 py-3 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
        {toolbarNode}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-full border border-border/60 px-2 py-1">
            <button
              type="button"
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 transition',
                density === 'comfortable'
                  ? 'bg-[var(--gfc-green)] text-white shadow-card'
                  : 'text-muted hover:text-foreground',
              )}
              onClick={() => setDensity('comfortable')}
              aria-pressed={density === 'comfortable'}
            >
              <Maximize2 className="h-3 w-3" /> Comfort
            </button>
            <button
              type="button"
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 transition',
                density === 'compact'
                  ? 'bg-[var(--gfc-green)] text-white shadow-card'
                  : 'text-muted hover:text-foreground',
              )}
              onClick={() => setDensity('compact')}
              aria-pressed={density === 'compact'}
            >
              <Minimize2 className="h-3 w-3" /> Compact
            </button>
          </div>
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center gap-1 rounded-full border border-border/60 px-3 py-1 font-medium text-muted transition hover:border-border hover:text-foreground"
          >
            <Download className="h-3.5 w-3.5" /> CSV
          </button>
        </div>
      </div>
      <Table className="min-w-full table-fixed" data-testid="data-table">
        <TableHeader>
          <TableRow className="bg-surface">
            {columns.map(column => {
              const key = String(column.key)
              const width = columnWidths[key]
              return (
                <TableHead
                  key={key}
                  style={width ? { width, minWidth: width, maxWidth: width } : undefined}
                  data-width={width ?? 'auto'}
                  className="group relative select-none"
                >
                  <span>{column.header}</span>
                  <ColumnResizer onResize={delta => handleResize(key, delta)} />
                </TableHead>
              )
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: skeletonCount }).map((_, index) => (
              <TableRow key={`skeleton-${index}`} className={cn('border-border/30 text-sm', rowClass)}>
                {columns.map(column => (
                  <TableCell key={String(column.key)} className="px-4">
                    <Skeleton className="h-4 w-full rounded-full bg-foreground/10" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : data.length ? (
            data.map((row, index) => (
              <TableRow key={index} className={cn('last:border-b-0 text-sm text-foreground', rowClass)}>
                {columns.map(column => {
                  const key = String(column.key)
                  const width = columnWidths[key]
                  const raw = row[column.key as keyof T]
                  const hrefValue = column.hrefKey ? row[column.hrefKey as keyof T] : undefined
                  const content =
                    column.hrefKey && typeof hrefValue === 'string' ? (
                      <Link href={hrefValue} className="font-semibold text-foreground hover:underline">
                        {formatCell(raw)}
                      </Link>
                    ) : (
                      formatCell(raw)
                    )
                  return (
                    <TableCell
                      key={key}
                      style={width ? { width, minWidth: width, maxWidth: width } : undefined}
                      data-width={width ?? 'auto'}
                      className={cn(
                        'truncate px-4',
                        column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left',
                      )}
                      title={typeof content === 'string' ? content : undefined}
                    >
                      {content}
                    </TableCell>
                  )
                })}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="px-6 py-12 text-center text-sm text-muted">
                <div className="flex flex-col items-center gap-2">
                  <span>{emptyMessage}</span>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

type ColumnResizerProps = {
  onResize: (delta: number) => void
}

function ColumnResizer({ onResize }: ColumnResizerProps) {
  const handleMouseDown = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      event.preventDefault()
      const startX = event.clientX

      const handleMove = (moveEvent: MouseEvent) => {
        const delta = moveEvent.clientX - startX
        onResize(delta)
      }

      const handleUp = () => {
        window.removeEventListener('mousemove', handleMove)
        window.removeEventListener('mouseup', handleUp)
      }

      window.addEventListener('mousemove', handleMove)
      window.addEventListener('mouseup', handleUp)
    },
    [onResize],
  )

  return (
    <div
      data-testid="column-resizer"
      onMouseDown={handleMouseDown}
      onKeyDown={event => {
        if (event.key === 'ArrowRight') {
          event.preventDefault()
          onResize(16)
        }
        if (event.key === 'ArrowLeft') {
          event.preventDefault()
          onResize(-16)
        }
      }}
      role="separator"
      tabIndex={0}
      aria-orientation="vertical"
      className="absolute right-0 top-0 h-full w-1 cursor-col-resize select-none bg-transparent outline-none group-hover:bg-accent-200 focus-visible:bg-accent-400"
    />
  )
}

function formatCell(value: unknown): ReactNode {
  if (value == null) return '—'
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  if (typeof value === 'number') return value.toLocaleString()
  if (typeof value === 'string') return value
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return String(value)
}
