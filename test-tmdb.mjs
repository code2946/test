import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set environment variables
process.env.TMDB_ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIyNGRiZWYzOTRmOTAzNGMwM2ViNmM5M2E4ZjA0M2MwNSIsIm5iZiI6MTc1MjkzMTUwOS44MzMsInN1YiI6IjY4N2I5Y2I1ZGZmMDA4MWRhYzcyYzI1YiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.RmEVeq7ssiU0LSkUj9ihGMySUeS3y3CbeKs_00BCsi4";
process.env.TMDB_API_KEY = "24dbef394f9034c03eb6c93a8f043c05";

async function testTMDBDirect() {
  console.log('🚀 Testing TMDB API directly...');
  
  const TMDB_BASE_URL = "https://api.themoviedb.org/3";
  const TMDB_ACCESS_TOKEN = process.env.TMDB_ACCESS_TOKEN;
  
  try {
    console.log('1. Testing API connection with genres...');
    const genresResponse = await fetch(`${TMDB_BASE_URL}/genre/movie/list?language=en-US`, {
      headers: {
        Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
    });
    
    if (!genresResponse.ok) {
      throw new Error(`HTTP error! status: ${genresResponse.status}`);
    }
    
    const genresData = await genresResponse.json();
    console.log('✅ Genres API working:', genresData.genres?.length || 0, 'genres found');
    
    console.log('2. Testing popular movies...');
    const moviesResponse = await fetch(`${TMDB_BASE_URL}/movie/popular?page=1`, {
      headers: {
        Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
    });
    
    if (!moviesResponse.ok) {
      throw new Error(`HTTP error! status: ${moviesResponse.status}`);
    }
    
    const moviesData = await moviesResponse.json();
    console.log('✅ Popular movies API working:', moviesData.results?.length || 0, 'movies found');
    
    if (moviesData?.results?.length > 0) {
      console.log('📽️  First movie:', moviesData.results[0].title);
      console.log('⭐ Rating:', moviesData.results[0].vote_average);
    }
    
    console.log('✅ Direct TMDB API test completed successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Direct TMDB API test failed:', error.message);
    return false;
  }
}

testTMDBDirect();