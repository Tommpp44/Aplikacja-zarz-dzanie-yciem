import { NotebookPen, Pin, Plus } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { NotesSearch } from '@/components/notes/notes-search'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { SegmentedLinks } from '@/components/ui/segmented'
import { formatISODate } from '@/lib/dates'
import { listNotes } from '@/lib/notes/repository'
import { getOnboardedUserContext } from '@/lib/settings/service'
import { truncate } from '@/lib/utils'

export const metadata: Metadata = { title: 'Notes' }

export default async function NotesPage({ searchParams }: PageProps<'/notes'>) {
  const sp = await searchParams
  const { supabase, user } = await getOnboardedUserContext()
  const archived = sp.view === 'archived'
  const notes = await listNotes(supabase, user.id, {
    search: typeof sp.q === 'string' ? sp.q : undefined,
    archived,
  })
  return (
    <>
      <PageHeader
        title="Notes"
        description="Ideas, research and decisions — linked to your projects, goals and workouts."
        actions={
          <Button asChild>
            <Link href="/notes/new">
              <Plus /> New note
            </Link>
          </Button>
        }
      >
        <div className="flex flex-wrap items-center gap-3">
          <SegmentedLinks
            label="Notes view"
            active={archived ? 'archived' : 'all'}
            items={[
              { value: 'all', label: 'All', href: '/notes' },
              { value: 'archived', label: 'Archived', href: '/notes?view=archived' },
            ]}
          />
          <Suspense>
            <NotesSearch />
          </Suspense>
        </div>
      </PageHeader>
      {notes.length === 0 ? (
        <EmptyState
          icon={NotebookPen}
          title={sp.q ? 'No notes match your search' : 'No notes yet'}
          description="Capture a thought, a plan or meeting notes. Link notes to projects and goals to find them in context."
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {notes.map((n) => (
            <li key={n.id}>
              <Link
                href={`/notes/${n.id}`}
                className="bg-card hover:border-primary/40 flex h-full flex-col gap-2 rounded-xl border p-4 shadow-xs transition-colors"
              >
                <span className="flex items-start justify-between gap-2">
                  <span className="truncate font-medium">{n.title || 'Untitled'}</span>
                  {n.pinned && (
                    <Pin className="text-primary size-3.5 shrink-0" aria-label="Pinned" />
                  )}
                </span>
                <span className="text-muted-foreground line-clamp-3 text-[13px]">
                  {truncate(n.content_text, 220) || 'Empty note'}
                </span>
                <span className="text-muted-foreground mt-auto flex flex-wrap items-center gap-1.5 text-xs">
                  {formatISODate(n.updated_at.slice(0, 10), 'd MMM yyyy')}
                  {n.note_tags.map(
                    (t) =>
                      t.tag && (
                        <span key={t.tag.id} className="bg-muted rounded px-1.5">
                          #{t.tag.name}
                        </span>
                      ),
                  )}
                  {n.note_links.length > 0 && <span>· {n.note_links.length} linked</span>}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
