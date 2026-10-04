import { ArrowRight, CalendarCheck, Moon, NotebookPen } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { Nudge } from '@/lib/engagement/nudges'

export function NudgeCard({ nudge }: { nudge: Nudge }) {
  const Icon = nudge.kind === 'weekly-review' ? CalendarCheck : Moon
  return (
    <Card className="border-primary/20">
      <CardContent className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center">
        <span className="bg-primary/10 text-primary grid size-9 shrink-0 place-items-center rounded-lg">
          <Icon className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-medium">{nudge.title}</p>
          <p className="text-muted-foreground text-sm">{nudge.body}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {nudge.kind === 'evening' && nudge.journalHref && (
            <Button asChild variant="outline" size="sm">
              <Link href={nudge.journalHref}>
                <NotebookPen /> Journal
              </Link>
            </Button>
          )}
          <Button asChild size="sm">
            <Link href={nudge.href}>
              {nudge.kind === 'weekly-review' ? 'Start weekly review' : 'Daily review'}
              <ArrowRight />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
