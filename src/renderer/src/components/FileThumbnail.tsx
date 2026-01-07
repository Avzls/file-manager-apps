import { useState, useEffect, useRef } from 'react'
import { FileInfo } from '@shared/types'
import { 
  Folder, 
  FileText, 
  Image as ImageIcon, 
  Film, 
  FileSpreadsheet, 
  Archive, 
  File,
  FileCode
} from 'lucide-react'
import * as pdfjsLib from 'pdfjs-dist'

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = './pdf.worker.min.mjs'

interface FileThumbnailProps {
  file: FileInfo
  size?: 'small' | 'medium' | 'large'
}

// Cache for PDF thumbnails to avoid re-rendering
const pdfThumbnailCache = new Map<string, string>()

export function FileThumbnail({ file, size = 'medium' }: FileThumbnailProps): JSX.Element {
  const [thumbnail, setThumbnail] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const sizeClasses = {
    small: 'w-10 h-10',
    medium: 'w-16 h-16',
    large: 'w-24 h-24'
  }

  const thumbnailSizes = {
    small: 40,
    medium: 64,
    large: 96
  }

  const iconSizes = {
    small: 'h-8 w-8',
    medium: 'h-10 w-10',
    large: 'h-16 w-16'
  }

  useEffect(() => {
    if (file.isDirectory) return

    // Load thumbnail for images
    if (file.category === 'image') {
      setLoading(true)
      setError(false)
      
      ;(window as any).api.readImageUrl(file.path)
        .then((url: string) => {
          setThumbnail(url)
          setLoading(false)
        })
        .catch((err: any) => {
          console.error('Image load error:', err)
          setError(true)
          setLoading(false)
        })
    }

    // Load thumbnail for PDFs
    if (file.category === 'pdf') {
      // Check cache first
      if (pdfThumbnailCache.has(file.path)) {
        setThumbnail(pdfThumbnailCache.get(file.path)!)
        return
      }

      setLoading(true)
      setError(false)

      const loadPdfThumbnail = async () => {
        try {
          const buffer = await (window as any).api.readFileBuffer(file.path)
          console.log('PDF buffer loaded:', file.name, buffer)
          
          // Handle buffer format from IPC
          let uint8Array: Uint8Array
          if (buffer.data) {
            uint8Array = new Uint8Array(buffer.data)
          } else if (buffer instanceof ArrayBuffer) {
            uint8Array = new Uint8Array(buffer)
          } else {
            uint8Array = new Uint8Array(Object.values(buffer))
          }
          
          console.log('PDF uint8Array length:', uint8Array.length)
          
          const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise
          console.log('PDF loaded, pages:', pdf.numPages)
          
          const page = await pdf.getPage(1)
          
          // Create off-screen canvas for rendering
          const canvas = document.createElement('canvas')
          const context = canvas.getContext('2d')
          
          if (!context) throw new Error('No canvas context')
          
          // Scale to thumbnail size
          const viewport = page.getViewport({ scale: 0.3 })
          canvas.width = viewport.width
          canvas.height = viewport.height
          
          await page.render({
            canvasContext: context,
            viewport: viewport
          } as any).promise
          
          // Convert to data URL
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
          pdfThumbnailCache.set(file.path, dataUrl)
          setThumbnail(dataUrl)
          setLoading(false)
          console.log('PDF thumbnail generated successfully')
        } catch (err) {
          console.error('PDF thumbnail error:', err)
          setError(true)
          setLoading(false)
        }
      }

      loadPdfThumbnail()
    }

    // Load thumbnail for Office documents (docx, xlsx, pptx)
    if (file.category === 'document' || file.category === 'spreadsheet') {
      const ext = file.extension?.toLowerCase()
      if (ext === '.docx' || ext === '.xlsx' || ext === '.pptx') {
        setLoading(true)
        setError(false)

        ;(window as any).api.getOfficeThumbnail(file.path)
          .then((url: string | null) => {
            if (url) {
              setThumbnail(url)
            } else {
              setError(true)
            }
            setLoading(false)
          })
          .catch(() => {
            setError(true)
            setLoading(false)
          })
      }
    }
  }, [file.path, file.category, file.isDirectory, file.extension])

  // Folder icon
  if (file.isDirectory) {
    return (
      <div className={`${sizeClasses[size]} flex items-center justify-center`}>
        <Folder className={`${iconSizes[size]} text-yellow-500`} />
      </div>
    )
  }

  // Image/PDF/Office thumbnail
  if ((file.category === 'image' || file.category === 'pdf' || file.category === 'document' || file.category === 'spreadsheet') && thumbnail && !error) {
    return (
      <div className={`${sizeClasses[size]} flex items-center justify-center overflow-hidden rounded-md bg-gray-100 dark:bg-gray-800`}>
        <img 
          src={thumbnail} 
          alt={file.name}
          className="w-full h-full object-cover"
          onError={() => setError(true)}
        />
      </div>
    )
  }

  // Loading state
  if ((file.category === 'image' || file.category === 'pdf' || file.category === 'document' || file.category === 'spreadsheet') && loading) {
    return (
      <div className={`${sizeClasses[size]} flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-md animate-pulse`}>
        {file.category === 'pdf' ? (
          <FileText className="h-6 w-6 text-gray-400" />
        ) : (
          <ImageIcon className="h-6 w-6 text-gray-400" />
        )}
      </div>
    )
  }

  // Category icons
  const categoryIcons: Record<string, JSX.Element> = {
    pdf: <FileText className={`${iconSizes[size]} text-red-500`} />,
    image: <ImageIcon className={`${iconSizes[size]} text-green-500`} />,
    video: <Film className={`${iconSizes[size]} text-purple-500`} />,
    document: <FileText className={`${iconSizes[size]} text-blue-500`} />,
    spreadsheet: <FileSpreadsheet className={`${iconSizes[size]} text-emerald-500`} />,
    archive: <Archive className={`${iconSizes[size]} text-amber-500`} />,
    autocad: <FileCode className={`${iconSizes[size]} text-cyan-500`} />,
    code: <FileCode className={`${iconSizes[size]} text-gray-500`} />,
    other: <File className={`${iconSizes[size]} text-gray-400`} />
  }

  return (
    <div className={`${sizeClasses[size]} flex items-center justify-center`}>
      {categoryIcons[file.category] || categoryIcons.other}
    </div>
  )
}
