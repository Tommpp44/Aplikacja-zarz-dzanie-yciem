/* LifeOS service worker: offline shell + recently visited pages.
 * - Static assets (/_next/static, icons): cache-first (they are content-hashed).
 * - Page navigations: network-first, falling back to the last cached copy of that
 *   page and finally to /offline. Lets you read recent data without a connection.
 * - Never caches API routes, server actions (POST) or auth endpoints.
 */
const VERSION = 'lifeos-v2'
const STATIC_CACHE = `${VERSION}-static`
const PAGE_CACHE = `${VERSION}-pages`
const OFFLINE_URL = '/offline'
const MAX_PAGES = 40

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll([OFFLINE_URL, '/icons/icon-192.png', '/icons/icon-512.png']))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  )
})

async function trimCache(name, max) {
  const cache = await caches.open(name)
  const keys = await cache.keys()
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i])
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/auth/') ||
    url.searchParams.has('_rsc') ||
    request.headers.get('RSC')
  )
    return

  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            const copy = res.clone()
            if (res.ok) caches.open(STATIC_CACHE).then((c) => c.put(request, copy))
            return res
          }),
      ),
    )
    return
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok && !res.redirected) {
            const copy = res.clone()
            caches
              .open(PAGE_CACHE)
              .then((c) => c.put(request, copy).then(() => trimCache(PAGE_CACHE, MAX_PAGES)))
          }
          return res
        })
        .catch(async () => (await caches.match(request)) || (await caches.match(OFFLINE_URL))),
    )
  }
})

// Clear cached pages on sign-out so another person on the device cannot read them.
self.addEventListener('message', (event) => {
  if (event.data === 'clear-user-cache') event.waitUntil(caches.delete(PAGE_CACHE))
})

// Web Push: show reminders even when LifeOS is closed.
self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { title: event.data ? event.data.text() : 'LifeOS' }
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'LifeOS', {
      body: data.body,
      tag: data.tag,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: { url: typeof data.url === 'string' && data.url.startsWith('/') ? data.url : '/dashboard' },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || '/dashboard'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      for (const w of windows) {
        if ('focus' in w) {
          w.navigate(url)
          return w.focus()
        }
      }
      return self.clients.openWindow(url)
    }),
  )
})
