import sql from 'mssql'
import { FileInfo } from '../../shared/types'

// SQL Server configuration using SQL Authentication
const config: sql.config = {
  server: 'localhost',
  database: 'FileManagerDB',
  port: 62370,
  user: 'FileManagerApp',
  password: 'FileManager123!',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true
  },
  connectionTimeout: 30000,
  requestTimeout: 30000
}

export class SqlServerService {
  private pool: sql.ConnectionPool | null = null
  private isConnected = false

  async connect(): Promise<void> {
    if (this.isConnected && this.pool) return

    try {
      this.pool = await sql.connect(config)
      this.isConnected = true
      console.log('Connected to SQL Server')
      await this.initialize()
    } catch (err) {
      console.error('SQL Server connection error:', err)
      throw err
    }
  }

  /**
   * Initialize database schema
   */
  private async initialize(): Promise<void> {
    if (!this.pool) return

    // Create database if not exists (need master connection first)
    try {
      // Create tables
      await this.pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='files' AND xtype='U')
        CREATE TABLE files (
          id NVARCHAR(255) PRIMARY KEY,
          name NVARCHAR(500) NOT NULL,
          path NVARCHAR(MAX) NOT NULL,
          extension NVARCHAR(50),
          size BIGINT,
          category NVARCHAR(50),
          is_directory BIT DEFAULT 0,
          created_at DATETIME,
          modified_at DATETIME,
          parent_path NVARCHAR(MAX),
          indexed_at DATETIME DEFAULT GETDATE()
        );
      `)

      await this.pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='scan_info' AND xtype='U')
        CREATE TABLE scan_info (
          id INT IDENTITY(1,1) PRIMARY KEY,
          root_path NVARCHAR(MAX),
          total_files INT,
          total_folders INT,
          last_scan DATETIME,
          scan_duration_ms INT
        );
      `)

