"use client"
import { useState, useEffect, useCallback } from 'react'
import { useWebSocket } from '@/hooks/useWebSocket'

interface CrawlStats {
  pages: number
  images: number
  pdfs: number
  txtFiles: number
  otherFiles: number
  totalAssets: number
  recentFiles: string[]
  recentPages: string[]
  isRunning: boolean
  liveLogLines?: string[]  // Add live log data
  currentActivity?: string // Add current activity
  progress?: {
    currentPages: number
    totalExpectedPages: number
    percentage: number
    pagesRemaining: number
  }
  errors?: Array<{
    timestamp: string
    message: string
    type: 'ERROR' | 'FAILED' | 'TIMEOUT' | 'WARNING'
  }>
}

interface RealTimeCrawlStatsProps {
  isVisible: boolean
  onClose: () => void
}

export default function RealTimeCrawlStats({ isVisible, onClose }: RealTimeCrawlStatsProps) {
  const [stats, setStats] = useState<CrawlStats>({
    pages: 0,
    images: 0,
    pdfs: 0,
    txtFiles: 0,
    otherFiles: 0,
    totalAssets: 0,
    recentFiles: [],
    recentPages: [],
    isRunning: false,
    liveLogLines: [],
    currentActivity: 'Waiting for activity...',
    progress: {
      currentPages: 0,
      totalExpectedPages: 0,
      percentage: 0,
      pagesRemaining: 0
    },
    errors: []
  })
  const [isLoading, setIsLoading] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected')

  // Copy to clipboard function
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // You could add a toast notification here
      console.log('Copied to clipboard:', text)
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
    }
  }

  // WebSocket connection for real-time updates
  const { isConnected, connect, disconnect, connectionStatus: wsStatus } = useWebSocket({
    url: 'ws://localhost:8080/api/ws',
    onMessage: useCallback((data: any) => {
      if (data.type === 'stats_update' && data.data) {
        setStats(data.data)
        console.log('📡 Received real-time stats update:', {
          ...data.data,
          liveLogLines: data.data.liveLogLines?.length || 0,
          currentActivity: data.data.currentActivity
        })
      }
    }, []),
    onConnect: useCallback(() => {
      setConnectionStatus('connected')
      console.log('🔗 WebSocket connected for real-time stats')
    }, []),
    onDisconnect: useCallback(() => {
      setConnectionStatus('disconnected')
      console.log('🔌 WebSocket disconnected')
    }, []),
    onError: useCallback((error: Event) => {
      setConnectionStatus('error')
      if (process.env.NODE_ENV === 'development') {
        console.debug('RealTimeCrawlStats WebSocket connection issue (normal in dev)')
      } else {
        console.error('❌ WebSocket error:', error)
      }
    }, [])
  })

  useEffect(() => {
    if (!isVisible) return

    const fetchInitialStats = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/scrape/stats')
        if (response.ok) {
          const data = await response.json()
          setStats(data)
          console.log('📊 Initial stats loaded:', {
            ...data,
            liveLogLines: data.liveLogLines?.length || 0,
            currentActivity: data.currentActivity
          })
        }
      } catch (error) {
        console.error('❌ Failed to fetch initial stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    // Connect WebSocket for real-time updates
    connect()

    // Fetch initial data once
    fetchInitialStats()

    return () => {
      disconnect()
    }
  }, [isVisible]) // Only depend on isVisible - connect/disconnect are stable

  if (!isVisible) return null

  // Debug log to verify stats data
  console.log('RealTimeCrawlStats - Current stats:', stats)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${stats.isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
            <div>
              <h2 className="text-xl font-semibold text-deep-blue">
                Real-Time Crawl Statistics v2.0
              </h2>
              <div className="flex items-center gap-4">
                <p className="text-charcoal/70 text-sm">
                  {stats.isRunning ? 'Crawler is running...' : 'Crawler stopped'}
                </p>
                <div className="flex items-center gap-2 text-xs">
                  <div className={`w-2 h-2 rounded-full ${
                    stats.isRunning ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                  }`}></div>
                  <span className="text-charcoal/60">
                    {stats.isRunning ? '🟢 Crawling' : '🔴 Stopped'}
                  </span>
                  {isConnected && (
                    <span className="text-charcoal/40 text-xs">• Live</span>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Stats Grid - 5 columns including Other Files */}
        <div className="p-6 grid grid-cols-2 md:grid-cols-5 gap-4">
          {/* Pages */}
          <div className="bg-deep-blue-light/10 rounded-lg p-4 border border-deep-blue-light">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-deep-blue rounded-lg flex items-center justify-center">
                <span className="text-white text-lg">📄</span>
              </div>
              <div>
                <div className="text-2xl font-bold text-deep-blue">{stats.pages}</div>
                <div className="text-sm text-charcoal/70">Pages</div>
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg">🖼️</span>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.images}</div>
                <div className="text-sm text-charcoal/70">Images</div>
              </div>
            </div>
          </div>

          {/* PDFs */}
          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg">📕</span>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{stats.pdfs}</div>
                <div className="text-sm text-charcoal/70">PDFs</div>
              </div>
            </div>
          </div>

          {/* TXT Files */}
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg">📝</span>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">{stats.txtFiles}</div>
                <div className="text-sm text-charcoal/70">TXT Files</div>
              </div>
            </div>
          </div>

          {/* Other Files - Documents, Spreadsheets, etc. */}
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg">📦</span>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{stats.otherFiles || 0}</div>
                <div className="text-sm text-charcoal/70">Other Files</div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar - Show when crawler is running or has data */}
        {((stats.isRunning && stats.progress) || (stats.progress && stats.progress.totalExpectedPages > 0)) && (
          <div className="px-6 pb-4">
            <div className={`rounded-lg p-4 border ${
              stats.isRunning
                ? 'bg-blue-50 border-blue-200'
                : 'bg-green-50 border-green-200'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`text-sm font-semibold ${
                  stats.isRunning ? 'text-deep-blue' : 'text-green-700'
                }`}>
                  {stats.isRunning ? 'Crawling Progress' : 'Last Crawl Results'}
                </h3>
                <div className={`text-xs ${
                  stats.isRunning ? 'text-deep-blue/70' : 'text-green-700/70'
                }`}>
                  {stats.progress?.currentPages || 0} / {stats.progress?.totalExpectedPages || 0} pages
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ease-out ${
                    stats.isRunning
                      ? 'bg-gradient-to-r from-blue-500 to-green-500'
                      : 'bg-gradient-to-r from-green-400 to-green-600'
                  } ${
                    stats.isRunning && stats.progress?.percentage === 0
                      ? 'animate-pulse'
                      : ''
                  }`}
                  style={{ width: `${Math.min(100, stats.progress?.percentage || 0)}%` }}
                ></div>
              </div>

              <div className={`flex justify-between text-xs ${
                stats.isRunning ? 'text-deep-blue/70' : 'text-green-700/70'
              }`}>
                <span>
                  {stats.progress?.percentage || 0}%
                  {stats.isRunning ? ' Complete' : ' Crawled'}
                </span>
                <span>
                  {stats.isRunning
                    ? `${stats.progress?.pagesRemaining || 0} pages remaining`
                    : `${stats.progress?.currentPages || 0} total pages found`
                  }
                </span>
              </div>

              {/* Show status message */}
              {stats.isRunning && stats.progress?.percentage === 0 && (
                <div className="mt-2 text-xs text-blue-600 animate-pulse">
                  🔍 Discovering pages...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Enhanced Activity Monitor - Two Column Layout */}
        {stats.isRunning && (
          <div className="px-6 pb-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

              {/* Left Side - Live Activity */}
              <div className="bg-gray-50 rounded-lg p-4 border">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-semibold text-charcoal">Live Activity</span>
                </div>

                <div className="space-y-3">
                  {/* Current Activity */}
                  <div className="bg-white rounded p-3 border">
                    <div className="text-xs text-gray-600 font-semibold mb-1">🔄 Current:</div>
                    <div className="text-sm text-blue-600 animate-pulse font-medium">
                      {stats.currentActivity || 'Waiting for activity...'}
                    </div>
                  </div>

                  {/* Recent Activity Logs */}
                  {stats.liveLogLines && stats.liveLogLines.length > 0 && (
                    <div className="bg-white rounded p-3 border">
                      <div className="text-xs text-gray-600 font-semibold mb-2">📋 Recent Activity:</div>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {stats.liveLogLines.slice(-5).map((line, index) => {
                          const isUrl = line.includes('FETCH') || line.includes('http')
                          const isAsset = line.includes('asset') || line.includes('Using cached')
                          const isSuccess = line.includes('✓')

                          let color = 'text-gray-600'
                          if (isUrl) color = 'text-blue-600'
                          else if (isAsset) color = 'text-orange-600'
                          else if (isSuccess) color = 'text-green-600'

                          return (
                            <div key={index} className={`${color} text-xs ${index === 4 ? 'animate-pulse font-bold' : ''}`}>
                              {line.length > 70 ? `${line.substring(0, 70)}...` : line}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side - Errors & Warnings */}
              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-sm font-semibold text-red-700">Errors & Warnings</span>
                </div>

                <div className="bg-white rounded p-3 border max-h-48 overflow-y-auto">
                  {stats.errors && stats.errors.length > 0 ? (
                    <div className="space-y-2">
                      {stats.errors.slice(-10).map((error, index) => (
                        <div key={index} className="border-l-4 border-red-400 pl-3 py-2 bg-red-50 rounded-r">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-xs px-2 py-1 rounded font-semibold ${
                                  error.type === 'ERROR' ? 'bg-red-100 text-red-700' :
                                  error.type === 'FAILED' ? 'bg-orange-100 text-orange-700' :
                                  error.type === 'TIMEOUT' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-blue-100 text-blue-700'
                                }`}>
                                  {error.type}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(error.timestamp).toLocaleTimeString()}
                                </span>
                              </div>
                              <div className="text-xs text-gray-700 break-words">
                                {error.message.length > 100 ? `${error.message.substring(0, 100)}...` : error.message}
                              </div>
                            </div>
                            <button
                              onClick={() => copyToClipboard(error.message)}
                              className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition-colors flex-shrink-0"
                              title="Copy error message"
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 text-sm py-4">
                      <div className="text-green-600 text-lg mb-2">✅</div>
                      <div>No errors or warnings</div>
                      <div className="text-xs text-gray-400 mt-1">Crawler is running smoothly</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div className="flex-1 overflow-hidden flex min-h-0">
          {/* Recent Pages */}
          <div className="w-1/2 border-r border-gray-200 flex flex-col min-w-0">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-medium text-deep-blue flex items-center gap-2">
                <span>📄</span>
                Recent Pages
              </h3>
            </div>
            <div className="p-4 h-64 overflow-y-auto">
              {stats.recentPages.length > 0 ? (
                <div className="space-y-2">
                  {stats.recentPages.map((page, index) => {
                    const isLive = page.includes('🔴 LIVE')
                    const displayName = page.replace('🔴 LIVE: ', '').replace('📄 ', '')

                    return (
                      <div key={index} className={`text-sm p-2 rounded border-l-4 ${
                        isLive
                          ? 'bg-green-50 border-green-500 animate-pulse'
                          : 'bg-gray-50 border-deep-blue'
                      }`}>
                        <div className="flex items-center gap-2 min-w-0">
                          {isLive && <div className="w-2 h-2 bg-green-500 rounded-full animate-ping flex-shrink-0"></div>}
                          <div className="font-medium text-charcoal truncate min-w-0" title={displayName}>
                            {displayName}
                          </div>
                        </div>
                        {isLive && (
                          <div className="text-xs text-green-600 mt-1">
                            Currently being processed...
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center text-charcoal/60 py-8">
                  No pages crawled yet
                </div>
              )}
            </div>
          </div>

          {/* Recent Files */}
          <div className="w-1/2 flex flex-col min-w-0">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-medium text-deep-blue flex items-center gap-2">
                <span>📁</span>
                Recent Assets
              </h3>
            </div>
            <div className="p-4 h-64 overflow-y-auto">
              {stats.recentFiles.length > 0 ? (
                <div className="space-y-2">
                  {stats.recentFiles.map((file, index) => {
                    const isNew = file.includes('🔴 NEW')
                    const isActivity = file.includes('⚡')
                    const cleanFile = file.replace('🔴 NEW: ', '').replace('⚡ ', '')

                    // Extract file type from the icon or filename
                    const isPdf = cleanFile.includes('📕') || cleanFile.toLowerCase().includes('.pdf')
                    const isTxt = cleanFile.includes('📝') || cleanFile.toLowerCase().includes('.txt')
                    const isImage = cleanFile.includes('🖼️') || (!isPdf && !isTxt && !isActivity)

                    return (
                      <div key={index} className={`text-sm p-2 rounded border-l-4 ${
                        isNew ? 'bg-blue-50 border-blue-500 animate-pulse' :
                        isActivity ? 'bg-purple-50 border-purple-500' :
                        isPdf ? 'bg-red-50 border-red-500' :
                        isTxt ? 'bg-yellow-50 border-yellow-500' :
                        'bg-green-50 border-green-500'
                      }`}>
                        <div className="flex items-center gap-2 min-w-0">
                          {isNew && <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping flex-shrink-0"></div>}
                          {isActivity && <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce flex-shrink-0"></div>}

                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-charcoal truncate" title={cleanFile}>
                              {cleanFile}
                            </div>
                            {isNew && (
                              <div className="text-xs text-blue-600 mt-1">
                                Just downloaded!
                              </div>
                            )}
                            {isActivity && (
                              <div className="text-xs text-purple-600 mt-1">
                                Live activity
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center text-charcoal/60 py-8">
                  No assets downloaded yet
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <div className="flex items-center justify-between text-sm text-charcoal/70">
            <div>
              Total Assets: <span className="font-medium text-charcoal">{stats.totalAssets}</span>
            </div>
            <div>
              Updates every {stats.isRunning ? '1' : '3'} seconds {stats.isRunning && '(faster while crawling)'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
