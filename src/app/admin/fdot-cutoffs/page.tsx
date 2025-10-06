'use client'

import dynamic from 'next/dynamic'

const FdotCutoffManager = dynamic(() => import('@/components/admin/FdotCutoffManager'), { ssr: false })

export default function FdotCutoffsPage() {
  return (
    <div style={{ padding: '2rem 1.5rem' }}>
      <FdotCutoffManager />
    </div>
  )
}
