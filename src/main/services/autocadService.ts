/**
 * AutoCAD Preview Service
 * 
 * DWG/DXF files are proprietary formats. There are limited options for preview:
 * 
 * 1. Use embedded thumbnails (DWG files often contain embedded preview images)
 * 2. Use external converter services
 * 3. Use Forge Viewer (Autodesk cloud API)
 * 
 * For this implementation, we'll:
 * - Try to extract embedded thumbnails from DWG files
 * - Show file info and metadata for files without thumbnails
 * - Provide a "Open in AutoCAD" button as fallback
 */

import { promises as fs } from 'fs'
import { join } from 'path'
import { app } from 'electron'

export class AutoCADService {
  private cacheDir: string

  constructor() {
    this.cacheDir = join(app.getPath('userData'), 'autocad-previews')
    this.ensureCacheDir()
  }

  private async ensureCacheDir(): Promise<void> {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true })
    } catch (error) {
      console.error('Failed to create AutoCAD cache dir:', error)
    }
  }

  /**
   * Try to get preview for AutoCAD file
   * Returns path to preview image or null if not available
   */
  async getPreview(filePath: string): Promise<string | null> {
    const ext = filePath.toLowerCase()
    
    if (ext.endsWith('.dwg')) {
      return await this.extractDwgThumbnail(filePath)
    }
    
    // DXF and DWF don't typically have embedded thumbnails
    return null
  }

  /**
   * Try to extract embedded thumbnail from DWG file
   * DWG files often contain a BMP preview image starting at a specific offset
   */
  private async extractDwgThumbnail(filePath: string): Promise<string | null> {
    try {
      const buffer = await fs.readFile(filePath)
      
      // DWG file format: look for BMP header after the preview section header
      // This is a simplified approach - real implementation would need proper DWG parsing
      
      // Look for BMP signature (0x42 0x4D = "BM")
      for (let i = 0; i < Math.min(buffer.length - 100, 100000); i++) {
        if (buffer[i] === 0x42 && buffer[i + 1] === 0x4D) {
          // Found potential BMP header
          const bmpSize = buffer.readUInt32LE(i + 2)
          
          if (bmpSize > 100 && bmpSize < 1000000 && i + bmpSize <= buffer.length) {
            // Extract and save BMP
            const bmpData = buffer.slice(i, i + bmpSize)
            const cacheKey = this.hashPath(filePath)
            const cachePath = join(this.cacheDir, `${cacheKey}.bmp`)
            
            await fs.writeFile(cachePath, bmpData)
            return cachePath
          }
        }
      }
      
      return null
    } catch (error) {
      console.error('Failed to extract DWG thumbnail:', error)
      return null
    }
  }

  /**
   * Get metadata from AutoCAD file
   */
  async getMetadata(filePath: string): Promise<Record<string, string>> {
    try {
      const stat = await fs.stat(filePath)
      const ext = filePath.toLowerCase().split('.').pop() || ''
      
      return {
        'File Type': ext.toUpperCase(),
        'Size': this.formatSize(stat.size),
        'Modified': stat.mtime.toLocaleString(),
        'Created': stat.birthtime.toLocaleString()
      }
    } catch {
      return {}
    }
  }

  private hashPath(path: string): string {
    let hash = 0
    for (let i = 0; i < path.length; i++) {
      const char = path.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash).toString(16)
  }

  private formatSize(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
}
