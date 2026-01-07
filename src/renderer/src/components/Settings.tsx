import { useState } from 'react'
import { 
  X, 
  Sun, 
  Moon, 
  Monitor,
  FolderOpen,
  Grid,
  List,
  RefreshCw,
  Trash2,
  Plus,
  Database,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { useSettingsStore } from '../stores/settingsStore'
import { useFileStore } from '../stores/fileStore'
import { toast } from 'sonner'

interface SettingsProps {
  isOpen: boolean
  onClose: () => void
}

export function Settings({ isOpen, onClose }: SettingsProps): JSX.Element | null {
  const { 
    rootPaths, 
    theme, 
    thumbnailSize,
    indexOnStartup,
    recentPaths,
    dbType,
    sqlServerConfig,
    addRootPath, 
    removeRootPath,
    setTheme,
    setThumbnailSize,
    setIndexOnStartup,
    clearRecentPaths,
    setDbType,
    setSqlServerConfig
  } = useSettingsStore()
  
  const { navigateTo } = useFileStore()
  const [newPath, setNewPath] = useState('')
  const [testingConnection, setTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle')

  if (!isOpen) return null

  const handleAddPath = async () => {
    const path = await (window as any).api.openFolderDialog()
    if (path) {
      addRootPath(path)
    }
  }

  const handleAddManualPath = () => {
    if (newPath.trim()) {
      addRootPath(newPath.trim())
      setNewPath('')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors text-gray-600 dark:text-gray-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-auto">
          {/* Root Paths */}
          <div>
            <label className="text-sm font-medium mb-2 block text-gray-900 dark:text-white">
              Root Paths (untuk di-index)
            </label>
            
            {/* Current paths list */}
            <div className="space-y-2 mb-3">
              {rootPaths.map((path, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-md"
                >
                  <FolderOpen className="h-4 w-4 text-yellow-500 shrink-0" />
                  <span 
                    className="flex-1 text-sm text-gray-900 dark:text-white truncate cursor-pointer hover:text-blue-500"
                    onClick={() => navigateTo(path)}
                    title={path}
                  >
                    {path}
                  </span>
                  <button
                    onClick={() => removeRootPath(path)}
                    className="p-1 text-gray-400 hover:text-red-500 rounded"
                    title="Remove path"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {rootPaths.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                  No paths added yet
                </p>
              )}
            </div>

            {/* Add new path */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newPath}
                onChange={(e) => setNewPath(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddManualPath()}
                className="flex-1 px-3 py-2 rounded-md bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="\\\\192.168.2.10\\engineering"
              />
              <button
                onClick={handleAddManualPath}
                className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                title="Add path"
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                onClick={handleAddPath}
                className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 text-sm"
                title="Browse folder"
              >
                <FolderOpen className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Add multiple folders untuk di-index dan dicari
            </p>
          </div>

          {/* Theme */}
          <div>
            <label className="text-sm font-medium mb-2 block text-gray-900 dark:text-white">Theme</label>
            <div className="flex gap-2">
              <ThemeButton
                icon={<Sun className="h-4 w-4" />}
                label="Light"
                isActive={theme === 'light'}
                onClick={() => setTheme('light')}
              />
              <ThemeButton
                icon={<Moon className="h-4 w-4" />}
                label="Dark"
                isActive={theme === 'dark'}
                onClick={() => setTheme('dark')}
              />
              <ThemeButton
                icon={<Monitor className="h-4 w-4" />}
                label="System"
                isActive={theme === 'system'}
                onClick={() => setTheme('system')}
              />
            </div>
          </div>

          {/* Thumbnail Size */}
          <div>
            <label className="text-sm font-medium mb-2 block text-gray-900 dark:text-white">Thumbnail Size</label>
            <div className="flex gap-2">
              <ThumbnailButton
                label="Small"
                isActive={thumbnailSize === 'small'}
                onClick={() => setThumbnailSize('small')}
              />
              <ThumbnailButton
                label="Medium"
                isActive={thumbnailSize === 'medium'}
                onClick={() => setThumbnailSize('medium')}
              />
              <ThumbnailButton
                label="Large"
                isActive={thumbnailSize === 'large'}
                onClick={() => setThumbnailSize('large')}
              />
            </div>
          </div>

          {/* Index on Startup */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-white">Index on Startup</label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Automatically scan and index files when app starts
              </p>
            </div>
            <button
              onClick={() => setIndexOnStartup(!indexOnStartup)}
              className={`w-12 h-6 rounded-full transition-colors ${
                indexOnStartup ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  indexOnStartup ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Database Configuration */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Database className="h-4 w-4 text-gray-500" />
              <label className="text-sm font-medium text-gray-900 dark:text-white">Database</label>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Use SQL Server for multi-PC comment sync
            </p>
            
            <div className="flex gap-2 mb-3">
              <button
                onClick={async () => {
                  setDbType('sqlite')
                  const result = await (window as any).api.setDbType('sqlite')
                  toast.success(result.message)
                }}
                className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors ${
                  dbType === 'sqlite'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                SQLite (Local)
              </button>
              <button
                onClick={async () => {
                  setDbType('sqlserver')
                  const result = await (window as any).api.setDbType('sqlserver')
                  if (result.success) {
                    toast.success(result.message)
                    setConnectionStatus('success')
                  } else {
                    toast.error(result.message)
                    setConnectionStatus('error')
                  }
                }}
                className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors ${
                  dbType === 'sqlserver'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                SQL Server
              </button>
            </div>

            {dbType === 'sqlserver' && (
              <div className="space-y-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Server: <span className="text-gray-900 dark:text-white">{sqlServerConfig.server}</span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Database: <span className="text-gray-900 dark:text-white">{sqlServerConfig.database}</span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Auth: <span className="text-gray-900 dark:text-white">{sqlServerConfig.domain}\\{sqlServerConfig.username}</span>
                </div>
                <button
                  onClick={async () => {
                    setTestingConnection(true)
                    const result = await (window as any).api.testDbConnection()
                    setTestingConnection(false)
                    if (result.success) {
                      setConnectionStatus('success')
                      toast.success('SQL Server connection successful!')
                    } else {
                      setConnectionStatus('error')
                      toast.error(`Connection failed: ${result.message}`)
                    }
                  }}
                  disabled={testingConnection}
                  className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm disabled:opacity-50"
                >
                  {testingConnection ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : connectionStatus === 'success' ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : connectionStatus === 'error' ? (
                    <XCircle className="h-4 w-4" />
                  ) : (
                    <Database className="h-4 w-4" />
                  )}
                  {testingConnection ? 'Testing...' : 'Test Connection'}
                </button>
              </div>
            )}
          </div>

          {/* Recent Paths */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-900 dark:text-white">Recent Folders</label>
              {recentPaths.length > 0 && (
                <button
                  onClick={clearRecentPaths}
                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-500 flex items-center gap-1"
                >
                  <Trash2 className="h-3 w-3" />
                  Clear
                </button>
              )}
            </div>
            {recentPaths.length > 0 ? (
              <div className="space-y-1">
                {recentPaths.slice(0, 5).map((path) => (
                  <button
                    key={path}
                    onClick={() => {
                      navigateTo(path)
                      onClose()
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm text-left truncate text-gray-900 dark:text-white"
                  >
                    <FolderOpen className="h-4 w-4 shrink-0 text-gray-500 dark:text-gray-400" />
                    <span className="truncate">{path}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">No recent folders</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

interface ThemeButtonProps {
  icon: React.ReactNode
  label: string
  isActive: boolean
  onClick: () => void
}

function ThemeButton({ icon, label, isActive, onClick }: ThemeButtonProps): JSX.Element {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors ${
        isActive 
          ? 'bg-blue-600 text-white' 
          : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700'
      }`}
    >
      {icon}
      <span className="text-sm">{label}</span>
    </button>
  )
}

interface ThumbnailButtonProps {
  label: string
  isActive: boolean
  onClick: () => void
}

function ThumbnailButton({ label, isActive, onClick }: ThumbnailButtonProps): JSX.Element {
  return (
    <button
      onClick={onClick}
      className={`flex-1 px-4 py-2 rounded-md text-sm transition-colors ${
        isActive 
          ? 'bg-blue-600 text-white' 
          : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700'
      }`}
    >
      {label}
    </button>
  )
}
