'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormProvider, useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'

import { api } from '@/lib/http'
import { EstimateFormZ, type EstimateFormT } from '@/lib/zod-estimates'

import LineItemTable from './LineItemTable'
import PdfPreview from './PdfPreview'
import TotalsCard from './TotalsCard'

const STANDARD_TERMS_LINES = [
  'This quotation and its conditions shall form part of any subcontract and shall prevail over conflicting terms.',
  'Price is independent of attenuator concrete padding.',
  'Attenuator price includes certified install only, unless mentioned otherwise.',
  'Price does not include bonds. Surety bond rate 2.5% will be added if required and is subject to change based on project duration.',
  'Above prices are based on current quantities; prices are subject to change if any quantity or layout changes.',
  'Guaranteed Fence reserves the right to withdraw bid if contract is not issued within 30 days of bid date.',
  'The following work is to be performed by others: miscellaneous asphalt work around posts, all concrete work, excavation, grading, MOT, grounding, and clearing/grubbing.',
  'Guaranteed Fence reserves all salvage rights of all used steel and aluminum material removed on this project.',
  'Price does not include permit and process fees.',
  'This estimate covers insurance of $1 Million GL, $1 Million WC, $1 Million Auto, and a $2 Million Umbrella Policy.',
  'Any additional insurance requirements are to be added in the estimate.',
  'Price does not include Engineer Calculations and Shop Drawings.',
  'Soft digs are to be performed at an additional cost.',
]

const DEFAULT_TERMS = STANDARD_TERMS_LINES.map(line => `* ${line}`).join('\n')
const EXTRA_WORK_OPTIONS = ['FENCE', 'GUARDRAIL', 'REPAIR', 'REMOVAL', 'SHOP DRAWINGS']

type CustomerOption = { id: string; name: string }

function useDebouncedValue<T>(value: T, delay = 250) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(id)
  }, [value, delay])
  return debounced
}

