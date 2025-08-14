# Advanced Movie Recommendation System Setup

This guide will help you set up the production-ready content-based recommendation system for ScreenOnFire.

## Overview

The recommendation system provides:
- **Content-Based Filtering**: Uses movie features like genre, cast, directors, cinematography
- **Feature Vector Engine**: L2-normalized vectors with configurable weights
- **Real-time Recommendations**: Sub-second similarity computation via API
- **Interactive UI**: Two-pane interface with live weight adjustment
- **Hybrid Ready**: Supports collaborative filtering integration

## Setup Steps

### 1. Database Schema

Run the recommendation schema SQL in your Supabase SQL Editor:

```bash
npm run rec:schema
# Then copy and execute scripts/create-recommendation-schema.sql in Supabase
```

This creates:
- `movie_vectors` table for precomputed feature vectors
- `cf_scores` table for collaborative filtering (optional)
- Enhanced `movies` table with cast, directors, cinematographers, keywords columns

### 2. Enhanced Movie Data Ingestion

Fetch detailed movie data including cast, crew, and keywords:

```bash
# Enhance existing movies with full cast/crew data
npm run rec:ingest

# OR ingest new popular/trending movies
npm run rec:ingest-new

# OR do both operations
node scripts/enhanced-movie-ingestion.js both
```

**Requirements:**
- `TMDB_API_KEY` environment variable
- Supabase service role key
- Internet connection for TMDB API calls

### 3. Feature Vector Computation

Generate content vectors for all movies:

```bash
# Compute vectors for movies in batches of 100, max 10 batches
npm run rec:vectors

# Or customize batch processing:
node scripts/compute-vectors.js 50 20  # 50 per batch, 20 batches max
```

**This process:**
- Reads movie metadata from database
- Computes L2-normalized feature vectors
- Stores vectors in `movie_vectors` table
- Uses genres, ratings, cast, directors, cinematography, keywords, year buckets

### 4. Verify Setup

Check system status:

```bash
npm run rec:status
# Should show movies count, vectorized count, and readiness status
```

### 5. Access the Interface

Navigate to `/recommendations` in your app to use the two-pane recommender interface.

## Feature Vector Details

### Dimensions (Total: ~2500+)
- **Genres**: 19 dimensions (one-hot encoding)
- **Rating**: 1 dimension (Wilson score confidence interval)  
- **Year Buckets**: 6 dimensions (<=1980, 1981-1990, etc.)
- **Runtime Buckets**: 4 dimensions (short, standard, long, epic)
- **Cast**: 512 dimensions (hashed bag-of-names)
- **Directors**: 512 dimensions (hashed bag-of-names)
- **Cinematographers**: 512 dimensions (hashed bag-of-names)
- **Keywords**: 512 dimensions (hashed bag-of-terms)

### Configurable Weights
Users can adjust importance of each feature category:
- **Genre**: How important are matching genres?
- **Rating**: Preference for highly-rated movies?
- **Cast**: Importance of similar actors?
- **Director**: Preference for same/similar directors?
- **Cinematography**: Visual style similarity?
- **Keywords**: Thematic content matching?
- **Year**: Preference for same era movies?

## API Endpoints

### POST /api/recommend
Main recommendation endpoint.

**Request:**
```json
{
  "selectedIds": [238, 550, 13],
  "weights": {
    "genre": 1.0,
    "rating": 0.5,
    "cast": 0.8,
    "director": 1.0,
    "cinema": 0.7,
    "keywords": 0.6,
    "year": 0.3
  },
  "limit": 30,
  "excludeSelected": true,
  "hybrid": false,
  "minSimilarity": 0.1
}
```

**Response:**
```json
{
  "results": [
    {
      "id": 680,
      "title": "Pulp Fiction", 
      "poster_path": "/path.jpg",
      "vote_average": 8.5,
      "similarity_score": 0.87,
      "genres": ["Crime", "Drama"]
    }
  ],
  "metadata": {
    "selectedCount": 3,
    "candidatesEvaluated": 5000,
    "hybrid": false
  }
}
```

### GET /api/recommend
System status check.

**Response:**
```json
{
  "status": "ready",
  "movies": 15000,
  "vectorized": 15000,
  "vectorization_complete": true,
  "hybrid_available": false
}
```

## Performance Optimization

### For Large Datasets (50K+ movies)
1. **Install pgvector extension** in Supabase:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ALTER TABLE movie_vectors ADD COLUMN vector_pgv vector(2500);
   CREATE INDEX ON movie_vectors USING ivfflat (vector_pgv vector_cosine_ops);
   ```

2. **Update API to use ANN search** instead of brute-force cosine computation

3. **Enable caching** - API includes 5-minute response cache

### Memory Usage
- ~2.5KB per movie vector
- 15K movies = ~37MB vector storage
- API loads vectors into memory for computation

## Maintenance

### Daily Tasks
```bash
# Refresh movie data
npm run rec:ingest-new

# Recompute vectors for updated movies  
npm run rec:vectors
```

### Weekly Tasks
```bash
# Full data refresh
npm run rec:ingest
npm run rec:vectors
```

## Troubleshooting

### Common Issues

**"No vectors found for selected movies"**
- Run `npm run rec:vectors` to compute vectors
- Check that selected movies exist in database

**"No similar movies found"**
- Lower `minSimilarity` threshold in request
- Adjust feature weights
- Ensure sufficient movies are vectorized

**TMDB API Rate Limiting**
- Script includes built-in rate limiting (40 requests/10 seconds)
- Increase delay between requests if needed

**Database Connection Issues**
- Verify Supabase credentials
- Check database connection and table permissions
- Ensure RLS policies allow read access

### Environment Variables Required

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
TMDB_API_KEY=your_tmdb_api_key
```

## Architecture Notes

- **Stateless API**: Each recommendation request is independent
- **Vector Caching**: Precomputed vectors stored in database
- **Real-time Weights**: Feature weights applied at query time
- **Scalable Design**: Ready for pgvector ANN indexes
- **Hybrid Support**: Framework for collaborative filtering integration

The system is designed for production use with proper error handling, caching, rate limiting, and database optimization.