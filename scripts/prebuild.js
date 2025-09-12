#!/usr/bin/env node
const { execSync } = require('child_process')

const isCloudflare = !!(process.env.NEXT_ON_PAGES || process.env.CF_PAGES)
const target = isCloudflare ? 'edge' : 'nodejs'

// Flip runtime and Prisma client shim
execSync(`node scripts/set-runtime.js ${target}`, { stdio: 'inherit' })

// On Cloudflare builds, ensure the engine-free Prisma client is used
if (isCloudflare) {
  try {
    execSync('npx prisma migrate deploy', { stdio: 'inherit' })
  } catch (e) {
    console.log('[prebuild] migrate deploy skipped or failed, continuing')
  }
}

console.log(`[prebuild] Target runtime: ${target}`)

