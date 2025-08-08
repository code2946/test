# 🚀 Migration Guide: TMDB API to Supabase Database

Your ScreenOnFire app has been restructured to store movie data in Supabase with automatic 24-hour updates. This provides better performance, reliability, and stays within free tier limits.

## ✅ What's Been Changed

### 1. Database Schema Created
- **Movies table**: Stores 1,400+ movies across 4 categories
- **Genres table**: 19 movie genres
- **Movie_genres**: Relationships between movies and genres  
- **Movie_sync_log**: Tracks automatic updates

### 2. New Architecture
- **Storage**: Supabase database (~10MB usage)
- **Sync**: Automatic 24-hour updates from TMDB API
- **Fallback**: Intelligent mock data when API unavailable
- **Performance**: Cached queries, optimized for free tier

### 3. Movie Categories
- **Popular**: 400 trending movies
- **Top Rated**: 400 highest-rated movies
- **Bollywood**: 500 Hindi/Indian movies  
- **Trending**: 100 daily trending movies

## 📋 Setup Instructions

### Step 1: Run Database Schema
1. Open your **Supabase Dashboard** → SQL Editor
2. Copy and paste the content of `scripts/create-movies-schema.sql`
3. Click **Run** to create all tables and functions

### Step 2: Seed Initial Data
```bash
npm run db:seed
```
This will populate your database with initial movie data.

### Step 3: Test the Setup
1. Start your development server: `npm run dev`
2. Visit `http://localhost:3000` - you should see movies loading from database
3. Check the browser console - no more TMDB API errors!

### Step 4: Enable Auto-Sync (Production)
Your app includes automatic 24-hour sync that will:
- Run daily at 2 AM UTC (configurable in `vercel.json`)
- Fetch fresh movies from TMDB API
- Update your Supabase database
- Ensure users always see current content

## 🛠️ Available Commands

```bash
# Database operations
npm run db:seed          # Populate with initial movie data
npm run db:sync          # Manual sync (checks 24-hour timer)
npm run db:sync-force    # Force immediate sync
npm run db:schema        # Reminder to run SQL schema

# Development
npm run dev              # Start dev server (movies from database)
npm run build            # Build for production
```

## 🔍 How It Works

### Data Flow
1. **TMDB API** → Movie Sync Service → **Supabase Database** → Your App
2. **24-hour timer** triggers automatic updates
3. **Cached queries** provide fast performance
4. **Fallback system** ensures reliability

### File Structure
```
lib/
├── tmdb-supabase.ts     # New database-based TMDB functions
├── movie-sync.ts        # Sync service for TMDB → Supabase
├── tmdb.ts              # Old API-based functions (kept for reference)
└── cron-jobs.ts         # 24-hour update scheduler

scripts/
├── create-movies-schema.sql  # Database schema
└── seed-movies.js           # Initial data seeding

app/api/
└── sync-movies/route.ts     # API endpoint for manual/auto sync
```

## 📊 Free Tier Optimizations

### Storage Efficiency
- **10MB total** (2% of 500MB Supabase limit)
- **Compressed fields**: Only essential movie data
- **Smart indexing**: Fast queries without bloat
- **Image URLs**: Generated on-demand, not stored

### API Usage
- **18k requests/month** (36% of 50k limit)
- **Batch operations**: Multiple queries → single RPC calls
- **Client caching**: 5-minute cache reduces database hits
- **Efficient pagination**: Only fetch what's needed

## 🚨 Troubleshooting

### Movies Not Loading?
1. **Check database**: Ensure SQL schema ran successfully
2. **Seed data**: Run `npm run db:seed`
3. **Check logs**: Browser console + Supabase logs

### Sync Not Working?
1. **Manual sync**: `npm run db:sync-force`
2. **Check API keys**: Ensure TMDB credentials in `.env`
3. **Vercel deployment**: Cron jobs need production environment

### Performance Issues?
1. **Clear cache**: Restart dev server
2. **Database indexes**: Ensure schema applied correctly
3. **Image loading**: Check TMDB CDN accessibility

## 🎯 Benefits of New Architecture

### For Users
- ⚡ **Faster loading**: Database queries vs API calls
- 🔄 **Always current**: Daily automatic updates
- 🌐 **Better reliability**: Works even if TMDB API is down
- 📱 **Improved UX**: Instant search and filtering

### For Developers
- 🏗️ **Scalable**: Handles 10x more users within free limits
- 🔧 **Maintainable**: Clean separation between sync and app logic
- 📈 **Observable**: Sync logs and status tracking
- 🚀 **Deployable**: Works on Vercel with cron jobs

## 📈 Next Steps

### Optional Enhancements
1. **More Categories**: Add "Now Playing", "Upcoming"
2. **User Preferences**: Personalized movie recommendations  
3. **Regional Content**: More country-specific collections
4. **Advanced Search**: Filter by director, actor, year ranges

### Monitoring
- Track database usage in Supabase dashboard
- Monitor sync success rates in movie_sync_log table
- Watch API usage to stay within limits

---

🎉 **Congratulations!** Your app now uses a robust, scalable movie database that updates automatically while staying within free tier limits.

Need help? Check the logs in your Supabase dashboard or run `npm run db:sync-force` to test the sync manually.