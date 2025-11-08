/* global self, clients */
self.addEventListener('push', event => {
  let payload = {}
  try {
    payload = event.data ? event.data.json() : {}
  } catch {
    // ignore malformed payloads
  }

  const { title = 'Reminder', body = '', url = '/', actions = [], data = {} } = payload

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      data: { ...data, url },
      requireInteraction: true,
      actions,
    }),
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  const data = event.notification.data || {}
  const url = data.url || '/'

  if (event.action === 'snooze_10') {
    fetch('/api/reminders/snooze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reminderId: data.reminderId, minutes: 10 }),
    }).catch(() => {})
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (new URL(client.url).pathname === new URL(url, self.location.origin).pathname && 'focus' in client) {
          return client.focus()
        }
      }
      if (clients.openWindow) return clients.openWindow(url)
      return undefined
    }),
  )
})
