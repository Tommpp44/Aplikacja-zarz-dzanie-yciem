import { Target } from 'lucide-react'
import type { Metadata } from 'next'
import { GoalCard } from '@/components/goals/goal-card'
import { NewGoalButton } from '@/components/goals/new-goal-button'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { listAccountOptions } from '@/lib/finance/accounts-repository'
import { listGoalsWithProgress } from '@/lib/goals/service'
import { getOnboardedUserContext } from '@/lib/settings/service'

export const metadata: Metadata = { title: 'Goals' }

export default async function GoalsPage({ searchParams }: PageProps<'/goals'>) {
  const params = await searchParams
  const { supabase, user, today } = await getOnboardedUserContext()
  const [goals, accounts] = await Promise.all([
    listGoalsWithProgress(supabase, user.id, today, ['active', 'paused', 'completed']),
    listAccountOptions(supabase, user.id),
  ])
  const active = goals.filter((g) => g.status === 'active')
  const paused = goals.filter((g) => g.status === 'paused')
  const completed = goals.filter((g) => g.status === 'completed')
  const behind = active.filter(
    (g) => g.pace.status === 'behind' || g.pace.status === 'overdue',
  ).length

  return (
    <>
      <PageHeader
        title="Goals"
        description={
          active.length
            ? `${active.length} active · ${behind ? `${behind} need attention` : 'all on track'} · ${completed.length} completed`
            : 'Long-term outcomes your daily actions build towards.'
        }
        actions={<NewGoalButton accounts={accounts} defaultOpen={params.new === '1'} />}
      />
      {goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No goals yet"
          description="Create your first goal and start tracking progress."
        />
      ) : (
        <div className="flex flex-col gap-8">
          {[
            ['Active', active],
            ['Paused', paused],
            ['Completed', completed],
          ].map(([label, list]) =>
            (list as typeof goals).length ? (
              <section key={label as string} aria-labelledby={`goals-${label}`}>
                <h2
                  id={`goals-${label}`}
                  className="text-muted-foreground mb-3 text-sm font-semibold"
                >
                  {label as string}
                </h2>
                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {(list as typeof goals).map((g) => (
                    <li key={g.id}>
                      <GoalCard goal={g} />
                    </li>
                  ))}
                </ul>
              </section>
            ) : null,
          )}
        </div>
      )}
    </>
  )
}
