'use client'

import { useTheme } from 'next-themes'
import { useEffect } from 'react'

/** Applies the theme stored in the user's preferences (synced across devices). */
export function ThemeSync({
  theme,
  accent,
}: {
  theme: 'light' | 'dark' | 'system'
  accent: string
}) {
  const { setTheme } = useTheme()
  useEffect(() => {
    setTheme(theme)
  }, [theme, setTheme])
  useEffect(() => {
    document.documentElement.dataset.accent = accent
    document.cookie = `lifeos-accent=${accent}; path=/; max-age=31536000; samesite=lax`
  }, [accent])
  return null
}
