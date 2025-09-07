'use client'
import { useEffect, useState } from 'react'

export default function HolidaySettings() {
  const [loading, setLoading] = useState(true)
  const [showHolidays, setShowHolidays] = useState(true)
  const [countryCode, setCountryCode] = useState('US')

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/settings', { cache: 'no-store' })
        if (!res.ok) throw new Error('settings GET failed')
        const s = await res.json()
        setShowHolidays(!!s.showHolidays)
        setCountryCode(s.countryCode || 'US')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  async function save() {
    setLoading(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          showHolidays,
          countryCode: countryCode.toUpperCase(),
        }),
      })
      if (!res.ok) throw new Error('settings POST failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3 p-3 border rounded-lg">
      <div className="flex items-center gap-2">
        <input
          id="showH"
          type="checkbox"
          checked={showHolidays}
          onChange={(e) => setShowHolidays(e.target.checked)}
        />
        <label htmlFor="showH">Show public holidays</label>
      </div>

      <div className="space-y-1">
        <label className="block text-sm">Country code</label>
        <input
          className="border rounded px-2 py-1 w-28"
          value={countryCode}
          onChange={(e) => setCountryCode(e.target.value)}
        />
      </div>

      <button
        onClick={save}
        disabled={loading}
        className="px-3 py-1.5 rounded bg-black text-white disabled:opacity-50"
      >
        {loading ? 'Saving…' : 'Save'}
      </button>
    </div>
  )
}
