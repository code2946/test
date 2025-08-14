-- ScreenOnFire Advanced Recommendation System Schema
-- Extends existing movies schema with content-based and hybrid recommendation capabilities

-- Enhanced movies table to include additional fields for recommendation engine
ALTER TABLE movies ADD COLUMN IF NOT EXISTS runtime INTEGER;
ALTER TABLE movies ADD COLUMN IF NOT EXISTS keywords TEXT[];
ALTER TABLE movies ADD COLUMN IF NOT EXISTS cast TEXT[];
ALTER TABLE movies ADD COLUMN IF NOT EXISTS directors TEXT[];
ALTER TABLE movies ADD COLUMN IF NOT EXISTS cinematographers TEXT[];
ALTER TABLE movies ADD COLUMN IF NOT EXISTS release_year INTEGER;

-- Create index on new columns
CREATE INDEX IF NOT EXISTS idx_movies_release_year ON movies(release_year);
CREATE INDEX IF NOT EXISTS idx_movies_runtime ON movies(runtime);

-- Update release_year from release_date
UPDATE movies 
SET release_year = EXTRACT(YEAR FROM release_date::date)
WHERE release_year IS NULL AND release_date IS NOT NULL;

-- Create movie_vectors table for precomputed feature vectors
CREATE TABLE IF NOT EXISTS movie_vectors (
  id INTEGER PRIMARY KEY REFERENCES movies(id) ON DELETE CASCADE,
  vector FLOAT8[] NOT NULL,            -- L2-normalized feature vector
  version INTEGER NOT NULL DEFAULT 1,  -- bump when you change feature recipe
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create collaborative filtering scores table (optional for hybrid)
CREATE TABLE IF NOT EXISTS cf_scores (
  base_id INTEGER REFERENCES movies(id) ON DELETE CASCADE,
  rec_id INTEGER REFERENCES movies(id) ON DELETE CASCADE,
  score FLOAT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (base_id, rec_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_cf_scores_base_id ON cf_scores(base_id);
CREATE INDEX IF NOT EXISTS idx_cf_scores_rec_id ON cf_scores(rec_id);
CREATE INDEX IF NOT EXISTS idx_movie_vectors_updated_at ON movie_vectors(updated_at);

-- Enable RLS for new tables
ALTER TABLE movie_vectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE cf_scores ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read access to movie_vectors" ON movie_vectors
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access to cf_scores" ON cf_scores
    FOR SELECT USING (true);

-- Grant permissions
GRANT SELECT ON TABLE movie_vectors TO anon, authenticated;
GRANT SELECT ON TABLE cf_scores TO anon, authenticated;
GRANT ALL ON TABLE movie_vectors TO postgres, service_role;
GRANT ALL ON TABLE cf_scores TO postgres, service_role;

-- Function to check if vectors need regeneration
CREATE OR REPLACE FUNCTION vectors_need_update()
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if any movie has been updated since last vector computation
    RETURN EXISTS (
        SELECT 1 FROM movies m
        LEFT JOIN movie_vectors mv ON m.id = mv.id
        WHERE mv.id IS NULL 
           OR m.updated_at > mv.updated_at
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get similar movies by cosine similarity
CREATE OR REPLACE FUNCTION get_similar_movies(
    movie_ids INTEGER[],
    similarity_threshold FLOAT DEFAULT 0.1,
    result_limit INTEGER DEFAULT 30,
    exclude_selected BOOLEAN DEFAULT true
)
RETURNS TABLE (
    movie_id INTEGER,
    title VARCHAR,
    poster_path VARCHAR,
    vote_average DECIMAL,
    release_year INTEGER,
    genres TEXT[],
    similarity_score FLOAT
) AS $$
BEGIN
    -- This is a placeholder - the actual similarity computation will be done in the API
    -- Returns movies for UI integration
    RETURN QUERY
    SELECT 
        m.id,
        m.title,
        m.poster_path,
        m.vote_average,
        m.release_year,
        ARRAY_AGG(g.name ORDER BY g.name) as genres,
        0.5::FLOAT as similarity_score  -- placeholder
    FROM movies m
    LEFT JOIN movie_genres mg ON m.id = mg.movie_id
    LEFT JOIN genres g ON mg.genre_id = g.id
    WHERE (NOT exclude_selected OR m.id NOT IN (SELECT unnest(movie_ids)))
      AND m.id IN (SELECT mv.id FROM movie_vectors mv)
    GROUP BY m.id, m.title, m.poster_path, m.vote_average, m.release_year
    ORDER BY m.popularity DESC
    LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to get movie data for feature vector computation
CREATE OR REPLACE FUNCTION get_movies_for_vectorization(
    batch_size INTEGER DEFAULT 100,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
    id INTEGER,
    title VARCHAR,
    genres TEXT[],
    vote_average DECIMAL,
    vote_count INTEGER,
    cast TEXT[],
    directors TEXT[],
    cinematographers TEXT[],
    keywords TEXT[],
    release_year INTEGER,
    runtime INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.title,
        ARRAY_AGG(DISTINCT g.name ORDER BY g.name) as genres,
        m.vote_average,
        m.vote_count,
        m.cast,
        m.directors,
        m.cinematographers,
        m.keywords,
        m.release_year,
        m.runtime
    FROM movies m
    LEFT JOIN movie_genres mg ON m.id = mg.movie_id
    LEFT JOIN genres g ON mg.genre_id = g.id
    GROUP BY m.id, m.title, m.vote_average, m.vote_count, m.cast, 
             m.directors, m.cinematographers, m.keywords, m.release_year, m.runtime
    ORDER BY m.id
    LIMIT batch_size
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE movie_vectors IS 'Precomputed L2-normalized feature vectors for content-based recommendations';
COMMENT ON TABLE cf_scores IS 'Collaborative filtering scores for hybrid recommendations';
COMMENT ON FUNCTION get_similar_movies IS 'Returns similar movies based on content features and collaborative filtering';
COMMENT ON FUNCTION get_movies_for_vectorization IS 'Retrieves movie data in batches for feature vector computation';
COMMENT ON FUNCTION vectors_need_update IS 'Checks if movie vectors need to be regenerated';