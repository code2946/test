import { supabaseAdmin } from './supabase-admin'

const TMDB_BASE_URL = "https://api.themoviedb.org/3"
const TMDB_ACCESS_TOKEN = process.env.TMDB_ACCESS_TOKEN
const TMDB_API_KEY = process.env.TMDB_API_KEY

// Sync configuration optimized for Supabase free tier
const SYNC_CONFIG = {
  popular: { pages: 20, category: 'popular' }, // ~400 movies
  top_rated: { pages: 20, category: 'top_rated' }, // ~400 movies
  bollywood: { pages: 25, category: 'bollywood' }, // ~500 movies (Hindi/Indian)
  trending: { pages: 5, category: 'trending' }, // ~100 movies (daily trending)
}

interface TMDBMovie {
  id: number
  title: string
  overview: string
  release_date: string
  vote_average: number
  vote_count: number
  popularity: number
  poster_path: string | null
  backdrop_path: string | null
  original_language: string
  original_title: string
  adult: boolean
  genre_ids: number[]
}

interface SyncResult {
  category: string
  moviesSynced: number
  success: boolean
  error?: string
}

class MovieSyncService {
  private async tmdbFetch(endpoint: string): Promise<any> {
    if (!TMDB_ACCESS_TOKEN && !TMDB_API_KEY) {
      throw new Error('TMDB API credentials not found')
    }

    const url = `${TMDB_BASE_URL}${endpoint}`
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  private async fetchMoviesByCategory(category: string, page: number = 1): Promise<TMDBMovie[]> {
    let endpoint = ''
    
    switch (category) {
      case 'popular':
        endpoint = `/movie/popular?page=${page}`
        break
      case 'top_rated':
        endpoint = `/movie/top_rated?page=${page}`
        break
      case 'trending':
        endpoint = `/trending/movie/day?page=${page}`
        break
      case 'bollywood':
        // Fetch Hindi movies from India
        endpoint = `/discover/movie?with_origin_country=IN&with_original_language=hi&sort_by=popularity.desc&page=${page}`
        break
      default:
        throw new Error(`Unknown category: ${category}`)
    }

    const data = await this.tmdbFetch(endpoint)
    return data.results || []
  }

  private async saveMoviesToDatabase(movies: TMDBMovie[], category: string): Promise<number> {
    if (!movies.length) return 0

    const movieData = movies.map(movie => ({
      id: movie.id,
      title: movie.title.substring(0, 200), // Truncate for DB constraints
      overview: movie.overview,
      release_date: movie.release_date || null,
      vote_average: movie.vote_average,
      vote_count: movie.vote_count,
      popularity: movie.popularity,
      poster_path: movie.poster_path,
      backdrop_path: movie.backdrop_path,
      original_language: movie.original_language,
      original_title: movie.original_title?.substring(0, 200),
      adult: movie.adult,
      category: category,
      region: category === 'bollywood' ? 'IN' : 'US',
    }))

    // Upsert movies (insert or update if exists)
    const { error: movieError } = await supabaseAdmin
      .from('movies')
      .upsert(movieData, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      })

    if (movieError) {
      console.error('Error saving movies:', movieError)
      throw new Error(`Database error: ${movieError.message}`)
    }

    // Save genre associations
    const genreData = movies.flatMap(movie => 
      movie.genre_ids.map(genreId => ({
        movie_id: movie.id,
        genre_id: genreId
      }))
    )

    if (genreData.length > 0) {
      const { error: genreError } = await supabaseAdmin
        .from('movie_genres')
        .upsert(genreData, { 
          onConflict: 'movie_id,genre_id',
          ignoreDuplicates: true 
        })

      if (genreError) {
        console.error('Error saving movie genres:', genreError)
        // Don't throw error here, movies are saved successfully
      }
    }

    return movieData.length
  }

