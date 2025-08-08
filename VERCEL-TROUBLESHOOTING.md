# 🚨 Vercel Deployment Troubleshooting

Your app should now work on Vercel! Here's how to diagnose and fix common deployment issues:

## 🔧 Quick Fix Checklist

### 1. **Visit Debug Page First**
After deployment, go to: `https://your-app.vercel.app/debug`

This will show you:
- ✅/❌ Environment variables status
- ✅/❌ Database connection
- ✅/❌ Movies/genres data availability
- ✅/❌ RPC functions working

### 2. **Common Issues & Solutions**

#### **Issue: No Movies Loading**
**Symptoms:** App loads but shows empty movie grids or loading states

**Solutions:**
1. **Missing Database Schema**
   ```sql
   -- Run this in Supabase SQL Editor
   -- Copy from: scripts/create-movies-schema.sql
   ```

2. **No Movie Data**
   ```bash
   # Force sync movies
   https://your-app.vercel.app/api/sync-movies?force=true
   ```

3. **Environment Variables Missing**
   - Check Vercel Dashboard → Settings → Environment Variables
   - Ensure all required variables are set (see .env.example)

#### **Issue: Database Connection Failed**
**Symptoms:** Debug page shows database: connected ❌

**Solutions:**
1. Check Supabase environment variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
   ```

2. Verify Supabase project is active and not paused

#### **Issue: RPC Functions Not Available**
**Symptoms:** Debug shows RPC Functions: available ❌

**Solutions:**
1. Run complete database schema in Supabase SQL Editor
2. Check for SQL errors in Supabase logs
3. App will fallback to direct queries automatically

#### **Issue: Build Failures**
**Symptoms:** Vercel deployment fails during build

**Solutions:**
1. Check Vercel build logs
2. Ensure all dependencies installed: `npm install`
3. Fix TypeScript errors: `npm run type-check`

## 🛠️ Debug Tools Available

### **Debug Dashboard**
- **URL:** `/debug`
- **Purpose:** Comprehensive system status check
- **Use:** First stop for any issues

### **API Endpoints**
```bash
# Debug system status
GET /api/debug

# Force sync movies
GET /api/sync-movies?force=true

# Check sync status
GET /api/sync-movies
```

### **Database Functions Test**
```sql
-- Test in Supabase SQL Editor
SELECT * FROM get_movies_by_category('popular', 1, 5);
SELECT * FROM search_movies('batman', 1, 5);
```

## 📋 Step-by-Step Recovery

### **If App Completely Broken:**

1. **Check Environment Variables**
   ```bash
   # Required in Vercel Dashboard:
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY
   TMDB_API_KEY
   TMDB_ACCESS_TOKEN
   GEMINI_API_KEY
   ```

2. **Run Database Schema**
   - Open Supabase Dashboard
   - Go to SQL Editor
   - Copy entire `scripts/create-movies-schema.sql`
   - Click Run

3. **Seed Initial Data**
   - Visit: `https://your-app.vercel.app/api/sync-movies?force=true`
   - Wait 2-3 minutes for completion
   - Check response for success/error messages

4. **Verify Fix**
   - Visit: `https://your-app.vercel.app/debug`
   - All items should show ✅
   - Visit main app: `https://your-app.vercel.app`
   - Movies should load

### **If Partial Issues:**

1. **Movies Show But Search Broken**
   - RPC functions likely missing
   - Re-run database schema
   - Check Supabase logs for errors

2. **Some Categories Empty**
   - Force sync specific category:
   ```bash
   POST /api/sync-movies
   Body: {"category": "bollywood", "force": true}
   ```

3. **Slow Loading**
   - Database queries working, but caching not optimal
   - This is expected initially, improves with usage

## 🔍 Advanced Debugging

### **Check Vercel Logs**
1. Go to Vercel Dashboard → Functions
2. Check `/api/sync-movies` and `/api/debug` logs
3. Look for error patterns

### **Check Supabase Logs**
1. Go to Supabase Dashboard → Logs
2. Filter by timestamp of issues
3. Look for SQL errors or permission issues

### **Test Database Manually**
```sql
-- In Supabase SQL Editor
SELECT COUNT(*) FROM movies;
SELECT COUNT(*) FROM genres;
SELECT category, COUNT(*) FROM movies GROUP BY category;
```

## ⚡ Fallback Behavior

**Good News:** Even if everything fails, your app will still work!

- **Mock Data:** App automatically uses built-in movie data
- **All Features Work:** Search, categories, watchlist, etc.
- **User Experience:** Seamless - users won't notice the difference
- **Performance:** Still fast and responsive

## 🚀 Success Indicators

Your deployment is successful when:
- ✅ Debug page shows all green checkmarks
- ✅ Homepage loads with movie grid
- ✅ Search returns results
- ✅ Different categories show different movies
- ✅ Movie details pages load
- ✅ Watchlist functionality works

## 📞 Still Having Issues?

1. **Share debug info:**
   - Visit `/debug` page
   - Copy the JSON output
   - Include in your issue report

2. **Check these URLs:**
   ```
   https://your-app.vercel.app/debug
   https://your-app.vercel.app/api/debug
   https://your-app.vercel.app/api/sync-movies
   ```

3. **Provide details:**
   - What specific error messages you see
   - Which features work vs don't work
   - Screenshots of debug page

---

🎉 **Your app is designed to be resilient!** Even with database issues, users will see a working movie app with quality content.