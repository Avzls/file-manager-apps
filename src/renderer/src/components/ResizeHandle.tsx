import { useRef, useCallback } from 'react'

interface ResizeHandleProps {
  onResize: (delta: number) => void
  minWidth?: number
  maxWidth?: number
}

export function ResizeHandle({ onResize }: ResizeHandleProps): JSX.Element {
  const isDragging = useRef(false)
  const startX = useRef(0)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true
    startX.current = e.clientX
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return
      const delta = startX.current - e.clientX
      startX.current = e.clientX
      onResize(delta)
    }

    const handleMouseUp = () => {
      isDragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [onResize])

  return (
    <div
      onMouseDown={handleMouseDown}
      className="w-1 cursor-col-resize hover:bg-blue-500 active:bg-blue-600 transition-colors group relative flex-shrink-0"
      title="Drag to resize"
    >
      {/* Visual indicator */}
      <div className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-blue-500/20" />
      {/* Dots indicator in the middle */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-1 h-1 bg-blue-500 rounded-full" />
        <div className="w-1 h-1 bg-blue-500 rounded-full" />
        <div className="w-1 h-1 bg-blue-500 rounded-full" />
      </div>
    </div>
  )
}
