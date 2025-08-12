# TMDB Server-Side Migration Guide

This guide covers migrating from client-side TMDB API calls to server-side proxies to fix ISP blocking issues in India.

## 🎯 Problem Solved
- ❌ **Before**: Browser directly calls `api.themoviedb.org` → Blocked by Indian ISPs
- ✅ **After**: Browser calls your domain → Vercel server calls TMDB → Works everywhere!

## 📋 Environment Setup

### 1. Vercel Environment Variables
Set these in your Vercel dashboard or via CLI:

```bash
# Required: TMDB v4 Read Access Token (Bearer token)
TMDB_READ_TOKEN=eyJhbGciOiJIUzI1NiJ9.your_actual_token_here

# Optional: Keep for backward compatibility
TMDB_API_KEY=your_v3_api_key_here
TMDB_ACCESS_TOKEN=your_v3_access_token_here
```

### 2. Local Development (.env.local)
```bash
TMDB_READ_TOKEN=eyJhbGciOiJIUzI1NiJ9.your_actual_token_here
```

### 3. Test Your Token
```bash
# Test that your proxy works (replace with your domain)
curl "https://your-domain.vercel.app/api/tmdb?path=/3/configuration"

# Should return TMDB configuration JSON, not an error
```

## 🗂️ File Structure

```
app/
├── api/
│   ├── tmdb/route.ts           # JSON API proxy
│   └── tmdb-image/route.ts     # Image proxy
lib/
├── tmdb-client.ts              # NEW: Client-side functions (uses proxy)
├── tmdb-server.ts              # NEW: Server-side functions (direct TMDB)
└── tmdb.ts                     # OLD: Direct TMDB calls (keep for now)
```

## 🔄 Migration Examples

### API Calls - Before vs After

**BEFORE** (❌ Client calls TMDB directly):
```typescript
// This gets blocked in India
const response = await fetch('https://api.themoviedb.org/3/movie/popular', {
  headers: {
    'Authorization': `Bearer ${TMDB_ACCESS_TOKEN}` // ⚠️ Exposed to client!
  }
})
```

**AFTER** (✅ Client calls your proxy):
```typescript
// Import from new client module
import { getPopularMovies } from '@/lib/tmdb-client'

// This works everywhere
const movies = await getPopularMovies(1)
```

### Image URLs - Before vs After

**BEFORE** (❌ Images from TMDB):
```typescript
const imageUrl = `https://image.tmdb.org/t/p/w500${poster_path}`
```

**AFTER** (✅ Images via your proxy):
```typescript
import { getImageUrl } from '@/lib/tmdb-client'

const imageUrl = getImageUrl(poster_path, 'w500')
// Returns: /api/tmdb-image?path=%2Ft%2Fp%2Fw500%2Fposter.jpg
```

### Server Components (SSR)

**NEW** - Server-side fetching (no client calls at all):
```typescript
// app/movies/page.tsx
import { serverGetPopularMovies } from '@/lib/tmdb-server'

export default async function MoviesPage() {
  // Happens on server, cached for 1 hour
  const movies = await serverGetPopularMovies(1)
  
  return (
    <div>
      {movies.results.map(movie => (
        <div key={movie.id}>{movie.title}</div>
      ))}
    </div>
  )
}
```

## 🔧 Implementation Details

### API Proxy Features
- **Edge Runtime**: Fast worldwide execution
- **Caching**: 1 hour for JSON, 24 hours for images
- **Retry Logic**: Exponential backoff for 429/5xx errors
- **CORS**: Allows cross-origin requests
- **Security**: No API keys exposed to client

### Route Handler Endpoints

1. **JSON API Proxy**: `/api/tmdb?path=/3/movie/550&language=en-US`
2. **Image Proxy**: `/api/tmdb-image?path=/t/p/w500/poster.jpg`

### Error Handling
- Network failures → Exponential backoff retry
- 4xx errors → Immediate failure (except 429)
- 5xx errors → Retry with backoff
- API down → Graceful fallback to mock data

## ✅ Migration Checklist

### Phase 1: Setup
- [ ] Add `TMDB_READ_TOKEN` to Vercel environment variables
- [ ] Deploy new route handlers (`/api/tmdb` and `/api/tmdb-image`)
- [ ] Test proxy endpoints with curl

### Phase 2: Client Migration
- [ ] Replace `import` statements:
  - `from '@/lib/tmdb'` → `from '@/lib/tmdb-client'`
- [ ] Update image URLs to use `getImageUrl()` from client module
- [ ] Test in development

### Phase 3: Server Components (Optional)
- [ ] Use `tmdb-server.ts` functions in Server Components
- [ ] Replace client-side fetching with SSR where appropriate

### Phase 4: Verification
- [ ] Deploy to Vercel
- [ ] Check DevTools Network tab - should see only your domain
- [ ] Test from India without VPN
- [ ] Clear Vercel cache if needed: `vercel --debug`

## 🧪 Test URLs

Test these URLs in your deployed app:

1. **Configuration**: `/api/tmdb?path=/3/configuration`
2. **Popular Movies**: `/api/tmdb?path=/3/movie/popular&language=en-US`
3. **Sample Image**: `/api/tmdb-image?path=/t/p/w185/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg`
4. **SSR Example**: `/example-ssr` (if you created the example page)

## 🔍 Verification Steps

### Network Tab Check
1. Open DevTools → Network tab
2. Load a page with movies
3. Filter by domain
4. ✅ Should see: `your-domain.vercel.app/api/tmdb*`
5. ❌ Should NOT see: `api.themoviedb.org` or `image.tmdb.org`

### India VPN Test
1. Use VPN to connect from India
2. Load your movie pages
3. All images and data should load normally
4. No TMDB blocked errors in console

## 🚀 Performance Benefits

- **Reduced Client Bundle**: No API keys in JavaScript
- **Better Caching**: Server-side caching + CDN
- **Faster Images**: Served via Vercel Edge
- **Reliability**: Retry logic for transient failures

## 🔐 Security Improvements

- **No Exposed Keys**: TMDB token never reaches browser
- **Rate Limiting**: Server controls request frequency  
- **CORS Control**: Restrict origins if needed
- **Request Validation**: Server validates all requests

## 🛠️ Advanced Configuration

### Custom Caching
```typescript
// Extend cache times in route handlers
next: { revalidate: 7200 } // 2 hours instead of 1
```

### Domain Restrictions
```typescript
// In route.ts - restrict CORS to your domain
'Access-Control-Allow-Origin': 'https://yourdomain.com'
```

### Redis/KV Caching
```typescript
// Replace Next.js cache with external cache
const cached = await kv.get(`tmdb:${cacheKey}`)
if (cached) return cached
```

## 🏁 Final Notes

- **Backward Compatibility**: Keep old `tmdb.ts` during migration
- **Gradual Migration**: Migrate one component at a time
- **Monitor Logs**: Check Vercel function logs for errors
- **Cache Clearing**: Use `?v=2` query param to bust cache during testing

## 📞 Troubleshooting

### "TMDB_READ_TOKEN not found"
- Check Vercel environment variables
- Redeploy after adding env vars

### Images not loading
- Check `/api/tmdb-image` endpoint directly
- Verify image path format: `/t/p/w500/filename.jpg`

### API errors in India
- Verify you're using proxy endpoints, not direct TMDB calls
- Check Network tab for blocked requests

---

**Success Criteria**: Browser never contacts `api.themoviedb.org` or `image.tmdb.org` directly! 🎉