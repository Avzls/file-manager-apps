import { useEffect } from 'react'
import { Database, RefreshCw, Loader2, FolderSearch } from 'lucide-react'
import { useIndexStore } from '../stores/indexStore'
import { useSettingsStore } from '../stores/settingsStore'

export function IndexPanel(): JSX.Element {
  const { isScanning, progress, stats, error, startScan, loadStats } = useIndexStore()
  const { rootPaths } = useSettingsStore()

  // Load stats on mount
  useEffect(() => {
    loadStats()
  }, [loadStats])

  const handleScan = async () => {
    // Scan all root paths sequentially
    for (const path of rootPaths) {
      await startScan(path)
    }
  }

  const formatDuration = (lastScan: string | null): string => {
    if (!lastScan) return 'Never'
    const date = new Date(lastScan)
    return date.toLocaleString()
  }

  return (
    <div className="p-3 border-t border-border">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Database className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Index
        </span>
      </div>

      {/* Stats */}
      {stats && !isScanning && (
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-muted rounded-md p-2 text-center">
            <div className="text-lg font-bold text-primary">
              {stats.totalFiles.toLocaleString()}
            </div>
            <div className="text-[10px] text-muted-foreground">Files</div>
          </div>
          <div className="bg-muted rounded-md p-2 text-center">
            <div className="text-lg font-bold text-primary">
              {stats.totalFolders.toLocaleString()}
            </div>
            <div className="text-[10px] text-muted-foreground">Folders</div>
          </div>
        </div>
      )}

      {/* Last Scan Info */}
      {stats?.lastScan && !isScanning && (
        <div className="text-[10px] text-muted-foreground mb-3 text-center">
          Last scan: {formatDuration(stats.lastScan)}
        </div>
      )}

      {/* Scanning Progress */}
      {isScanning && (
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-xs">Scanning...</span>
          </div>
          {progress && (
            <div className="space-y-1">
              <div className="text-xs font-medium">
                {progress.count.toLocaleString()} files found
              </div>
              <div className="text-[10px] text-muted-foreground truncate" title={progress.current}>
                {progress.current.split('\\').slice(-2).join('\\')}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-3 p-2 bg-red-100 dark:bg-red-900/30 rounded text-xs text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Scan Button */}
      <button
        onClick={handleScan}
        disabled={isScanning || rootPaths.length === 0}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isScanning ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Scanning...</span>
          </>
        ) : (
          <>
            <FolderSearch className="h-4 w-4" />
            <span className="text-sm">Scan All ({rootPaths.length})</span>
          </>
        )}
      </button>
    </div>
  )
}
