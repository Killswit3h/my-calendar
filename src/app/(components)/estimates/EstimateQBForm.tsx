'use client'

import { useMemo } from 'react'
import { FormProvider, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'

import { EstimateFormZ, type EstimateFormT } from '@/lib/zod-estimates'
import { api } from '@/lib/http'

import CustomerPicker from './CustomerPicker'
import QBGrid from './QBGrid'
import PdfPreview from './PdfPreview'

const STANDARD_TERMS = [
  'This quotation and its conditions shall form part of any subcontract and shall prevail over conflicting terms.',
  'Price is independent of attenuator concrete padding.',
  'Attenuator price includes certified install only, unless mentioned otherwise.',
  'Price does not include bonds. surety bond rate 2.5% will be added if required subject to change upon length of project.',
  'Above prices are based on current quantities; prices are subject to change upon modification of any quantity of work or layout.',
  'Guaranteed fence reserves the right to withdraw bid if contract is not issued within 30 days of bid date.',
  'The following work to be performed by others: miscellaneous asphalt work around posts, all concrete work, excavation, grading, MOT, grounding and clearing/grubbing.',
  'Guaranteed fence reserves all salvage rights of all used steel & aluminum material removed on this project. All material to be removed will become property of Guaranteed Fence.',
  'Price does not including permit and process fees.',
  'This estimate covers insurance of $1 Million GL, $1 Million WC, and $1 Million Auto, and $2 Million Umbrella Policy.',
  'Any additional requirements are to be added in the estimate.',
  'Price does not include Engineer Calculations and Shop Drawings.',
  'Soft Digs are to be performed at an additional cost.',
].map(line => `* ${line}`).join('\n')

const toUSD = (cents: number) => (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })

type Props = {
  initial?: Partial<EstimateFormT>
  estimateId?: string
  estimateNumber?: string
}

