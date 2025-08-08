-- Enhanced database schema for movie discussions with threaded comments (FIXED VERSION)

-- Create discussions table for threaded comments
CREATE TABLE IF NOT EXISTS public.discussions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    movie_id TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.discussions(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE,
    like_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0
);

-- Create reactions table for likes/dislikes on discussions
CREATE TABLE IF NOT EXISTS public.discussion_reactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    discussion_id UUID NOT NULL REFERENCES public.discussions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'dislike', 'love', 'laugh')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one reaction per user per discussion
    UNIQUE(discussion_id, user_id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for discussions
CREATE POLICY "Anyone can view discussions" 
ON public.discussions FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create discussions" 
ON public.discussions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own discussions" 
ON public.discussions FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own discussions" 
ON public.discussions FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for reactions
CREATE POLICY "Anyone can view reactions" 
ON public.discussion_reactions FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create reactions" 
ON public.discussion_reactions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reactions" 
ON public.discussion_reactions FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reactions" 
ON public.discussion_reactions FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_discussions_movie_id ON public.discussions(movie_id);
CREATE INDEX IF NOT EXISTS idx_discussions_parent_id ON public.discussions(parent_id);
CREATE INDEX IF NOT EXISTS idx_discussions_created_at ON public.discussions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_discussions_user_id ON public.discussions(user_id);
CREATE INDEX IF NOT EXISTS idx_discussion_reactions_discussion_id ON public.discussion_reactions(discussion_id);
CREATE INDEX IF NOT EXISTS idx_discussion_reactions_user_id ON public.discussion_reactions(user_id);

-- Function to update reply count when a reply is added/deleted
CREATE OR REPLACE FUNCTION update_reply_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.parent_id IS NOT NULL THEN
        -- Increment reply count for parent
        UPDATE public.discussions 
        SET reply_count = reply_count + 1 
        WHERE id = NEW.parent_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' AND OLD.parent_id IS NOT NULL THEN
        -- Decrement reply count for parent
        UPDATE public.discussions 
        SET reply_count = reply_count - 1 
        WHERE id = OLD.parent_id AND reply_count > 0;
        RETURN OLD;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to update like count when a reaction is added/removed
CREATE OR REPLACE FUNCTION update_like_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increment like count for the discussion
        IF NEW.reaction_type = 'like' THEN
            UPDATE public.discussions 
            SET like_count = like_count + 1 
            WHERE id = NEW.discussion_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrement like count for the discussion
        IF OLD.reaction_type = 'like' THEN
            UPDATE public.discussions 
            SET like_count = like_count - 1 
            WHERE id = OLD.discussion_id AND like_count > 0;
        END IF;
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Handle reaction type change
        IF OLD.reaction_type = 'like' AND NEW.reaction_type != 'like' THEN
            UPDATE public.discussions 
            SET like_count = like_count - 1 
            WHERE id = NEW.discussion_id AND like_count > 0;
        ELSIF OLD.reaction_type != 'like' AND NEW.reaction_type = 'like' THEN
            UPDATE public.discussions 
            SET like_count = like_count + 1 
            WHERE id = NEW.discussion_id;
        END IF;
        RETURN NEW;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create separate triggers for INSERT and DELETE (fixed version)
CREATE TRIGGER update_discussions_reply_count_insert
    AFTER INSERT ON public.discussions
    FOR EACH ROW
    EXECUTE FUNCTION update_reply_count();

CREATE TRIGGER update_discussions_reply_count_delete
    AFTER DELETE ON public.discussions
    FOR EACH ROW
    EXECUTE FUNCTION update_reply_count();

CREATE TRIGGER update_discussions_like_count
    AFTER INSERT OR DELETE OR UPDATE ON public.discussion_reactions
    FOR EACH ROW
    EXECUTE FUNCTION update_like_count();

CREATE TRIGGER update_discussions_updated_at
    BEFORE UPDATE ON public.discussions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON public.discussions TO authenticated;
GRANT ALL ON public.discussions TO service_role;
GRANT ALL ON public.discussion_reactions TO authenticated;
GRANT ALL ON public.discussion_reactions TO service_role;