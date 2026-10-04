import { NoteEditor } from '@/components/notes/note-editor'
import { linkSchema } from '@/lib/notes/schemas'
import { getOnboardedUserContext } from '@/lib/settings/service'
import { pageTitle } from '@/lib/i18n/server'

export const generateMetadata = pageTitle('New note')

export default async function NewNotePage({ searchParams }: PageProps<'/notes/new'>) {
  await getOnboardedUserContext()
  const sp = await searchParams
  const [entity_type, entity_id] = typeof sp.link === 'string' ? sp.link.split(':') : []
  const link = linkSchema.safeParse({ entity_type, entity_id })
  return <NoteEditor initialLink={link.success ? link.data : undefined} />
}
