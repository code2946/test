import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      watchlist: {
        Row: {
          id: string
          user_id: string
          movie_id: string
          title: string
          poster_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          movie_id: string
          title: string
          poster_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          movie_id?: string
          title?: string
          poster_url?: string | null
          created_at?: string
        }
      }
      discussions: {
        Row: {
          id: string
          movie_id: string
          user_id: string
          parent_id: string | null
          content: string
          created_at: string
          updated_at: string
          is_deleted: boolean
          like_count: number
          reply_count: number
        }
        Insert: {
          id?: string
          movie_id: string
          user_id: string
          parent_id?: string | null
          content: string
          created_at?: string
          updated_at?: string
          is_deleted?: boolean
          like_count?: number
          reply_count?: number
        }
        Update: {
          id?: string
          movie_id?: string
          user_id?: string
          parent_id?: string | null
          content?: string
          created_at?: string
          updated_at?: string
          is_deleted?: boolean
          like_count?: number
          reply_count?: number
        }
      }
      discussion_reactions: {
        Row: {
          id: string
          discussion_id: string
          user_id: string
          reaction_type: 'like' | 'dislike' | 'love' | 'laugh'
          created_at: string
        }
        Insert: {
          id?: string
          discussion_id: string
          user_id: string
          reaction_type: 'like' | 'dislike' | 'love' | 'laugh'
          created_at?: string
        }
        Update: {
          id?: string
          discussion_id?: string
          user_id?: string
          reaction_type?: 'like' | 'dislike' | 'love' | 'laugh'
          created_at?: string
        }
      }
      threads: {
        Row: {
          id: string
          movie_id: string
          user_id: string
          title: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          movie_id: string
          user_id: string
          title: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          movie_id?: string
          user_id?: string
          title?: string
          content?: string
          created_at?: string
        }
      }
      seen: {
        Row: {
          id: string
          user_id: string
          movie_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          movie_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          movie_id?: string
          created_at?: string
        }
      }
      movie_likes: {
        Row: {
          id: string
          user_id: string
          movie_id: string
          liked: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          movie_id: string
          liked: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          movie_id?: string
          liked?: boolean
          created_at?: string
        }
      }
    }
  }
}

export interface WatchlistItem {
  id: string
  user_id: string
  movie_id: string
  title: string
  poster_url: string | null
  created_at: string
}

export interface Thread {
  id: string
  movie_id: string
  user_id: string
  title: string
  content: string
  created_at: string
  author_name?: string
}

export interface Discussion {
  id: string
  movie_id: string
  user_id: string
  parent_id: string | null
  content: string
  created_at: string
  updated_at: string
  is_deleted: boolean
  like_count: number
  reply_count: number
  user_email?: string
  level?: number
  replies?: Discussion[]
}

export interface DiscussionReaction {
  id: string
  discussion_id: string
  user_id: string
  reaction_type: 'like' | 'dislike' | 'love' | 'laugh'
  created_at: string
}

export interface SeenItem {
  id: string
  user_id: string
  movie_id: string
  created_at: string
}

export interface MovieLike {
  id: string
  user_id: string
  movie_id: string
  liked: boolean
  created_at: string
}
