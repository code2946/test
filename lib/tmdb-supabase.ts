import { supabase } from './supabase'
import { apiCache } from './cache'

// Movie interfaces matching database structure
export interface TMDBMovie {
  id: number
  title: string
  overview: string
  release_date: string
  vote_average: number
  poster_path: string | null
  backdrop_path: string | null
  genre_ids?: number[]
  genre_names?: string[]
  runtime?: number
  popularity?: number
  original_language?: string
  category?: string
}

export interface TMDBMovieDetails extends TMDBMovie {
  runtime: number
  genres: { id: number; name: string }[]
  credits?: {
    cast: { name: string; character: string }[]
    crew: { name: string; job: string }[]
  }
}

export interface TMDBGenre {
  id: number
  name: string
}

export interface MovieResponse {
  results: TMDBMovie[]
  total_pages: number
  page: number
  total_results: number
}

// Cache keys for different queries
const CACHE_KEYS = {
  GENRES: 'db_genres',
  POPULAR: 'db_popular',
  TOP_RATED: 'db_top_rated',
  BOLLYWOOD: 'db_bollywood',
  TRENDING: 'db_trending',
}

// Database query functions with caching
async function cachedQuery(
  cacheKey: string,
  queryFn: () => Promise<any>,
  cacheTTL = 300 // 5 minutes cache
): Promise<any> {
  const cached = apiCache.get(cacheKey)
  if (cached) {
    return cached
  }

  try {
    const data = await queryFn()
    apiCache.set(cacheKey, data, cacheTTL)
    return data
  } catch (error) {
    console.error(`Database query error for ${cacheKey}:`, error)
    throw error
  }
}

// Convert database movie to TMDBMovie format
function formatMovieFromDB(dbMovie: any, genres?: string[]): TMDBMovie {
  return {
    id: dbMovie.id,
    title: dbMovie.title,
    overview: dbMovie.overview || '',
    release_date: dbMovie.release_date || '',
    vote_average: parseFloat(dbMovie.vote_average) || 0,
    poster_path: dbMovie.poster_path,
    backdrop_path: dbMovie.backdrop_path,
    genre_names: genres || dbMovie.genre_names || [],
    popularity: parseFloat(dbMovie.popularity) || 0,
    original_language: dbMovie.original_language,
    category: dbMovie.category,
  }
}

// Get genres from database
export const getGenres = async (): Promise<TMDBGenre[]> => {
  return cachedQuery(CACHE_KEYS.GENRES, async () => {
    const { data, error } = await supabase
      .from('genres')
      .select('id, name')
      .order('name')

    if (error) {
      console.error('Error fetching genres:', error)
      throw new Error(`Failed to fetch genres: ${error.message}`)
    }

    return data || []
  })
}

// Get movies by category with pagination
async function getMoviesByCategory(
  category: string,
  page: number = 1,
  pageSize: number = 20
): Promise<MovieResponse> {
  const cacheKey = `${category}_page_${page}`
  
  return cachedQuery(cacheKey, async () => {
    // Get total count first
    const { count } = await supabase
      .from('movies')
      .select('*', { count: 'exact', head: true })
      .eq('category', category)

    const totalResults = count || 0
    const totalPages = Math.ceil(totalResults / pageSize)
    const offset = (page - 1) * pageSize

    // Get movies with genres
    const { data, error } = await supabase
      .rpc('get_movies_by_category', {
        category_name: category,
        page_num: page,
        page_size: pageSize
      })

    if (error) {
      console.error(`Error fetching ${category} movies:`, error)
      throw new Error(`Failed to fetch ${category} movies: ${error.message}`)
    }

    const movies = (data || []).map((movie: any) => formatMovieFromDB(movie))

    return {
      results: movies,
      total_pages: totalPages,
      page: page,
      total_results: totalResults,
    }
  })
}

// Get popular movies
export const getPopularMovies = async (page: number = 1): Promise<MovieResponse> => {
  return getMoviesByCategory('popular', page)
}

// Get top rated movies
export const getTopRatedMovies = async (page: number = 1): Promise<MovieResponse> => {
  return getMoviesByCategory('top_rated', page)
}

// Get trending movies
export const getTrendingMovies = async (page: number = 1): Promise<MovieResponse> => {
  return getMoviesByCategory('trending', page)
}

// Get Bollywood movies
export const getBollywoodMovies = async (page: number = 1): Promise<MovieResponse> => {
  return getMoviesByCategory('bollywood', page)
}

// Legacy function aliases for backward compatibility
export const getIndianMovies = getBollywoodMovies
export const getHindiMovies = getBollywoodMovies

// Search movies
export const searchMovies = async (query: string, page: number = 1): Promise<MovieResponse> => {
  const pageSize = 20
  const cacheKey = `search_${query}_page_${page}`

  return cachedQuery(cacheKey, async () => {
    // Get movies using search function
    const { data, error } = await supabase
      .rpc('search_movies', {
        search_query: query,
        page_num: page,
        page_size: pageSize
      })

    if (error) {
      console.error('Error searching movies:', error)
      throw new Error(`Failed to search movies: ${error.message}`)
    }

    const movies = (data || []).map((movie: any) => formatMovieFromDB(movie))

    // Get total count for pagination (approximation)
    const totalResults = movies.length < pageSize ? movies.length + (page - 1) * pageSize : page * pageSize + 1
    const totalPages = Math.ceil(totalResults / pageSize)

    return {
      results: movies,
      total_pages: totalPages,
      page: page,
      total_results: totalResults,
    }
  }, 120) // Shorter cache for search
}

