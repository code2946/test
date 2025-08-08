// Ultra-fast image caching service worker
const CACHE_NAME = 'screenonfire-images-v1'
const IMAGE_CACHE_NAME = 'screenonfire-images-cache'

// TMDB image domains to cache aggressively
const IMAGE_DOMAINS = [
  'image.tmdb.org',
  'images.unsplash.com'
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('🚀 Service Worker: Cache opened')
      return cache
    })
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== IMAGE_CACHE_NAME) {
            console.log('🗑️ Service Worker: Deleting old cache', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  
  // Only handle image requests from TMDB and Unsplash
  if (IMAGE_DOMAINS.some(domain => url.hostname.includes(domain))) {
    event.respondWith(
      caches.open(IMAGE_CACHE_NAME).then(cache => {
        return cache.match(event.request).then(response => {
          if (response) {
            // Return cached image immediately
            console.log('⚡ Service Worker: Serving cached image', url.pathname)
            return response
          }
          
          // Fetch and cache the image
          return fetch(event.request).then(fetchResponse => {
            // Only cache successful responses
            if (fetchResponse.status === 200) {
              console.log('💾 Service Worker: Caching image', url.pathname)
              cache.put(event.request, fetchResponse.clone())
            }
            return fetchResponse
          }).catch(() => {
            // Return a fallback image if fetch fails
            return new Response(
              '<svg width="300" height="450" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#374151"/><text x="50%" y="50%" font-family="Arial" font-size="16" fill="#9CA3AF" text-anchor="middle" dominant-baseline="middle">🎬</text></svg>',
              {
                headers: {
                  'Content-Type': 'image/svg+xml',
                  'Cache-Control': 'no-cache'
                }
              }
            )
          })
        })
      })
    )
  }
})

// Preload images when requested by the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'PRELOAD_IMAGES') {
    const urls = event.data.urls
    console.log('🚀 Service Worker: Preloading', urls.length, 'images')
    
    Promise.all(
      urls.map(url => {
        return caches.open(IMAGE_CACHE_NAME).then(cache => {
          return cache.match(url).then(response => {
            if (!response) {
              // Image not cached, fetch and cache it
              return fetch(url).then(fetchResponse => {
                if (fetchResponse.status === 200) {
                  cache.put(url, fetchResponse.clone())
                }
                return fetchResponse
              }).catch(err => {
                console.log('❌ Service Worker: Failed to preload', url, err)
              })
            }
            return response
          })
        })
      })
    ).then(() => {
      console.log('✅ Service Worker: Preloading complete')
    })
  }
})