import { 
  Search, 
  ArrowLeft, 
  ArrowRight, 
  RefreshCw, 
  Grid, 
  List,
  ChevronRight,
  Loader2,
  ArrowUpDown,
  ArrowDownUp
} from 'lucide-react'
import { useFileStore } from '../stores/fileStore'
import { useSearchStore } from '../stores/searchStore'
import { useState, useCallback } from 'react'

export function Header(): JSX.Element {
  const { 
    currentPath, 
    viewMode, 
    setViewMode,
    sortBy,
    sortOrder,
    setSortBy,
    setSortOrder,
    goBack,
    goForward,
    canGoBack,
    canGoForward,
    loadDirectory
  } = useFileStore()
  
  const { isSearching, search, clearSearch } = useSearchStore()
  const [localQuery, setLocalQuery] = useState('')

  const handleSearch = useCallback(() => {
    if (localQuery.trim()) {
      search(localQuery)
    } else {
      clearSearch()
    }
  }, [localQuery, search, clearSearch])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
    if (e.key === 'Escape') {
      setLocalQuery('')
      clearSearch()
    }
  }

  const pathParts = currentPath.split('\\').filter(Boolean)

  return (
    <header className="h-14 border-b border-border bg-card flex items-center px-4 gap-3">
      {/* Navigation Buttons */}
      <div className="flex items-center gap-1">
        <button
          onClick={goBack}
          disabled={!canGoBack()}
          className="p-2 rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Go Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <button
          onClick={goForward}
          disabled={!canGoForward()}
          className="p-2 rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Go Forward"
        >
          <ArrowRight className="h-4 w-4" />
        </button>
        <button
          onClick={() => loadDirectory(currentPath)}
          className="p-2 rounded-md hover:bg-muted transition-colors"
          title="Refresh"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Breadcrumb */}
      <div className="flex-1 flex items-center gap-1 bg-muted rounded-md px-3 py-1.5 overflow-hidden">
        {pathParts.map((part, index) => (
          <div key={index} className="flex items-center gap-1 shrink-0">
            {index > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
            <button
              onClick={() => {
                const newPath = pathParts.slice(0, index + 1).join('\\')
                useFileStore.getState().navigateTo(
                  index === 0 ? `\\\\${part}` : newPath
                )
              }}
              className="text-sm hover:text-primary transition-colors truncate max-w-[120px]"
              title={part}
            >
              {part}
            </button>
          </div>
        ))}
      </div>

      {/* Search Bar */}
      <div className="relative w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search indexed files..."
          className="w-full pl-9 pr-10 py-2 rounded-md bg-muted border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary" />
        )}
      </div>

      {/* Sort Dropdown */}
      <div className="flex items-center gap-1">
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-2 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="name">Name</option>
          <option value="date">Date</option>
          <option value="size">Size</option>
          <option value="type">Type</option>
        </select>
        <button
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          className="p-1.5 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
        >
          {sortOrder === 'asc' ? (
            <ArrowUpDown className="h-4 w-4" />
          ) : (
            <ArrowDownUp className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* View Mode Toggle */}
      <div className="flex items-center gap-1 bg-muted rounded-md p-1">
        <button
          onClick={() => setViewMode('grid')}
          className={`p-1.5 rounded transition-colors ${
            viewMode === 'grid' 
              ? 'bg-background shadow-sm' 
              : 'hover:bg-background/50'
          }`}
          title="Grid View"
        >
          <Grid className="h-4 w-4" />
        </button>
        <button
          onClick={() => setViewMode('list')}
          className={`p-1.5 rounded transition-colors ${
            viewMode === 'list' 
              ? 'bg-background shadow-sm' 
              : 'hover:bg-background/50'
          }`}
          title="List View"
        >
          <List className="h-4 w-4" />
        </button>
      </div>
    </header>
  )
}
