"use client"
import { useState, useEffect } from 'react'

interface UniversalScrapeDialogProps {
  isOpen: boolean
  onClose: () => void
}

interface ScrapeFormData {
  url: string
  siteName: string
  description: string
  maxPages: number
  downloadAssets: boolean
}

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

export default function UniversalScrapeDialog({ isOpen, onClose }: UniversalScrapeDialogProps) {
  const [formData, setFormData] = useState<ScrapeFormData>({
    url: '',
    siteName: '',
    description: '',
    maxPages: 50,
    downloadAssets: true
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<{success: boolean, message?: string, error?: string} | null>(null)
  const [scrapedSites, setScrapedSites] = useState<ScrapedSite[]>([])
  const [filteredSites, setFilteredSites] = useState<ScrapedSite[]>([])
  const [isLoadingSites, setIsLoadingSites] = useState(false)

  // Fetch scraped sites when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchScrapedSites()
    }
  }, [isOpen])

  // Filter sites based on URL input
  useEffect(() => {
    if (!formData.url.trim()) {
      setFilteredSites([])
      return
    }

    const searchTerm = formData.url.toLowerCase()
    const filtered = scrapedSites.filter(site =>
      site.url.toLowerCase().includes(searchTerm) ||
      site.site_name.toLowerCase().includes(searchTerm) ||
      site.site_id.toLowerCase().includes(searchTerm)
    )
    setFilteredSites(filtered)
  }, [formData.url, scrapedSites])

  const fetchScrapedSites = async () => {
    setIsLoadingSites(true)
    try {
      const response = await fetch('/api/scrape/sites')
      const data = await response.json()

      if (data.success) {
        setScrapedSites(data.sites)
      }
    } catch (error) {
      console.error('Failed to fetch scraped sites:', error)
    } finally {
      setIsLoadingSites(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setResult(null)

    try {
      const response = await fetch('/api/scrape/universal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()
      setResult(data)

      if (data.success) {
        // Reset form on success
        setTimeout(() => {
          setFormData({
            url: '',
            siteName: '',
            description: '',
            maxPages: 50,
            downloadAssets: true
          })
          setResult(null)
          onClose()
        }, 3000)
      }
    } catch (error) {
      setResult({
        success: false,
        error: 'Failed to start scraping. Please try again.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUrlChange = (url: string) => {
    setFormData(prev => ({ ...prev, url }))

    // Auto-generate site name if not manually set
    if (url && !formData.siteName) {
      try {
        const parsedUrl = new URL(url)
        const domain = parsedUrl.hostname.replace('www.', '')
        const parts = domain.split('.')
        const mainPart = parts[0]

        const autoName = mainPart
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')

        setFormData(prev => ({ ...prev, siteName: autoName }))
      } catch {
        // Invalid URL, ignore
      }
    }
  }

  const handleReScrape = async (site: ScrapedSite) => {
    // Pre-fill form with existing site data
    setFormData({
      url: site.url,
      siteName: site.site_name,
      description: site.description || '',
      maxPages: 50, // Default for re-scrape
      downloadAssets: true
    })

    // Automatically start the scrape
    setIsSubmitting(true)
    setResult(null)

    try {
      const response = await fetch('/api/scrape/universal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: site.url,
          siteName: site.site_name,
          description: site.description,
          maxPages: 50,
          downloadAssets: true
        }),
      })

      const data = await response.json()
      setResult(data)

      if (data.success) {
        // Reset form on success
        setTimeout(() => {
          setFormData({
            url: '',
            siteName: '',
            description: '',
            maxPages: 50,
            downloadAssets: true
          })
          setResult(null)
          onClose()
        }, 3000)
      }
    } catch (error) {
      setResult({
        success: false,
        error: 'Failed to start re-scraping. Please try again.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-deep-blue">
                🌐 Universal Site Scraper
              </h2>
              <p className="text-charcoal/70 text-sm mt-1">
                Scrape any website and automatically organize the data
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
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* URL Input */}
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-charcoal mb-2">
              Website URL *
            </label>
            <input
              type="url"
              id="url"
              required
              value={formData.url}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-deep-blue focus:border-transparent"
            />
            <p className="text-xs text-charcoal/60 mt-1">
              Enter the full URL including https://
            </p>

            {/* Search History */}
            {formData.url.trim() && filteredSites.length > 0 && (
              <div className="mt-3 border border-gray-200 rounded-lg bg-gray-50 max-h-48 overflow-y-auto">
                <div className="p-3 border-b border-gray-200 bg-white rounded-t-lg">
                  <h4 className="text-sm font-medium text-deep-blue flex items-center gap-2">
                    🕒 Previously Scraped Sites
                    <span className="text-xs text-charcoal/60 font-normal">
                      ({filteredSites.length} found)
                    </span>
                  </h4>
                </div>
                <div className="p-2 space-y-2">
                  {filteredSites.map((site) => (
                    <div key={site.id} className="bg-white rounded-lg p-3 border border-gray-200 hover:shadow-sm transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h5 className="font-medium text-charcoal truncate">
                              {site.site_name}
                            </h5>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              site.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {site.status}
                            </span>
                          </div>
                          <p className="text-xs text-deep-blue hover:underline truncate mb-2">
                            {site.url}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-charcoal/60">
                            <span>📄 {site.total_pages} pages</span>
                            <span>📎 {site.total_assets} assets</span>
                            {site.last_scraped_at && (
                              <span>🕒 {new Date(site.last_scraped_at).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleReScrape(site)}
                          disabled={isSubmitting}
                          className={`ml-3 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 ${
                            isSubmitting
                              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                              : 'bg-vibrant-orange text-white hover:bg-vibrant-orange-hover'
                          }`}
                        >
                          {isSubmitting ? (
                            <>
                              <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                              Re-scraping...
                            </>
                          ) : (
                            <>
                              🔄 Re-scrape
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No matches found */}
            {formData.url.trim() && !isLoadingSites && scrapedSites.length > 0 && filteredSites.length === 0 && (
              <div className="mt-3 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="text-center text-sm text-charcoal/60">
                  <div className="text-2xl mb-2">🔍</div>
                  <div>No previously scraped sites match "{formData.url}"</div>
                  <div className="text-xs mt-1">This will be a new site to scrape</div>
                </div>
              </div>
            )}

            {/* Loading state for sites */}
            {isLoadingSites && formData.url.trim() && (
              <div className="mt-3 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-center justify-center gap-2 text-sm text-charcoal/60">
                  <div className="w-4 h-4 border-2 border-deep-blue border-t-transparent rounded-full animate-spin"></div>
                  Searching scraped sites...
                </div>
              </div>
            )}
          </div>

          {/* Site Name */}
          <div>
            <label htmlFor="siteName" className="block text-sm font-medium text-charcoal mb-2">
              Site Name
            </label>
            <input
              type="text"
              id="siteName"
              value={formData.siteName}
              onChange={(e) => setFormData(prev => ({ ...prev, siteName: e.target.value }))}
              placeholder="Auto-generated from URL"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-deep-blue focus:border-transparent"
            />
            <p className="text-xs text-charcoal/60 mt-1">
              Friendly name for this site (auto-generated if left empty)
            </p>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-charcoal mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Optional description of this website..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-deep-blue focus:border-transparent"
            />
          </div>

          {/* Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="maxPages" className="block text-sm font-medium text-charcoal mb-2">
                Max Pages
              </label>
              <input
                type="number"
                id="maxPages"
                min="1"
                max="1000"
                value={formData.maxPages}
                onChange={(e) => setFormData(prev => ({ ...prev, maxPages: parseInt(e.target.value) || 50 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-deep-blue focus:border-transparent"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="downloadAssets"
                checked={formData.downloadAssets}
                onChange={(e) => setFormData(prev => ({ ...prev, downloadAssets: e.target.checked }))}
                className="rounded"
              />
              <label htmlFor="downloadAssets" className="ml-2 text-sm font-medium text-charcoal">
                Download Assets
              </label>
            </div>
          </div>

          {/* Result Display */}
          {result && (
            <div className={`p-4 rounded-lg ${
              result.success 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className={`flex items-center gap-2 font-medium ${
                result.success ? 'text-green-700' : 'text-red-700'
              }`}>
                <span>{result.success ? '✅' : '❌'}</span>
                {result.success ? 'Scraping Started!' : 'Error'}
              </div>
              <p className={`text-sm mt-1 ${
                result.success ? 'text-green-600' : 'text-red-600'
              }`}>
                {result.message || result.error}
              </p>
              {result.success && (
                <p className="text-xs text-green-600 mt-2">
                  This dialog will close automatically in a few seconds...
                </p>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="text-xs text-charcoal/60">
              Data will be stored in Neon database and organized by site
            </div>
            
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-charcoal rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={isSubmitting || !formData.url}
                className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
                  isSubmitting || !formData.url
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-vibrant-orange text-white hover:bg-vibrant-orange-hover'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Starting...
                  </>
                ) : (
                  <>
                    🚀 Start Scraping
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
