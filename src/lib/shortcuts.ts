import { msg } from '@/lib/i18n/translate'

/** "g" followed by a key jumps to a section (Gmail/Linear style). */
export const GOTO_SHORTCUTS: { key: string; href: string; label: string }[] = [
  { key: 'd', href: '/dashboard', label: msg('Dashboard') },
  { key: 'y', href: '/today', label: msg('Today') },
  { key: 't', href: '/tasks', label: msg('Tasks') },
  { key: 'p', href: '/projects', label: msg('Projects') },
  { key: 'g', href: '/goals', label: msg('Goals') },
  { key: 'h', href: '/habits', label: msg('Habits') },
  { key: 'f', href: '/finances', label: msg('Finances') },
  { key: 'c', href: '/calendar', label: msg('Calendar') },
  { key: 'w', href: '/workouts', label: msg('Workouts') },
  { key: 'n', href: '/notes', label: msg('Notes') },
  { key: 'j', href: '/journal', label: msg('Journal') },
  { key: 'r', href: '/reviews', label: msg('Reviews') },
  { key: 's', href: '/settings', label: msg('Settings') },
]

export function gotoHref(key: string) {
  return GOTO_SHORTCUTS.find((s) => s.key === key.toLowerCase())?.href ?? null
}

/** True when the keystroke belongs to a text field rather than to the app. */
export function isTypingTarget(target: EventTarget | null) {
  const el = target as HTMLElement | null
  return Boolean(
    el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)),
  )
}
