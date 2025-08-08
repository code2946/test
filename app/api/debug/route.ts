import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { checkDatabaseStatus } from '@/lib/tmdb-supabase'

export async function GET(request: NextRequest) {
  try {
    const debugInfo: any = {
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        hasTmdbApiKey: !!process.env.TMDB_API_KEY,
        hasTmdbToken: !!process.env.TMDB_ACCESS_TOKEN,
        hasGeminiKey: !!process.env.GEMINI_API_KEY,
      },
      database: {
        status: 'checking...'
      },
      movies: {
        status: 'checking...'
      }
    }

    // Check database connection
    try {
      const dbStatus = await checkDatabaseStatus()
      debugInfo.database = dbStatus
    } catch (error) {
      debugInfo.database = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }

    // Test basic queries
    try {
      // Test genres table
      const { data: genres, error: genresError } = await supabase
        .from('genres')
        .select('id, name')
        .limit(3)

      debugInfo.genres = {
        count: genres?.length || 0,
        sample: genres?.slice(0, 3) || [],
        error: genresError?.message || null
      }

      // Test movies table
      const { data: movies, error: moviesError } = await supabase
        .from('movies')
        .select('id, title, category')
        .limit(5)

      debugInfo.movies = {
        count: movies?.length || 0,
        sample: movies?.slice(0, 3) || [],
        categories: [...new Set(movies?.map(m => m.category) || [])],
        error: moviesError?.message || null
      }

      // Test RPC functions
      try {
        const { data: rpcTest, error: rpcError } = await supabase
          .rpc('get_movies_by_category', {
            category_name: 'popular',
            page_num: 1,
            page_size: 3
          })

        debugInfo.rpcFunctions = {
          available: true,
          testResult: rpcTest?.length || 0,
          error: rpcError?.message || null
        }
      } catch (rpcError) {
        debugInfo.rpcFunctions = {
          available: false,
          error: rpcError instanceof Error ? rpcError.message : 'RPC functions not available'
        }
      }

    } catch (dbError) {
      debugInfo.queryTest = {
        error: dbError instanceof Error ? dbError.message : 'Database query failed'
      }
    }

    return NextResponse.json(debugInfo)

  } catch (error) {
    console.error('Debug API error:', error)
    
    return NextResponse.json({ 
      error: 'Debug check failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { 
      status: 500 
    })
  }
}