"use client"
import { useEffect, useRef, useState, useCallback } from 'react'
import { useWebSocket } from '@/hooks/useWebSocket'

export default function AdminAggregatePanel() {
  const [brands, setBrands] = useState<string[]>([])
  const [brand, setBrand] = useState<string>('')
  const [prune, setPrune] = useState<number | ''>('')
  const [minWords, setMinWords] = useState<number | ''>('')
  const [bm25, setBm25] = useState('')
  const [bm25Threshold, setBm25Threshold] = useState<number | ''>('')
  const [running, setRunning] = useState(false)
  const [pid, setPid] = useState<number | undefined>()
  const [logLines, setLogLines] = useState<string[]>([])
  const [error, setError] = useState('')
  const [logPath, setLogPath] = useState('')
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const loadBrands = async () => {
      try {
        const res = await fetch('/api/crawl/brands', { cache: 'no-store' })
        const data = await res.json()
        setBrands(data.brands || [])
      } catch {}
    }
    loadBrands()
  }, [])

  const [isConnected, setIsConnected] = useState(false)

  // WebSocket connection for real-time aggregate status
  const { connect, disconnect } = useWebSocket({
    url: 'ws://localhost:8080/api/ws',
    onMessage: useCallback((data: any) => {
      if (data.type === 'aggregate_status_update' && data.data) {
        const status = data.data
        setRunning(!!status.running)
        setPid(status.pid)
        setLogLines(status.lastLogLines || [])
        setError(status.error || '')
        setLogPath(status.logPath || '')
        console.log('📊 Received real-time aggregate status:', status)
      }
    }, []),
    onConnect: useCallback(() => {
      setIsConnected(true)
      console.log('🔗 AdminAggregatePanel WebSocket connected')
    }, []),
    onDisconnect: useCallback(() => {
      setIsConnected(false)
      console.log('🔌 AdminAggregatePanel WebSocket disconnected')
    }, []),
    onError: useCallback((error: Event) => {
      if (process.env.NODE_ENV === 'development') {
        console.debug('AdminAggregatePanel WebSocket connection issue (normal in dev)')
      } else {
        console.error('❌ AdminAggregatePanel WebSocket error:', error)
      }
    }, [])
  })

  useEffect(() => {
    const loadInitialStatus = async () => {
      try {
        const res = await fetch('/api/aggregate/status', { cache: 'no-store' })
        const data = await res.json()
        setRunning(!!data.running)
        setPid(data.pid)
        setLogLines(data.lastLogLines || [])
        setError(data.error || '')
        setLogPath(data.logPath || '')
        console.log('📊 Initial aggregate status loaded:', data)
      } catch (error) {
        console.error('❌ Failed to load initial aggregate status:', error)
      }
    }

    // Connect WebSocket and load initial status
    connect()
    loadInitialStatus()

    return () => disconnect()
  }, []) // Empty dependency array - connect/disconnect are stable

  const start = async () => {
    setError('')
    const body: any = {}
    if (brand) body.brand = brand
    if (prune !== '') body.prune = prune
    if (minWords !== '') body.minWords = minWords
    if (bm25) body.bm25 = bm25
    if (bm25Threshold !== '') body.bm25Threshold = bm25Threshold
    try {
      const res = await fetch('/api/aggregate/start', {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body)
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error || 'Failed to start aggregate')
      setRunning(true)
      setPid(data.pid)
      setLogPath(data.logPath || '')
    } catch (e: any) {
      setError(e?.message || 'Failed to start aggregate')
    }
  }

  const stop = async () => {
    await fetch('/api/aggregate/stop', { method: 'POST' })
    // Status will be updated via WebSocket
  }

  return (
    <div className="mb-10">
      <h2 className="text-lg font-semibold mb-2">Aggregate Markdown</h2>
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <select className="border rounded px-2 py-1 text-sm" value={brand} onChange={e=>setBrand(e.target.value)}>
          <option value="">All brands</option>
          {brands.map(b => (<option key={b} value={b}>{b}</option>))}
        </select>
        <input className="border rounded px-2 py-1 text-sm w-40" placeholder="prune (e.g. 0.5)" value={prune} onChange={e=>setPrune(e.target.value === '' ? '' : Number(e.target.value))} />
        <input className="border rounded px-2 py-1 text-sm w-40" placeholder="minWords (e.g. 50)" value={minWords} onChange={e=>setMinWords(e.target.value === '' ? '' : Number(e.target.value))} />
        <input className="border rounded px-2 py-1 text-sm w-56" placeholder="bm25 query (optional)" value={bm25} onChange={e=>setBm25(e.target.value)} />
        <input className="border rounded px-2 py-1 text-sm w-44" placeholder="bm25Threshold (e.g. 1.2)" value={bm25Threshold} onChange={e=>setBm25Threshold(e.target.value === '' ? '' : Number(e.target.value))} />
        <button onClick={start} disabled={running} className={`px-4 py-2 rounded text-white ${running ? 'bg-gray-400' : 'bg-deep-blue hover:bg-deep-blue-hover'}`}>Run aggregator</button>
        <button onClick={stop} disabled={!running} className={`px-4 py-2 rounded border ${running ? 'border-vibrant-orange text-vibrant-orange' : 'border-gray-300 text-gray-400'}`}>Stop</button>
        <span className="text-sm text-charcoal/70">Status: {running ? 'Running' : 'Idle'} {pid ? `(pid ${pid})` : ''}</span>
      </div>
      {logPath ? <p className="text-xs text-charcoal/60 mb-2">Log file: {logPath}</p> : null}
      {error ? <p className="text-sm text-red-600 mb-2">Error: {error}</p> : null}
      <div className="border border-gray-200 rounded p-3 bg-white max-h-[220px] overflow-auto text-xs whitespace-pre-wrap">
        {logLines.length ? logLines.join('\n') : 'No logs yet'}
      </div>
    </div>
  )
}

