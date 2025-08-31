'use client'

import { useState, useEffect } from 'react'

export default function LogfireDashboard() {
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    setIsConnected(true)
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">🔥 Logfire Dashboard</h2>
          <p className="text-gray-600">Real-time crawler monitoring and analytics</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-600">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <a
            href="https://logfire.pydantic.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            🔗 Open Logfire
          </a>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow border p-4">
          <div className="text-sm font-medium text-gray-600 mb-2">Pages Completed</div>
          <div className="text-2xl font-bold text-gray-900">6</div>
        </div>

        <div className="bg-white rounded-lg shadow border p-4">
          <div className="text-sm font-medium text-gray-600 mb-2">Assets Processed</div>
          <div className="text-2xl font-bold text-gray-900">150</div>
        </div>

        <div className="bg-white rounded-lg shadow border p-4">
          <div className="text-sm font-medium text-gray-600 mb-2">Pages/Minute</div>
          <div className="text-2xl font-bold text-gray-900">2.3</div>
        </div>

        <div className="bg-white rounded-lg shadow border p-4">
          <div className="text-sm font-medium text-gray-600 mb-2">Performance</div>
          <div className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
            GOOD
          </div>
        </div>
      </div>

      {/* Live Events */}
      <div className="bg-white rounded-lg shadow border">
        <div className="p-4 border-b">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            📊 Live Events
          </h3>
        </div>
        <div className="p-4">
          <div className="space-y-3 max-h-96 overflow-y-auto">
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-green-500">✅</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">Page Complete</span>
                  <span className="text-xs text-gray-500">
                    {new Date().toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-sm text-gray-600 truncate">
                  https://www.bnd.com.au/garage-doors/
                </div>
                <div className="text-xs text-gray-500">
                  Duration: 13.29s
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-purple-500">🖼️</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">Asset Process</span>
                  <span className="text-xs text-gray-500">
                    {new Date(Date.now() - 30000).toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-sm text-gray-600 truncate">
                  https://www.bnd.com.au/logo.png
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-blue-500">🕷️</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">Page Fetch</span>
                  <span className="text-xs text-gray-500">
                    {new Date(Date.now() - 60000).toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-sm text-gray-600 truncate">
                  https://www.bnd.com.au/openers/
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Setup Instructions */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg">
        <div className="p-4 border-b border-orange-200">
          <h3 className="text-lg font-medium text-orange-800">🚀 Setup Instructions</h3>
        </div>
        <div className="p-4 text-sm text-orange-700">
          <ol className="list-decimal list-inside space-y-2">
            <li>Sign up for a free Logfire account at <a href="https://logfire.pydantic.dev" className="underline" target="_blank">logfire.pydantic.dev</a></li>
            <li>Create a new project called "geelong-garage-doors-crawler"</li>
            <li>Copy your project token and add it to <code className="bg-orange-100 px-1 rounded">.env.local</code> as <code className="bg-orange-100 px-1 rounded">LOGFIRE_TOKEN=your-token-here</code></li>
            <li>Restart the development server to see live data</li>
            <li>Visit your Logfire dashboard to see real-time crawler analytics</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
