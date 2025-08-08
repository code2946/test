"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  Play,
  Plus,
  Check,
  ThumbsUp,
  ThumbsDown,
  Star,
  Clock,
  Calendar,
  ArrowLeft,
  Grid3X3,
  List,
  ExternalLink,
  MessageCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { supabase } from "@/lib/supabase"
import {
  getMovieDetails,
  getMovieCredits,
  getMovieVideos,
  getSimilarMovies,
  getMovieWatchProviders,
  getImageUrl,
  formatRuntime,
  type TMDBMovieDetails,
  type TMDBMovie,
} from "@/lib/tmdb"
import { AiReviewModal } from "@/components/ai-review-modal"
import { DiscussionModal } from "@/components/discussion-modal"
import { Bot } from "lucide-react" // Changed Star to Bot for AI review button
import { getYear } from "@/lib/date"

interface Cast {
  id: number
  name: string
  character: string
  profile_path: string | null
}

interface Crew {
  id: number
  name: string
  job: string
}

interface Video {
  id: string
  key: string
  name: string
  type: string
  site: string
}

interface WatchProvider {
  logo_path: string
  provider_name: string
  provider_id: number
}

interface WatchProviders {
  flatrate?: WatchProvider[]
  rent?: WatchProvider[]
  buy?: WatchProvider[]
}

// Provider URL mapping for popular streaming services
const getProviderURL = (providerId: number, movieTitle: string) => {
  const encodedTitle = encodeURIComponent(movieTitle)
  
  const providerUrls: { [key: number]: string } = {
    8: `https://www.netflix.com/search?q=${encodedTitle}`, // Netflix
    9: `https://www.amazon.com/s?k=${encodedTitle}&i=instant-video`, // Amazon Prime Video
    337: `https://www.disneyplus.com/search?q=${encodedTitle}`, // Disney+
    384: `https://www.hbomax.com/search?q=${encodedTitle}`, // HBO Max
    15: `https://tv.apple.com/search?term=${encodedTitle}`, // Apple TV+
    531: `https://www.paramountplus.com/search?query=${encodedTitle}`, // Paramount+
    386: `https://www.peacocktv.com/search?q=${encodedTitle}`, // Peacock
    387: `https://www.starz.com/search?query=${encodedTitle}`, // Starz
    43: `https://www.crunchyroll.com/search?q=${encodedTitle}`, // Crunchyroll
    2: `https://tv.apple.com/search?term=${encodedTitle}`, // Apple iTunes
    3: `https://play.google.com/store/search?q=${encodedTitle}&c=movies`, // Google Play Movies
    68: `https://www.microsoft.com/en-us/search?q=${encodedTitle}`, // Microsoft Store
    10: `https://www.amazon.com/s?k=${encodedTitle}&i=instant-video`, // Amazon Video
    192: `https://www.youtube.com/results?search_query=${encodedTitle}+movie`, // YouTube
    350: `https://tv.apple.com/search?term=${encodedTitle}`, // Apple TV
  }
  
  return providerUrls[providerId] || `https://www.google.com/search?q=watch+${encodedTitle}+online`
}

