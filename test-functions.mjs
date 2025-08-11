// Test the TMDB functions directly
import { getPopularMovies, getGenres, checkDatabaseStatus } from './lib/tmdb-supabase.js'

console.log('🧪 Testing TMDB functions...')

async function testFunctions() {
  try {
    console.log('\n1. Testing checkDatabaseStatus...')
    const dbStatus = await checkDatabaseStatus()
    console.log('Database status:', JSON.stringify(dbStatus, null, 2))

    console.log('\n2. Testing getGenres...')
    const genres = await getGenres()
    console.log(`Genres: ${genres.length} found`)
    if (genres.length > 0) {
      console.log('First few genres:', genres.slice(0, 3))
    }

    console.log('\n3. Testing getPopularMovies...')
    const movies = await getPopularMovies(1)
    console.log(`Movies: ${movies.results?.length || 0} found`)
    console.log('Total pages:', movies.total_pages)
    if (movies.results && movies.results.length > 0) {
      console.log('First movie:', {
        title: movies.results[0].title,
        vote_average: movies.results[0].vote_average,
        genre_names: movies.results[0].genre_names || 'No genres'
      })
    }

    console.log('\n✅ All tests completed')
  } catch (error) {
    console.error('❌ Test failed:', error)
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    })
  }
}

testFunctions()