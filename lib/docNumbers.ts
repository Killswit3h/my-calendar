import prisma from '@/lib/db'

const pad4 = (value: number) => value.toString().padStart(4, '0')

export async function nextEstimateNumber(year = new Date().getFullYear()) {
  return nextNumber('EST', year)
}

export async function nextChangeOrderNumber(year = new Date().getFullYear()) {
  return nextNumber('CO', year)
}

async function nextNumber(prefix: 'EST' | 'CO', year: number) {
  const key = `${prefix}-${year}`
  const value = await prisma.$transaction(async tx => {
    const counter = await tx.docCounter.upsert({
      where: { key },
      update: { value: { increment: 1 } },
      create: { key, value: 1 },
    })
    return counter.value
  })
  return `${prefix}-${year}-${pad4(value)}`
}
