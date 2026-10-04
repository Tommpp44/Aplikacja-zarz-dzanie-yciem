import { formatISODate, greetingFor } from '@/lib/dates'
import { getT } from '@/lib/i18n/server'

export async function DashboardHeader({
  name,
  today,
  hour,
  actions,
}: {
  name: string
  today: string
  hour: number
  actions?: React.ReactNode
}) {
  const t = await getT()
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-muted-foreground text-sm">{formatISODate(today, 'EEEE, d MMMM yyyy')}</p>
        <h1 className="mt-0.5 text-2xl font-semibold tracking-tight sm:text-3xl">
          {greetingFor(hour)}, {name}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">{t('How is your life going today?')}</p>
      </div>
      {actions}
    </header>
  )
}
