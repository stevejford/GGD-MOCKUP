"use client"
import { useEffect, useState } from 'react'

export default function AdminEmbedPanel() {
  const [brands, setBrands] = useState<string[]>([])
  const [brand, setBrand] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/crawl/brands', { cache: 'no-store' })
        const data = await res.json()
        setBrands(data.brands || [])
      } catch {}
    }
    load()
  }, [])

  const run = async () => {
    setBusy(true); setMsg(''); setErr('')
    try {
      if (!brand) throw new Error('Pick a brand first')
      const res = await fetch('/api/embed', {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ brand })
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Embed failed')
      setMsg(`Embedded ${data.chunks ?? 0} chunks for ${brand}`)
    } catch (e: any) {
      setErr(e?.message || 'Embed failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold mb-2">Embed Markdown to Neon</h2>
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <select className="border rounded px-2 py-1 text-sm" value={brand} onChange={e=>setBrand(e.target.value)}>
          <option value="">Select brand…</option>
          {brands.map(b => (<option key={b} value={b}>{b}</option>))}
        </select>
        <button onClick={run} disabled={busy || !brand} className={`px-4 py-2 rounded text-white ${busy || !brand ? 'bg-gray-400' : 'bg-deep-blue hover:bg-deep-blue-hover'}`}>{busy ? 'Embedding…' : 'Embed brand'}</button>
      </div>
      {msg ? <p className="text-sm text-green-700">{msg}</p> : null}
      {err ? <p className="text-sm text-red-600">{err}</p> : null}
    </div>
  )
}

