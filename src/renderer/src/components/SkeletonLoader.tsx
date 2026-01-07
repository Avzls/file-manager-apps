import { memo } from 'react'

interface SkeletonLoaderProps {
  count?: number
  viewMode?: 'grid' | 'list'
}

export const SkeletonLoader = memo(function SkeletonLoader({ 
  count = 12, 
  viewMode = 'grid' 
}: SkeletonLoaderProps): JSX.Element {
  if (viewMode === 'list') {
    return (
      <div className="space-y-1 p-4">
        {Array.from({ length: count }).map((_, i) => (
          <div 
            key={i} 
            className="flex items-center gap-4 p-3 rounded-lg"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            {/* Icon */}
            <div className="skeleton-shimmer w-10 h-10 rounded-lg" />
            {/* Name */}
            <div className="flex-1 space-y-2">
              <div className="skeleton-shimmer h-4 w-48 rounded" />
              <div className="skeleton-shimmer h-3 w-24 rounded" />
            </div>
            {/* Size */}
            <div className="skeleton-shimmer h-4 w-16 rounded" />
            {/* Date */}
            <div className="skeleton-shimmer h-4 w-24 rounded" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-4">
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i} 
          className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border/50 bg-card stagger-item"
          style={{ animationDelay: `${i * 30}ms` }}
        >
          {/* Thumbnail */}
          <div className="skeleton-shimmer w-20 h-20 rounded-lg" />
          {/* Name */}
          <div className="skeleton-shimmer h-4 w-full rounded" />
          <div className="skeleton-shimmer h-3 w-2/3 rounded" />
        </div>
      ))}
    </div>
  )
})
