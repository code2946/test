const { getPopularMovies, getGenres } = require('./lib/tmdb.ts');

async function testTMDB() {
  console.log('Testing TMDB API...');
  
  try {
    console.log('1. Testing genres...');
    const genres = await getGenres();
    console.log('✓ Genres loaded:', genres?.length || 0, 'genres');
    
    console.log('2. Testing popular movies...');
    const movies = await getPopularMovies();
    console.log('✓ Popular movies loaded:', movies?.results?.length || 0, 'movies');
    
    if (movies?.results?.length > 0) {
      console.log('First movie:', movies.results[0].title);
    }
    
    console.log('✅ TMDB API test completed successfully!');
  } catch (error) {
    console.error('❌ TMDB API test failed:', error.message);
  }
}

testTMDB();