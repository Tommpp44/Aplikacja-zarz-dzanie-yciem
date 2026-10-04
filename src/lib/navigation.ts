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
import { msg } from '@/lib/i18n/translate'

export type NavItem = { href: string; label: string; icon: LucideIcon }
export type NavGroup = { label?: string; items: NavItem[] }

export const NAV_GROUPS: NavGroup[] = [
  { items: [{ href: '/dashboard', label: msg('Dashboard'), icon: LayoutDashboard }] },
  {
    label: msg('Plan'),
    items: [
      { href: '/today', label: msg('Today'), icon: Sun },
      { href: '/tasks', label: msg('Tasks'), icon: CheckSquare },
      { href: '/calendar', label: msg('Calendar'), icon: CalendarDays },
      { href: '/projects', label: msg('Projects'), icon: FolderKanban },
    ],
  },
  { label: msg('Grow'), items: [{ href: '/goals', label: msg('Goals'), icon: Target }] },
  {
    label: msg('Routine'),
    items: [
      { href: '/habits', label: msg('Habits'), icon: Flame },
      { href: '/routines', label: msg('Routines'), icon: Repeat },
    ],
  },
  { label: msg('Money'), items: [{ href: '/finances', label: msg('Finances'), icon: Wallet }] },
  {
    label: msg('Body'),
    items: [
      { href: '/workouts', label: msg('Workouts'), icon: Dumbbell },
      { href: '/activity', label: msg('Activity'), icon: Footprints },
    ],
  },
  {
    label: msg('Mind'),
    items: [
      { href: '/notes', label: msg('Notes'), icon: NotebookPen },
      { href: '/journal', label: msg('Journal'), icon: BookOpen },
    ],
  },
  {
    label: msg('Insight'),
    items: [{ href: '/analytics', label: msg('Analytics'), icon: BarChart3 }],
  },
]

export const MORE_ITEMS: NavItem[] = [
  { href: '/shopping', label: msg('Shopping'), icon: ShoppingCart },
  { href: '/reviews', label: msg('Reviews'), icon: ClipboardCheck },
  { href: '/settings', label: msg('Settings'), icon: Settings },
]

export const ALL_NAV_ITEMS: NavItem[] = [...NAV_GROUPS.flatMap((g) => g.items), ...MORE_ITEMS]

export function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

export const LIST_ICON = ListChecks
