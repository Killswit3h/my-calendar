// src/lib/webpush.ts
import webpush from 'web-push'

let configured = false

function ensureConfigured() {
  if (configured) return
  const publicKey = process.env.WEB_PUSH_PUBLIC_KEY
  const privateKey = process.env.WEB_PUSH_PRIVATE_KEY
  const contact = process.env.WEB_PUSH_CONTACT
  if (!publicKey || !privateKey || !contact) {
    throw new Error('Missing VAPID environment variables. Please set WEB_PUSH_PUBLIC_KEY, WEB_PUSH_PRIVATE_KEY, and WEB_PUSH_CONTACT.')
  }
  webpush.setVapidDetails(contact, publicKey, privateKey)
  configured = true
}

export function getWebpush() {
  ensureConfigured()
  return webpush
}

export function tryGetWebpush() {
  try {
    return getWebpush()
  } catch {
    return null
  }
}
