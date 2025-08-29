"use client"
import { useEffect, useState } from "react"

type Event = { id: string; calendarId: string; title: string; startsAt: string; endsAt: string }

export default function EventsClient({ calendarId }: { calendarId: string }) {
  const [events, setEvents] = useState<Event[]>([])
  const [title, setTitle] = useState("")
  const [startsAt, setStartsAt] = useState("")
  const [endsAt, setEndsAt] = useState("")
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
      body: JSON.stringify({ calendarId, title, startsAt, endsAt }),
    })
    setBusy(false)
    if (!r.ok) { alert((await r.json()).error ?? "create failed"); return }
    setTitle(""); setStartsAt(""); setEndsAt("")
    await load()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <input className="border p-2" placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} />
        <input className="border p-2" type="datetime-local" value={startsAt} onChange={e=>setStartsAt(e.target.value)} />
        <input className="border p-2" type="datetime-local" value={endsAt} onChange={e=>setEndsAt(e.target.value)} />
        <button className="border px-3" onClick={createEvent} disabled={busy||!title||!startsAt||!endsAt}>
          {busy ? "Saving..." : "Add"}
        </button>
      </div>
      <ul className="space-y-2">
        {events.map(ev=>(
          <li key={ev.id} className="border p-2">
            <div className="font-medium">{ev.title}</div>
            <div>{new Date(ev.startsAt).toLocaleString()} → {new Date(ev.endsAt).toLocaleString()}</div>
          </li>
        ))}
      </ul>
    </div>
  )
}