export default function MovieDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const movieId = params.id as string

  const [movie, setMovie] = useState<TMDBMovieDetails | null>(null)
  const [cast, setCast] = useState<Cast[]>([])
  const [crew, setCrew] = useState<Crew[]>([])
  const [videos, setVideos] = useState<Video[]>([])
  const [similarMovies, setSimilarMovies] = useState<TMDBMovie[]>([])
  const [watchProviders, setWatchProviders] = useState<WatchProviders>({})
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("watch")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [authUser, setAuthUser] = useState<any | null>(null)
  const [isInWatchlist, setIsInWatchlist] = useState(false)
  const [isSeen, setIsSeen] = useState(false)
  const [likeStatus, setLikeStatus] = useState<boolean | null>(null)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [aiReview, setAiReview] = useState("")
  const [isReviewLoading, setIsReviewLoading] = useState(false)
  const [isDiscussionModalOpen, setIsDiscussionModalOpen] = useState(false)
  const [discussionCount, setDiscussionCount] = useState(0)

  useEffect(() => {
    if (movieId) {
      loadMovieData()
      loadDiscussionCount()
    }
  }, [movieId])

  useEffect(() => {
    // Check authentication
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthUser(session?.user ?? null)
      if (session?.user) {
        checkUserInteractions(session.user.id)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null)
      if (session?.user) {
        checkUserInteractions(session.user.id)
      }
    })

    return () => subscription.unsubscribe()
  }, [movieId])

  const loadMovieData = async () => {
    try {
      setIsLoading(true)
      const [movieData, creditsData, videosData, similarData, providersData] = await Promise.all([
        getMovieDetails(Number(movieId)),
        getMovieCredits(Number(movieId)),
        getMovieVideos(Number(movieId)),
        getSimilarMovies(Number(movieId)),
        getMovieWatchProviders(Number(movieId)),
      ])

      setMovie(movieData)
      setCast(creditsData.cast.slice(0, 20))
      setCrew(creditsData.crew)
      setVideos(videosData)
      setSimilarMovies(similarData.results)
      setWatchProviders(providersData)
    } catch (error) {
      console.error("Error loading movie data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadDiscussionCount = async () => {
    try {
      const response = await fetch(`/api/discussions?movieId=${movieId}`)
      const data = await response.json()
      
      if (data.discussions) {
        // Count total discussions including replies
        const countDiscussions = (discussions: any[]): number => {
          let count = 0
          discussions.forEach(discussion => {
            count += 1 // Count the discussion itself
            if (discussion.replies && discussion.replies.length > 0) {
              count += countDiscussions(discussion.replies) // Count replies recursively
            }
          })
          return count
        }
        
        setDiscussionCount(countDiscussions(data.discussions))
      }
    } catch (error) {
      console.error("Error loading discussion count:", error)
    }
  }

  const checkUserInteractions = async (userId: string) => {
    try {
      // Check watchlist
      const { data: watchlistData } = await supabase
        .from("watchlist")
        .select("id")
        .eq("user_id", userId)
        .eq("movie_id", movieId)
        .single()

      setIsInWatchlist(!!watchlistData)

      // Check seen - simplified query
      const { data: seenData } = await supabase
        .from("seen")
        .select("id")
        .eq("user_id", userId)
        .eq("movie_id", movieId)
        .single()

      setIsSeen(!!seenData)

      // Check like status - check both tables
      const [likeResult, dislikeResult] = await Promise.all([
        supabase
          .from("movie_likes")
          .select("id")
          .eq("user_id", userId)
          .eq("movie_id", movieId)
          .single(),
        supabase
          .from("movie_dislikes")
          .select("id")
          .eq("user_id", userId)
          .eq("movie_id", movieId)
          .single()
      ])

      if (likeResult.data) {
        setLikeStatus(true)
      } else if (dislikeResult.data) {
        setLikeStatus(false)
      } else {
        setLikeStatus(null)
      }
    } catch (error) {
      console.error("Error checking user interactions:", error)
    }
  }

  const toggleWatchlist = async () => {
    if (!authUser || !movie) return

    try {
      if (isInWatchlist) {
        await supabase.from("watchlist").delete().eq("user_id", authUser.id).eq("movie_id", movieId)
        setIsInWatchlist(false)
      } else {
        await supabase.from("watchlist").insert({
          user_id: authUser.id,
          movie_id: movieId,
          title: movie.title,
          poster_url: getImageUrl(movie.poster_path),
        })
        setIsInWatchlist(true)
      }
    } catch (error) {
      console.error("Error toggling watchlist:", error)
    }
  }

  const toggleSeen = async () => {
    if (!authUser || !movie) return

    try {
      if (isSeen) {
        const { error } = await supabase.from("seen").delete().eq("user_id", authUser.id).eq("movie_id", movieId)

        if (error) throw error
        setIsSeen(false)
        console.log("✅ Movie removed from seen list")
      } else {
        const { error } = await supabase.from("seen").insert({
          user_id: authUser.id,
          movie_id: movieId,
        })

        if (error) throw error
        setIsSeen(true)
        console.log("✅ Movie marked as seen")
      }
    } catch (error) {
      console.error("Error toggling seen:", error)
      alert("Failed to update seen status. Please try again.")
    }
  }

  const handleLike = async (isLike: boolean) => {
    if (!authUser) return

    try {
      const newLikeStatus = likeStatus === isLike ? null : isLike

      // First, remove any existing like or dislike
      await Promise.all([
        supabase.from("movie_likes").delete().eq("user_id", authUser.id).eq("movie_id", movieId),
        supabase.from("movie_dislikes").delete().eq("user_id", authUser.id).eq("movie_id", movieId)
      ])

      if (newLikeStatus !== null) {
        // Insert into appropriate table
        if (newLikeStatus) {
          // Like the movie
          const { error } = await supabase.from("movie_likes").insert({
            user_id: authUser.id,
            movie_id: movieId,
            liked: true,
          })
          if (error) throw error
          console.log("✅ Movie liked")
        } else {
          // Dislike the movie
          const { error } = await supabase.from("movie_dislikes").insert({
            user_id: authUser.id,
            movie_id: movieId,
            liked: false,
          })
          if (error) throw error
          console.log("✅ Movie disliked")
        }
      } else {
        console.log("✅ Like/dislike removed")
      }

      setLikeStatus(newLikeStatus)
    } catch (error) {
      console.error("Error handling like:", error)
      alert("Failed to update like status. Please try again.")
    }
  }

  const getDirector = () => {
    return crew.find((person) => person.job === "Director")?.name || "Unknown"
  }

  const getCertification = () => {
    // This would typically come from TMDB release dates endpoint
    return "UA13+" // Placeholder
  }

  const handleAiReview = async () => {
    if (!movie) return
    setIsReviewModalOpen(true)
    setIsReviewLoading(true)
    setAiReview("") // clear previous review
    
    try {
      const response = await fetch("/api/movie-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: movie.title, stream: true }),
      })

      if (!response.ok) throw new Error(await response.text())

      // Handle streaming response
      const reader = response.body?.getReader()
      if (!reader) throw new Error("No response body")

      setIsReviewLoading(false) // Stop showing loading, start showing streaming text
      let accumulatedText = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = new TextDecoder().decode(value)
        const lines = chunk.split('\n')
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              
              if (data.error) {
                throw new Error(data.error)
              }
              
              if (data.text) {
                accumulatedText += data.text
                setAiReview(accumulatedText)
              }
              
              if (data.done) {
                return // Streaming complete
              }
            } catch (parseError) {
              // Ignore malformed JSON chunks
            }
          }
        }
      }
    } catch (error) {
      console.error("AI review error:", error)
      setAiReview("Sorry, I couldn't generate a review right now. Please try again later.")
      setIsReviewLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-96 bg-gray-800 rounded-lg mb-8" />
            <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-2">
                <div className="h-8 bg-gray-800 rounded mb-4" />
                <div className="h-4 bg-gray-800 rounded mb-2" />
                <div className="h-4 bg-gray-800 rounded mb-2" />
              </div>
              <div className="h-64 bg-gray-800 rounded" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Movie not found</h1>
          <Button onClick={() => router.push("/discover")} className="bg-yellow-500 text-black hover:bg-yellow-600">
            Go Home
          </Button>
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
              onClick={() => router.back()}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold truncate">{movie.title}</h1>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{
            backgroundImage: `url(${getImageUrl(movie.backdrop_path, "original")})`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/40" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 py-16">
          <div className="grid lg:grid-cols-3 gap-12 items-start">
            {/* Poster */}
            <div className="lg:col-span-1">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative bg-black/20 backdrop-blur-sm rounded-xl p-2 border border-white/10">
                  <img
                    src={getImageUrl(movie.poster_path, "w780") || "/placeholder.svg"}
                    alt={movie.title}
                    className="w-full rounded-lg shadow-2xl"
                  />
                </div>
              </div>
            </div>

            {/* Movie Info */}
            <div className="lg:col-span-2 space-y-8">
              <div className="space-y-6">
                <div>
                  <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent leading-tight">
                    {movie.title}
                  </h1>
                </div>

                <div className="flex flex-wrap items-center gap-6 text-lg">
                  <div className="flex items-center gap-2 bg-black/30 backdrop-blur-sm rounded-full px-4 py-2 border border-white/10">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <span className="text-xl font-bold text-white">{movie.vote_average.toFixed(1)}</span>
                    <span className="text-gray-300">/10</span>
                  </div>

                  <div className="flex items-center gap-2 bg-black/30 backdrop-blur-sm rounded-full px-4 py-2 border border-white/10">
                    <Calendar className="h-5 w-5 text-gray-300" />
                    <span className="text-white font-medium">{getYear(movie.release_date)}</span>
                  </div>

                  <div className="flex items-center gap-2 bg-black/30 backdrop-blur-sm rounded-full px-4 py-2 border border-white/10">
                    <Clock className="h-5 w-5 text-gray-300" />
                    <span className="text-white font-medium">{formatRuntime(movie.runtime)}</span>
                  </div>

                  <div className="bg-gradient-to-r from-yellow-400/20 to-yellow-600/20 backdrop-blur-sm rounded-full px-4 py-2 border border-yellow-400/30">
                    <span className="text-yellow-300 font-medium">{getCertification()}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  {movie.genres.map((genre) => (
                    <div
                      key={genre.id}
                      className="bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20 hover:bg-white/20 transition-all duration-300"
                    >
                      <span className="text-white font-medium">{genre.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={handleAiReview}
                  className="group relative px-8 py-4 bg-gradient-to-r from-white to-gray-100 text-black font-bold text-lg rounded-xl shadow-2xl hover:shadow-white/20 transform hover:scale-105 transition-all duration-300 border border-white/20"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex items-center gap-3">
                    <Bot className="h-6 w-6" />
                    AI Review
                  </div>
                </button>

                <button
                  onClick={() => setIsDiscussionModalOpen(true)}
                  className="group relative px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold text-lg rounded-xl shadow-2xl hover:shadow-blue-500/20 transform hover:scale-105 transition-all duration-300 border border-blue-400/20"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex items-center gap-3">
                    <MessageCircle className="h-6 w-6" />
                    <span>Discuss</span>
                    {discussionCount > 0 && (
                      <span className="bg-white/20 rounded-full px-2 py-1 text-sm">
                        {discussionCount}
                      </span>
                    )}
                  </div>
                </button>

                <button
                  onClick={toggleWatchlist}
                  className={`group relative px-8 py-4 font-bold text-lg rounded-xl shadow-xl transform hover:scale-105 transition-all duration-300 border ${
                    isInWatchlist
                      ? "bg-gradient-to-r from-yellow-400 to-yellow-500 text-black border-yellow-400/50 shadow-yellow-400/20"
                      : "bg-black/40 backdrop-blur-sm text-white border-white/30 hover:bg-black/60 hover:border-white/50"
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex items-center gap-3">
                    {isInWatchlist ? (
                      <>
                        <Check className="h-6 w-6" />
                        In Watchlist
                      </>
                    ) : (
                      <>
                        <Plus className="h-6 w-6" />
                        Add to Watchlist
                      </>
                    )}
                  </div>
                </button>

                <button
                  onClick={toggleSeen}
                  className={`group relative px-8 py-4 font-bold text-lg rounded-xl shadow-xl transform hover:scale-105 transition-all duration-300 border ${
                    isSeen
                      ? "bg-gradient-to-r from-emerald-400 to-emerald-500 text-black border-emerald-400/50 shadow-emerald-400/20"
                      : "bg-black/40 backdrop-blur-sm text-white border-white/30 hover:bg-black/60 hover:border-white/50"
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex items-center gap-3">
                    {isSeen ? (
                      <>
                        <Check className="h-6 w-6" />
                        Seen
                      </>
                    ) : (
                      <>
                        <Check className="h-6 w-6" />
                        Mark as Seen
                      </>
                    )}
                  </div>
                </button>

                <div className="flex gap-3">
                  <button
                    onClick={() => handleLike(true)}
                    className={`group relative p-4 rounded-xl shadow-xl transform hover:scale-105 transition-all duration-300 border ${
                      likeStatus === true
                        ? "bg-gradient-to-r from-emerald-400 to-emerald-500 text-black border-emerald-400/50 shadow-emerald-400/20"
                        : "bg-black/40 backdrop-blur-sm text-white border-white/30 hover:bg-black/60 hover:border-white/50"
                    }`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <ThumbsUp className="h-6 w-6 relative z-10" />
                  </button>

                  <button
                    onClick={() => handleLike(false)}
                    className={`group relative p-4 rounded-xl shadow-xl transform hover:scale-105 transition-all duration-300 border ${
                      likeStatus === false
                        ? "bg-gradient-to-r from-red-400 to-red-500 text-black border-red-400/50 shadow-red-400/20"
                        : "bg-black/40 backdrop-blur-sm text-white border-white/30 hover:bg-black/60 hover:border-white/50"
                    }`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <ThumbsDown className="h-6 w-6 relative z-10" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content Tabs */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-gray-900 border-gray-800">
            <TabsTrigger value="watch" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black">
              Where to Watch
            </TabsTrigger>
            <TabsTrigger value="synopsis" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black">
              Synopsis
            </TabsTrigger>
            <TabsTrigger value="trailers" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black">
              Trailers
            </TabsTrigger>
            <TabsTrigger value="similar" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black">
              Similar Titles
            </TabsTrigger>
          </TabsList>

          {/* Where to Watch */}
          <TabsContent value="watch" className="mt-8">
            <div className="space-y-6">
              {watchProviders.flatrate && watchProviders.flatrate.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold mb-4">Stream</h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {watchProviders.flatrate.map((provider) => (
                      <Card key={provider.provider_id} className="bg-gray-900 border-gray-800">
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <img
                              src={getImageUrl(provider.logo_path, "w200") || "/placeholder.svg"}
                              alt={provider.provider_name}
                              className="w-12 h-12 rounded-lg"
                            />
                            <div>
                              <p className="font-semibold text-white">{provider.provider_name}</p>
                              <p className="text-sm text-gray-400">Subscription</p>
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            className="bg-yellow-500 text-black hover:bg-yellow-600"
                            onClick={() => window.open(getProviderURL(provider.provider_id, movie.title), '_blank')}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Stream
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {watchProviders.rent && watchProviders.rent.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold mb-4">Rent</h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {watchProviders.rent.map((provider) => (
                      <Card key={provider.provider_id} className="bg-gray-900 border-gray-800">
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <img
                              src={getImageUrl(provider.logo_path, "w200") || "/placeholder.svg"}
                              alt={provider.provider_name}
                              className="w-12 h-12 rounded-lg"
                            />
                            <div>
                              <p className="font-semibold text-white">{provider.provider_name}</p>
                              <p className="text-sm text-gray-400">From $3.99</p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-gray-600 text-white hover:bg-gray-800 bg-transparent"
                            onClick={() => window.open(getProviderURL(provider.provider_id, movie.title), '_blank')}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Rent
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {(!watchProviders.flatrate || watchProviders.flatrate.length === 0) &&
                (!watchProviders.rent || watchProviders.rent.length === 0) && (
                  <div className="text-center py-12">
                    <p className="text-gray-400 text-lg">No streaming options available in your region</p>
                  </div>
                )}
            </div>
          </TabsContent>

          {/* Synopsis */}
          <TabsContent value="synopsis" className="mt-8">
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-semibold mb-4">Overview</h3>
                <p className="text-gray-300 leading-relaxed text-lg">{movie.overview}</p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4">Director</h3>
                <p className="text-gray-300 text-lg">{getDirector()}</p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4">Cast</h3>
                <ScrollArea className="w-full">
                  <div className="flex gap-4 pb-4">
                    {cast.map((actor) => (
                      <Card key={actor.id} className="bg-gray-900 border-gray-800 flex-shrink-0 w-32">
                        <CardContent className="p-3">
                          <div className="aspect-[3/4] mb-3 overflow-hidden rounded-lg">
                            <img
                              src={
                                getImageUrl(actor.profile_path, "w300") ||
                                "/placeholder.svg?height=160&width=120&text=No+Image" ||
                                "/placeholder.svg" ||
                                "/placeholder.svg" ||
                                "/placeholder.svg" ||
                                "/placeholder.svg" ||
                                "/placeholder.svg" ||
                                "/placeholder.svg" ||
                                "/placeholder.svg" ||
                                "/placeholder.svg" ||
                                "/placeholder.svg" ||
                                "/placeholder.svg" ||
                                "/placeholder.svg" ||
                                "/placeholder.svg" ||
                                "/placeholder.svg" ||
                                "/placeholder.svg" ||
                                "/placeholder.svg" ||
                                "/placeholder.svg"
                              }
                              alt={actor.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <h4 className="font-semibold text-sm text-white mb-1 line-clamp-2">{actor.name}</h4>
                          <p className="text-xs text-gray-400 line-clamp-2">{actor.character}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </TabsContent>

          {/* Trailers */}
          <TabsContent value="trailers" className="mt-8">
            <div className="space-y-6">
              {videos.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-6">
                  {videos.slice(0, 4).map((video) => (
                    <Card key={video.id} className="bg-gray-900 border-gray-800 overflow-hidden">
                      <div className="aspect-video relative group cursor-pointer">
                        <img
                          src={`https://img.youtube.com/vi/${video.key}/maxresdefault.jpg`}
                          alt={video.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/60 transition-colors">
                          <Button
                            size="lg"
                            className="bg-red-600 hover:bg-red-700 text-white rounded-full"
                            onClick={() => window.open(`https://www.youtube.com/watch?v=${video.key}`, "_blank")}
                          >
                            <Play className="h-6 w-6" />
                          </Button>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <h4 className="font-semibold text-white line-clamp-2">{video.name}</h4>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-400 text-lg">No trailers available</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Similar Titles */}
          <TabsContent value="similar" className="mt-8">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Similar Movies</h3>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={viewMode === "grid" ? "default" : "outline"}
                    onClick={() => setViewMode("grid")}
                    className={viewMode === "grid" ? "bg-yellow-500 text-black" : "border-gray-600 text-white"}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={viewMode === "list" ? "default" : "outline"}
                    onClick={() => setViewMode("list")}
                    className={viewMode === "list" ? "bg-yellow-500 text-black" : "border-gray-600 text-white"}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {similarMovies.length > 0 ? (
                <div
                  className={viewMode === "grid" ? "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4" : "space-y-4"}
                >
                  {similarMovies.slice(0, 12).map((similarMovie) => (
                    <Card
                      key={similarMovie.id}
                      className={`bg-gray-900 border-gray-800 hover:border-yellow-500 transition-all duration-300 group cursor-pointer ${
                        viewMode === "list" ? "flex" : ""
                      }`}
                      onClick={() => router.push(`/movies/${similarMovie.id}`)}
                    >
                      <div
                        className={`${viewMode === "list" ? "w-24 flex-shrink-0" : "aspect-[2/3]"} relative overflow-hidden rounded-t-lg ${viewMode === "list" ? "rounded-l-lg rounded-tr-none" : ""}`}
                      >
                        <img
                          src={getImageUrl(similarMovie.poster_path) || "/placeholder.svg"}
                          alt={similarMovie.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-2 left-2">
                          <div className="flex items-center gap-1 bg-black/80 rounded px-2 py-1">
                            <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                            <span className="text-xs font-semibold text-white">
                              {similarMovie.vote_average.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <CardContent className={`p-3 ${viewMode === "list" ? "flex-1" : ""}`}>
                        <h4 className="font-semibold text-sm mb-1 line-clamp-2 text-white group-hover:text-yellow-500 transition-colors">
                          {similarMovie.title}
                        </h4>
                        <p className="text-xs text-gray-400">{getYear(similarMovie.release_date)}</p>
                        {viewMode === "list" && (
                          <p className="text-xs text-gray-400 mt-2 line-clamp-3">{similarMovie.overview}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-400 text-lg">No similar movies found</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <AiReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        review={aiReview}
        isLoading={isReviewLoading}
        movieTitle={movie.title}
      />
      <DiscussionModal
        isOpen={isDiscussionModalOpen}
        onClose={() => {
          setIsDiscussionModalOpen(false)
          loadDiscussionCount() // Refresh count when modal closes
        }}
        movieId={movieId}
        movieTitle={movie.title}
        userId={authUser?.id}
      />
    </div>
  )
}
