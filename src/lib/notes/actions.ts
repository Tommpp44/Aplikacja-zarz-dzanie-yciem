'use server'

import { z } from 'zod'
import { authedAction, idSchema } from '@/lib/action'
import { unwrap } from '@/lib/db/errors'
import { htmlToText, linkSchema, saveNoteSchema } from './schemas'

async function setNoteTags(
  db: Parameters<Parameters<typeof authedAction>[2]>[1]['supabase'],
  userId: string,
  noteId: string,
  names: string[],
) {
  const unique = [...new Set(names.map((n) => n.trim().toLowerCase()).filter(Boolean))]
  unwrap(
    await db.from('note_tags').delete().eq('user_id', userId).eq('note_id', noteId),
    'update tags',
  )
  if (!unique.length) return
  const tags = unwrap(
    await db
      .from('tags')
      .upsert(
        unique.map((name) => ({ name, user_id: userId })),
        { onConflict: 'user_id,name' },
      )
      .select('id'),
    'save tags',
  )
  unwrap(
    await db
      .from('note_tags')
      .insert(tags.map((t) => ({ note_id: noteId, tag_id: t.id, user_id: userId }))),
    'link tags',
  )
}

export const saveNote = authedAction(
  saveNoteSchema,
  {
    name: 'saveNote',
    failureMessage: "We couldn't save this note. Your text is still here — please try again.",
  },
  async (input, { supabase, user }) => {
    // content_text is recomputed on the server; never trust the client projection.
    const values = {
      title: input.title,
      content: input.content,
      content_text: htmlToText(input.content).slice(0, 200000),
      ...(input.pinned !== undefined ? { pinned: input.pinned } : {}),
    }
    let id = input.id
    if (id) {
      unwrap(
        await supabase.from('notes').update(values).eq('user_id', user.id).eq('id', id),
        'save this note',
      )
    } else {
      const row = unwrap(
        await supabase
          .from('notes')
          .insert({ ...values, user_id: user.id })
          .select('id')
          .single(),
        'save this note',
      )
      id = row.id
    }
    if (input.tag_names) await setNoteTags(supabase, user.id, id, input.tag_names)
    if (input.link) {
      unwrap(
        await supabase
          .from('note_links')
          .upsert(
            { note_id: id, user_id: user.id, ...input.link },
            { onConflict: 'note_id,entity_type,entity_id' },
          ),
        'link this note',
      )
    }
    return { id }
  },
)

export const linkNote = authedAction(
  linkSchema.extend({ note_id: z.uuid() }),
  { name: 'linkNote' },
  async (input, { supabase, user }) => {
    unwrap(
      await supabase
        .from('note_links')
        .upsert({ ...input, user_id: user.id }, { onConflict: 'note_id,entity_type,entity_id' }),
      'link this note',
    )
  },
)

export const unlinkNote = authedAction(
  idSchema,
  { name: 'unlinkNote' },
  async ({ id }, { supabase, user }) => {
    unwrap(
      await supabase.from('note_links').delete().eq('user_id', user.id).eq('id', id),
      'remove the link',
    )
  },
)

export const setNoteArchived = authedAction(
  z.object({ id: z.uuid(), archived: z.boolean() }),
  { name: 'setNoteArchived' },
  async ({ id, archived }, { supabase, user }) => {
    unwrap(
      await supabase
        .from('notes')
        .update({ archived_at: archived ? new Date().toISOString() : null })
        .eq('user_id', user.id)
        .eq('id', id),
      'update this note',
    )
  },
)

export const togglePinNote = authedAction(
  z.object({ id: z.uuid(), pinned: z.boolean() }),
  { name: 'togglePinNote' },
  async ({ id, pinned }, { supabase, user }) => {
    unwrap(
      await supabase.from('notes').update({ pinned }).eq('user_id', user.id).eq('id', id),
      'update this note',
    )
  },
)

export const deleteNote = authedAction(
  idSchema,
  { name: 'deleteNote' },
  async ({ id }, { supabase, user }) => {
    unwrap(
      await supabase.from('notes').delete().eq('user_id', user.id).eq('id', id),
      'delete this note',
    )
  },
)

/** Entities a note can be linked to, for the link picker. */
export const searchLinkTargets = authedAction(
  z.object({ query: z.string().trim().max(100) }),
  { name: 'searchLinkTargets', revalidate: [] },
  async ({ query }, { supabase, user }) => {
    const like = `%${query.replace(/[\\%_]/g, (c) => `\\${c}`)}%`
    const [projects, goals, tasks, habits, workouts] = await Promise.all([
      supabase
        .from('projects')
        .select('id, name')
        .eq('user_id', user.id)
        .ilike('name', like)
        .limit(5),
      supabase
        .from('goals')
        .select('id, title')
        .eq('user_id', user.id)
        .ilike('title', like)
        .limit(5),
      supabase
        .from('tasks')
        .select('id, title')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .ilike('title', like)
        .limit(5),
      supabase
        .from('habits')
        .select('id, name')
        .eq('user_id', user.id)
        .ilike('name', like)
        .limit(5),
      supabase
        .from('workouts')
        .select('id, name, performed_on')
        .eq('user_id', user.id)
        .ilike('name', like)
        .order('performed_on', { ascending: false })
        .limit(5),
    ])
    return [
      ...(projects.data ?? []).map((r) => ({ type: 'project' as const, id: r.id, label: r.name })),
      ...(goals.data ?? []).map((r) => ({ type: 'goal' as const, id: r.id, label: r.title })),
      ...(tasks.data ?? []).map((r) => ({ type: 'task' as const, id: r.id, label: r.title })),
      ...(habits.data ?? []).map((r) => ({ type: 'habit' as const, id: r.id, label: r.name })),
      ...(workouts.data ?? []).map((r) => ({
        type: 'workout' as const,
        id: r.id,
        label: `${r.name} · ${r.performed_on}`,
      })),
    ]
  },
)
