import Fuse from 'fuse.js'
import { FileInfo, SearchResult } from '../../shared/types'

export class SearchService {
  private fuse: Fuse<FileInfo> | null = null
  
  private readonly fuseOptions: Fuse.IFuseOptions<FileInfo> = {
    keys: [
      { name: 'name', weight: 0.7 },
      { name: 'extension', weight: 0.2 },
      { name: 'path', weight: 0.1 }
    ],
    threshold: 0.3,
    includeScore: true,
    includeMatches: true,
    minMatchCharLength: 2,
    ignoreLocation: true
  }

  /**
   * Initialize search index with files
   */
  initializeIndex(files: FileInfo[]): void {
    this.fuse = new Fuse(files, this.fuseOptions)
  }

  /**
   * Search files using fuzzy matching
   */
  search(query: string, files?: FileInfo[]): SearchResult[] {
    // If files provided, create temporary index
    if (files) {
      const tempFuse = new Fuse(files, this.fuseOptions)
      return this.performSearch(tempFuse, query)
    }
    
    // Use existing index
    if (!this.fuse) {
      console.warn('Search index not initialized')
      return []
    }
    
    return this.performSearch(this.fuse, query)
  }

  private performSearch(fuse: Fuse<FileInfo>, query: string): SearchResult[] {
    const results = fuse.search(query, { limit: 100 })
    
    return results.map((result) => ({
      file: result.item,
      score: result.score || 0,
      matches: result.matches?.map((match) => ({
        key: match.key || '',
        value: match.value || '',
        indices: match.indices as [number, number][]
      }))
    }))
  }

  /**
   * Filter files by category
   */
  filterByCategory(files: FileInfo[], categories: string[]): FileInfo[] {
    if (categories.length === 0) return files
    return files.filter((file) => categories.includes(file.category))
  }

  /**
   * Filter files by extension
   */
  filterByExtension(files: FileInfo[], extensions: string[]): FileInfo[] {
    if (extensions.length === 0) return files
    return files.filter((file) => 
      extensions.some((ext) => 
        file.extension.toLowerCase() === `.${ext.toLowerCase()}`
      )
    )
  }

  /**
   * Filter files by date range
   */
  filterByDateRange(
    files: FileInfo[], 
    startDate: Date, 
    endDate: Date
  ): FileInfo[] {
    return files.filter((file) => {
      const modified = new Date(file.modifiedAt)
      return modified >= startDate && modified <= endDate
    })
  }

  /**
   * Filter files by size range (in bytes)
   */
  filterBySizeRange(
    files: FileInfo[], 
    minSize: number, 
    maxSize: number
  ): FileInfo[] {
    return files.filter((file) => 
      file.size >= minSize && file.size <= maxSize
    )
  }

  /**
   * Clear the search index
   */
  clearIndex(): void {
    this.fuse = null
  }
}
