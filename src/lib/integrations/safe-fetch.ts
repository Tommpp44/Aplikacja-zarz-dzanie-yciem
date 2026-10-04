import 'server-only'
import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'

const MAX_BYTES = 5 * 1024 * 1024
const TIMEOUT_MS = 10_000

/** True for loopback, private, link-local, CGNAT, multicast and metadata ranges. */
export function isPrivateAddress(ip: string) {
  if (isIP(ip) === 4) {
    const [a, b] = ip.split('.').map(Number) as [number, number]
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 198 && (b === 18 || b === 19)) ||
      a >= 224
    )
  }
  const v6 = ip.toLowerCase()
  if (v6.startsWith('::ffff:')) return isPrivateAddress(v6.slice(7))
  return (
    v6 === '::' ||
    v6 === '::1' ||
    v6.startsWith('fc') ||
    v6.startsWith('fd') ||
    v6.startsWith('fe8') ||
    v6.startsWith('fe9') ||
    v6.startsWith('fea') ||
    v6.startsWith('feb') ||
    v6.startsWith('ff')
  )
}

export class FetchBlockedError extends Error {}

/** Normalises user input like "webcal://…" to an https URL or throws. */
export function normalizeFeedUrl(input: string) {
  const url = new URL(input.trim().replace(/^webcals?:\/\//i, 'https://'))
  if (url.protocol !== 'https:') throw new FetchBlockedError('Only https links are supported')
  if (url.username || url.password)
    throw new FetchBlockedError('Links with credentials are not allowed')
  return url
}

/**
 * Fetches a user-supplied URL safely (SSRF protection): https only, public
 * addresses only (checked on every redirect), time and size limits.
 */
export async function safeFetchText(input: string, redirects = 3): Promise<string> {
  const url = normalizeFeedUrl(input)
  const addresses = await lookup(url.hostname, { all: true })
  if (!addresses.length || addresses.some((a) => isPrivateAddress(a.address)))
    throw new FetchBlockedError('This address is not allowed')
  const res = await fetch(url, {
    redirect: 'manual',
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { 'user-agent': 'LifeOS calendar sync', accept: 'text/calendar, text/plain, */*' },
  })
  if (res.status >= 300 && res.status < 400) {
    const location = res.headers.get('location')
    if (!location || redirects <= 0) throw new FetchBlockedError('Too many redirects')
    return safeFetchText(new URL(location, url).toString(), redirects - 1)
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const reader = res.body?.getReader()
  if (!reader) return ''
  const chunks: Uint8Array[] = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > MAX_BYTES) {
      await reader.cancel()
      throw new FetchBlockedError('The calendar is too large')
    }
    chunks.push(value)
  }
  return new TextDecoder().decode(Buffer.concat(chunks))
}
