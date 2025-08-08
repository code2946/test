-- Create a Supabase function to get all movie interactions for a user
CREATE OR REPLACE FUNCTION get_user_movies(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    liked_movies TEXT[];
    watchlist_movies TEXT[];
    seen_movies TEXT[];
BEGIN
    -- Aggregate liked movie titles
    SELECT COALESCE(ARRAY_AGG(title), '{}')
    INTO liked_movies
    FROM public.likes
    WHERE user_id = p_user_id;

    -- Aggregate watchlist movie titles
    SELECT COALESCE(ARRAY_AGG(title), '{}')
    INTO watchlist_movies
    FROM public.watchlist
    WHERE user_id = p_user_id;

    -- Aggregate seen movie titles
    SELECT COALESCE(ARRAY_AGG(title), '{}')
    INTO seen_movies
    FROM public.seen
    WHERE user_id = p_user_id;

    -- Return all lists as a JSON object
    RETURN json_build_object(
        'likes', liked_movies,
        'watchlist', watchlist_movies,
        'seen', seen_movies
    );
END;
$$;
