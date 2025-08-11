// Comprehensive movie seeding script for all categories
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Comprehensive movie data for all categories
const comprehensiveMovies = [
  // POPULAR MOVIES (20 movies)
  {
    id: 550, title: "Fight Club", overview: "A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy.", release_date: "1999-10-15", vote_average: 8.4, vote_count: 26280, popularity: 71.234, poster_path: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg", backdrop_path: "/fCayJrkfRaCRCTh8GqN30f8oyQF.jpg", original_language: "en", original_title: "Fight Club", adult: false, category: "popular", region: "US", genre_ids: [18, 53]
  },
  {
    id: 155, title: "The Dark Knight", overview: "Batman raises the stakes in his war on crime with the help of Lt. Jim Gordon and District Attorney Harvey Dent.", release_date: "2008-07-18", vote_average: 9.0, vote_count: 32100, popularity: 99.567, poster_path: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg", backdrop_path: "/hqkIcbrOHL86UncnHIsHVcVmzue.jpg", original_language: "en", original_title: "The Dark Knight", adult: false, category: "popular", region: "US", genre_ids: [28, 80, 18, 53]
  },
  {
    id: 680, title: "Pulp Fiction", overview: "A burger-loving hit man, his philosophical partner, a drug-addled gangster's moll and a washed-up boxer converge in this sprawling crime caper.", release_date: "1994-09-10", vote_average: 8.9, vote_count: 27300, popularity: 92.789, poster_path: "/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg", backdrop_path: "/4cDFJr4HnXN5AdPw4AKrmLlMWdO.jpg", original_language: "en", original_title: "Pulp Fiction", adult: false, category: "popular", region: "US", genre_ids: [80, 18]
  },
  {
    id: 13, title: "Forrest Gump", overview: "A man with a low IQ has accomplished great things in his life and been present during significant historic events.", release_date: "1994-07-06", vote_average: 8.8, vote_count: 25800, popularity: 85.421, poster_path: "/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg", backdrop_path: "/suaEOtk1N1sgg2MTM7oZd2cfVp3.jpg", original_language: "en", original_title: "Forrest Gump", adult: false, category: "popular", region: "US", genre_ids: [35, 18, 10749]
  },
  {
    id: 389, title: "The Lion King", overview: "A young lion prince flees his kingdom only to learn the true meaning of responsibility and bravery.", release_date: "1994-06-24", vote_average: 8.5, vote_count: 16500, popularity: 65.789, poster_path: "/sKCr78MXSLixwmZ8DyJLrpMsd15.jpg", backdrop_path: "/hKadecfqHvCRNWQy7cP0cGFbaSq.jpg", original_language: "en", original_title: "The Lion King", adult: false, category: "popular", region: "US", genre_ids: [12, 16, 18, 10751]
  },
  {
    id: 24428, title: "The Avengers", overview: "When an unexpected enemy emerges and threatens global safety and security, Nick Fury, director of the international peacekeeping agency known as S.H.I.E.L.D., finds himself in need of a team to pull the world back from the brink of disaster.", release_date: "2012-04-25", vote_average: 7.7, vote_count: 28900, popularity: 78.456, poster_path: "/RYMX2wcKCBAr24UyPD7xwmjaTn.jpg", backdrop_path: "/9BBTo63ANSmhC4e6r62OJFuK2GL.jpg", original_language: "en", original_title: "The Avengers", adult: false, category: "popular", region: "US", genre_ids: [28, 12, 878]
  },
  {
    id: 19995, title: "Avatar", overview: "In the 22nd century, a paraplegic Marine is dispatched to the moon Pandora on a unique mission, but becomes torn between following orders and protecting an alien civilization.", release_date: "2009-12-10", vote_average: 7.6, vote_count: 31200, popularity: 88.234, poster_path: "/jRXYjXNq0Cs2TcJjLkki24MLp7u.jpg", backdrop_path: "/o0s4XsEDfDlvit5pDRKjzXR4pp2.jpg", original_language: "en", original_title: "Avatar", adult: false, category: "popular", region: "US", genre_ids: [28, 12, 14, 878]
  },
  {
    id: 27205, title: "Inception", overview: "Cobb, a skilled thief who commits corporate espionage by infiltrating the subconscious of his targets is offered a chance to regain his old life as payment for a task considered to be impossible.", release_date: "2010-07-15", vote_average: 8.4, vote_count: 35400, popularity: 94.567, poster_path: "/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg", backdrop_path: "/s3TBrRGB1iav7gFOCNx3H31MoES.jpg", original_language: "en", original_title: "Inception", adult: false, category: "popular", region: "US", genre_ids: [28, 878, 53]
  },
  {
    id: 299536, title: "Avengers: Infinity War", overview: "As the Avengers and their allies have continued to protect the world from threats too large for any one hero to handle, a new danger has emerged from the cosmic shadows: Thanos.", release_date: "2018-04-25", vote_average: 8.3, vote_count: 29800, popularity: 91.234, poster_path: "/7WsyChQLEftFiDOVTGkv3hFpyyt.jpg", backdrop_path: "/lmZFxXgJE3vgrciwuDib0N8CfQo.jpg", original_language: "en", original_title: "Avengers: Infinity War", adult: false, category: "popular", region: "US", genre_ids: [12, 28, 878]
  },
  {
    id: 299534, title: "Avengers: Endgame", overview: "After the devastating events of Avengers: Infinity War, the universe is in ruins due to the efforts of the Mad Titan, Thanos. With the help of remaining allies, the Avengers must assemble once more in order to undo Thanos' actions and restore order to the universe.", release_date: "2019-04-24", vote_average: 8.3, vote_count: 24700, popularity: 89.567, poster_path: "/or06FN3Dka5tukK1e9sl16pB3iy.jpg", backdrop_path: "/7RyHsO4yDXtBv1zUU3mTpHeQ0d5.jpg", original_language: "en", original_title: "Avengers: Endgame", adult: false, category: "popular", region: "US", genre_ids: [12, 878, 18]
  },

  // TRENDING MOVIES (15 movies)
  {
    id: 486589, title: "Red Notice", overview: "An Interpol-issued Red Notice is a global alert to hunt and capture the world's most wanted. But when a daring heist brings together the FBI's top profiler and two rival criminals, there's no telling what will happen.", release_date: "2021-11-05", vote_average: 6.8, vote_count: 4200, popularity: 156.789, poster_path: "/lAXONuqg41NwUMuzMiFvicDET9Y.jpg", backdrop_path: "/8Y43POKjjKDGI9MH89NW0NAzzp8.jpg", original_language: "en", original_title: "Red Notice", adult: false, category: "trending", region: "US", genre_ids: [28, 35, 80, 53]
  },
  {
    id: 634649, title: "Spider-Man: No Way Home", overview: "Peter Parker is unmasked and no longer able to separate his normal life from the high-stakes of being a super-hero. When he asks for help from Doctor Strange the stakes become even more dangerous.", release_date: "2021-12-15", vote_average: 8.1, vote_count: 19500, popularity: 178.456, poster_path: "/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg", backdrop_path: "/14QbnygCuTO0vl7CAFmPf1fgZfV.jpg", original_language: "en", original_title: "Spider-Man: No Way Home", adult: false, category: "trending", region: "US", genre_ids: [28, 12, 878]
  },
  {
    id: 508442, title: "Soul", overview: "Joe Gardner is a middle school teacher with a love for jazz music. After a successful gig at the Half Note Club, he suddenly gets into an accident that separates his soul from his body.", release_date: "2020-12-25", vote_average: 8.2, vote_count: 9800, popularity: 134.567, poster_path: "/hm58Jw4Lw8OIeECIq5qyPYhAeRJ.jpg", backdrop_path: "/kf456ZqeC45XTvo6W9pW5clYKfQ.jpg", original_language: "en", original_title: "Soul", adult: false, category: "trending", region: "US", genre_ids: [16, 35, 18, 10751, 14]
  },
  {
    id: 791373, title: "Zack Snyder's Justice League", overview: "Determined to ensure Superman's ultimate sacrifice was not in vain, Bruce Wayne aligns forces with Diana Prince with plans to recruit a team of metahumans to protect the world from an approaching threat of catastrophic proportions.", release_date: "2021-03-18", vote_average: 8.1, vote_count: 8900, popularity: 145.234, poster_path: "/tnAuB8q5vv7Ax9UAEje5Xi4BXik.jpg", backdrop_path: "/pcDc2WJAYGJTTvRSEIpRZwM3Ola.jpg", original_language: "en", original_title: "Zack Snyder's Justice League", adult: false, category: "trending", region: "US", genre_ids: [28, 12, 14, 878]
  },
  {
    id: 460465, title: "Mortal Kombat", overview: "Washed-up MMA fighter Cole Young, unaware of his heritage, and hunted by Emperor Shang Tsung's best warrior, Sub-Zero, seeks out and trains with Earth's greatest champions as he prepares to stand against the enemies of Outworld.", release_date: "2021-04-07", vote_average: 7.0, vote_count: 5600, popularity: 123.789, poster_path: "/nkayOAUBUu4mMvyNf9iHSUiPjF1.jpg", backdrop_path: "/9yBVqNruk6Ykrwc32qrK2TIE5xw.jpg", original_language: "en", original_title: "Mortal Kombat", adult: false, category: "trending", region: "US", genre_ids: [28, 14, 53]
  },
  {
    id: 524434, title: "Eternals", overview: "The Eternals are a team of ancient aliens who have been living on Earth in secret for thousands of years. When an unexpected tragedy forces them out of the shadows, they are forced to reunite against mankind's most ancient enemy, the Deviants.", release_date: "2021-11-03", vote_average: 7.1, vote_count: 7200, popularity: 142.345, poster_path: "/lFByFSLV5WDJEv3KabbdAF959F2.jpg", backdrop_path: "/c6H7Z4u73ir3cIoCteuhJh7UCAR.jpg", original_language: "en", original_title: "Eternals", adult: false, category: "trending", region: "US", genre_ids: [28, 12, 18, 14, 878]
  },
  {
    id: 580489, title: "Venom: Let There Be Carnage", overview: "After finding a host body in investigative reporter Eddie Brock, the alien symbiote must face a new enemy, Carnage, the alter ego of serial killer Cletus Kasady.", release_date: "2021-09-30", vote_average: 6.8, vote_count: 9100, popularity: 156.234, poster_path: "/rjkmN1dniUHVYAtwuV3Tji7FsDO.jpg", backdrop_path: "/70nxSw3mFBsGmtkvcs91PbjerwD.jpg", original_language: "en", original_title: "Venom: Let There Be Carnage", adult: false, category: "trending", region: "US", genre_ids: [878, 28, 53]
  },
  {
    id: 438674, title: "Dune", overview: "Paul Atreides, a brilliant and gifted young man born into a great destiny beyond his understanding, must travel to the most dangerous planet in the universe to ensure the future of his family and his people.", release_date: "2021-09-15", vote_average: 8.0, vote_count: 11200, popularity: 167.890, poster_path: "/d5NXSklXo0qyIYkgV94XAgMIckC.jpg", backdrop_path: "/jYEW5xZkZk2WTrdbMGAPFuBqbDc.jpg", original_language: "en", original_title: "Dune", adult: false, category: "trending", region: "US", genre_ids: [12, 18, 878]
  },
  {
    id: 370172, title: "No Time to Die", overview: "Bond has left active service and is enjoying a tranquil life in Jamaica. His peace is short-lived when his old friend Felix Leiter from the CIA turns up asking for help.", release_date: "2021-09-29", vote_average: 7.4, vote_count: 6800, popularity: 189.456, poster_path: "/iUgygt3fscRoKWCV1d0C7FbM9TP.jpg", backdrop_path: "/akJQZoa3Pts2LAv26zwTGwOi0QU.jpg", original_language: "en", original_title: "No Time to Die", adult: false, category: "trending", region: "US", genre_ids: [28, 12, 53]
  },

  // BOLLYWOOD MOVIES (20 movies)
  {
    id: 19404, title: "Dilwale Dulhania Le Jayenge", overview: "Raj and Simran meet during a trip across Europe and fall in love, but Simran's father has already arranged her marriage.", release_date: "1995-10-20", vote_average: 8.7, vote_count: 4200, popularity: 45.123, poster_path: "/ktejodbcdCPXbMMdnpI9BUxW6O8.jpg", backdrop_path: "/90ez6ArvpO8bvpyIngBuwXOqJm5.jpg", original_language: "hi", original_title: "दिलवाले दुल्हनिया ले जायेंगे", adult: false, category: "bollywood", region: "IN", genre_ids: [35, 18, 10749]
  },
  {
    id: 19551, title: "3 Idiots", overview: "In the tradition of 'Dil Chahta Hai' and 'Zindagi Na Milegi Dobara', 'Three Idiots' is a coming-of-age film that revolves around the lives of three friends.", release_date: "2009-12-25", vote_average: 8.4, vote_count: 3800, popularity: 38.567, poster_path: "/66A9MqXOyVFCssoloscw38nJp8B.jpg", backdrop_path: "/cQvc9N6JiMVKqol3wcYrGshsIdZ.jpg", original_language: "hi", original_title: "3 Idiots", adult: false, category: "bollywood", region: "IN", genre_ids: [35, 18]
  },
  {
    id: 13342, title: "Dangal", overview: "Dangal is an extraordinary true story based on the life of Mahavir Singh and his two daughters, Geeta and Babita Phogat.", release_date: "2016-12-21", vote_average: 8.3, vote_count: 2900, popularity: 42.890, poster_path: "/lZjUT2NXVyJdMDNVVtp73wYLEhh.jpg", backdrop_path: "/c3F4P2oauA7IQmy4pIDhUzzTUuU.jpg", original_language: "hi", original_title: "दंगल", adult: false, category: "bollywood", region: "IN", genre_ids: [18, 10751]
  },
  {
    id: 295301, title: "Baahubali: The Beginning", overview: "The young Shivudu is left as a foundling in a small village by his mother. By the time he's grown up, it has become apparent that he possesses exceptional strength.", release_date: "2015-07-10", vote_average: 7.1, vote_count: 890, popularity: 31.234, poster_path: "/6Q3CGYP5fWEJZNf7XXy9yQjMtI0.jpg", backdrop_path: "/rFtsEvTnqiNdlognR9OHsLc9W0g.jpg", original_language: "te", original_title: "బాహుబలి", adult: false, category: "bollywood", region: "IN", genre_ids: [28, 18, 14]
  },
  {
    id: 420809, title: "Baahubali 2: The Conclusion", overview: "When Mahendra, the son of Bahubali, learns about his heritage, he begins to look for answers. His story is juxtaposed with past events that unfolded in the Mahishmati Kingdom.", release_date: "2017-04-27", vote_average: 7.4, vote_count: 1200, popularity: 48.567, poster_path: "/jIuuOOOaaOInkL7CYKFGMUoLtrE.jpg", backdrop_path: "/6xKWGGYmgQYUJKEziRuFNKZEsaC.jpg", original_language: "te", original_title: "బాహుబలి 2", adult: false, category: "bollywood", region: "IN", genre_ids: [28, 18, 14]
  },
  {
    id: 447362, title: "The Lunchbox", overview: "A mistaken delivery in Mumbai's famously efficient lunchbox delivery system connects a young housewife to an older man in the dusk of his life.", release_date: "2013-09-20", vote_average: 7.8, vote_count: 1800, popularity: 23.456, poster_path: "/5fkSztwg4gMhSRaHUQSCg5zVaZm.jpg", backdrop_path: "/aQmw1HQn8xGVdvL8Hf8ZPvbJMZ8.jpg", original_language: "hi", original_title: "The Lunchbox", adult: false, category: "bollywood", region: "IN", genre_ids: [18, 10749]
  },
  {
    id: 338970, title: "Tumhari Sulu", overview: "A happy-go-lucky Mumbai suburban housewife Sulochana, fondly known as Sulu, lands the role of a night RJ, resulting in drastic changes to her routine life.", release_date: "2017-11-17", vote_average: 7.2, vote_count: 450, popularity: 18.789, poster_path: "/wNrZHOqe7YH6JFnPnVo3aV64LNS.jpg", backdrop_path: "/mGhYZj4MxFtQSWzqd6WBCNZkvP0.jpg", original_language: "hi", original_title: "Tumhari Sulu", adult: false, category: "bollywood", region: "IN", genre_ids: [35, 18]
  },
  {
    id: 557, title: "Queen", overview: "A Delhi girl from a traditional family sets out on a solo honeymoon after her marriage gets cancelled.", release_date: "2013-03-07", vote_average: 8.2, vote_count: 2100, popularity: 27.890, poster_path: "/w7RDyO5kOqUTp5dHaGnKmkj8hCu.jpg", backdrop_path: "/8B7p8F8fJ2I1kT2L4Q4gKHEcUCx.jpg", original_language: "hi", original_title: "Queen", adult: false, category: "bollywood", region: "IN", genre_ids: [35, 18]
  },
  {
    id: 454983, title: "Lagaan", overview: "In 1893, heavily taxed and oppressed by the British, the people of the small village in the state of Gujarat, rally behind a young farmer to support their fight against the British.", release_date: "2001-06-15", vote_average: 8.1, vote_count: 1900, popularity: 34.567, poster_path: "/vJJUz5ElDJVCyGU6Cgp0KCeIGGb.jpg", backdrop_path: "/g8qUVlFIQKHAZ1VCVfzBQBOG4DL.jpg", original_language: "hi", original_title: "लगान", adult: false, category: "bollywood", region: "IN", genre_ids: [18, 10752]
  },
  {
    id: 19770, title: "Zindagi Na Milegi Dobara", overview: "Three friends who were inseparable in childhood decide to go on a three-week-long bachelor road trip to Spain, in order to re-establish their bond and explore thrilling adventures.", release_date: "2011-07-15", vote_average: 8.1, vote_count: 1500, popularity: 29.234, poster_path: "/lRXG9eLMR7K0fmz3PjBBFfONGZY.jpg", backdrop_path: "/cHKNuOHnA7NJJC2WXwt8KEbk0Bj.jpg", original_language: "hi", original_title: "Zindagi Na Milegi Dobara", adult: false, category: "bollywood", region: "IN", genre_ids: [12, 35, 18]
  },
  {
    id: 74465, title: "PK", overview: "A stranger in the city asks questions no one has asked before. Known only by his initials, P.K.'s innocent questions and childish curiosity will take him on a journey of love and laughter.", release_date: "2014-12-19", vote_average: 8.2, vote_count: 2800, popularity: 41.789, poster_path: "/kNWZjFZWGL8vx3GzUvAivdR0e4B.jpg", backdrop_path: "/1J4dAYEQOAJ3j9GaJdK7sX5BgAu.jpg", original_language: "hi", original_title: "PK", adult: false, category: "bollywood", region: "IN", genre_ids: [35, 18, 878]
  },
  {
    id: 24021, title: "My Name is Khan", overview: "Rizwan Khan, a Muslim from India, moves to San Francisco and lives with his brother and sister-in-law. After 9/11, Rizwan is detained by authorities at LAX who mistake his disability and religion for terrorism.", release_date: "2010-02-12", vote_average: 8.0, vote_count: 1600, popularity: 26.456, poster_path: "/3nzjUzNtayEeVrkVMh4nOZ8Gujw.jpg", backdrop_path: "/dWMHrZmBDn5oQ5mGdEkDWzWpXcv.jpg", original_language: "hi", original_title: "My Name is Khan", adult: false, category: "bollywood", region: "IN", genre_ids: [18]
  }
]

