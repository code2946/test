-- Create the watchlist table with the exact schema needed
CREATE TABLE IF NOT EXISTS public.watchlist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    movie_id TEXT NOT NULL,
    title TEXT NOT NULL,
    poster_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_user_movie UNIQUE(user_id, movie_id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;

-- Create RLS policies so users can only access their own watchlist items
CREATE POLICY "Users can view their own watchlist items" 
ON public.watchlist FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own watchlist items" 
ON public.watchlist FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own watchlist items" 
ON public.watchlist FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_watchlist_user_id ON public.watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_created_at ON public.watchlist(created_at DESC);

-- Grant necessary permissions
GRANT ALL ON public.watchlist TO authenticated;
GRANT ALL ON public.watchlist TO service_role;
