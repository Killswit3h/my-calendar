'use client'

import { useEffect, useMemo, useState } from 'react'

export default function PdfPreview({ id, kind }: { id?: string; kind: 'estimate' | 'changeOrder' }) {
  const [src, setSrc] = useState('')

  const url = useMemo(() => {
    if (!id) return ''
    return kind === 'estimate' ? `/api/estimates/${id}/pdf` : `/api/change-orders/${id}/pdf`
  }, [id, kind])

  useEffect(() => {
    setSrc(url)
  }, [url])

  if (!id) {
    return <div className="rounded border p-4 text-sm text-zinc-500">Save first to enable PDF preview.</div>
  }

  return <iframe className="h-[80vh] w-full rounded border" src={src} title={`${kind}-preview`} />
}

