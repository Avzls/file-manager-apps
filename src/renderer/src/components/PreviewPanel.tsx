import { X, ExternalLink, FolderOpen } from 'lucide-react'
import { useFileStore } from '../stores/fileStore'
import { PDFViewer } from './PDFViewer'
import { ImageViewer } from './ImageViewer'
import { DWGViewer } from './DWGViewer'

interface PreviewPanelProps {
  width?: number
}

export function PreviewPanel({ width }: PreviewPanelProps): JSX.Element {
  const { selectedFile, setSelectedFile, openFile, openInExplorer } = useFileStore()

  if (!selectedFile) return <></>

  const isImage = selectedFile.category === 'image'
  const isVideo = selectedFile.category === 'video'
  const isPdf = selectedFile.category === 'pdf'
  const isAutocad = selectedFile.category === 'autocad'

  // Use prop width or default based on content type
  const panelStyle = width 
    ? { width: `${width}px` } 
    : undefined
  const panelClass = width 
    ? '' 
    : (isPdf || isImage || isAutocad) ? 'w-[500px]' : 'w-80'

  return (
    <aside 
      className={`${panelClass} border-l border-border bg-card flex flex-col flex-shrink-0`}
      style={panelStyle}
    >
      {/* Header */}
      <div className="h-12 flex items-center justify-between px-4 border-b border-border">
        <span className="font-medium text-sm truncate">{selectedFile.name}</span>
        <button
          onClick={() => setSelectedFile(null)}
          className="p-1.5 hover:bg-muted rounded-md transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* PDF Preview */}
      {isPdf ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          <PDFViewer filePath={selectedFile.path} />
          <div className="p-3 border-t border-border flex gap-2">
            <button
              onClick={() => openFile(selectedFile)}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm"
            >
              <ExternalLink className="h-4 w-4" />
              Open
            </button>
            <button
              onClick={() => openInExplorer(selectedFile)}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors text-sm"
            >
              <FolderOpen className="h-4 w-4" />
              Explorer
            </button>
          </div>
        </div>
      ) : isImage ? (
        /* Image Preview with ImageViewer */
        <div className="flex-1 flex flex-col overflow-hidden">
          <ImageViewer filePath={selectedFile.path} fileName={selectedFile.name} />
          <div className="p-3 border-t border-border flex gap-2">
            <button
              onClick={() => openFile(selectedFile)}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm"
            >
              <ExternalLink className="h-4 w-4" />
              Open
            </button>
            <button
              onClick={() => openInExplorer(selectedFile)}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors text-sm"
            >
              <FolderOpen className="h-4 w-4" />
              Explorer
            </button>
          </div>
        </div>
      ) : isAutocad ? (
        /* AutoCAD Preview with DWGViewer */
        <div className="flex-1 flex flex-col overflow-hidden">
          <DWGViewer 
            filePath={selectedFile.path} 
            fileName={selectedFile.name} 
            onOpen={() => openFile(selectedFile)}
          />
          <div className="p-3 border-t border-border flex gap-2">
            <button
              onClick={() => openFile(selectedFile)}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm"
            >
              <ExternalLink className="h-4 w-4" />
              Open in AutoCAD
            </button>
            <button
              onClick={() => openInExplorer(selectedFile)}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors text-sm"
            >
              <FolderOpen className="h-4 w-4" />
              Explorer
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Preview Area for other files */}
          <div className="flex-1 p-4 overflow-auto">
            {/* Preview Thumbnail */}
            <div className="aspect-square bg-muted rounded-lg flex items-center justify-center mb-4 overflow-hidden">
              {isVideo ? (
                <video
                  src={`file://${selectedFile.path}`}
                  controls
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center p-4">
                  <div className="text-4xl mb-2">
                    {selectedFile.category === 'document' && '📝'}
                    {selectedFile.category === 'spreadsheet' && '📊'}
                    {selectedFile.category === 'archive' && '📦'}
                    {selectedFile.category === 'other' && '📁'}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {selectedFile.extension.toUpperCase()} file
                  </p>
                </div>
              )}
            </div>

            {/* File Info */}
            <div className="space-y-3">
              <InfoRow label="Type" value={selectedFile.extension || 'Folder'} />
              <InfoRow label="Size" value={selectedFile.sizeFormatted} />
              <InfoRow 
                label="Modified" 
                value={new Date(selectedFile.modifiedAt).toLocaleString()} 
              />
              <InfoRow 
                label="Created" 
                value={new Date(selectedFile.createdAt).toLocaleString()} 
              />
              <InfoRow 
                label="Path" 
                value={selectedFile.parentPath} 
                className="break-all text-xs"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="p-4 border-t border-border space-y-2">
            <button
              onClick={() => openFile(selectedFile)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              Open File
            </button>
            <button
              onClick={() => openInExplorer(selectedFile)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
            >
              <FolderOpen className="h-4 w-4" />
              Show in Explorer
            </button>
          </div>
        </>
      )}
    </aside>
  )
}

interface InfoRowProps {
  label: string
  value: string
  className?: string
}

function InfoRow({ label, value, className = '' }: InfoRowProps): JSX.Element {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
      <span className={`text-sm ${className}`}>{value}</span>
    </div>
  )
}

