// New client-side TMDB wrapper that uses our proxy endpoints
// This replaces direct TMDB API calls with calls to our server-side proxies

import { apiCache } from "./cache"

// Remove all TMDB tokens and URLs - everything goes through our proxy now
const API_BASE_URL = '/api/tmdb'
const IMAGE_BASE_URL = '/api/tmdb-image'

// Enhanced fetch with caching and error handling for our proxy
async function cachedFetch(url: string, cacheKey: string, cacheTTL = 600): Promise<any> {
  // Try cache first
  const cached = apiCache.get(cacheKey)
  if (cached) {
    return cached
  }

  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    
    // Cache the successful response
    apiCache.set(cacheKey, data, cacheTTL)
    
    return data
  } catch (error) {
    console.error(`Proxy API error for ${url}:`, error)
    throw error
  }
}

export interface TMDBMovie {
  id: number
  title: string
  overview: string
  release_date: string
  vote_average: number
  poster_path: string | null
  backdrop_path: string | null
  genre_ids: number[]
  runtime?: number
}

export interface TMDBMovieDetails extends TMDBMovie {
  runtime: number
  genres: { id: number; name: string }[]
  credits: {
    cast: { name: string; character: string }[]
    crew: { name: string; job: string }[]
  }
}

export interface TMDBGenre {
  id: number
  name: string
}

// Mock data for when our proxy is not accessible (fallback of fallback)
const mockMovies: TMDBMovie[] = [
  {
    id: 550,
    title: "Fight Club",
    overview: "A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy.",
    release_date: "1999-10-15",
    vote_average: 8.4,
    poster_path: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
    backdrop_path: "/fCayJrkfRaCRCTh8GqN30f8oyQF.jpg",
    genre_ids: [18, 53, 35]
  },
  {
    id: 238,
    title: "The Shawshank Redemption",
    overview: "Framed in the 1940s for the double murder of his wife and her lover, upstanding banker Andy Dufresne begins a new life at the Shawshank prison.",
    release_date: "1994-09-23",
    vote_average: 9.3,
    poster_path: "/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",
    backdrop_path: "/iNh3BivHyg5sQRPP1KOkzguEX0H.jpg",
    genre_ids: [18, 80]
  }
];

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
  { id: 10770, name: "TV Movie" },
  { id: 53, name: "Thriller" },
  { id: 10752, name: "War" },
  { id: 37, name: "Western" }
];

const tmdbProxyFetch = async (endpoint: string) => {
  const cacheKey = `tmdb-proxy:${endpoint}`
  
  try {
    // Use our proxy endpoint instead of direct TMDB API
    const url = `${API_BASE_URL}?path=${encodeURIComponent(endpoint)}`
    return await cachedFetch(url, cacheKey, 600) // 10 minute cache
  } catch (error) {
    console.warn("TMDB Proxy unavailable, using mock data:", error);
    
    // Fallback to mock data when our proxy fails
    if (endpoint.includes("/genre/movie/list")) {
      return { genres: mockGenres };
    } else if (endpoint.includes("/movie/popular") || endpoint.includes("/movie/top_rated") || endpoint.includes("/search/movie") || endpoint.includes("/discover/movie")) {
      return { 
        results: mockMovies,
        total_pages: 1,
        page: 1,
        total_results: mockMovies.length
      };
    } else if (endpoint.includes("/movie/")) {
      return {
        ...mockMovies[0],
        runtime: 139,
        genres: [{ id: 18, name: "Drama" }, { id: 53, name: "Thriller" }],
        credits: {
          cast: [{ name: "Brad Pitt", character: "Tyler Durden" }, { name: "Edward Norton", character: "The Narrator" }],
          crew: [{ name: "David Fincher", job: "Director" }]
        }
      };
    }
    
    return { 
      results: mockMovies, 
      total_pages: 1, 
      page: 1, 
      total_results: mockMovies.length 
    };
  }
}

export const getGenres = async (): Promise<TMDBGenre[]> => {
  const data = await tmdbProxyFetch("/3/genre/movie/list?language=en-US")
  return data.genres
}

export const searchMovies = async (query: string, page = 1): Promise<{ results: TMDBMovie[]; total_pages: number }> => {
  const data = await tmdbProxyFetch(`/3/search/movie?query=${encodeURIComponent(query)}&page=${page}`)
  return data
}

