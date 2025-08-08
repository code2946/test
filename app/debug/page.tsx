"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getPopularMovies, checkDatabaseStatus } from '@/lib/tmdb-supabase'

export default function DebugPage() {
  const [debugData, setDebugData] = useState<any>(null)
  const [moviesTest, setMoviesTest] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const runDebugCheck = async () => {
    setLoading(true)
    try {
      // Test API endpoint
      const response = await fetch('/api/debug')
      const apiDebug = await response.json()
      setDebugData(apiDebug)

      // Test movies function directly
      try {
        const moviesResult = await getPopularMovies(1)
        setMoviesTest({
          success: true,
          count: moviesResult.results?.length || 0,
          firstMovie: moviesResult.results?.[0]?.title || 'No movies',
          totalPages: moviesResult.total_pages
        })
      } catch (movieError) {
        setMoviesTest({
          success: false,
          error: movieError instanceof Error ? movieError.message : 'Movies test failed'
        })
      }

    } catch (error) {
      setDebugData({
        error: error instanceof Error ? error.message : 'Debug check failed'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    runDebugCheck()
  }, [])

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🐛 Debug Dashboard</h1>
        
        <div className="grid gap-6">
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Environment Check
                <Button 
                  onClick={runDebugCheck} 
                  disabled={loading}
                  size="sm"
                  className="bg-yellow-500 text-black hover:bg-yellow-600"
                >
                  {loading ? 'Testing...' : 'Refresh'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {debugData ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-yellow-500">Environment Variables</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                      <div>Supabase URL: {debugData.environment?.hasSupabaseUrl ? '✅' : '❌'}</div>
                      <div>Supabase Anon: {debugData.environment?.hasSupabaseAnonKey ? '✅' : '❌'}</div>
                      <div>Service Role: {debugData.environment?.hasSupabaseServiceKey ? '✅' : '❌'}</div>
                      <div>TMDB API: {debugData.environment?.hasTmdbApiKey ? '✅' : '❌'}</div>
                      <div>TMDB Token: {debugData.environment?.hasTmdbToken ? '✅' : '❌'}</div>
                      <div>Gemini API: {debugData.environment?.hasGeminiKey ? '✅' : '❌'}</div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-yellow-500">Database Status</h3>
                    <div className="text-sm mt-2">
                      <div>Connected: {debugData.database?.connected ? '✅' : '❌'}</div>
                      <div>Has Genres: {debugData.database?.hasGenres ? '✅' : '❌'}</div>
                      <div>Has Movies: {debugData.database?.hasMovies ? '✅' : '❌'}</div>
                      {debugData.database?.error && (
                        <div className="text-red-400">Error: {debugData.database.error}</div>
                      )}
                    </div>
                  </div>

                  {debugData.genres && (
                    <div>
                      <h3 className="font-semibold text-yellow-500">Genres Test</h3>
                      <div className="text-sm mt-2">
                        <div>Count: {debugData.genres.count}</div>
                        <div>Sample: {debugData.genres.sample?.map((g: any) => g.name).join(', ')}</div>
                        {debugData.genres.error && (
                          <div className="text-red-400">Error: {debugData.genres.error}</div>
                        )}
                      </div>
                    </div>
                  )}

                  {debugData.movies && (
                    <div>
                      <h3 className="font-semibold text-yellow-500">Movies Test</h3>
                      <div className="text-sm mt-2">
                        <div>Count: {debugData.movies.count}</div>
                        <div>Categories: {debugData.movies.categories?.join(', ')}</div>
                        <div>Sample: {debugData.movies.sample?.map((m: any) => m.title).join(', ')}</div>
                        {debugData.movies.error && (
                          <div className="text-red-400">Error: {debugData.movies.error}</div>
                        )}
                      </div>
                    </div>
                  )}

                  {debugData.rpcFunctions && (
                    <div>
                      <h3 className="font-semibold text-yellow-500">RPC Functions</h3>
                      <div className="text-sm mt-2">
                        <div>Available: {debugData.rpcFunctions.available ? '✅' : '❌'}</div>
                        <div>Test Result: {debugData.rpcFunctions.testResult} movies</div>
                        {debugData.rpcFunctions.error && (
                          <div className="text-red-400">Error: {debugData.rpcFunctions.error}</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-gray-400">Loading debug information...</div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle>Movies Function Test</CardTitle>
            </CardHeader>
            <CardContent>
              {moviesTest ? (
                <div className="space-y-2">
                  <div>Status: {moviesTest.success ? '✅ Success' : '❌ Failed'}</div>
                  {moviesTest.success ? (
                    <>
                      <div>Movies Found: {moviesTest.count}</div>
                      <div>First Movie: {moviesTest.firstMovie}</div>
                      <div>Total Pages: {moviesTest.totalPages}</div>
                    </>
                  ) : (
                    <div className="text-red-400">Error: {moviesTest.error}</div>
                  )}
                </div>
              ) : (
                <div className="text-gray-400">Testing movies function...</div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle>Quick Fixes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div>• If database shows no connection: Check environment variables in Vercel</div>
                <div>• If no movies/genres: Run database schema in Supabase SQL Editor</div>
                <div>• If RPC functions fail: Database schema may be incomplete</div>
                <div>• If all fails: App will use mock data automatically</div>
              </div>
              
              <div className="mt-4 space-x-2">
                <Button 
                  onClick={() => window.open('/api/sync-movies?force=true', '_blank')}
                  variant="outline"
                  size="sm"
                >
                  Force Sync Movies
                </Button>
                <Button 
                  onClick={() => window.open('/', '_blank')}
                  variant="outline" 
                  size="sm"
                >
                  Test App
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}