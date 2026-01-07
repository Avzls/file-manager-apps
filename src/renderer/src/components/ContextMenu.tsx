import { useState, useRef } from 'react'
import { 
  Copy, 
  Trash2, 
  Edit3, 
  Clipboard, 
  FolderOpen, 
  Star,
  ExternalLink,
  MoreHorizontal
} from 'lucide-react'
import { FileInfo } from '@shared/types'

interface ContextMenuProps {
  file: FileInfo
  x: number
  y: number
  onClose: () => void
  onRename: (file: FileInfo) => void
  onDelete: (file: FileInfo) => void
  onCopyPath: (file: FileInfo) => void
  onOpenLocation: (file: FileInfo) => void
  onOpen: (file: FileInfo) => void
  onToggleFavorite: (file: FileInfo) => void
  isFavorite: boolean
}

export function ContextMenu({
  file,
  x,
  y,
  onClose,
  onRename,
  onDelete,
  onCopyPath,
  onOpenLocation,
  onOpen,
  onToggleFavorite,
  isFavorite
}: ContextMenuProps): JSX.Element {
  const menuRef = useRef<HTMLDivElement>(null)

  // Close on click outside
  const handleClickOutside = (e: React.MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
      onClose()
    }
  }

  const menuItems = [
    { 
      icon: <ExternalLink className="h-4 w-4" />, 
      label: 'Open', 
      onClick: () => { onOpen(file); onClose() }
    },
    { 
      icon: <FolderOpen className="h-4 w-4" />, 
      label: 'Show in Explorer', 
      onClick: () => { onOpenLocation(file); onClose() }
    },
    { divider: true },
    { 
      icon: <Edit3 className="h-4 w-4" />, 
      label: 'Rename', 
      onClick: () => { onRename(file); onClose() }
    },
    { 
      icon: <Clipboard className="h-4 w-4" />, 
      label: 'Copy Path', 
      onClick: () => { onCopyPath(file); onClose() }
    },
    { 
      icon: <Star className={`h-4 w-4 ${isFavorite ? 'fill-yellow-500 text-yellow-500' : ''}`} />, 
      label: isFavorite ? 'Remove from Favorites' : 'Add to Favorites', 
      onClick: () => { onToggleFavorite(file); onClose() }
    },
    { divider: true },
    { 
      icon: <Trash2 className="h-4 w-4 text-red-500" />, 
      label: 'Delete', 
      onClick: () => { onDelete(file); onClose() },
      danger: true
    }
  ]

  return (
    <div 
      className="fixed inset-0 z-50" 
      onClick={handleClickOutside}
      onContextMenu={(e) => { e.preventDefault(); onClose() }}
    >
      <div
        ref={menuRef}
        className="absolute bg-popover border border-border rounded-lg shadow-lg py-1 min-w-[180px]"
        style={{ 
          left: Math.min(x, window.innerWidth - 200), 
          top: Math.min(y, window.innerHeight - 300)
        }}
      >
        {menuItems.map((item, index) => 
          item.divider ? (
            <div key={index} className="h-px bg-border my-1" />
          ) : (
            <button
              key={index}
              onClick={item.onClick}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted transition-colors ${
                item.danger ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20' : ''
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          )
        )}
      </div>
    </div>
  )
}
