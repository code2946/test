import { movieSyncService } from './movie-sync'

// Cron job implementation for 24-hour movie sync
class CronJobService {
  private intervalId: NodeJS.Timeout | null = null
  private isRunning = false

  async startMovieSyncCron() {
    if (this.isRunning) {
      console.log('Movie sync cron is already running')
      return
    }

    console.log('Starting movie sync cron job (24-hour interval)')
    this.isRunning = true

    // Run immediately on start
    await this.runSyncJob()

    // Set up 24-hour interval (24 * 60 * 60 * 1000 milliseconds)
    this.intervalId = setInterval(async () => {
      await this.runSyncJob()
    }, 24 * 60 * 60 * 1000)
  }

  private async runSyncJob() {
    try {
      console.log('Running scheduled movie sync...')
      const results = await movieSyncService.syncIfNeeded()
      
      if (results.length === 0) {
        console.log('All movie categories are up to date')
      } else {
        const totalMovies = results.reduce((sum, r) => sum + r.moviesSynced, 0)
        const successfulSyncs = results.filter(r => r.success).length
        console.log(`Cron sync completed: ${totalMovies} movies, ${successfulSyncs}/${results.length} categories successful`)
      }
    } catch (error) {
      console.error('Cron sync job failed:', error)
    }
  }

  stopMovieSyncCron() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.isRunning = false
    console.log('Movie sync cron job stopped')
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      intervalId: this.intervalId ? 'active' : 'inactive'
    }
  }
}

export const cronJobService = new CronJobService()

// Auto-start cron job in production
if (process.env.NODE_ENV === 'production') {
  cronJobService.startMovieSyncCron().catch(console.error)
}