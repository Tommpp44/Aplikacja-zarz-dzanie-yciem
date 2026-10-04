import { Landmark } from 'lucide-react'
import type { Metadata } from 'next'
import { AccountMenu, NewAccountButton } from '@/components/finances/account-dialogs'
import { Money } from '@/components/finances/money'
import { Badge } from '@/components/ui/badge'
import { ColorDot } from '@/components/ui/color-dot'
import { EmptyState } from '@/components/ui/empty-state'
import { Stat } from '@/components/ui/stat'
import { listAccounts } from '@/lib/finance/accounts-repository'
import { isLiability, netWorth } from '@/lib/finance/calculations'
import { ACCOUNT_TYPE_LABELS, type AccountType } from '@/lib/finance/schemas'
import { formatMoney } from '@/lib/money'
import { getOnboardedUserContext } from '@/lib/settings/service'

export const metadata: Metadata = { title: 'Accounts' }

export default async function AccountsPage({ searchParams }: PageProps<'/finances/accounts'>) {
  const params = await searchParams
  const { supabase, user, today, currency } = await getOnboardedUserContext()
  const accounts = await listAccounts(supabase, user.id, true)
  const counts = await Promise.all(
    accounts.map(async (a) => {
      const { count } = await supabase
        .from('transactions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .or(`account_id.eq.${a.id},transfer_account_id.eq.${a.id}`)
      return [a.id, count ?? 0] as const
    }),
  )
  const countMap = new Map(counts)
  const active = accounts.filter((a) => a.active)
  const archived = accounts.filter((a) => !a.active)
  const nw = netWorth(active, currency)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="grid grid-cols-3 gap-6">
          <Stat label="Assets" value={formatMoney(nw.assets, currency)} />
          <Stat label="Liabilities" value={formatMoney(nw.liabilities, currency)} />
          <Stat
            label="Net worth"
            value={formatMoney(nw.net, currency)}
            tone={nw.net < 0 ? 'negative' : undefined}
          />
        </div>
        <NewAccountButton currency={currency} defaultOpen={params.new === '1'} />
      </div>
      {accounts.length === 0 ? (
        <EmptyState
          icon={Landmark}
          title="No accounts yet"
          description="Add your bank account, savings, cash, cards and loans to see your full picture."
        />
      ) : (
        <>
          <ul className="bg-card divide-y rounded-xl border">
            {active.map((a) => (
              <li key={a.id} className="flex items-center gap-3 px-4 py-3">
                <ColorDot color={a.color} className="size-2.5" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{a.name}</p>
                  <p className="text-muted-foreground truncate text-xs">
                    {ACCOUNT_TYPE_LABELS[a.account_type as AccountType]}
                    {a.institution ? ` · ${a.institution}` : ''} · {a.currency}
                    {!a.include_in_net_worth && ' · not in net worth'}
                  </p>
                </div>
                <div className="text-right">
                  <Money
                    minor={a.balance_minor}
                    currency={a.currency}
                    className={`text-sm font-semibold ${a.balance_minor < 0 ? 'text-destructive' : ''}`}
                  />
                  {isLiability(a.account_type) && a.balance_minor < 0 && (
                    <p className="text-muted-foreground text-xs">owed</p>
                  )}
                </div>
                <AccountMenu account={a} today={today} transactionCount={countMap.get(a.id) ?? 0} />
              </li>
            ))}
          </ul>
          {archived.length > 0 && (
            <section>
              <h2 className="text-muted-foreground mb-2 text-sm font-semibold">Archived</h2>
              <ul className="bg-card divide-y rounded-xl border opacity-80">
                {archived.map((a) => (
                  <li key={a.id} className="flex items-center gap-3 px-4 py-3">
                    <ColorDot color={a.color} />
                    <span className="flex-1 truncate text-sm">{a.name}</span>
                    <Badge variant="secondary">Archived</Badge>
                    <Money minor={a.balance_minor} currency={a.currency} className="text-sm" />
                    <AccountMenu
                      account={a}
                      today={today}
                      transactionCount={countMap.get(a.id) ?? 0}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}
          {nw.otherCurrencies.length > 0 && (
            <p className="text-muted-foreground text-xs">
              Accounts in {nw.otherCurrencies.map((o) => o.currency).join(', ')} are shown
              separately and not converted into {currency}.
            </p>
          )}
        </>
      )}
    </div>
  )
}
