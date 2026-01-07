// File type categories
export type FileCategory = 
  | 'image' 
  | 'video' 
  | 'pdf' 
  | 'autocad' 
  | 'document' 
  | 'spreadsheet' 
  | 'archive' 
  | 'other'

// File information
export interface FileInfo {
  id: string
  name: string
  path: string
  extension: string
  size: number
  sizeFormatted: string
  category: FileCategory
  isDirectory: boolean
  createdAt: Date
  modifiedAt: Date
  accessedAt: Date
  thumbnailPath?: string
  parentPath: string
}

// Folder information
export interface FolderInfo {
  path: string
  name: string
  fileCount: number
  folderCount: number
  totalSize: number
}

// Search result
export interface SearchResult {
  file: FileInfo
  score: number
  matches?: {
    key: string
    value: string
    indices: [number, number][]
  }[]
}

// Search filters
export interface SearchFilters {
  query: string
  categories: FileCategory[]
  extensions: string[]
  dateRange?: {
    start: Date
    end: Date
  }
  sizeRange?: {
    min: number
    max: number
  }
  folder?: string
}

// Scan progress
export interface ScanProgress {
  status: 'idle' | 'scanning' | 'indexing' | 'complete' | 'error'
  currentPath: string
  filesScanned: number
  totalFiles: number
  foldersScanned: number
  errorMessage?: string
}

// Preview data
export interface PreviewData {
  type: 'image' | 'video' | 'pdf' | 'text' | 'unsupported'
  path: string
  thumbnailPath?: string
  metadata?: Record<string, unknown>
}

// App settings
export interface AppSettings {
  serverPath: string
  indexOnStartup: boolean
  thumbnailSize: 'small' | 'medium' | 'large'
  theme: 'light' | 'dark' | 'system'
  recentFolders: string[]
}

// File extension mappings
export const EXTENSION_CATEGORIES: Record<string, FileCategory> = {
  // Images
  jpg: 'image', jpeg: 'image', png: 'image', gif: 'image', 
  bmp: 'image', webp: 'image', svg: 'image', ico: 'image',
  
  // Videos
  mp4: 'video', avi: 'video', mkv: 'video', mov: 'video', 
  wmv: 'video', flv: 'video', webm: 'video',
  
  // PDF
  pdf: 'pdf',
  
  // AutoCAD
  dwg: 'autocad', dxf: 'autocad', dwf: 'autocad',
  
  // Documents
  doc: 'document', docx: 'document', txt: 'document', 
  rtf: 'document', odt: 'document',
  
  // Spreadsheets
  xls: 'spreadsheet', xlsx: 'spreadsheet', csv: 'spreadsheet', 
  ods: 'spreadsheet',
  
  // Archives
  zip: 'archive', rar: 'archive', '7z': 'archive', tar: 'archive', gz: 'archive'
}

export function getFileCategory(extension: string): FileCategory {
  const ext = extension.toLowerCase().replace('.', '')
  return EXTENSION_CATEGORIES[ext] || 'other'
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
