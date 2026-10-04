export const SETTINGS_SECTIONS = [
  { id: 'profile', label: 'Profile', description: 'Your name and sign-in email.' },
  {
    id: 'preferences',
    label: 'Preferences',
    description: 'Currency, timezone, week start, date format and units.',
  },
  { id: 'appearance', label: 'Appearance', description: 'Theme and accent colour.' },
  {
    id: 'notifications',
    label: 'Notifications',
    description: 'Choose what deserves your attention.',
  },
  { id: 'privacy', label: 'Privacy', description: 'Export your data or delete your account.' },
  { id: 'security', label: 'Security', description: 'Password and sessions.' },
  { id: 'data', label: 'Data', description: 'Import and export.' },
  { id: 'integrations', label: 'Integrations', description: 'Connect other services.' },
  { id: 'billing', label: 'Billing', description: 'Your plan.' },
] as const

export type SettingsSectionId = (typeof SETTINGS_SECTIONS)[number]['id']
