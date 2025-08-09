import { useState, useEffect, useRef, memo, useCallback } from 'react'
import { ultraFastImageLoader } from '@/lib/ultra-fast-image'

interface OptimizedImageProps {
  src: string
  alt: string
  className?: string
  width?: number
  height?: number
  placeholder?: string
  onLoad?: () => void
  priority?: boolean
  blur?: boolean
}

export const OptimizedImage = memo(function OptimizedImage({ 
  src, 
  alt, 
  className = '', 
  width, 
  height,
  placeholder = '/placeholder.svg?height=750&width=500&text=Loading',
  onLoad,
  priority = false,
  blur = true
}: OptimizedImageProps) {
  const [imageSrc, setImageSrc] = useState(placeholder)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [shouldLoad, setShouldLoad] = useState(priority)
  const imgRef = useRef<HTMLImageElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  const loadImage = useCallback(async () => {
    if (!src || src === placeholder) return

    try {
      setIsLoading(true)
      setHasError(false)

      // Check if image is already cached
      const cachedImg = ultraFastImageLoader.getCachedImage(src)
      if (cachedImg) {
        setImageSrc(src)
        setIsLoading(false)
        onLoad?.()
        return
      }

      // For TMDB images, try to load directly first
      if (src.includes('image.tmdb.org')) {
        const img = new Image()
        img.onload = () => {
          setImageSrc(src)
          setIsLoading(false)
          ultraFastImageLoader.preloadImages([src]) // Cache for next time
          onLoad?.()
        }
        img.onerror = () => {
          console.warn('TMDB image failed to load:', src)
          setImageSrc('/placeholder.svg?height=750&width=500&text=Image+Not+Found')
          setIsLoading(false)
          setHasError(true)
        }
        img.src = src
        return
      }

      // Fallback to ultra-fast loader for other images
      await ultraFastImageLoader.loadImage(src)
      setImageSrc(src)
      setIsLoading(false)
      onLoad?.()
    } catch (error) {
      console.warn('Image loading error:', error, 'src:', src)
      setImageSrc('/placeholder.svg?height=750&width=500&text=Failed+to+Load')
      setIsLoading(false)
      setHasError(true)
    }
  }, [src, onLoad, placeholder])

  useEffect(() => {
    if (shouldLoad) {
      loadImage()
      return
    }

    const img = imgRef.current
    if (!img) return

    // Use intersection observer for lazy loading
    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true)
          observerRef.current?.disconnect()
        }
      },
      {
        rootMargin: priority ? '200px' : '50px' // Larger margin for priority images
      }
    )

    observerRef.current.observe(img)

    return () => {
      observerRef.current?.disconnect()
    }
  }, [shouldLoad, loadImage, priority])

  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      <img
        ref={imgRef}
        src={imageSrc}
        alt={alt}
        className={`w-full h-full object-cover transition-all duration-200 ${
          isLoading ? (blur ? 'opacity-0 blur-sm' : 'opacity-0') : 'opacity-100 blur-0'
        }`}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
      />
      
      {/* Ultra-fast loading skeleton */}
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-700 via-gray-600 to-gray-700 animate-pulse rounded flex items-center justify-center">
          <div className="w-4 h-4 bg-yellow-400 rounded-full animate-ping" />
        </div>
      )}
      
      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 bg-gray-800 flex items-center justify-center text-gray-400 text-xs">
          🎬
        </div>
      )}
    </div>
  )
})