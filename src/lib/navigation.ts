import {
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckSquare,
  ClipboardCheck,
  Dumbbell,
  Flame,
  FolderKanban,
  Footprints,
  LayoutDashboard,
  ListChecks,
  NotebookPen,
  Repeat,
  Settings,
  ShoppingCart,
  Sun,
  Target,
  Wallet,
  type LucideIcon,
} from 'lucide-react'

export type NavItem = { href: string; label: string; icon: LucideIcon }
export type NavGroup = { label?: string; items: NavItem[] }

export const NAV_GROUPS: NavGroup[] = [
  { items: [{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }] },
  {
    label: 'Plan',
    items: [
      { href: '/today', label: 'Today', icon: Sun },
      { href: '/tasks', label: 'Tasks', icon: CheckSquare },
      { href: '/calendar', label: 'Calendar', icon: CalendarDays },
      { href: '/projects', label: 'Projects', icon: FolderKanban },
    ],
  },
  { label: 'Grow', items: [{ href: '/goals', label: 'Goals', icon: Target }] },
  {
    label: 'Routine',
    items: [
      { href: '/habits', label: 'Habits', icon: Flame },
      { href: '/routines', label: 'Routines', icon: Repeat },
    ],
  },
  { label: 'Money', items: [{ href: '/finances', label: 'Finances', icon: Wallet }] },
  {
    label: 'Body',
    items: [
      { href: '/workouts', label: 'Workouts', icon: Dumbbell },
      { href: '/activity', label: 'Activity', icon: Footprints },
    ],
  },
  {
    label: 'Mind',
    items: [
      { href: '/notes', label: 'Notes', icon: NotebookPen },
      { href: '/journal', label: 'Journal', icon: BookOpen },
    ],
  },
  { label: 'Insight', items: [{ href: '/analytics', label: 'Analytics', icon: BarChart3 }] },
]

export const MORE_ITEMS: NavItem[] = [
  { href: '/shopping', label: 'Shopping', icon: ShoppingCart },
  { href: '/reviews', label: 'Reviews', icon: ClipboardCheck },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export const ALL_NAV_ITEMS: NavItem[] = [...NAV_GROUPS.flatMap((g) => g.items), ...MORE_ITEMS]

export function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

export const LIST_ICON = ListChecks
