-- Quick Movie Seed for Testing ScreenOnFire
-- This script adds sample movies to test the application immediately

-- Clear existing data
DELETE FROM movie_genres;
DELETE FROM movies WHERE id IN (550, 238, 155, 19404, 19551, 486589);

-- Insert sample movies
INSERT INTO movies (id, title, overview, release_date, vote_average, vote_count, popularity, poster_path, backdrop_path, original_language, original_title, adult, category, region) VALUES 
(550, 'Fight Club', 'A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy.', '1999-10-15', 8.4, 26280, 71.234, '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg', '/fCayJrkfRaCRCTh8GqN30f8oyQF.jpg', 'en', 'Fight Club', false, 'popular', 'US'),
(238, 'The Shawshank Redemption', 'Framed in the 1940s for the double murder of his wife and her lover, upstanding banker Andy Dufresne begins a new life at the Shawshank prison.', '1994-09-23', 9.3, 26280, 95.123, '/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg', '/iNh3BivHyg5sQRPP1KOkzguEX0H.jpg', 'en', 'The Shawshank Redemption', false, 'top_rated', 'US'),
(155, 'The Dark Knight', 'Batman raises the stakes in his war on crime with the help of Lt. Jim Gordon and District Attorney Harvey Dent.', '2008-07-18', 9.0, 31000, 99.567, '/qJ2tW6WMUDux911r6m7haRef0WH.jpg', '/hqkIcbrOHL86UncnHIsHVcVmzue.jpg', 'en', 'The Dark Knight', false, 'popular', 'US'),
(19404, 'Dilwale Dulhania Le Jayenge', 'Raj and Simran meet during a trip across Europe and fall in love, but Simran''s father has already arranged her marriage.', '1995-10-20', 8.7, 4200, 45.123, '/ktejodbcdCPXbMMdnpI9BUxW6O8.jpg', '/90ez6ArvpO8bvpyIngBuwXOqJm5.jpg', 'hi', 'Dilwale Dulhania Le Jayenge', false, 'bollywood', 'IN'),
(19551, '3 Idiots', 'In the tradition of coming-of-age films, Three Idiots revolves around the lives of three friends.', '2009-12-25', 8.4, 5800, 38.567, '/66A9MqXOyVFCssoloscw38nJp8B.jpg', '/cQvc9N6JiMVKqol3wcYrGshsIdZ.jpg', 'hi', '3 Idiots', false, 'bollywood', 'IN'),
(486589, 'Red Notice', 'An Interpol-issued Red Notice is a global alert to hunt and capture the world''s most wanted.', '2021-11-05', 6.8, 4800, 156.789, '/lAXONuqg41NwUMuzMiFvicDET9Y.jpg', '/8Y43POKjjKDGI9MH89NW0NAzzp8.jpg', 'en', 'Red Notice', false, 'trending', 'US');

-- Insert movie-genre relationships
INSERT INTO movie_genres (movie_id, genre_id) VALUES 
-- Fight Club: Drama, Thriller
(550, 18), (550, 53),
-- The Shawshank Redemption: Drama, Crime
(238, 18), (238, 80),
-- The Dark Knight: Action, Crime, Drama
(155, 28), (155, 80), (155, 18),
-- DDLJ: Comedy, Drama, Romance
(19404, 35), (19404, 18), (19404, 10749),
-- 3 Idiots: Comedy, Drama
(19551, 35), (19551, 18),
-- Red Notice: Action, Comedy, Crime
(486589, 28), (486589, 35), (486589, 80);

-- Update sync log to show data is available
UPDATE movie_sync_log SET 
    status = 'completed',
    movies_synced = 6,
    completed_at = NOW(),
    next_sync_at = NOW() + INTERVAL '24 hours'
WHERE category IN ('popular', 'top_rated', 'bollywood', 'trending');

-- Add more popular movies for a fuller experience
INSERT INTO movies (id, title, overview, release_date, vote_average, vote_count, popularity, poster_path, backdrop_path, original_language, original_title, adult, category, region) VALUES 
(13, 'Forrest Gump', 'The presidencies of Kennedy and Johnson, the events of Vietnam, Watergate and other historical events unfold from the perspective of an Alabama man.', '1994-06-23', 8.8, 25000, 88.567, '/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg', '/nBNZadXqJSdt05SHLqgT0HuC5Gm.jpg', 'en', 'Forrest Gump', false, 'popular', 'US'),
(122, 'The Lord of the Rings: The Return of the King', 'Aragorn is revealed as the heir to the ancient kings as he, Gandalf and the other members of the broken fellowship struggle to save Gondor.', '2003-12-17', 8.9, 23000, 79.234, '/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg', '/2u7zbn8EudG6kLlBzUYqP8RyFU4.jpg', 'en', 'The Lord of the Rings: The Return of the King', false, 'top_rated', 'US'),
(680, 'Pulp Fiction', 'A burger-loving hit man, his philosophical partner, a drug-addled gangster''s moll and a washed-up boxer converge in this sprawling crime caper.', '1994-09-10', 8.9, 27000, 82.456, '/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg', '/4cDFJr4HnXN5AdPw4AKrmLlMWdO.jpg', 'en', 'Pulp Fiction', false, 'top_rated', 'US'),
(372058, 'Your Name', 'High schoolers Mitsuha and Taki are complete strangers living separate lives. But one night, they suddenly switch places.', '2016-08-26', 8.5, 10500, 67.890, '/q719jXXEzOoYaps6babgKnONONX.jpg', '/F2SQjw8sfH5L8MrsSELXgHNEoIL.jpg', 'ja', '君の名は。', false, 'popular', 'JP');

-- Add genre relationships for new movies
INSERT INTO movie_genres (movie_id, genre_id) VALUES 
-- Forrest Gump: Comedy, Drama, Romance
(13, 35), (13, 18), (13, 10749),
-- LOTR: Adventure, Drama, Fantasy
(122, 12), (122, 18), (122, 14),
-- Pulp Fiction: Crime, Drama
(680, 80), (680, 18),
-- Your Name: Animation, Romance, Drama
(372058, 16), (372058, 10749), (372058, 18);

-- Verify the data
SELECT 
    'Movies' as table_name, 
    COUNT(*) as count,
    array_agg(DISTINCT category) as categories
FROM movies
UNION ALL
SELECT 
    'Genres' as table_name,
    COUNT(*) as count,
    ARRAY[MIN(name), MAX(name)] as categories  
FROM genres
UNION ALL
SELECT 
    'Movie Genres' as table_name,
    COUNT(*) as count,
    ARRAY[COUNT(DISTINCT movie_id)::text || ' movies', COUNT(DISTINCT genre_id)::text || ' genres'] as categories
FROM movie_genres;