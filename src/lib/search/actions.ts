'use server'

import { z } from 'zod'
import { authedAction } from '@/lib/action'
import { listAccountOptions } from '@/lib/finance/accounts-repository'
import { listCategories } from '@/lib/finance/repository'
import { listGoalOptions } from '@/lib/goals/options'
import { formatMoney } from '@/lib/money'
import { listProjectOptions } from '@/lib/projects/repository'
import { getUserContext } from '@/lib/settings/service'
import { escapeLike } from '@/lib/tasks/repository'

export type SearchResult = {
  type: 'task' | 'project' | 'goal' | 'habit' | 'note' | 'transaction' | 'workout' | 'event'
  id: string
  title: string
  subtitle?: string
  href: string
}

/** Global search across modules, grouped by type (RLS limits results to the user). */
export const searchEverything = authedAction(
  z.object({ query: z.string().trim().min(1).max(100) }),
  { name: 'searchEverything', revalidate: [] },
  async ({ query }, { supabase, user }) => {
    const like = `%${escapeLike(query)}%`
    const uid = user.id
    const [tasks, projects, goals, habits, notes, txns, workouts, events] = await Promise.all([
      supabase
        .from('tasks')
        .select('id, title, status, due_date')
        .eq('user_id', uid)
        .is('deleted_at', null)
        .ilike('title', like)
        .order('created_at', { ascending: false })
        .limit(6),
      supabase
        .from('projects')
        .select('id, name, status')
        .eq('user_id', uid)
        .ilike('name', like)
        .limit(5),
      supabase
        .from('goals')
        .select('id, title, status')
        .eq('user_id', uid)
        .ilike('title', like)
        .limit(5),
      supabase.from('habits').select('id, name').eq('user_id', uid).ilike('name', like).limit(5),
      supabase
        .from('notes')
        .select('id, title, content_text')
        .eq('user_id', uid)
        .is('archived_at', null)
        .or(`title.ilike.${like},content_text.ilike.${like}`)
        .order('updated_at', { ascending: false })
        .limit(6),
      supabase
        .from('transactions')
        .select('id, merchant, description, amount_minor, currency, txn_type, occurred_on')
        .eq('user_id', uid)
        .is('deleted_at', null)
        .or(`merchant.ilike.${like},description.ilike.${like}`)
        .order('occurred_on', { ascending: false })
        .limit(6),
      supabase
        .from('workouts')
        .select('id, name, performed_on')
        .eq('user_id', uid)
        .ilike('name', like)
        .order('performed_on', { ascending: false })
        .limit(5),
      supabase
        .from('calendar_events')
        .select('id, title, starts_at')
        .eq('user_id', uid)
        .ilike('title', like)
        .order('starts_at', { ascending: false })
        .limit(5),
    ])
    const results: SearchResult[] = [
      ...(projects.data ?? []).map((p) => ({
        type: 'project' as const,
        id: p.id,
        title: p.name,
        subtitle: p.status,
        href: `/projects/${p.id}`,
      })),
      ...(tasks.data ?? []).map((t) => ({
        type: 'task' as const,
        id: t.id,
        title: t.title,
        subtitle: t.status === 'completed' ? 'Completed' : (t.due_date ?? undefined),
        href: `/tasks?view=${t.status === 'completed' ? 'completed' : t.due_date ? 'scheduled' : 'inbox'}&q=${encodeURIComponent(t.title)}`,
      })),
      ...(notes.data ?? []).map((n) => ({
        type: 'note' as const,
        id: n.id,
        title: n.title || 'Untitled',
        subtitle: n.content_text.slice(0, 80),
        href: `/notes/${n.id}`,
      })),
      ...(goals.data ?? []).map((g) => ({
        type: 'goal' as const,
        id: g.id,
        title: g.title,
        subtitle: g.status,
        href: `/goals/${g.id}`,
      })),
      ...(habits.data ?? []).map((h) => ({
        type: 'habit' as const,
        id: h.id,
        title: h.name,
        href: `/habits/${h.id}`,
      })),
      ...(txns.data ?? []).map((t) => ({
        type: 'transaction' as const,
        id: t.id,
        title: t.merchant || t.description || 'Transaction',
        subtitle: `${t.occurred_on} · ${formatMoney(t.txn_type === 'expense' ? -t.amount_minor : t.amount_minor, t.currency)}`,
        href: `/finances/transactions?q=${encodeURIComponent(t.merchant || t.description || '')}`,
      })),
      ...(workouts.data ?? []).map((w) => ({
        type: 'workout' as const,
        id: w.id,
        title: w.name,
        subtitle: w.performed_on,
        href: `/workouts/${w.id}`,
      })),
      ...(events.data ?? []).map((e) => ({
        type: 'event' as const,
        id: e.id,
        title: e.title,
        subtitle: e.starts_at.slice(0, 10),
        href: `/calendar?view=day&date=${e.starts_at.slice(0, 10)}`,
      })),
    ]
    return results
  },
)

/** Options needed by quick-capture forms, loaded only when capture opens. */
export const getCaptureOptions = authedAction(
  z.object({}),
  { name: 'getCaptureOptions', revalidate: [] },
  async (_input, { supabase, user }) => {
    const { today, prefs } = await getUserContext()
    const [accounts, categories, goals, projects] = await Promise.all([
      listAccountOptions(supabase, user.id),
      listCategories(supabase, user.id),
      listGoalOptions(supabase, user.id),
      listProjectOptions(supabase, user.id),
    ])
    return {
      today,
      units: prefs.units === 'imperial' ? ('imperial' as const) : ('metric' as const),
      weekStartsOn: prefs.week_start,
      lastUsed: prefs.last_used,
      accounts,
      categories,
      goals,
      projects: projects.map((p) => ({ id: p.id, name: p.name })),
    }
  },
)
