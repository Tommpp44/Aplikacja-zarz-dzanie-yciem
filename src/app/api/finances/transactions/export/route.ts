import { NextResponse, type NextRequest } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { toCsv } from '@/lib/finance/csv'
import { listCategories, listTransactions } from '@/lib/finance/repository'
import { transactionFiltersSchema } from '@/lib/finance/schemas'
import { logger } from '@/lib/logger'
import { minorToInput } from '@/lib/money'

/** GET /api/finances/transactions/export — CSV export of (filtered) transactions. */
export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const parsed = transactionFiltersSchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams),
  )
  if (!parsed.success) return NextResponse.json({ error: 'Invalid filters' }, { status: 400 })
  try {
    const { supabase, user } = session
    const [accounts, categories] = await Promise.all([
      supabase.from('accounts').select('id, name').eq('user_id', user.id),
      listCategories(supabase, user.id, true),
    ])
    const accountNames = new Map((accounts.data ?? []).map((a) => [a.id, a.name]))
    const categoryNames = new Map(categories.map((c) => [c.id, c.name]))
    const rows: (string | number | null)[][] = [
      [
        'date',
        'type',
        'amount',
        'currency',
        'account',
        'to_account',
        'category',
        'merchant',
        'description',
        'tags',
        'source',
      ],
    ]
    for (let page = 0; page < 100; page++) {
      const { rows: txns } = await listTransactions(supabase, user.id, parsed.data, page, 1000)
      for (const t of txns) {
        rows.push([
          t.occurred_on,
          t.txn_type,
          minorToInput(t.txn_type === 'expense' ? -t.amount_minor : t.amount_minor, t.currency),
          t.currency,
          accountNames.get(t.account_id) ?? '',
          t.transfer_account_id ? (accountNames.get(t.transfer_account_id) ?? '') : '',
          t.category_id ? (categoryNames.get(t.category_id) ?? '') : '',
          t.merchant,
          t.description,
          t.tags.join('|'),
          t.source,
        ])
      }
      if (txns.length < 1000) break
    }
    return new NextResponse(`﻿${toCsv(rows)}`, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="lifeos-transactions.csv"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    logger.error(
      'transaction export failed',
      { route: 'transactions/export', userId: session.user.id },
      error,
    )
    return NextResponse.json(
      { error: "We couldn't export your transactions. Please try again." },
      { status: 500 },
    )
  }
}
