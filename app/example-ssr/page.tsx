// Example Server Component that fetches movies server-side
// This demonstrates how to use the server-side TMDB functions
// No client-side API calls to TMDB - everything happens on the server

import { serverGetPopularMovies, serverGetTopRatedMovies, getImageUrl } from '@/lib/tmdb-server'
import Image from 'next/image'

export default async function ExampleSSRPage() {
  // These fetch calls happen on the server, not in the browser
  const [popularMovies, topRatedMovies] = await Promise.all([
    serverGetPopularMovies(1),
    serverGetTopRatedMovies(1)
  ])

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-white">Server-Side Rendered Movies</h1>
      
      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 text-white">Popular Movies</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {popularMovies.results.slice(0, 6).map((movie) => (
            <div key={movie.id} className="bg-gray-800 rounded-lg overflow-hidden">
              <Image
                src={getImageUrl(movie.poster_path, 'w300')}
                alt={movie.title}
                width={300}
                height={450}
                className="w-full h-auto"
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyEkJyck+lVFTyoKjYnqrStVDxG2KUGxKUGlKHWCGQ==" 
              />
              <div className="p-3">
                <h3 className="text-sm font-medium text-white truncate">{movie.title}</h3>
                <p className="text-xs text-gray-400 mt-1">
                  {movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'} • 
                  ⭐ {movie.vote_average.toFixed(1)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 text-white">Top Rated Movies</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {topRatedMovies.results.slice(0, 6).map((movie) => (
            <div key={movie.id} className="bg-gray-800 rounded-lg overflow-hidden">
              <Image
                src={getImageUrl(movie.poster_path, 'w300')}
                alt={movie.title}
                width={300}
                height={450}
                className="w-full h-auto"
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyEkJyck+lVFTyoKjYnqrStVDxG2KUGxKUGlKHWCGQ=="
              />
              <div className="p-3">
                <h3 className="text-sm font-medium text-white truncate">{movie.title}</h3>
                <p className="text-xs text-gray-400 mt-1">
                  {movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'} • 
                  ⭐ {movie.vote_average.toFixed(1)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">🎯 SSR Verification</h3>
        <div className="text-sm text-gray-300 space-y-2">
          <p>✅ This page is Server-Side Rendered (SSR)</p>
          <p>✅ Movies fetched server-side using <code className="bg-gray-700 px-2 py-1 rounded">serverGetPopularMovies()</code></p>
          <p>✅ Images served via <code className="bg-gray-700 px-2 py-1 rounded">/api/tmdb-image</code> proxy</p>
          <p>✅ No direct browser calls to <code className="bg-gray-700 px-2 py-1 rounded">api.themoviedb.org</code></p>
          <p>✅ Works in India without VPN!</p>
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-gray-400 text-sm">
          Check Network tab in DevTools - you should only see requests to your domain, not TMDB!
        </p>
      </div>
    </div>
  )
}