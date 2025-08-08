// Initial movie data seeding script
// Run this script to populate the database with initial movie data

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Mock movie data for seeding (optimized for free tier)
const seedMovies = [
  {
    id: 550,
    title: "Fight Club",
    overview: "A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy.",
    release_date: "1999-10-15",
    vote_average: 8.4,
    vote_count: 26280,
    popularity: 71.234,
    poster_path: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
    backdrop_path: "/fCayJrkfRaCRCTh8GqN30f8oyQF.jpg",
    original_language: "en",
    original_title: "Fight Club",
    adult: false,
    category: "popular",
    region: "US",
    genre_ids: [18, 53]
  },
  {
    id: 238,
    title: "The Shawshank Redemption",
    overview: "Framed in the 1940s for the double murder of his wife and her lover, upstanding banker Andy Dufresne begins a new life at the Shawshank prison.",
    release_date: "1994-09-23",
    vote_average: 9.3,
    vote_count: 24500,
    popularity: 95.123,
    poster_path: "/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",
    backdrop_path: "/iNh3BivHyg5sQRPP1KOkzguEX0H.jpg",
    original_language: "en",
    original_title: "The Shawshank Redemption",
    adult: false,
    category: "top_rated",
    region: "US",
    genre_ids: [18, 80]
  },
  {
    id: 424,
    title: "Schindler's List",
    overview: "The true story of how businessman Oskar Schindler saved over a thousand Jewish lives from the Nazis.",
    release_date: "1993-12-15",
    vote_average: 9.0,
    vote_count: 15200,
    popularity: 67.890,
    poster_path: "/sF1U4EUQS8YHUYjNl3pMGNIQyr0.jpg",
    backdrop_path: "/loRmRzQXZeqG78TqZuyvSlEQfZb.jpg",
    original_language: "en",
    original_title: "Schindler's List",
    adult: false,
    category: "top_rated",
    region: "US",
    genre_ids: [18, 36, 10752]
  },
  {
    id: 278,
    title: "The Godfather",
    overview: "Spanning the years 1945 to 1955, a chronicle of the fictional Italian-American Corleone crime family.",
    release_date: "1972-03-14",
    vote_average: 9.2,
    vote_count: 18900,
    popularity: 88.456,
    poster_path: "/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
    backdrop_path: "/tmU7GeKVybMWFButWEGl2M4GeiP.jpg",
    original_language: "en",
    original_title: "The Godfather",
    adult: false,
    category: "top_rated",
    region: "US",
    genre_ids: [18, 80]
  },
  {
    id: 680,
    title: "Pulp Fiction",
    overview: "A burger-loving hit man, his philosophical partner, a drug-addled gangster's moll and a washed-up boxer converge in this sprawling crime caper.",
    release_date: "1994-09-10",
    vote_average: 8.9,
    vote_count: 27300,
    popularity: 92.789,
    poster_path: "/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg",
    backdrop_path: "/4cDFJr4HnXN5AdPw4AKrmLlMWdO.jpg",
    original_language: "en",
    original_title: "Pulp Fiction",
    adult: false,
    category: "popular",
    region: "US",
    genre_ids: [80, 18]
  },
  {
    id: 155,
    title: "The Dark Knight",
    overview: "Batman raises the stakes in his war on crime with the help of Lt. Jim Gordon and District Attorney Harvey Dent.",
    release_date: "2008-07-18",
    vote_average: 9.0,
    vote_count: 32100,
    popularity: 99.567,
    poster_path: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    backdrop_path: "/hqkIcbrOHL86UncnHIsHVcVmzue.jpg",
    original_language: "en",
    original_title: "The Dark Knight",
    adult: false,
    category: "popular",
    region: "US",
    genre_ids: [28, 80, 18, 53]
  },
  // Bollywood Movies
  {
    id: 19404,
    title: "Dilwale Dulhania Le Jayenge",
    overview: "Raj and Simran meet during a trip across Europe and fall in love, but Simran's father has already arranged her marriage.",
    release_date: "1995-10-20",
    vote_average: 8.7,
    vote_count: 4200,
    popularity: 45.123,
    poster_path: "/ktejodbcdCPXbMMdnpI9BUxW6O8.jpg",
    backdrop_path: "/90ez6ArvpO8bvpyIngBuwXOqJm5.jpg",
    original_language: "hi",
    original_title: "दिलवाले दुल्हनिया ले जायेंगे",
    adult: false,
    category: "bollywood",
    region: "IN",
    genre_ids: [35, 18, 10749]
  },
  {
    id: 19551,
    title: "3 Idiots",
    overview: "In the tradition of 'Dil Chahta Hai' and 'Zindagi Na Milegi Dobara', 'Three Idiots' is a coming-of-age film that revolves around the lives of three friends.",
    release_date: "2009-12-25",
    vote_average: 8.4,
    vote_count: 3800,
    popularity: 38.567,
    poster_path: "/66A9MqXOyVFCssoloscw38nJp8B.jpg",
    backdrop_path: "/cQvc9N6JiMVKqol3wcYrGshsIdZ.jpg",
    original_language: "hi",
    original_title: "3 Idiots",
    adult: false,
    category: "bollywood",
    region: "IN",
    genre_ids: [35, 18]
  },
  {
    id: 13342,
    title: "Dangal",
    overview: "Dangal is an extraordinary true story based on the life of Mahavir Singh and his two daughters, Geeta and Babita Phogat.",
    release_date: "2016-12-21",
    vote_average: 8.3,
    vote_count: 2900,
    popularity: 42.890,
    poster_path: "/lZjUT2NXVyJdMDNVVtp73wYLEhh.jpg",
    backdrop_path: "/c3F4P2oauA7IQmy4pIDhUzzTUuU.jpg",
    original_language: "hi",
    original_title: "दंगल",
    adult: false,
    category: "bollywood",
    region: "IN",
    genre_ids: [18, 10751]
  },
  {
    id: 486589,
    title: "Red Notice",
    overview: "An Interpol-issued Red Notice is a global alert to hunt and capture the world's most wanted. But when a daring heist brings together the FBI's top profiler and two rival criminals, there's no telling what will happen.",
    release_date: "2021-11-05",
    vote_average: 6.8,
    vote_count: 4200,
    popularity: 156.789,
    poster_path: "/lAXONuqg41NwUMuzMiFvicDET9Y.jpg",
    backdrop_path: "/8Y43POKjjKDGI9MH89NW0NAzzp8.jpg",
    original_language: "en",
    original_title: "Red Notice",
    adult: false,
    category: "trending",
    region: "US",
    genre_ids: [28, 35, 80, 53]
  }
]

