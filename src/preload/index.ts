import { contextBridge, ipcRenderer } from 'electron'
import { FileInfo, SearchResult } from '../shared/types'

// Types for index operations
interface ScanResult {
  totalFiles: number
  totalFolders: number
  durationMs: number
}

interface IndexStats {
  totalFiles: number
  totalFolders: number
  lastScan: string | null
}

// Custom APIs for renderer
const api = {
  // Dialog
  openFolderDialog: (): Promise<string | null> =>
    ipcRenderer.invoke('dialog:open-folder'),

  // File operations
  scanDirectory: (path: string): Promise<FileInfo[]> => 
    ipcRenderer.invoke('file:scan-directory', path),
  
  getFileInfo: (path: string): Promise<FileInfo> => 
    ipcRenderer.invoke('file:get-file-info', path),
  
  openFile: (path: string): Promise<void> => 
    ipcRenderer.invoke('file:open-file', path),
  
  openFolder: (path: string): Promise<void> => 
    ipcRenderer.invoke('file:open-folder', path),

  quickOpen: (path: string, appPath?: string): Promise<boolean> =>
    ipcRenderer.invoke('file:quick-open', path, appPath),

  readFileBuffer: (path: string): Promise<Buffer> =>
    ipcRenderer.invoke('file:read-buffer', path),

  readImageUrl: (path: string): Promise<string> =>
    ipcRenderer.invoke('file:read-image-url', path),

  // File operations
  renameFile: (oldPath: string, newName: string): Promise<string> =>
    ipcRenderer.invoke('file:rename', oldPath, newName),

  deleteFile: (path: string): Promise<void> =>
    ipcRenderer.invoke('file:delete', path),

  moveFile: (sourcePath: string, destFolder: string): Promise<string> =>
    ipcRenderer.invoke('file:move', sourcePath, destFolder),

  copyFile: (sourcePath: string, destFolder: string): Promise<string> =>
    ipcRenderer.invoke('file:copy', sourcePath, destFolder),

  getFolderSize: (folderPath: string): Promise<number> =>
    ipcRenderer.invoke('file:get-folder-size', folderPath),

  // AutoCAD operations
  getAutocadPreview: (path: string): Promise<string | null> =>
    ipcRenderer.invoke('autocad:get-preview', path),

  getAutocadMetadata: (path: string): Promise<Record<string, string>> =>
    ipcRenderer.invoke('autocad:get-metadata', path),

  // Search operations
  search: (query: string, files: FileInfo[]): Promise<SearchResult[]> => 
    ipcRenderer.invoke('search:query', query, files),

  // Index operations
  indexScan: (rootPath: string): Promise<ScanResult> =>
    ipcRenderer.invoke('index:scan', rootPath),
  
  indexSearch: (query: string): Promise<FileInfo[]> =>
    ipcRenderer.invoke('index:search', query),
  
  indexGetFiles: (parentPath: string): Promise<FileInfo[]> =>
    ipcRenderer.invoke('index:get-files', parentPath),
  
  indexGetStats: (): Promise<IndexStats> =>
    ipcRenderer.invoke('index:get-stats'),
  
  indexGetByCategory: (category: string): Promise<FileInfo[]> =>
    ipcRenderer.invoke('index:get-by-category', category),
  
  indexClear: (): Promise<void> =>
    ipcRenderer.invoke('index:clear'),
  
  indexIsScanning: (): Promise<boolean> =>
    ipcRenderer.invoke('index:is-scanning'),

  // Listen for index progress
  onIndexProgress: (callback: (data: { current: string; count: number }) => void) => {
    ipcRenderer.on('index:progress', (_, data) => callback(data))
    return () => ipcRenderer.removeAllListeners('index:progress')
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.api = api
}

