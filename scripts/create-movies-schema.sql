-- ScreenOnFire Movies Database Schema
-- Optimized for Supabase Free Tier (500MB limit)
-- Estimated storage: ~100MB for 15,000+ movies

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

-- Create movies table (optimized for storage)
CREATE TABLE movies (
  id INTEGER PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  overview TEXT,
  release_date DATE,
  vote_average DECIMAL(3,1),
  vote_count INTEGER,
  popularity DECIMAL(8,3),
  poster_path VARCHAR(100), -- Store only the path, not full URL
  backdrop_path VARCHAR(100),
  original_language CHAR(2),
  original_title VARCHAR(200),
  adult BOOLEAN DEFAULT FALSE,
  category VARCHAR(20) NOT NULL, -- 'popular', 'top_rated', 'bollywood', 'trending'
  region VARCHAR(2), -- 'IN' for Indian movies, 'US' for others
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes for performance
  CONSTRAINT movies_vote_average_check CHECK (vote_average >= 0 AND vote_average <= 10)
);

-- Create movie_genres junction table
CREATE TABLE movie_genres (
  movie_id INTEGER REFERENCES movies(id) ON DELETE CASCADE,
  genre_id INTEGER REFERENCES genres(id) ON DELETE CASCADE,
  PRIMARY KEY (movie_id, genre_id)
);

-- Create sync log table to track updates
CREATE TABLE movie_sync_log (
  id SERIAL PRIMARY KEY,
  category VARCHAR(20) NOT NULL,
  movies_synced INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'running', -- 'running', 'completed', 'failed'
  error_message TEXT,
  next_sync_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '24 hours'
);

-- Indexes for performance (optimized for free tier)
CREATE INDEX idx_movies_category ON movies(category);
CREATE INDEX idx_movies_popularity ON movies(popularity DESC);
CREATE INDEX idx_movies_vote_average ON movies(vote_average DESC);
CREATE INDEX idx_movies_release_date ON movies(release_date DESC);
CREATE INDEX idx_movies_region ON movies(region);
CREATE INDEX idx_movies_original_language ON movies(original_language);
CREATE INDEX idx_movie_genres_movie_id ON movie_genres(movie_id);
CREATE INDEX idx_movie_sync_next ON movie_sync_log(next_sync_at);

-- Insert default genres
INSERT INTO genres (id, name) VALUES 
(28, 'Action'),
(12, 'Adventure'),
(16, 'Animation'),
(35, 'Comedy'),
(80, 'Crime'),
(99, 'Documentary'),
(18, 'Drama'),
(10751, 'Family'),
(14, 'Fantasy'),
(36, 'History'),
(27, 'Horror'),
(10402, 'Music'),
(9648, 'Mystery'),
(10749, 'Romance'),
(878, 'Science Fiction'),
(10770, 'TV Movie'),
(53, 'Thriller'),
(10752, 'War'),
(37, 'Western');

-- Enable Row Level Security (RLS) for read access
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE movie_genres ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read access to movies" ON movies
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access to genres" ON genres
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access to movie_genres" ON movie_genres
    FOR SELECT USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_movies_updated_at BEFORE UPDATE ON movies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_genres_updated_at BEFORE UPDATE ON genres
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to check if sync is needed
CREATE OR REPLACE FUNCTION is_sync_needed(sync_category TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN NOT EXISTS (
        SELECT 1 FROM movie_sync_log 
        WHERE category = sync_category 
        AND status = 'completed'
        AND next_sync_at > NOW()
    );
END;
$$ language 'plpgsql';

-- Create function to get movies by category with pagination
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
        ARRAY_AGG(g.name ORDER BY g.name) as genre_names
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

-- Create function to search movies
CREATE OR REPLACE FUNCTION search_movies(
    search_query TEXT,
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
        ARRAY_AGG(g.name ORDER BY g.name) as genre_names
    FROM movies m
    LEFT JOIN movie_genres mg ON m.id = mg.movie_id
    LEFT JOIN genres g ON mg.genre_id = g.id
    WHERE m.title ILIKE '%' || search_query || '%'
       OR m.overview ILIKE '%' || search_query || '%'
    GROUP BY m.id, m.title, m.overview, m.release_date, m.vote_average, 
             m.poster_path, m.backdrop_path, m.popularity
    ORDER BY m.popularity DESC
    LIMIT page_size
    OFFSET (page_num - 1) * page_size;
END;
$$ language 'plpgsql';

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE movies TO postgres, service_role;
GRANT ALL ON TABLE genres TO postgres, service_role;
GRANT ALL ON TABLE movie_genres TO postgres, service_role;
GRANT ALL ON TABLE movie_sync_log TO postgres, service_role;
GRANT SELECT ON TABLE movies TO anon, authenticated;
GRANT SELECT ON TABLE genres TO anon, authenticated;
GRANT SELECT ON TABLE movie_genres TO anon, authenticated;

-- Initial sync log entries
INSERT INTO movie_sync_log (category, status, next_sync_at) VALUES
('popular', 'pending', NOW()),
('top_rated', 'pending', NOW()),
('bollywood', 'pending', NOW()),
('trending', 'pending', NOW());

-- Comment for documentation
COMMENT ON TABLE movies IS 'Stores movie data from TMDB with 24-hour sync cycle';
COMMENT ON TABLE movie_sync_log IS 'Tracks sync status and schedules for automatic updates';
COMMENT ON FUNCTION is_sync_needed IS 'Checks if a category needs to be synced based on 24-hour cycle';
COMMENT ON FUNCTION get_movies_by_category IS 'Retrieves movies by category with pagination and genre info';
COMMENT ON FUNCTION search_movies IS 'Full-text search across movies with pagination';