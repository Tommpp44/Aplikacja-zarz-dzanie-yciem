'use server'

import { z } from 'zod'
import { authedAction, idSchema } from '@/lib/action'
import { DataError, unwrap } from '@/lib/db/errors'
import { getUserContext } from '@/lib/settings/service'

const text = z.string().trim().max(10000).nullable().optional()

export const saveJournalEntry = authedAction(
  z.object({
    entry_date: z.iso.date(),
    mood: z.number().int().min(1).max(5).nullable().optional(),
    today_text: text,
    tomorrow_text: text,
    went_well: text,
    could_be_better: text,
  }),
  {
    name: 'saveJournalEntry',
    failureMessage: "We couldn't save your entry. Your text is still here — please try again.",
  },
  async (input, { supabase, user }) => {
    const { today } = await getUserContext()
    if (input.entry_date > today)
      throw new DataError("You can't write a journal entry for a future date.")
    unwrap(
      await supabase.from('journal_entries').upsert(
        {
          user_id: user.id,
          entry_date: input.entry_date,
          mood: input.mood ?? null,
          today_text: input.today_text || null,
          tomorrow_text: input.tomorrow_text || null,
          went_well: input.went_well || null,
          could_be_better: input.could_be_better || null,
        },
        { onConflict: 'user_id,entry_date' },
      ),
      'save your entry',
    )
  },
)

export const deleteJournalEntry = authedAction(
  idSchema,
  { name: 'deleteJournalEntry' },
  async ({ id }, { supabase, user }) => {
    unwrap(
      await supabase.from('journal_entries').delete().eq('user_id', user.id).eq('id', id),
      'delete this entry',
    )
  },
)
