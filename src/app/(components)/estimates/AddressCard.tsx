'use client'

type Props = {
  title: string
  name?: string | null
  address?: string | null
  editable?: boolean
  onChange?: (value: { name: string; address: string }) => void
}

export default function AddressCard({ title, name, address, editable = false, onChange }: Props) {
  if (editable) {
    return (
      <div className="rounded border p-3">
        <div className="mb-2 text-xs uppercase tracking-wide text-zinc-500">{title}</div>
        <div className="space-y-2">
          <input
            className="w-full rounded border px-2 py-1"
            placeholder="Name"
            defaultValue={name ?? ''}
            onChange={e => onChange?.({ name: e.target.value, address: address ?? '' })}
          />
          <textarea
            className="w-full min-h-[70px] rounded border px-2 py-1"
            placeholder="Address"
            defaultValue={address ?? ''}
            onChange={e => onChange?.({ name: name ?? '', address: e.target.value })}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="rounded border p-3">
      <div className="mb-2 text-xs uppercase tracking-wide text-zinc-500">{title}</div>
      <div className="font-medium">{name || '—'}</div>
      <div className="whitespace-pre-line text-sm text-zinc-700 dark:text-zinc-200">
        {address || '—'}
      </div>
    </div>
  )
}
