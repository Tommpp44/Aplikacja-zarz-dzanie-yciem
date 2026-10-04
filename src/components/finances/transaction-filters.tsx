'use client'

import { Search, X } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/ui/native-select'
import type { AccountOption, CategoryOption } from './types'
import { useT } from '@/lib/i18n/client'

export function TransactionFilters({
  accounts,
  categories,
}: {
  accounts: AccountOption[]
  categories: CategoryOption[]
}) {
  const t = useT()
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [q, setQ] = useState(params.get('q') ?? '')

  const update = (patch: Record<string, string>) => {
    const next = new URLSearchParams(params.toString())
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v)
      else next.delete(k)
    }
    next.delete('page')
    router.replace(`${pathname}?${next.toString()}`, { scroll: false })
  }

  useEffect(() => {
    const h = setTimeout(() => {
      if ((params.get('q') ?? '') !== q) update({ q })
    }, 300)
    return () => clearTimeout(h)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])

  const hasFilters = ['q', 'from', 'to', 'account', 'category', 'type'].some((k) => params.get(k))

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-44 flex-1">
        <Search
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
          aria-hidden
        />
        <Input
          className="pl-8"
          placeholder={t('Merchant or description')}
          aria-label={t('Search transactions')}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <Input
        type="date"
        aria-label={t('From date')}
        className="w-40"
        value={params.get('from') ?? ''}
        onChange={(e) => update({ from: e.target.value })}
      />
      <Input
        type="date"
        aria-label={t('To date')}
        className="w-40"
        value={params.get('to') ?? ''}
        onChange={(e) => update({ to: e.target.value })}
      />
      <NativeSelect
        aria-label={t('Type')}
        className="w-32"
        value={params.get('type') ?? ''}
        onChange={(e) => update({ type: e.target.value })}
      >
        <option value="">{t('All types')}</option>
        <option value="expense">{t('Expenses')}</option>
        <option value="income">{t('Income')}</option>
        <option value="transfer">{t('Transfers')}</option>
        <option value="adjustment">{t('Corrections')}</option>
      </NativeSelect>
      <NativeSelect
        aria-label={t('Account')}
        className="w-40"
        value={params.get('account') ?? ''}
        onChange={(e) => update({ account: e.target.value })}
      >
        <option value="">{t('All accounts')}</option>
        {accounts.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </NativeSelect>
      <NativeSelect
        aria-label={t('Category')}
        className="w-40"
        value={params.get('category') ?? ''}
        onChange={(e) => update({ category: e.target.value })}
      >
        <option value="">{t('All categories')}</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </NativeSelect>
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setQ('')
            router.replace(pathname)
          }}
        >
          <X /> {t('Clear')}
        </Button>
      )}
    </div>
  )
}
