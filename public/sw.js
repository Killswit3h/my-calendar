/* global self, clients */
self.addEventListener('push', event => {
  let payload = {}
  try {
    payload = event.data ? event.data.json() : {}
  } catch {
    // ignore malformed payloads and fall back to defaults
  }

  const normalized = payload.notification ? payload.notification : payload
  const {
    title = 'Reminder',
    body = '',
    url = '/',
    actions = [],
    data = {},
    icon = '/icon-192.png',
    badge = '/badge-72.png',
    requireInteraction = true,
  } = normalized

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      data: { ...data, url },
      actions,
      icon,
      badge,
      requireInteraction,
    }),
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  const data = event.notification.data || {}
  const url = data.url || '/'

  if (event.action && event.action.startsWith('snooze_')) {
    const minutes = Number(event.action.replace('snooze_', ''))
    if (!Number.isNaN(minutes)) {
      fetch('/api/reminders/snooze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reminderId: data.reminderId, minutes }),
      }).catch(() => {})
    }
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (new URL(client.url, self.location.origin).pathname === new URL(url, self.location.origin).pathname && 'focus' in client) {
          return client.focus()
        }
      }
      if (clients.openWindow) return clients.openWindow(url)
      return undefined
    }),
  )
})
