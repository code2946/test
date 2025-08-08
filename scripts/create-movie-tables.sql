-- Create seen movies table
CREATE TABLE IF NOT EXISTS public.seen (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    movie_id TEXT NOT NULL,
    title TEXT NOT NULL,
    poster_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_user_seen_movie UNIQUE(user_id, movie_id)
);

-- Create movie likes table
CREATE TABLE IF NOT EXISTS public.movie_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    movie_id TEXT NOT NULL,
    liked BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_user_movie_like UNIQUE(user_id, movie_id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.seen ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movie_likes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for seen table
CREATE POLICY "Users can view their own seen movies" 
ON public.seen FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own seen movies" 
ON public.seen FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own seen movies" 
ON public.seen FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for movie_likes table
CREATE POLICY "Users can view their own movie likes" 
ON public.movie_likes FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own movie likes" 
ON public.movie_likes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own movie likes" 
ON public.movie_likes FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own movie likes" 
ON public.movie_likes FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_seen_user_id ON public.seen(user_id);
CREATE INDEX IF NOT EXISTS idx_seen_created_at ON public.seen(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_movie_likes_user_id ON public.movie_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_movie_likes_movie_id ON public.movie_likes(movie_id);

-- Grant necessary permissions
GRANT ALL ON public.seen TO authenticated;
GRANT ALL ON public.seen TO service_role;
GRANT ALL ON public.movie_likes TO authenticated;
GRANT ALL ON public.movie_likes TO service_role;
