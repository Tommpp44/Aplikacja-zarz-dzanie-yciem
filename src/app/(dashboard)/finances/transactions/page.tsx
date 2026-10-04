import { Download } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'
import { ImportDialog } from '@/components/finances/import-dialog'
import { AddTransactionButton } from '@/components/finances/transaction-dialog'
import { TransactionFilters } from '@/components/finances/transaction-filters'
import { TransactionList } from '@/components/finances/transaction-list'
import { Button } from '@/components/ui/button'
import { listAccountOptions } from '@/lib/finance/accounts-repository'
import { listCategories, listTransactions } from '@/lib/finance/repository'
import { transactionFiltersSchema } from '@/lib/finance/schemas'
import { getOnboardedUserContext } from '@/lib/settings/service'
import { getT, pageTitle } from '@/lib/i18n/server'

export const generateMetadata = pageTitle('Transactions')

const PAGE_SIZE = 50

export default async function TransactionsPage({
  searchParams,
}: PageProps<'/finances/transactions'>) {
  const t = await getT()
  const raw = await searchParams
  const params = Object.fromEntries(
    Object.entries(raw).filter(([, v]) => typeof v === 'string' && v),
  ) as Record<string, string>
  const filters = transactionFiltersSchema.catch({}).parse(params)
  const page = Math.max(0, Number(params.page) || 0)
  const { supabase, user, today, prefs } = await getOnboardedUserContext()
  const [accounts, categories, { rows, total }] = await Promise.all([
    listAccountOptions(supabase, user.id),
    listCategories(supabase, user.id),
    listTransactions(supabase, user.id, filters, page, PAGE_SIZE),
  ])
  const query = new URLSearchParams(
    Object.entries(filters).filter(([, v]) => v) as [string, string][],
  )
  const pageHref = (p: number) => {
    const q = new URLSearchParams(query)
    if (p > 0) q.set('page', String(p))
    return `/finances/transactions?${q.toString()}`
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted-foreground text-sm">{total} transactions</p>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <a href={`/api/finances/transactions/export?${query.toString()}`} download>
              <Download /> {t('Export CSV')}
            </a>
          </Button>
          <ImportDialog accounts={accounts} />
          <AddTransactionButton
            accounts={accounts}
            categories={categories}
            today={today}
            lastUsed={prefs.last_used}
          />
        </div>
      </div>
      <Suspense>
        <TransactionFilters accounts={accounts} categories={categories} />
      </Suspense>
      <TransactionList
        transactions={rows}
        accounts={accounts}
        categories={categories}
        today={today}
        perspectiveAccount={filters.account}
      />
      {total > PAGE_SIZE && (
        <nav aria-label={t('Pagination')} className="flex items-center justify-between">
          {page > 0 ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={pageHref(page - 1)}>{t('Newer')}</Link>
            </Button>
          ) : (
            <span />
          )}
          <span className="text-muted-foreground text-xs">
            {t('Page {page} of {pages}', { page: page + 1, pages: Math.ceil(total / PAGE_SIZE) })}
          </span>
          {(page + 1) * PAGE_SIZE < total ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={pageHref(page + 1)}>{t('Older')}</Link>
            </Button>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  )
}