  private async logSyncStart(category: string): Promise<number> {
    const { data, error } = await supabaseAdmin
      .from('movie_sync_log')
      .insert({
        category,
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (error) {
      console.error('Error logging sync start:', error)
      throw new Error(`Failed to log sync start: ${error.message}`)
    }

    return data.id
  }

  private async logSyncComplete(logId: number, moviesSynced: number, success: boolean, errorMessage?: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('movie_sync_log')
      .update({
        movies_synced: moviesSynced,
        completed_at: new Date().toISOString(),
        status: success ? 'completed' : 'failed',
        error_message: errorMessage || null,
        next_sync_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
      })
      .eq('id', logId)

    if (error) {
      console.error('Error logging sync complete:', error)
    }
  }

  async syncCategory(category: keyof typeof SYNC_CONFIG): Promise<SyncResult> {
    console.log(`Starting sync for category: ${category}`)
    
    let logId: number
    let totalSynced = 0

    try {
      logId = await this.logSyncStart(category)
      const config = SYNC_CONFIG[category]

      // Fetch movies from multiple pages
      for (let page = 1; page <= config.pages; page++) {
        console.log(`Fetching page ${page}/${config.pages} for ${category}`)
        
        const movies = await this.fetchMoviesByCategory(category, page)
        if (movies.length === 0) {
          console.log(`No more movies found at page ${page}, stopping`)
          break
        }

        const synced = await this.saveMoviesToDatabase(movies, config.category)
        totalSynced += synced

        // Small delay to respect API rate limits
        await new Promise(resolve => setTimeout(resolve, 250))
      }

      await this.logSyncComplete(logId, totalSynced, true)
      console.log(`Successfully synced ${totalSynced} movies for ${category}`)
      
      return {
        category,
        moviesSynced: totalSynced,
        success: true,
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error(`Sync failed for ${category}:`, errorMessage)
      
      if (logId!) {
        await this.logSyncComplete(logId, totalSynced, false, errorMessage)
      }

      return {
        category,
        moviesSynced: totalSynced,
        success: false,
        error: errorMessage,
      }
    }
  }

  async syncAllCategories(): Promise<SyncResult[]> {
    console.log('Starting full movie sync...')
    const results: SyncResult[] = []

    for (const category of Object.keys(SYNC_CONFIG) as Array<keyof typeof SYNC_CONFIG>) {
      const result = await this.syncCategory(category)
      results.push(result)

      // Small delay between categories
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    const totalMovies = results.reduce((sum, result) => sum + result.moviesSynced, 0)
    const successfulSyncs = results.filter(r => r.success).length
    
    console.log(`Sync completed: ${totalMovies} total movies, ${successfulSyncs}/${results.length} categories successful`)
    
    return results
  }

  async checkSyncStatus(): Promise<Record<string, { needsSync: boolean; lastSync?: Date; nextSync?: Date }>> {
    const { data, error } = await supabaseAdmin
      .from('movie_sync_log')
      .select('category, completed_at, next_sync_at, status')
      .order('started_at', { ascending: false })

    if (error) {
      console.error('Error checking sync status:', error)
      return {}
    }

    const status: Record<string, { needsSync: boolean; lastSync?: Date; nextSync?: Date }> = {}
    
    for (const category of Object.keys(SYNC_CONFIG)) {
      const latestSync = data.find(log => log.category === category && log.status === 'completed')
      const needsSync = !latestSync || new Date(latestSync.next_sync_at) <= new Date()
      
      status[category] = {
        needsSync,
        lastSync: latestSync?.completed_at ? new Date(latestSync.completed_at) : undefined,
        nextSync: latestSync?.next_sync_at ? new Date(latestSync.next_sync_at) : undefined,
      }
    }

    return status
  }

  async syncIfNeeded(): Promise<SyncResult[]> {
    const status = await this.checkSyncStatus()
    const results: SyncResult[] = []

    for (const [category, categoryStatus] of Object.entries(status)) {
      if (categoryStatus.needsSync) {
        console.log(`Category ${category} needs sync`)
        const result = await this.syncCategory(category as keyof typeof SYNC_CONFIG)
        results.push(result)
      } else {
        console.log(`Category ${category} is up to date, next sync: ${categoryStatus.nextSync}`)
      }
    }

    return results
  }
}

export const movieSyncService = new MovieSyncService()

// Export types
export type { SyncResult, TMDBMovie }