import { msg } from '@/lib/i18n/translate'

export const SETTINGS_SECTIONS = [
  { id: 'profile', label: msg('Profile'), description: msg('Your name and sign-in email.') },
  {
    id: 'preferences',
    label: msg('Preferences'),
    description: msg('Currency, timezone, week start, date format and units.'),
  },
  { id: 'appearance', label: msg('Appearance'), description: msg('Theme and accent colour.') },
  {
    id: 'notifications',
    label: msg('Notifications'),
    description: msg('Choose what deserves your attention.'),
  },
  {
    id: 'privacy',
    label: msg('Privacy'),
    description: msg('Export your data or delete your account.'),
  },
  { id: 'security', label: msg('Security'), description: msg('Password and sessions.') },
  { id: 'data', label: msg('Data'), description: msg('Import and export.') },
  { id: 'integrations', label: msg('Integrations'), description: msg('Connect other services.') },
  { id: 'billing', label: msg('Billing'), description: msg('Your plan.') },
] as const

export type SettingsSectionId = (typeof SETTINGS_SECTIONS)[number]['id']
