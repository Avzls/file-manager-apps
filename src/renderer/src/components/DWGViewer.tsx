import { useState, useEffect } from 'react'
import { Loader2, FileWarning, ExternalLink } from 'lucide-react'

interface DWGViewerProps {
  filePath: string
  fileName: string
  onOpen: () => void
}

export function DWGViewer({ filePath, fileName, onOpen }: DWGViewerProps): JSX.Element {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [metadata, setMetadata] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    const loadPreview = async () => {
      try {
        // Try to get embedded preview
        const [preview, meta] = await Promise.all([
          (window as any).api.getAutocadPreview(filePath),
          (window as any).api.getAutocadMetadata(filePath)
        ])

        if (!cancelled) {
          setPreviewUrl(preview)
          setMetadata(meta)
          setLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadPreview()
    return () => { cancelled = true }
  }, [filePath])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Preview Area */}
      <div className="flex-1 flex items-center justify-center bg-muted/30 p-4">
        {previewUrl ? (
          <img 
            src={previewUrl} 
            alt={fileName}
            className="max-w-full max-h-full object-contain shadow-lg rounded"
          />
        ) : (
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <span className="text-4xl">📐</span>
            </div>
            <h3 className="font-medium text-lg mb-1">AutoCAD Drawing</h3>
            <p className="text-sm text-muted-foreground mb-4">
              No embedded preview available
            </p>
            <button
              onClick={onOpen}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm"
            >
              <ExternalLink className="h-4 w-4" />
              Open in AutoCAD
            </button>
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="p-4 border-t border-border space-y-2">
        {Object.entries(metadata).map(([key, value]) => (
          <div key={key} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{key}</span>
            <span className="font-medium">{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
