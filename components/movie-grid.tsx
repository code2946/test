"use client"

import { memo } from "react"
import { Film } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import MovieCard from "@/components/movie-card"
import type { TMDBMovie } from "@/lib/tmdb-supabase"

interface MovieGridProps {
  movies: TMDBMovie[]
  isLoading: boolean
  isInWatchlist: (movieId: string) => boolean
  onAddToWatchlist: (movie: TMDBMovie) => void
  onRemoveFromWatchlist: (movieId: string) => void
  onLoadMovies?: () => void
}

const MovieGrid = memo(function MovieGrid({
  movies,
  isLoading,
  isInWatchlist,
  onAddToWatchlist,
  onRemoveFromWatchlist,
  onLoadMovies
}: MovieGridProps) {
  if (isLoading) {
    return (
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
    )
  }

  if (movies.length === 0) {
    return (
      <Card className="bg-gray-900 border-gray-800 h-96 flex items-center justify-center">
        <CardContent className="text-center">
          <Film className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No movies found</h3>
          <p className="text-gray-400 mb-4">Try adjusting your search or filters</p>
          {onLoadMovies && (
            <Button onClick={onLoadMovies} className="bg-yellow-500 text-black hover:bg-yellow-600">
              Load Popular Movies
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
      {movies.map((movie) => (
        <MovieCard
          key={movie.id}
          movie={movie}
          isInWatchlist={isInWatchlist(movie.id.toString())}
          onAddToWatchlist={onAddToWatchlist}
          onRemoveFromWatchlist={onRemoveFromWatchlist}
        />
      ))}
    </div>
  )
})

export default MovieGrid