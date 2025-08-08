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

// Mock data for fallback when database is not available
const mockMovies: TMDBMovie[] = [
  {
    id: 550,
    title: "Fight Club",
    overview: "A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy.",
    release_date: "1999-10-15",
    vote_average: 8.4,
    poster_path: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
    backdrop_path: "/fCayJrkfRaCRCTh8GqN30f8oyQF.jpg",
    genre_names: ["Drama", "Thriller"],
    popularity: 71.234,
    category: "popular"
  },
  {
    id: 238,
    title: "The Shawshank Redemption", 
    overview: "Framed in the 1940s for the double murder of his wife and her lover, upstanding banker Andy Dufresne begins a new life at the Shawshank prison.",
    release_date: "1994-09-23",
    vote_average: 9.3,
    poster_path: "/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",
    backdrop_path: "/iNh3BivHyg5sQRPP1KOkzguEX0H.jpg",
    genre_names: ["Drama", "Crime"],
    popularity: 95.123,
    category: "top_rated"
  },
  {
    id: 19404,
    title: "Dilwale Dulhania Le Jayenge",
    overview: "Raj and Simran meet during a trip across Europe and fall in love, but Simran's father has already arranged her marriage.",
    release_date: "1995-10-20",
    vote_average: 8.7,
    poster_path: "/ktejodbcdCPXbMMdnpI9BUxW6O8.jpg", 
    backdrop_path: "/90ez6ArvpO8bvpyIngBuwXOqJm5.jpg",
    genre_names: ["Comedy", "Drama", "Romance"],
    popularity: 45.123,
    category: "bollywood"
  },
  {
    id: 486589,
    title: "Red Notice",
    overview: "An Interpol-issued Red Notice is a global alert to hunt and capture the world's most wanted.",
    release_date: "2021-11-05", 
    vote_average: 6.8,
    poster_path: "/lAXONuqg41NwUMuzMiFvicDET9Y.jpg",
    backdrop_path: "/8Y43POKjjKDGI9MH89NW0NAzzp8.jpg",
    genre_names: ["Action", "Comedy", "Crime"],
    popularity: 156.789,
    category: "trending"
  },
  {
    id: 155,
    title: "The Dark Knight",
    overview: "Batman raises the stakes in his war on crime with the help of Lt. Jim Gordon and District Attorney Harvey Dent.",
    release_date: "2008-07-18",
    vote_average: 9.0,
    poster_path: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    backdrop_path: "/hqkIcbrOHL86UncnHIsHVcVmzue.jpg",
    genre_names: ["Action", "Crime", "Drama"],
    popularity: 99.567,
    category: "popular"
  },
  {
    id: 19551,
    title: "3 Idiots", 
    overview: "In the tradition of coming-of-age films, 'Three Idiots' revolves around the lives of three friends.",
    release_date: "2009-12-25",
    vote_average: 8.4,
    poster_path: "/66A9MqXOyVFCssoloscw38nJp8B.jpg",
    backdrop_path: "/cQvc9N6JiMVKqol3wcYrGshsIdZ.jpg",
    genre_names: ["Comedy", "Drama"],
    popularity: 38.567,
    category: "bollywood"
  }
]

const mockGenres: TMDBGenre[] = [
  { id: 28, name: "Action" },
  { id: 12, name: "Adventure" },
  { id: 16, name: "Animation" }, 
  { id: 35, name: "Comedy" },
  { id: 80, name: "Crime" },
  { id: 99, name: "Documentary" },
  { id: 18, name: "Drama" },
  { id: 10751, name: "Family" },
  { id: 14, name: "Fantasy" },
  { id: 36, name: "History" },
  { id: 27, name: "Horror" },
  { id: 10402, name: "Music" },
  { id: 9648, name: "Mystery" },
  { id: 10749, name: "Romance" },
  { id: 878, name: "Science Fiction" },
  { id: 53, name: "Thriller" },
  { id: 10752, name: "War" },
  { id: 37, name: "Western" }
]

