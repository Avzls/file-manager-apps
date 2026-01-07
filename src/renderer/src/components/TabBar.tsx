import { Plus, X } from 'lucide-react'
import { useTabsStore } from '../stores/tabsStore'
import { useFileStore } from '../stores/fileStore'
import { useSettingsStore } from '../stores/settingsStore'

export function TabBar(): JSX.Element {
  const { tabs, activeTabId, addTab, removeTab, setActiveTab } = useTabsStore()
  const { navigateTo, currentPath } = useFileStore()
  const { rootPaths } = useSettingsStore()

  const handleTabClick = (tabId: string, tabPath: string) => {
    setActiveTab(tabId)
    navigateTo(tabPath)
  }

  const handleAddTab = () => {
    // Open new tab with first root path or current path
    const newPath = rootPaths[0] || currentPath
    addTab(newPath)
    navigateTo(newPath)
  }

  const handleCloseTab = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation()
    
    const { tabs: currentTabs, activeTabId: currentActiveId } = useTabsStore.getState()
    
    // If closing active tab, navigate to next tab's path
    if (currentActiveId === tabId && currentTabs.length > 1) {
      const currentIndex = currentTabs.findIndex(t => t.id === tabId)
      const nextTab = currentTabs[currentIndex + 1] || currentTabs[currentIndex - 1]
      if (nextTab) {
        navigateTo(nextTab.path)
      }
    }
    
    removeTab(tabId)
  }

  return (
    <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      {/* Tabs */}
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => handleTabClick(tab.id, tab.path)}
          className={`group flex items-center gap-2 px-3 py-1.5 rounded-t-md text-sm transition-colors max-w-[180px] ${
            activeTabId === tab.id
              ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white border-t border-x border-gray-200 dark:border-gray-700'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          <span className="truncate" title={tab.path}>{tab.name}</span>
          {tabs.length > 1 && (
            <span
              onClick={(e) => handleCloseTab(e, tab.id)}
              className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-gray-300 dark:hover:bg-gray-600 rounded"
            >
              <X className="h-3 w-3" />
            </span>
          )}
        </button>
      ))}

      {/* Add Tab Button */}
      <button
        onClick={handleAddTab}
        className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
        title="New Tab"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  )
}
