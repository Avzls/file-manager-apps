import { FileInfo, SearchResult } from '../shared/types'

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

declare global {
  interface Window {
    api: {
      // File operations
      scanDirectory: (path: string) => Promise<FileInfo[]>
      getFileInfo: (path: string) => Promise<FileInfo>
      openFile: (path: string) => Promise<void>
      openFolder: (path: string) => Promise<void>
      
      // Search operations
      search: (query: string, files: FileInfo[]) => Promise<SearchResult[]>
      
      // Index operations
      indexScan: (rootPath: string) => Promise<ScanResult>
      indexSearch: (query: string) => Promise<FileInfo[]>
      indexGetFiles: (parentPath: string) => Promise<FileInfo[]>
      indexGetStats: () => Promise<IndexStats>
      indexGetByCategory: (category: string) => Promise<FileInfo[]>
      indexClear: () => Promise<void>
      indexIsScanning: () => Promise<boolean>
      
      // Event listeners
      onIndexProgress: (callback: (data: { current: string; count: number }) => void) => () => void
    }
  }
}
