import { NextResponse } from 'next/server'
import { getPopularMovies, getImageUrl } from '@/lib/tmdb-supabase'

export async function GET() {
  try {
    console.log('Fetching popular movies for debug...')
    
    const data = await getPopularMovies(1)
    
    if (!data.results || data.results.length === 0) {
      return NextResponse.json({
        error: 'No movies found',
        fallback: 'Check if TMDB API is working'
      })
    }

    // Debug first 3 movies
    const debugMovies = data.results.slice(0, 3).map(movie => ({
      id: movie.id,
      title: movie.title,
      poster_path: movie.poster_path,
      poster_url_w342: getImageUrl(movie.poster_path, 'w342'),
      poster_url_w500: getImageUrl(movie.poster_path, 'w500'),
      has_poster: !!movie.poster_path,
      vote_average: movie.vote_average,
      release_date: movie.release_date
    }))

    return NextResponse.json({
      success: true,
      totalMovies: data.results.length,
      sampleMovies: debugMovies,
      apiUrl: 'https://api.themoviedb.org/3/movie/popular',
      imageBaseUrl: 'https://image.tmdb.org/t/p/',
      message: 'Movies and posters should be working correctly'
    })

  } catch (error) {
    console.error('Debug movies error:', error)
    
    return NextResponse.json({
      error: 'Failed to fetch movies',
      message: error instanceof Error ? error.message : 'Unknown error',
      suggestion: 'Movies may be loading from TMDB fallback data'
    })
  }
}