"use client"

import { useState, useEffect } from 'react'

export default function SimpleTest() {
  const [status, setStatus] = useState('Loading...')
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    async function testBasic() {
      try {
        setStatus('Testing imports...')
        
        // Test import
        const { getPopularMovies, getGenres } = await import('@/lib/tmdb-supabase')
        setStatus('Imports successful. Testing functions...')
        
        // Test genres
        const genres = await getGenres()
        console.log('Genres result:', genres)
        
        // Test movies
        const movies = await getPopularMovies(1)
        console.log('Movies result:', movies)
        
        setData({
          genres: {
            count: genres.length,
            sample: genres.slice(0, 3)
          },
          movies: {
            count: movies.results?.length || 0,
            totalPages: movies.total_pages,
            sample: movies.results?.[0] || null
          }
        })
        
        setStatus('Tests completed successfully!')
        
      } catch (error) {
        console.error('Test error:', error)
        setStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        setData({ error: error instanceof Error ? error.stack : 'Unknown error' })
      }
    }
    
    testBasic()
  }, [])

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-2xl font-bold mb-4">Simple Function Test</h1>
      <div className="mb-4">
        <strong>Status:</strong> {status}
      </div>
      {data && (
        <div className="bg-gray-900 p-4 rounded">
          <pre className="text-sm overflow-auto">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}