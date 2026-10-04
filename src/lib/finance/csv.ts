/**
 * Minimal RFC 4180 CSV reader/writer (quotes, escaped quotes, newlines in
 * fields, comma or semicolon delimiters as used by European banks).
 */
export function parseCsv(text: string): string[][] {
  const input = text.replace(/^﻿/, '')
  const firstLine = input.split(/\r?\n/, 1)[0] ?? ''
  const delimiter =
    (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ';' : ','
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < input.length; i++) {
    const c = input[i]!
    if (inQuotes) {
      if (c === '"') {
        if (input[i + 1] === '"') {
          field += '"'
          i++
        } else inQuotes = false
      } else field += c
    } else if (c === '"') inQuotes = true
    else if (c === delimiter) {
      row.push(field)
      field = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && input[i + 1] === '\n') i++
      row.push(field)
      if (row.some((f) => f.trim() !== '')) rows.push(row)
      row = []
      field = ''
    } else field += c
  }
  row.push(field)
  if (row.some((f) => f.trim() !== '')) rows.push(row)
  return rows
}

export function toCsv(rows: (string | number | null | undefined)[][]) {
  return rows
    .map((r) =>
      r
        .map((v) => {
          const s = v === null || v === undefined ? '' : String(v)
          // Neutralise spreadsheet formula injection.
          const safe = /^[=+\-@\t\r]/.test(s) && !/^-?\d/.test(s) ? `'${s}` : s
          return /[",\n\r;]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
        })
        .join(','),
    )
    .join('\r\n')
}

const DATE_FORMATS: [RegExp, (m: RegExpMatchArray) => string][] = [
  [/^(\d{4})-(\d{2})-(\d{2})/, (m) => `${m[1]}-${m[2]}-${m[3]}`],
  [/^(\d{2})[./-](\d{2})[./-](\d{4})$/, (m) => `${m[3]}-${m[2]}-${m[1]}`],
]

export function normalizeCsvDate(value: string) {
  const v = value.trim()
  for (const [re, fn] of DATE_FORMATS) {
    const m = v.match(re)
    if (m) return fn(m)
  }
  return null
}

const HEADER_ALIASES: Record<string, string[]> = {
  date: ['date', 'data', 'transaction date', 'booking date', 'data operacji', 'data transakcji'],
  amount: ['amount', 'kwota', 'value', 'kwota transakcji'],
  type: ['type', 'typ'],
  category: ['category', 'kategoria'],
  merchant: ['merchant', 'payee', 'odbiorca', 'kontrahent', 'counterparty', 'name'],
  description: ['description', 'opis', 'title', 'tytuł', 'tytul', 'memo', 'notes'],
}

/** Maps a header row to known columns (case/language tolerant). */
export function detectColumns(header: string[]) {
  const out: Partial<Record<keyof typeof HEADER_ALIASES, number>> = {}
  header.forEach((h, i) => {
    const key = h.trim().toLowerCase()
    for (const [col, aliases] of Object.entries(HEADER_ALIASES)) {
      if (aliases.includes(key) && out[col as keyof typeof HEADER_ALIASES] === undefined)
        out[col as keyof typeof HEADER_ALIASES] = i
    }
  })
  return out
}

export type CsvTransactionRow = {
  occurred_on: string
  amount: string
  txn_type?: 'expense' | 'income'
  category?: string
  merchant?: string
  description?: string
}

/**
 * Turns CSV text into transaction rows. Negative amounts are expenses, positive
 * are income, unless a type column says otherwise. Invalid lines are reported.
 */
export function csvToTransactions(text: string) {
  const rows = parseCsv(text)
  const header = rows[0] ?? []
  const cols = detectColumns(header)
  const errors: { line: number; message: string }[] = []
  const out: CsvTransactionRow[] = []
  if (cols.date === undefined || cols.amount === undefined) {
    return {
      rows: out,
      errors: [{ line: 1, message: 'The file needs at least "date" and "amount" columns.' }],
    }
  }
  rows.slice(1).forEach((r, index) => {
    const line = index + 2
    const date = normalizeCsvDate(r[cols.date!] ?? '')
    const rawAmount = (r[cols.amount!] ?? '').trim()
    if (!date) return errors.push({ line, message: 'Invalid date' })
    if (!rawAmount || !/^[-+]?[\d\s.,']+$/.test(rawAmount))
      return errors.push({ line, message: 'Invalid amount' })
    const negative = rawAmount.startsWith('-')
    const typeCell = cols.type !== undefined ? (r[cols.type] ?? '').trim().toLowerCase() : ''
    const txn_type: 'expense' | 'income' =
      typeCell.startsWith('inc') || typeCell.startsWith('przych')
        ? 'income'
        : typeCell.startsWith('exp') || typeCell.startsWith('wyd')
          ? 'expense'
          : negative
            ? 'expense'
            : 'income'
    out.push({
      occurred_on: date,
      amount: rawAmount.replace(/^[-+]/, ''),
      txn_type,
      category: cols.category !== undefined ? r[cols.category]?.trim() || undefined : undefined,
      merchant:
        cols.merchant !== undefined
          ? r[cols.merchant]?.trim().slice(0, 120) || undefined
          : undefined,
      description:
        cols.description !== undefined
          ? r[cols.description]?.trim().slice(0, 500) || undefined
          : undefined,
    })
  })
  return { rows: out, errors }
}
