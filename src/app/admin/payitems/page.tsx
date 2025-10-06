'use client'

import PayItemsManager from '@/components/PayItemsManager'

export default function PayItemsPage() {
  return (
    <div style={{ padding: '2rem', maxWidth: '960px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>Pay Items</h1>
      <PayItemsManager />
    </div>
  )
}
