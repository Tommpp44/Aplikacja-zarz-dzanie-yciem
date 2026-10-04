/** "g" followed by a key jumps to a section (Gmail/Linear style). */
export const GOTO_SHORTCUTS: { key: string; href: string; label: string }[] = [
  { key: 'd', href: '/dashboard', label: 'Dashboard' },
  { key: 'y', href: '/today', label: 'Today' },
  { key: 't', href: '/tasks', label: 'Tasks' },
  { key: 'p', href: '/projects', label: 'Projects' },
  { key: 'g', href: '/goals', label: 'Goals' },
  { key: 'h', href: '/habits', label: 'Habits' },
  { key: 'f', href: '/finances', label: 'Finances' },
  { key: 'c', href: '/calendar', label: 'Calendar' },
  { key: 'w', href: '/workouts', label: 'Workouts' },
  { key: 'n', href: '/notes', label: 'Notes' },
  { key: 'j', href: '/journal', label: 'Journal' },
  { key: 'r', href: '/reviews', label: 'Reviews' },
  { key: 's', href: '/settings', label: 'Settings' },
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
