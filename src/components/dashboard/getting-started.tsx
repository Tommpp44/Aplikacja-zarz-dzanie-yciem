'use client'

import { Check, ChevronRight, Rocket, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useServerAction } from '@/hooks/use-server-action'
import { checklistProgress, type ChecklistItem } from '@/lib/engagement/checklist'
import { useT } from '@/lib/i18n/client'
import { rememberLastUsed } from '@/lib/settings/actions'
import { cn, percent } from '@/lib/utils'

/** First-week checklist shown on the dashboard until completed or dismissed. */
export function GettingStarted({ items }: { items: ChecklistItem[] }) {
  const router = useRouter()
  const t = useT()
  const [pending, run] = useServerAction()
  const { done, total } = checklistProgress(items)
  const next = items.find((i) => !i.done)

  const dismiss = () =>
    run(() => rememberLastUsed({ checklist_dismissed: true }), {
      success: t('Checklist hidden. You can find everything in the sidebar.'),
      onSuccess: () => router.refresh(),
    })

  return (
    <Card className="border-primary/30 from-primary/5 bg-gradient-to-br to-transparent">
      <CardContent className="pt-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="bg-primary/10 text-primary grid size-9 shrink-0 place-items-center rounded-lg">
              <Rocket className="size-5" aria-hidden />
            </span>
            <div>
              <h2 className="font-semibold">{t('Get set up in a few minutes')}</h2>
              <p className="text-muted-foreground text-sm">
                {done === 0
                  ? t('A few small steps make LifeOS genuinely useful.')
                  : t('{done} of {total} done — nice momentum.', { done, total })}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t('Hide checklist')}
            disabled={pending}
            onClick={dismiss}
          >
            <X />
          </Button>
        </div>
        <Progress value={percent(done, total)} label={t('Setup progress')} className="mb-4" />
        <ul className="grid gap-1.5 sm:grid-cols-2">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className={cn(
                  'hover:bg-accent/60 group flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors',
                  item.id === next?.id && 'border-primary/50 bg-background',
                  item.done && 'opacity-70',
                )}
              >
                <span
                  className={cn(
                    'grid size-5 shrink-0 place-items-center rounded-full border',
                    item.done && 'bg-success border-success text-white',
                  )}
                  aria-hidden
                >
                  {item.done && <Check className="size-3.5" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={cn('block text-sm font-medium', item.done && 'line-through')}>
                    {t(item.label)}
                    <span className="sr-only">{item.done ? ` (${t('done')})` : ''}</span>
                  </span>
                  {!item.done && (
                    <span className="text-muted-foreground block truncate text-xs">
                      {t(item.hint)}
                    </span>
                  )}
                </span>
                {!item.done && (
                  <ChevronRight
                    className="text-muted-foreground size-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                )}
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
