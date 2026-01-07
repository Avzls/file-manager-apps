/**
 * Thumbnail Service using Electron's nativeImage
 * No external dependencies required
 */

import { nativeImage, app } from 'electron'
import { promises as fs } from 'fs'
import { join } from 'path'
import { FileInfo } from '../../shared/types'

export class ThumbnailService {
  private cacheDir: string
  private readonly sizes = {
    small: 64,
    medium: 128,
    large: 256
  }

  constructor() {
    this.cacheDir = join(app.getPath('userData'), 'thumbnails')
    this.ensureCacheDir()
  }

  private async ensureCacheDir(): Promise<void> {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true })
    } catch (error) {
      console.error('Failed to create thumbnail cache dir:', error)
    }
  }

  /**
   * Get thumbnail for a file
   * For images: resize and cache
   * For other files: return null (use icon instead)
   */
  async getThumbnail(
    file: FileInfo, 
    size: 'small' | 'medium' | 'large' = 'medium'
  ): Promise<string | null> {
    if (file.isDirectory) return null
    if (file.category !== 'image') return null

    const targetSize = this.sizes[size]
    const cacheKey = this.getCacheKey(file.path, size)
    const cachePath = join(this.cacheDir, cacheKey)

    // Check cache
    try {
      await fs.access(cachePath)
      return cachePath
    } catch {
      // Generate thumbnail
    }

    try {
      // Read image using nativeImage
      const image = nativeImage.createFromPath(file.path)
      
      if (image.isEmpty()) {
        return null
      }

      // Get original size
      const originalSize = image.getSize()
      
      // Calculate new size maintaining aspect ratio
      let width = targetSize
      let height = targetSize
      
      if (originalSize.width > originalSize.height) {
        height = Math.round((originalSize.height / originalSize.width) * targetSize)
      } else {
        width = Math.round((originalSize.width / originalSize.height) * targetSize)
      }

      // Resize
      const resized = image.resize({ width, height, quality: 'good' })
      
      // Save as JPEG
      const buffer = resized.toJPEG(80)
      await fs.writeFile(cachePath, buffer)

      return cachePath
    } catch (error) {
      console.error('Failed to generate thumbnail:', error)
      return null
    }
  }

  /**
   * Get thumbnail as base64 data URL (for renderer process)
   */
  async getThumbnailDataUrl(
    file: FileInfo, 
    size: 'small' | 'medium' | 'large' = 'medium'
  ): Promise<string | null> {
    const path = await this.getThumbnail(file, size)
    
    if (!path) return null

    try {
      const buffer = await fs.readFile(path)
      return `data:image/jpeg;base64,${buffer.toString('base64')}`
    } catch {
      return null
    }
  }

  /**
   * Generate cache key
   */
  private getCacheKey(filePath: string, size: string): string {
    const hash = this.hashString(filePath)
    return `${hash}_${size}.jpg`
  }

  /**
   * Simple hash function
   */
  private hashString(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash).toString(16)
  }

  /**
   * Clear thumbnail cache
   */
  async clearCache(): Promise<void> {
    try {
      const files = await fs.readdir(this.cacheDir)
      await Promise.all(
        files.map(file => fs.unlink(join(this.cacheDir, file)))
      )
    } catch (error) {
      console.error('Failed to clear cache:', error)
    }
  }
}
