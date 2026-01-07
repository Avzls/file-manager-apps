import { create } from 'zustand'

interface ScanProgress {
  current: string
  count: number
}

interface ScanResult {
  totalFiles: number
  totalFolders: number
  durationMs: number
}

interface IndexStats {
  totalFiles: number
  totalFolders: number
  lastScan: string | null
}

interface IndexState {
  // State
  isScanning: boolean
  progress: ScanProgress | null
  stats: IndexStats | null
  error: string | null
  
  // Actions
  setIsScanning: (isScanning: boolean) => void
  setProgress: (progress: ScanProgress | null) => void
  setStats: (stats: IndexStats | null) => void
  setError: (error: string | null) => void
  
  // Operations
  startScan: (rootPath: string) => Promise<ScanResult | null>
  loadStats: () => Promise<void>
}

export const useIndexStore = create<IndexState>((set, get) => ({
  isScanning: false,
  progress: null,
  stats: null,
  error: null,

  setIsScanning: (isScanning) => set({ isScanning }),
  setProgress: (progress) => set({ progress }),
  setStats: (stats) => set({ stats }),
  setError: (error) => set({ error }),

  startScan: async (rootPath) => {
    set({ isScanning: true, progress: null, error: null })
    
    // Setup progress listener
    const cleanup = window.api.onIndexProgress((data) => {
      set({ progress: data })
    })

    try {
      const result = await window.api.indexScan(rootPath)
      set({ isScanning: false, progress: null })
      
      // Refresh stats
      await get().loadStats()
      
      cleanup()
      return result
    } catch (error) {
      set({ 
        isScanning: false, 
        progress: null,
        error: error instanceof Error ? error.message : 'Scan failed' 
      })
      cleanup()
      return null
    }
  },

  loadStats: async () => {
    try {
      const stats = await window.api.indexGetStats()
      set({ stats })
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }
}))
