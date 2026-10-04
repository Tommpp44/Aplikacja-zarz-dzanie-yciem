'use client'

import { create } from 'zustand'

/**
 * Global client state — only for app-wide overlays that any component can open
 * (quick capture, command palette). Everything else stays local or on the server.
 */
export type CaptureKind = 'task' | 'expense' | 'habit' | 'workout' | 'note' | 'event' | 'goal'

type UIState = {
  capture: CaptureKind | null
  captureMenuOpen: boolean
  commandOpen: boolean
  openCapture: (kind: CaptureKind) => void
  closeCapture: () => void
  setCaptureMenuOpen: (open: boolean) => void
  setCommandOpen: (open: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  capture: null,
  captureMenuOpen: false,
  commandOpen: false,
  openCapture: (kind) => set({ capture: kind, captureMenuOpen: false, commandOpen: false }),
  closeCapture: () => set({ capture: null }),
  setCaptureMenuOpen: (open) => set({ captureMenuOpen: open }),
  setCommandOpen: (open) => set({ commandOpen: open }),
}))
