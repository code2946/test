import { NextResponse } from 'next/server'
import { getImageUrl } from '@/lib/tmdb-supabase'

export async function GET() {
  // Test specific TMDB poster URLs to verify they work
  const testPosters = [
    '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg', // Fight Club
    '/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg', // Shawshank Redemption
    '/qJ2tW6WMUDux911r6m7haRef0WH.jpg', // The Dark Knight
    '/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg', // Forrest Gump
    null // Test null path
  ]

  const results = await Promise.all(
    testPosters.map(async (posterPath) => {
      const imageUrl = getImageUrl(posterPath, 'w500')
      
      try {
        if (imageUrl.includes('placeholder.svg')) {
          return {
            posterPath,
            imageUrl,
            accessible: false,
            reason: 'Placeholder used (null path)'
          }
        }

        const response = await fetch(imageUrl, { 
          method: 'HEAD',
          headers: {
            'User-Agent': 'ScreenOnFire/1.0'
          }
        })
        
        return {
          posterPath,
          imageUrl,
          accessible: response.ok,
          status: response.status,
          reason: response.ok ? 'Image accessible' : `HTTP ${response.status}`
        }
      } catch (error) {
        return {
          posterPath,
          imageUrl,
          accessible: false,
          reason: error instanceof Error ? error.message : 'Network error'
        }
      }
    })
  )

  const accessibleCount = results.filter(r => r.accessible).length
  const totalCount = results.length

  return NextResponse.json({
    success: accessibleCount > 0,
    message: `${accessibleCount}/${totalCount} images accessible`,
    results: results,
    tmdbImageBaseUrl: 'https://image.tmdb.org/t/p/w500',
    recommendations: accessibleCount === 0 ? [
      'Check if TMDB image CDN is accessible',
      'Verify network connectivity',
      'Consider using different image sizes'
    ] : []
  })
}