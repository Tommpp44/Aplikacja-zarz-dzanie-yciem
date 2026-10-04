import { z } from 'zod'
import { msg } from '@/lib/i18n/translate'

/**
 * Optional form field: accepts '' (empty input / "None" option), null or
 * undefined and normalises blanks to null. Keeps precise input/output types
 * for React Hook Form.
 */
export function blankable<T extends z.ZodType>(schema: T) {
  return z
    .union([z.literal(''), schema])
    .nullable()
    .optional()
    .transform((v) => (v === '' ? null : v) as z.output<T> | null | undefined)
}

export const optionalUuid = blankable(z.uuid())
export const optionalDate = blankable(z.iso.date())
export const optionalTime = blankable(z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, msg('Use HH:MM')))
