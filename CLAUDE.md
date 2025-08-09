np# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ScreenOnFire is a movie recommendation and discovery platform built with Next.js 14. It features a JustWatch-like interface for browsing movies, user authentication, personalized watchlists, AI-powered movie recommendations, and discussion forums. The app integrates with The Movie Database (TMDB) API for movie data and uses Supabase for backend services.

## Development Commands

```bash
# Development
npm run dev          # Start development server (localhost:3000)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run Next.js linter

# Database Management  
# Run SQL scripts in Supabase SQL Editor:
# - scripts/create-watchlist-table.sql
# - scripts/create-discussions-schema.sql
# - scripts/create-threads-table.sql
# - scripts/create-movie-tables.sql
```

## Application Routes

- **/** - Seamless landing page with integrated movie discovery (single page experience)
- **/discover** - Full movie discovery and browsing interface with advanced filters
- **/watchlist** - User's personal movie watchlist (requires auth)
- **/movies/[id]** - Individual movie details and discussions

## User Experience Flow

The app features a **clean landing page experience**:
1. **Hero Section** - Full viewport landing with AI-powered messaging and call-to-action
2. **Feature Showcase** - Highlights of key application features
3. **Dedicated Discovery** - Users navigate to `/discover` for full movie browsing experience
4. **Focused Navigation** - Clear separation between landing page and movie discovery interface

## Environment Variables Required

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# TMDB API
TMDB_API_KEY=your_tmdb_api_key
TMDB_ACCESS_TOKEN=your_tmdb_access_token

# AI Integration
GEMINI_API_KEY=your_gemini_api_key
```

## Architecture & Key Components

### Database Layer (Supabase)
- **supabase.ts**: Main client configuration with TypeScript types for all tables
- **supabase-admin.ts**: Admin client with service role for bypassing RLS
- Tables: `watchlist`, `discussions`, `discussion_reactions`, `threads`, `seen`, `movie_likes`
- Row Level Security (RLS) policies implemented for user data protection

### API Layer (Next.js App Router)
- **app/api/chat/route.ts**: AI chat integration with Gemini API, includes user movie profile context
- **app/api/discussions/route.ts**: Discussion CRUD with recursive reply fetching  
- **app/api/movie-review/route.ts**: AI movie review generation
- **app/api/movie-suggestions/route.ts**: Personalized recommendations

### External API Integration
- **lib/tmdb.ts**: Complete TMDB API wrapper with mock data fallback
- Supports search, discovery, popular/top-rated lists, genre filtering
- Regional content (Indian/Bollywood/Hindi movies)
- Image URL generation and utility functions

### UI Components
- **Shadcn/ui**: Complete component library with custom theming
- **Theme**: Dark mode by default with yellow accent color
- **Responsive Design**: Mobile-first with Tailwind CSS
- **Component Structure**: Modular components in `/components` directory

### Key Features
1. **Movie Discovery**: Search, filter by genre/rating/year, popular/top-rated lists
2. **Personalized Watchlist**: User-specific movie collections with heart/like system
3. **AI Chat**: Context-aware movie recommendations using user's viewing history
4. **Discussion Forums**: Threaded discussions with reactions per movie
5. **Regional Content**: Special focus on Indian/Bollywood cinema

## Development Guidelines

### Database Operations
- Always check for table existence before operations (handle 42P01 errors)
- Use RLS-compliant queries for user data
- Implement proper error handling for Supabase operations

### TMDB API Integration  
- All TMDB functions include fallback to mock data if API unavailable
- Image URLs use getImageUrl() helper with size parameters
- Rate limiting considerations - cache responses when possible

### AI Integration
- Chat API builds context from user's movie profile (likes/watchlist/seen)
- Streaming responses implemented for better UX
- Error handling for API failures with user-friendly messages

### Component Development
- Use existing shadcn/ui components before creating custom ones
- Follow dark theme color scheme (yellow accents, gray backgrounds)
- Implement responsive design patterns consistently
- Handle loading and error states in all components

### Authentication Flow
- Supabase Auth with email/password and OAuth providers
- Session management with real-time state updates
- Protected routes and conditional UI rendering

## Common Issues & Solutions

### Missing Database Tables
- Error code 42P01 indicates missing tables
- Run appropriate SQL scripts from `/scripts` directory
- Check Supabase project setup and RLS policies

### TMDB API Failures
- Mock data automatically used as fallback
- Check API key configuration and rate limits
- All functions handle network errors gracefully

### Build Errors
- TypeScript and ESLint errors ignored in production build (next.config.mjs)
- Ensure environment variables are set for deployment
- Check Vercel deployment settings match project requirements