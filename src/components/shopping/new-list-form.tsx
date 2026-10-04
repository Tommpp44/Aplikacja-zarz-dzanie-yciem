'use client'

import { Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useServerAction } from '@/hooks/use-server-action'
import { createShoppingList } from '@/lib/shopping/actions'

export function NewListForm() {
  const [name, setName] = useState('')
  const [pending, run] = useServerAction()
  const router = useRouter()
  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        if (!name.trim()) return
        run(() => createShoppingList({ name }), {
          onSuccess: (d) => {
            setName('')
            router.push(`/shopping?list=${d.id}`)
          },
        })
      }}
    >
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="New list"
        aria-label="New list name"
      />
      <Button
        type="submit"
        variant="outline"
        size="icon"
        disabled={pending}
        aria-label="Create list"
      >
        <Plus />
      </Button>
    </form>
  )
}
