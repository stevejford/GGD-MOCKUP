// Simple Logfire integration that works with the current setup
let logfireConfigured = false

// Initialize Logfire only when needed
const initLogfire = async () => {
  if (logfireConfigured) return

  try {
    const { configure } = await import('logfire')
    configure({
      serviceName: 'geelong-garage-doors-crawler',
      environment: process.env.NODE_ENV || 'development',
      token: process.env.LOGFIRE_TOKEN,
      console: true, // Also log to console for debugging
      sendToLogfire: 'if-token-present' // Only send if token is present
    })
    logfireConfigured = true
    console.log('✅ Logfire configured successfully')
  } catch (error) {
    console.warn('⚠️ Logfire configuration failed:', error)
  }
}

// Safe logging functions that won't break if Logfire fails
const safeLogfireCall = async (logFunction: string, message: string, data: any) => {
  try {
    await initLogfire()
    const { info, error: logError, debug } = await import('logfire')

    switch (logFunction) {
      case 'info':
        info(message, data)
        break
      case 'error':
        logError(message, data)
        break
      case 'debug':
        debug(message, data)
        break
    }
  } catch (err) {
    // Fallback to console logging
    console.log(`[${logFunction.toUpperCase()}] ${message}`, data)
  }
}

// Crawler event types
export interface CrawlerEvent {
  type: 'crawler_start' | 'crawler_stop' | 'page_fetch' | 'page_complete' | 'asset_process' | 'error'
  url?: string
  duration?: number
  status?: string
  error?: string
  assets?: number
  size?: number
  timestamp: string
}

// Log crawler events with structured data
export const logCrawlerEvent = async (event: CrawlerEvent) => {
  const baseData = {
    timestamp: event.timestamp,
    crawler_session: process.env.CRAWLER_SESSION_ID || 'default',
    event_type: event.type,
    url: event.url,
    duration: event.duration,
    status: event.status,
    error_message: event.error,
    assets: event.assets,
    size: event.size
  }

  switch (event.type) {
    case 'crawler_start':
      await safeLogfireCall('info', '🚀 Crawler Started', baseData)
      break
    case 'crawler_stop':
      await safeLogfireCall('info', '🛑 Crawler Stopped', baseData)
      break
    case 'page_fetch':
      await safeLogfireCall('info', '🕷️ Fetching Page', baseData)
      break
    case 'page_complete':
      await safeLogfireCall('info', '✅ Page Completed', {
        ...baseData,
        performance_duration_ms: event.duration,
        assets_processed: event.assets
      })
      break
    case 'asset_process':
      await safeLogfireCall('info', '🖼️ Asset Processed', {
        ...baseData,
        asset_url: event.url,
        asset_size_bytes: event.size,
        asset_status: event.status
      })
      break
    case 'error':
      await safeLogfireCall('error', '❌ Crawler Error', {
        ...baseData,
        error_message: event.error,
        error_url: event.url
      })
      break
  }
}

// Log crawler stats periodically
export const logCrawlerStats = async (stats: {
  pages: number
  assets: number
  errors: number
  duration: number
  pagesPerMinute: number
}) => {
  await safeLogfireCall('info', '📊 Crawler Stats', {
    timestamp: new Date().toISOString(),
    pages_completed: stats.pages,
    assets_processed: stats.assets,
    error_count: stats.errors,
    total_duration_ms: stats.duration,
    pages_per_minute: stats.pagesPerMinute,
    performance_score: stats.pagesPerMinute > 2 ? 'good' : stats.pagesPerMinute > 1 ? 'fair' : 'slow'
  })
}

// Create custom dashboard queries
export const createLogfireDashboard = () => {
  // These would be used in Logfire's dashboard builder
  return {
    queries: {
      // Real-time crawler status
      crawlerStatus: `
        SELECT 
          timestamp,
          type,
          url,
          duration,
          status
        FROM logs 
        WHERE type IN ('page_fetch', 'page_complete', 'error')
        ORDER BY timestamp DESC 
        LIMIT 100
      `,
      
      // Performance metrics
      performanceMetrics: `
        SELECT 
          DATE_TRUNC('minute', timestamp) as minute,
          COUNT(*) as pages_per_minute,
          AVG(duration) as avg_duration_ms
        FROM logs 
        WHERE type = 'page_complete'
        GROUP BY minute
        ORDER BY minute DESC
        LIMIT 60
      `,
      
      // Error tracking
      errorTracking: `
        SELECT 
          timestamp,
          error.message,
          error.url,
          COUNT(*) OVER (PARTITION BY error.message) as error_count
        FROM logs 
        WHERE type = 'error'
        ORDER BY timestamp DESC
        LIMIT 50
      `,
      
      // Asset processing stats
      assetStats: `
        SELECT 
          asset.status,
          COUNT(*) as count,
          AVG(asset.size_bytes) as avg_size
        FROM logs 
        WHERE type = 'asset_process'
        GROUP BY asset.status
      `
    }
  }
}
