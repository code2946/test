# 🚀 Deployment Guide - Vercel

This guide walks you through deploying ScreenOnFire to Vercel with Supabase backend.

## Prerequisites

- [ ] Supabase project set up
- [ ] TMDB API account and keys
- [ ] Google Gemini API key
- [ ] Git repository
- [ ] Vercel account

## 🔧 Environment Setup

### 1. Copy Environment Variables
```bash
cp .env.example .env.local
```

### 2. Fill in Your Values
Edit `.env.local` with your actual credentials:

```env
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...

# TMDB (required for movie sync)
TMDB_API_KEY=your_api_key_here
TMDB_ACCESS_TOKEN=your_bearer_token_here

# Gemini AI (required for AI features)
GEMINI_API_KEY=your_gemini_key_here
```

## 📊 Database Setup

### 1. Run Database Schema
1. Open [Supabase Dashboard](https://app.supabase.com)
2. Go to SQL Editor
3. Copy and paste `scripts/create-movies-schema.sql`
4. Click **Run**

### 2. Seed Initial Data
```bash
npm run db:seed
```

### 3. Verify Setup
```bash
npm run dev
# Visit http://localhost:3000 - should show movies from database
```

## 🌐 Vercel Deployment

### 1. Connect Repository
1. Visit [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **New Project**
3. Import your Git repository
4. Configure project settings:
   - **Framework**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Install Command**: `npm install`

### 2. Environment Variables in Vercel
Add these environment variables in Vercel Dashboard:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY  
SUPABASE_SERVICE_ROLE_KEY

# TMDB API
TMDB_API_KEY
TMDB_ACCESS_TOKEN

# AI
GEMINI_API_KEY

# Production
NODE_ENV=production
```

### 3. Deploy
1. Click **Deploy**
2. Wait for build to complete
3. Visit your deployed URL

## ⏰ Automatic Movie Sync

Your deployment includes automatic movie sync every 24 hours:

- **Cron Schedule**: Daily at 2:00 AM UTC
- **Endpoint**: `/api/sync-movies`
- **Configuration**: `vercel.json`

### Manual Sync
```bash
# Force sync in production
npm run db:sync-prod

# Or via curl
curl https://your-app.vercel.app/api/sync-movies?force=true
```

## 🔍 Post-Deployment Checklist

- [ ] App loads successfully
- [ ] Movies display from database
- [ ] Search functionality works
- [ ] User authentication works
- [ ] Watchlist features work
- [ ] Movie details pages load
- [ ] AI chat responds correctly

## 📈 Monitoring

### Database Usage
- Monitor storage in Supabase Dashboard
- Check API usage in Usage section
- Review sync logs in `movie_sync_log` table

### Vercel Metrics
- Function execution logs
- Build and deployment status  
- Analytics and performance

## 🚨 Troubleshooting

### Build Fails
```bash
# Check types locally
npm run type-check

# Fix any TypeScript errors
npm run build
```

### Database Issues
```bash
# Test database connection
npm run db:seed

# Check Supabase logs
# Visit Supabase Dashboard → Logs
```

### Sync Problems
```bash
# Test sync manually
curl https://your-app.vercel.app/api/sync-movies

# Check TMDB API credentials
# Verify Supabase service role key
```

### Environment Variables
- Ensure all required variables are set in Vercel
- Check variable names match exactly
- Verify API keys are valid

## 🔄 Updates and Maintenance

### Deploy Updates
```bash
git add .
git commit -m "Update: your changes"
git push origin main
# Vercel auto-deploys from main branch
```

### Database Migrations
1. Update schema files
2. Run SQL in Supabase Dashboard
3. Test locally first
4. Deploy changes

### Monitoring Logs
- Vercel Functions logs
- Supabase logs
- Application console logs

## 📊 Free Tier Limits

### Vercel Free Tier
- ✅ 100GB bandwidth/month
- ✅ 100GB-hours compute/month  
- ✅ Hobby projects supported

### Supabase Free Tier  
- ✅ 500MB database storage
- ✅ 50k API requests/month
- ✅ 5GB bandwidth/month

Your app is optimized to stay well within these limits!

---

🎉 **Your ScreenOnFire app is now live on Vercel with automated movie updates!**

Visit your deployed app and enjoy the seamless movie discovery experience.