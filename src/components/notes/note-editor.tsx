'use client'

import { Archive, ArrowLeft, Link2, Pin, PinOff, Plus, Trash2, X } from 'lucide-react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useServerAction } from '@/hooks/use-server-action'
import {
  deleteNote,
  linkNote,
  saveNote,
  searchLinkTargets,
  setNoteArchived,
  togglePinNote,
  unlinkNote,
} from '@/lib/notes/actions'
import { ENTITY_LABELS, entityHref, type NoteEntityType } from '@/lib/notes/schemas'
import { useT } from '@/lib/i18n/client'

const RichTextEditor = dynamic(() => import('./rich-text-editor'), {
  ssr: false,
  loading: () => <div className="bg-muted/50 min-h-[50vh] animate-pulse rounded-lg" aria-hidden />,
})

type LinkRow = { id: string; entity_type: NoteEntityType; entity_id: string; name: string }

export function NoteEditor({
  note,
  initialLink,
}: {
  note?: {
    id: string
    title: string
    content: string
    pinned: boolean
    tags: string[]
    links: LinkRow[]
    archived: boolean
  }
  initialLink?: { entity_type: NoteEntityType; entity_id: string }
}) {
  const t = useT()
  const router = useRouter()
  const [id, setId] = useState(note?.id)
  const [title, setTitle] = useState(note?.title ?? '')
  const [tags, setTags] = useState(note?.tags.join(', ') ?? '')
  const [status, setStatus] = useState<'saved' | 'saving' | 'dirty' | 'error'>('saved')
  const contentRef = useRef({ html: note?.content ?? '', text: '' })
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savingRef = useRef(false)
  const [, run] = useServerAction()
  const [confirming, setConfirming] = useState(false)

  const save = useCallback(async () => {
    if (savingRef.current) return
    savingRef.current = true
    setStatus('saving')
    const result = await saveNote({
      id,
      title: title.trim(),
      content: contentRef.current.html,
      content_text: contentRef.current.text,
      tag_names: tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      link: !id && initialLink ? initialLink : undefined,
    })
    savingRef.current = false
    if (!result.ok) {
      setStatus('error')
      toast.error(t(result.error))
      return
    }
    setStatus('saved')
    if (!id) {
      setId(result.data.id)
      router.replace(`/notes/${result.data.id}`)
    }
  }, [id, title, tags, initialLink, router, t])

  const schedule = useCallback(() => {
    setStatus('dirty')
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => void save(), 900)
  }, [save])

  // Re-schedule when title/tags change (but not on first render).
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    schedule()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, tags])

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (status === 'dirty' || status === 'saving') e.preventDefault()
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [status])

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <Link
          href="/notes"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ArrowLeft className="size-4" /> {t('Notes')}
        </Link>
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground mr-2 text-xs" role="status" aria-live="polite">
            {status === 'saving'
              ? t('Saving…')
              : status === 'dirty'
                ? t('Unsaved changes')
                : status === 'error'
                  ? t('Not saved')
                  : id
                    ? t('Saved')
                    : ''}
          </span>
          {id && (
            <>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={note?.pinned ? t('Unpin note') : t('Pin note')}
                onClick={() => run(() => togglePinNote({ id, pinned: !note?.pinned }))}
              >
                {note?.pinned ? <PinOff /> : <Pin />}
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={note?.archived ? t('Restore note') : t('Archive note')}
                onClick={() =>
                  run(() => setNoteArchived({ id, archived: !note?.archived }), {
                    success: note?.archived ? t('Note restored') : t('Note archived'),
                  })
                }
              >
                <Archive />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t('Delete note')}
                onClick={() => setConfirming(true)}
              >
                <Trash2 />
              </Button>
            </>
          )}
        </div>
      </div>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={t('Untitled')}
        aria-label={t('Note title')}
        maxLength={200}
        className="placeholder:text-muted-foreground/60 bg-transparent text-3xl font-semibold tracking-tight outline-none"
      />
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder={t('Tags, comma separated')}
          aria-label={t('Tags')}
          className="h-8 max-w-xs"
        />
        {id ? (
          <LinksBar noteId={id} links={note?.links ?? []} />
        ) : (
          initialLink && (
            <span className="text-muted-foreground text-xs">
              {t('Will be linked to this {entity}', {
                entity: t(ENTITY_LABELS[initialLink.entity_type]).toLowerCase(),
              })}
            </span>
          )
        )}
      </div>
      <RichTextEditor
        content={note?.content ?? ''}
        onChange={(html, text) => {
          contentRef.current = { html, text }
          schedule()
        }}
      />
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={t('Delete this note?')}
        description={t('This cannot be undone. Archive it instead if you may need it later.')}
        onConfirm={() =>
          run(() => deleteNote({ id: id! }), {
            success: t('Note deleted'),
            onSuccess: () => router.push('/notes'),
          })
        }
      />
    </div>
  )
}

function LinksBar({ noteId, links }: { noteId: string; links: LinkRow[] }) {
  const t = useT()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<{ type: NoteEntityType; id: string; label: string }[]>([])
  const [, run] = useServerAction()
  useEffect(() => {
    const h = setTimeout(async () => {
      const r = await searchLinkTargets({ query })
      if (r.ok) setResults(r.data)
    }, 200)
    return () => clearTimeout(h)
  }, [query])
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {links.map((l) => (
        <span
          key={l.id}
          className="bg-muted inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs"
        >
          <Link2 className="size-3" aria-hidden />
          <Link href={entityHref(l.entity_type, l.entity_id)} className="hover:underline">
            {t(ENTITY_LABELS[l.entity_type])}: {l.name}
          </Link>
          <button
            type="button"
            aria-label={t('Unlink {name}', { name: l.name })}
            onClick={() => run(() => unlinkNote({ id: l.id }))}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
      <Popover>
        <PopoverTrigger className="text-muted-foreground hover:text-foreground inline-flex h-6 items-center gap-1 rounded-md border px-2 text-xs">
          <Plus className="size-3" /> {t('Link')}
        </PopoverTrigger>
        <PopoverContent className="w-80 p-2" align="start">
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('Project, goal, task, habit, workout…')}
            aria-label={t('Search items to link')}
            className="mb-2"
          />
          <ul className="max-h-64 overflow-y-auto">
            {results.length === 0 && (
              <li className="text-muted-foreground px-2 py-3 text-center text-xs">
                {t('Nothing found')}
              </li>
            )}
            {results.map((r) => (
              <li key={`${r.type}:${r.id}`}>
                <button
                  type="button"
                  className="hover:bg-accent flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm"
                  onClick={() =>
                    run(() => linkNote({ note_id: noteId, entity_type: r.type, entity_id: r.id }), {
                      success: t('Linked'),
                    })
                  }
                >
                  <span className="text-muted-foreground w-16 shrink-0 text-xs">
                    {t(ENTITY_LABELS[r.type])}
                  </span>
                  <span className="truncate">{r.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </PopoverContent>
      </Popover>
    </div>
  )
}
