// src/components/ReminderPicker.tsx
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/cn'

const PRESET_OFFSETS = [10, 60, 1440] as const

type ReminderPickerProps = {
  initialEnabled?: boolean
  initialOffsets?: number[]
  onChange: (enabled: boolean, offsets: number[]) => void
  className?: string
}

export function ReminderPicker({ initialEnabled, initialOffsets, onChange, className }: ReminderPickerProps) {
  const [enabled, setEnabled] = useState(Boolean(initialEnabled))
  const [offsets, setOffsets] = useState<number[]>(() => sanitize(initialOffsets))
  const [customValue, setCustomValue] = useState('')
  const onChangeRef = useRef(onChange)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  const syncingRef = useRef(false)

  useEffect(() => {
    syncingRef.current = true
    setEnabled(Boolean(initialEnabled))
    setOffsets(sanitize(initialOffsets))
  }, [initialEnabled, initialOffsets])

  useEffect(() => {
    if (syncingRef.current) {
      syncingRef.current = false
      return
    }
    onChangeRef.current(enabled, offsets)
  }, [enabled, offsets])

  const sortedOffsets = useMemo(() => offsets.slice().sort((a, b) => a - b), [offsets])

  const togglePreset = (value: number) => {
    setOffsets(prev => {
      const exists = prev.includes(value)
      const next = exists ? prev.filter(item => item !== value) : [...prev, value]
      return sanitize(next)
    })
  }

  const handleToggle = (next: boolean) => {
    setEnabled(next)
  }

  const handleAddCustom = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const numeric = Number(customValue)
    if (!Number.isFinite(numeric) || numeric < 0) {
      return
    }
    const rounded = Math.floor(numeric)
    setOffsets(prev => sanitize([...prev, rounded]))
    setCustomValue('')
  }

  const removeOffset = (value: number) => {
    setOffsets(prev => prev.filter(item => item !== value))
  }

  return (
    <div className={cn('space-y-3 rounded-xl border border-border bg-surface-soft/60 p-4', className)}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <Label className="text-sm font-medium text-foreground">Reminders</Label>
          <p className="text-xs text-muted-foreground">Choose when to be reminded before the event.</p>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={enabled} onCheckedChange={handleToggle} />
          <span className="text-xs text-muted-foreground">{enabled ? 'Enabled' : 'Disabled'}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {PRESET_OFFSETS.map(value => {
          const selected = offsets.includes(value)
          return (
            <Button
              key={value}
              type="button"
              variant={selected ? 'default' : 'outline'}
              size="sm"
              onClick={() => togglePreset(value)}
            >
              {labelForOffset(value)}
            </Button>
          )
        })}
      </div>

      <form onSubmit={handleAddCustom} className="flex flex-wrap items-center gap-2">
        <Input
          value={customValue}
          onChange={event => setCustomValue(event.target.value)}
          placeholder="Minutes before"
          type="number"
          min={0}
          className="h-9 w-32"
        />
        <Button type="submit" size="sm" variant="secondary">
          Add
        </Button>
      </form>

      {sortedOffsets.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {sortedOffsets.map(value => (
            <button
              key={value}
              type="button"
              onClick={() => removeOffset(value)}
              className="rounded-full border border-border px-2 py-1 text-xs text-muted-foreground transition hover:border-destructive hover:text-destructive"
            >
              {labelForOffset(value)} ×
            </button>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">No reminders selected.</p>
      )}
    </div>
  )
}

function sanitize(values?: number[] | null): number[] {
  if (!values || !Array.isArray(values)) return []
  return Array.from(
    new Set(
      values
        .map(value => Number(value))
        .filter(value => Number.isFinite(value) && value >= 0)
        .map(value => Math.floor(value)),
    ),
  ).sort((a, b) => a - b)
}

function labelForOffset(minutes: number) {
  if (minutes === 10) return '10m'
  if (minutes === 60) return '1h'
  if (minutes === 1440) return '1d'
  if (minutes >= 1440) {
    const days = Math.round(minutes / 1440)
    return `${days}d`
  }
  if (minutes >= 60) {
    const hours = Number((minutes / 60).toFixed(1))
    return hours % 1 === 0 ? `${hours | 0}h` : `${hours}h`
  }
  return `${minutes}m`
}
