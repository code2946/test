"use client"

import { memo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Star, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { OptimizedImage } from "@/components/optimized-image"
import { getImageUrl, type TMDBMovie } from "@/lib/tmdb-supabase"
import { getYear } from "@/lib/date"

interface MovieCardProps {
  movie: TMDBMovie
  isInWatchlist: boolean
  onAddToWatchlist: (movie: TMDBMovie) => void
  onRemoveFromWatchlist: (movieId: string) => void
}

const MovieCard = memo(function MovieCard({
  movie,
  isInWatchlist,
  onAddToWatchlist,
  onRemoveFromWatchlist
}: MovieCardProps) {
  const router = useRouter()

  const handleWatchlistToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (isInWatchlist) {
      onRemoveFromWatchlist(movie.id.toString())
    } else {
      onAddToWatchlist(movie)
    }
  }, [isInWatchlist, onRemoveFromWatchlist, onAddToWatchlist, movie])

  const handleMovieClick = useCallback(() => {
    router.push(`/movies/${movie.id}`)
  }, [router, movie.id])

  return (
    <Card
      className="bg-gray-900 border-gray-800 hover:border-yellow-500 transition-all duration-300 group cursor-pointer relative"
      onClick={handleMovieClick}
    >
      <div className="aspect-[2/3] relative overflow-hidden rounded-t-lg">
        <OptimizedImage
          src={getImageUrl(movie.poster_path, 'w342')}
          alt={`${movie.title} poster`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          placeholder="/placeholder.svg?height=450&width=300&text=Movie+Poster"
          width={300}
          height={450}
          priority={false}
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
          onClick={handleWatchlistToggle}
          className={`absolute top-2 right-2 h-8 w-8 rounded-full transition-all duration-300 ${
            isInWatchlist
              ? "bg-red-500/90 hover:bg-red-600 text-white"
              : "bg-black/60 hover:bg-black/80 text-white hover:text-red-400"
          }`}
        >
          <Heart
            className={`h-4 w-4 transition-all duration-300 ${
              isInWatchlist ? "fill-current scale-110" : ""
            }`}
          />
        </Button>
      </div>
      <CardContent className="p-3">
        <h3 className="font-semibold text-sm mb-1 line-clamp-2 text-white">{movie.title}</h3>
        <p className="text-xs text-gray-400">{getYear(movie.release_date)}</p>
      </CardContent>
    </Card>
  )
})

export default MovieCard