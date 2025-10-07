import { Prisma, PrismaClient } from '@prisma/client'

function redactDatabaseUrl(raw: string): string {
  try {
    const url = new URL(raw)
    if (url.username) url.username = '***'
    if (url.password) url.password = '***'
    return url.toString()
  } catch (err) {
    return raw.replace(/(:)([^:@]+)(@)/, '$1***$3')
  }
}

async function main() {
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
    console.error('DATABASE_URL is not set')
    process.exitCode = 1
    return
  }

  const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } })

  try {
    const serverInfo = await prisma.$queryRaw<Array<{ name: string | null; address: string | null }>>(Prisma.sql`
      SELECT current_database() AS name, inet_server_addr()::text AS address
    `)

    const migrations = await prisma.$queryRaw<Array<{ id: string; finished_at: Date | null }>>(Prisma.sql`
      SELECT id, finished_at
      FROM "_prisma_migrations"
      ORDER BY finished_at DESC NULLS LAST, id DESC
      LIMIT 5
    `)

    console.log('DATABASE_URL:', redactDatabaseUrl(dbUrl))
    const { name, address } = serverInfo[0] ?? { name: null, address: null }
    console.log('current_database():', name ?? 'unknown')
    console.log('inet_server_addr():', address ?? 'unknown')
    console.log('last 5 _prisma_migrations:')
    for (const row of migrations) {
      const finished = row.finished_at ? row.finished_at.toISOString() : 'pending'
      console.log(`- ${row.id} (${finished})`)
    }
  } catch (error) {
    console.error('Failed to inspect database:', (error as Error)?.message ?? error)
    process.exitCode = 1
  } finally {
    await prisma.$disconnect()
  }
}

void main()
