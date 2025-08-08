"use client"

import { useRouter } from "next/navigation"
import { memo } from "react"

const LandingPage = memo(function LandingPage() {
  const router = useRouter()

  const handleGetStarted = () => {
    router.push('/discover')
  }

  const handleExploreFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div 
      className="min-h-screen text-white relative"
      style={{
        background: "url('https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?auto=format&fit=crop&w=1950&q=80') center/cover no-repeat fixed",
      }}
    >
      {/* Static overlay */}
      <div className="absolute inset-0 bg-black/70 z-0"></div>

      {/* Scrollable content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="w-full max-w-6xl mx-auto flex justify-between items-center px-10 py-5">
          <div 
            className="text-2xl font-bold text-black bg-yellow-400 px-4 py-2 rounded-lg cursor-pointer shadow-lg"
            onClick={() => router.push('/')}
          >
            S
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            <a 
              href="#" 
              className="text-gray-300 hover:text-yellow-400 font-medium transition-colors duration-300"
            >
              New
            </a>
            <a 
              href="#features" 
              onClick={handleExploreFeatures}
              className="text-gray-300 hover:text-yellow-400 font-medium transition-colors duration-300 cursor-pointer"
            >
              Features
            </a>
            <a 
              href="/discover" 
              onClick={() => router.push('/discover')}
              className="text-gray-300 hover:text-yellow-400 font-medium transition-colors duration-300 cursor-pointer"
            >
              Search
            </a>
          </nav>
        </header>

        {/* Hero Section */}
        <section className="text-center max-w-4xl mx-auto px-5 py-24 flex-1 flex flex-col justify-center">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight">
            <span className="drop-shadow-2xl">
              Let Emotions Guide You — AI-Picked Movies That Move
            </span>
          </h1>
          
          <p className="text-xl text-gray-200 mb-9 max-w-3xl mx-auto leading-relaxed drop-shadow-lg">
            Discover cinematic gems tailored to your taste by intelligent recommendations that know your vibe before you say it.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-5 justify-center items-center flex-wrap">
            <button 
              onClick={handleGetStarted}
              className="px-8 py-4 text-lg font-semibold bg-yellow-400 text-black rounded-md hover:bg-yellow-300 transition-all duration-300 shadow-xl transform hover:scale-105"
            >
              Discover Movies & TV Shows
            </button>
            <button 
              onClick={handleExploreFeatures}
              className="px-8 py-4 text-lg font-medium bg-transparent border border-gray-400 text-white rounded-md hover:border-yellow-400 hover:text-yellow-400 transition-all duration-300 shadow-lg"
            >
              Explore Features
            </button>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-5xl mx-auto my-20 px-5 text-center">
          <div className="feature">
            <div className="text-4xl mb-4 text-yellow-400 drop-shadow-md">⚡</div>
            <h3 className="text-xl font-semibold mb-3 drop-shadow-md">Real-Time Recommendations</h3>
            <p className="text-gray-300 leading-relaxed">
              Let our AI engine decode your taste in movies & shows with stunning accuracy.
            </p>
          </div>
          
          <div className="feature">
            <div className="text-4xl mb-4 text-yellow-400 drop-shadow-md">📈</div>
            <h3 className="text-xl font-semibold mb-3 drop-shadow-md">Trending Now, Just for You</h3>
            <p className="text-gray-300 leading-relaxed">
              Stay ahead of the buzz. Get what's hot before it becomes mainstream.
            </p>
          </div>
          
          <div className="feature">
            <div className="text-4xl mb-4 text-yellow-400 drop-shadow-md">🔒</div>
            <h3 className="text-xl font-semibold mb-3 drop-shadow-md">Your Preferences. Your Privacy.</h3>
            <p className="text-gray-300 leading-relaxed">
              Personalized picks with secure, private data handling.
            </p>
          </div>
        </section>

        {/* Footer Spacer */}
        <div className="py-16"></div>
      </div>
    </div>
  )
})

export default LandingPage