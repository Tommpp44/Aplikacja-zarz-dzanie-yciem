import { NotebookPen, Plus } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getUserContext } from '@/lib/settings/service'
import { listNotesForEntity } from '@/lib/notes/repository'
import type { NoteEntityType } from '@/lib/notes/schemas'
import { truncate } from '@/lib/utils'
import { getT } from '@/lib/i18n/server'

/** Notes attached to any entity (project, goal, workout …). */
export async function LinkedNotes({
  entityType,
  entityId,
}: {
  entityType: NoteEntityType
  entityId: string
}) {
  const t = await getT()
  const { supabase, user } = await getUserContext()
  const notes = await listNotesForEntity(supabase, user.id, entityType, entityId)
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('Notes')}</CardTitle>
        <Link
          href={`/notes/new?link=${entityType}:${entityId}`}
          className="text-primary inline-flex items-center gap-1 text-xs font-medium hover:underline"
        >
          <Plus className="size-3.5" /> {t('Add')}
        </Link>
      </CardHeader>
      <CardContent>
        {notes.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            {t('No notes yet. Capture ideas, research and decisions here.')}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {notes.map((n) => (
              <li key={n.id}>
                <Link
                  href={`/notes/${n.id}`}
                  className="hover:bg-accent flex gap-2 rounded-md p-1.5 text-sm"
                >
                  <NotebookPen
                    className="text-muted-foreground mt-0.5 size-4 shrink-0"
                    aria-hidden
                  />
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{n.title || 'Untitled'}</span>
                    {n.content_text && (
                      <span className="text-muted-foreground block truncate text-xs">
                        {truncate(n.content_text, 80)}
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