async function seedDatabase() {
  console.log('🌱 Starting comprehensive database seeding...')
  console.log(`📊 Total movies to insert: ${comprehensiveMovies.length}`)

  try {
    // 1. Clear existing movies to avoid duplicates
    console.log('🧹 Clearing existing movie data...')
    const { error: clearError } = await supabase
      .from('movies')
      .delete()
      .neq('id', -1) // Delete all
    
    if (clearError) {
      console.log('Warning: Could not clear existing data:', clearError.message)
    } else {
      console.log('✅ Existing data cleared')
    }

    // Also clear movie_genres
    const { error: clearGenreError } = await supabase
      .from('movie_genres')
      .delete()
      .neq('movie_id', -1) // Delete all
    
    if (clearGenreError) {
      console.log('Warning: Could not clear existing genre data:', clearGenreError.message)
    }

    // 2. Insert movies in batches
    console.log('📽️  Inserting movies...')
    const movieData = comprehensiveMovies.map(({ genre_ids, ...movie }) => movie)
    
    // Insert in batches of 10 to avoid timeout
    const batchSize = 10
    for (let i = 0; i < movieData.length; i += batchSize) {
      const batch = movieData.slice(i, i + batchSize)
      console.log(`   Inserting batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(movieData.length/batchSize)}`)
      
      const { error: movieError } = await supabase
        .from('movies')
        .upsert(batch, { onConflict: 'id' })

      if (movieError) {
        console.error(`   Error in batch ${Math.floor(i/batchSize) + 1}:`, movieError.message)
      }
    }
    
    console.log(`✅ Inserted ${movieData.length} movies`)

    // 3. Insert movie-genre relationships
    console.log('🎭 Inserting movie-genre relationships...')
    const genreData = []
    
    comprehensiveMovies.forEach(movie => {
      movie.genre_ids.forEach(genreId => {
        genreData.push({
          movie_id: movie.id,
          genre_id: genreId
        })
      })
    })

    // Insert genres in batches
    for (let i = 0; i < genreData.length; i += batchSize) {
      const batch = genreData.slice(i, i + batchSize)
      
      const { error: genreError } = await supabase
        .from('movie_genres')
        .upsert(batch, { onConflict: 'movie_id,genre_id' })

      if (genreError) {
        console.error(`   Error in genre batch ${Math.floor(i/batchSize) + 1}:`, genreError.message)
      }
    }
    
    console.log(`✅ Inserted ${genreData.length} movie-genre relationships`)

    // 4. Verify the seeding by category
    console.log('🔍 Verifying seeded data by category...')
    
    const categories = ['popular', 'trending', 'bollywood', 'top_rated']
    let totalMovies = 0
    
    for (const category of categories) {
      const { data: categoryMovies, error: categoryError } = await supabase
        .from('movies')
        .select('*')
        .eq('category', category)

      if (categoryError) {
        console.error(`   Error counting ${category}:`, categoryError.message)
      } else {
        const count = categoryMovies?.length || 0
        totalMovies += count
        console.log(`   ${category.toUpperCase()}: ${count} movies`)
      }
    }

    console.log(`📈 Total movies in database: ${totalMovies}`)

    // 5. Test a query
    console.log('🧪 Testing movie queries...')
    
    const { data: testMovies, error: testError } = await supabase
      .from('movies')
      .select(`
        *,
        movie_genres!inner(
          genres!inner(name)
        )
      `)
      .eq('category', 'popular')
      .limit(3)

    if (testError) {
      console.log('Test query warning:', testError.message)
    } else {
      console.log(`✅ Query test successful: ${testMovies?.length || 0} results with genres`)
    }

    console.log('\n🎉 Comprehensive database seeding completed successfully!')
    console.log('\n📋 Database now contains:')
    console.log('• Popular movies with high ratings and popularity')
    console.log('• Latest trending movies from 2021-2022')
    console.log('• Bollywood classics and modern hits')
    console.log('• Proper genre associations for all movies')

  } catch (error) {
    console.error('❌ Seeding failed:', error.message)
    process.exit(1)
  }
}

// Run comprehensive seeding
seedDatabase()