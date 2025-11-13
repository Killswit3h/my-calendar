'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

type Option = { id: string; name: string }

const useDebouncedValue = <T,>(value: T, delay = 250) => {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const handle = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(handle)
  }, [value, delay])
  return debounced
}

export default function CustomerPicker({
  value,
  onChange,
  placeholder = 'Customer:Job',
}: {
  value?: string | null
  onChange: (id: string) => void
  placeholder?: string
}) {
  const [query, setQuery] = useState('')
  const [options, setOptions] = useState<Option[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [displayValue, setDisplayValue] = useState('')
  const debounced = useDebouncedValue(query)
  const mountedRef = useRef(false)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    const search = debounced.trim()
    setLoading(true)
    const params = new URLSearchParams({ limit: '20' })
    if (search) params.set('search', search)
    fetch(`/api/customers?${params.toString()}`, { signal: controller.signal, cache: 'no-store' })
      .then(async res => {
        if (!res.ok) throw new Error('Failed to load customers')
        const json = await res.json()
        const rows: Option[] = Array.isArray(json) ? json : Array.isArray(json?.items) ? json.items : []
        if (mountedRef.current) setOptions(rows)
      })
      .catch(() => {
        if (mountedRef.current) setOptions([])
      })
      .finally(() => {
        if (mountedRef.current) setLoading(false)
      })
    return () => controller.abort()
  }, [debounced])

  useEffect(() => {
    if (!value) {
      setDisplayValue('')
      return
    }
    const match = options.find(opt => opt.id === value)
    if (match) {
      setDisplayValue(match.name)
      return
    }
    let cancelled = false
    fetch(`/api/customers/${value}`, { cache: 'no-store' })
      .then(async res => {
        if (!res.ok) throw new Error('not found')
        const data: Option = await res.json()
        if (!cancelled) setDisplayValue(data.name)
      })
      .catch(() => {
        if (!cancelled) setDisplayValue('')
      })
    return () => {
      cancelled = true
    }
  }, [value, options])

  const list = useMemo(() => {
    if (!open) return []
    if (debounced.trim()) return options
    return options.slice(0, 20)
  }, [open, options, debounced])

  const showQuery = open ? query : ''
  const inputValue = showQuery || displayValue

  return (
    <div className="relative">
      <input
        className="w-full rounded border px-2 py-1"
        placeholder={placeholder}
        value={inputValue}
        onChange={e => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          setTimeout(() => setOpen(false), 150)
          setQuery('')
        }}
      />
      {open ? (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded border bg-white text-sm shadow dark:bg-zinc-900">
          {loading && <div className="px-3 py-2 text-zinc-500">Searching…</div>}
          {!loading && list.length === 0 ? (
            <div className="px-3 py-2 text-zinc-500">No matches</div>
          ) : null}
          {list.map(option => (
            <button
              type="button"
              key={option.id}
              className="flex w-full items-start gap-2 px-3 py-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800"
              onMouseDown={e => {
                e.preventDefault()
                onChange(option.id)
                setDisplayValue(option.name)
                setQuery('')
                setOpen(false)
              }}
            >
              {option.name}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
