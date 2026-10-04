import { z } from 'zod'
import { msg } from '@/lib/i18n/translate'

export const NOTE_ENTITY_TYPES = [
  'project',
  'goal',
  'workout',
  'task',
  'transaction',
  'account',
  'journal_entry',
  'habit',
  'event',
] as const
export type NoteEntityType = (typeof NOTE_ENTITY_TYPES)[number]

export const ENTITY_LABELS: Record<NoteEntityType, string> = {
  project: msg('Project'),
  goal: msg('Goal'),
  workout: msg('Workout'),
  task: msg('Task'),
  transaction: msg('Transaction'),
  account: msg('Account'),
  journal_entry: msg('Journal'),
  habit: msg('Habit'),
  event: msg('Event'),
}

export function entityHref(type: NoteEntityType, id: string) {
  switch (type) {
    case 'project':
      return `/projects/${id}`
    case 'goal':
      return `/goals/${id}`
    case 'workout':
      return `/workouts/${id}`
    case 'habit':
      return `/habits/${id}`
    case 'task':
      return `/tasks?task=${id}`
    case 'account':
    case 'transaction':
      return `/finances/transactions`
    case 'journal_entry':
      return `/journal`
    case 'event':
      return `/calendar`
  }
}

export const linkSchema = z.object({ entity_type: z.enum(NOTE_ENTITY_TYPES), entity_id: z.uuid() })

export const saveNoteSchema = z.object({
  id: z.uuid().optional(),
  title: z.string().trim().max(200),
  content: z.string().max(500000),
  content_text: z.string().max(200000),
  pinned: z.boolean().optional(),
  tag_names: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
  link: linkSchema.optional(),
})

/** Strips HTML to plain text for search and previews (server-side, no DOM). */
export function htmlToText(html: string) {
  return html
    .replace(/<(br|\/p|\/h[1-6]|\/li|\/blockquote)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
