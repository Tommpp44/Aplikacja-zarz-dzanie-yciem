import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'LifeOS',
    short_name: 'LifeOS',
    description:
      'Your personal operating system — tasks, goals, habits, money and training in one place.',
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    background_color: '#fafafb',
    theme_color: '#4f46e5',
    categories: ['productivity', 'finance', 'health', 'lifestyle'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Today', url: '/today' },
      { name: 'Add task', url: '/tasks?view=inbox' },
      { name: 'Finances', url: '/finances' },
      { name: 'Habits', url: '/habits' },
    ],
  }
}
