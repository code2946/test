"use client"

import { useEffect } from "react"
import { perf } from "@/lib/performance"

export default function PerformanceMonitor() {
  useEffect(() => {
    // Initialize performance monitoring
    if (typeof window !== 'undefined') {
      // Monitor Web Vitals
      perf.getWebVitals()
      
      // Log memory usage every 30 seconds
      const memoryInterval = setInterval(() => {
        perf.logMemoryUsage()
      }, 30000)
      
      // Monitor route changes for performance
      const handleRouteChange = () => {
        perf.start('route-change')
        setTimeout(() => perf.end('route-change'), 100)
      }
      
      // Listen for Next.js route changes
      window.addEventListener('beforeunload', handleRouteChange)
      
      return () => {
        clearInterval(memoryInterval)
        window.removeEventListener('beforeunload', handleRouteChange)
      }
    }
  }, [])

  return null // This component doesn't render anything
}