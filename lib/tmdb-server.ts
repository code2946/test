// Server-side TMDB functions for Server Components and API routes
// This file contains functions that can ONLY be used on the server side (not in client components)

const TMDB_BASE_URL = "https://api.themoviedb.org/3"
const TMDB_READ_TOKEN = process.env.TMDB_READ_TOKEN

if (!TMDB_READ_TOKEN) {
  console.warn('TMDB_READ_TOKEN environment variable is not set')
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

// Mock data for when TMDB API is not accessible
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
  { id: 35, name: "Comedy" },
  { id: 18, name: "Drama" },
  { id: 27, name: "Horror" },
  { id: 53, name: "Thriller" }
];

// Server-side TMDB fetch with retry logic
async function serverTmdbFetch(endpoint: string, maxRetries = 3): Promise<any> {
  if (!TMDB_READ_TOKEN) {
    console.warn("TMDB_READ_TOKEN not available, using mock data");
    throw new Error("TMDB_READ_TOKEN not configured");
  }

  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(`${TMDB_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${TMDB_READ_TOKEN}`,
          'Accept': 'application/json',
          'User-Agent': 'ScreenOnFire/1.0'
        },
        next: { revalidate: 3600 } // Cache for 1 hour
      });

      if (response.ok) {
        return await response.json();
      }

      // Don't retry client errors (4xx except 429)
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
        break;
      }

      // For 429 or 5xx, wait with exponential backoff
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  console.warn("TMDB API unavailable, using mock data:", lastError);
  throw lastError;
}

// Server-side functions for use in Server Components and API routes
export const serverGetPopularMovies = async (page = 1): Promise<{ results: TMDBMovie[]; total_pages: number }> => {
  try {
    const data = await serverTmdbFetch(`/movie/popular?page=${page}`)
    return data
  } catch (error) {
    console.warn("Using mock data for popular movies:", error);
    return { 
      results: mockMovies,
      total_pages: 1,
      page: 1,
      total_results: mockMovies.length
    };
  }
}

export const serverGetTopRatedMovies = async (page = 1): Promise<{ results: TMDBMovie[]; total_pages: number }> => {
  try {
    const data = await serverTmdbFetch(`/movie/top_rated?page=${page}`)
    return data
  } catch (error) {
    console.warn("Using mock data for top rated movies:", error);
    return { 
      results: mockMovies,
      total_pages: 1,
      page: 1,
      total_results: mockMovies.length
    };
  }
}

export const serverGetMovieDetails = async (movieId: number): Promise<TMDBMovieDetails> => {
  try {
    const [movieData, creditsData] = await Promise.all([
      serverTmdbFetch(`/movie/${movieId}`),
      serverTmdbFetch(`/movie/${movieId}/credits`),
    ])

    return {
      ...movieData,
      credits: creditsData,
    }
  } catch (error) {
    console.warn("Using mock data for movie details:", error);
    return {
      ...mockMovies[0],
      id: movieId,
      runtime: 139,
      genres: [{ id: 18, name: "Drama" }, { id: 53, name: "Thriller" }],
      credits: {
        cast: [{ name: "Brad Pitt", character: "Tyler Durden" }, { name: "Edward Norton", character: "The Narrator" }],
        crew: [{ name: "David Fincher", job: "Director" }]
      }
    };
  }
}

export const serverGetGenres = async (): Promise<TMDBGenre[]> => {
  try {
    const data = await serverTmdbFetch("/genre/movie/list?language=en-US")
    return data.genres
  } catch (error) {
    console.warn("Using mock data for genres:", error);
    return mockGenres;
  }
}

export const serverDiscoverMovies = async (params: {
  genres?: number[]
  minRating?: number
  year?: number
  sortBy?: string
  page?: number
  country?: string
  originalLanguage?: string
}): Promise<{ results: TMDBMovie[]; total_pages: number }> => {
  try {
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

    const data = await serverTmdbFetch(`/discover/movie?${queryParams.toString()}`)
    return data
  } catch (error) {
    console.warn("Using mock data for discover movies:", error);
    return { 
      results: mockMovies,
      total_pages: 1,
      page: 1,
      total_results: mockMovies.length
    };
  }
}

// Image URL helper for server-side use (returns proxy URL)
export const getImageUrl = (
  path: string | null,
  size: "w200" | "w300" | "w500" | "w780" | "original" = "w500",
): string => {
  if (!path) return "/placeholder.svg?height=750&width=500&text=No+Image"
  // Use our image proxy
  return `/api/tmdb-image?path=${encodeURIComponent(`/t/p/${size}${path}`)}`
}

export const formatRuntime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
}