export const getPopularMovies = async (page = 1): Promise<{ results: TMDBMovie[]; total_pages: number }> => {
  const data = await tmdbProxyFetch(`/3/movie/popular?page=${page}`)
  return data
}

export const getTopRatedMovies = async (page = 1): Promise<{ results: TMDBMovie[]; total_pages: number }> => {
  const data = await tmdbProxyFetch(`/3/movie/top_rated?page=${page}`)
  return data
}

export const getMoviesByGenre = async (
  genreId: number,
  page = 1,
): Promise<{ results: TMDBMovie[]; total_pages: number }> => {
  const data = await tmdbProxyFetch(`/3/discover/movie?with_genres=${genreId}&page=${page}&sort_by=popularity.desc`)
  return data
}

export const getMovieDetails = async (movieId: number): Promise<TMDBMovieDetails> => {
  const [movieData, creditsData] = await Promise.all([
    tmdbProxyFetch(`/3/movie/${movieId}`),
    tmdbProxyFetch(`/3/movie/${movieId}/credits`),
  ])

  return {
    ...movieData,
    credits: creditsData,
  }
}

export const discoverMovies = async (params: {
  genres?: number[]
  minRating?: number
  year?: number
  sortBy?: string
  page?: number
  country?: string
  originalLanguage?: string
}): Promise<{ results: TMDBMovie[]; total_pages: number }> => {
  const queryParams = new URLSearchParams()

  if (params.genres && params.genres.length > 0) {
    queryParams.append("with_genres", params.genres.join(","))
  }

  if (params.minRating) {
    queryParams.append("vote_average.gte", params.minRating.toString())
  }

  if (params.year) {
    queryParams.append("year", params.year.toString())
  }

  if (params.country) {
    queryParams.append("with_origin_country", params.country)
  }

  if (params.originalLanguage) {
    queryParams.append("with_original_language", params.originalLanguage)
  }

  queryParams.append("sort_by", params.sortBy || "popularity.desc")
  queryParams.append("page", (params.page || 1).toString())

  const data = await tmdbProxyFetch(`/3/discover/movie?${queryParams.toString()}`)
  return data
}

// Dedicated function for Indian movies
export const getIndianMovies = async (page = 1): Promise<{ results: TMDBMovie[]; total_pages: number }> => {
  return discoverMovies({
    country: "IN",
    sortBy: "popularity.desc",
    page
  })
}

// Alternative function for Hindi movies specifically
export const getHindiMovies = async (page = 1): Promise<{ results: TMDBMovie[]; total_pages: number }> => {
  return discoverMovies({
    originalLanguage: "hi",
    sortBy: "popularity.desc", 
    page
  })
}

// Function for Bollywood movies (combination of Indian origin and Hindi language)
export const getBollywoodMovies = async (page = 1): Promise<{ results: TMDBMovie[]; total_pages: number }> => {
  return discoverMovies({
    country: "IN",
    originalLanguage: "hi",
    sortBy: "popularity.desc",
    page
  })
}

// NEW: Image URL function that uses our proxy
export const getImageUrl = (
  path: string | null,
  size: "w200" | "w300" | "w342" | "w500" | "w780" | "original" = "w500",
): string => {
  if (!path) return "/placeholder.svg?height=750&width=500&text=No+Image"
  // Use our image proxy instead of direct TMDB images
  return `${IMAGE_BASE_URL}?path=${encodeURIComponent(`/t/p/${size}${path}`)}`
}

export const formatRuntime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
}

export const getMovieCredits = async (movieId: number) => {
  const data = await tmdbProxyFetch(`/3/movie/${movieId}/credits`)
  return data
}

export const getMovieVideos = async (movieId: number) => {
  const data = await tmdbProxyFetch(`/3/movie/${movieId}/videos`)
  return data.results.filter((video: any) => video.type === "Trailer" && video.site === "YouTube")
}

export const getSimilarMovies = async (movieId: number, page = 1) => {
  const data = await tmdbProxyFetch(`/3/movie/${movieId}/similar?page=${page}`)
  return data
}

export const getMovieWatchProviders = async (movieId: number) => {
  const data = await tmdbProxyFetch(`/3/movie/${movieId}/watch/providers`)
  return data.results?.US || data.results?.IN || {}
}

export const getMovieRecommendations = async (movieId: number, page = 1) => {
  const data = await tmdbProxyFetch(`/3/movie/${movieId}/recommendations?page=${page}`)
  return data
}