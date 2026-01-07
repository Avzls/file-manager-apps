import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { FileInfo } from '@shared/types'

interface FavoritesState {
  favorites: string[] // Array of file paths
  
  // Actions
  addFavorite: (path: string) => void
  removeFavorite: (path: string) => void
  toggleFavorite: (path: string) => void
  isFavorite: (path: string) => boolean
  clearFavorites: () => void
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],

      addFavorite: (path) => {
        const current = get().favorites
        if (!current.includes(path)) {
          set({ favorites: [...current, path] })
        }
      },

      removeFavorite: (path) => {
        set({ favorites: get().favorites.filter(p => p !== path) })
      },

      toggleFavorite: (path) => {
        const current = get().favorites
        if (current.includes(path)) {
          set({ favorites: current.filter(p => p !== path) })
        } else {
          set({ favorites: [...current, path] })
        }
      },

      isFavorite: (path) => {
        return get().favorites.includes(path)
      },

      clearFavorites: () => set({ favorites: [] })
    }),
    {
      name: 'file-manager-favorites'
    }
  )
)
