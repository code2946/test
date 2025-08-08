# Supabase Free Tier Optimization Guide

## Database Limits (Free Tier)
- **Storage**: 500MB total
- **Database Size**: Up to 500MB
- **Rows**: No specific limit, but storage-constrained
- **API Requests**: 50,000 per month
- **Bandwidth**: 5GB per month

## Our Optimization Strategy

### Storage Optimization
- **Movies Table**: ~15,000 movies × 0.5KB = ~7.5MB
- **Genres Table**: 19 genres × 0.1KB = ~0.002MB  
- **Movie_Genres**: ~45,000 relationships × 0.05KB = ~2.25MB
- **Sync Log**: Minimal overhead (~0.1MB)
- **Total Estimated**: ~10MB (2% of 500MB limit)

### Data Structure Optimizations

#### 1. Compressed Fields
```sql
-- Instead of full URLs, store only paths
poster_path VARCHAR(100)  -- vs storing full 200+ char URLs
backdrop_path VARCHAR(100)

-- Optimized text fields
title VARCHAR(200)        -- vs unlimited TEXT
overview TEXT            -- Only for descriptions that need it
```

#### 2. Efficient Indexing
```sql
-- Only essential indexes to balance performance vs storage
CREATE INDEX idx_movies_category ON movies(category);
CREATE INDEX idx_movies_popularity ON movies(popularity DESC);
CREATE INDEX idx_movies_vote_average ON movies(vote_average DESC);
```

#### 3. Smart Caching Strategy
- **Client-side**: 5-minute cache for frequent queries
- **Database functions**: Reduce multiple queries to single RPC calls
- **Image URLs**: Generate on-the-fly vs storing full URLs

### API Request Optimization

#### Current Usage Estimate (Monthly)
- **Popular Movies**: ~2,000 requests (daily users × page loads)
- **Search**: ~5,000 requests 
- **Movie Details**: ~8,000 requests
- **Categories**: ~3,000 requests
- **Sync Operations**: ~100 requests (automated)
- **Total**: ~18,000 requests/month (36% of 50k limit)

#### Optimization Techniques
1. **RPC Functions**: Batch multiple queries into single calls
2. **Client Caching**: Reduce duplicate requests
3. **Pagination**: Efficient LIMIT/OFFSET queries
4. **Connection Pooling**: Reuse database connections

### Bandwidth Optimization

#### Image Strategy
- **TMDB CDN**: Images served directly from TMDB (doesn't count against our bandwidth)
- **Poster Links**: Store only path, generate full URLs client-side
- **Lazy Loading**: Load images only when needed

#### Data Transfer
- **Compressed Responses**: Use RPC functions that return only needed fields
- **Pagination**: Small page sizes (20 movies per request)
- **Selective Fields**: Don't fetch unused movie data

## Movie Categories & Sync Strategy

### Categories Stored (Optimized for Variety)
1. **Popular**: 400 movies (20 pages × 20 movies)
2. **Top Rated**: 400 movies (20 pages × 20 movies)  
3. **Bollywood**: 500 movies (25 pages × 20 movies)
4. **Trending**: 100 movies (5 pages × 20 movies)

**Total**: ~1,400 movies rotating every 24 hours

### Sync Efficiency
- **Upsert Operations**: Update existing, insert new (no duplicates)
- **Batch Processing**: Insert multiple movies per query
- **Error Recovery**: Continue sync even if some categories fail
- **Rate Limiting**: 250ms delay between TMDB API calls

## Database Functions (Space Savers)

### Custom Functions Replace Multiple Queries
```sql
-- Instead of 3 separate queries:
SELECT * FROM movies WHERE category = 'popular';
SELECT genres.* FROM genres JOIN movie_genres ON...
SELECT COUNT(*) FROM movies WHERE category = 'popular';

-- Use single RPC call:
SELECT * FROM get_movies_by_category('popular', 1, 20);
```

### Benefits
- **Reduced API Calls**: 1 call vs 3+ calls
- **Server-side Processing**: Less data transferred
- **Consistent Results**: Atomic operations

## Monitoring & Maintenance

### Usage Tracking
```sql
-- Monitor table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public';
```

### Cleanup Strategies
1. **Old Trending**: Remove movies older than 30 days from trending
2. **Duplicate Removal**: Clean up any duplicate entries
3. **Sync Log Cleanup**: Keep only last 30 days of logs

### Scaling Options
If approaching limits:
1. **Reduce Categories**: Focus on most-used categories
2. **Shorter Descriptions**: Truncate overview field
3. **Image Optimization**: Use smaller image sizes
4. **Archive Old Data**: Move old movies to separate table

## Implementation Checklist

- [x] Database schema optimized for storage
- [x] Efficient indexing strategy
- [x] RPC functions for batch operations
- [x] Client-side caching implementation
- [x] Image URL generation (no storage)
- [x] Sync service with rate limiting
- [x] Error handling and recovery
- [x] Monitoring and cleanup functions

## Expected Performance
- **Load Time**: <2 seconds for movie grids
- **Search**: <1 second for text queries
- **Storage Usage**: <50MB (10% of limit)
- **API Usage**: <20k requests/month (40% of limit)
- **Bandwidth**: <1GB/month (20% of limit)

This architecture provides room for 10x growth while staying within free tier limits.