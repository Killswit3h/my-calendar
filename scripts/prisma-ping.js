// Quick connectivity check: runs SELECT 1 using Prisma
const fs = require('fs')
try {
  const envTxt = fs.readFileSync('.env', 'utf8')
  for (const line of envTxt.split(/\r?\n/)) {
    const m = line.match(/^DATABASE_URL=(.*)$/)
    if (m) {
      let v = m[1].trim()
      if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1)
      process.env.DATABASE_URL = v
      break
    }
  }
} catch {}

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const rows = await prisma.$queryRaw`SELECT 1 as one`
  console.log('DB OK:', rows)
}

main().catch((e) => { console.error('DB ERROR', e?.message || e); process.exit(1) }).finally(async () => { await prisma.$disconnect() })