export default function EstimateQBForm({ initial, estimateId, estimateNumber }: Props) {
  const router = useRouter()
  const defaultValues = useMemo<EstimateFormT>(
    () => ({
      date: initial?.date ?? new Date().toISOString().slice(0, 10),
      customerId: initial?.customerId ?? '',
      projectId: initial?.projectId ?? null,
      attention: initial?.attention ?? '',
      shortDesc: initial?.shortDesc ?? '',
      terms: initial?.terms ?? STANDARD_TERMS,
      notes: initial?.notes ?? '',
      discountCents: initial?.discountCents ?? 0,
      taxCents: initial?.taxCents ?? 0,
      lineItems:
        initial?.lineItems ??
        [
          {
            sort: 1,
            description: '',
            qty: '1',
            uom: 'EA',
            rateCents: 0,
            taxable: false,
            note: '',
          },
        ],
    }),
    [initial],
  )

  const methods = useForm<EstimateFormT>({
    resolver: zodResolver(EstimateFormZ),
    defaultValues,
    mode: 'onChange',
  })

  const lineItems = useWatch({ control: methods.control, name: 'lineItems' }) ?? []
  const discountCents = Number(useWatch({ control: methods.control, name: 'discountCents' }) || 0)
  const taxCents = Number(useWatch({ control: methods.control, name: 'taxCents' }) || 0)
  const customerIdValue = useWatch({ control: methods.control, name: 'customerId' })
  const subtotal = lineItems.reduce((acc: number, line: any) => acc + Math.round(Number(line?.qty || 0) * Number(line?.rateCents || 0)), 0)
  const total = subtotal - discountCents + taxCents

  const onSubmit = async (data: EstimateFormT) => {
    if (!estimateId) {
      const created = await api<{ id: string; number: string }>('/api/estimates', {
        method: 'POST',
        body: JSON.stringify(data),
      })
      router.push(`/estimates/${created.id}/edit`)
      return
    }

    await api(`/api/estimates/${estimateId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
    router.refresh()
  }

  const handleDelete = async () => {
    if (!estimateId) return
    await api(`/api/estimates/${estimateId}`, { method: 'DELETE' })
    router.push('/estimates')
  }

  const convertToCO = async () => {
    if (!estimateId) return
    const est = await api<any>(`/api/estimates/${estimateId}`, { method: 'GET' })
    const payload = {
      date: new Date().toISOString().slice(0, 10),
      projectId: est.projectId,
      baseEstimateId: estimateId,
      reason: `Converted from ${est.number}`,
      terms: est.terms,
      notes: est.notes,
      discountCents: 0,
      taxCents: 0,
      lineItems: est.lineItems.map((line: any, index: number) => ({
        sort: index + 1,
        description: line.description,
        qty: String(line.qty),
        uom: line.uom,
        rateCents: line.rateCents,
        taxable: line.taxable ?? false,
        note: line.note ?? '',
      })),
    }
    const created = await api<{ id: string; number: string }>('/api/change-orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    window.open(`/change-orders/${created.id}/edit`, '_blank', 'noopener noreferrer')
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6 p-6">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
          <h1 className="text-3xl font-semibold">Estimate</h1>
          <div className="flex gap-4 text-sm text-zinc-500">
            <div>
              <div className="text-xs uppercase">Estimate #</div>
              <div className="text-base font-medium text-zinc-900 dark:text-zinc-50">
                {estimateNumber || 'Pending'}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <div className="rounded border bg-white p-4 shadow-sm dark:bg-zinc-950">
            <div className="text-xs uppercase text-zinc-500">Customer:Job</div>
            <CustomerPicker
              value={customerIdValue}
              onChange={id => methods.setValue('customerId', id, { shouldDirty: true })}
            />
          </div>
          <div className="rounded border bg-white p-4 shadow-sm dark:bg-zinc-950">
            <div className="text-xs uppercase text-zinc-500">Template</div>
            <select className="mt-1 w-full rounded border px-2 py-1">
              <option>Custom Estimate</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded border bg-white p-3 shadow-sm dark:bg-zinc-950">
            <div className="text-xs uppercase text-zinc-500">Date</div>
            <input
              type="date"
              className="mt-1 w-full rounded border px-2 py-1"
              {...methods.register('date')}
            />
            <div className="mt-3 text-xs uppercase text-zinc-500">Project (optional)</div>
            <input
              className="mt-1 w-full rounded border px-2 py-1"
              placeholder="Project ID"
              {...methods.register('projectId')}
            />
            <div className="mt-3 text-xs uppercase text-zinc-500">Attention</div>
            <input className="mt-1 w-full rounded border px-2 py-1" {...methods.register('attention')} />
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <div className="text-xs uppercase text-zinc-500">Describe the Work</div>
            <input
              className="mt-1 w-full rounded border px-2 py-1"
              placeholder="Scope summary"
              {...methods.register('shortDesc')}
            />
          </div>
          <div>
            <div className="text-xs uppercase text-zinc-500">Notes</div>
            <textarea
              className="mt-1 min-h-[60px] w-full rounded border px-2 py-1"
              {...methods.register('notes')}
            />
          </div>
        </div>

        <QBGrid />

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              className="rounded bg-emerald-600 px-3 py-2 text-sm font-medium text-white"
            >
              {estimateId ? 'Save' : 'Create'}
            </button>
            {estimateId ? (
              <>
                <a
                  href={`/api/estimates/${estimateId}/pdf`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded bg-indigo-600 px-3 py-2 text-sm font-medium text-white"
                >
                  PDF
                </a>
                <button
                  type="button"
                  onClick={convertToCO}
                  className="rounded bg-sky-600 px-3 py-2 text-sm font-medium text-white"
                >
                  Convert to CO
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="rounded bg-red-600 px-3 py-2 text-sm font-medium text-white"
                >
                  Delete
                </button>
              </>
            ) : null}
          </div>
          <div className="lg:min-w-[360px]">
            <div className="rounded border bg-white p-4 shadow-sm dark:bg-zinc-950">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{toUSD(subtotal)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span>Discount (¢)</span>
                <input
                  type="number"
                  className="w-32 rounded border px-2 py-1 text-right"
                  {...methods.register('discountCents', { valueAsNumber: true })}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span>Tax (¢)</span>
                <input
                  type="number"
                  className="w-32 rounded border px-2 py-1 text-right"
                  {...methods.register('taxCents', { valueAsNumber: true })}
                />
              </div>
              <div className="mt-3 flex justify-between text-base font-semibold">
                <span>Total</span>
                <span>{toUSD(total)}</span>
              </div>
            </div>
          </div>
        </div>

        <PdfPreview id={estimateId} kind="estimate" />
      </form>
    </FormProvider>
  )
}
