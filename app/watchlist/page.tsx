"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { supabase, type WatchlistItem } from "@/lib/supabase"
import { ArrowLeft, Trash2, Film, Calendar, Star } from "lucide-react"
import { getMovieDetails, type TMDBMovieDetails } from "@/lib/tmdb-supabase"
import { getYear } from "@/lib/date"

interface WatchlistItemWithDetails extends WatchlistItem {
  movieDetails?: TMDBMovieDetails
  isLoadingDetails?: boolean
}

// In-memory cache for movie details
const movieDetailsCache = new Map<string, TMDBMovieDetails>()
const loadingCache = new Set<string>()

export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState<WatchlistItemWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [authUser, setAuthUser] = useState<any | null>(null)
  const [missingTable, setMissingTable] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check authentication
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        router.push("/")
        return
      }
      setAuthUser(session.user)
      loadWatchlist(session.user.id)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        router.push("/")
        return
      }
      setAuthUser(session.user)
      loadWatchlist(session.user.id)
    })

    return () => subscription.unsubscribe()
  }, [router])

  const loadWatchlist = useCallback(async (userId: string) => {
    try {
      setIsLoading(true)

      const { data, error } = await supabase
        .from("watchlist")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (error) {
        if (error.code === "42P01") {
          setMissingTable(true)
          console.warn("The watchlist table is missing – run scripts/create-tables.sql in your Supabase project.")
          return
        }
        throw error
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

      // Load missing movie details in the background
      loadMissingMovieDetails(data || [])
    } catch (err) {
      console.error("Error loading watchlist:", err)
      setIsLoading(false)
    }
  }, [])

  const loadMissingMovieDetails = useCallback(async (items: WatchlistItem[]) => {
    const itemsNeedingDetails = items.filter(item => 
      !movieDetailsCache.has(item.movie_id) && !loadingCache.has(item.movie_id)
    )

    // Load details with controlled concurrency (max 3 at a time)
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
            
            // Update the specific item in watchlist
            setWatchlist(prev => prev.map(watchlistItem => 
              watchlistItem.movie_id === movieId 
                ? { ...watchlistItem, movieDetails, isLoadingDetails: false }
                : watchlistItem
            ))
          } catch (error) {
            console.error(`Error fetching details for movie ${movieId}:`, error)
            // Remove from loading cache so we can retry later
          } finally {
            loadingCache.delete(movieId)
          }
        })
      )
      
      // Small delay between batches to avoid rate limiting
      if (i + concurrencyLimit < itemsNeedingDetails.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }
  }, [])

  const removeFromWatchlist = useCallback(async (movieId: string) => {
    if (!authUser) return

    // Optimistic update - remove immediately from UI
    const previousWatchlist = watchlist
    setWatchlist((prev) => prev.filter((item) => item.movie_id !== movieId))

    try {
      const { error } = await supabase.from("watchlist").delete().eq("user_id", authUser.id).eq("movie_id", movieId)

      if (error) {
        // Revert on error
        setWatchlist(previousWatchlist)
        throw error
      }
    } catch (error) {
      console.error("Error removing from watchlist:", error)
      alert("Failed to remove movie from watchlist")
    }
  }, [authUser, watchlist])

  if (missingTable) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-8">
        <h1 className="text-2xl font-bold mb-4">Watchlist table not found</h1>
        <p className="text-gray-400 max-w-md text-center mb-6">
          Your database doesn&apos;t have the <code className="text-yellow-500">watchlist</code> table yet. Please open
          Supabase&nbsp;→ SQL editor and run the migration script located at
          <code className="text-yellow-500"> scripts/create-tables.sql</code> in this repo.
        </p>
        <Button
          onClick={() => window.open("https://app.supabase.com/project/_/sql", "_blank")}
          className="bg-yellow-500 text-black hover:bg-yellow-600"
        >
          Open Supabase SQL editor
        </Button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {[...Array(12)].map((_, i) => (
              <Card key={i} className="bg-gray-900 border-gray-800 animate-pulse">
                <div className="aspect-[2/3] bg-gray-700 rounded-t-lg" />
                <CardContent className="p-3">
                  <div className="h-4 bg-gray-700 rounded mb-2" />
                  <div className="h-3 bg-gray-700 rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-black/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/discover")}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">My Watchlist</h1>
              <p className="text-gray-400 text-sm">
                {watchlist.length} {watchlist.length === 1 ? "movie" : "movies"} saved
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {watchlist.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {watchlist.map((item) => (
              <Card
                key={item.id}
                className="bg-gray-900 border-gray-800 hover:border-yellow-500 transition-all duration-300 group cursor-pointer relative"
                onClick={() => router.push(`/movies/${item.movie_id}`)}
              >
                <div className="aspect-[2/3] relative overflow-hidden rounded-t-lg">
                  <img
                    src={item.poster_url || "/placeholder.svg?height=750&width=500&text=No+Image"}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Rating Badge */}
                  {item.movieDetails ? (
                    <div className="absolute top-2 left-2">
                      <div className="flex items-center gap-1 bg-black/80 rounded px-2 py-1">
                        <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                        <span className="text-xs font-semibold text-white">
                          {item.movieDetails.vote_average.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  ) : item.isLoadingDetails ? (
                    <div className="absolute top-2 left-2">
                      <div className="flex items-center gap-1 bg-black/80 rounded px-2 py-1">
                        <div className="h-3 w-8 bg-gray-600 rounded animate-pulse" />
                      </div>
                    </div>
                  ) : null}
                  {/* Remove Button */}
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeFromWatchlist(item.movie_id)
                    }}
                    className="absolute top-2 right-2 h-8 w-8 rounded-full bg-red-500/90 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <CardContent className="p-3">
                  <h3 className="font-semibold text-sm mb-1 line-clamp-2 text-white group-hover:text-yellow-500 transition-colors">
                    {item.title}
                  </h3>
                  <div className="space-y-1">
                    {item.movieDetails ? (
                      <p className="text-xs text-gray-400">
                        {getYear(item.movieDetails.release_date)}
                      </p>
                    ) : item.isLoadingDetails ? (
                      <div className="h-3 w-12 bg-gray-700 rounded animate-pulse" />
                    ) : null}
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      <span>Added {new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-gray-900 border-gray-800 h-96 flex items-center justify-center">
            <CardContent className="text-center">
              <Film className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Your watchlist is empty</h3>
              <p className="text-gray-400 mb-4">
                Start adding movies to your watchlist by clicking the "Add to Watchlist" button on movie cards
              </p>
              <Button onClick={() => router.push("/")} className="bg-yellow-500 text-black hover:bg-yellow-600">
                Browse Movies
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
