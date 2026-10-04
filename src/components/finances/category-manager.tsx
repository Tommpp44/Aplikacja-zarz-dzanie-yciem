'use client'

import { Archive, ArchiveRestore, Plus } from 'lucide-react'
import { useState } from 'react'
import { ColorPicker } from '@/components/shared/color-picker'
import { Button } from '@/components/ui/button'
import { ColorDot } from '@/components/ui/color-dot'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useServerAction } from '@/hooks/use-server-action'
import type { EntityColor } from '@/lib/colors'
import { createCategory, setCategoryArchived, updateCategory } from '@/lib/finance/actions'
import type { CategoryOption } from './types'

function CategoryRow({ category }: { category: CategoryOption }) {
  const [name, setName] = useState(category.name)
  const [, run] = useServerAction()
  const save = (patch: { name?: string; color?: EntityColor }) =>
    run(() =>
      updateCategory({
        id: category.id,
        name: patch.name ?? category.name,
        color: (patch.color ?? category.color) as EntityColor,
      }),
    )
  return (
    <li className="flex items-center gap-2 px-3 py-2">
      <Popover>
        <PopoverTrigger
          aria-label={`Change ${category.name} color`}
          className="hover:bg-accent rounded-full p-1"
        >
          <ColorDot color={category.color} className="size-3" />
        </PopoverTrigger>
        <PopoverContent className="w-auto">
          <ColorPicker value={category.color} onChange={(c) => save({ color: c })} />
        </PopoverContent>
      </Popover>
      <Input
        aria-label="Category name"
        value={name}
        className="hover:border-input h-8 border-transparent bg-transparent shadow-none"
        onChange={(e) => setName(e.target.value)}
        onBlur={() => name.trim() && name !== category.name && save({ name: name.trim() })}
      />
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={category.archived_at ? 'Restore category' : 'Archive category'}
        onClick={() =>
          run(() => setCategoryArchived({ id: category.id, archived: !category.archived_at }), {
            success: category.archived_at ? 'Category restored' : 'Category archived',
          })
        }
      >
        {category.archived_at ? <ArchiveRestore /> : <Archive />}
      </Button>
    </li>
  )
}

export function CategoryManager({
  categories,
  kind,
}: {
  categories: CategoryOption[]
  kind: 'expense' | 'income'
}) {
  const [name, setName] = useState('')
  const [pending, run] = useServerAction()
  const list = categories.filter((c) => c.kind === kind)
  const active = list.filter((c) => !c.archived_at)
  const archived = list.filter((c) => c.archived_at)
  return (
    <div className="flex flex-col gap-3">
      <ul className="bg-card divide-y rounded-xl border">
        {active.map((c) => (
          <CategoryRow key={c.id} category={c} />
        ))}
      </ul>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (!name.trim()) return
          run(() => createCategory({ name, kind, color: 'slate' }), {
            success: 'Category added',
            onSuccess: () => setName(''),
          })
        }}
      >
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={`New ${kind} category`}
          aria-label={`New ${kind} category`}
        />
        <Button type="submit" variant="outline" disabled={pending}>
          <Plus /> Add
        </Button>
      </form>
      {archived.length > 0 && (
        <details>
          <summary className="text-muted-foreground cursor-pointer text-xs">
            Archived ({archived.length})
          </summary>
          <ul className="bg-card mt-2 divide-y rounded-xl border opacity-80">
            {archived.map((c) => (
              <CategoryRow key={c.id} category={c} />
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}
