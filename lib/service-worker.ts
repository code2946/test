// Service Worker registration for ultra-fast image caching
export function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return
  }

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js')
      console.log('🚀 Service Worker registered:', registration.scope)
      
      // Listen for service worker updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('🔄 New Service Worker available, reload to update')
            }
          })
        }
      })
    } catch (error) {
      console.log('❌ Service Worker registration failed:', error)
    }
  })
}

// Preload images through service worker
export function preloadImagesViaServiceWorker(urls: string[]) {
  if (!navigator.serviceWorker?.controller) {
    return
  }

  navigator.serviceWorker.controller.postMessage({
    type: 'PRELOAD_IMAGES',
    urls: urls.filter(Boolean)
  })
}

// Check if service worker is ready
export function isServiceWorkerReady(): boolean {
  return !!(navigator.serviceWorker?.controller)
}