import Database from 'better-sqlite3'
import { join } from 'path'
import { app } from 'electron'
import { FileInfo } from '../../shared/types'

export class DatabaseService {
  private db: Database.Database

  constructor() {
    // Store database in app user data directory
    const dbPath = join(app.getPath('userData'), 'file-index.db')
    this.db = new Database(dbPath)
    this.initialize()
  }

  /**
   * Initialize database schema
   */
  private initialize(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS files (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        path TEXT NOT NULL UNIQUE,
        extension TEXT,
        size INTEGER,
        category TEXT,
        is_directory INTEGER DEFAULT 0,
        created_at TEXT,
        modified_at TEXT,
        parent_path TEXT,
        indexed_at TEXT DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_files_name ON files(name);
      CREATE INDEX IF NOT EXISTS idx_files_category ON files(category);
      CREATE INDEX IF NOT EXISTS idx_files_parent ON files(parent_path);
      CREATE INDEX IF NOT EXISTS idx_files_extension ON files(extension);

      CREATE TABLE IF NOT EXISTS scan_info (
        id INTEGER PRIMARY KEY,
        root_path TEXT,
        total_files INTEGER,
        total_folders INTEGER,
        last_scan TEXT,
        scan_duration_ms INTEGER
      );

      CREATE TABLE IF NOT EXISTS file_comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_path TEXT NOT NULL UNIQUE,
        comment TEXT,
        updated_at TEXT DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_comments_path ON file_comments(file_path);
    `)
  }

  /**
   * Insert multiple files (batch insert for performance)
   */
  insertFiles(files: FileInfo[]): void {
    const insert = this.db.prepare(`
      INSERT OR REPLACE INTO files (
        id, name, path, extension, size, category, 
        is_directory, created_at, modified_at, parent_path
      ) VALUES (
        @id, @name, @path, @extension, @size, @category,
        @isDirectory, @createdAt, @modifiedAt, @parentPath
      )
    `)

    const insertMany = this.db.transaction((files: FileInfo[]) => {
      for (const file of files) {
        insert.run({
          id: file.id,
          name: file.name,
          path: file.path,
          extension: file.extension,
          size: file.size,
          category: file.category,
          isDirectory: file.isDirectory ? 1 : 0,
          createdAt: file.createdAt.toISOString(),
          modifiedAt: file.modifiedAt.toISOString(),
          parentPath: file.parentPath
        })
      }
    })

    insertMany(files)
  }

  /**
   * Search files by name
   */
  searchFiles(query: string, limit = 100): FileInfo[] {
    const stmt = this.db.prepare(`
      SELECT * FROM files 
      WHERE name LIKE @query 
      ORDER BY 
        CASE WHEN name LIKE @exactStart THEN 0 ELSE 1 END,
        name
      LIMIT @limit
    `)

    const rows = stmt.all({
      query: `%${query}%`,
      exactStart: `${query}%`,
      limit
    }) as any[]

    return rows.map(this.rowToFileInfo)
  }

  /**
   * Get all files in a directory
   */
  getFilesInDirectory(parentPath: string): FileInfo[] {
    const stmt = this.db.prepare(`
      SELECT * FROM files WHERE parent_path = ? 
      ORDER BY is_directory DESC, name ASC
    `)

    const rows = stmt.all(parentPath) as any[]
    return rows.map(this.rowToFileInfo)
  }

  /**
   * Get files by category
   */
  getFilesByCategory(category: string): FileInfo[] {
    const stmt = this.db.prepare(`
      SELECT * FROM files WHERE category = ? AND is_directory = 0
      ORDER BY name ASC
    `)

    const rows = stmt.all(category) as any[]
    return rows.map(this.rowToFileInfo)
  }

  /**
   * Get index statistics
   */
  getStats(): { totalFiles: number; totalFolders: number; lastScan: string | null } {
    const files = this.db.prepare(
      'SELECT COUNT(*) as count FROM files WHERE is_directory = 0'
    ).get() as { count: number }
    
    const folders = this.db.prepare(
      'SELECT COUNT(*) as count FROM files WHERE is_directory = 1'
    ).get() as { count: number }

    const scanInfo = this.db.prepare(
      'SELECT last_scan FROM scan_info ORDER BY id DESC LIMIT 1'
    ).get() as { last_scan: string } | undefined

    return {
      totalFiles: files.count,
      totalFolders: folders.count,
      lastScan: scanInfo?.last_scan || null
    }
  }

  /**
   * Update scan info
   */
  updateScanInfo(rootPath: string, totalFiles: number, totalFolders: number, durationMs: number): void {
    this.db.prepare(`
      INSERT INTO scan_info (root_path, total_files, total_folders, last_scan, scan_duration_ms)
      VALUES (?, ?, ?, datetime('now'), ?)
    `).run(rootPath, totalFiles, totalFolders, durationMs)
  }

  /**
   * Clear all indexed files
   */
  clearIndex(): void {
    this.db.exec('DELETE FROM files')
  }

  /**
   * Convert database row to FileInfo
   */
  private rowToFileInfo(row: any): FileInfo {
    return {
      id: row.id,
      name: row.name,
      path: row.path,
      extension: row.extension || '',
      size: row.size,
      sizeFormatted: formatSize(row.size),
      category: row.category,
      isDirectory: row.is_directory === 1,
      createdAt: new Date(row.created_at),
      modifiedAt: new Date(row.modified_at),
      accessedAt: new Date(row.modified_at),
      parentPath: row.parent_path
    }
  }

  /**
   * Get comment for a file
   */
  getComment(filePath: string): string | null {
    const stmt = this.db.prepare(`
      SELECT comment FROM file_comments WHERE file_path = ?
    `)
    const row = stmt.get(filePath) as { comment: string } | undefined
    return row?.comment || null
  }

  /**
   * Set comment for a file
   */
  setComment(filePath: string, comment: string): void {
    const stmt = this.db.prepare(`
      INSERT INTO file_comments (file_path, comment, updated_at)
      VALUES (?, ?, datetime('now'))
      ON CONFLICT(file_path) DO UPDATE SET 
        comment = excluded.comment,
        updated_at = datetime('now')
    `)
    stmt.run(filePath, comment)
  }

  /**
   * Delete comment for a file
   */
  deleteComment(filePath: string): void {
    const stmt = this.db.prepare(`DELETE FROM file_comments WHERE file_path = ?`)
    stmt.run(filePath)
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close()
  }
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
