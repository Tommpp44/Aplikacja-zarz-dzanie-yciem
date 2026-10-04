import { notFound } from 'next/navigation'
import { NoteEditor } from '@/components/notes/note-editor'
import { getNote, resolveEntityNames } from '@/lib/notes/repository'
import type { NoteEntityType } from '@/lib/notes/schemas'
import { getOnboardedUserContext } from '@/lib/settings/service'
import { getT, pageTitle } from '@/lib/i18n/server'

export const generateMetadata = pageTitle('Note')

export default async function NotePage({ params }: PageProps<'/notes/[id]'>) {
  const t = await getT()
  const { id } = await params
  const { supabase, user } = await getOnboardedUserContext()
  const note = await getNote(supabase, user.id, id).catch(() => null)
  if (!note) notFound()
  const names = await resolveEntityNames(supabase, user.id, note.note_links)
  return (
    <NoteEditor
      key={note.id}
      note={{
        id: note.id,
        title: note.title,
        content: note.content,
        pinned: note.pinned,
        archived: Boolean(note.archived_at),
        tags: note.note_tags.map((it) => it.tag?.name).filter((it): it is string => Boolean(it)),
        links: note.note_links.map((l) => ({
          ...l,
          entity_type: l.entity_type as NoteEntityType,
          name: names.get(`${l.entity_type}:${l.entity_id}`) ?? t('Item'),
        })),
      }}
    />
  )
}
