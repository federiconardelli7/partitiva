import { create } from 'zustand'

export type Vista = 'registro' | 'bilancio'

interface UiState {
  vista: Vista
  setVista: (vista: Vista) => void
}

export const useUi = create<UiState>((set) => ({
  vista: 'registro',
  setVista: (vista) => set({ vista }),
}))
