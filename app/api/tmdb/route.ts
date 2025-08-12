import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const TMDB_BASE_URL = 'https://api.themoviedb.org';
const TMDB_READ_TOKEN = process.env.TMDB_READ_TOKEN;

if (!TMDB_READ_TOKEN) {
  throw new Error('TMDB_READ_TOKEN environment variable is required');
}

async function retryFetch(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      if (response.ok) {
        return response;
      }
      
      // Don't retry client errors (4xx except 429)
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        return response;
      }
      
      // For 429 or 5xx, wait with exponential backoff
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');
    
    if (!path) {
      return NextResponse.json(
        { error: 'Missing required path parameter' },
        { status: 400 }
      );
    }
    
    // Remove path from search params to forward remaining params
    searchParams.delete('path');
    const queryString = searchParams.toString();
    const tmdbUrl = `${TMDB_BASE_URL}${path}${queryString ? `?${queryString}` : ''}`;
    
    const response = await retryFetch(tmdbUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TMDB_READ_TOKEN}`,
        'Accept': 'application/json',
        'User-Agent': 'ScreenOnFire/1.0'
      },
      next: { revalidate: 3600 } // Cache for 1 hour
    });
    
    const data = await response.json();
    
    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
      }
    });
    
  } catch (error) {
    console.error('TMDB API proxy error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch from TMDB API',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}