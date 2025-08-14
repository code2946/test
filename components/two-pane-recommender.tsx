'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { X, Search, Loader2, Star, Calendar, Clock, Film } from 'lucide-react'
import { getImageUrl } from '@/lib/tmdb-client'
import { DEFAULT_WEIGHTS, FeatureWeights } from '@/lib/featurize'

interface Movie {
  id: number
  title: string
  poster_path: string | null
  vote_average: number
  release_year: number | null
  genres: string[]
  overview: string
  popularity: number
  runtime: number | null
  directors: string[]
  cast: string[]
  similarity_score?: number
}

interface SearchResult {
  id: number
  title: string
  poster_path: string | null
  release_date: string
  vote_average: number
  overview: string
}

interface TwoPaneRecommenderProps {
  initialSelected?: number[]
  className?: string
}

export default function TwoPaneRecommender({ 
  initialSelected = [], 
  className = "" 
}: TwoPaneRecommenderProps) {
  const [selectedMovies, setSelectedMovies] = useState<Movie[]>([])
  const [selectedIds, setSelectedIds] = useState<number[]>(initialSelected)
  const [recommendations, setRecommendations] = useState<Movie[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isRecommending, setIsRecommending] = useState(false)
  const [weights, setWeights] = useState<FeatureWeights>(DEFAULT_WEIGHTS)
  const [error, setError] = useState<string>('')

  // Debounced search
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (!query.trim()) {
        setSearchResults([])
        return
      }

      setIsSearching(true)
      try {
        const response = await fetch(`/api/tmdb?path=${encodeURIComponent(`/3/search/movie?query=${encodeURIComponent(query)}`)}&page=1`)
        if (!response.ok) {
          throw new Error(`Search failed: ${response.status}`)
        }
        const data = await response.json()
        setSearchResults(data.results?.slice(0, 8) || [])
      } catch (error: any) {
        console.error('Search error:', error?.message || error)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300),
    []
  )

  // Fetch recommendations
  const fetchRecommendations = useCallback(async () => {
    if (selectedIds.length === 0) {
      setRecommendations([])
      return
    }

    setIsRecommending(true)
    setError('')

    try {
      const response = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedIds,
          weights,
          limit: 24,
          excludeSelected: true,
          minSimilarity: 0.05
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`)
      }

      setRecommendations(data.results || [])
      
      if (data.results?.length === 0) {
        setError('No similar movies found. Try selecting different movies or adjusting the weights.')
      }
    } catch (error: any) {
      console.error('Recommendation error:', error)
      setError(error.message || 'Failed to get recommendations')
      setRecommendations([])
    } finally {
      setIsRecommending(false)
    }
  }, [selectedIds, weights])

  // Search effect
  useEffect(() => {
    debouncedSearch(searchQuery)
  }, [searchQuery, debouncedSearch])

  // Recommendations effect
  useEffect(() => {
    fetchRecommendations()
  }, [fetchRecommendations])

  // Add movie to selection
  const addMovie = async (searchResult: SearchResult) => {
    if (selectedIds.includes(searchResult.id)) return
    if (selectedIds.length >= 10) {
      setError('Maximum 10 movies can be selected')
      return
    }

    // Convert search result to movie format
    const movie: Movie = {
      id: searchResult.id,
      title: searchResult.title,
      poster_path: searchResult.poster_path,
      vote_average: searchResult.vote_average,
      release_year: searchResult.release_date ? parseInt(searchResult.release_date.slice(0, 4)) : null,
      genres: [],
      overview: searchResult.overview,
      popularity: 0,
      runtime: null,
      directors: [],
      cast: []
    }

    setSelectedMovies(prev => [...prev, movie])
    setSelectedIds(prev => [...prev, searchResult.id])
    setSearchQuery('')
    setSearchResults([])
    setError('')
  }

  // Remove movie from selection
  const removeMovie = (movieId: number) => {
    setSelectedMovies(prev => prev.filter(m => m.id !== movieId))
    setSelectedIds(prev => prev.filter(id => id !== movieId))
    setError('')
  }

  // Weight adjustment handlers
  const updateWeight = (key: keyof FeatureWeights, value: number) => {
    setWeights(prev => ({ ...prev, [key]: value }))
  }

  const isDisabled = selectedIds.length === 0

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 max-w-7xl mx-auto ${className}`}>
      {/* LEFT: Recommendations */}
      <div className="lg:col-span-8">
        <div className="flex items-center gap-3 mb-4">
          <Film className="h-6 w-6 text-yellow-400" />
          <h2 className="text-2xl font-bold">Recommended Movies</h2>
          {isRecommending && <Loader2 className="h-5 w-5 animate-spin" />}
        </div>

        {error && (
          <Card className="mb-4 border-red-500/20 bg-red-500/5">
            <CardContent className="p-4">
              <p className="text-red-400 text-sm">{error}</p>
            </CardContent>
          </Card>
        )}

        {isDisabled ? (
          <Card className="border-gray-700">
            <CardContent className="p-8 text-center">
              <div className="text-gray-400 space-y-2">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Select your favorite movies on the right to get personalized recommendations.</p>
                <p className="text-sm">Choose movies you love and discover similar ones based on genre, cast, director, and more.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {recommendations.map((movie) => (
              <RecommendationCard key={movie.id} movie={movie} />
            ))}
          </div>
        )}

        {!isDisabled && recommendations.length === 0 && !isRecommending && !error && (
          <Card className="border-gray-700">
            <CardContent className="p-8 text-center">
              <div className="text-gray-400">
                <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin" />
                <p>Loading recommendations...</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* RIGHT: Selection and Controls */}
      <div className="lg:col-span-4">
        <div className="space-y-6">
          {/* Movie Search */}
          <Card className="border-gray-700">
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Search className="h-5 w-5" />
                Add Movies
              </h3>
              
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search for movies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin" />
                )}
              </div>

              {searchResults.length > 0 && (
                <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
                  {searchResults.map((movie) => (
                    <div
                      key={movie.id}
                      className="flex items-center gap-3 p-2 rounded hover:bg-gray-800 cursor-pointer transition-colors"
                      onClick={() => addMovie(movie)}
                    >
                      <img
                        src={getImageUrl(movie.poster_path, 'w200')}
                        alt={movie.title}
                        className="w-10 h-15 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{movie.title}</p>
                        <p className="text-xs text-gray-400">
                          {movie.release_date?.slice(0, 4)} • ★ {movie.vote_average.toFixed(1)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Selected Movies */}
          <Card className="border-gray-700">
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold mb-3">
                Selected Movies ({selectedMovies.length}/10)
              </h3>
              
              {selectedMovies.length === 0 ? (
                <p className="text-gray-400 text-sm">No movies selected yet</p>
              ) : (
                <div className="space-y-2">
                  {selectedMovies.map((movie) => (
                    <SelectedMovieChip
                      key={movie.id}
                      movie={movie}
                      onRemove={() => removeMovie(movie.id)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Feature Weights */}
          <Card className="border-gray-700">
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold mb-3">Recommendation Weights</h3>
              <div className="space-y-4">
                <WeightSlider
                  label="Genre Similarity"
                  value={weights.genre}
                  onChange={(value) => updateWeight('genre', value)}
                  description="How important are matching genres?"
                />
                <WeightSlider
                  label="Rating Quality"
                  value={weights.rating}
                  onChange={(value) => updateWeight('rating', value)}
                  description="Prefer highly-rated movies?"
                />
                <WeightSlider
                  label="Cast Similarity"
                  value={weights.cast}
                  onChange={(value) => updateWeight('cast', value)}
                  description="Movies with similar actors?"
                />
                <WeightSlider
                  label="Director Style"
                  value={weights.director}
                  onChange={(value) => updateWeight('director', value)}
                  description="Same or similar directors?"
                />
                <WeightSlider
                  label="Visual Style"
                  value={weights.cinema}
                  onChange={(value) => updateWeight('cinema', value)}
                  description="Similar cinematography?"
                />
                <WeightSlider
                  label="Themes/Keywords"
                  value={weights.keywords}
                  onChange={(value) => updateWeight('keywords', value)}
                  description="Similar themes and topics?"
                />
                <WeightSlider
                  label="Release Era"
                  value={weights.year}
                  onChange={(value) => updateWeight('year', value)}
                  description="From the same time period?"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// Helper Components
function RecommendationCard({ movie }: { movie: Movie }) {
  return (
    <Card className="border-gray-700 hover:border-yellow-500/50 transition-colors group">
      <CardContent className="p-3">
        <div className="aspect-[2/3] mb-3 overflow-hidden rounded">
          <img
            src={getImageUrl(movie.poster_path, 'w342')}
            alt={movie.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        </div>
        
        <div className="space-y-2">
          <h4 className="font-medium line-clamp-2 text-sm">{movie.title}</h4>
          
          <div className="flex items-center gap-2 text-xs text-gray-400">
            {movie.release_year && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {movie.release_year}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3" />
              {movie.vote_average.toFixed(1)}
            </span>
          </div>

          {movie.genres.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {movie.genres.slice(0, 2).map(genre => (
                <Badge key={genre} variant="secondary" className="text-xs px-1.5 py-0.5">
                  {genre}
                </Badge>
              ))}
            </div>
          )}

          {movie.similarity_score && (
            <div className="text-xs text-yellow-400">
              {(movie.similarity_score * 100).toFixed(0)}% match
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function SelectedMovieChip({ movie, onRemove }: { movie: Movie; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-2">
      <img
        src={getImageUrl(movie.poster_path, 'w200')}
        alt={movie.title}
        className="w-8 h-12 object-cover rounded"
      />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{movie.title}</p>
        <p className="text-xs text-gray-400">
          {movie.release_year} • ★ {movie.vote_average.toFixed(1)}
        </p>
      </div>
      <Button
        size="sm"
        variant="ghost"
        onClick={onRemove}
        className="h-6 w-6 p-0 hover:bg-red-500/20"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}

function WeightSlider({ 
  label, 
  value, 
  onChange, 
  description 
}: { 
  label: string; 
  value: number; 
  onChange: (value: number) => void;
  description: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label className="text-sm font-medium">{label}</Label>
        <span className="text-xs text-gray-400">{value.toFixed(2)}</span>
      </div>
      <Slider
        value={[value]}
        onValueChange={(values: number[]) => onChange(values[0])}
        min={0}
        max={1.5}
        step={0.1}
        className="w-full"
      />
      <p className="text-xs text-gray-500">{description}</p>
    </div>
  )
}

// Utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | undefined
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}