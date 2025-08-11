import { NextResponse } from 'next/server'
import { getPopularMovies, getGenres, checkDatabaseStatus } from '@/lib/tmdb-supabase'

export async function GET() {
  const results: any = {
    timestamp: new Date().toISOString(),
    tests: {}
  }

  try {
    console.log('Testing database status...')
    results.tests.databaseStatus = await checkDatabaseStatus()
  } catch (error) {
    results.tests.databaseStatus = {
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }

  try {
    console.log('Testing genres...')
    const genres = await getGenres()
    results.tests.genres = {
      count: genres.length,
      sample: genres.slice(0, 3),
      success: true
    }
  } catch (error) {
    results.tests.genres = {
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false
    }
  }

  try {
    console.log('Testing popular movies...')
    const movies = await getPopularMovies(1)
    results.tests.popularMovies = {
      count: movies.results?.length || 0,
      totalPages: movies.total_pages,
      firstMovie: movies.results?.[0] ? {
        title: movies.results[0].title,
        vote_average: movies.results[0].vote_average,
        genre_names: movies.results[0].genre_names
      } : null,
      success: true
    }
  } catch (error) {
    results.tests.popularMovies = {
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false
    }
  }

  return NextResponse.json(results)
}