import 'server-only'
import { z } from 'zod'

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  CRON_SECRET: z.string().min(8).optional(),
  AI_PROVIDER: z.enum(['rules']).default('rules'),
  VAPID_PRIVATE_KEY: z.string().min(20).optional(),
  VAPID_SUBJECT: z.string().min(5).default('mailto:hello@lifeos.app'),
  SMTP_URL: z
    .string()
    .regex(/^smtps?:\/\//)
    .optional(),
  EMAIL_FROM: z.string().min(3).default('LifeOS <no-reply@lifeos.app>'),
})

/** Server-only secrets. Never import this module from client components. */
export const serverEnv = serverSchema.parse({
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || undefined,
  CRON_SECRET: process.env.CRON_SECRET || undefined,
  AI_PROVIDER: process.env.AI_PROVIDER || undefined,
  VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY || undefined,
  VAPID_SUBJECT: process.env.VAPID_SUBJECT || undefined,
  SMTP_URL: process.env.SMTP_URL || undefined,
  EMAIL_FROM: process.env.EMAIL_FROM || undefined,
})
