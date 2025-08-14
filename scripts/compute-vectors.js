#!/usr/bin/env node

// Script to compute and store feature vectors for all movies
// Run this after ingesting movie data to enable content-based recommendations

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Import TypeScript modules using dynamic import
let featurizeModule;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function loadFeaturizeModule() {
  try {
    // Try to require the compiled JS first
    featurizeModule = require('../lib/featurize.js');
  } catch (error) {
    // If that fails, use tsx to run TypeScript directly
    try {
      const { spawn } = require('child_process');
      console.log('Compiling TypeScript module...');
      
      // Create a temporary wrapper to compile and export functions
      const fs = require('fs');
      const path = require('path');
      
      const wrapperContent = `
const { buildVector, batchVectorize, DEFAULT_WEIGHTS, getVectorDimensions } = require('./featurize.ts');
module.exports = { buildVector, batchVectorize, DEFAULT_WEIGHTS, getVectorDimensions };
`;
      
      const wrapperPath = path.join(__dirname, '../lib/featurize-wrapper.js');
      fs.writeFileSync(wrapperPath, wrapperContent);
      
      featurizeModule = require('../lib/featurize-wrapper.js');
    } catch (tsError) {
      console.error('Failed to load featurize module:', tsError);
      console.log('Using fallback feature extraction (basic version)');
      
      // Fallback: simple feature extraction
      featurizeModule = {
        buildVector: (movie, weights) => {
          // Simple fallback vector based on basic features
          const genres = movie.genres || [];
          const rating = (movie.vote_average || 0) / 10;
          
          // Create a simple 20-dimensional vector
          const vector = new Array(20).fill(0);
          
          // Genre features (first 10 dimensions)
          const genreMap = {
            'Action': 0, 'Comedy': 1, 'Drama': 2, 'Horror': 3, 'Romance': 4,
            'Thriller': 5, 'Adventure': 6, 'Animation': 7, 'Crime': 8, 'Family': 9
          };
          
          genres.forEach(genre => {
            if (genreMap[genre] !== undefined) {
              vector[genreMap[genre]] = 1;
            }
          });
          
          // Rating feature (dimension 10)
          vector[10] = rating;
          
          // Year features (dimensions 11-15)
          if (movie.release_year) {
            if (movie.release_year >= 2020) vector[11] = 1;
            else if (movie.release_year >= 2010) vector[12] = 1;
            else if (movie.release_year >= 2000) vector[13] = 1;
            else if (movie.release_year >= 1990) vector[14] = 1;
            else vector[15] = 1;
          }
          
          // Cast/Director features (dimensions 16-19)
          if (movie.cast && movie.cast.length > 0) vector[16] = Math.min(movie.cast.length / 10, 1);
          if (movie.directors && movie.directors.length > 0) vector[17] = 1;
          if (movie.cinematographers && movie.cinematographers.length > 0) vector[18] = 1;
          if (movie.keywords && movie.keywords.length > 0) vector[19] = Math.min(movie.keywords.length / 20, 1);
          
          // L2 normalize
          const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0)) || 1;
          return vector.map(val => val / norm);
        },
        batchVectorize: (movies, weights) => {
          return movies.map(movie => ({
            id: movie.id,
            vector: featurizeModule.buildVector(movie, weights)
          }));
        },
        DEFAULT_WEIGHTS: {
          genre: 1.0, rating: 0.5, cast: 0.8, director: 1.0,
          cinema: 0.7, keywords: 0.6, year: 0.3, runtime: 0.2
        },
        getVectorDimensions: () => 20
      };
    }
  }
}

async function fetchMoviesForVectorization(batchSize = 100, offset = 0) {
  const { data, error } = await supabase
    .rpc('get_movies_for_vectorization', { 
      batch_size: batchSize, 
      offset_count: offset 
    });

  if (error) {
    console.error('Database error:', error);
    return [];
  }

  return data || [];
}

async function storeVectors(vectors) {
  const vectorData = vectors.map(({ id, vector }) => ({
    id,
    vector,
    version: 1,
    updated_at: new Date().toISOString()
  }));

  const { error } = await supabase
    .from('movie_vectors')
    .upsert(vectorData);

  if (error) {
    console.error('Failed to store vectors:', error);
    return false;
  }

  return true;
}

async function computeVectorsForBatch(movies, weights) {
  console.log(`Computing vectors for ${movies.length} movies...`);
  
  const vectors = featurizeModule.batchVectorize(movies, weights);
  
  console.log(`Generated ${vectors.length} vectors with ${vectors[0]?.vector.length} dimensions`);
  
  const success = await storeVectors(vectors);
  
  if (success) {
    console.log(`✓ Stored ${vectors.length} vectors`);
    return vectors.length;
  } else {
    console.log(`✗ Failed to store vectors`);
    return 0;
  }
}

async function checkVectorStatus() {
  const [{ count: totalMovies }, { count: vectorizedMovies }] = await Promise.all([
    supabase.from('movies').select('*', { count: 'exact', head: true }),
    supabase.from('movie_vectors').select('*', { count: 'exact', head: true })
  ]);

  console.log(`Movies: ${totalMovies || 0}, Vectorized: ${vectorizedMovies || 0}`);
  
  return {
    total: totalMovies || 0,
    vectorized: vectorizedMovies || 0,
    remaining: (totalMovies || 0) - (vectorizedMovies || 0)
  };
}

async function main() {
  const args = process.argv.slice(2);
  const batchSize = parseInt(args[0]) || 100;
  const maxBatches = parseInt(args[1]) || 10;
  
  console.log('🎬 Movie Vector Computation Script');
  console.log('==================================');
  
  await loadFeaturizeModule();
  
  const status = await checkVectorStatus();
  console.log(`Status: ${status.vectorized}/${status.total} movies vectorized`);
  
  if (status.remaining === 0) {
    console.log('✅ All movies already have vectors!');
    return;
  }

  const weights = featurizeModule.DEFAULT_WEIGHTS;
  console.log('Using weights:', JSON.stringify(weights, null, 2));
  
  let totalProcessed = 0;
  let offset = status.vectorized;
  
  for (let batch = 0; batch < maxBatches && offset < status.total; batch++) {
    console.log(`\n--- Batch ${batch + 1}/${maxBatches} ---`);
    console.log(`Fetching movies ${offset + 1} to ${offset + batchSize}...`);
    
    const movies = await fetchMoviesForVectorization(batchSize, offset);
    
    if (movies.length === 0) {
      console.log('No more movies to process');
      break;
    }
    
    const processed = await computeVectorsForBatch(movies, weights);
    totalProcessed += processed;
    offset += movies.length;
    
    // Small delay between batches
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`\n✅ Computation completed: ${totalProcessed} vectors generated`);
  
  // Final status check
  const finalStatus = await checkVectorStatus();
  console.log(`Final status: ${finalStatus.vectorized}/${finalStatus.total} movies vectorized`);
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Vector computation failed:', error);
    process.exit(1);
  });
}