// Cache keys for different queries
const CACHE_KEYS = {
  GENRES: 'db_genres',
  POPULAR: 'db_popular',
  TOP_RATED: 'db_top_rated', 
  BOLLYWOOD: 'db_bollywood',
  TRENDING: 'db_trending',
}

// Database query functions with fallback
async function cachedQuery(
  cacheKey: string,
  queryFn: () => Promise<any>,
  fallbackData: any,
  cacheTTL = 300
): Promise<any> {
  const cached = apiCache.get(cacheKey)
  if (cached) {
    return cached
  }

  try {
    const data = await queryFn()
    
    // If data is empty or null, use fallback
    if (!data || (Array.isArray(data) && data.length === 0)) {
      console.warn(`No data returned for ${cacheKey}, using fallback`)
      apiCache.set(cacheKey, fallbackData, cacheTTL)
      return fallbackData
    }
    
    apiCache.set(cacheKey, data, cacheTTL)
    return data
  } catch (error) {
    console.error(`Database query error for ${cacheKey}:`, error)
    console.log(`Using fallback data for ${cacheKey}`)
    
    // Cache fallback data for shorter time
    apiCache.set(cacheKey, fallbackData, 60) // 1 minute cache for fallback
    return fallbackData
  }
}

// Convert database movie to TMDBMovie format
function formatMovieFromDB(dbMovie: any, genres?: string[]): TMDBMovie {
  return {
    id: dbMovie.id,
    title: dbMovie.title || 'Unknown Title',
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

// Get genres from database with fallback
export const getGenres = async (): Promise<TMDBGenre[]> => {
  return cachedQuery(CACHE_KEYS.GENRES, async () => {
    const { data, error } = await supabase
      .from('genres')
      .select('id, name')
      .order('name')

    if (error) {
      throw new Error(`Failed to fetch genres: ${error.message}`)
    }

    return data || []
  }, mockGenres)
}

// Get movies by category with fallback
async function getMoviesByCategory(
  category: string,
  page: number = 1,
  pageSize: number = 20
): Promise<MovieResponse> {
  const cacheKey = `${category}_page_${page}`
  
  return cachedQuery(cacheKey, async () => {
    // Try using RPC function first
    try {
      const { data, error } = await supabase
        .rpc('get_movies_by_category', {
          category_name: category,
          page_num: page,
          page_size: pageSize
        })

      if (error) {
        throw error
      }

      if (data && data.length > 0) {
        const movies = data.map((movie: any) => formatMovieFromDB(movie))
        return {
          results: movies,
          total_pages: Math.ceil(data.length / pageSize),
          page: page,
          total_results: data.length,
        }
      }
    } catch (rpcError) {
      console.warn('RPC function failed, trying direct query:', rpcError)
    }

    // Fallback to direct query
    const { data: movies, error: movieError } = await supabase
      .from('movies')
      .select(`
        *,
        movie_genres!inner(
          genres!inner(name)
        )
      `)
      .eq('category', category)
      .order('popularity', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1)

    if (movieError) {
      throw movieError
    }

    if (!movies || movies.length === 0) {
      throw new Error('No movies found')
    }

    // Group genres by movie
    const moviesMap = new Map()
    movies.forEach((movie: any) => {
      if (!moviesMap.has(movie.id)) {
        moviesMap.set(movie.id, {
          ...movie,
          genre_names: []
        })
      }
      if (movie.movie_genres?.[0]?.genres?.name) {
        moviesMap.get(movie.id).genre_names.push(movie.movie_genres[0].genres.name)
      }
    })

    const formattedMovies = Array.from(moviesMap.values()).map((movie: any) => 
      formatMovieFromDB(movie, movie.genre_names)
    )

    return {
      results: formattedMovies,
      total_pages: Math.ceil(formattedMovies.length / pageSize),
      page: page,
      total_results: formattedMovies.length,
    }
  }, {
    results: mockMovies.filter(m => m.category === category).slice(0, pageSize),
    total_pages: 1,
    page: page,
    total_results: mockMovies.filter(m => m.category === category).length,
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

// Search movies with fallback
export const searchMovies = async (query: string, page: number = 1): Promise<MovieResponse> => {
  const pageSize = 20
  const cacheKey = `search_${query.toLowerCase()}_page_${page}`

  return cachedQuery(cacheKey, async () => {
    // Try RPC function first
    try {
      const { data, error } = await supabase
        .rpc('search_movies', {
          search_query: query,
          page_num: page,
          page_size: pageSize
        })

      if (error) {
        throw error
      }

      if (data && data.length > 0) {
        const movies = data.map((movie: any) => formatMovieFromDB(movie))
        return {
          results: movies,
          total_pages: Math.ceil(data.length / pageSize),
          page: page,
          total_results: data.length,
        }
      }
    } catch (rpcError) {
      console.warn('Search RPC failed, trying direct query:', rpcError)
    }

    // Fallback to direct query
    const { data: movies, error } = await supabase
      .from('movies')
      .select('*')
      .or(`title.ilike.%${query}%,overview.ilike.%${query}%`)
      .order('popularity', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1)

    if (error) {
      throw error
    }

    const formattedMovies = (movies || []).map((movie: any) => formatMovieFromDB(movie))

    return {
      results: formattedMovies,
      total_pages: Math.ceil((movies?.length || 0) / pageSize),
      page: page,
      total_results: movies?.length || 0,
    }
  }, {
    // Fallback: filter mock movies by query
    results: mockMovies.filter(movie => 
      movie.title.toLowerCase().includes(query.toLowerCase()) ||
      movie.overview.toLowerCase().includes(query.toLowerCase())
    ).slice(0, pageSize),
    total_pages: 1,
    page: page,
    total_results: mockMovies.length,
  }, 120)
}

// Get movie details by ID with fallback
export const getMovieDetails = async (movieId: number): Promise<TMDBMovieDetails> => {
  const cacheKey = `movie_${movieId}`

  return cachedQuery(cacheKey, async () => {
    const { data: movie, error } = await supabase
      .from('movies')
      .select(`
        *,
        movie_genres!inner(
          genres!inner(id, name)
        )
      `)
      .eq('id', movieId)
      .single()

    if (error || !movie) {
      throw new Error('Movie not found')
    }

    // Extract genres
    const genres = movie.movie_genres?.map((mg: any) => mg.genres) || []
    const genreNames = genres.map((g: any) => g.name)

    return {
      ...formatMovieFromDB(movie, genreNames),
      runtime: 120, // Default runtime
      genres: genres,
      credits: {
        cast: [],
        crew: []
      }
    }
  }, {
    // Fallback: return first mock movie with details
    ...mockMovies[0],
    runtime: 139,
    genres: [{ id: 18, name: "Drama" }, { id: 53, name: "Thriller" }],
    credits: {
      cast: [{ name: "Brad Pitt", character: "Tyler Durden" }],
      crew: [{ name: "David Fincher", job: "Director" }]
    }
  })
}

// Discover movies with filters and fallback
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
    let query = supabase.from('movies').select('*')

    // Apply basic filters
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

    const { data, error } = await query

    if (error) {
      throw error
    }

    const movies = (data || []).map((movie: any) => formatMovieFromDB(movie))

    return {
      results: movies,
      total_pages: Math.ceil((data?.length || 0) / pageSize),
      page: page,
      total_results: data?.length || 0,
    }
  }, {
    // Fallback to filtered mock data
    results: mockMovies.slice(0, pageSize),
    total_pages: 1,
    page: page,
    total_results: mockMovies.length,
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

// Utility functions
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

// Mock functions for compatibility
export const getMovieCredits = async (movieId: number) => {
  return { cast: [], crew: [] }
}

export const getMovieVideos = async (movieId: number) => {
  return []
}

export const getSimilarMovies = async (movieId: number, page: number = 1) => {
  return getPopularMovies(page)
}

export const getMovieWatchProviders = async (movieId: number) => {
  return {}
}

export const getMovieRecommendations = async (movieId: number, page: number = 1) => {
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
    console.error('Database connection failed:', error)
    return {
      connected: false,
      hasGenres: false,
      hasMovies: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}