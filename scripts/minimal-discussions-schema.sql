-- MINIMAL DATABASE SCHEMA FOR DISCUSSIONS (NO TRIGGERS)
-- Run this first to get basic functionality working

-- Create discussions table (minimal version)
CREATE TABLE IF NOT EXISTS public.discussions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    movie_id TEXT NOT NULL,
    user_id UUID NOT NULL,
    parent_id UUID NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE
);

-- Create reactions table (minimal version)
CREATE TABLE IF NOT EXISTS public.discussion_reactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    discussion_id UUID NOT NULL,
    user_id UUID NOT NULL,
    reaction_type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraints after table creation
ALTER TABLE public.discussions 
ADD CONSTRAINT fk_discussions_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.discussions 
ADD CONSTRAINT fk_discussions_parent_id 
FOREIGN KEY (parent_id) REFERENCES public.discussions(id) ON DELETE CASCADE;

ALTER TABLE public.discussion_reactions 
ADD CONSTRAINT fk_reactions_discussion_id 
FOREIGN KEY (discussion_id) REFERENCES public.discussions(id) ON DELETE CASCADE;

ALTER TABLE public.discussion_reactions 
ADD CONSTRAINT fk_reactions_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add constraints
ALTER TABLE public.discussion_reactions 
ADD CONSTRAINT check_reaction_type 
CHECK (reaction_type IN ('like', 'dislike', 'love', 'laugh'));

-- Add unique constraint for one reaction per user per discussion
ALTER TABLE public.discussion_reactions 
ADD CONSTRAINT unique_user_discussion_reaction 
UNIQUE(discussion_id, user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_reactions ENABLE ROW LEVEL SECURITY;

-- Simple RLS Policies - allow all operations for authenticated users
CREATE POLICY "Allow all for authenticated users - discussions" 
ON public.discussions FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users - reactions" 
ON public.discussion_reactions FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow anonymous users to read discussions (optional)
CREATE POLICY "Allow anonymous read - discussions" 
ON public.discussions FOR SELECT
TO anon
USING (true);

CREATE POLICY "Allow anonymous read - reactions" 
ON public.discussion_reactions FOR SELECT
TO anon
USING (true);

-- Create basic indexes
CREATE INDEX IF NOT EXISTS idx_discussions_movie_id ON public.discussions(movie_id);
CREATE INDEX IF NOT EXISTS idx_discussions_parent_id ON public.discussions(parent_id);
CREATE INDEX IF NOT EXISTS idx_discussions_created_at ON public.discussions(created_at DESC);

-- Grant permissions
GRANT ALL ON public.discussions TO authenticated;
GRANT SELECT ON public.discussions TO anon;
GRANT ALL ON public.discussion_reactions TO authenticated;
GRANT SELECT ON public.discussion_reactions TO anon;