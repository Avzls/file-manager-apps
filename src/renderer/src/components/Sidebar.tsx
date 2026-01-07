import { 
  Star,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
  Clock
} from 'lucide-react'
import { useFileStore } from '../stores/fileStore'
import { useFavoritesStore } from '../stores/favoritesStore'
import { useRecentFilesStore } from '../stores/recentFilesStore'
import { IndexPanel } from './IndexPanel'
import { FileCategory } from '@shared/types'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  onOpenSettings?: () => void
}

export function Sidebar({ collapsed, onToggle, onOpenSettings }: SidebarProps): JSX.Element {
  const { categoryFilter, setCategoryFilter, files } = useFileStore()

  // Calculate category counts from current files
  const categoryCounts = files.reduce((acc, file) => {
    if (!file.isDirectory) {
      acc[file.category] = (acc[file.category] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>)

  const categories: { icon: string; label: string; category: FileCategory }[] = [
    { icon: '🖼️', label: 'Images', category: 'image' },
    { icon: '📄', label: 'PDF', category: 'pdf' },
    { icon: '🎬', label: 'Videos', category: 'video' },
    { icon: '📐', label: 'AutoCAD', category: 'autocad' },
    { icon: '📝', label: 'Documents', category: 'document' },
    { icon: '📊', label: 'Spreadsheets', category: 'spreadsheet' },
    { icon: '📦', label: 'Archives', category: 'archive' }
  ]

  return (
    <aside 
      className={`border-r border-border bg-card flex flex-col transition-all duration-300 ${
        collapsed ? 'w-14' : 'w-56'
      }`}
    >
      {/* Header */}
      <div className="h-12 flex items-center justify-between px-3 border-b border-border">
        {!collapsed && (
          <span className="font-semibold text-sm">File Manager</span>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 hover:bg-muted rounded-md transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Categories */}
      <div className="flex-1 overflow-auto py-3">
        <div className="px-3 mb-4">
          {!collapsed && (
            <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
              Categories
            </h3>
          )}
          <div className="space-y-1">
            {/* All Files button */}
            <button
              onClick={() => setCategoryFilter(null)}
              className={`w-full flex items-center justify-between px-2 py-2 rounded-md transition-colors ${
                categoryFilter === null 
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800'
              } ${collapsed ? 'justify-center' : ''}`}
              title="All Files"
            >
              <div className="flex items-center gap-3">
                <span>📁</span>
                {!collapsed && <span className="text-sm">All Files</span>}
              </div>
              {!collapsed && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {files.filter(f => !f.isDirectory).length}
                </span>
              )}
            </button>
            
            {/* Category buttons */}
            {categories.map((cat) => {
              const count = categoryCounts[cat.category] || 0
              if (count === 0 && categoryFilter !== cat.category) return null
              
              return (
                <button
                  key={cat.category}
                  onClick={() => setCategoryFilter(
                    categoryFilter === cat.category ? null : cat.category
                  )}
                  className={`w-full flex items-center justify-between px-2 py-2 rounded-md transition-colors ${
                    categoryFilter === cat.category 
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  } ${collapsed ? 'justify-center' : ''}`}
                  title={cat.label}
                >
                  <div className="flex items-center gap-3">
                    <span>{cat.icon}</span>
                    {!collapsed && <span className="text-sm">{cat.label}</span>}
                  </div>
                  {!collapsed && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">{count}</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Favorites */}
        {!collapsed && (
          <div className="px-3">
            <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider flex items-center gap-2">
              <Star className="h-3 w-3" />
              Favorites
            </h3>
            <FavoritesList />
          </div>
        )}

        {/* Recent Files */}
        {!collapsed && (
          <div className="px-3 mt-4">
            <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider flex items-center gap-2">
              <Clock className="h-3 w-3" />
              Recent Files
            </h3>
            <RecentFilesList />
          </div>
        )}
      </div>

      {/* Index Panel - Only show when not collapsed */}
      {!collapsed && <IndexPanel />}

      {/* Settings */}
      <div className="border-t border-border p-3">
        <button
          onClick={onOpenSettings}
          className={`w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
            collapsed ? 'justify-center' : ''
          }`}
          title="Settings"
        >
          <Settings className="h-4 w-4" />
          {!collapsed && <span className="text-sm">Settings</span>}
        </button>
      </div>
    </aside>
  )
}

// Favorites List Component
function FavoritesList(): JSX.Element {
  const { favorites, removeFavorite } = useFavoritesStore()
  const { navigateTo } = useFileStore()
  
  if (favorites.length === 0) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400 px-2 py-2">
        No favorites yet
      </div>
    )
  }
  
  return (
    <div className="space-y-1 max-h-32 overflow-auto">
      {favorites.map((path) => {
        const name = path.split('\\').pop() || path
        return (
          <div 
            key={path}
            className="group flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
          >
            <Star className="h-3 w-3 fill-yellow-500 text-yellow-500 shrink-0" />
            <span 
              className="text-sm truncate flex-1"
              title={path}
              onClick={() => navigateTo(path.substring(0, path.lastIndexOf('\\')))}
            >
              {name}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                removeFavorite(path)
              }}
              className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )
      })}
    </div>
  )
}

// Recent Files List Component
function RecentFilesList(): JSX.Element {
  const { recentFiles, removeRecentFile } = useRecentFilesStore()
  
  if (recentFiles.length === 0) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400 px-2 py-2">
        No recent files
      </div>
    )
  }
  
  const handleQuickOpen = async (path: string) => {
    try {
      await (window as any).api.quickOpen(path)
    } catch (err) {
      console.error('Quick open failed:', err)
    }
  }
  
  return (
    <div className="space-y-1 max-h-32 overflow-auto">
      {recentFiles.slice(0, 5).map((file) => (
        <div 
          key={file.path}
          className="group flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
          onClick={() => handleQuickOpen(file.path)}
        >
          <Clock className="h-3 w-3 text-gray-400 shrink-0" />
          <span 
            className="text-sm truncate flex-1"
            title={file.path}
          >
            {file.name}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation()
              removeRecentFile(file.path)
            }}
            className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  )
}