async function seedDatabase() {
  console.log('🌱 Starting database seeding...')

  try {
    // 1. Insert movies
    console.log('📽️  Inserting movies...')
    const movieData = seedMovies.map(({ genre_ids, ...movie }) => movie)
    
    const { error: movieError } = await supabase
      .from('movies')
      .upsert(movieData, { onConflict: 'id' })

    if (movieError) {
      throw new Error(`Failed to insert movies: ${movieError.message}`)
    }
    console.log(`✅ Inserted ${movieData.length} movies`)

    // 2. Insert movie-genre relationships
    console.log('🎭 Inserting movie-genre relationships...')
    const genreData = []
    
    seedMovies.forEach(movie => {
      movie.genre_ids.forEach(genreId => {
        genreData.push({
          movie_id: movie.id,
          genre_id: genreId
        })
      })
    })

    const { error: genreError } = await supabase
      .from('movie_genres')
      .upsert(genreData, { onConflict: 'movie_id,genre_id' })

    if (genreError) {
      throw new Error(`Failed to insert movie genres: ${genreError.message}`)
    }
    console.log(`✅ Inserted ${genreData.length} movie-genre relationships`)

    // 3. Update sync log to mark initial seed as completed
    console.log('📊 Updating sync log...')
    const categories = ['popular', 'top_rated', 'bollywood', 'trending']
    
    for (const category of categories) {
      const { error: syncError } = await supabase
        .from('movie_sync_log')
        .upsert({
          category,
          movies_synced: seedMovies.filter(m => m.category === category).length,
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          status: 'completed',
          next_sync_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
        }, { onConflict: 'category' })

      if (syncError) {
        console.warn(`Warning: Failed to update sync log for ${category}:`, syncError.message)
      }
    }
    console.log('✅ Updated sync log')

    // 4. Verify the seeding
    console.log('🔍 Verifying seeded data...')
    
    const { data: movieCount, error: countError } = await supabase
      .from('movies')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      throw new Error(`Failed to count movies: ${countError.message}`)
    }

    const { data: genreCount, error: genreCountError } = await supabase
      .from('movie_genres')
      .select('*', { count: 'exact', head: true })

    if (genreCountError) {
      throw new Error(`Failed to count movie genres: ${genreCountError.message}`)
    }

    console.log('📈 Database Stats:')
    console.log(`   Movies: ${movieCount}`)
    console.log(`   Movie-Genre relationships: ${genreCount}`)

    // 5. Test database functions
    console.log('🧪 Testing database functions...')
    
    const { data: popularMovies, error: popularError } = await supabase
      .rpc('get_movies_by_category', {
        category_name: 'popular',
        page_num: 1,
        page_size: 5
      })

    if (popularError) {
      console.warn('Warning: Popular movies function test failed:', popularError.message)
    } else {
      console.log(`✅ Popular movies function working: ${popularMovies?.length || 0} results`)
    }

    console.log('\n🎉 Database seeding completed successfully!')
    console.log('\n📋 Next steps:')
    console.log('1. Run the SQL schema in your Supabase project: scripts/create-movies-schema.sql')
    console.log('2. Optionally trigger full sync: GET /api/sync-movies?force=true')
    console.log('3. Your app should now use the database instead of TMDB API')

  } catch (error) {
    console.error('❌ Seeding failed:', error.message)
    process.exit(1)
  }
}

// Run seeding
seedDatabase()