-- Create likes table to track user's liked movies
CREATE TABLE IF NOT EXISTS public.likes (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    movie_id TEXT NOT NULL,
    title TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_like UNIQUE(user_id, movie_id)
);

-- Enable Row Level Security
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can CRUD their own likes"
ON public.likes FOR ALL
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_likes_user_id_movie_id ON public.likes(user_id, movie_id);

-- Grant permissions
GRANT ALL ON public.likes TO authenticated;
GRANT ALL ON public.likes TO service_role;
