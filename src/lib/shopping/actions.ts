'use server'

import { z } from 'zod'
import { authedAction, idSchema } from '@/lib/action'
import { unwrap } from '@/lib/db/errors'
import { guessShoppingCategory, parseShoppingItem } from './parse'

export const createShoppingList = authedAction(
  z.object({ name: z.string().trim().min(1, 'Name the list').max(120) }),
  { name: 'createShoppingList' },
  async ({ name }, { supabase, user }) => {
    const row = unwrap(
      await supabase
        .from('shopping_lists')
        .insert({ name, user_id: user.id })
        .select('id')
        .single(),
      'create the list',
    )
    return { id: row.id }
  },
)

export const renameShoppingList = authedAction(
  z.object({ id: z.uuid(), name: z.string().trim().min(1).max(120) }),
  { name: 'renameShoppingList' },
  async ({ id, name }, { supabase, user }) => {
    unwrap(
      await supabase.from('shopping_lists').update({ name }).eq('user_id', user.id).eq('id', id),
      'rename the list',
    )
  },
)

export const deleteShoppingList = authedAction(
  idSchema,
  { name: 'deleteShoppingList' },
  async ({ id }, { supabase, user }) => {
    unwrap(
      await supabase.from('shopping_lists').delete().eq('user_id', user.id).eq('id', id),
      'delete the list',
    )
  },
)

export const addShoppingItem = authedAction(
  z.object({ list_id: z.uuid(), text: z.string().trim().min(1, 'Type an item').max(200) }),
  { name: 'addShoppingItem' },
  async ({ list_id, text }, { supabase, user }) => {
    const parsed = parseShoppingItem(text)
    const { count } = await supabase
      .from('shopping_items')
      .select('id', { count: 'exact', head: true })
      .eq('list_id', list_id)
    unwrap(
      await supabase.from('shopping_items').insert({
        list_id,
        user_id: user.id,
        name: parsed.name.slice(0, 200),
        quantity: parsed.quantity,
        unit: parsed.unit,
        category: guessShoppingCategory(parsed.name),
        position: count ?? 0,
      }),
      'add the item',
    )
  },
)

export const toggleShoppingItem = authedAction(
  z.object({ id: z.uuid(), purchased: z.boolean() }),
  { name: 'toggleShoppingItem' },
  async ({ id, purchased }, { supabase, user }) => {
    unwrap(
      await supabase
        .from('shopping_items')
        .update({ purchased, purchased_at: purchased ? new Date().toISOString() : null })
        .eq('user_id', user.id)
        .eq('id', id),
      'update the item',
    )
  },
)

export const deleteShoppingItem = authedAction(
  idSchema,
  { name: 'deleteShoppingItem' },
  async ({ id }, { supabase, user }) => {
    unwrap(
      await supabase.from('shopping_items').delete().eq('user_id', user.id).eq('id', id),
      'remove the item',
    )
  },
)

export const clearPurchased = authedAction(
  z.object({ list_id: z.uuid() }),
  { name: 'clearPurchased' },
  async ({ list_id }, { supabase, user }) => {
    unwrap(
      await supabase
        .from('shopping_items')
        .delete()
        .eq('user_id', user.id)
        .eq('list_id', list_id)
        .eq('purchased', true),
      'clear purchased items',
    )
  },
)
