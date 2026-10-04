'use client'

import { Plus, Trash2, X } from 'lucide-react'
import { useOptimistic, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { useServerAction } from '@/hooks/use-server-action'
import {
  addShoppingItem,
  clearPurchased,
  deleteShoppingItem,
  deleteShoppingList,
  toggleShoppingItem,
} from '@/lib/shopping/actions'
import { cn, groupBy } from '@/lib/utils'

type Item = {
  id: string
  name: string
  quantity: number | null
  unit: string | null
  category: string | null
  purchased: boolean
}

export function ShoppingListView({
  list,
  items,
}: {
  list: { id: string; name: string }
  items: Item[]
}) {
  const [text, setText] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [pending, run] = useServerAction()
  const [, startTransition] = useTransition()
  const [optimistic, setOptimistic] = useOptimistic(
    items,
    (state, change: { id: string; purchased: boolean }) =>
      state.map((i) => (i.id === change.id ? { ...i, purchased: change.purchased } : i)),
  )
  const open = optimistic.filter((i) => !i.purchased)
  const done = optimistic.filter((i) => i.purchased)
  const groups = groupBy(open, (i) => i.category ?? 'Other')

  const row = (i: Item) => (
    <li key={i.id} className="group flex items-center gap-3 py-2">
      <Checkbox
        checked={i.purchased}
        aria-label={`${i.purchased ? 'Unmark' : 'Mark'} ${i.name}`}
        onCheckedChange={(v) =>
          startTransition(async () => {
            setOptimistic({ id: i.id, purchased: v === true })
            const r = await toggleShoppingItem({ id: i.id, purchased: v === true })
            if (!r.ok) toast.error(r.error)
          })
        }
      />
      <span className={cn('flex-1 text-sm', i.purchased && 'text-muted-foreground line-through')}>
        {i.name}
        {i.quantity !== null && (
          <span className="text-muted-foreground tabular ml-1.5 text-xs">
            {i.quantity}
            {i.unit ? ` ${i.unit}` : '×'}
          </span>
        )}
      </span>
      <button
        type="button"
        aria-label={`Remove ${i.name}`}
        onClick={() => run(() => deleteShoppingItem({ id: i.id }))}
        className="text-muted-foreground opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
      >
        <X className="size-3.5" />
      </button>
    </li>
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">{list.name}</h2>
        <div className="flex gap-1">
          {done.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                run(() => clearPurchased({ list_id: list.id }), {
                  success: 'Cleared purchased items',
                })
              }
            >
              Clear purchased
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Delete list"
            onClick={() => setConfirming(true)}
          >
            <Trash2 />
          </Button>
        </div>
      </div>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (!text.trim()) return
          run(() => addShoppingItem({ list_id: list.id, text }), { onSuccess: () => setText('') })
        }}
      >
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder='Add item — e.g. "2 l milk", "Eggs x12"'
          aria-label="Add item"
          autoFocus
        />
        <Button type="submit" disabled={pending} aria-label="Add item">
          <Plus />
        </Button>
      </form>
      {optimistic.length === 0 ? (
        <EmptyState
          compact
          title="This list is empty"
          description="Add what you need — quantities like “2 kg” are recognised."
        />
      ) : (
        <>
          {Object.entries(groups).map(([category, list]) => (
            <section key={category} aria-label={category}>
              <h3 className="text-muted-foreground text-xs font-semibold">{category}</h3>
              <ul className="divide-y">{list.map(row)}</ul>
            </section>
          ))}
          {done.length > 0 && (
            <section aria-label="Purchased">
              <h3 className="text-muted-foreground text-xs font-semibold">
                Purchased ({done.length})
              </h3>
              <ul className="divide-y">{done.map(row)}</ul>
            </section>
          )}
        </>
      )}
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={`Delete “${list.name}”?`}
        description="The list and its items will be removed."
        onConfirm={() =>
          run(() => deleteShoppingList({ id: list.id }), { success: 'List deleted' })
        }
      />
    </div>
  )
}
