'use client'

import {
  CalendarDays,
  CheckSquare,
  Dumbbell,
  FileText,
  Flame,
  FolderKanban,
  Plus,
  Receipt,
  Repeat,
  Search,
  Sun,
  Target,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { useUIStore, type CaptureKind } from '@/hooks/use-ui-store'
import { ALL_NAV_ITEMS } from '@/lib/navigation'
import { searchEverything, type SearchResult } from '@/lib/search/actions'
import { startWorkout } from '@/lib/workouts/actions'
import { useT } from '@/lib/i18n/client'
import { msg } from '@/lib/i18n/translate'

const TYPE_META: Record<SearchResult['type'], { label: string; icon: LucideIcon }> = {
  project: { label: msg('Projects'), icon: FolderKanban },
  task: { label: msg('Tasks'), icon: CheckSquare },
  note: { label: msg('Notes'), icon: FileText },
  goal: { label: msg('Goals'), icon: Target },
  habit: { label: msg('Habits'), icon: Flame },
  transaction: { label: msg('Transactions'), icon: Receipt },
  workout: { label: msg('Workouts'), icon: Dumbbell },
  event: { label: msg('Events'), icon: CalendarDays },
}

const CREATE: { kind: CaptureKind; label: string; icon: LucideIcon }[] = [
  { kind: 'task', label: msg('Create task'), icon: CheckSquare },
  { kind: 'expense', label: msg('Create expense'), icon: Wallet },
  { kind: 'habit', label: msg('Create habit'), icon: Flame },
  { kind: 'event', label: msg('Create event'), icon: CalendarDays },
  { kind: 'goal', label: msg('Create goal'), icon: Target },
  { kind: 'note', label: msg('Create note'), icon: FileText },
]

/** ⌘K / Ctrl+K: search everything and run commands. */
export function CommandPalette() {
  const t = useT()
  const open = useUIStore((s) => s.commandOpen)
  const setOpen = useUIStore((s) => s.setCommandOpen)
  const openCapture = useUIStore((s) => s.openCapture)
  const setCaptureMenuOpen = useUIStore((s) => s.setCaptureMenuOpen)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(!useUIStore.getState().commandOpen)
        return
      }
      const target = e.target as HTMLElement | null
      const typing =
        target &&
        (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
      if (
        !typing &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        e.key === 'c' &&
        !document.querySelector('[role="dialog"], [role="alertdialog"]')
      ) {
        e.preventDefault()
        setCaptureMenuOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setOpen, setCaptureMenuOpen])

  const onOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) {
      setQuery('')
      setResults([])
    }
  }

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) return
    let cancelled = false
    const h = setTimeout(() => {
      setLoading(true)
      void searchEverything({ query: q }).then((r) => {
        if (cancelled) return
        setLoading(false)
        if (r.ok) setResults(r.data)
      })
    }, 180)
    return () => {
      cancelled = true
      clearTimeout(h)
    }
  }, [query])
  const visibleResults = query.trim().length >= 2 ? results : []

  const go = (href: string) => {
    onOpenChange(false)
    router.push(href)
  }

  const grouped = Object.entries(TYPE_META)
    .map(([type, meta]) => ({ type, meta, items: visibleResults.filter((r) => r.type === type) }))
    .filter((g) => g.items.length > 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideClose className="overflow-hidden p-0 sm:max-w-xl">
        <DialogTitle className="sr-only">{t('Search and commands')}</DialogTitle>
        <Command shouldFilter={!query || query.trim().length < 2} loop>
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder={t('Search everything or type a command…')}
          />
          <CommandList>
            <CommandEmpty>{loading ? t('Searching…') : t('No results found.')}</CommandEmpty>
            {grouped.map((g) => {
              const Icon = g.meta.icon
              return (
                <CommandGroup key={g.type} heading={t(g.meta.label)}>
                  {g.items.map((r) => (
                    <CommandItem
                      key={`${r.type}:${r.id}`}
                      value={`${r.type}:${r.id}:${r.title}`}
                      onSelect={() => go(r.href)}
                    >
                      <Icon />
                      <span className="truncate">{r.title}</span>
                      {r.subtitle && (
                        <span className="text-muted-foreground ml-auto truncate text-xs">
                          {r.subtitle}
                        </span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )
            })}
            {query.trim().length < 2 && (
              <>
                <CommandGroup heading="Create">
                  {CREATE.map((c) => {
                    const Icon = c.icon
                    return (
                      <CommandItem key={c.kind} onSelect={() => openCapture(c.kind)}>
                        <Plus className="size-3" />
                        <Icon />
                        {t(c.label)}
                      </CommandItem>
                    )
                  })}
                  <CommandItem
                    onSelect={async () => {
                      onOpenChange(false)
                      const r = await startWorkout({ workout_type: 'strength' })
                      if (r.ok) router.push(`/workouts/${r.data.id}`)
                    }}
                  >
                    <Dumbbell /> {t('Start workout')}
                  </CommandItem>
                  <CommandItem onSelect={() => go('/routines')}>
                    <Repeat /> {t('Start morning routine')}
                  </CommandItem>
                </CommandGroup>
                <CommandGroup heading="Go to">
                  <CommandItem onSelect={() => go('/today')}>
                    <Sun /> {t('Go to today')}
                  </CommandItem>
                  {ALL_NAV_ITEMS.filter((i) => i.href !== '/today').map((item) => {
                    const Icon = item.icon
                    return (
                      <CommandItem key={item.href} onSelect={() => go(item.href)}>
                        <Icon /> Open {item.label.toLowerCase()}
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
                <CommandGroup heading="Tip">
                  <CommandItem disabled>
                    <Search />{' '}
                    {t('Type at least 2 characters to search tasks, notes, transactions…')}
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
