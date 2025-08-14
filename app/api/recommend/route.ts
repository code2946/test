import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cosineDistance, computeCentroid, FeatureWeights, DEFAULT_WEIGHTS } from '@/lib/featurize';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface RecommendationRequest {
  selectedIds: number[];
  weights?: FeatureWeights;
  limit?: number;
  excludeSelected?: boolean;
  hybrid?: boolean;
  hybridAlpha?: number;
  minSimilarity?: number;
}

interface MovieResult {
  id: number;
  title: string;
  poster_path: string | null;
  vote_average: number;
  release_year: number | null;
  genres: string[];
  overview: string;
  popularity: number;
  runtime: number | null;
  directors: string[];
  cast: string[];
  similarity_score?: number;
}

// Cache for performance
const cache = new Map<string, { data: any; expires: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheKey(selectedIds: number[], weights: FeatureWeights, options: any): string {
  return JSON.stringify({ selectedIds: selectedIds.sort(), weights, options });
}

function getFromCache(key: string) {
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }
  cache.delete(key);
  return null;
}

function setCache(key: string, data: any) {
  cache.set(key, { data, expires: Date.now() + CACHE_TTL });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as RecommendationRequest;
    const {
      selectedIds = [],
      weights = DEFAULT_WEIGHTS,
      limit = 30,
      excludeSelected = true,
      hybrid = false,
      hybridAlpha = 0.7,
      minSimilarity = 0.1
    } = body;

    // Validation
    if (!selectedIds || selectedIds.length === 0) {
      return NextResponse.json({ results: [], message: 'No movies selected' });
    }

    if (selectedIds.length > 10) {
      return NextResponse.json({ 
        error: 'Too many movies selected. Please select 10 or fewer movies.' 
      }, { status: 400 });
    }

    // Check cache
    const cacheKey = getCacheKey(selectedIds, weights, { limit, excludeSelected, hybrid, hybridAlpha, minSimilarity });
    const cached = getFromCache(cacheKey);
    if (cached) {
      return NextResponse.json({ results: cached, cached: true });
    }

    // Fetch vectors for selected movies
    const { data: selectedVectors, error: vectorError } = await supabase
      .from('movie_vectors')
      .select('id, vector')
      .in('id', selectedIds);

    if (vectorError) {
      console.error('Vector fetch error:', vectorError);
      return NextResponse.json({ 
        error: 'Failed to fetch movie vectors' 
      }, { status: 500 });
    }

    if (!selectedVectors || selectedVectors.length === 0) {
      return NextResponse.json({ 
        error: 'No vectors found for selected movies. Please ensure movies have been processed.' 
      }, { status: 404 });
    }

    // Compute centroid of selected movie vectors
    const vectors = selectedVectors.map(v => v.vector as number[]);
    const centroid = computeCentroid(vectors);

    if (centroid.length === 0) {
      return NextResponse.json({ 
        error: 'Failed to compute recommendation centroid' 
      }, { status: 500 });
    }

    // Fetch candidate movies and their vectors
    // For better performance with large datasets, this should use pgvector with ANN index
    const candidateLimit = Math.min(5000, limit * 50); // Get more candidates to improve quality
    
    const { data: candidates, error: candidateError } = await supabase
      .from('movie_vectors')
      .select('id, vector')
      .limit(candidateLimit);

    if (candidateError) {
      console.error('Candidate fetch error:', candidateError);
      return NextResponse.json({ 
        error: 'Failed to fetch candidate movies' 
      }, { status: 500 });
    }

    if (!candidates || candidates.length === 0) {
      return NextResponse.json({ 
        error: 'No candidate movies found' 
      }, { status: 404 });
    }

    // Compute similarity scores
    const selectedSet = new Set(selectedIds);
    let scoredCandidates = candidates
      .filter(c => !(excludeSelected && selectedSet.has(c.id)))
      .map(candidate => {
        const similarity = cosineDistance(centroid, candidate.vector as number[]);
        return { id: candidate.id, score: similarity };
      })
      .filter(c => c.score >= minSimilarity)
      .sort((a, b) => b.score - a.score);

    // Optional: Hybrid recommendation with collaborative filtering
    if (hybrid && selectedIds.length > 0) {
      const baseMovieId = selectedIds[0]; // Use first selection as anchor for CF
      
      const { data: cfScores } = await supabase
        .from('cf_scores')
        .select('rec_id, score')
        .eq('base_id', baseMovieId)
        .limit(1000);

      const cfMap = new Map((cfScores || []).map(r => [r.rec_id, r.score]));
      
      scoredCandidates = scoredCandidates.map(candidate => {
        const cfScore = cfMap.get(candidate.id) || 0;
        const hybridScore = hybridAlpha * candidate.score + (1 - hybridAlpha) * cfScore;
        return { id: candidate.id, score: hybridScore };
      });
      
      scoredCandidates.sort((a, b) => b.score - a.score);
    }

    // Get top recommendations
    const topCandidateIds = scoredCandidates
      .slice(0, limit)
      .map(c => c.id);

    if (topCandidateIds.length === 0) {
      return NextResponse.json({ 
        results: [], 
        message: 'No similar movies found. Try adjusting your selection or similarity threshold.' 
      });
    }

    // Fetch movie metadata for recommendations
    const { data: movieResults, error: movieError } = await supabase
      .from('movies')
      .select(`
        id, title, poster_path, vote_average, release_year, overview, 
        popularity, runtime, directors, cast
      `)
      .in('id', topCandidateIds);

    if (movieError) {
      console.error('Movie metadata error:', movieError);
      return NextResponse.json({ 
        error: 'Failed to fetch movie details' 
      }, { status: 500 });
    }

    // Fetch genres for each movie
    const { data: genreData } = await supabase
      .from('movie_genres')
      .select(`
        movie_id,
        genres!inner(name)
      `)
      .in('movie_id', topCandidateIds);

    // Group genres by movie
    const genreMap = new Map<number, string[]>();
    (genreData || []).forEach((item: any) => {
      const movieId = item.movie_id;
      const genreName = item.genres.name;
      if (!genreMap.has(movieId)) {
        genreMap.set(movieId, []);
      }
      genreMap.get(movieId)!.push(genreName);
    });

    // Create scored map for sorting
    const scoreMap = new Map(scoredCandidates.map(c => [c.id, c.score]));

    // Combine results and maintain recommendation order
    const results: MovieResult[] = (movieResults || [])
      .map(movie => ({
        ...movie,
        genres: genreMap.get(movie.id) || [],
        similarity_score: scoreMap.get(movie.id) || 0
      }))
      .sort((a, b) => (scoreMap.get(b.id) || 0) - (scoreMap.get(a.id) || 0));

    // Cache results
    setCache(cacheKey, results);

    return NextResponse.json({
      results,
      metadata: {
        selectedCount: selectedIds.length,
        candidatesEvaluated: candidates.length,
        similarityThreshold: minSimilarity,
        hybrid,
        weights
      }
    });

  } catch (error: any) {
    console.error('Recommendation error:', error?.message || error);
    return NextResponse.json({ 
      error: 'Internal server error while generating recommendations' 
    }, { status: 500 });
  }
}

// GET endpoint for checking system status
export async function GET() {
  try {
    const [
      { count: totalMovies },
      { count: vectorizedMovies },
      { count: cfScores }
    ] = await Promise.all([
      supabase.from('movies').select('*', { count: 'exact', head: true }),
      supabase.from('movie_vectors').select('*', { count: 'exact', head: true }),
      supabase.from('cf_scores').select('*', { count: 'exact', head: true })
    ]);

    return NextResponse.json({
      status: 'ready',
      movies: totalMovies || 0,
      vectorized: vectorizedMovies || 0,
      collaborative_scores: cfScores || 0,
      vectorization_complete: (vectorizedMovies || 0) > 0,
      hybrid_available: (cfScores || 0) > 0
    });
  } catch (error: any) {
    console.error('Status check error:', error?.message || error);
    return NextResponse.json({ 
      status: 'error',
      error: 'Failed to check system status' 
    }, { status: 500 });
  }
}