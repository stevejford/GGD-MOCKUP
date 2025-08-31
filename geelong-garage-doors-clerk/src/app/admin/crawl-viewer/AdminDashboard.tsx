"use client"
import { useEffect, useState, useCallback } from 'react'
import { useWebSocket } from '@/hooks/useWebSocket'

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

export default function AdminDashboard() {
  const [stats, setStats] = useState<CrawlStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(false)

  // WebSocket connection for real-time admin stats
  const { connect, disconnect } = useWebSocket({
    url: 'ws://localhost:8080/api/ws',
    onMessage: useCallback((data: any) => {
      if (data.type === 'admin_stats_update' && data.data) {
        setStats(data.data)
        setLoading(false)
        console.log('📊 Received real-time admin stats:', data.data)
      }
    }, []),
    onConnect: useCallback(() => {
      setIsConnected(true)
      console.log('🔗 AdminDashboard WebSocket connected')
    }, []),
    onDisconnect: useCallback(() => {
      setIsConnected(false)
      console.log('🔌 AdminDashboard WebSocket disconnected')
    }, []),
    onError: useCallback((error: Event) => {
      if (process.env.NODE_ENV === 'development') {
        console.debug('AdminDashboard WebSocket connection issue (normal in dev)')
      } else {
        console.error('❌ AdminDashboard WebSocket error:', error)
      }
    }, [])
  })

  useEffect(() => {
    const loadInitialStats = async () => {
      try {
        const res = await fetch('/api/admin/stats', { cache: 'no-store' })
        const data = await res.json()
        setStats(data)
        console.log('📊 Initial admin stats loaded:', data)
      } catch (error) {
        console.error('❌ Failed to load initial admin stats:', error)
      } finally {
        setLoading(false)
      }
    }

    // Connect WebSocket and load initial data
    connect()
    loadInitialStats()

    return () => disconnect()
  }, []) // Empty dependency array - connect/disconnect are stable

  if (loading) {
    return <div className="space-y-6 animate-pulse">
      <div className="h-64 bg-gray-200 rounded"></div>
      <div className="h-48 bg-gray-200 rounded"></div>
    </div>
  }

  return (
    <div className="space-y-6">
      {/* Brand Performance Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Brand Performance</h3>
              <p className="text-sm text-gray-600">Overview of crawled data by brand</p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <span className="text-gray-600">
                {isConnected ? '🔴 Live Updates' : '⚪ Disconnected'}
              </span>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 font-medium">Brand</th>
                <th className="text-right py-3 px-4 font-medium">Pages</th>
                <th className="text-right py-3 px-4 font-medium">Assets</th>
                <th className="text-right py-3 px-4 font-medium">Embeddings</th>
                <th className="text-right py-3 px-4 font-medium">Last Crawled</th>
                <th className="text-center py-3 px-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {stats?.brandStats?.map((brand, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="font-medium capitalize">{brand.brand.replace('-', ' ')}</div>
                  </td>
                  <td className="text-right py-3 px-4">
                    <span className="font-mono">{brand.pages.toLocaleString()}</span>
                  </td>
                  <td className="text-right py-3 px-4">
                    <span className="font-mono text-vibrant-orange">{brand.assets.toLocaleString()}</span>
                  </td>
                  <td className="text-right py-3 px-4">
                    <span className="font-mono text-green-600">{brand.embeddings.toLocaleString()}</span>
                  </td>
                  <td className="text-right py-3 px-4 text-gray-600">
                    {brand.lastCrawled ? new Date(brand.lastCrawled).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="text-center py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      brand.pages > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {brand.pages > 0 ? 'Active' : 'Empty'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">Recent Activity</h3>
          <p className="text-sm text-gray-600">Latest crawling and processing activities</p>
        </div>
        <div className="p-4">
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {stats?.recentActivity?.length ? stats.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    activity.status === 'success' ? 'bg-green-500' :
                    activity.status === 'error' ? 'bg-red-500' : 'bg-yellow-500'
                  }`}></div>
                  <div>
                    <div className="text-sm font-medium">{activity.action}</div>
                    <div className="text-xs text-gray-600 capitalize">{activity.brand.replace('-', ' ')}</div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(activity.timestamp).toLocaleString()}
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-sm">No recent activity</div>
                <div className="text-xs">Start a crawl to see activity here</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">Quick Actions</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="p-4 border border-deep-blue-light rounded-lg hover:bg-deep-blue-light text-center">
              <div className="text-deep-blue font-medium">Refresh Stats</div>
              <div className="text-xs text-gray-600 mt-1">Update dashboard</div>
            </button>
            <button className="p-4 border border-vibrant-orange-light rounded-lg hover:bg-vibrant-orange-light text-center">
              <div className="text-vibrant-orange font-medium">Download Assets</div>
              <div className="text-xs text-gray-600 mt-1">Batch download</div>
            </button>
            <button className="p-4 border border-green-200 rounded-lg hover:bg-green-50 text-center">
              <div className="text-green-600 font-medium">Generate Embeddings</div>
              <div className="text-xs text-gray-600 mt-1">Process content</div>
            </button>
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-center">
              <div className="text-gray-600 font-medium">Export Data</div>
              <div className="text-xs text-gray-600 mt-1">Download CSV</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
