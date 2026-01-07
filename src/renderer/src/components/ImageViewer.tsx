import { useState, useEffect } from 'react'
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  RotateCcw,
  Maximize2,
  X,
  Loader2
} from 'lucide-react'

interface ImageViewerProps {
  filePath: string
  fileName: string
}

export function ImageViewer({ filePath, fileName }: ImageViewerProps): JSX.Element {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  // Load image via IPC
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    const loadImage = async () => {
      try {
        const dataUrl = await (window as any).api.readImageUrl(filePath)
        if (!cancelled) {
          setImageUrl(dataUrl)
          setLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          setError('Failed to load image')
          setLoading(false)
        }
      }
    }

    loadImage()
    return () => { cancelled = true }
  }, [filePath])

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.25, 4))
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.25))
  const handleRotateRight = () => setRotation(prev => (prev + 90) % 360)
  const handleRotateLeft = () => setRotation(prev => (prev - 90 + 360) % 360)
  const handleReset = () => {
    setScale(1)
    setRotation(0)
    setPosition({ x: 0, y: 0 })
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    if (e.deltaY < 0) {
      setScale(prev => Math.min(prev + 0.1, 4))
    } else {
      setScale(prev => Math.max(prev - 0.1, 0.25))
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Error state
  if (error || !imageUrl) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <span className="text-red-500 text-sm">{error || 'Failed to load'}</span>
      </div>
    )
  }

  // Fullscreen image viewer
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col">
        {/* Fullscreen Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-black/50">
          <span className="text-white text-sm truncate">{fileName}</span>
          <button
            onClick={() => setIsFullscreen(false)}
            className="p-2 rounded hover:bg-white/20 text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Fullscreen Image */}
        <div
          className="flex-1 flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          <img
            src={imageUrl}
            alt={fileName}
            className="max-w-none select-none"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
              transition: isDragging ? 'none' : 'transform 0.2s'
            }}
            draggable={false}
          />
        </div>

        {/* Fullscreen Controls */}
        <div className="flex items-center justify-center gap-2 px-4 py-3 bg-black/50">
          <button onClick={handleZoomOut} className="p-2 rounded hover:bg-white/20 text-white">
            <ZoomOut className="h-5 w-5" />
          </button>
          <span className="text-white text-sm min-w-[50px] text-center">{Math.round(scale * 100)}%</span>
          <button onClick={handleZoomIn} className="p-2 rounded hover:bg-white/20 text-white">
            <ZoomIn className="h-5 w-5" />
          </button>
          <div className="w-px h-6 bg-white/30 mx-2" />
          <button onClick={handleRotateLeft} className="p-2 rounded hover:bg-white/20 text-white">
            <RotateCcw className="h-5 w-5" />
          </button>
          <button onClick={handleRotateRight} className="p-2 rounded hover:bg-white/20 text-white">
            <RotateCw className="h-5 w-5" />
          </button>
          <div className="w-px h-6 bg-white/30 mx-2" />
          <button 
            onClick={handleReset} 
            className="px-3 py-1 rounded hover:bg-white/20 text-white text-sm"
          >
            Reset
          </button>
        </div>
      </div>
    )
  }

  // Normal panel view
  return (
    <div className="flex flex-col h-full">
      {/* Controls */}
      <div className="flex items-center justify-between px-2 py-1 bg-muted/50 border-b border-border">
        <div className="flex items-center gap-1">
          <button onClick={handleZoomOut} className="p-1 rounded hover:bg-muted" title="Zoom Out">
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="text-xs min-w-[40px] text-center">{Math.round(scale * 100)}%</span>
          <button onClick={handleZoomIn} className="p-1 rounded hover:bg-muted" title="Zoom In">
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={handleRotateLeft} className="p-1 rounded hover:bg-muted" title="Rotate Left">
            <RotateCcw className="h-4 w-4" />
          </button>
          <button onClick={handleRotateRight} className="p-1 rounded hover:bg-muted" title="Rotate Right">
            <RotateCw className="h-4 w-4" />
          </button>
          <button 
            onClick={() => setIsFullscreen(true)} 
            className="p-1 rounded hover:bg-muted" 
            title="Fullscreen"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Image Container */}
      <div
        className="flex-1 flex items-center justify-center overflow-hidden bg-muted/30 cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <img
          src={imageUrl}
          alt={fileName}
          className="max-w-full max-h-full object-contain select-none"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
            transition: isDragging ? 'none' : 'transform 0.2s'
          }}
          draggable={false}
          onError={(e) => {
            (e.target as HTMLImageElement).src = ''
          }}
        />
      </div>
    </div>
  )
}
