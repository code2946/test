// Test TMDB functions with mock data fallback
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function testTMDBFunctions() {
  console.log('🧪 Testing TMDB functions...');
  
  try {
    // Create a temporary test script that imports TMDB functions
    const testScript = `
import { getPopularMovies, getGenres } from './lib/tmdb.ts';

async function test() {
  console.log('Testing getGenres...');
  const genres = await getGenres();
  console.log('Genres count:', genres?.length);
  if (genres?.length > 0) {
    console.log('First genre:', genres[0].name);
  }
  
  console.log('\\nTesting getPopularMovies...');
  const movies = await getPopularMovies();
  console.log('Movies count:', movies?.results?.length);
  if (movies?.results?.length > 0) {
    console.log('First movie:', movies.results[0].title);
    console.log('First movie rating:', movies.results[0].vote_average);
  }
  
  console.log('\\n✅ Mock data is working!');
}

test().catch(console.error);
`;

    // Use Next.js to run the test in the proper environment
    const result = await execAsync('cd /home/iamcode01/Desktop/screenonfire && npx tsx --eval "' + testScript.replace(/"/g, '\\"') + '"');
    console.log(result.stdout);
    if (result.stderr) {
      console.log('Errors:', result.stderr);
    }
  } catch (error) {
    console.log('Direct test failed, trying alternative approach...');
    console.log('Error:', error.message);
  }
}

testTMDBFunctions();