import type { Metadata } from 'next'
import { CustomizeDashboard } from '@/components/dashboard/customize-dashboard'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { QuickActions } from '@/components/dashboard/quick-actions'
import {
  BriefWidget,
  FinanceWidget,
  GoalsWidget,
  HabitsWidget,
  LifeBalanceWidget,
  NotesWidget,
  RemindersWidget,
  TodayWidget,
  TrainingWidget,
} from '@/components/dashboard/widgets'
import { FocusEditor } from '@/components/today/focus-editor'
import { Card, CardContent } from '@/components/ui/card'
import { getDashboardData } from '@/lib/dashboard/service'
import { currentHour } from '@/lib/dates'
import type { DashboardWidgetId } from '@/lib/settings/schemas'
import { getOnboardedUserContext } from '@/lib/settings/service'
import type { Units } from '@/lib/units'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Dashboard' }

const WIDGETS: Record<
  DashboardWidgetId,
  { Component: (p: Parameters<typeof BriefWidget>[0]) => React.ReactNode; wide?: boolean }
> = {
  brief: { Component: BriefWidget },
  today: { Component: TodayWidget, wide: true },
  habits: { Component: HabitsWidget },
  reminders: { Component: RemindersWidget },
  goals: { Component: GoalsWidget },
  finance: { Component: FinanceWidget },
  training: { Component: TrainingWidget },
  life_balance: { Component: LifeBalanceWidget },
  notes: { Component: NotesWidget },
}

export default async function DashboardPage() {
  const ctx = await getOnboardedUserContext()
  const { profile, user, today, timezone, prefs, currency } = ctx
  const data = await getDashboardData(ctx)
  const units: Units = prefs.units === 'imperial' ? 'imperial' : 'metric'
  const name = profile.display_name || user.email?.split('@')[0] || 'there'
  const visible = prefs.dashboard_layout.filter((w) => w.visible)

  return (
    <>
      <DashboardHeader
        name={name}
        today={today}
        hour={currentHour(timezone)}
        actions={
          <CustomizeDashboard
            layout={prefs.dashboard_layout}
            financeRange={prefs.last_used.finance_range ?? 'month'}
          />
        }
      />
      <div className="mb-6 flex flex-col gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-muted-foreground mb-2 text-xs font-medium">Today&apos;s focus</p>
            <FocusEditor focus={data.day.focus} today={today} />
          </CardContent>
        </Card>
        <QuickActions />
      </div>
      <div className="grid grid-flow-row-dense items-start gap-4 lg:grid-cols-3">
        {visible.map((w) => {
          const entry = WIDGETS[w.id]
          const Component = entry.Component
          return (
            <div key={w.id} className={cn(entry.wide && 'lg:col-span-2 lg:row-span-2')}>
              <Component data={data} today={today} currency={currency} units={units} />
            </div>
          )
        })}
      </div>
    </>
  )
}
