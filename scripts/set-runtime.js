#!/usr/bin/env node
// Replace `export const runtime = '...'` across app routes.
// Usage: node scripts/set-runtime.js edge|nodejs

const fs = require('fs')
const path = require('path')

const target = process.argv[2]
if (!target || !['edge','nodejs'].includes(target)) {
  console.error('Usage: node scripts/set-runtime.js edge|nodejs')
  process.exit(1)
}

const roots = [path.join(process.cwd(), 'src', 'app'), path.join(process.cwd(), 'my-calendar-main', 'src', 'app')]

function walk(dir) {
  if (!fs.existsSync(dir)) return []
  const out = []
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name)
    if (ent.isDirectory()) out.push(...walk(p))
    else if (/\.(t|j)sx?$/.test(ent.name)) out.push(p)
  }
  return out
}

const files = roots.flatMap(walk)
let changed = 0
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8')
  if (/export\s+const\s+runtime\s*=\s*['"][a-z]+['"]/.test(src)) {
    const next = src.replace(/export\s+const\s+runtime\s*=\s*['"][a-z]+['"]/, `export const runtime = '${target}'`)
    if (next !== src) {
      fs.writeFileSync(f, next)
      changed++
    }
  }
}
console.log(`[set-runtime] Updated ${changed} files to runtime='${target}'`)

// Also swap prisma shim(s) to correct variant (root and my-calendar-main)
for (const shimDir of [path.join(process.cwd(), 'src', 'lib'), path.join(process.cwd(), 'my-calendar-main', 'src', 'lib')]) {
  const prismaShim = path.join(shimDir, 'prisma.ts')
  if (fs.existsSync(prismaShim)) {
    const edgeExport = `export { prisma } from './prisma.edge'\n`
    const nodeExport = `export { prisma } from './prisma.node'\n`
    const cur = fs.readFileSync(prismaShim, 'utf8')
    let next = cur
    if (target === 'edge') next = edgeExport
    else next = nodeExport
    if (next !== cur) {
      fs.writeFileSync(prismaShim, next)
      console.log(`[set-runtime] ${path.relative(process.cwd(), prismaShim)} -> ${target}`)
    }
  }
}
