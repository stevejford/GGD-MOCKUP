"use client"
import { useState, useEffect } from 'react'

interface ScrapedSite {
  id: number
  site_id: string
  site_name: string
  url: string
  description?: string
  created_at: string
  updated_at: string
  last_scraped_at?: string
  total_pages: number
  total_assets: number
  status: string
}

interface ScrapedSitesListProps {
  isVisible: boolean
  onClose: () => void
}

export default function ScrapedSitesList({ isVisible, onClose }: ScrapedSitesListProps) {
  const [sites, setSites] = useState<ScrapedSite[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isVisible) {
      fetchSites()
    }
  }, [isVisible])

  const fetchSites = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/scrape/sites')
      const data = await response.json()
      
      if (data.success) {
        setSites(data.sites)
      }
    } catch (error) {
      console.error('Failed to fetch sites:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      case 'error': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-deep-blue">
              🗄️ Scraped Sites Database
            </h2>
            <p className="text-charcoal/70 text-sm mt-1">
              All websites that have been scraped and stored
            </p>
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

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 border-2 border-deep-blue border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : sites.length > 0 ? (
            <div className="overflow-y-auto h-full">
              <div className="grid gap-4 p-6">
                {sites.map((site) => (
                  <div key={site.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-deep-blue">
                            {site.site_name}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(site.status)}`}>
                            {site.status}
                          </span>
                        </div>
                        
                        <div className="text-sm text-charcoal/70 mb-2">
                          <a 
                            href={site.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-deep-blue hover:underline"
                          >
                            {site.url}
                          </a>
                        </div>
                        
                        {site.description && (
                          <p className="text-sm text-charcoal/80 mb-3">
                            {site.description}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-6 text-xs text-charcoal/60">
                          <div>
                            <span className="font-medium">Site ID:</span> {site.site_id}
                          </div>
                          <div>
                            <span className="font-medium">Created:</span> {formatDate(site.created_at)}
                          </div>
                          {site.last_scraped_at && (
                            <div>
                              <span className="font-medium">Last Scraped:</span> {formatDate(site.last_scraped_at)}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="ml-4 text-right">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-deep-blue">{site.total_pages}</div>
                            <div className="text-xs text-charcoal/60">Pages</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-vibrant-orange">{site.total_assets}</div>
                            <div className="text-xs text-charcoal/60">Assets</div>
                          </div>
                        </div>
                        
                        <div className="mt-3 flex gap-2">
                          <button className="px-3 py-1 text-xs bg-deep-blue text-white rounded hover:bg-deep-blue-hover">
                            View Data
                          </button>
                          <button className="px-3 py-1 text-xs border border-gray-300 text-charcoal rounded hover:bg-gray-50">
                            Re-scrape
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="text-6xl mb-4">🌐</div>
              <h3 className="text-lg font-medium text-charcoal mb-2">No Sites Scraped Yet</h3>
              <p className="text-charcoal/60 mb-4">
                Use the "🌐 Any Site" button to scrape your first website
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <div className="flex items-center justify-between text-sm text-charcoal/70">
            <div>
              Total Sites: <span className="font-medium text-charcoal">{sites.length}</span>
            </div>
            <div>
              Data stored in Neon PostgreSQL database
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
