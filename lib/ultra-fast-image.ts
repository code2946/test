import { preloadImagesViaServiceWorker, isServiceWorkerReady } from './service-worker'

// Ultra-fast image loading with aggressive preloading
class UltraFastImageLoader {
  private imageCache = new Map<string, HTMLImageElement>()
  private loadingPromises = new Map<string, Promise<HTMLImageElement>>()
  private preloadQueue: string[] = []

  // Preload multiple images aggressively
  async preloadImages(urls: string[]): Promise<void> {
    // Also preload via service worker for caching
    if (isServiceWorkerReady()) {
      preloadImagesViaServiceWorker(urls)
    }
    
    const promises = urls.map(url => this.loadImage(url))
    await Promise.allSettled(promises)
  }

  // Load single image with caching
  async loadImage(url: string): Promise<HTMLImageElement> {
    if (!url) throw new Error('No image URL provided')

    // Return cached image immediately
    if (this.imageCache.has(url)) {
      return this.imageCache.get(url)!
    }

    // Return existing promise if already loading
    if (this.loadingPromises.has(url)) {
      return this.loadingPromises.get(url)!
    }

    // Create new loading promise
    const promise = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      
      img.onload = () => {
        this.imageCache.set(url, img)
        this.loadingPromises.delete(url)
        resolve(img)
      }
      
      img.onerror = () => {
        this.loadingPromises.delete(url)
        reject(new Error(`Failed to load image: ${url}`))
      }

      // Critical optimizations
      img.crossOrigin = 'anonymous'
      img.decoding = 'async'
      img.loading = 'eager'
      img.src = url
    })

    this.loadingPromises.set(url, promise)
    return promise
  }

  // Get cached image instantly
  getCachedImage(url: string): HTMLImageElement | null {
    return this.imageCache.get(url) || null
  }

  // Preload next batch of images in background
  backgroundPreload(urls: string[]): void {
    this.preloadQueue.push(...urls)
    
    // Process queue with delay to not block UI
    setTimeout(() => {
      const batch = this.preloadQueue.splice(0, 5) // Process 5 at a time
      batch.forEach(url => {
        if (!this.imageCache.has(url) && !this.loadingPromises.has(url)) {
          this.loadImage(url).catch(() => {}) // Silent fail for background loading
        }
      })
    }, 50)
  }

  // Clear cache to prevent memory leaks
  clearCache(): void {
    this.imageCache.clear()
    this.loadingPromises.clear()
    this.preloadQueue = []
  }

  // Get cache stats
  getCacheStats() {
    return {
      cached: this.imageCache.size,
      loading: this.loadingPromises.size,
      queued: this.preloadQueue.length
    }
  }
}

export const ultraFastImageLoader = new UltraFastImageLoader()

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    ultraFastImageLoader.clearCache()
  })
}