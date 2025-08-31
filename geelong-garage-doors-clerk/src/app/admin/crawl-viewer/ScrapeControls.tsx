"use client"
import { useEffect, useRef, useState, useCallback } from 'react'
import { useWebSocket } from '@/hooks/useWebSocket'
import CrawlerSettingsDialog, { CrawlerSettings } from './CrawlerSettingsDialog'
import RealTimeCrawlStats from './RealTimeCrawlStats'
import UniversalScrapeDialog from './UniversalScrapeDialog'
import ScrapedSitesList from './ScrapedSitesList'

export default function ScrapeControls() {
  const [running, setRunning] = useState(false)
  const [pid, setPid] = useState<number | undefined>()
  const [logLines, setLogLines] = useState<string[]>([])
  const [error, setError] = useState<string>('')
  const [logPath, setLogPath] = useState<string>('')
  const [brands, setBrands] = useState<string[]>([])
  const [brand, setBrand] = useState<string>('')
  const [showSettings, setShowSettings] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [showUniversalScraper, setShowUniversalScraper] = useState(false)
  const [showSitesList, setShowSitesList] = useState(false)
  const [settings, setSettings] = useState<CrawlerSettings>({
    downloadAssets: false,
    wait: 3,
    delay: 2,
    maxPages: 0,
    concurrency: 5,
    // Default optimizations - enabled by default
    progressiveCrawling: true,
    stealthMode: true,
    networkCapture: true,
    consoleLogging: true,
    headlessMode: true
  })
  const [isConnected, setIsConnected] = useState(false)

  // WebSocket connection for real-time scrape status
  const { connect, disconnect } = useWebSocket({
    url: 'ws://localhost:8080/api/ws',
    onMessage: useCallback((data: any) => {
      if (data.type === 'scrape_status_update' && data.data) {
        const status = data.data
        setRunning(!!status.running)
        setPid(status.pid)
        setLogLines(status.lastLogLines || [])
        setError(status.error || '')
        setLogPath(status.logPath || '')
        console.log('🔧 Received real-time scrape status:', status)
      }
    }, []),
    onConnect: useCallback(() => {
      setIsConnected(true)
      console.log('🔗 ScrapeControls WebSocket connected')
    }, []),
    onDisconnect: useCallback(() => {
      setIsConnected(false)
      console.log('🔌 ScrapeControls WebSocket disconnected')
    }, []),
    onError: useCallback((error: Event) => {
      // Suppress routine connection errors in development
      if (process.env.NODE_ENV === 'development') {
        console.debug('ScrapeControls WebSocket connection issue (normal in dev)')
      } else {
        console.error('❌ ScrapeControls WebSocket error:', error)
      }
    }, [])
  })

  useEffect(() => {
    const loadInitialStatus = async () => {
      try {
        const res = await fetch('/api/scrape/status', { cache: 'no-store' })
        const data = await res.json()
        setRunning(!!data.running)
        setPid(data.pid)
        setLogLines(data.lastLogLines || [])
        setError(data.error || '')
        setLogPath(data.logPath || '')
        console.log('🔧 Initial scrape status loaded:', data)
      } catch (error) {
        console.error('❌ Failed to load initial scrape status:', error)
      }
    }

    // Connect WebSocket and load initial status
    connect()
    loadInitialStatus()

    return () => disconnect()
  }, []) // Empty dependency array - connect/disconnect are stable

  useEffect(() => {
    const loadBrands = async () => {
      try {
        const res = await fetch('/api/crawl/brands', { cache: 'no-store' })
        const data = await res.json()
        setBrands(data.brands || [])
      } catch {}
    }

    const loadSettings = async () => {
      try {
        const res = await fetch('/api/crawler/settings', { cache: 'no-store' })
        if (!res.ok) {
          console.warn('Settings API not available, using defaults')
          return
        }
        const data = await res.json()
        if (data.ok && data.settings) {
          setSettings(data.settings)
        }
      } catch (error) {
        console.warn('Failed to load settings, using defaults:', error)
        // Continue with default settings - don't throw error
      }
    }

    loadBrands()
    loadSettings()
  }, [])

  // Autosave settings
  const saveSettings = async (newSettings: CrawlerSettings) => {
    try {
      const res = await fetch('/api/crawler/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: newSettings })
      })
      if (!res.ok) {
        console.warn('Settings API not available for saving')
        return
      }
      const data = await res.json()
      if (!data.ok) {
        console.warn('Failed to save settings:', data.error)
      }
    } catch (error) {
      console.warn('Failed to save settings:', error)
      // Don't throw error - continue with local state
    }
  }

  // Update settings with autosave
  const updateSettings = (newSettings: CrawlerSettings) => {
    setSettings(newSettings)
    saveSettings(newSettings) // Autosave
  }

  const start = async () => {
    try {
      setError('')
      const res = await fetch('/api/scrape/start', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          brand: brand || undefined,
          downloadAssets: settings.downloadAssets,
          wait: settings.wait,
          delay: settings.delay
        })
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error || 'Failed to start')
      setRunning(true)
      setPid(data.pid)
      setLogPath(data.logPath || '')
    } catch (e: any) {
      setError(e?.message || 'Failed to start')
    }
  }

  const stop = async () => {
    await fetch('/api/scrape/stop', { method: 'POST' })
    // Status will be updated via WebSocket
  }

  return (
    <div className="space-y-6">
      {/* Quick Start */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-charcoal mb-2">Select Brand</label>
          <select
            className="w-full border border-deep-blue-light rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-deep-blue focus:border-deep-blue"
            value={brand}
            onChange={e=>setBrand(e.target.value)}
          >
            <option value="">All brands</option>
            {brands.map(b => (
              <option key={b} value={b} className="capitalize">{b.replace('-', ' ')}</option>
            ))}
          </select>
        </div>

        <div className="flex items-end gap-3">
          <button
            onClick={() => setShowSettings(true)}
            className="px-4 py-3 border border-deep-blue-light text-deep-blue rounded-lg hover:bg-deep-blue-light/10 font-medium flex items-center gap-2"
          >
            ⚙️ Settings
          </button>

          <button
            onClick={() => setShowStats(true)}
            className="px-4 py-3 border border-vibrant-orange text-vibrant-orange rounded-lg hover:bg-vibrant-orange-light/10 font-medium flex items-center gap-2"
          >
            📊 Live Stats
          </button>

          <button
            onClick={() => setShowUniversalScraper(true)}
            className="px-4 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 font-medium flex items-center gap-2 shadow-lg"
          >
            🌐 Any Site
          </button>

          <button
            onClick={() => setShowSitesList(true)}
            className="px-4 py-3 border border-gray-400 text-gray-700 rounded-lg hover:bg-gray-50 font-medium flex items-center gap-2"
          >
            🗄️ Database
          </button>

          <button
            onClick={start}
            disabled={running}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              running
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-deep-blue text-white hover:bg-deep-blue-hover shadow-sm hover:shadow-md'
            }`}
          >
            {running ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Crawling...
              </span>
            ) : (
              '🕷️ Start Crawl'
            )}
          </button>

          <button
            onClick={stop}
            disabled={!running}
            className={`px-6 py-3 rounded-lg border font-medium transition-all ${
              running
                ? 'border-vibrant-orange text-vibrant-orange hover:bg-vibrant-orange-light'
                : 'border-gray-300 text-gray-400 cursor-not-allowed'
            }`}
          >
            ⏹️ Stop
          </button>
        </div>
      </div>

      {/* Current Settings Display */}
      <div className="bg-deep-blue-light/10 rounded-lg p-4 border border-deep-blue-light">
        <h4 className="font-medium text-deep-blue mb-2">Current Settings</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-charcoal/60">Download Assets:</span>
            <span className={`ml-2 font-medium ${settings.downloadAssets ? 'text-green-600' : 'text-gray-500'}`}>
              {settings.downloadAssets ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <div>
            <span className="text-charcoal/60">Wait Time:</span>
            <span className="ml-2 font-medium text-charcoal">{settings.wait}s</span>
          </div>
          <div>
            <span className="text-charcoal/60">Delay:</span>
            <span className="ml-2 font-medium text-charcoal">{settings.delay}s</span>
          </div>
          <div>
            <span className="text-charcoal/60">Max Pages:</span>
            <span className="ml-2 font-medium text-charcoal">{settings.maxPages || 'Unlimited'}</span>
          </div>
        </div>

        {/* Optimization Settings */}
        <div className="mt-4 pt-4 border-t border-deep-blue-light/30">
          <h5 className="font-medium text-deep-blue mb-2">Active Optimizations</h5>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${settings.progressiveCrawling ? 'bg-green-500' : 'bg-gray-400'}`}></span>
              <span className="text-charcoal/70">Progressive</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${settings.stealthMode ? 'bg-green-500' : 'bg-gray-400'}`}></span>
              <span className="text-charcoal/70">Stealth</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${settings.networkCapture ? 'bg-green-500' : 'bg-gray-400'}`}></span>
              <span className="text-charcoal/70">Network</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${settings.consoleLogging ? 'bg-green-500' : 'bg-gray-400'}`}></span>
              <span className="text-charcoal/70">Console</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${settings.headlessMode ? 'bg-green-500' : 'bg-gray-400'}`}></span>
              <span className="text-charcoal/70">Headless</span>
            </div>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${running ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
          <span className="font-medium text-charcoal">
            {running ? '🟢 Crawling' : '🔴 Stopped'}
          </span>
          {pid && <span className="text-sm text-charcoal/60">PID: {pid}</span>}
          {isConnected && (
            <span className="text-charcoal/40 text-xs">• Live</span>
          )}
        </div>

        {logPath && (
          <div className="text-sm text-charcoal/60">
            Log: {logPath}
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <span className="text-red-500">⚠️</span>
            <span className="text-red-700 font-medium">Crawler Error</span>
          </div>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Live Logs - Always show when running or has logs */}
      {(running || logLines.length > 0) && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-charcoal flex items-center gap-2">
                  {running && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>}
                  Live Crawler Activity
                </h4>
                {logPath && <p className="text-xs text-charcoal/60 mt-1">{logPath}</p>}
              </div>
              <div className="text-xs text-charcoal/60">
                {logLines.length} log entries
              </div>
            </div>
          </div>
          <div className="p-4">
            <div
              className="bg-gray-900 rounded-lg p-4 max-h-64 overflow-auto"
              ref={(el) => {
                if (el && running) {
                  el.scrollTop = el.scrollHeight
                }
              }}
            >
              <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">
                {running && logLines.length === 0 ? (
                  <div className="text-yellow-400 animate-pulse">
                    🕷️ Crawler starting up...
                    {'\n'}⏳ Initializing browser and loading cache...
                    {'\n'}📡 Waiting for first URL to be processed...
                  </div>
                ) : logLines.length > 0 ? (
                  <div>
                    {/* Show recent activity with color coding */}
                    {logLines.slice(-20).map((line, index) => {
                      const isUrl = line.includes('FETCH') || line.includes('http')
                      const isAsset = line.includes('asset') || line.includes('Using cached')
                      const isSuccess = line.includes('✓') || line.includes('SUCCESS')
                      const isError = line.includes('ERROR') || line.includes('FAILED')
                      const isProgress = line.includes('⏱:') || line.includes('|')

                      let color = 'text-green-400'
                      if (isUrl) color = 'text-cyan-400'
                      else if (isAsset) color = 'text-orange-400'
                      else if (isSuccess) color = 'text-green-300'
                      else if (isError) color = 'text-red-400'
                      else if (isProgress) color = 'text-blue-400'

                      return (
                        <div key={index} className={`${color} ${index === logLines.slice(-20).length - 1 ? 'animate-pulse font-bold' : ''}`}>
                          {line}
                        </div>
                      )
                    })}

                    {/* Show live indicator */}
                    <div className="text-green-500 animate-pulse mt-2">
                      ● LIVE - Crawler is actively processing...
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500">No recent activity</div>
                )}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Settings Dialog */}
      <CrawlerSettingsDialog
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onSave={updateSettings}
        currentSettings={settings}
      />

      {/* Real-Time Stats Dialog */}
      <RealTimeCrawlStats
        isVisible={showStats}
        onClose={() => setShowStats(false)}
      />

      {/* Universal Scraper Dialog */}
      <UniversalScrapeDialog
        isOpen={showUniversalScraper}
        onClose={() => setShowUniversalScraper(false)}
      />

      {/* Scraped Sites List */}
      <ScrapedSitesList
        isVisible={showSitesList}
        onClose={() => setShowSitesList(false)}
      />
    </div>
  )
}
