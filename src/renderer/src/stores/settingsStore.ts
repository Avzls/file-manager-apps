import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
  // Paths - now supports multiple root paths
  rootPaths: string[]
  
  // Appearance
  theme: 'light' | 'dark' | 'system'
  viewMode: 'grid' | 'list'
  thumbnailSize: 'small' | 'medium' | 'large'
  
  // Behavior
  indexOnStartup: boolean
  showHiddenFiles: boolean
  
  // Recent
  recentPaths: string[]
  
  // Actions
  addRootPath: (path: string) => void
  removeRootPath: (path: string) => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  setViewMode: (mode: 'grid' | 'list') => void
  setThumbnailSize: (size: 'small' | 'medium' | 'large') => void
  setIndexOnStartup: (value: boolean) => void
  setShowHiddenFiles: (value: boolean) => void
  addRecentPath: (path: string) => void
  clearRecentPaths: () => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      rootPaths: ['D:\\coba'],
      theme: 'dark',
      viewMode: 'grid',
      thumbnailSize: 'medium',
      indexOnStartup: false,
      showHiddenFiles: false,
      recentPaths: [],

      addRootPath: (path) => {
        const current = get().rootPaths
        if (!current.includes(path)) {
          set({ rootPaths: [...current, path] })
        }
      },
      removeRootPath: (path) => {
        set({ rootPaths: get().rootPaths.filter(p => p !== path) })
      },
      setTheme: (theme) => {
        set({ theme })
        // Apply theme to document
        if (theme === 'dark') {
          document.documentElement.classList.add('dark')
        } else if (theme === 'light') {
          document.documentElement.classList.remove('dark')
        } else {
          // System preference
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
          if (prefersDark) {
            document.documentElement.classList.add('dark')
          } else {
            document.documentElement.classList.remove('dark')
          }
        }
      },
      setViewMode: (mode) => set({ viewMode: mode }),
      setThumbnailSize: (size) => set({ thumbnailSize: size }),
      setIndexOnStartup: (value) => set({ indexOnStartup: value }),
      setShowHiddenFiles: (value) => set({ showHiddenFiles: value }),
      addRecentPath: (path) => {
        const current = get().recentPaths
        const filtered = current.filter(p => p !== path)
        set({ recentPaths: [path, ...filtered].slice(0, 10) })
      },
      clearRecentPaths: () => set({ recentPaths: [] })
    }),
    {
      name: 'file-manager-settings'
    }
  )
)

// Initialize theme on load
export function initializeTheme(): void {
  const theme = useSettingsStore.getState().theme
  if (theme === 'dark') {
    document.documentElement.classList.add('dark')
  } else if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    if (prefersDark) {
      document.documentElement.classList.add('dark')
    }
  }
}
