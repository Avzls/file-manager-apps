import { useEffect, useRef, useState } from 'react'
import { 
  ZoomIn, 
  ZoomOut, 
  ChevronLeft, 
  ChevronRight,
  Loader2,
  RotateCw
} from 'lucide-react'
import * as pdfjsLib from 'pdfjs-dist'
// Import worker as URL for Vite bundling
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

// Use bundled worker for offline support
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl

interface PDFViewerProps {
  filePath: string
}

export function PDFViewer({ filePath }: PDFViewerProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [pdf, setPdf] = useState<pdfjsLib.PDFDocumentProxy | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [scale, setScale] = useState(1.0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load PDF
  useEffect(() => {
    let cancelled = false
    
    const loadPdf = async () => {
      setLoading(true)
      setError(null)
      
      try {
        // Read PDF file as buffer via IPC
        const bufferData = await (window as any).api.readFileBuffer(filePath)
        
        // IPC serializes Buffer - convert to Uint8Array
        // Buffer comes as { type: 'Buffer', data: [...] } or as regular array
        let data: Uint8Array
        if (bufferData.data && Array.isArray(bufferData.data)) {
          data = new Uint8Array(bufferData.data)
        } else if (bufferData instanceof Uint8Array) {
          data = bufferData
        } else {
          // Try direct conversion
          data = new Uint8Array(Object.values(bufferData))
        }
        
        const loadingTask = pdfjsLib.getDocument({ data })
        const pdfDoc = await loadingTask.promise
        
        if (!cancelled) {
          setPdf(pdfDoc)
          setTotalPages(pdfDoc.numPages)
          setCurrentPage(1)
          setLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          setError('Failed to load PDF')
          setLoading(false)
          console.error('PDF load error:', err)
        }
      }
    }

    loadPdf()
    
    return () => {
      cancelled = true
    }
  }, [filePath])

  // Render page
  useEffect(() => {
    if (!pdf || !canvasRef.current) return

    const renderPage = async () => {
      try {
        const page = await pdf.getPage(currentPage)
        const canvas = canvasRef.current!
        const context = canvas.getContext('2d')!
        
        const viewport = page.getViewport({ scale })
        
        canvas.height = viewport.height
        canvas.width = viewport.width
        
        // Use type assertion for compatibility with different pdfjs versions
        const renderContext = {
          canvasContext: context,
          viewport: viewport
        } as any
        
        await page.render(renderContext).promise
      } catch (err) {
        console.error('Page render error:', err)
      }
    }

    renderPage()
  }, [pdf, currentPage, scale])

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.25, 3))
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5))
  const handlePrevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1))
  const handleNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages))
  const handleResetZoom = () => setScale(1.0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Loading PDF...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-4">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Controls */}
      <div className="flex items-center justify-between px-2 py-1 bg-muted/50 border-b border-border">
        {/* Page Navigation */}
        <div className="flex items-center gap-1">
          <button
            onClick={handlePrevPage}
            disabled={currentPage <= 1}
            className="p-1 rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            title="Previous Page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs min-w-[60px] text-center">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={handleNextPage}
            disabled={currentPage >= totalPages}
            className="p-1 rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            title="Next Page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleZoomOut}
            disabled={scale <= 0.5}
            className="p-1 rounded hover:bg-muted disabled:opacity-50"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            onClick={handleResetZoom}
            className="text-xs min-w-[40px] text-center hover:bg-muted rounded px-1"
            title="Reset Zoom"
          >
            {Math.round(scale * 100)}%
          </button>
          <button
            onClick={handleZoomIn}
            disabled={scale >= 3}
            className="p-1 rounded hover:bg-muted disabled:opacity-50"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Canvas Container */}
      <div className="flex-1 overflow-auto bg-muted/30 flex items-start justify-center p-2">
        <canvas 
          ref={canvasRef} 
          className="shadow-lg"
          style={{ maxWidth: '100%', height: 'auto' }}
        />
      </div>
    </div>
  )
}
