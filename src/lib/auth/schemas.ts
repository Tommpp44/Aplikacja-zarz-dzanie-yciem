import { z } from 'zod'
import { msg } from '@/lib/i18n/translate'

export const emailSchema = z.email(msg('Enter a valid email address')).trim().toLowerCase().max(254)
export const passwordSchema = z
  .string()
  .min(8, msg('Use at least 8 characters'))
  .max(72, msg('Use at most 72 characters'))

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, msg('Enter your password')).max(72),
  next: z.string().max(500).optional(),
})

export const signUpSchema = z.object({
  display_name: z.string().trim().min(1, msg('Enter your name')).max(80),
  email: emailSchema,
  password: passwordSchema,
  timezone: z.string().max(64).optional(),
})

export const magicLinkSchema = z.object({
  email: emailSchema,
  next: z.string().max(500).optional(),
})
export const resetRequestSchema = z.object({ email: emailSchema })
export const newPasswordSchema = z
  .object({ password: passwordSchema, confirm: z.string() })
  .refine((v) => v.password === v.confirm, {
    message: msg('Passwords do not match'),
    path: ['confirm'],
  })
