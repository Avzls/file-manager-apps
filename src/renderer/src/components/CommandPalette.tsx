import { useState, useEffect, useRef, useMemo } from 'react'
import { 
  Search, 
  Folder, 
  FileText, 
  Settings, 
  Moon, 
  Sun,
  RefreshCw,
  Copy,
  Star,
  Command,
  ArrowRight
} from 'lucide-react'
import { useFileStore } from '../stores/fileStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useFavoritesStore } from '../stores/favoritesStore'

interface CommandItem {
  id: string
  title: string
  description?: string
  icon: React.ReactNode
  category: 'action' | 'file' | 'folder' | 'recent'
  action: () => void
  keywords?: string[]
}

export function CommandPalette(): JSX.Element | null {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const { currentPath, navigateTo, loadDirectory, recentFolders } = useFileStore()
  const { theme, setTheme, rootPaths } = useSettingsStore()
  const { favorites } = useFavoritesStore()

  // Build command items
  const commands = useMemo<CommandItem[]>(() => {
    const items: CommandItem[] = []

    // Actions
    items.push({
      id: 'toggle-theme',
      title: theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode',
      description: 'Toggle dark/light theme',
      icon: theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />,
      category: 'action',
      action: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
      keywords: ['theme', 'dark', 'light', 'mode']
    })

    items.push({
      id: 'refresh',
      title: 'Refresh',
      description: 'Reload current folder',
      icon: <RefreshCw className="h-4 w-4" />,
      category: 'action',
      action: () => loadDirectory(currentPath),
      keywords: ['reload', 'refresh']
    })

    items.push({
      id: 'copy-path',
      title: 'Copy Current Path',
      description: currentPath,
      icon: <Copy className="h-4 w-4" />,
      category: 'action',
      action: () => navigator.clipboard.writeText(currentPath),
      keywords: ['copy', 'path', 'clipboard']
    })

    items.push({
      id: 'settings',
      title: 'Open Settings',
      description: 'Configure app settings',
      icon: <Settings className="h-4 w-4" />,
      category: 'action',
      action: () => {
        // Trigger settings modal
        document.dispatchEvent(new CustomEvent('open-settings'))
      },
      keywords: ['settings', 'config', 'preferences']
    })

    // Root paths
    rootPaths.forEach((path, index) => {
      const folderName = path.split('\\').pop() || path
      items.push({
        id: `root-${index}`,
        title: folderName,
        description: path,
        icon: <Folder className="h-4 w-4 text-blue-500" />,
        category: 'folder',
        action: () => navigateTo(path),
        keywords: [folderName.toLowerCase(), 'folder', 'root']
      })
    })

    // Recent folders
    recentFolders?.slice(0, 5).forEach((path: string, index: number) => {
      const folderName = path.split('\\').pop() || path
      items.push({
        id: `recent-${index}`,
        title: folderName,
        description: path,
        icon: <Folder className="h-4 w-4 text-yellow-500" />,
        category: 'recent',
        action: () => navigateTo(path),
        keywords: [folderName.toLowerCase(), 'recent']
      })
    })

    // Favorites
    favorites.slice(0, 5).forEach((path, index) => {
      const fileName = path.split('\\').pop() || path
      items.push({
        id: `fav-${index}`,
        title: fileName,
        description: path,
        icon: <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />,
        category: 'file',
        action: () => {
          const parentPath = path.substring(0, path.lastIndexOf('\\'))
          navigateTo(parentPath)
        },
        keywords: [fileName.toLowerCase(), 'favorite', 'star']
      })
    })

    return items
  }, [theme, currentPath, rootPaths, recentFolders, favorites])

  // Filter commands based on query
  const filteredCommands = useMemo(() => {
    if (!query) return commands
    
    const lowerQuery = query.toLowerCase()
    return commands.filter(cmd => 
      cmd.title.toLowerCase().includes(lowerQuery) ||
      cmd.description?.toLowerCase().includes(lowerQuery) ||
      cmd.keywords?.some(k => k.includes(lowerQuery))
    )
  }, [commands, query])

  // Keyboard shortcut to open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K to open
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
        setQuery('')
        setSelectedIndex(0)
      }

      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Navigation within list
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(i => Math.min(i + 1, filteredCommands.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(i => Math.max(i - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action()
          setIsOpen(false)
        }
        break
    }
  }

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedEl = listRef.current.children[selectedIndex] as HTMLElement
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [selectedIndex])

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      onClick={() => setIsOpen(false)}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      
      {/* Palette */}
      <div 
        className="relative w-full max-w-xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
        style={{ animation: 'scaleIn 0.15s ease-out' }}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="h-5 w-5 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search files, folders, or actions..."
            className="flex-1 bg-transparent text-lg outline-none placeholder:text-muted-foreground"
          />
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <kbd className="px-1.5 py-0.5 bg-muted rounded">esc</kbd>
            <span>to close</span>
          </div>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-80 overflow-y-auto p-2">
          {filteredCommands.length === 0 ? (
            <div className="px-4 py-8 text-center text-muted-foreground">
              No results found
            </div>
          ) : (
            <>
              {/* Group by category */}
              {['action', 'folder', 'recent', 'file'].map(category => {
                const categoryItems = filteredCommands.filter(c => c.category === category)
                if (categoryItems.length === 0) return null

                const categoryLabels: Record<string, string> = {
                  action: 'Actions',
                  folder: 'Folders',
                  recent: 'Recent',
                  file: 'Favorites'
                }

                return (
                  <div key={category} className="mb-2">
                    <div className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {categoryLabels[category]}
                    </div>
                    {categoryItems.map(cmd => {
                      const globalIndex = filteredCommands.indexOf(cmd)
                      const isSelected = globalIndex === selectedIndex

                      return (
                        <button
                          key={cmd.id}
                          onClick={() => {
                            cmd.action()
                            setIsOpen(false)
                          }}
                          onMouseEnter={() => setSelectedIndex(globalIndex)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                            isSelected 
                              ? 'bg-primary text-primary-foreground' 
                              : 'hover:bg-muted'
                          }`}
                        >
                          <div className={isSelected ? 'text-primary-foreground' : 'text-muted-foreground'}>
                            {cmd.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{cmd.title}</div>
                            {cmd.description && (
                              <div className={`text-sm truncate ${isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                                {cmd.description}
                              </div>
                            )}
                          </div>
                          {isSelected && (
                            <ArrowRight className="h-4 w-4 flex-shrink-0" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                )
              })}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-border text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span><kbd className="px-1 py-0.5 bg-muted rounded">↑↓</kbd> navigate</span>
            <span><kbd className="px-1 py-0.5 bg-muted rounded">↵</kbd> select</span>
          </div>
          <div className="flex items-center gap-1">
            <Command className="h-3 w-3" />
            <span>Command Palette</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  )
}
