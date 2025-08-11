import { NextResponse } from 'next/server'
import { getPopularMovies, getImageUrl } from '@/lib/tmdb-supabase'

export async function GET() {
  try {
    console.log('Testing TMDB API and image URLs...')
    
    // Test getting popular movies
    const data = await getPopularMovies(1)
    console.log('TMDB API Response:', data)
    
    if (!data.results || data.results.length === 0) {
      return NextResponse.json({
        error: 'No movies returned from TMDB API',
        data: data
      })
    }

    // Test the first 3 movies and their image URLs
    const testMovies = data.results.slice(0, 3).map(movie => ({
      id: movie.id,
      title: movie.title,
      poster_path: movie.poster_path,
      poster_url_w300: getImageUrl(movie.poster_path, 'w300'),
      poster_url_w500: getImageUrl(movie.poster_path, 'w500'),
      backdrop_path: movie.backdrop_path,
      backdrop_url: getImageUrl(movie.backdrop_path, 'w780')
    }))

    return NextResponse.json({
      success: true,
      message: 'TMDB API is working',
      totalMovies: data.results.length,
      testMovies: testMovies,
      sampleImageUrls: [
        getImageUrl('/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg', 'w500'), // Fight Club poster
        getImageUrl('/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg', 'w300'), // Shawshank poster
        getImageUrl(null) // Test null path
      ]
    })

  } catch (error) {
    console.error('TMDB API test failed:', error)
    
    return NextResponse.json({
      error: 'Failed to test TMDB API',
      message: error instanceof Error ? error.message : 'Unknown error',
      fallbackImages: [
        getImageUrl('/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg', 'w500'),
        getImageUrl('/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg', 'w300'),
        getImageUrl(null)
      ]
    })
  }
}