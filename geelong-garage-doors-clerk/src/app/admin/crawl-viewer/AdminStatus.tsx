"use client"
import { useEffect, useState, useCallback } from 'react'
import { useWebSocket } from '@/hooks/useWebSocket'

type Health = {
  ok: boolean
  loggedIn: boolean
  isAdmin: boolean
  userId?: string | null
  primaryEmail?: string | null
  emails?: string[]
  adminEmailsEnv?: string
  paths?: {
    CRAWL_MD_ROOT: { value: string; exists: boolean }
    CRAWL_PY_ROOT: { value: string; exists: boolean }
  }
  db?: { hasDb: boolean; missingPassword: boolean }
  error?: string
}

type CrawlStats = {
  totalPages: number
  totalBrands: number
  totalAssets: number
  totalEmbeddings: number
  brandStats: Array<{
    brand: string
    pages: number
    assets: number
    embeddings: number
    lastCrawled: string
  }>
  recentActivity: Array<{
    action: string
    brand: string
    timestamp: string
    status: 'success' | 'error' | 'pending'
  }>
}

export default function AdminStatus() {
  const [health, setHealth] = useState<Health | null>(null)
  const [stats, setStats] = useState<CrawlStats | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(false)

  // WebSocket connection for real-time health and stats
  const { connect, disconnect } = useWebSocket({
    url: 'ws://localhost:8080/api/ws',
    onMessage: useCallback((data: any) => {
      if (data.type === 'health_update' && data.data) {
        setHealth(data.data)
        console.log('🏥 Received real-time health update:', data.data)
      }
      if (data.type === 'admin_stats_update' && data.data) {
        setStats(data.data)
        console.log('📊 Received real-time admin stats:', data.data)
      }
      setLoading(false)
    }, []),
    onConnect: useCallback(() => {
      setIsConnected(true)
      console.log('🔗 AdminStatus WebSocket connected')
    }, []),
    onDisconnect: useCallback(() => {
      setIsConnected(false)
      console.log('🔌 AdminStatus WebSocket disconnected')
    }, []),
    onError: useCallback((error: Event) => {
      if (process.env.NODE_ENV === 'development') {
        console.debug('AdminStatus WebSocket connection issue (normal in dev)')
      } else {
        console.error('❌ AdminStatus WebSocket error:', error)
      }
    }, [])
  })

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [healthRes, statsRes] = await Promise.all([
          fetch('/api/admin/health', { cache: 'no-store' }),
          fetch('/api/admin/stats', { cache: 'no-store' })
        ])

        const healthData = await healthRes.json()
        const statsData = await statsRes.json()

        setHealth(healthData)
        setStats(statsData)
        console.log('🏥 Initial health loaded:', healthData)
        console.log('📊 Initial admin stats loaded:', statsData)
      } catch (e: any) {
        setError(e?.message || 'failed to load initial data')
      } finally {
        setLoading(false)
      }
    }

    // Connect WebSocket and load initial data
    connect()
    loadInitialData()

    return () => disconnect()
  }, []) // Empty dependency array - connect/disconnect are stable

  const Badge = ({ ok, label }: { ok: boolean; label: string }) => (
    <span className={`px-2 py-0.5 rounded text-xs ${ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{label}</span>
  )

  if (loading) {
    return <div className="mb-6 border border-gray-200 rounded p-4 bg-white animate-pulse">Loading dashboard...</div>
  }

  return (
    <div className="mb-6 space-y-6">
      {/* System Health */}
      <div className="border border-gray-200 rounded p-4 bg-white">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">System Health</h3>
          <div className="flex items-center gap-2 text-xs">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            <span className="text-gray-600">
              {isConnected ? '🔴 Live' : '⚪ Disconnected'}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {health ? (
            <>
              <Badge ok={!!health.loggedIn} label={`Auth: ${health.loggedIn ? 'OK' : 'Failed'}`} />
              <Badge ok={!!health.isAdmin} label={`Admin: ${health.isAdmin ? 'OK' : 'No Access'}`} />
              <Badge ok={!!health?.paths?.CRAWL_MD_ROOT?.exists} label={`Storage: ${health?.paths?.CRAWL_MD_ROOT?.exists ? 'OK' : 'Missing'}`} />
              <Badge ok={!!health?.db?.hasDb && !health?.db?.missingPassword} label={`Database: ${(health?.db?.hasDb && !health?.db?.missingPassword) ? 'OK' : 'Check Config'}`} />
            </>
          ) : (
            <span className="text-gray-500">Loading system status...</span>
          )}
        </div>

        {health?.paths?.CRAWL_MD_ROOT?.value && (
          <div className="text-sm text-gray-600 flex items-center gap-3">
            <span>Data Path: {health.paths.CRAWL_MD_ROOT.value}</span>
            {!health.paths.CRAWL_MD_ROOT.exists && (
              <button
                className="px-3 py-1 text-xs rounded bg-deep-blue text-white hover:bg-deep-blue-hover"
                onClick={async () => {
                  try {
                    const res = await fetch('/api/admin/fix-md-root', { method: 'POST' })
                    const j = await res.json()
                    if (!res.ok || j.error) throw new Error(j.error || 'Failed to create folder')
                    // Reload health data
                    const r2 = await fetch('/api/admin/health', { cache: 'no-store' })
                    setHealth(await r2.json())
                  } catch (e: any) {
                    setError(e?.message || 'Failed to create folder')
                  }
                }}
              >
                Create Folder
              </button>
            )}
          </div>
        )}

        {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-3xl font-bold text-deep-blue">{stats?.totalPages?.toLocaleString() || 0}</div>
          <div className="text-sm text-gray-600">Total Pages</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-3xl font-bold text-deep-blue">{stats?.totalBrands || 0}</div>
          <div className="text-sm text-gray-600">Brands</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-3xl font-bold text-vibrant-orange">{stats?.totalAssets?.toLocaleString() || 0}</div>
          <div className="text-sm text-gray-600">Downloaded Assets</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-3xl font-bold text-green-600">{stats?.totalEmbeddings?.toLocaleString() || 0}</div>
          <div className="text-sm text-gray-600">Embeddings</div>
        </div>
      </div>
    </div>
  )
}
