import { ShoppingCart } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { NewListForm } from '@/components/shopping/new-list-form'
import { ShoppingListView } from '@/components/shopping/shopping-list'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { unwrap } from '@/lib/db/errors'
import { getOnboardedUserContext } from '@/lib/settings/service'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Shopping' }

export default async function ShoppingPage({ searchParams }: PageProps<'/shopping'>) {
  const sp = await searchParams
  const { supabase, user } = await getOnboardedUserContext()
  const lists = unwrap(
    await supabase
      .from('shopping_lists')
      .select('id, name, items:shopping_items(id, purchased)')
      .eq('user_id', user.id)
      .is('archived_at', null)
      .order('position')
      .order('created_at'),
    'load lists',
  )
  const active = lists.find((l) => l.id === sp.list) ?? lists[0]
  const items = active
    ? unwrap(
        await supabase
          .from('shopping_items')
          .select('id, name, quantity, unit, category, purchased')
          .eq('user_id', user.id)
          .eq('list_id', active.id)
          .order('purchased')
          .order('category')
          .order('position'),
        'load items',
      ).map((i) => ({ ...i, quantity: i.quantity === null ? null : Number(i.quantity) }))
    : []
  return (
    <>
      <PageHeader title="Shopping" description="Simple lists with quantities and categories." />
      <div className="grid gap-6 md:grid-cols-[240px_1fr]">
        <aside className="flex flex-col gap-3">
          <ul className="flex flex-col gap-1">
            {lists.map((l) => {
              const left = l.items.filter((i) => !i.purchased).length
              return (
                <li key={l.id}>
                  <Link
                    href={`/shopping?list=${l.id}`}
                    aria-current={active?.id === l.id ? 'page' : undefined}
                    className={cn(
                      'hover:bg-accent flex items-center justify-between rounded-md px-3 py-2 text-sm',
                      active?.id === l.id && 'bg-accent font-medium',
                    )}
                  >
                    {l.name}
                    <span className="text-muted-foreground tabular text-xs">{left}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
          <NewListForm />
        </aside>
        <div className="bg-card rounded-xl border p-5">
          {active ? (
            <ShoppingListView key={active.id} list={active} items={items} />
          ) : (
            <EmptyState
              icon={ShoppingCart}
              title="No shopping lists"
              description="Create a list like “Groceries” and add items as you think of them."
            />
          )}
        </div>
      </div>
    </>
  )
}
