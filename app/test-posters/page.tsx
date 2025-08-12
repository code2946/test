"use client"

import { useState, useEffect } from "react"
import { OptimizedImage } from "@/components/optimized-image"
import { getImageUrl } from "@/lib/tmdb-supabase"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function TestPostersPage() {
  const [loadStatus, setLoadStatus] = useState<Record<string, 'loading' | 'loaded' | 'error'>>({})

  const testPosters = [
    { 
      path: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg', 
      title: 'Fight Club',
      id: 'fight-club'
    },
    { 
      path: '/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg', 
      title: 'The Shawshank Redemption',
      id: 'shawshank'
    },
    { 
      path: '/qJ2tW6WMUDux911r6m7haRef0WH.jpg', 
      title: 'The Dark Knight',
      id: 'dark-knight'
    },
    { 
      path: '/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg', 
      title: 'Forrest Gump',
      id: 'forrest-gump'
    },
    { 
      path: null, 
      title: 'No Poster (Test Placeholder)',
      id: 'no-poster'
    },
    { 
      path: '/invalid-poster-path.jpg', 
      title: 'Invalid Path (Test Error)',
      id: 'invalid'
    }
  ]

  useEffect(() => {
    // Initialize load status
    const initialStatus: Record<string, 'loading' | 'loaded' | 'error'> = {}
    testPosters.forEach(poster => {
      initialStatus[poster.id] = 'loading'
    })
    setLoadStatus(initialStatus)
  }, [])

  const handleImageLoad = (id: string) => {
    setLoadStatus(prev => ({ ...prev, [id]: 'loaded' }))
  }

  const handleImageError = (id: string) => {
    setLoadStatus(prev => ({ ...prev, [id]: 'error' }))
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">TMDB Poster Loading Test</h1>
        <p className="text-gray-400 mb-8">Testing poster image loading and fallbacks</p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {testPosters.map((poster) => {
            const imageUrl = getImageUrl(poster.path, 'w300')
            const status = loadStatus[poster.id] || 'loading'
            
            return (
              <Card key={poster.id} className="bg-gray-900 border-gray-800">
                <div className="aspect-[2/3] relative overflow-hidden rounded-t-lg">
                  <OptimizedImage
                    src={imageUrl}
                    alt={poster.title}
                    className="w-full h-full object-cover"
                    onLoad={() => handleImageLoad(poster.id)}
                    width={300}
                    height={450}
                    priority={true}
                  />
                  <div className="absolute top-2 right-2">
                    <Badge 
                      variant={status === 'loaded' ? 'default' : status === 'error' ? 'destructive' : 'secondary'}
                      className={`text-xs ${
                        status === 'loaded' ? 'bg-green-600' : 
                        status === 'error' ? 'bg-red-600' : 
                        'bg-yellow-600'
                      }`}
                    >
                      {status === 'loaded' ? '✓' : status === 'error' ? '✗' : '⏳'}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-3">
                  <h3 className="font-semibold text-sm mb-1 line-clamp-2 text-white">
                    {poster.title}
                  </h3>
                  <p className="text-xs text-gray-400 mb-1">
                    Path: {poster.path || 'null'}
                  </p>
                  <p className="text-xs text-gray-500 break-all">
                    {imageUrl}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="mt-8 bg-gray-900 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Load Status Summary</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-500">
                {Object.values(loadStatus).filter(s => s === 'loaded').length}
              </div>
              <div className="text-sm text-gray-400">Loaded</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-500">
                {Object.values(loadStatus).filter(s => s === 'loading').length}
              </div>
              <div className="text-sm text-gray-400">Loading</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-500">
                {Object.values(loadStatus).filter(s => s === 'error').length}
              </div>
              <div className="text-sm text-gray-400">Error</div>
            </div>
          </div>
        </div>

        <div className="mt-4 text-center">
          <p className="text-gray-400">
            Visit{' '}
            <a href="/discover" className="text-yellow-500 hover:underline">
              /discover
            </a>
            {' '}to see posters in the main app
          </p>
        </div>
      </div>
    </div>
  )
}