      await this.pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='file_comments' AND xtype='U')
        CREATE TABLE file_comments (
          id INT IDENTITY(1,1) PRIMARY KEY,
          file_path NVARCHAR(MAX) NOT NULL,
          comment NVARCHAR(MAX),
          updated_at DATETIME DEFAULT GETDATE()
        );
      `)

      // Create indexes
      await this.pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='idx_files_name')
        CREATE INDEX idx_files_name ON files(name);
      `)

      await this.pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='idx_files_category')
        CREATE INDEX idx_files_category ON files(category);
      `)

      console.log('SQL Server tables initialized')
    } catch (err) {
      console.error('SQL Server initialization error:', err)
    }
  }

  /**
   * Insert multiple files (batch insert)
   */
  async insertFiles(files: FileInfo[]): Promise<void> {
    if (!this.pool) await this.connect()

    const transaction = new sql.Transaction(this.pool!)
    await transaction.begin()

    try {
      for (const file of files) {
        await transaction.request()
          .input('id', sql.NVarChar, file.id)
          .input('name', sql.NVarChar, file.name)
          .input('path', sql.NVarChar, file.path)
          .input('extension', sql.NVarChar, file.extension)
          .input('size', sql.BigInt, file.size || 0)
          .input('category', sql.NVarChar, file.category)
          .input('is_directory', sql.Bit, file.isDirectory ? 1 : 0)
          .input('created_at', sql.DateTime, file.createdAt)
          .input('modified_at', sql.DateTime, file.modifiedAt)
          .input('parent_path', sql.NVarChar, file.parentPath)
          .query(`
            MERGE files AS target
            USING (SELECT @id AS id) AS source
            ON target.id = source.id
            WHEN MATCHED THEN
              UPDATE SET name=@name, path=@path, extension=@extension, size=@size,
                         category=@category, is_directory=@is_directory,
                         created_at=@created_at, modified_at=@modified_at,
                         parent_path=@parent_path, indexed_at=GETDATE()
            WHEN NOT MATCHED THEN
              INSERT (id, name, path, extension, size, category, is_directory, created_at, modified_at, parent_path)
              VALUES (@id, @name, @path, @extension, @size, @category, @is_directory, @created_at, @modified_at, @parent_path);
          `)
      }

      await transaction.commit()
    } catch (err) {
      await transaction.rollback()
      throw err
    }
  }

  /**
   * Search files
   */
  async searchFiles(query: string, options?: { category?: string; limit?: number }): Promise<FileInfo[]> {
    if (!this.pool) await this.connect()

    let sqlQuery = `SELECT TOP (@limit) * FROM files WHERE name LIKE @query`
    
    if (options?.category) {
      sqlQuery += ` AND category = @category`
    }
    
    sqlQuery += ` ORDER BY name`

    const request = this.pool!.request()
      .input('query', sql.NVarChar, `%${query}%`)
      .input('limit', sql.Int, options?.limit || 50)

    if (options?.category) {
      request.input('category', sql.NVarChar, options.category)
    }

    const result = await request.query(sqlQuery)
    return result.recordset.map(this.rowToFileInfo)
  }

  /**
   * Get stats
   */
  async getStats(): Promise<{ totalFiles: number; totalFolders: number; byCategory: Record<string, number> }> {
    if (!this.pool) await this.connect()

    const filesResult = await this.pool!.request().query(`
      SELECT COUNT(*) as count FROM files WHERE is_directory = 0
    `)
    const foldersResult = await this.pool!.request().query(`
      SELECT COUNT(*) as count FROM files WHERE is_directory = 1
    `)
    const categoryResult = await this.pool!.request().query(`
      SELECT category, COUNT(*) as count FROM files WHERE is_directory = 0 GROUP BY category
    `)

    const byCategory: Record<string, number> = {}
    for (const row of categoryResult.recordset) {
      byCategory[row.category || 'other'] = row.count
    }

    return {
      totalFiles: filesResult.recordset[0].count,
      totalFolders: foldersResult.recordset[0].count,
      byCategory
    }
  }

  /**
   * Clear all files
   */
  async clearAll(): Promise<void> {
    if (!this.pool) await this.connect()
    await this.pool!.request().query('DELETE FROM files')
    await this.pool!.request().query('DELETE FROM scan_info')
  }

  /**
   * Update scan info
   */
  async updateScanInfo(rootPath: string, totalFiles: number, totalFolders: number, durationMs: number): Promise<void> {
    if (!this.pool) await this.connect()
    
    await this.pool!.request()
      .input('root_path', sql.NVarChar, rootPath)
      .input('total_files', sql.Int, totalFiles)
      .input('total_folders', sql.Int, totalFolders)
      .input('duration_ms', sql.Int, durationMs)
      .query(`
        INSERT INTO scan_info (root_path, total_files, total_folders, last_scan, scan_duration_ms)
        VALUES (@root_path, @total_files, @total_folders, GETDATE(), @duration_ms)
      `)
  }

  /**
   * Get file comment
   */
  async getComment(filePath: string): Promise<string | null> {
    if (!this.pool) await this.connect()
    
    const result = await this.pool!.request()
      .input('file_path', sql.NVarChar, filePath)
      .query('SELECT comment FROM file_comments WHERE file_path = @file_path')
    
    return result.recordset[0]?.comment || null
  }

  /**
   * Set file comment
   */
  async setComment(filePath: string, comment: string): Promise<void> {
    if (!this.pool) await this.connect()
    
    await this.pool!.request()
      .input('file_path', sql.NVarChar, filePath)
      .input('comment', sql.NVarChar, comment)
      .query(`
        MERGE file_comments AS target
        USING (SELECT @file_path AS file_path) AS source
        ON target.file_path = source.file_path
        WHEN MATCHED THEN
          UPDATE SET comment = @comment, updated_at = GETDATE()
        WHEN NOT MATCHED THEN
          INSERT (file_path, comment) VALUES (@file_path, @comment);
      `)
  }

  /**
   * Delete file comment
   */
  async deleteComment(filePath: string): Promise<void> {
    if (!this.pool) await this.connect()
    
    await this.pool!.request()
      .input('file_path', sql.NVarChar, filePath)
      .query('DELETE FROM file_comments WHERE file_path = @file_path')
  }

  /**
   * Convert row to FileInfo
   */
  private rowToFileInfo(row: any): FileInfo {
    return {
      id: row.id,
      name: row.name,
      path: row.path,
      extension: row.extension || '',
      size: row.size,
      sizeFormatted: formatSize(row.size || 0),
      category: row.category || 'other',
      isDirectory: !!row.is_directory,
      createdAt: new Date(row.created_at),
      modifiedAt: new Date(row.modified_at),
      accessedAt: new Date(row.modified_at),
      parentPath: row.parent_path
    }
  }

  /**
   * Close connection
   */
  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.close()
      this.isConnected = false
    }
  }
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
