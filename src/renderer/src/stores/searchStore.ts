import { create } from 'zustand'
import { FileInfo, SearchResult } from '@shared/types'

interface SearchState {
  query: string
  results: FileInfo[]
  isSearching: boolean
  useIndexedSearch: boolean
  
  // Filters
  selectedCategories: string[]
  selectedExtensions: string[]
  
  // Actions
  setQuery: (query: string) => void
  setResults: (results: FileInfo[]) => void
  setIsSearching: (isSearching: boolean) => void
  setSelectedCategories: (categories: string[]) => void
  setSelectedExtensions: (extensions: string[]) => void
  setUseIndexedSearch: (use: boolean) => void
  
  // Search operations
  search: (query: string) => Promise<void>
  searchInMemory: (query: string, files: FileInfo[]) => Promise<void>
  clearSearch: () => void
}

export const useSearchStore = create<SearchState>((set, get) => ({
  query: '',
  results: [],
  isSearching: false,
  useIndexedSearch: true,
  selectedCategories: [],
  selectedExtensions: [],

  setQuery: (query) => set({ query }),
  setResults: (results) => set({ results }),
  setIsSearching: (isSearching) => set({ isSearching }),
  setSelectedCategories: (categories) => set({ selectedCategories: categories }),
  setSelectedExtensions: (extensions) => set({ selectedExtensions: extensions }),
  setUseIndexedSearch: (use) => set({ useIndexedSearch: use }),

  // Search using indexed database
  search: async (query) => {
    if (!query.trim()) {
      set({ results: [], isSearching: false, query: '' })
      return
    }
    
    set({ isSearching: true, query })
    try {
      const results = await window.api.indexSearch(query)
      set({ results, isSearching: false })
    } catch (error) {
      console.error('Indexed search error:', error)
      set({ results: [], isSearching: false })
    }
  },

  // Fallback: search in memory (for current directory only)
  searchInMemory: async (query, files) => {
    if (!query.trim()) {
      set({ results: [], isSearching: false, query: '' })
      return
    }
    
    set({ isSearching: true, query })
    try {
      const searchResults = await window.api.search(query, files)
      const results = searchResults.map(r => r.file)
      set({ results, isSearching: false })
    } catch (error) {
      console.error('Search error:', error)
      set({ results: [], isSearching: false })
    }
  },

  clearSearch: () => set({ query: '', results: [], isSearching: false })
}))

