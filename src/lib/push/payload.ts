/** Shape sent to the service worker for each new notification. */
export type PushPayload = { title: string; body?: string; url: string; tag: string }

export function toPushPayload(n: {
  title: string
  body?: string | null
  href?: string | null
  dedupe_key: string
}): PushPayload {
  const url = n.href && n.href.startsWith('/') && !n.href.startsWith('//') ? n.href : '/dashboard'
  return {
    title: n.title.slice(0, 120),
    body: n.body ? n.body.slice(0, 240) : undefined,
    url,
    tag: n.dedupe_key.slice(0, 100),
  }
}
