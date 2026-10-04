'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

/** Range selector (URL driven). Options are passed by the page. */
export function RangePicker({
  options,
  active,
  allowCustom = false,
  from,
  to,
}: {
  options: { value: string; label: string }[]
  active: string
  allowCustom?: boolean
  from?: string
  to?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const go = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString())
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v)
      else next.delete(k)
    }
    router.replace(`${pathname}?${next.toString()}`, { scroll: false })
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div
        className="bg-muted inline-flex h-9 items-center gap-0.5 rounded-lg p-[3px]"
        role="radiogroup"
        aria-label="Range"
      >
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active === o.value}
            onClick={() => go({ range: o.value, from: null, to: null })}
            className={cn(
              'text-muted-foreground hover:text-foreground h-full rounded-md px-3 text-[13px] font-medium',
              active === o.value && 'bg-card text-foreground shadow-xs',
            )}
          >
            {o.label}
          </button>
        ))}
        {allowCustom && (
          <button
            type="button"
            role="radio"
            aria-checked={active === 'custom'}
            onClick={() => go({ range: 'custom', from: from ?? null, to: to ?? null })}
            className={cn(
              'text-muted-foreground hover:text-foreground h-full rounded-md px-3 text-[13px] font-medium',
              active === 'custom' && 'bg-card text-foreground shadow-xs',
            )}
          >
            Custom
          </button>
        )}
      </div>
      {allowCustom && active === 'custom' && (
        <div className="flex items-center gap-2">
          <Input
            type="date"
            aria-label="From"
            className="w-40"
            defaultValue={from}
            onChange={(e) => go({ range: 'custom', from: e.target.value })}
          />
          <span className="text-muted-foreground">–</span>
          <Input
            type="date"
            aria-label="To"
            className="w-40"
            defaultValue={to}
            onChange={(e) => go({ range: 'custom', to: e.target.value })}
          />
        </div>
      )}
    </div>
  )
}
