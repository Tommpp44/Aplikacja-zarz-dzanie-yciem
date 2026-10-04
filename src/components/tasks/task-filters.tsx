'use client'

import { Search } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/ui/native-select'
import type { TaskOptions } from './types'

/** URL-driven filters so filtered views are shareable and survive reloads. */
export function TaskFilters({
  options,
  tags,
}: {
  options: TaskOptions
  tags: { id: string; name: string }[]
}) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [search, setSearch] = useState(params.get('q') ?? '')

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString())
    if (value) next.set(key, value)
    else next.delete(key)
    router.replace(`${pathname}?${next.toString()}`, { scroll: false })
  }

  useEffect(() => {
    const handle = setTimeout(() => {
      if ((params.get('q') ?? '') !== search) update('q', search)
    }, 250)
    return () => clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-48 flex-1">
        <Search
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
          aria-hidden
        />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter tasks"
          aria-label="Filter tasks"
          className="pl-8"
        />
      </div>
      <NativeSelect
        aria-label="Priority"
        className="w-32"
        value={params.get('priority') ?? ''}
        onChange={(e) => update('priority', e.target.value)}
      >
        <option value="">Any priority</option>
        {[1, 2, 3, 4].map((p) => (
          <option key={p} value={p}>
            P{p}
          </option>
        ))}
      </NativeSelect>
      <NativeSelect
        aria-label="Project"
        className="w-40"
        value={params.get('project') ?? ''}
        onChange={(e) => update('project', e.target.value)}
      >
        <option value="">All projects</option>
        {options.projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </NativeSelect>
      {tags.length > 0 && (
        <NativeSelect
          aria-label="Tag"
          className="w-32"
          value={params.get('tag') ?? ''}
          onChange={(e) => update('tag', e.target.value)}
        >
          <option value="">All tags</option>
          {tags.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </NativeSelect>
      )}
    </div>
  )
}
