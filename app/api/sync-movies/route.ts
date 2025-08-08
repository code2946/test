import { NextRequest, NextResponse } from 'next/server'
import { movieSyncService } from '@/lib/movie-sync'

export async function GET(request: NextRequest) {
  try {
    // Check if manual sync is requested
    const { searchParams } = new URL(request.url)
    const force = searchParams.get('force') === 'true'
    const category = searchParams.get('category')

    if (force && category) {
      // Force sync specific category
      const result = await movieSyncService.syncCategory(category as any)
      return NextResponse.json({ 
        success: true, 
        message: `Force synced ${category}`,
        result 
      })
    }

    if (force) {
      // Force sync all categories
      const results = await movieSyncService.syncAllCategories()
      const totalMovies = results.reduce((sum, r) => sum + r.moviesSynced, 0)
      
      return NextResponse.json({ 
        success: true, 
        message: `Force synced all categories: ${totalMovies} movies`,
        results 
      })
    }

    // Normal sync - only sync if needed (24 hour check)
    const results = await movieSyncService.syncIfNeeded()
    
    if (results.length === 0) {
      const status = await movieSyncService.checkSyncStatus()
      return NextResponse.json({ 
        success: true, 
        message: 'All categories are up to date',
        status 
      })
    }

    const totalMovies = results.reduce((sum, r) => sum + r.moviesSynced, 0)
    const successfulSyncs = results.filter(r => r.success).length

    return NextResponse.json({ 
      success: true, 
      message: `Synced ${totalMovies} movies across ${successfulSyncs}/${results.length} categories`,
      results 
    })

  } catch (error) {
    console.error('Movie sync API error:', error)
    
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Movie sync failed'
    }, { 
      status: 500 
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { category, force } = await request.json()

    if (category) {
      const result = await movieSyncService.syncCategory(category)
      return NextResponse.json({ 
        success: true, 
        message: `Synced ${category}: ${result.moviesSynced} movies`,
        result 
      })
    }

    // Sync all categories
    const results = force 
      ? await movieSyncService.syncAllCategories()
      : await movieSyncService.syncIfNeeded()

    const totalMovies = results.reduce((sum, r) => sum + r.moviesSynced, 0)

    return NextResponse.json({ 
      success: true, 
      message: `Synced ${totalMovies} total movies`,
      results 
    })

  } catch (error) {
    console.error('Movie sync POST error:', error)
    
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Movie sync failed'
    }, { 
      status: 500 
    })
  }
}