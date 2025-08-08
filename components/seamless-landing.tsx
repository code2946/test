"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Search, Film, Star, Filter, Play, Bell, ChevronLeft, ChevronRight, Heart, LogOut, Zap, TrendingUp, Lock, Sparkles, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { AuthModal } from "@/components/auth-modal"
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

export default function SeamlessLanding() {
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
  const [featuredMovie, setFeaturedMovie] = useState<TMDBMovie | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([])
  const [authUser, setAuthUser] = useState<any | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [hasScrolledToMovies, setHasScrolledToMovies] = useState(false)
  const router = useRouter()

  // Memoized watchlist lookup for O(1) performance
  const watchlistMovieIds = useMemo(() => 
    new Set(watchlist.map(item => item.movie_id)), 
    [watchlist]
  )

  const isInWatchlist = useCallback((movieId: string) => {
    return watchlistMovieIds.has(movieId)
  }, [watchlistMovieIds])

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
  }, [])

  useEffect(() => {
    if (movies.length > 0 && !featuredMovie) {
      setFeaturedMovie(movies[0])
    }
  }, [movies, featuredMovie])

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
          console.warn("The watchlist table is missing – run scripts/create-watchlist-table.sql")
          return
        }
        throw error
      }

      setWatchlist(data ?? [])
    } catch (err) {
      console.error("Error loading watchlist:", err)
    }
  }

  const loadPopularMovies = async (page = 1) => {
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
  }

  const handleExploreMovies = () => {
    if (!hasScrolledToMovies) {
      loadPopularMovies()
      setHasScrolledToMovies(true)
    }
    document.getElementById('movies')?.scrollIntoView({ behavior: 'smooth' })
  }

  const addToWatchlist = useCallback(async (movie: TMDBMovie) => {
    if (!authUser) {
      setShowAuthModal(true)
      return
    }

    if (isInWatchlist(movie.id.toString())) {
      return
    }

    const optimisticItem = {
      id: crypto.randomUUID(),
      user_id: authUser.id,
      movie_id: movie.id.toString(),
      title: movie.title,
      poster_url: getImageUrl(movie.poster_path),
      created_at: new Date().toISOString(),
    }

    // Optimistic update
    setWatchlist((prev) => [optimisticItem, ...prev])

    try {
      const { data, error } = await supabase.from("watchlist").insert([{
        user_id: optimisticItem.user_id,
        movie_id: optimisticItem.movie_id,
        title: optimisticItem.title,
        poster_url: optimisticItem.poster_url,
      }]).select()

      if (error) {
        // Revert optimistic update
        setWatchlist((prev) => prev.filter((item) => item.movie_id !== movie.id.toString()))
        
        if (error.code === "23505") {
          return
        }
        throw error
      }

      // Replace optimistic item with real data
      if (data?.[0]) {
        setWatchlist((prev) => prev.map((item) => 
          item.id === optimisticItem.id ? data[0] : item
        ))
      }
    } catch (error) {
      console.error("Error adding to watchlist:", error)
    }
  }, [authUser, isInWatchlist])

  const removeFromWatchlist = useCallback(async (movieId: string) => {
    if (!authUser) return

    const previousWatchlist = watchlist
    setWatchlist((prev) => prev.filter((item) => item.movie_id !== movieId))

    try {
      const { error } = await supabase.from("watchlist").delete().eq("user_id", authUser.id).eq("movie_id", movieId)

      if (error) {
        setWatchlist(previousWatchlist)
        throw error
      }
    } catch (error) {
      console.error("Error removing from watchlist:", error)
    }
  }, [authUser, watchlist])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section - Full Viewport */}
      <section className="relative h-screen flex flex-col justify-center items-center overflow-hidden">
        {/* Background with overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?auto=format&fit=crop&w=1950&q=80')"
          }}
        >
          <div className="absolute inset-0 bg-black/75" />
        </div>

        {/* Header */}
        <header className="absolute top-0 w-full z-20 border-b border-gray-800/50 bg-black/20 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                  <span className="text-black font-bold text-xl">S</span>
                </div>
                <span className="text-xl font-bold">ScreenOnFire</span>
              </div>
              
              <nav className="flex items-center gap-6">
                <Button variant="ghost" onClick={handleExploreMovies} className="text-gray-300 hover:text-white">
                  Discover
                </Button>
                {authUser ? (
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      onClick={() => router.push("/watchlist")}
                      className="text-gray-300 hover:text-white"
                    >
                      Watchlist ({watchlist.length})
                    </Button>
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
                    className="border-gray-700 text-white bg-gray-800/50"
                  >
                    Sign In
                  </Button>
                )}
              </nav>
            </div>
          </div>
        </header>

        {/* Hero Content */}
        <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
          <Badge className="mb-6 bg-yellow-500/10 text-yellow-500 border-yellow-500/30">
            <Sparkles className="w-4 h-4 mr-1" />
            AI-Powered Movie Discovery
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Let Emotions Guide You —{" "}
            <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
              AI-Picked Movies
            </span>{" "}
            That Move
          </h1>
          
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
            Discover cinematic gems tailored to your taste by intelligent recommendations
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              onClick={handleExploreMovies}
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-8 py-3 text-lg"
            >
              <Play className="w-5 h-5 mr-2" />
              Discover Movies Now
            </Button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search movies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-80 bg-gray-900/50 border-gray-700 text-white placeholder-gray-400 focus:border-yellow-500 backdrop-blur-sm"
              />
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-6 mt-12 max-w-md mx-auto">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-500">50K+</div>
              <div className="text-gray-400 text-sm">Movies</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-500">AI</div>
              <div className="text-gray-400 text-sm">Powered</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-500">24/7</div>
              <div className="text-gray-400 text-sm">Updated</div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleExploreMovies}
            className="text-yellow-500 hover:text-yellow-400"
          >
            <ChevronLeft className="h-6 w-6 rotate-[-90deg]" />
          </Button>
        </div>
      </section>

      {/* Movies Section - Seamless Transition */}
      <section id="movies" className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black">
        <div className="max-w-7xl mx-auto px-4 py-16">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Trending <span className="text-yellow-500">Movies</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Discover what's hot right now, personalized just for you
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <Button 
              variant={activeTab === "popular" ? "default" : "ghost"} 
              onClick={() => { loadPopularMovies(); setActiveTab("popular") }}
              className={activeTab === "popular" ? "bg-yellow-500 text-black" : "text-gray-300 hover:text-white"}
            >
              Popular
            </Button>
            <Button 
              variant={activeTab === "top-rated" ? "default" : "ghost"} 
              onClick={() => setActiveTab("top-rated")}
              className={activeTab === "top-rated" ? "bg-yellow-500 text-black" : "text-gray-300 hover:text-white"}
            >
              Top Rated
            </Button>
            <Button 
              variant={activeTab === "indian" ? "default" : "ghost"} 
              onClick={() => setActiveTab("indian")}
              className={activeTab === "indian" ? "bg-yellow-500 text-black" : "text-gray-300 hover:text-white"}
            >
              🇮🇳 Bollywood
            </Button>
          </div>

          {/* Movies Grid */}
          {isLoading ? (
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
          ) : movies.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {movies.slice(0, 12).map((movie) => (
                <Card
                  key={movie.id}
                  className="bg-gray-900 border-gray-800 hover:border-yellow-500 transition-all duration-300 group cursor-pointer relative"
                  onClick={() => router.push(`/movies/${movie.id}`)}
                >
                  <div className="aspect-[2/3] relative overflow-hidden rounded-t-lg">
                    <img
                      src={getImageUrl(movie.poster_path) || "/placeholder.svg"}
                      alt={movie.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2">
                      <div className="flex items-center gap-1 bg-black/80 rounded px-2 py-1">
                        <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                        <span className="text-xs font-semibold text-white">{movie.vote_average.toFixed(1)}</span>
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (isInWatchlist(movie.id.toString())) {
                          removeFromWatchlist(movie.id.toString())
                        } else {
                          addToWatchlist(movie)
                        }
                      }}
                      className={`absolute top-2 right-2 h-8 w-8 rounded-full transition-all duration-300 ${
                        isInWatchlist(movie.id.toString())
                          ? "bg-red-500/90 hover:bg-red-600 text-white"
                          : "bg-black/60 hover:bg-black/80 text-white hover:text-red-400"
                      }`}
                    >
                      <Heart
                        className={`h-4 w-4 transition-all duration-300 ${
                          isInWatchlist(movie.id.toString()) ? "fill-current scale-110" : ""
                        }`}
                      />
                    </Button>
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-semibold text-sm mb-1 line-clamp-2 text-white">{movie.title}</h3>
                    <p className="text-xs text-gray-400">{getYear(movie.release_date)}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Film className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Ready to discover movies?</h3>
              <Button onClick={loadPopularMovies} className="bg-yellow-500 text-black hover:bg-yellow-600">
                Load Popular Movies
              </Button>
            </div>
          )}

          {/* View More */}
          {movies.length > 0 && (
            <div className="text-center mt-12">
              <Button 
                onClick={() => router.push('/discover')} 
                variant="outline"
                className="border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black"
              >
                View All Movies
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Quick Features */}
      <section className="bg-gray-900 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-gray-800 border-gray-700 text-center">
              <CardContent className="p-6">
                <Zap className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold mb-2">AI Recommendations</h3>
                <p className="text-gray-400 text-sm">Personalized suggestions powered by advanced AI</p>
              </CardContent>
            </Card>
            <Card className="bg-gray-800 border-gray-700 text-center">
              <CardContent className="p-6">
                <Heart className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold mb-2">Smart Watchlists</h3>
                <p className="text-gray-400 text-sm">Never miss a great movie with intelligent tracking</p>
              </CardContent>
            </Card>
            <Card className="bg-gray-800 border-gray-700 text-center">
              <CardContent className="p-6">
                <Users className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold mb-2">Community</h3>
                <p className="text-gray-400 text-sm">Discuss movies with fellow cinema enthusiasts</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onAuthSuccess={() => {}} />
    </div>
  )
}