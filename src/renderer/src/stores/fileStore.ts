import { create } from 'zustand'
import { FileInfo, FileCategory } from '@shared/types'

interface FileState {
  // Current path and files
  currentPath: string
  files: FileInfo[]
  selectedFile: FileInfo | null
  selectedFiles: FileInfo[]  // Multi-select
  lastSelectedIndex: number | null  // For shift+click
  
  // Category filter
  categoryFilter: FileCategory | null
  
  // Navigation history
  history: string[]
  historyIndex: number
  
  // Loading states
  isLoading: boolean
  error: string | null
  
  // View settings
  viewMode: 'grid' | 'list'
  sortBy: 'name' | 'date' | 'size' | 'type'
  sortOrder: 'asc' | 'desc'
  
  // Actions
  setCurrentPath: (path: string) => void
  setFiles: (files: FileInfo[]) => void
  setSelectedFile: (file: FileInfo | null) => void
  setCategoryFilter: (category: FileCategory | null) => void
  setIsLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setViewMode: (mode: 'grid' | 'list') => void
  setSortBy: (sort: 'name' | 'date' | 'size' | 'type') => void
  setSortOrder: (order: 'asc' | 'desc') => void
  
  // Multi-select actions
  toggleFileSelection: (file: FileInfo, ctrlKey: boolean, shiftKey: boolean) => void
  selectAll: () => void
  clearSelection: () => void
  isFileSelected: (file: FileInfo) => boolean
  
  // Computed - filtered files
  getFilteredFiles: () => FileInfo[]
  
  // Navigation
  navigateTo: (path: string) => void
  goBack: () => void
  goForward: () => void
  canGoBack: () => boolean
  canGoForward: () => boolean
  
  // File operations
  loadDirectory: (path: string) => Promise<void>
  openFile: (file: FileInfo) => Promise<void>
  openInExplorer: (file: FileInfo) => Promise<void>
}

const DEFAULT_PATH = 'D:\\coba'

export const useFileStore = create<FileState>((set, get) => ({
  currentPath: DEFAULT_PATH,
  files: [],
  selectedFile: null,
  selectedFiles: [],
  lastSelectedIndex: null,
  categoryFilter: null,
  history: [DEFAULT_PATH],
  historyIndex: 0,
  isLoading: false,
  error: null,
  viewMode: 'grid',
  sortBy: 'name',
  sortOrder: 'asc',

  setCurrentPath: (path) => set({ currentPath: path }),
  setFiles: (files) => set({ files, selectedFiles: [], lastSelectedIndex: null }),
  setSelectedFile: (file) => set({ selectedFile: file }),
  setCategoryFilter: (category) => set({ categoryFilter: category }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setSortBy: (sort) => set({ sortBy: sort }),
  setSortOrder: (order) => set({ sortOrder: order }),

  // Multi-select methods
  toggleFileSelection: (file, ctrlKey, shiftKey) => {
    const { selectedFiles, getFilteredFiles, lastSelectedIndex } = get()
    const files = getFilteredFiles()
    const fileIndex = files.findIndex(f => f.id === file.id)
    
    if (shiftKey && lastSelectedIndex !== null) {
      // Shift+click: select range
      const start = Math.min(lastSelectedIndex, fileIndex)
      const end = Math.max(lastSelectedIndex, fileIndex)
      const rangeFiles = files.slice(start, end + 1)
      set({ 
        selectedFiles: rangeFiles,
        selectedFile: file
      })
    } else if (ctrlKey) {
      // Ctrl+click: toggle individual
      const isSelected = selectedFiles.some(f => f.id === file.id)
      if (isSelected) {
        set({ 
          selectedFiles: selectedFiles.filter(f => f.id !== file.id),
          lastSelectedIndex: fileIndex,
          selectedFile: file
        })
      } else {
        set({ 
          selectedFiles: [...selectedFiles, file],
          lastSelectedIndex: fileIndex,
          selectedFile: file
        })
      }
    } else {
      // Normal click: single select
      set({ 
        selectedFiles: [file],
        lastSelectedIndex: fileIndex,
        selectedFile: file
      })
    }
  },

  selectAll: () => {
    const files = get().getFilteredFiles()
    set({ selectedFiles: files })
  },

  clearSelection: () => {
    set({ selectedFiles: [], lastSelectedIndex: null })
  },

  isFileSelected: (file) => {
    return get().selectedFiles.some(f => f.id === file.id)
  },

  getFilteredFiles: () => {
    const { files, categoryFilter, sortBy, sortOrder } = get()
    
    // Filter by category
    let filtered = categoryFilter 
      ? files.filter(f => f.category === categoryFilter)
      : [...files]
    
    // Sort files (directories first, then by selected criteria)
    filtered.sort((a, b) => {
      // Directories always first
      if (a.isDirectory && !b.isDirectory) return -1
      if (!a.isDirectory && b.isDirectory) return 1
      
      let comparison = 0
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'date':
          comparison = new Date(a.modifiedAt).getTime() - new Date(b.modifiedAt).getTime()
          break
        case 'size':
          comparison = (a.size || 0) - (b.size || 0)
          break
        case 'type':
          comparison = a.extension.localeCompare(b.extension)
          break
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })
    
    return filtered
  },

  navigateTo: (path) => {
    const { history, historyIndex } = get()
    const newHistory = [...history.slice(0, historyIndex + 1), path]
    set({
      currentPath: path,
      history: newHistory,
      historyIndex: newHistory.length - 1
    })
    get().loadDirectory(path)
    
    // Sync with tabs store (import at top of file)
    import('./tabsStore').then(({ useTabsStore }) => {
      const tabsState = useTabsStore.getState()
      if (tabsState.activeTabId) {
        tabsState.updateTabPath(tabsState.activeTabId, path)
      }
    })
  },

  goBack: () => {
    const { history, historyIndex } = get()
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      set({ 
        historyIndex: newIndex,
        currentPath: history[newIndex]
      })
      get().loadDirectory(history[newIndex])
    }
  },

  goForward: () => {
    const { history, historyIndex } = get()
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      set({ 
        historyIndex: newIndex,
        currentPath: history[newIndex]
      })
      get().loadDirectory(history[newIndex])
    }
  },

  canGoBack: () => get().historyIndex > 0,
  canGoForward: () => get().historyIndex < get().history.length - 1,

  loadDirectory: async (path) => {
    set({ isLoading: true, error: null })
    try {
      const files = await window.api.scanDirectory(path)
      set({ files, currentPath: path, isLoading: false })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load directory',
        isLoading: false 
      })
    }
  },

  openFile: async (file) => {
    if (file.isDirectory) {
      get().navigateTo(file.path)
    } else {
      await window.api.openFile(file.path)
    }
  },

  openInExplorer: async (file) => {
    await window.api.openFolder(file.path)
  }
}))
