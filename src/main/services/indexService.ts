import { BrowserWindow } from 'electron'
import { FileService } from './fileService'
import { DatabaseService } from './databaseService'
import { FileInfo } from '../../shared/types'

export class IndexService {
  private fileService: FileService
  private dbService: DatabaseService
  private isScanning = false

  constructor(fileService: FileService, dbService: DatabaseService) {
    this.fileService = fileService
    this.dbService = dbService
  }

  /**
   * Check if currently scanning
   */
  get scanning(): boolean {
    return this.isScanning
  }

  /**
   * Scan and index a directory recursively
   */
  async scanAndIndex(
    rootPath: string,
    onProgress?: (current: string, scanned: number) => void
  ): Promise<{ totalFiles: number; totalFolders: number; durationMs: number }> {
    if (this.isScanning) {
      throw new Error('A scan is already in progress')
    }

    this.isScanning = true
    const startTime = Date.now()
    
    let totalFiles = 0
    let totalFolders = 0
    const batch: FileInfo[] = []
    const BATCH_SIZE = 500

    try {
      // Clear existing index for this path
      this.dbService.clearIndex()

      // Recursive scan
      const scanDirectory = async (dirPath: string): Promise<void> => {
        try {
          const entries = await this.fileService.scanDirectory(dirPath)
          
          for (const entry of entries) {
            batch.push(entry)
            
            if (entry.isDirectory) {
              totalFolders++
            } else {
              totalFiles++
            }

            // Send progress update
            if (onProgress) {
              onProgress(entry.path, totalFiles + totalFolders)
            }

            // Flush batch when full
            if (batch.length >= BATCH_SIZE) {
              this.dbService.insertFiles([...batch])
              batch.length = 0
            }

            // Recurse into directories
            if (entry.isDirectory) {
              await scanDirectory(entry.path)
            }
          }
        } catch (error) {
          console.error(`Failed to scan: ${dirPath}`, error)
        }
      }

      await scanDirectory(rootPath)

      // Insert remaining files
      if (batch.length > 0) {
        this.dbService.insertFiles(batch)
      }

      const durationMs = Date.now() - startTime
      
      // Save scan info
      this.dbService.updateScanInfo(rootPath, totalFiles, totalFolders, durationMs)

      return { totalFiles, totalFolders, durationMs }
    } finally {
      this.isScanning = false
    }
  }

  /**
   * Search indexed files
   */
  searchIndexed(query: string): FileInfo[] {
    return this.dbService.searchFiles(query)
  }

  /**
   * Get files from index by parent path
   */
  getIndexedFiles(parentPath: string): FileInfo[] {
    return this.dbService.getFilesInDirectory(parentPath)
  }

  /**
   * Get files by category
   */
  getFilesByCategory(category: string): FileInfo[] {
    return this.dbService.getFilesByCategory(category)
  }

  /**
   * Get index statistics
   */
  getStats(): { totalFiles: number; totalFolders: number; lastScan: string | null } {
    return this.dbService.getStats()
  }

  /**
   * Clear the index
   */
  clearIndex(): void {
    this.dbService.clearIndex()
  }

  /**
   * Send progress to renderer via IPC
   */
  sendProgressToWindow(window: BrowserWindow, current: string, count: number): void {
    window.webContents.send('index:progress', { current, count })
  }
}
