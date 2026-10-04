'use server'

import { z } from 'zod'
import { authedAction, idSchema } from '@/lib/action'
import * as repo from './repository'
import { projectSchema } from './schemas'

export const createProject = authedAction(
  projectSchema,
  { name: 'createProject' },
  async (input, { supabase, user }) => {
    const project = await repo.insertProject(supabase, user.id, {
      ...input,
      description: input.description || null,
    })
    return { id: project.id }
  },
)

export const updateProject = authedAction(
  projectSchema.partial().extend({ id: z.uuid() }),
  { name: 'updateProject' },
  async ({ id, ...input }, { supabase, user }) => {
    await repo.updateProject(supabase, user.id, id, input)
    return { id }
  },
)

export const deleteProject = authedAction(
  idSchema,
  { name: 'deleteProject' },
  async ({ id }, { supabase, user }) => {
    await repo.deleteProject(supabase, user.id, id)
  },
)
