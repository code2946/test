import { Metadata } from 'next'
import TwoPaneRecommender from '@/components/two-pane-recommender'

export const metadata: Metadata = {
  title: 'Movie Recommendations | ScreenOnFire',
  description: 'Get personalized movie recommendations based on your favorite films. Discover new movies using advanced content-based filtering.',
}

export default function RecommendationsPage() {
  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-8 space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            Personalized Movie Recommendations
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Discover movies tailored to your taste using advanced content analysis. 
            Select your favorite films and let our AI-powered system find similar movies 
            based on genre, cast, directors, cinematography, and more.
          </p>
        </div>

        {/* How It Works */}
        <div className="mb-8 bg-gray-900/50 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-center">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div className="space-y-2">
              <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center mx-auto text-black font-bold text-xl">
                1
              </div>
              <h3 className="font-medium">Select Your Favorites</h3>
              <p className="text-sm text-gray-400">
                Search and add up to 10 movies you love to build your preference profile
              </p>
            </div>
            <div className="space-y-2">
              <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center mx-auto text-black font-bold text-xl">
                2
              </div>
              <h3 className="font-medium">Adjust Preferences</h3>
              <p className="text-sm text-gray-400">
                Fine-tune what matters most: genre, cast, director, visual style, or themes
              </p>
            </div>
            <div className="space-y-2">
              <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center mx-auto text-black font-bold text-xl">
                3
              </div>
              <h3 className="font-medium">Discover Similar Movies</h3>
              <p className="text-sm text-gray-400">
                Get personalized recommendations with similarity scores and detailed matching
              </p>
            </div>
          </div>
        </div>

        {/* Main Recommender Component */}
        <TwoPaneRecommender />

        {/* Features */}
        <div className="mt-12 bg-gray-900/30 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-6 text-center">Recommendation Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center space-y-2">
              <div className="text-2xl">🎭</div>
              <h4 className="font-medium">Genre Analysis</h4>
              <p className="text-xs text-gray-400">Multi-dimensional genre matching</p>
            </div>
            <div className="text-center space-y-2">
              <div className="text-2xl">⭐</div>
              <h4 className="font-medium">Quality Scoring</h4>
              <p className="text-xs text-gray-400">Wilson confidence intervals</p>
            </div>
            <div className="text-center space-y-2">
              <div className="text-2xl">🎬</div>
              <h4 className="font-medium">Cast & Crew</h4>
              <p className="text-xs text-gray-400">Director and actor similarity</p>
            </div>
            <div className="text-center space-y-2">
              <div className="text-2xl">📹</div>
              <h4 className="font-medium">Visual Style</h4>
              <p className="text-xs text-gray-400">Cinematography patterns</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}