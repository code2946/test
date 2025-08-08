import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase, type WatchlistItem } from '@/lib/supabase'
import { type TMDBMovieDetails, getMovieDetails } from '@/lib/tmdb-supabase'

interface WatchlistItemWithDetails extends WatchlistItem {
  movieDetails?: TMDBMovieDetails
  isLoadingDetails?: boolean
}

// Global cache for movie details across the app
const movieDetailsCache = new Map<string, TMDBMovieDetails>()
const loadingCache = new Set<string>()

export function useWatchlist(userId?: string) {
  const [watchlist, setWatchlist] = useState<WatchlistItemWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Memoized watchlist lookup for O(1) performance
  const watchlistMovieIds = useMemo(() => 
    new Set(watchlist.map(item => item.movie_id)), 
    [watchlist]
  )

  const isInWatchlist = useCallback((movieId: string) => {
    return watchlistMovieIds.has(movieId)
  }, [watchlistMovieIds])

  // Load watchlist with immediate display and background detail fetching
  const loadWatchlist = useCallback(async (userIdParam?: string) => {
    const targetUserId = userIdParam || userId
    if (!targetUserId) return

    try {
      setIsLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('watchlist')
        .select('*')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false })

      if (fetchError) {
        if (fetchError.code === '42P01') {
          setError('Watchlist table not found. Please run the database migration.')
          return
        }
        throw fetchError
      }

      // Show watchlist immediately with cached data
      const initialWatchlist = (data || []).map(item => {
        const cachedDetails = movieDetailsCache.get(item.movie_id)
        return {
          ...item,
          movieDetails: cachedDetails,
          isLoadingDetails: !cachedDetails && !loadingCache.has(item.movie_id)
        }
      })
      
      setWatchlist(initialWatchlist)
      setIsLoading(false)

      // Load missing movie details in background with batching
      loadMissingMovieDetails(data || [])
    } catch (err) {
      console.error('Error loading watchlist:', err)
      setError('Failed to load watchlist')
      setIsLoading(false)
    }
  }, [userId])

  // Optimized background loading with controlled concurrency
  const loadMissingMovieDetails = useCallback(async (items: WatchlistItem[]) => {
    const itemsNeedingDetails = items.filter(item => 
      !movieDetailsCache.has(item.movie_id) && !loadingCache.has(item.movie_id)
    )

    const concurrencyLimit = 3
    for (let i = 0; i < itemsNeedingDetails.length; i += concurrencyLimit) {
      const batch = itemsNeedingDetails.slice(i, i + concurrencyLimit)
      
      await Promise.all(
        batch.map(async (item) => {
          const movieId = item.movie_id
          loadingCache.add(movieId)
          
          try {
            const movieDetails = await getMovieDetails(Number(movieId))
            movieDetailsCache.set(movieId, movieDetails)
            
            // Update specific item with details
            setWatchlist(prev => prev.map(watchlistItem => 
              watchlistItem.movie_id === movieId 
                ? { ...watchlistItem, movieDetails, isLoadingDetails: false }
                : watchlistItem
            ))
          } catch (error) {
            console.error(`Error fetching details for movie ${movieId}:`, error)
          } finally {
            loadingCache.delete(movieId)
          }
        })
      )
      
      // Small delay between batches for rate limiting
      if (i + concurrencyLimit < itemsNeedingDetails.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }
  }, [])

  // Optimistic add with immediate UI update
  const addToWatchlist = useCallback(async (movieData: {
    id: number
    title: string
    poster_path: string | null
  }) => {
    if (!userId) return false

    const movieId = movieData.id.toString()
    
    if (isInWatchlist(movieId)) {
      return false // Already in watchlist
    }

    const optimisticItem: WatchlistItemWithDetails = {
      id: crypto.randomUUID(),
      user_id: userId,
      movie_id: movieId,
      title: movieData.title,
      poster_url: movieData.poster_path ? `https://image.tmdb.org/t/p/w500${movieData.poster_path}` : null,
      created_at: new Date().toISOString(),
    }

    // Optimistic update
    setWatchlist(prev => [optimisticItem, ...prev])

    try {
      const { data, error } = await supabase
        .from('watchlist')
        .insert([{
          user_id: userId,
          movie_id: movieId,
          title: movieData.title,
          poster_url: optimisticItem.poster_url,
        }])
        .select()

      if (error) {
        // Revert optimistic update
        setWatchlist(prev => prev.filter(item => item.id !== optimisticItem.id))
        
        if (error.code === '23505') {
          // Duplicate - silently ignore
          return false
        }
        throw error
      }

      // Replace optimistic item with real data
      if (data?.[0]) {
        setWatchlist(prev => prev.map(item => 
          item.id === optimisticItem.id ? data[0] : item
        ))
      }

      return true
    } catch (error) {
      console.error('Error adding to watchlist:', error)
      return false
    }
  }, [userId, isInWatchlist])

  // Optimistic remove with immediate UI update
  const removeFromWatchlist = useCallback(async (movieId: string) => {
    if (!userId) return false

    // Store previous state for rollback
    const previousWatchlist = watchlist
    
    // Optimistic update
    setWatchlist(prev => prev.filter(item => item.movie_id !== movieId))

    try {
      const { error } = await supabase
        .from('watchlist')
        .delete()
        .eq('user_id', userId)
        .eq('movie_id', movieId)

      if (error) {
        // Revert on error
        setWatchlist(previousWatchlist)
        throw error
      }

      return true
    } catch (error) {
      console.error('Error removing from watchlist:', error)
      return false
    }
  }, [userId, watchlist])

  // Load watchlist on mount and user change
  useEffect(() => {
    if (userId) {
      loadWatchlist()
    } else {
      setWatchlist([])
      setIsLoading(false)
    }
  }, [userId, loadWatchlist])

  return {
    watchlist,
    isLoading,
    error,
    isInWatchlist,
    addToWatchlist,
    removeFromWatchlist,
    refetch: loadWatchlist,
    count: watchlist.length
  }
}