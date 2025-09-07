"use client"
import { useEffect, useState } from "react"

type Event = { id: string; calendarId: string; title: string; start: string; end: string }

export default function EventsClient({ calendarId }: { calendarId: string }) {
  const [events, setEvents] = useState<Event[]>([])
  const [title, setTitle] = useState("")
  const [start, setStart] = useState("")
  const [end, setEnd] = useState("")
  const [busy, setBusy] = useState(false)

  async function load() {
    const r = await fetch(`/api/events?calendarId=${encodeURIComponent(calendarId)}`, { cache: "no-store" })
    if (!r.ok) throw new Error("load failed")
    setEvents(await r.json())
  }
  useEffect(() => { load().catch(console.error) }, [calendarId])

  async function createEvent() {
    setBusy(true)
    const r = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ calendarId, title, start, end }),
    })
    setBusy(false)
    if (!r.ok) { alert((await r.json()).error ?? "create failed"); return }
    setTitle(""); setStart(""); setEnd("")
    await load()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <input className="border p-2" placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} />
        <input className="border p-2" type="datetime-local" value={start} onChange={e=>setStart(e.target.value)} />
        <input className="border p-2" type="datetime-local" value={end} onChange={e=>setEnd(e.target.value)} />
        <button className="border px-3" onClick={createEvent} disabled={busy||!title||!start||!end}>
          {busy ? "Saving..." : "Add"}
        </button>
      </div>
      <ul className="space-y-2">
        {events.map(ev=>(
          <li key={ev.id} className="border p-2">
            <div className="font-medium">{ev.title}</div>
            <div>{new Date(ev.start).toLocaleString()} → {new Date(ev.end).toLocaleString()}</div>
          </li>
        ))}
      </ul>
    </div>
  )
}
