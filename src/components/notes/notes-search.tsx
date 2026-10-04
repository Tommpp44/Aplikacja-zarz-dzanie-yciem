'use client'

import { Search } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'

export function NotesSearch() {
  const params = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [q, setQ] = useState(params.get('q') ?? '')
  useEffect(() => {
    const h = setTimeout(() => {
      if ((params.get('q') ?? '') === q) return
      const next = new URLSearchParams(params.toString())
      if (q) next.set('q', q)
      else next.delete('q')
      router.replace(`${pathname}?${next.toString()}`, { scroll: false })
    }, 250)
    return () => clearTimeout(h)
  }, [q, params, pathname, router])
  return (
    <div className="relative w-full max-w-xs">
      <Search
        className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
        aria-hidden
      />
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search notes"
        aria-label="Search notes"
        className="pl-8"
      />
    </div>
  )
}
