import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST() {
  if (!supabaseServiceKey) {
    return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 })
  }

  try {
    // Create admin client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('Setting up database...')

    // First create tables and schema
    const schemaSQL = `
      -- Drop existing tables if they exist
      DROP TABLE IF EXISTS movie_sync_log CASCADE;
      DROP TABLE IF EXISTS movie_genres CASCADE;
      DROP TABLE IF EXISTS genres CASCADE;
      DROP TABLE IF EXISTS movies CASCADE;

      -- Create genres table
      CREATE TABLE genres (
        id INTEGER PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create movies table
      CREATE TABLE movies (
        id INTEGER PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        overview TEXT,
        release_date DATE,
        vote_average DECIMAL(3,1),
        vote_count INTEGER,
        popularity DECIMAL(8,3),
        poster_path VARCHAR(100),
        backdrop_path VARCHAR(100),
        original_language CHAR(2),
        original_title VARCHAR(200),
        adult BOOLEAN DEFAULT FALSE,
        category VARCHAR(20) NOT NULL,
        region VARCHAR(2),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        
        CONSTRAINT movies_vote_average_check CHECK (vote_average >= 0 AND vote_average <= 10)
      );

      -- Create movie_genres junction table
      CREATE TABLE movie_genres (
        movie_id INTEGER REFERENCES movies(id) ON DELETE CASCADE,
        genre_id INTEGER REFERENCES genres(id) ON DELETE CASCADE,
        PRIMARY KEY (movie_id, genre_id)
      );

      -- Create sync log table
      CREATE TABLE movie_sync_log (
        id SERIAL PRIMARY KEY,
        category VARCHAR(20) NOT NULL,
        movies_synced INTEGER DEFAULT 0,
        started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        completed_at TIMESTAMP WITH TIME ZONE,
        status VARCHAR(20) DEFAULT 'running',
        error_message TEXT,
        next_sync_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '24 hours'
      );

      -- Indexes
      CREATE INDEX idx_movies_category ON movies(category);
      CREATE INDEX idx_movies_popularity ON movies(popularity DESC);

      -- Enable RLS
      ALTER TABLE movies ENABLE ROW LEVEL SECURITY;
      ALTER TABLE genres ENABLE ROW LEVEL SECURITY;
      ALTER TABLE movie_genres ENABLE ROW LEVEL SECURITY;

      -- Public read policies
      CREATE POLICY "Allow public read access to movies" ON movies FOR SELECT USING (true);
      CREATE POLICY "Allow public read access to genres" ON genres FOR SELECT USING (true);
      CREATE POLICY "Allow public read access to movie_genres" ON movie_genres FOR SELECT USING (true);
    `

    const { error: schemaError } = await supabase.rpc('exec_sql', { sql: schemaSQL })
    if (schemaError) {
      console.error('Schema error:', schemaError)
    }

    // Insert genres
    const { error: genresError } = await supabase.from('genres').insert([
      { id: 28, name: 'Action' },
      { id: 12, name: 'Adventure' },
      { id: 16, name: 'Animation' },
      { id: 35, name: 'Comedy' },
      { id: 80, name: 'Crime' },
      { id: 99, name: 'Documentary' },
      { id: 18, name: 'Drama' },
      { id: 10751, name: 'Family' },
      { id: 14, name: 'Fantasy' },
      { id: 36, name: 'History' },
      { id: 27, name: 'Horror' },
      { id: 10402, name: 'Music' },
      { id: 9648, name: 'Mystery' },
      { id: 10749, name: 'Romance' },
      { id: 878, name: 'Science Fiction' },
      { id: 10770, name: 'TV Movie' },
      { id: 53, name: 'Thriller' },
      { id: 10752, name: 'War' },
      { id: 37, name: 'Western' }
    ])

    if (genresError) {
      console.error('Genres error:', genresError)
    }

    // Insert sample movies
    const { error: moviesError } = await supabase.from('movies').insert([
      {
        id: 550,
        title: 'Fight Club',
        overview: 'A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy.',
        release_date: '1999-10-15',
        vote_average: 8.4,
        vote_count: 26280,
        popularity: 71.234,
        poster_path: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
        backdrop_path: '/fCayJrkfRaCRCTh8GqN30f8oyQF.jpg',
        original_language: 'en',
        original_title: 'Fight Club',
        adult: false,
        category: 'popular',
        region: 'US'
      },
      {
        id: 238,
        title: 'The Shawshank Redemption',
        overview: 'Framed in the 1940s for the double murder of his wife and her lover, upstanding banker Andy Dufresne begins a new life at the Shawshank prison.',
        release_date: '1994-09-23',
        vote_average: 9.3,
        vote_count: 26280,
        popularity: 95.123,
        poster_path: '/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg',
        backdrop_path: '/iNh3BivHyg5sQRPP1KOkzguEX0H.jpg',
        original_language: 'en',
        original_title: 'The Shawshank Redemption',
        adult: false,
        category: 'top_rated',
        region: 'US'
      },
      {
        id: 155,
        title: 'The Dark Knight',
        overview: 'Batman raises the stakes in his war on crime with the help of Lt. Jim Gordon and District Attorney Harvey Dent.',
        release_date: '2008-07-18',
        vote_average: 9.0,
        vote_count: 31000,
        popularity: 99.567,
        poster_path: '/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
        backdrop_path: '/hqkIcbrOHL86UncnHIsHVcVmzue.jpg',
        original_language: 'en',
        original_title: 'The Dark Knight',
        adult: false,
        category: 'popular',
        region: 'US'
      },
      {
        id: 19404,
        title: 'Dilwale Dulhania Le Jayenge',
        overview: 'Raj and Simran meet during a trip across Europe and fall in love, but Simran\'s father has already arranged her marriage.',
        release_date: '1995-10-20',
        vote_average: 8.7,
        vote_count: 4200,
        popularity: 45.123,
        poster_path: '/ktejodbcdCPXbMMdnpI9BUxW6O8.jpg',
        backdrop_path: '/90ez6ArvpO8bvpyIngBuwXOqJm5.jpg',
        original_language: 'hi',
        original_title: 'Dilwale Dulhania Le Jayenge',
        adult: false,
        category: 'bollywood',
        region: 'IN'
      },
      {
        id: 19551,
        title: '3 Idiots',
        overview: 'In the tradition of coming-of-age films, Three Idiots revolves around the lives of three friends.',
        release_date: '2009-12-25',
        vote_average: 8.4,
        vote_count: 5800,
        popularity: 38.567,
        poster_path: '/66A9MqXOyVFCssoloscw38nJp8B.jpg',
        backdrop_path: '/cQvc9N6JiMVKqol3wcYrGshsIdZ.jpg',
        original_language: 'hi',
        original_title: '3 Idiots',
        adult: false,
        category: 'bollywood',
        region: 'IN'
      }
    ])

    if (moviesError) {
      console.error('Movies error:', moviesError)
    }

    // Insert movie-genre relationships
    const { error: relationshipError } = await supabase.from('movie_genres').insert([
      // Fight Club: Drama, Thriller
      { movie_id: 550, genre_id: 18 }, { movie_id: 550, genre_id: 53 },
      // The Shawshank Redemption: Drama, Crime
      { movie_id: 238, genre_id: 18 }, { movie_id: 238, genre_id: 80 },
      // The Dark Knight: Action, Crime, Drama
      { movie_id: 155, genre_id: 28 }, { movie_id: 155, genre_id: 80 }, { movie_id: 155, genre_id: 18 },
      // DDLJ: Comedy, Drama, Romance
      { movie_id: 19404, genre_id: 35 }, { movie_id: 19404, genre_id: 18 }, { movie_id: 19404, genre_id: 10749 },
      // 3 Idiots: Comedy, Drama
      { movie_id: 19551, genre_id: 35 }, { movie_id: 19551, genre_id: 18 }
    ])

    if (relationshipError) {
      console.error('Relationship error:', relationshipError)
    }

    // Create the RPC functions
    const rpcSQL = `
      CREATE OR REPLACE FUNCTION get_movies_by_category(
          category_name TEXT,
          page_num INTEGER DEFAULT 1,
          page_size INTEGER DEFAULT 20
      )
      RETURNS TABLE (
          id INTEGER,
          title VARCHAR,
          overview TEXT,
          release_date DATE,
          vote_average DECIMAL,
          poster_path VARCHAR,
          backdrop_path VARCHAR,
          popularity DECIMAL,
          genre_names TEXT[]
      ) AS $$
      BEGIN
          RETURN QUERY
          SELECT 
              m.id,
              m.title,
              m.overview,
              m.release_date,
              m.vote_average,
              m.poster_path,
              m.backdrop_path,
              m.popularity,
              COALESCE(ARRAY_AGG(g.name ORDER BY g.name) FILTER (WHERE g.name IS NOT NULL), ARRAY[]::TEXT[]) as genre_names
          FROM movies m
          LEFT JOIN movie_genres mg ON m.id = mg.movie_id
          LEFT JOIN genres g ON mg.genre_id = g.id
          WHERE m.category = category_name
          GROUP BY m.id, m.title, m.overview, m.release_date, m.vote_average, 
                   m.poster_path, m.backdrop_path, m.popularity
          ORDER BY m.popularity DESC
          LIMIT page_size
          OFFSET (page_num - 1) * page_size;
      END;
      $$ language 'plpgsql';
    `

    const { error: rpcError } = await supabase.rpc('exec_sql', { sql: rpcSQL })
    if (rpcError) {
      console.error('RPC function error:', rpcError)
    }

    // Verify setup
    const { data: movieCount } = await supabase.from('movies').select('id', { count: 'exact' })
    const { data: genreCount } = await supabase.from('genres').select('id', { count: 'exact' })

    return NextResponse.json({
      success: true,
      message: 'Database setup completed',
      counts: {
        movies: movieCount?.length || 0,
        genres: genreCount?.length || 0
      },
      errors: {
        schema: schemaError ? schemaError.message : null,
        genres: genresError ? genresError.message : null,
        movies: moviesError ? moviesError.message : null,
        relationships: relationshipError ? relationshipError.message : null,
        rpc: rpcError ? rpcError.message : null
      }
    })

  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json({
      error: 'Database setup failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}