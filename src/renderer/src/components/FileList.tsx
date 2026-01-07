import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { 
  Folder, 
  File, 
  Image, 
  FileVideo, 
  FileText, 
  FileSpreadsheet,
  Archive,
  MoreVertical,
  Loader2,
  Star
} from 'lucide-react'
import { useFileStore } from '../stores/fileStore'
import { useSearchStore } from '../stores/searchStore'
import { useFavoritesStore } from '../stores/favoritesStore'
import { ContextMenu } from './ContextMenu'
import { FileThumbnail } from './FileThumbnail'
import { FileInfo, FileCategory } from '@shared/types'

const categoryIcons: Record<FileCategory, React.ReactNode> = {
  image: <Image className="h-6 w-6 text-green-500" />,
  video: <FileVideo className="h-6 w-6 text-purple-500" />,
  pdf: <FileText className="h-6 w-6 text-red-500" />,
  autocad: <File className="h-6 w-6 text-blue-500" />,
  document: <FileText className="h-6 w-6 text-blue-400" />,
  spreadsheet: <FileSpreadsheet className="h-6 w-6 text-green-600" />,
  archive: <Archive className="h-6 w-6 text-yellow-600" />,
  other: <File className="h-6 w-6 text-gray-500" />
}

export function FileList(): JSX.Element {
  const { 
    currentPath, 
    isLoading, 
    error, 
    viewMode,
    selectedFile,
    selectedFiles,
    setSelectedFile,
    toggleFileSelection,
    selectAll,
    clearSelection,
    isFileSelected,
    openFile,
    loadDirectory,
    openInExplorer,
    getFilteredFiles,
    categoryFilter
  } = useFileStore()
  
  const { query, results } = useSearchStore()
  const { isFavorite, toggleFavorite } = useFavoritesStore()
  
  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    file: FileInfo
    x: number
    y: number
  } | null>(null)
  
  // Rename dialog state
  const [renameFile, setRenameFile] = useState<FileInfo | null>(null)
  const [newName, setNewName] = useState('')
  
  // Delete confirmation state
  const [deleteFile, setDeleteFile] = useState<FileInfo | null>(null)
  
  // Batch delete confirmation
  const [showBatchDelete, setShowBatchDelete] = useState(false)

  // Load initial directory
  useEffect(() => {
    loadDirectory(currentPath)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      // Delete - delete selected files
      if (e.key === 'Delete' && selectedFiles.length > 0) {
        e.preventDefault()
        if (selectedFiles.length === 1) {
          setDeleteFile(selectedFiles[0])
        } else {
          setShowBatchDelete(true)
        }
      }

      // Ctrl+A - select all
      if (e.key === 'a' && e.ctrlKey) {
        e.preventDefault()
        selectAll()
      }

      // Escape - clear selection
      if (e.key === 'Escape') {
        clearSelection()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedFiles, selectAll, clearSelection])

  // Display search results, category filtered files, or all files
  const filteredFiles = getFilteredFiles()
  const displayFiles = query ? results : filteredFiles

  const handleContextMenu = (e: React.MouseEvent, file: FileInfo) => {
    e.preventDefault()
    setContextMenu({ file, x: e.clientX, y: e.clientY })
  }

  const handleRename = async (file: FileInfo) => {
    setRenameFile(file)
    setNewName(file.name)
  }

  const handleRenameSubmit = async () => {
    if (!renameFile || !newName.trim()) return
    try {
      await (window as any).api.renameFile(renameFile.path, newName)
      toast.success('File renamed successfully')
      loadDirectory(currentPath)
      setRenameFile(null)
    } catch (err) {
      toast.error('Failed to rename file')
      console.error('Rename failed:', err)
    }
  }

  const handleDelete = async (file: FileInfo) => {
    // Use custom confirm dialog instead of browser confirm
    setDeleteFile(file)
  }

  const confirmDelete = async () => {
    if (!deleteFile) return
    try {
      await (window as any).api.deleteFile(deleteFile.path)
      toast.success(`"${deleteFile.name}" deleted`)
      loadDirectory(currentPath)
      setDeleteFile(null)
    } catch (err) {
      toast.error('Failed to delete file')
      console.error('Delete failed:', err)
    }
  }

  const handleCopyPath = (file: FileInfo) => {
    navigator.clipboard.writeText(file.path)
    toast.success('Path copied to clipboard')
  }

  const handleDragStart = (e: React.DragEvent, file: FileInfo) => {
    e.dataTransfer.setData('application/json', JSON.stringify(file))
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDrop = async (e: React.DragEvent, targetFolder: FileInfo) => {
    e.preventDefault()
    if (!targetFolder.isDirectory) return
    
    try {
      const data = e.dataTransfer.getData('application/json')
      const file: FileInfo = JSON.parse(data)
      await (window as any).api.moveFile(file.path, targetFolder.path)
      loadDirectory(currentPath)
    } catch (err) {
      console.error('Move failed:', err)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading files...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 max-w-md text-center">
          <div className="p-4 rounded-full bg-red-100 dark:bg-red-900/30">
            <File className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="font-medium">Cannot access folder</h3>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  if (displayFiles.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Folder className="h-12 w-12 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {query ? 'No files match your search' : 'This folder is empty'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Batch Operations Toolbar */}
      {selectedFiles.length > 1 && (
        <div className="sticky top-0 z-10 bg-blue-500 text-white px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-medium">{selectedFiles.length} files selected</span>
            <button
              onClick={clearSelection}
              className="text-sm underline hover:no-underline"
            >
              Clear
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                selectedFiles.forEach(f => {
                  navigator.clipboard.writeText(selectedFiles.map(f => f.path).join('\n'))
                })
                toast.success(`Copied ${selectedFiles.length} paths to clipboard`)
              }}
              className="px-3 py-1 bg-white/20 rounded hover:bg-white/30 text-sm"
            >
              Copy Paths
            </button>
            <button
              onClick={() => setShowBatchDelete(true)}
              className="px-3 py-1 bg-red-600 rounded hover:bg-red-700 text-sm"
            >
              Delete All
            </button>
          </div>
        </div>
      )}

      <div className="h-full overflow-auto p-4">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {displayFiles.map((file) => (
              <FileGridItem
                key={file.id}
                file={file}
                isSelected={isFileSelected(file)}
                isFavorite={isFavorite(file.path)}
                onClick={(e) => toggleFileSelection(file, e.ctrlKey, e.shiftKey)}
                onDoubleClick={() => openFile(file)}
                onContextMenu={(e) => handleContextMenu(e, file)}
                onDragStart={(e) => handleDragStart(e, file)}
                onDrop={(e) => handleDrop(e, file)}
                onDragOver={handleDragOver}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            <div className="grid grid-cols-12 gap-4 px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <div className="col-span-6">Name</div>
              <div className="col-span-2">Size</div>
              <div className="col-span-3">Modified</div>
              <div className="col-span-1"></div>
            </div>
            {displayFiles.map((file) => (
              <FileListItem
                key={file.id}
                file={file}
                isSelected={isFileSelected(file)}
                isFavorite={isFavorite(file.path)}
                onClick={(e) => toggleFileSelection(file, e.ctrlKey, e.shiftKey)}
                onDoubleClick={() => openFile(file)}
                onContextMenu={(e) => handleContextMenu(e, file)}
                onDragStart={(e) => handleDragStart(e, file)}
                onDrop={(e) => handleDrop(e, file)}
                onDragOver={handleDragOver}
                onOpenInExplorer={() => openInExplorer(file)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          file={contextMenu.file}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onRename={handleRename}
          onDelete={handleDelete}
          onCopyPath={handleCopyPath}
          onOpenLocation={(f) => openInExplorer(f)}
          onOpen={openFile}
          onToggleFavorite={(f) => toggleFavorite(f.path)}
          isFavorite={isFavorite(contextMenu.file.path)}
        />
      )}

      {/* Rename Dialog */}
      {renameFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-5 w-80 shadow-xl">
            <h3 className="font-medium mb-3 text-gray-900 dark:text-white">Rename</h3>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit()}
              className="w-full px-3 py-2 rounded-md bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setRenameFile(null)}
                className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-md text-sm hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleRenameSubmit}
                className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
              >
                Rename
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-5 w-80 shadow-xl">
            <h3 className="font-medium mb-2 text-gray-900 dark:text-white">Delete File</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Are you sure you want to delete "{deleteFile.name}"?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteFile(null)}
                className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-md text-sm hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-3 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Delete Confirmation */}
      {showBatchDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-5 w-96 shadow-xl">
            <h3 className="font-medium mb-2 text-gray-900 dark:text-white">Delete {selectedFiles.length} Files</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
              Are you sure you want to delete these files?
            </p>
            <div className="max-h-32 overflow-auto mb-4 text-xs bg-gray-100 dark:bg-gray-800 rounded p-2">
              {selectedFiles.map(f => (
                <div key={f.id} className="truncate">{f.name}</div>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowBatchDelete(false)}
                className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-md text-sm hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  let successCount = 0
                  for (const file of selectedFiles) {
                    try {
                      await (window as any).api.deleteFile(file.path)
                      successCount++
                    } catch (err) {
                      console.error('Delete failed:', file.name, err)
                    }
                  }
                  toast.success(`Deleted ${successCount} files`)
                  setShowBatchDelete(false)
                  clearSelection()
                  loadDirectory(currentPath)
                }}
                className="flex-1 px-3 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700"
              >
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

interface FileItemProps {
  file: FileInfo
  isSelected: boolean
  isFavorite: boolean
  onClick: (e: React.MouseEvent) => void
  onDoubleClick: () => void
  onContextMenu: (e: React.MouseEvent) => void
  onDragStart: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
  onOpenInExplorer?: () => void
}

function FileGridItem({ 
  file, 
  isSelected, 
  isFavorite,
  onClick, 
  onDoubleClick,
  onContextMenu,
  onDragStart,
  onDrop,
  onDragOver
}: FileItemProps): JSX.Element {
  return (
    <div
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
      draggable
      onDragStart={onDragStart}
      onDrop={onDrop}
      onDragOver={onDragOver}
      className={`file-item relative flex flex-col items-center gap-2 p-4 rounded-lg cursor-pointer border ${
        isSelected 
          ? 'bg-primary/10 border-primary' 
          : 'bg-card border-transparent hover:bg-muted hover:border-border'
      }`}
    >
      {/* Favorite Star */}
      {isFavorite && (
        <Star className="absolute top-2 right-2 h-4 w-4 fill-yellow-500 text-yellow-500" />
      )}
      
      {/* Thumbnail */}
      <FileThumbnail file={file} size="medium" />
      
      {/* Name */}
      <span 
        className="text-sm text-center line-clamp-2 w-full break-all"
        title={file.name}
      >
        {file.name}
      </span>
      
      {/* Size (for files only) */}
      {!file.isDirectory && (
        <span className="text-xs text-muted-foreground">
          {file.sizeFormatted}
        </span>
      )}
    </div>
  )
}

function FileListItem({ 
  file, 
  isSelected, 
  isFavorite,
  onClick, 
  onDoubleClick,
  onContextMenu,
  onDragStart,
  onDrop,
  onDragOver,
  onOpenInExplorer
}: FileItemProps): JSX.Element {
  return (
    <div
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
      draggable
      onDragStart={onDragStart}
      onDrop={onDrop}
      onDragOver={onDragOver}
      className={`file-item grid grid-cols-12 gap-4 px-3 py-2 rounded-md cursor-pointer ${
        isSelected 
          ? 'bg-primary/10' 
          : 'hover:bg-muted'
      }`}
    >
      <div className="col-span-6 flex items-center gap-3 overflow-hidden">
        {isFavorite && (
          <Star className="h-3 w-3 fill-yellow-500 text-yellow-500 shrink-0" />
        )}
        {file.isDirectory ? (
          <Folder className="h-5 w-5 text-yellow-500 shrink-0" />
        ) : (
          <span className="shrink-0">{categoryIcons[file.category]}</span>
        )}
        <span className="truncate" title={file.name}>{file.name}</span>
      </div>
      <div className="col-span-2 flex items-center text-sm text-muted-foreground">
        {file.isDirectory ? '--' : file.sizeFormatted}
      </div>
      <div className="col-span-3 flex items-center text-sm text-muted-foreground">
        {new Date(file.modifiedAt).toLocaleDateString()}
      </div>
      <div className="col-span-1 flex items-center justify-end">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onOpenInExplorer?.()
          }}
          className="p-1 hover:bg-muted rounded"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

