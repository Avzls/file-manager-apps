import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { autoUpdater } from 'electron-updater'

// Services
import { FileService } from './services/fileService'
import { SearchService } from './services/searchService'
import { DatabaseService } from './services/databaseService'
import { IndexService } from './services/indexService'
import { AutoCADService } from './services/autocadService'

// Initialize services
const fileService = new FileService()
const searchService = new SearchService()
const autocadService = new AutoCADService()
let dbService: DatabaseService
let indexService: IndexService

// Configure auto-updater
autoUpdater.autoDownload = true
autoUpdater.autoInstallOnAppQuit = true

function createWindow(): BrowserWindow {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    show: false,
    autoHideMenuBar: true,
    frame: true,
    titleBarStyle: 'default',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}

// IPC Handlers
function setupIpcHandlers(mainWindow: BrowserWindow): void {
  // Folder picker dialog
  ipcMain.handle('dialog:open-folder', async () => {
    const { dialog } = await import('electron')
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: 'Select Folder'
    })
    if (result.canceled || result.filePaths.length === 0) {
      return null
    }
    return result.filePaths[0]
  })

  // File operations
  ipcMain.handle('file:scan-directory', async (_, path: string) => {
    return await fileService.scanDirectory(path)
  })

  ipcMain.handle('file:get-file-info', async (_, path: string) => {
    return await fileService.getFileInfo(path)
  })

  ipcMain.handle('file:open-file', async (_, path: string) => {
    return await fileService.openFile(path)
  })

  ipcMain.handle('file:open-folder', async (_, path: string) => {
    return await fileService.openInExplorer(path)
  })

  // File operations
  ipcMain.handle('file:rename', async (_, oldPath: string, newName: string) => {
    const fs = await import('fs/promises')
    const path = await import('path')
    const dir = path.dirname(oldPath)
    const newPath = path.join(dir, newName)
    await fs.rename(oldPath, newPath)
    return newPath
  })

  ipcMain.handle('file:delete', async (_, path: string) => {
    const fs = await import('fs/promises')
    await fs.rm(path, { recursive: true })
  })

  ipcMain.handle('file:move', async (_, sourcePath: string, destFolder: string) => {
    const fs = await import('fs/promises')
    const path = await import('path')
    const fileName = path.basename(sourcePath)
    const destPath = path.join(destFolder, fileName)
    await fs.rename(sourcePath, destPath)
    return destPath
  })

  ipcMain.handle('file:copy', async (_, sourcePath: string, destFolder: string) => {
    const fs = await import('fs/promises')
    const path = await import('path')
    const fileName = path.basename(sourcePath)
    const destPath = path.join(destFolder, fileName)
    await fs.cp(sourcePath, destPath, { recursive: true })
    return destPath
  })

  // Folder size calculation
  ipcMain.handle('file:get-folder-size', async (_, folderPath: string) => {
    const fs = await import('fs/promises')
    const path = await import('path')
    
    async function getSize(dir: string): Promise<number> {
      let size = 0
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true })
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name)
          if (entry.isDirectory()) {
            size += await getSize(fullPath)
          } else {
            const stat = await fs.stat(fullPath)
            size += stat.size
          }
        }
      } catch {
        // Ignore access errors
      }
      return size
    }
    
    return await getSize(folderPath)
  })

  // Read file as buffer (for PDF rendering)
  ipcMain.handle('file:read-buffer', async (_, path: string) => {
    const fs = await import('fs/promises')
    const buffer = await fs.readFile(path)
    return buffer
  })

  // Read image as data URL
  ipcMain.handle('file:read-image-url', async (_, path: string) => {
    const fs = await import('fs/promises')
    const pathLib = await import('path')
    const buffer = await fs.readFile(path)
    const ext = pathLib.extname(path).toLowerCase().slice(1)
    const mimeTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'bmp': 'image/bmp',
      'svg': 'image/svg+xml'
    }
    const mimeType = mimeTypes[ext] || 'image/png'
    return `data:${mimeType};base64,${buffer.toString('base64')}`
  })

  // AutoCAD preview operations
  ipcMain.handle('autocad:get-preview', async (_, path: string) => {
    const previewPath = await autocadService.getPreview(path)
    if (previewPath) {
      // Read preview image as base64
      const fs = await import('fs/promises')
      const buffer = await fs.readFile(previewPath)
      return `data:image/bmp;base64,${buffer.toString('base64')}`
    }
    return null
  })

  ipcMain.handle('autocad:get-metadata', async (_, path: string) => {
    return await autocadService.getMetadata(path)
  })

  // Search operations
  ipcMain.handle('search:query', async (_, query: string, files: any[]) => {
    return searchService.search(query, files)
  })

  // Index operations
  ipcMain.handle('index:scan', async (_, rootPath: string) => {
    return await indexService.scanAndIndex(rootPath, (current, count) => {
      mainWindow.webContents.send('index:progress', { current, count })
    })
  })

  ipcMain.handle('index:search', async (_, query: string) => {
    return indexService.searchIndexed(query)
  })

  ipcMain.handle('index:get-files', async (_, parentPath: string) => {
    return indexService.getIndexedFiles(parentPath)
  })

  ipcMain.handle('index:get-stats', async () => {
    return indexService.getStats()
  })

  ipcMain.handle('index:get-by-category', async (_, category: string) => {
    return indexService.getFilesByCategory(category)
  })

  ipcMain.handle('index:clear', async () => {
    return indexService.clearIndex()
  })

  ipcMain.handle('index:is-scanning', async () => {
    return indexService.scanning
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.company.electron-file-manager')

  // Initialize database services
  dbService = new DatabaseService()
  indexService = new IndexService(fileService, dbService)

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  const mainWindow = createWindow()
  
  // Setup IPC handlers with window reference
  setupIpcHandlers(mainWindow)

  // Check for updates (only in production)
  if (!is.dev) {
    autoUpdater.checkForUpdatesAndNotify()
    
    // Auto-updater events
    autoUpdater.on('update-available', (info) => {
      mainWindow.webContents.send('update:available', info)
    })
    
    autoUpdater.on('update-downloaded', (info) => {
      mainWindow.webContents.send('update:downloaded', info)
    })
    
    autoUpdater.on('error', (err) => {
      console.error('Auto-updater error:', err)
    })
  }

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    dbService?.close()
    app.quit()
  }
})
