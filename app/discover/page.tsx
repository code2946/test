"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Search, Film, Star, Filter, Play, Bell, ChevronLeft, ChevronRight, Heart, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Suspense } from "react"
import MovieGrid from "@/components/movie-grid"
import { OptimizedImage } from "@/components/optimized-image"
import { ultraFastImageLoader } from "@/lib/ultra-fast-image"
import { AuthModal } from "@/components/lazy-components"
import { supabase, type WatchlistItem } from "@/lib/supabase"
import {
  getGenres,
  searchMovies,
  getPopularMovies,
  getTopRatedMovies,
  discoverMovies,
  getIndianMovies,
  getBollywoodMovies,
  getHindiMovies,
  getImageUrl,
  type TMDBMovie,
  type TMDBGenre,
} from "@/lib/tmdb-supabase"
import { getYear } from "@/lib/date"

export default function MovieRecommender() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedGenres, setSelectedGenres] = useState<number[]>([])
  const [minRating, setMinRating] = useState("0")
  const [sortBy, setSortBy] = useState("popularity.desc")
  const [movies, setMovies] = useState<TMDBMovie[]>([])
  const [genres, setGenres] = useState<TMDBGenre[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [activeTab, setActiveTab] = useState<"popular" | "top-rated" | "search" | "discover" | "indian" | "bollywood" | "hindi">("popular")
  const [selectedCountryFilter, setSelectedCountryFilter] = useState<"all" | "indian" | "bollywood" | "hindi">("all")
  const [featuredMovie, setFeaturedMovie] = useState<TMDBMovie | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([])
  const [authUser, setAuthUser] = useState<any | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const router = useRouter()
  const [missingTable, setMissingTable] = useState(false)

  useEffect(() => {
    const loadGenres = async () => {
      try {
        const genreData = await getGenres()
        setGenres(genreData)
      } catch (error) {
        console.error("Error loading genres:", error)
      }
    }

    loadGenres()
    loadPopularMovies()
  }, [])

  useEffect(() => {
    if (movies.length > 0 && !featuredMovie) {
      setFeaturedMovie(movies[0])
    }
  }, [movies, featuredMovie])

  // Ultra-aggressive preloading for INSTANT navigation
  useEffect(() => {
    if (!featuredMovie || movies.length === 0) return

    const currentIndex = movies.findIndex((m) => m.id === featuredMovie.id)
    if (currentIndex === -1) return

    // INSTANT LOADING STRATEGY:
    // 1. Preload EVERYTHING immediately for instant switching
    const allUrls = []
    
    movies.forEach(movie => {
      // Multiple sizes for different use cases
      if (movie.poster_path) {
        allUrls.push(
          getImageUrl(movie.poster_path, "w185"), // Thumbnail
          getImageUrl(movie.poster_path, "w342"), // Main size
          getImageUrl(movie.poster_path, "w500")  // High quality
        )
      }
      if (movie.backdrop_path) {
        allUrls.push(
          getImageUrl(movie.backdrop_path, "w780"),  // Main background
          getImageUrl(movie.backdrop_path, "w1280") // High quality background
        )
      }
    })

    // Remove duplicates and filter out null values
    const uniqueUrls = [...new Set(allUrls)].filter(Boolean) as string[]

    // IMMEDIATE preload for next/prev (highest priority)
    const immediateUrls = []
    for (let i = -1; i <= 1; i++) {
      const index = (currentIndex + i + movies.length) % movies.length
      const movie = movies[index]
      if (movie?.poster_path) {
        immediateUrls.push(getImageUrl(movie.poster_path, "w342"))
      }
      if (movie?.backdrop_path) {
        immediateUrls.push(getImageUrl(movie.backdrop_path, "w780"))
      }
    }

    // Load immediate images first
    ultraFastImageLoader.preloadImages(immediateUrls)

    // Then load everything else in chunks for instant switching
    const remainingUrls = uniqueUrls.filter(url => !immediateUrls.includes(url))
    
    // Process in small batches to avoid blocking
    let batchIndex = 0
    const batchSize = 8
    const loadNextBatch = () => {
      const batch = remainingUrls.slice(batchIndex, batchIndex + batchSize)
      if (batch.length > 0) {
        ultraFastImageLoader.preloadImages(batch)
        batchIndex += batchSize
        
        // Continue loading next batch after a tiny delay
        setTimeout(loadNextBatch, 10)
      }
    }
    
    // Start batch loading after immediate images
    setTimeout(loadNextBatch, 50)

  }, [featuredMovie, movies])

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthUser(session?.user ?? null)
      if (session?.user) {
        loadUserWatchlist(session.user.id)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null)
      if (session?.user) {
        loadUserWatchlist(session.user.id)
      } else {
        setWatchlist([])
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadUserWatchlist = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("watchlist")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (error) {
        if (error.code === "42P01") {
          // table missing
          setMissingTable(true)
          console.warn(
            "The watchlist table is missing – run scripts/create-watchlist-table.sql in your Supabase project.",
          )
          return
        }
        throw error
      }

      setWatchlist(data ?? [])
    } catch (err) {
      console.error("Unexpected error loading watchlist:", err)
    }
  }

  // Memoized movie functions to prevent recreation on every render  
  const loadPopularMovies = useCallback(async (page = 1) => {
    setIsLoading(true)
    try {
      const data = await getPopularMovies(page)
      setMovies(data.results)
      setTotalPages(data.total_pages)
      setCurrentPage(page)
      setActiveTab("popular")
      if (page === 1) setFeaturedMovie(data.results[0])
    } catch (error) {
      console.error("Error loading popular movies:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadTopRatedMovies = useCallback(async (page = 1) => {
    setIsLoading(true)
    try {
      const data = await getTopRatedMovies(page)
      setMovies(data.results)
      setTotalPages(data.total_pages)
      setCurrentPage(page)
      setActiveTab("top-rated")
      if (page === 1) setFeaturedMovie(data.results[0])
    } catch (error) {
      console.error("Error loading top rated movies:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadIndianMovies = async (page = 1) => {
    setIsLoading(true)
    try {
      const data = await getIndianMovies(page)
      setMovies(data.results)
      setTotalPages(data.total_pages)
      setCurrentPage(page)
      setActiveTab("indian")
      if (page === 1) setFeaturedMovie(data.results[0])
    } catch (error) {
      console.error("Error loading Indian movies:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadBollywoodMovies = async (page = 1) => {
    setIsLoading(true)
    try {
      const data = await getBollywoodMovies(page)
      setMovies(data.results)
      setTotalPages(data.total_pages)
      setCurrentPage(page)
      setActiveTab("bollywood")
      if (page === 1) setFeaturedMovie(data.results[0])
    } catch (error) {
      console.error("Error loading Bollywood movies:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadHindiMovies = async (page = 1) => {
    setIsLoading(true)
    try {
      const data = await getHindiMovies(page)
      setMovies(data.results)
      setTotalPages(data.total_pages)
      setCurrentPage(page)
      setActiveTab("hindi")
      if (page === 1) setFeaturedMovie(data.results[0])
    } catch (error) {
      console.error("Error loading Hindi movies:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = useCallback(async (page = 1) => {
    if (!searchQuery.trim()) return

    setIsLoading(true)
    try {
      const data = await searchMovies(searchQuery, page)
      setMovies(data.results)
      setTotalPages(data.total_pages)
      setCurrentPage(page)
      setActiveTab("search")
      if (page === 1 && data.results.length > 0) setFeaturedMovie(data.results[0])
    } catch (error) {
      console.error("Error searching movies:", error)
    } finally {
      setIsLoading(false)
    }
  }, [searchQuery])

  const handleDiscover = useCallback(async (page = 1) => {
    setIsLoading(true)
    try {
      const params: any = {
        genres: selectedGenres.length > 0 ? selectedGenres : undefined,
        minRating: Number.parseFloat(minRating) || undefined,
        sortBy,
        page,
      }
      
      if (selectedCountryFilter === "indian") {
        params.country = "IN"
      } else if (selectedCountryFilter === "bollywood") {
        params.country = "IN"
        params.originalLanguage = "hi"
      } else if (selectedCountryFilter === "hindi") {
        params.originalLanguage = "hi"
      }

      const data = await discoverMovies(params)
      setMovies(data.results)
      setTotalPages(data.total_pages)
      setCurrentPage(page)
      setActiveTab("discover")
      if (page === 1 && data.results.length > 0) setFeaturedMovie(data.results[0])
    } catch (error) {
      console.error("Error discovering movies:", error)
    } finally {
      setIsLoading(false)
    }
  }, [selectedGenres, minRating, sortBy, selectedCountryFilter])

  const handleGenreChange = (genreId: number, checked: boolean) => {
    if (checked) {
      setSelectedGenres([...selectedGenres, genreId])
    } else {
      setSelectedGenres(selectedGenres.filter((id) => id !== genreId))
    }
  }

  const getMovieGenres = (genreIds: number[]) => {
    return genreIds.map((id) => genres.find((g) => g.id === id)?.name).filter(Boolean)
  }

  const handlePageChange = (page: number) => {
    switch (activeTab) {
      case "popular":
        loadPopularMovies(page)
        break
      case "top-rated":
        loadTopRatedMovies(page)
        break
      case "search":
        handleSearch(page)
        break
      case "discover":
        handleDiscover(page)
        break
      case "indian":
        loadIndianMovies(page)
        break
      case "bollywood":
        loadBollywoodMovies(page)
        break
      case "hindi":
        loadHindiMovies(page)
        break
    }
  }

  /**
   * Add a movie to the authenticated user's watchlist in Supabase with optimistic updates
   */
  const addToWatchlist = useCallback(async (movie: TMDBMovie) => {
    if (!authUser) {
      setShowAuthModal(true)
      return
    }

    // Check if already in watchlist locally
    if (isInWatchlist(movie.id.toString())) {
      return
    }

    const watchlistItem = {
      id: crypto.randomUUID(), // Temporary ID for optimistic update
      user_id: authUser.id,
      movie_id: movie.id.toString(),
      title: movie.title,
      poster_url: getImageUrl(movie.poster_path),
      created_at: new Date().toISOString(),
    }

    // Optimistic update - add immediately to UI
    setWatchlist((prev) => [watchlistItem, ...prev])

    try {
      const { data, error } = await supabase.from("watchlist").insert([{
        user_id: watchlistItem.user_id,
        movie_id: watchlistItem.movie_id,
        title: watchlistItem.title,
        poster_url: watchlistItem.poster_url,
      }]).select()

      if (error) {
        // Revert optimistic update on error
        setWatchlist((prev) => prev.filter((item) => item.movie_id !== movie.id.toString()))

        // Handle specific error cases
        if (error.code === "42P01") {
          alert("Watchlist table doesn't exist. Please run the SQL script in your Supabase project.")
          return
        }

        if (error.code === "23505") {
          // Movie already exists, just remove from UI
          return
        }

        throw error
      }

      // Replace temporary item with real data from database
      if (data && data.length > 0) {
        setWatchlist((prev) => prev.map((item) => 
          item.movie_id === movie.id.toString() && item.id === watchlistItem.id 
            ? data[0] 
            : item
        ))
      }
    } catch (error) {
      console.error("Error adding to watchlist:", error)
      alert("Failed to add movie to watchlist. Please try again.")
    }
  }, [authUser])

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
        console.error("Supabase delete error:", error)
        throw error
      }
    } catch (error) {
      console.error("Error removing from watchlist:", error)
      alert("Failed to remove movie from watchlist")
    }
  }, [authUser, watchlist])

  // Memoized watchlist lookup for O(1) performance
  const watchlistMovieIds = useMemo(() => 
    new Set(watchlist.map(item => item.movie_id)), 
    [watchlist]
  )

  const isInWatchlist = useCallback((movieId: string) => {
    return watchlistMovieIds.has(movieId)
  }, [watchlistMovieIds])


  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  const handleAuthSuccess = () => {
    // User state will be updated by the auth state change listener
  }

  if (missingTable) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-8">
        <h1 className="text-2xl font-bold mb-4">Watchlist table not found</h1>
        <p className="text-gray-400 max-w-md text-center mb-6">
          Your database doesn&apos;t have the <code className="text-yellow-500">watchlist</code> table yet. Please open
          Supabase&nbsp;→ SQL editor and run the migration script located at
          <code className="text-yellow-500"> scripts/create-watchlist-table.sql</code> in this repo, then reload this
          page.
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

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-black/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
                <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                  <span className="text-black font-bold text-xl">S</span>
                </div>
                <span className="text-xl font-bold">ScreenOnFire</span>
              </div>

              <nav className="hidden md:flex items-center gap-6">
                <Button variant="ghost" onClick={() => loadPopularMovies()} className="text-gray-300 hover:text-white">
                  Popular
                </Button>
                <Button variant="ghost" onClick={() => loadTopRatedMovies()} className="text-gray-300 hover:text-white">
                  Top Rated
                </Button>
                <Button variant="ghost" onClick={() => loadIndianMovies()} className="text-gray-300 hover:text-white">
                  🇮🇳 Indianise
                </Button>
                {authUser && (
                  <Button
                    variant="ghost"
                    onClick={() => router.push("/watchlist")}
                    className="text-gray-300 hover:text-white"
                  >
                    My Watchlist ({watchlist.length})
                  </Button>
                )}
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search movies, shows..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-10 w-80 bg-gray-900 border-gray-700 text-white placeholder-gray-400 focus:border-yellow-500"
                />
              </div>
              <Button size="icon" variant="ghost" className="text-gray-400 hover:text-white">
                <Bell className="h-5 w-5" />
              </Button>

              {authUser ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-300 hidden sm:block">
                    {authUser.user_metadata?.full_name || authUser.email}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleSignOut}
                    className="text-gray-400 hover:text-white"
                  >
                    <LogOut className="h-5 w-5" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setShowAuthModal(true)}
                  className="border-gray-700 text-white bg-gray-800"
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      {featuredMovie && (
        <section className="relative h-[70vh] overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${getImageUrl(featuredMovie.backdrop_path, "w780")})`,
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 h-full flex items-center">
            <div className="w-full">
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    const currentIndex = movies.findIndex((m) => m.id === featuredMovie?.id) || 0
                    const prevIndex = currentIndex > 0 ? currentIndex - 1 : movies.length - 1
                    setFeaturedMovie(movies[prevIndex])
                  }}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-20 text-white hover:bg-white/20 h-12 w-12 rounded-full"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    const currentIndex = movies.findIndex((m) => m.id === featuredMovie?.id) || 0
                    const nextIndex = currentIndex < movies.length - 1 ? currentIndex + 1 : 0
                    setFeaturedMovie(movies[nextIndex])
                  }}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-20 text-white hover:bg-white/20 h-12 w-12 rounded-full"
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>

                <div className="mx-16">
                  <div className="grid lg:grid-cols-2 gap-8 items-center min-h-[400px]">
                    <div className="order-2 lg:order-1 space-y-6">
                      <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold leading-tight break-words">
                        {featuredMovie.title}
                      </h1>

                      <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                          <span className="text-lg font-semibold">{featuredMovie.vote_average.toFixed(1)}</span>
                        </div>
                        <span className="text-lg">{getYear(featuredMovie.release_date)}</span>
                        <Badge className="bg-yellow-500 text-black font-semibold">
                          Trending #{(movies.findIndex((m) => m.id === featuredMovie?.id) || 0) + 1}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {getMovieGenres(featuredMovie.genre_ids)
                          .slice(0, 3)
                          .map((genre) => (
                            <Badge key={genre} variant="outline" className="border-gray-600 text-gray-300">
                              {genre}
                            </Badge>
                          ))}
                      </div>

                      <p className="text-sm sm:text-base lg:text-lg text-gray-300 leading-relaxed line-clamp-4">
                        {featuredMovie.overview}
                      </p>

                      <div className="flex flex-col sm:flex-row gap-4">
                        <Button
                          size="lg"
                          className="bg-white text-black hover:bg-gray-200 font-semibold"
                          onClick={() => {
                            window.open(
                              `https://www.youtube.com/results?search_query=${encodeURIComponent(featuredMovie.title + " trailer")}`,
                              "_blank",
                            )
                          }}
                        >
                          <Play className="h-5 w-5 mr-2" />
                          Watch Trailer
                        </Button>
                        <Button
                          size="lg"
                          variant="outline"
                          className="border-gray-600 text-white hover:bg-gray-800 bg-transparent"
                          onClick={() => addToWatchlist(featuredMovie)}
                          disabled={isInWatchlist(featuredMovie.id.toString())}
                        >
                          <Heart
                            className={`h-5 w-5 mr-2 transition-all duration-300 ${
                              isInWatchlist(featuredMovie.id.toString()) ? "fill-current text-red-500" : ""
                            }`}
                          />
                          {isInWatchlist(featuredMovie.id.toString()) ? "In Watchlist" : "Add to Watchlist"}
                        </Button>
                      </div>
                    </div>

                    <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
                      <div className="relative group">
                        <div className="w-48 sm:w-56 md:w-64 lg:w-72 xl:w-80 aspect-[2/3] rounded-lg overflow-hidden shadow-2xl transform transition-transform duration-500 group-hover:scale-105">
                          <OptimizedImage
                            src={getImageUrl(featuredMovie.poster_path, "w342") || "/placeholder.svg"}
                            alt={featuredMovie.title}
                            className="w-full h-full object-cover"
                            priority={true}
                            width={320}
                            height={480}
                            blur={false}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </div>

                        <div className="absolute -top-3 -right-3 bg-yellow-500 text-black rounded-full w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 flex items-center justify-center font-bold text-sm sm:text-base lg:text-lg shadow-lg">
                          {featuredMovie.vote_average.toFixed(1)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">
            {activeTab === "popular" && "Popular Movies"}
            {activeTab === "top-rated" && "Top Rated Movies"}
            {activeTab === "search" && `Search Results for "${searchQuery}"`}
            {activeTab === "discover" && "Discover Movies"}
            {activeTab === "indian" && "🇮🇳 Indianise"}
            {activeTab === "bollywood" && "🎬 Bollywood Movies"}
            {activeTab === "hindi" && "🗣️ Hindi Movies"}
          </h2>

          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="border-gray-700 text-white bg-gray-800"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <Card className="bg-gray-900 border-gray-800 mb-8">
            <CardContent className="p-6">
              <div className="grid md:grid-cols-5 gap-6">
                <div>
                  <label className="text-sm font-medium mb-3 block text-gray-300">Genres</label>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                    {genres.slice(0, 8).map((genre) => (
                      <div key={genre.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`genre-${genre.id}`}
                          checked={selectedGenres.includes(genre.id)}
                          onCheckedChange={(checked) => handleGenreChange(genre.id, checked as boolean)}
                        />
                        <label htmlFor={`genre-${genre.id}`} className="text-sm text-gray-300">
                          {genre.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block text-gray-300">Minimum Rating</label>
                  <Select value={minRating} onValueChange={setMinRating}>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="0">Any Rating</SelectItem>
                      <SelectItem value="6">6.0+ Good</SelectItem>
                      <SelectItem value="7">7.0+ Great</SelectItem>
                      <SelectItem value="8">8.0+ Excellent</SelectItem>
                      <SelectItem value="9">9.0+ Masterpiece</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block text-gray-300">Country/Language</label>
                  <Select value={selectedCountryFilter} onValueChange={(value: "all" | "indian" | "bollywood" | "hindi") => setSelectedCountryFilter(value)}>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="all">All Countries</SelectItem>
                      <SelectItem value="indian">🇮🇳 Indian Movies</SelectItem>
                      <SelectItem value="bollywood">🎬 Bollywood</SelectItem>
                      <SelectItem value="hindi">🗣️ Hindi Language</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block text-gray-300">Sort By</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="popularity.desc">Most Popular</SelectItem>
                      <SelectItem value="vote_average.desc">Highest Rated</SelectItem>
                      <SelectItem value="release_date.desc">Newest First</SelectItem>
                      <SelectItem value="release_date.asc">Oldest First</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button
                    onClick={() => handleDiscover()}
                    className="w-full bg-yellow-500 text-black hover:bg-yellow-600"
                    disabled={isLoading}
                  >
                    {isLoading ? "Discovering..." : "Apply Filters"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Movies Grid */}
        <MovieGrid
          movies={movies}
          isLoading={isLoading}
          isInWatchlist={isInWatchlist}
          onAddToWatchlist={addToWatchlist}
          onRemoveFromWatchlist={removeFromWatchlist}
          onLoadMovies={loadPopularMovies}
        />

        {/* Pagination */}
        {movies.length > 0 && totalPages > 1 && (
          <div className="flex justify-center items-center gap-4">
            <Button
              variant="outline"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="border-gray-700 text-white hover:bg-gray-800"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            <span className="text-gray-400">
              Page {currentPage} of {totalPages}
            </span>

            <Button
              variant="outline"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="border-gray-700 text-white hover:bg-gray-800"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </div>

      <Suspense fallback={<div />}>
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onAuthSuccess={handleAuthSuccess} />
      </Suspense>
    </div>
  )
}