// Get movie details by ID
export const getMovieDetails = async (movieId: number): Promise<TMDBMovieDetails> => {
  const cacheKey = `movie_${movieId}`

  return cachedQuery(cacheKey, async () => {
    // Get movie with genres
    const { data: movie, error: movieError } = await supabase
      .from('movies')
      .select(`
        *,
        movie_genres!inner(
          genres(id, name)
        )
      `)
      .eq('id', movieId)
      .single()

    if (movieError) {
      console.error('Error fetching movie details:', movieError)
      throw new Error(`Failed to fetch movie details: ${movieError.message}`)
    }

    if (!movie) {
      throw new Error('Movie not found')
    }

    // Extract genres
    const genres = movie.movie_genres?.map((mg: any) => mg.genres) || []
    const genreNames = genres.map((g: any) => g.name)

    return {
      ...formatMovieFromDB(movie, genreNames),
      runtime: 120, // Default runtime as we don't store this in our simplified schema
      genres: genres,
      credits: {
        cast: [], // We don't store cast/crew data to save space
        crew: []
      }
    }
  })
}

// Discover movies with filters
export const discoverMovies = async (params: {
  genres?: number[]
  minRating?: number
  year?: number
  sortBy?: string
  page?: number
  country?: string
  originalLanguage?: string
}): Promise<MovieResponse> => {
  const page = params.page || 1
  const pageSize = 20
  const cacheKey = `discover_${JSON.stringify(params)}`

  return cachedQuery(cacheKey, async () => {
    let query = supabase.from('movies').select(`
      *,
      movie_genres!inner(
        genres!inner(id, name)
      )
    `)

    // Apply filters
    if (params.genres && params.genres.length > 0) {
      query = query.in('movie_genres.genre_id', params.genres)
    }

    if (params.minRating) {
      query = query.gte('vote_average', params.minRating)
    }

    if (params.year) {
      query = query.gte('release_date', `${params.year}-01-01`)
            .lte('release_date', `${params.year}-12-31`)
    }

    if (params.country) {
      query = query.eq('region', params.country)
    }

    if (params.originalLanguage) {
      query = query.eq('original_language', params.originalLanguage)
    }

    // Apply sorting
    const sortBy = params.sortBy || 'popularity.desc'
    const [sortField, sortOrder] = sortBy.split('.')
    query = query.order(sortField, { ascending: sortOrder !== 'desc' })

    // Apply pagination
    const offset = (page - 1) * pageSize
    query = query.range(offset, offset + pageSize - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Error discovering movies:', error)
      throw new Error(`Failed to discover movies: ${error.message}`)
    }

    // Format movies and deduplicate by ID
    const moviesMap = new Map()
    data?.forEach((movie: any) => {
      if (!moviesMap.has(movie.id)) {
        const genres = movie.movie_genres?.map((mg: any) => mg.genres.name) || []
        moviesMap.set(movie.id, formatMovieFromDB(movie, genres))
      }
    })

    const movies = Array.from(moviesMap.values())
    const totalResults = count || movies.length
    const totalPages = Math.ceil(totalResults / pageSize)

    return {
      results: movies,
      total_pages: totalPages,
      page: page,
      total_results: totalResults,
    }
  })
}

// Get movies by genre
export const getMoviesByGenre = async (
  genreId: number,
  page: number = 1
): Promise<MovieResponse> => {
  return discoverMovies({
    genres: [genreId],
    page: page,
    sortBy: 'popularity.desc'
  })
}

// Utility functions (keep existing ones)
export const getImageUrl = (
  path: string | null,
  size: "w200" | "w300" | "w500" | "w780" | "original" = "w500",
): string => {
  if (!path) return "/placeholder.svg?height=750&width=500&text=No+Image"
  return `https://image.tmdb.org/t/p/${size}${path}`
}

export const formatRuntime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
}

// Mock functions for compatibility (return empty data since we don't store this)
export const getMovieCredits = async (movieId: number) => {
  return { cast: [], crew: [] }
}

export const getMovieVideos = async (movieId: number) => {
  return []
}

export const getSimilarMovies = async (movieId: number, page: number = 1) => {
  // Return movies from the same category as a simple similarity
  const movie = await getMovieDetails(movieId)
  return getMoviesByCategory(movie.category || 'popular', page)
}

export const getMovieWatchProviders = async (movieId: number) => {
  return {}
}

export const getMovieRecommendations = async (movieId: number, page: number = 1) => {
  // Return popular movies as recommendations
  return getPopularMovies(page)
}

// Database status check
export const checkDatabaseStatus = async () => {
  try {
    const { data: genres } = await supabase.from('genres').select('id').limit(1)
    const { data: movies } = await supabase.from('movies').select('id').limit(1)
    
    return {
      connected: true,
      hasGenres: (genres?.length || 0) > 0,
      hasMovies: (movies?.length || 0) > 0
    }
  } catch (error) {
    return {
      connected: false,
      hasGenres: false,
      hasMovies: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}