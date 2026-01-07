import { useState, useEffect, useCallback } from 'react'
import { Toaster } from 'sonner'
import { Sidebar } from './components/Sidebar'
import { Header } from './components/Header'
import { FileList } from './components/FileList'
import { PreviewPanel } from './components/PreviewPanel'
import { Settings } from './components/Settings'
import { ResizeHandle } from './components/ResizeHandle'
import { useFileStore } from './stores/fileStore'
import { initializeTheme } from './stores/settingsStore'

function App(): JSX.Element {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [previewWidth, setPreviewWidth] = useState(400) // Default 400px
  const { selectedFile } = useFileStore()

  // Initialize theme on mount
  useEffect(() => {
    initializeTheme()
  }, [])

  // Handle resize
  const handleResize = useCallback((delta: number) => {
    setPreviewWidth(prev => {
      const newWidth = prev + delta
      // Clamp between 200 and 800
      return Math.min(800, Math.max(200, newWidth))
    })
  }, [])

  const showPreview = selectedFile && !selectedFile.isDirectory

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Toast Notifications */}
      <Toaster 
        theme="system" 
        position="bottom-right"
        richColors
        closeButton
        toastOptions={{
          style: {
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            color: 'hsl(var(--foreground))',
          }
        }}
      />

      {/* Header */}
      <Header />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar 
          collapsed={sidebarCollapsed} 
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          onOpenSettings={() => setSettingsOpen(true)}
        />

        {/* File List */}
        <main className="flex-1 overflow-hidden">
          <FileList />
        </main>

        {/* Preview Panel with Resize Handle */}
        {showPreview && (
          <>
            <ResizeHandle onResize={handleResize} />
            <PreviewPanel width={previewWidth} />
          </>
        )}
      </div>

      {/* Settings Modal */}
      <Settings isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}

export default App