export default function EstimateForm({
  initial,
  estimateId,
}: {
  initial?: Partial<EstimateFormT>
  estimateId?: string
}) {
  const router = useRouter()

  const defaultValues = useMemo<EstimateFormT>(() => {
    return {
      date: initial?.date ?? new Date().toISOString().slice(0, 10),
      customerId: initial?.customerId ?? '',
      projectId: initial?.projectId ?? null,
      attention: initial?.attention ?? '',
      shortDesc: initial?.shortDesc ?? '',
      terms: initial?.terms ?? DEFAULT_TERMS,
      notes: initial?.notes ?? '',
      discountCents: initial?.discountCents ?? 0,
      taxCents: initial?.taxCents ?? 0,
      lineItems:
        initial?.lineItems ??
        [{ sort: 1, description: '', qty: '1', uom: 'EA', rateCents: 0, taxable: false }],
    }
  }, [initial])

  const methods = useForm<EstimateFormT>({
    resolver: zodResolver(EstimateFormZ),
    defaultValues,
    mode: 'onChange',
  })

  useEffect(() => {
    methods.reset(defaultValues)
  }, [defaultValues, methods])

  const { register, handleSubmit, setValue, watch } = methods

  const [customerQuery, setCustomerQuery] = useState('')
  const [customerOptions, setCustomerOptions] = useState<CustomerOption[]>([])
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false)
  const [customerFetchError, setCustomerFetchError] = useState<string | null>(null)
  const customerId = watch('customerId')
  const debouncedCustomerQuery = useDebouncedValue(customerQuery, 250)
  const customerNameCache = useRef(new Map<string, string>())

  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()
    const params = new URLSearchParams({ limit: '20' })
    if (debouncedCustomerQuery.trim()) params.set('search', debouncedCustomerQuery.trim())
    fetch(`/api/customers?${params.toString()}`, { cache: 'no-store', signal: controller.signal })
      .then(async res => {
        if (!res.ok) throw new Error('failed')
        const data: CustomerOption[] = await res.json()
        if (!cancelled) {
          setCustomerOptions(data)
          data.forEach(opt => customerNameCache.current.set(opt.id, opt.name))
        }
      })
      .catch(err => {
        if (cancelled || err.name === 'AbortError') return
        console.error(err)
        setCustomerFetchError('Unable to load customers')
      })
    return () => {
      cancelled = true
      controller.abort()
    }
  }, [debouncedCustomerQuery])

  useEffect(() => {
    if (!customerId) {
      setCustomerQuery('')
      return
    }
    const cached = customerNameCache.current.get(customerId)
    if (cached) {
      setCustomerQuery(cached)
      return
    }
    let cancelled = false
    fetch(`/api/customers/${customerId}`, { cache: 'no-store' })
      .then(async res => {
        if (!res.ok) throw new Error('not found')
        const data: CustomerOption = await res.json()
        if (cancelled) return
        customerNameCache.current.set(data.id, data.name)
        setCustomerQuery(data.name)
      })
      .catch(err => {
        console.error(err)
        if (!cancelled) setCustomerQuery('')
      })
    return () => {
      cancelled = true
    }
  }, [customerId])

  const [payItemHints, setPayItemHints] = useState<string[]>(EXTRA_WORK_OPTIONS)
  const shortDescValue = watch('shortDesc') ?? ''
  const debouncedShortDesc = useDebouncedValue(shortDescValue, 250)

  useEffect(() => {
    let cancelled = false
    const params = new URLSearchParams({ take: '50' })
    if (debouncedShortDesc.trim()) params.set('q', debouncedShortDesc.trim())
    fetch(`/api/payitems?${params.toString()}`, { cache: 'no-store' })
      .then(async res => {
        if (!res.ok) throw new Error('Failed to load pay items')
        const json = await res.json()
        const items = Array.isArray(json.items) ? json.items : []
        const suggestions = items.map((item: any) =>
          item?.description ? `${item.number} – ${item.description}` : item.number,
        )
        const unique = Array.from(new Set([...EXTRA_WORK_OPTIONS, ...suggestions]))
        if (!cancelled) setPayItemHints(unique)
      })
      .catch(err => {
        console.error(err)
      })
    return () => {
      cancelled = true
    }
  }, [debouncedShortDesc])

  useEffect(() => {
    if (initial?.customerId) return
    if (customerOptions.length === 1 && !customerId) {
      const only = customerOptions[0]
      customerNameCache.current.set(only.id, only.name)
      setCustomerQuery(only.name)
      setValue('customerId', only.id, { shouldDirty: true })
    }
  }, [customerOptions, customerId, initial?.customerId, setValue])

  const handleCustomerInputChange = (value: string) => {
    setCustomerQuery(value)
    setCustomerDropdownOpen(true)
    if (!value.trim()) {
      setValue('customerId', '', { shouldDirty: true })
    }
  }

  const handleCustomerSelect = (option: CustomerOption) => {
    customerNameCache.current.set(option.id, option.name)
    setCustomerQuery(option.name)
    setValue('customerId', option.id, { shouldDirty: true })
    setCustomerDropdownOpen(false)
  }

  const currentCustomerId = watch('customerId')

  useEffect(() => {
    if (initial?.customerId) return
    if (customerOptions.length === 1 && !currentCustomerId) {
      const only = customerOptions[0]
      customerNameCache.current.set(only.id, only.name)
      setCustomerQuery(only.name)
      setValue('customerId', only.id, { shouldDirty: true })
    }
  }, [customerOptions, currentCustomerId, initial?.customerId, setValue])

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

  const removeEstimate = async () => {
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
      })),
    }
    const created = await api<{ id: string; number: string }>('/api/change-orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    window.open(`/change-orders/${created.id}/edit`, '_blank', 'noopener,noreferrer')
  }

  return (
    <FormProvider {...methods}>
      <form className="grid grid-cols-1 gap-6 lg:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm">
              Date
              <input
                {...register('date')}
                className="mt-1 w-full rounded border px-2 py-1"
                type="date"
              />
            </label>
            <label className="text-sm">
              Customer
              <div className="relative mt-1">
                <input
                  className="w-full rounded border px-2 py-1"
                  placeholder="Type to search customers"
                  value={customerQuery}
                  onChange={e => handleCustomerInputChange(e.target.value)}
                  onFocus={() => setCustomerDropdownOpen(true)}
                  onBlur={() => setTimeout(() => setCustomerDropdownOpen(false), 150)}
                />
                <input type="hidden" {...register('customerId')} />
                {customerDropdownOpen && customerOptions.length > 0 ? (
                  <ul className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded border bg-white text-sm shadow">
                    {customerOptions.map(option => (
                      <li
                        key={option.id}
                        className="cursor-pointer px-2 py-1 hover:bg-zinc-100"
                        onMouseDown={e => {
                          e.preventDefault()
                          handleCustomerSelect(option)
                        }}
                      >
                        {option.name}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
              {customerFetchError ? (
                <span className="mt-1 block text-xs text-red-500">{customerFetchError}</span>
              ) : null}
            </label>
            <label className="col-span-2 text-sm">
              Project ID
              <input
                {...register('projectId')}
                className="mt-1 w-full rounded border px-2 py-1"
                placeholder="projectId (optional)"
              />
            </label>
            <label className="col-span-2 text-sm">
              Attention
              <input {...register('attention')} className="mt-1 w-full rounded border px-2 py-1" />
            </label>
            <label className="col-span-2 text-sm">
              Describe the Work
              <input
                {...register('shortDesc')}
                className="mt-1 w-full rounded border px-2 py-1"
                placeholder="Select or type a description"
                list="describe-work-options"
              />
              <datalist id="describe-work-options">
                {payItemHints.map(option => (
                  <option key={option} value={option} />
                ))}
              </datalist>
            </label>
            <input type="hidden" {...register('terms')} />
            <label className="col-span-2 text-sm">
              Notes
              <textarea
                {...register('notes')}
                className="mt-1 min-h-[60px] w-full rounded border px-2 py-1"
              />
            </label>
          </div>

          <LineItemTable />

          <div className="flex flex-wrap gap-2">
            <button
              className="rounded bg-emerald-600 px-3 py-2 text-sm text-white"
              type="submit"
            >
              {estimateId ? 'Save Changes' : 'Create Estimate'}
            </button>
            {estimateId ? (
              <>
                <button
                  className="rounded bg-indigo-600 px-3 py-2 text-sm text-white"
                  type="button"
                  onClick={convertToCO}
                >
                  Convert to CO
                </button>
                <button
                  className="rounded bg-red-600 px-3 py-2 text-sm text-white"
                  type="button"
                  onClick={removeEstimate}
                >
                  Delete
                </button>
              </>
            ) : null}
          </div>
        </div>

        <div className="space-y-4">
          <TotalsCard />
          <PdfPreview id={estimateId} kind="estimate" />
        </div>
      </form>
    </FormProvider>
  )
}
