import { promises as fs } from 'fs'
import { join, extname, basename, dirname } from 'path'
import { shell } from 'electron'
import { FileInfo, getFileCategory, formatFileSize } from '../../shared/types'
import { v4 as uuidv4 } from 'uuid'

export class FileService {
  private readonly serverPath = '\\\\192.168.2.10\\engineering'

  /**
   * Scan a directory and return all files and folders
   */
  async scanDirectory(dirPath: string): Promise<FileInfo[]> {
    const results: FileInfo[] = []
    
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true })
      
      for (const entry of entries) {
        try {
          const fullPath = join(dirPath, entry.name)
          const stats = await fs.stat(fullPath)
          const extension = entry.isDirectory() ? '' : extname(entry.name)
          
          const fileInfo: FileInfo = {
            id: uuidv4(),
            name: entry.name,
            path: fullPath,
            extension: extension,
            size: stats.size,
            sizeFormatted: formatFileSize(stats.size),
            category: entry.isDirectory() ? 'other' : getFileCategory(extension),
            isDirectory: entry.isDirectory(),
            createdAt: stats.birthtime,
            modifiedAt: stats.mtime,
            accessedAt: stats.atime,
            parentPath: dirPath
          }
          
          results.push(fileInfo)
        } catch (error) {
          // Skip files that can't be accessed
          console.error(`Cannot access: ${entry.name}`, error)
        }
      }
    } catch (error) {
      console.error('Error scanning directory:', error)
      throw error
    }
    
    // Sort: folders first, then files alphabetically
    return results.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1
      if (!a.isDirectory && b.isDirectory) return 1
      return a.name.localeCompare(b.name)
    })
  }

  /**
   * Recursively scan directory for indexing
   */
  async scanDirectoryRecursive(
    dirPath: string, 
    onProgress?: (current: string, count: number) => void
  ): Promise<FileInfo[]> {
    const allFiles: FileInfo[] = []
    let count = 0
    
    const scan = async (currentPath: string): Promise<void> => {
      try {
        const entries = await fs.readdir(currentPath, { withFileTypes: true })
        
        for (const entry of entries) {
          const fullPath = join(currentPath, entry.name)
          
          try {
            const stats = await fs.stat(fullPath)
            const extension = entry.isDirectory() ? '' : extname(entry.name)
            
            const fileInfo: FileInfo = {
              id: uuidv4(),
              name: entry.name,
              path: fullPath,
              extension: extension,
              size: stats.size,
              sizeFormatted: formatFileSize(stats.size),
              category: entry.isDirectory() ? 'other' : getFileCategory(extension),
              isDirectory: entry.isDirectory(),
              createdAt: stats.birthtime,
              modifiedAt: stats.mtime,
              accessedAt: stats.atime,
              parentPath: currentPath
            }
            
            allFiles.push(fileInfo)
            count++
            
            if (onProgress) {
              onProgress(fullPath, count)
            }
            
            // Recurse into directories
            if (entry.isDirectory()) {
              await scan(fullPath)
            }
          } catch (error) {
            // Skip inaccessible files
            console.error(`Cannot access: ${fullPath}`)
          }
        }
      } catch (error) {
        console.error(`Cannot read directory: ${currentPath}`)
      }
    }
    
    await scan(dirPath)
    return allFiles
  }

  /**
   * Get detailed file information
   */
  async getFileInfo(filePath: string): Promise<FileInfo> {
    const stats = await fs.stat(filePath)
    const extension = extname(filePath)
    
    return {
      id: uuidv4(),
      name: basename(filePath),
      path: filePath,
      extension: extension,
      size: stats.size,
      sizeFormatted: formatFileSize(stats.size),
      category: stats.isDirectory() ? 'other' : getFileCategory(extension),
      isDirectory: stats.isDirectory(),
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime,
      accessedAt: stats.atime,
      parentPath: dirname(filePath)
    }
  }

  /**
   * Open file with default application
   */
  async openFile(filePath: string): Promise<void> {
    await shell.openPath(filePath)
  }

  /**
   * Open folder in Windows Explorer
   */
  async openInExplorer(filePath: string): Promise<void> {
    shell.showItemInFolder(filePath)
  }

  /**
   * Get the default server path
   */
  getServerPath(): string {
    return this.serverPath
  }
}
