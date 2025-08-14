#!/usr/bin/env node

// Enhanced TMDB movie ingestion script for recommendation system
// Fetches and normalizes movie data with cast, directors, cinematographers, and keywords

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';

// Rate limiting
let requestCount = 0;
const RATE_LIMIT = 40; // TMDB allows 40 requests per 10 seconds
const RATE_WINDOW = 10000; // 10 seconds

async function rateLimitedFetch(url) {
  if (requestCount >= RATE_LIMIT) {
    console.log('Rate limit reached, waiting...');
    await new Promise(resolve => setTimeout(resolve, RATE_WINDOW));
    requestCount = 0;
  }
  
  requestCount++;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
}

async function fetchMovieDetails(tmdbId) {
  try {
    const [details, credits, keywords] = await Promise.all([
      rateLimitedFetch(`${BASE_URL}/movie/${tmdbId}?api_key=${TMDB_API_KEY}&language=en-US`),
      rateLimitedFetch(`${BASE_URL}/movie/${tmdbId}/credits?api_key=${TMDB_API_KEY}`),
      rateLimitedFetch(`${BASE_URL}/movie/${tmdbId}/keywords?api_key=${TMDB_API_KEY}`)
    ]);

    // Extract cast (top 10 actors)
    const cast = (credits.cast || [])
      .slice(0, 10)
      .map(person => person.name)
      .filter(name => name);

    // Extract directors
    const directors = (credits.crew || [])
      .filter(person => person.job === 'Director')
      .map(person => person.name)
      .filter(name => name);

    // Extract cinematographers
    const cinematographers = (credits.crew || [])
      .filter(person => 
        person.job && (
          person.job.toLowerCase().includes('cinematograph') ||
          person.job === 'Director of Photography' ||
          person.department === 'Camera'
        )
      )
      .map(person => person.name)
      .filter(name => name);

    // Extract genres
    const genres = (details.genres || []).map(genre => genre.name);

    // Extract keywords
    const keywordList = (keywords.keywords || keywords.results || [])
      .map(keyword => keyword.name)
      .filter(name => name);

    return {
      id: details.id,
      title: details.title,
      overview: details.overview,
      release_year: details.release_date ? parseInt(details.release_date.slice(0, 4)) : null,
      poster_path: details.poster_path,
      backdrop_path: details.backdrop_path,
      vote_average: details.vote_average,
      vote_count: details.vote_count,
      popularity: details.popularity,
      runtime: details.runtime,
      original_language: details.original_language,
      adult: details.adult,
      genres,
      keywords: keywordList.slice(0, 20), // Limit keywords to avoid bloat
      cast,
      directors,
      cinematographers
    };
  } catch (error) {
    console.error(`Failed to fetch details for movie ${tmdbId}:`, error.message);
    return null;
  }
}

async function upsertMovie(movieData) {
  if (!movieData) return false;

  try {
    // Upsert the movie record
    const { error: movieError } = await supabase
      .from('movies')
      .upsert({
        id: movieData.id,
        title: movieData.title,
        overview: movieData.overview,
        release_date: movieData.release_year ? `${movieData.release_year}-01-01` : null,
        release_year: movieData.release_year,
        poster_path: movieData.poster_path,
        backdrop_path: movieData.backdrop_path,
        vote_average: movieData.vote_average,
        vote_count: movieData.vote_count,
        popularity: movieData.popularity,
        runtime: movieData.runtime,
        original_language: movieData.original_language,
        adult: movieData.adult || false,
        category: 'enhanced', // Mark as enhanced with full data
        keywords: movieData.keywords,
        cast: movieData.cast,
        directors: movieData.directors,
        cinematographers: movieData.cinematographers
      });

    if (movieError) {
      console.error(`Database error for movie ${movieData.id}:`, movieError);
      return false;
    }

    // Update genre relationships
    if (movieData.genres && movieData.genres.length > 0) {
      // Get genre IDs
      const { data: allGenres } = await supabase
        .from('genres')
        .select('id, name');

      const genreMap = new Map(allGenres.map(g => [g.name, g.id]));
      const movieGenreIds = movieData.genres
        .map(genreName => genreMap.get(genreName))
        .filter(id => id !== undefined);

      if (movieGenreIds.length > 0) {
        // Delete existing genre relationships
        await supabase
          .from('movie_genres')
          .delete()
          .eq('movie_id', movieData.id);

        // Insert new genre relationships
        const genreRelations = movieGenreIds.map(genreId => ({
          movie_id: movieData.id,
          genre_id: genreId
        }));

        await supabase
          .from('movie_genres')
          .insert(genreRelations);
      }
    }

    return true;
  } catch (error) {
    console.error(`Failed to upsert movie ${movieData.id}:`, error);
    return false;
  }
}

