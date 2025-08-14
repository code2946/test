-- Fix the database function type mismatch
DROP FUNCTION IF EXISTS get_movies_for_vectorization(INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION get_movies_for_vectorization(
    batch_size INTEGER DEFAULT 100,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
    id INTEGER,
    title TEXT,
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
        m.title::TEXT,
        ARRAY_AGG(DISTINCT g.name ORDER BY g.name) as genres,
        m.vote_average,
        m.vote_count,
        m."cast",
        m.directors,
        m.cinematographers,
        m.keywords,
        m.release_year,
        m.runtime
    FROM movies m
    LEFT JOIN movie_genres mg ON m.id = mg.movie_id
    LEFT JOIN genres g ON mg.genre_id = g.id
    GROUP BY m.id, m.title, m.vote_average, m.vote_count, m."cast", 
             m.directors, m.cinematographers, m.keywords, m.release_year, m.runtime
    ORDER BY m.id
    LIMIT batch_size
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;