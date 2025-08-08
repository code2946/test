// Performance monitoring utilities
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private marks = new Map<string, number>()
  
  static getInstance(): PerformanceMonitor {
    if (!this.instance) {
      this.instance = new PerformanceMonitor()
    }
    return this.instance
  }
  
  // Start timing an operation
  start(name: string): void {
    if (typeof performance !== 'undefined') {
      this.marks.set(name, performance.now())
    }
  }
  
  // End timing and return duration
  end(name: string): number {
    if (typeof performance === 'undefined') return 0
    
    const startTime = this.marks.get(name)
    if (!startTime) return 0
    
    const duration = performance.now() - startTime
    this.marks.delete(name)
    
    // Log if duration is significant
    if (duration > 100) {
      console.log(`⚡ Performance: ${name} took ${duration.toFixed(2)}ms`)
    }
    
    return duration
  }
  
  // Measure component render time
  measureRender<T>(name: string, fn: () => T): T {
    this.start(`render:${name}`)
    const result = fn()
    this.end(`render:${name}`)
    return result
  }
  
  // Measure API call time
  async measureAPI<T>(name: string, fn: () => Promise<T>): Promise<T> {
    this.start(`api:${name}`)
    try {
      const result = await fn()
      this.end(`api:${name}`)
      return result
    } catch (error) {
      this.end(`api:${name}`)
      throw error
    }
  }
  
  // Get Web Vitals if available
  getWebVitals(): void {
    if (typeof window === 'undefined') return
    
    // CLS - Cumulative Layout Shift
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
          console.log(`📊 CLS: ${entry.value}`)
        }
      }
    }).observe({ entryTypes: ['layout-shift'] })
    
    // LCP - Largest Contentful Paint  
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1]
      console.log(`📊 LCP: ${lastEntry.startTime}ms`)
    }).observe({ entryTypes: ['largest-contentful-paint'] })
    
    // FID - First Input Delay
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        console.log(`📊 FID: ${entry.processingStart - entry.startTime}ms`)
      }
    }).observe({ entryTypes: ['first-input'] })
  }
  
  // Memory usage monitoring
  logMemoryUsage(): void {
    if (typeof window === 'undefined' || !(window as any).performance?.memory) return
    
    const memory = (window as any).performance.memory
    const used = Math.round(memory.usedJSHeapSize / 1024 / 1024)
    const total = Math.round(memory.totalJSHeapSize / 1024 / 1024)
    const limit = Math.round(memory.jsHeapSizeLimit / 1024 / 1024)
    
    console.log(`🧠 Memory: ${used}MB used / ${total}MB total (limit: ${limit}MB)`)
  }
}

// Global instance
export const perf = PerformanceMonitor.getInstance()

// React hook for performance monitoring
export function usePerformanceMonitor() {
  return {
    start: perf.start.bind(perf),
    end: perf.end.bind(perf),
    measureRender: perf.measureRender.bind(perf),
    measureAPI: perf.measureAPI.bind(perf),
    logMemory: perf.logMemoryUsage.bind(perf)
  }
}