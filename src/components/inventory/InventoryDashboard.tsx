'use client'

import { useState } from 'react'

import InventoryItemsTab from './InventoryItemsTab'
import InventoryLocationsTab from './InventoryLocationsTab'

type TabKey = 'items' | 'locations' | 'reservations' | 'checkouts' | 'reports'

type Tab = {
  key: TabKey
  label: string
}

const TABS: Tab[] = [
  { key: 'items', label: 'Items' },
  { key: 'locations', label: 'Locations' },
  { key: 'reservations', label: 'Reservations' },
  { key: 'checkouts', label: 'Checkouts' },
  { key: 'reports', label: 'Reports' },
]

export default function InventoryDashboard() {
  const [activeTab, setActiveTab] = useState<TabKey>('items')

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <h1 style={{ margin: 0 }}>Inventory</h1>
        <p style={{ margin: 0, color: 'var(--muted)', maxWidth: '640px' }}>
          Manage tools, consumables, and equipment. Use the tabs below to view items, adjust stock, and track
          reservations and checkouts.
        </p>
      </header>

      <nav style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {TABS.map(tab => {
          const isActive = tab.key === activeTab
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={isActive ? 'tab-btn active' : 'tab-btn'}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: '1px solid',
                borderColor: isActive ? 'var(--border-strong)' : 'var(--border)',
                backgroundColor: isActive ? 'var(--surface-strong)' : 'var(--surface)',
                cursor: 'pointer',
                fontWeight: isActive ? 600 : 500,
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </nav>

      <section>
        {activeTab === 'items' ? <InventoryItemsTab /> : null}
        {activeTab === 'locations' ? <InventoryLocationsTab /> : null}
        {activeTab === 'reservations' ? (
          <Placeholder label="Reservations" hint="Reservation list and availability tools are not built yet." />
        ) : null}
        {activeTab === 'checkouts' ? (
          <Placeholder label="Checkouts" hint="Checkout tracking UI is under construction." />
        ) : null}
        {activeTab === 'reports' ? (
          <Placeholder label="Reports" hint="Inventory reports and dashboards will appear here." />
        ) : null}
      </section>
    </div>
  )
}

type PlaceholderProps = {
  label: string
  hint: string
}

function Placeholder({ label, hint }: PlaceholderProps) {
  return (
    <div
      style={{
        padding: '48px',
        border: '1px dashed var(--border)',
        borderRadius: '8px',
        background: 'var(--surface)',
        color: 'var(--muted)',
        textAlign: 'center',
      }}
    >
      <strong style={{ display: 'block', marginBottom: '8px', color: 'var(--text)' }}>{label}</strong>
      <span>{hint}</span>
    </div>
  )
}
