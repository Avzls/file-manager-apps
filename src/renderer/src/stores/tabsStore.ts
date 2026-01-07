import { create } from 'zustand'

interface Tab {
  id: string
  path: string
  name: string
}

interface TabsState {
  tabs: Tab[]
  activeTabId: string | null
  
  // Actions
  addTab: (path: string) => void
  removeTab: (id: string) => void
  setActiveTab: (id: string) => void
  updateTabPath: (id: string, path: string) => void
}

const DEFAULT_PATH = 'D:\\coba'

export const useTabsStore = create<TabsState>((set, get) => ({
  tabs: [
    { id: 'tab-1', path: DEFAULT_PATH, name: 'coba' }
  ],
  activeTabId: 'tab-1',
  
  addTab: (path) => {
    const id = `tab-${Date.now()}`
    const name = path.split('\\').pop() || path
    set(state => ({
      tabs: [...state.tabs, { id, path, name }],
      activeTabId: id
    }))
  },
  
  removeTab: (id) => {
    const { tabs, activeTabId } = get()
    
    // Don't remove last tab
    if (tabs.length <= 1) return
    
    const newTabs = tabs.filter(t => t.id !== id)
    
    // If removing active tab, switch to previous or next
    let newActiveId = activeTabId
    if (activeTabId === id) {
      const removedIndex = tabs.findIndex(t => t.id === id)
      newActiveId = newTabs[Math.max(0, removedIndex - 1)]?.id || newTabs[0]?.id
    }
    
    set({
      tabs: newTabs,
      activeTabId: newActiveId
    })
  },
  
  setActiveTab: (id) => {
    set({ activeTabId: id })
  },
  
  updateTabPath: (id, path) => {
    const name = path.split('\\').pop() || path
    set(state => ({
      tabs: state.tabs.map(t => 
        t.id === id ? { ...t, path, name } : t
      )
    }))
  }
}))
