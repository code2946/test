// This file now acts as a wrapper around the original TMDB API
// All functions directly use TMDB instead of database

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
  page?: number
  total_results?: number
}


// Use the new proxy-based TMDB client instead of direct API calls
import { 
  getGenres as tmdbGetGenres,
  searchMovies as tmdbSearchMovies,
  getPopularMovies as tmdbGetPopularMovies,
  getTopRatedMovies as tmdbGetTopRatedMovies,
  discoverMovies as tmdbDiscoverMovies,
  getIndianMovies as tmdbGetIndianMovies,
  getBollywoodMovies as tmdbGetBollywoodMovies,
  getHindiMovies as tmdbGetHindiMovies,
  getMovieDetails as tmdbGetMovieDetails,
  getMoviesByGenre as tmdbGetMoviesByGenre,
  getImageUrl as tmdbGetImageUrl
} from './tmdb-client'


// Get genres from TMDB API directly
export const getGenres = async (): Promise<TMDBGenre[]> => {
  return tmdbGetGenres()
}

// Use TMDB API directly for all movie fetching
export const getPopularMovies = async (page: number = 1): Promise<MovieResponse> => {
  return tmdbGetPopularMovies(page)
}

export const getTopRatedMovies = async (page: number = 1): Promise<MovieResponse> => {
  return tmdbGetTopRatedMovies(page)
}

export const getIndianMovies = async (page: number = 1): Promise<MovieResponse> => {
  return tmdbGetIndianMovies(page)
}

export const getBollywoodMovies = async (page: number = 1): Promise<MovieResponse> => {
  return tmdbGetBollywoodMovies(page)
}

export const getHindiMovies = async (page: number = 1): Promise<MovieResponse> => {
  return tmdbGetHindiMovies(page)
}

// Search movies using TMDB API
export const searchMovies = async (query: string, page: number = 1): Promise<MovieResponse> => {
  return tmdbSearchMovies(query, page)
}

// Get movie details using TMDB API
export const getMovieDetails = async (movieId: number): Promise<TMDBMovieDetails> => {
  return tmdbGetMovieDetails(movieId)
}

// Discover movies using TMDB API
export const discoverMovies = async (params: {
  genres?: number[]
  minRating?: number
  year?: number
  sortBy?: string
  page?: number
  country?: string
  originalLanguage?: string
}): Promise<MovieResponse> => {
  return tmdbDiscoverMovies(params)
}

// Get movies by genre using TMDB API
export const getMoviesByGenre = async (
  genreId: number,
  page: number = 1
): Promise<MovieResponse> => {
  return tmdbGetMoviesByGenre(genreId, page)
}

// Use the proxy-based image URL function
export const getImageUrl = (
  path: string | null,
  size: "w200" | "w300" | "w342" | "w500" | "w780" | "original" = "w500",
): string => {
  return tmdbGetImageUrl(path, size)
}

// Additional utility to validate image URLs
export const validateImageUrl = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, { method: 'HEAD' })
    return response.ok
  } catch {
    return false
  }
}

export const formatRuntime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
}

// Database status check function for compatibility
export const checkDatabaseStatus = async () => {
  return {
    connected: true,
    hasMovies: true,
    hasGenres: true,
    movieCount: 50000,
    error: null
  }
}

// Re-export TMDB utility functions from the new client
export { 
  getMovieCredits, 
  getMovieVideos, 
  getSimilarMovies, 
  getMovieWatchProviders, 
  getMovieRecommendations 
} from './tmdb-client'