async function fetchMovieList(endpoint, maxPages = 5) {
  const movieIds = new Set();
  
  for (let page = 1; page <= maxPages; page++) {
    try {
      console.log(`Fetching ${endpoint}, page ${page}...`);
      const data = await rateLimitedFetch(`${BASE_URL}/${endpoint}?api_key=${TMDB_API_KEY}&page=${page}`);
      
      data.results.forEach(movie => {
        if (movie.id && movie.vote_count > 100) { // Only include movies with decent vote counts
          movieIds.add(movie.id);
        }
      });
      
      if (page >= data.total_pages) break;
    } catch (error) {
      console.error(`Failed to fetch ${endpoint} page ${page}:`, error.message);
      break;
    }
  }
  
  return Array.from(movieIds);
}

async function enhanceExistingMovies(batchSize = 50) {
  console.log('Fetching existing movies without enhanced data...');
  
  const { data: existingMovies, error } = await supabase
    .from('movies')
    .select('id, title')
    .or('cast.is.null,directors.is.null,keywords.is.null')
    .order('popularity', { ascending: false })
    .limit(batchSize);

  if (error) {
    console.error('Failed to fetch existing movies:', error);
    return;
  }

  console.log(`Found ${existingMovies.length} movies to enhance`);

  for (const movie of existingMovies) {
    console.log(`Enhancing: ${movie.title} (ID: ${movie.id})`);
    const enhancedData = await fetchMovieDetails(movie.id);
    const success = await upsertMovie(enhancedData);
    
    if (success) {
      console.log(`✓ Enhanced: ${movie.title}`);
    } else {
      console.log(`✗ Failed: ${movie.title}`);
    }
    
    // Small delay between movies
    await new Promise(resolve => setTimeout(resolve, 250));
  }
}

async function ingestNewMovies() {
  console.log('Fetching new popular and top-rated movies...');
  
  // Fetch movie IDs from different categories
  const [popularIds, topRatedIds, trendingIds] = await Promise.all([
    fetchMovieList('movie/popular', 10),
    fetchMovieList('movie/top_rated', 10),
    fetchMovieList('trending/movie/week', 5)
  ]);

  // Combine and deduplicate
  const allMovieIds = [...new Set([...popularIds, ...topRatedIds, ...trendingIds])];
  console.log(`Found ${allMovieIds.length} unique movies to process`);

  // Check which movies we already have
  const { data: existingMovies } = await supabase
    .from('movies')
    .select('id')
    .in('id', allMovieIds);

  const existingIds = new Set(existingMovies?.map(m => m.id) || []);
  const newMovieIds = allMovieIds.filter(id => !existingIds.has(id));

  console.log(`${newMovieIds.length} new movies to ingest`);

  // Process new movies
  for (const movieId of newMovieIds.slice(0, 100)) { // Limit to 100 new movies per run
    console.log(`Ingesting new movie ID: ${movieId}`);
    const movieData = await fetchMovieDetails(movieId);
    const success = await upsertMovie(movieData);
    
    if (success) {
      console.log(`✓ Ingested: ${movieData?.title}`);
    } else {
      console.log(`✗ Failed: ${movieId}`);
    }
    
    // Small delay between movies
    await new Promise(resolve => setTimeout(resolve, 250));
  }
}

async function main() {
  const args = process.argv.slice(2);
  const mode = args[0] || 'enhance';
  
  console.log('🎬 Enhanced Movie Ingestion Script');
  console.log('==================================');
  
  if (!TMDB_API_KEY) {
    console.error('❌ TMDB_API_KEY environment variable is required');
    process.exit(1);
  }
  
  try {
    if (mode === 'new') {
      await ingestNewMovies();
    } else if (mode === 'enhance') {
      await enhanceExistingMovies();
    } else if (mode === 'both') {
      await ingestNewMovies();
      await enhanceExistingMovies();
    } else {
      console.log('Usage: node enhanced-movie-ingestion.js [enhance|new|both]');
      console.log('  enhance - Add cast/directors/keywords to existing movies');
      console.log('  new     - Ingest new popular/trending movies');
      console.log('  both    - Do both operations');
      process.exit(1);
    }
    
    console.log('✅ Ingestion completed successfully');
  } catch (error) {
    console.error('❌ Ingestion failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { fetchMovieDetails, upsertMovie };