import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface RecentFile {
  path: string
  name: string
  category: string
  openedAt: string
}

interface RecentFilesState {
  recentFiles: RecentFile[]
  maxRecent: number
  
  // Actions
  addRecentFile: (file: { path: string; name: string; category: string }) => void
  removeRecentFile: (path: string) => void
  clearRecentFiles: () => void
}

export const useRecentFilesStore = create<RecentFilesState>()(
  persist(
    (set, get) => ({
      recentFiles: [],
      maxRecent: 20,
      
      addRecentFile: (file) => {
        const { recentFiles, maxRecent } = get()
        
        // Remove if already exists
        const filtered = recentFiles.filter(f => f.path !== file.path)
        
        // Add to beginning
        const newRecent: RecentFile = {
          ...file,
          openedAt: new Date().toISOString()
        }
        
        // Keep max limit
        const updated = [newRecent, ...filtered].slice(0, maxRecent)
        
        set({ recentFiles: updated })
      },
      
      removeRecentFile: (path) => {
        set(state => ({
          recentFiles: state.recentFiles.filter(f => f.path !== path)
        }))
      },
      
      clearRecentFiles: () => {
        set({ recentFiles: [] })
      }
    }),
    {
      name: 'recent-files-storage'
    }
  )
)
