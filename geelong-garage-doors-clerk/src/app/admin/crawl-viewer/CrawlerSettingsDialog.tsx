"use client"
import { useState, useEffect } from 'react'

interface CleanupResult {
  success: boolean
  totalRemoved: number
  totalSaved: number
  brandResults: Array<{
    brand: string
    removed: number
    saved: number
    error?: string
  }>
  error?: string
}

interface CrawlerSettingsDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (settings: CrawlerSettings) => void
  currentSettings: CrawlerSettings
}

export interface CrawlerSettings {
  downloadAssets: boolean
  wait: number
  delay: number
  maxPages: number
  concurrency: number
  // Default Optimizations
  progressiveCrawling: boolean
  stealthMode: boolean
  networkCapture: boolean
  consoleLogging: boolean
  headlessMode: boolean
}

export default function CrawlerSettingsDialog({
  isOpen,
  onClose,
  onSave,
  currentSettings
}: CrawlerSettingsDialogProps) {
  const [settings, setSettings] = useState<CrawlerSettings>(currentSettings)
  const [isCleaningUp, setIsCleaningUp] = useState(false)
  const [cleanupResult, setCleanupResult] = useState<CleanupResult | null>(null)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // Update local settings when currentSettings change
  useEffect(() => {
    setSettings(currentSettings)
  }, [currentSettings])

  // Autosave functionality
  const autosave = async (newSettings: CrawlerSettings) => {
    setSaving(true)
    try {
      onSave(newSettings) // This will trigger the parent's updateSettings function
      setLastSaved(new Date())
    } catch (error) {
      console.error('Autosave failed:', error)
    } finally {
      setSaving(false)
    }
  }

  // Update settings with autosave
  const updateSettings = (newSettings: CrawlerSettings) => {
    setSettings(newSettings)
    autosave(newSettings)
  }

  if (!isOpen) return null

  const handleSave = () => {
    onSave(settings)
    onClose()
  }

  const handleReset = () => {
    const defaultSettings = {
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
    }
    updateSettings(defaultSettings)
  }

  const handleCleanupDuplicates = async () => {
    setIsCleaningUp(true)
    setCleanupResult(null)

    try {
      const response = await fetch('/api/scrape/cleanup-duplicates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result: CleanupResult = await response.json()
      setCleanupResult(result)

      if (!result.success) {
        console.error('Cleanup failed:', result.error)
      }
    } catch (error) {
      console.error('Failed to cleanup duplicates:', error)
      setCleanupResult({
        success: false,
        error: 'Failed to connect to cleanup service',
        totalRemoved: 0,
        totalSaved: 0,
        brandResults: []
      })
    } finally {
      setIsCleaningUp(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-xl font-semibold text-deep-blue">Crawler Settings</h2>
                {saving && (
                  <div className="flex items-center gap-2 text-sm text-vibrant-orange">
                    <div className="w-3 h-3 border border-vibrant-orange border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </div>
                )}
                {lastSaved && !saving && (
                  <div className="text-sm text-green-600">
                    ✓ Saved {lastSaved.toLocaleTimeString()}
                  </div>
                )}
              </div>
              <p className="text-charcoal/70 text-sm">Configure advanced crawler options • Changes are saved automatically</p>
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Asset Download */}
          <div className="bg-deep-blue-light/10 rounded-lg p-4 border border-deep-blue-light">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="downloadAssets"
                checked={settings.downloadAssets}
                onChange={e => updateSettings({...settings, downloadAssets: e.target.checked})}
                className="mt-1 rounded"
              />
              <div className="flex-1">
                <label htmlFor="downloadAssets" className="font-medium text-deep-blue cursor-pointer">
                  Download Assets (Images, PDFs, TXT & Other Files)
                </label>
              </div>
            </div>
          </div>

          {/* Basic Settings - 4 Column Layout */}
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">
                Wait Time (seconds)
              </label>
              <input
                type="number"
                min="0"
                max="30"
                step="0.5"
                value={settings.wait}
                onChange={e => updateSettings({...settings, wait: parseFloat(e.target.value)})}
                className="w-full border border-deep-blue-light rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-deep-blue focus:border-deep-blue"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">
                Delay Between Pages (seconds)
              </label>
              <input
                type="number"
                min="0"
                max="10"
                step="0.5"
                value={settings.delay}
                onChange={e => updateSettings({...settings, delay: parseFloat(e.target.value)})}
                className="w-full border border-deep-blue-light rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-deep-blue focus:border-deep-blue"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">
                Max Pages (0 = unlimited)
              </label>
              <input
                type="number"
                min="0"
                max="10000"
                value={settings.maxPages}
                onChange={e => updateSettings({...settings, maxPages: parseInt(e.target.value)})}
                className="w-full border border-deep-blue-light rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-deep-blue focus:border-deep-blue"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">
                Concurrency
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={settings.concurrency}
                onChange={e => updateSettings({...settings, concurrency: parseInt(e.target.value)})}
                className="w-full border border-deep-blue-light rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-deep-blue focus:border-deep-blue"
              />
            </div>
          </div>

          {/* Default Optimizations */}
          <div className="bg-deep-blue-light/10 rounded-lg p-4 border border-deep-blue-light">
            <h4 className="font-medium text-deep-blue mb-3">Default Optimizations</h4>
            <div className="grid grid-cols-2 gap-4">
              {/* Progressive Crawling */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="progressiveCrawling"
                  checked={settings.progressiveCrawling}
                  onChange={e => updateSettings({...settings, progressiveCrawling: e.target.checked})}
                  className="rounded"
                />
                <label htmlFor="progressiveCrawling" className="font-medium text-charcoal cursor-pointer">
                  Progressive Crawling
                </label>
              </div>

              {/* Stealth Mode */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="stealthMode"
                  checked={settings.stealthMode}
                  onChange={e => updateSettings({...settings, stealthMode: e.target.checked})}
                  className="rounded"
                />
                <label htmlFor="stealthMode" className="font-medium text-charcoal cursor-pointer">
                  Stealth Mode
                </label>
              </div>

              {/* Network Capture */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="networkCapture"
                  checked={settings.networkCapture}
                  onChange={e => updateSettings({...settings, networkCapture: e.target.checked})}
                  className="rounded"
                />
                <label htmlFor="networkCapture" className="font-medium text-charcoal cursor-pointer">
                  Network Capture
                </label>
              </div>

              {/* Console Logging */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="consoleLogging"
                  checked={settings.consoleLogging}
                  onChange={e => updateSettings({...settings, consoleLogging: e.target.checked})}
                  className="rounded"
                />
                <label htmlFor="consoleLogging" className="font-medium text-charcoal cursor-pointer">
                  Console Logging
                </label>
              </div>

              {/* Headless Mode */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="headlessMode"
                  checked={settings.headlessMode}
                  onChange={e => updateSettings({...settings, headlessMode: e.target.checked})}
                  className="rounded"
                />
                <label htmlFor="headlessMode" className="font-medium text-charcoal cursor-pointer">
                  Headless Mode
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Asset Management Section */}
        <div className="p-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-deep-blue mb-4">Asset Management</h3>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-charcoal mb-2">Clean Duplicate Assets</h4>
                <p className="text-sm text-charcoal/70 mb-3">
                  Remove duplicate images, PDFs, and TXT files from all crawled brands.
                  This will scan for identical content and keep only one copy of each file.
                </p>

                {cleanupResult && (
                  <div className={`p-3 rounded-lg mb-3 ${
                    cleanupResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                  }`}>
                    {cleanupResult.success ? (
                      <div>
                        <div className="flex items-center gap-2 text-green-700 font-medium mb-2">
                          <span>✅</span>
                          Cleanup Complete!
                        </div>
                        <div className="text-sm text-green-600">
                          <div>Files removed: <strong>{cleanupResult.totalRemoved}</strong></div>
                          <div>Space saved: <strong>{(cleanupResult.totalSaved / 1024 / 1024).toFixed(1)} MB</strong></div>
                          {cleanupResult.brandResults.length > 0 && (
                            <div className="mt-2">
                              <div className="font-medium">Brand Results:</div>
                              {cleanupResult.brandResults.map((brand, index) => (
                                <div key={index} className="ml-2 text-xs">
                                  {brand.brand}: {brand.removed} files removed
                                  {brand.error && ` (${brand.error})`}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-red-700">
                        <span>❌</span>
                        <span>Cleanup failed: {cleanupResult.error}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={handleCleanupDuplicates}
                disabled={isCleaningUp}
                className={`ml-4 px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
                  isCleaningUp
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-vibrant-orange text-white hover:bg-vibrant-orange-hover'
                }`}
              >
                {isCleaningUp ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Cleaning...
                  </>
                ) : (
                  <>
                    🧹 Clean Duplicates
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex items-center justify-between flex-shrink-0">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-charcoal/70 hover:text-charcoal font-medium"
          >
            Reset to Defaults
          </button>
          
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-charcoal rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-deep-blue text-white rounded-lg hover:bg-deep-blue-hover font-medium"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
