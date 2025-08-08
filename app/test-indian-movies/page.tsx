"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getIndianMovies, getBollywoodMovies, getHindiMovies } from "@/lib/tmdb"

export default function TestIndianMoviesPage() {
  const [movies, setMovies] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [activeFilter, setActiveFilter] = useState<string>("")

  const testIndianMovies = async () => {
    setLoading(true)
    setActiveFilter("Indian Movies (Country: IN)")
    try {
      const data = await getIndianMovies(1)
      console.log("Indian movies data:", data)
      setMovies(data.results || [])
    } catch (error) {
      console.error("Error fetching Indian movies:", error)
      setMovies([])
    } finally {
      setLoading(false)
    }
  }

  const testBollywoodMovies = async () => {
    setLoading(true)
    setActiveFilter("Bollywood Movies (Country: IN + Language: Hindi)")
    try {
      const data = await getBollywoodMovies(1)
      console.log("Bollywood movies data:", data)
      setMovies(data.results || [])
    } catch (error) {
      console.error("Error fetching Bollywood movies:", error)
      setMovies([])
    } finally {
      setLoading(false)
    }
  }

  const testHindiMovies = async () => {
    setLoading(true)
    setActiveFilter("Hindi Movies (Language: Hindi)")
    try {
      const data = await getHindiMovies(1)
      console.log("Hindi movies data:", data)
      setMovies(data.results || [])
    } catch (error) {
      console.error("Error fetching Hindi movies:", error)
      setMovies([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🇮🇳 Indian Movies Filter Test</h1>
        
        <div className="flex gap-4 mb-8">
          <Button onClick={testIndianMovies} disabled={loading} className="bg-orange-600 hover:bg-orange-700">
            Test Indian Movies
          </Button>
          <Button onClick={testBollywoodMovies} disabled={loading} className="bg-green-600 hover:bg-green-700">
            Test Bollywood Movies
          </Button>
          <Button onClick={testHindiMovies} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
            Test Hindi Movies
          </Button>
        </div>

        {activeFilter && (
          <div className="mb-6 p-4 bg-gray-900 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Current Filter: {activeFilter}</h2>
            <p className="text-gray-400">
              {loading ? "Loading..." : `Found ${movies.length} movies`}
            </p>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
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
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {movies.map((movie) => (
              <Card key={movie.id} className="bg-gray-900 border-gray-800 hover:border-yellow-500 transition-colors">
                <div className="aspect-[2/3] relative overflow-hidden rounded-t-lg">
                  <img
                    src={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : "/placeholder.svg"}
                    alt={movie.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 bg-black/80 rounded px-2 py-1">
                    <span className="text-xs font-semibold text-yellow-400">
                      ⭐ {movie.vote_average?.toFixed(1) || "N/A"}
                    </span>
                  </div>
                </div>
                <CardContent className="p-3">
                  <h3 className="font-semibold text-sm mb-1 line-clamp-2 text-white">{movie.title}</h3>
                  <p className="text-xs text-gray-400 mb-1">
                    {movie.release_date ? new Date(movie.release_date).getFullYear() : "Unknown"}
                  </p>
                  <p className="text-xs text-gray-500">
                    Original: {movie.original_title || movie.title}
                  </p>
                  {movie.origin_country && (
                    <p className="text-xs text-green-400 mt-1">
                      Country: {Array.isArray(movie.origin_country) ? movie.origin_country.join(", ") : movie.origin_country}
                    </p>
                  )}
                  {movie.original_language && (
                    <p className="text-xs text-blue-400">
                      Language: {movie.original_language}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : activeFilter ? (
          <Card className="bg-gray-900 border-gray-800 p-8">
            <CardContent className="text-center">
              <h3 className="text-lg font-medium text-white mb-2">No movies found</h3>
              <p className="text-gray-400">Try a different filter or check your API connection</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-gray-900 border-gray-800 p-8">
            <CardContent className="text-center">
              <h3 className="text-lg font-medium text-white mb-2">Select a filter to test</h3>
              <p className="text-gray-400">Click one of the buttons above to test Indian movie filtering</p>
            </CardContent>
          </Card>
        )}

        <div className="mt-8 p-4 bg-gray-900 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Filter Explanations:</h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li><strong>🇮🇳 Indian Movies:</strong> Movies with origin country = "IN"</li>
            <li><strong>🎬 Bollywood:</strong> Movies from India with original language = Hindi</li>
            <li><strong>🗣️ Hindi Movies:</strong> Movies with original language = "hi" (regardless of country)</li>
          </ul>
        </div>
      </div>
    </div>
  )
}