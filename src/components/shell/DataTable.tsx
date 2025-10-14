// src/components/shell/DataTable.tsx
import { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/theme'

interface Column<T> {
  key: keyof T
  header: string
  render?: (value: any, row: T) => ReactNode
}

interface DataTableProps<T> {
  title?: string
  data: T[]
  columns: Column<T>[]
  className?: string
}

export function DataTable<T extends Record<string, any>>({
  title,
  data,
  columns,
  className
}: DataTableProps<T>) {
  return (
    <div className={cn("glass rounded-lg", className)}>
      {title && (
        <div className="p-6 pb-0">
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
      )}
      <div className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border">
              <tr>
                {columns.map((column) => (
                  <th
                    key={String(column.key)}
                    className="h-12 px-4 text-left align-middle font-medium text-muted"
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr
                  key={index}
                  className="border-b border-border transition-colors hover:bg-card/50"
                >
                  {columns.map((column) => (
                    <td key={String(column.key)} className="p-4 align-middle">
                      {column.render
                        ? column.render(row[column.key], row)
                        : String(row[column.key] || '-')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.length === 0 && (
          <div className="p-8 text-center text-muted">
            <p>No data available</p>
          </div>
        )}
      </div>
    </div>
  )
}
