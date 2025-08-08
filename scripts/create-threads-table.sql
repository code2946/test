-- Create threads table for movie discussions
CREATE TABLE IF NOT EXISTS public.threads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    movie_id TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.threads ENABLE ROW LEVEL SECURITY;

-- Create RLS policies - threads are public to read but only authenticated users can create
CREATE POLICY "Anyone can view threads" 
ON public.threads FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create threads" 
ON public.threads FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own threads" 
ON public.threads FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own threads" 
ON public.threads FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_threads_movie_id ON public.threads(movie_id);
CREATE INDEX IF NOT EXISTS idx_threads_created_at ON public.threads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_threads_user_id ON public.threads(user_id);

-- Grant necessary permissions
GRANT ALL ON public.threads TO authenticated;
GRANT ALL ON public.threads TO service_role;
