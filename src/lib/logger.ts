/**
 * Minimal structured logger that never prints secrets or financial payloads.
 * Only whitelisted, non-sensitive context keys are emitted.
 */
type Level = 'info' | 'warn' | 'error'

const SAFE_KEYS = new Set([
  'action',
  'module',
  'entity',
  'entityId',
  'userId',
  'code',
  'status',
  'hint',
  'route',
  'count',
  'durationMs',
])

const REDACT_PATTERN = /(password|token|secret|key|authorization|cookie|amount|balance|iban|card)/i

function sanitize(context: Record<string, unknown> | undefined) {
  if (!context) return undefined
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(context)) {
    if (!SAFE_KEYS.has(k) || REDACT_PATTERN.test(k)) continue
    out[k] = typeof v === 'string' ? v.slice(0, 200) : v
  }
  return out
}

function errorSummary(error: unknown) {
  if (error instanceof Error) return { name: error.name, message: error.message.slice(0, 300) }
  if (error && typeof error === 'object' && 'message' in error) {
    const e = error as { message?: unknown; code?: unknown }
    return { message: String(e.message).slice(0, 300), code: e.code }
  }
  return { message: String(error).slice(0, 300) }
}

function emit(level: Level, message: string, context?: Record<string, unknown>, error?: unknown) {
  if (process.env.NODE_ENV === 'test') return
  const entry = {
    level,
    message,
    ...sanitize(context),
    ...(error ? { error: errorSummary(error) } : {}),
    ts: new Date().toISOString(),
  }
  const line = JSON.stringify(entry)
  if (level === 'error') console.error(line)
  else if (level === 'warn') console.warn(line)
  else console.info(line)
}

export const logger = {
  info: (message: string, context?: Record<string, unknown>) => emit('info', message, context),
  warn: (message: string, context?: Record<string, unknown>, error?: unknown) =>
    emit('warn', message, context, error),
  error: (message: string, context?: Record<string, unknown>, error?: unknown) =>
    emit('error', message, context, error),
}
