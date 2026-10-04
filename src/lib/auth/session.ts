import 'server-only'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { DB } from '@/lib/db/types'
import type { AccessLevel } from './access'

export type SessionContext = {
  supabase: DB
  user: { id: string; email: string | null }
}

/** Current user (deduplicated per request). Validates the JWT with Supabase Auth. */
export const getSession = cache(async (): Promise<SessionContext | null> => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  return { supabase, user: { id: user.id, email: user.email ?? null } }
})

export async function requireUser(): Promise<SessionContext> {
  const session = await getSession()
  if (!session) redirect('/login')
  return session
}

export async function getAccessLevel(): Promise<AccessLevel> {
  const session = await getSession()
  if (!session) return 'anonymous'
  const { data } = await session.supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()
  return data?.role === 'admin' ? 'admin' : 'authenticated'
}
