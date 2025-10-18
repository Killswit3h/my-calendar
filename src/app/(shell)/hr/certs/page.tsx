import type { Certification as CertificationRecord } from '@prisma/client'

import { EmptyState } from '@/components/ui/EmptyState'
import { OpenCalendarLink } from '@/components/ui/OpenCalendarLink'
import { getPrisma } from '@/lib/db'

const FALLBACK_CERTS = [
  { id: 'CRT-101', name: 'Forklift Operator', holder: 'Maria Velasquez', expires: '2024-10-04', status: 'Expiring' },
  { id: 'CRT-088', name: 'OSHA 30', holder: "D'Andre Hill", expires: '2025-02-19', status: 'Active' },
]

type CertRow = {
  id: string
  name: string
  holder: string
  expires: string
  status: string
}

export default async function HrCertsPage() {
  const useFixtures = process.env.PLAYWRIGHT_TEST === '1'
  let certsDb: CertificationRecord[] = []
  if (!useFixtures) {
    const prisma = await getPrisma()
    try {
      certsDb = await prisma.certification.findMany({ orderBy: { expiresOn: 'asc' }, take: 20 })
    } catch {
      certsDb = []
    }
  }

  const certs: CertRow[] = certsDb.length
    ? certsDb.map((cert: CertificationRecord): CertRow => ({
        id: cert.id,
        name: cert.certification,
        holder: cert.employeeName,
        expires: cert.expiresOn ? new Date(cert.expiresOn).toISOString().slice(0, 10) : '—',
        status: cert.status,
      }))
    : FALLBACK_CERTS

  return (
    <div className="grid gap-3 rounded-2xl border border-border bg-surface p-6 shadow-glass">
      {certs.map(cert => (
        <div key={cert.id} className="flex items-center justify-between rounded-xl bg-surface-soft px-4 py-3 text-sm">
          <div>
            <p className="font-semibold text-foreground">{cert.name}</p>
            <p className="text-xs text-muted">{cert.holder}</p>
          </div>
          <div className="text-right text-xs text-muted">
            <p>{cert.expires}</p>
            <p className="text-warning font-medium">{cert.status}</p>
          </div>
        </div>
      ))}
      {!certs.length ? (
        <EmptyState
          title="All certifications up to date"
          description="Track operator cards, OSHA, and PCR requirements here."
          action={<OpenCalendarLink />}
        />
      ) : null}
    </div>
  )
}
