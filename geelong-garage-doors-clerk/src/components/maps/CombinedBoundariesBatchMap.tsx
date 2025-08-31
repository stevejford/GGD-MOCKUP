"use client"

import { useEffect, useRef, useState } from 'react'

declare global { interface Window { L?: any } }

type Area = { postcode: string; name: string; slug: string; lat?: number; lng?: number }

export default function CombinedBoundariesBatchMap({ areas, height = 520 }: { areas: Area[]; height?: number | string }) {
  const mapRef = useRef<HTMLDivElement | null>(null)
  const mapInst = useRef<any>(null)
  const layersRef = useRef<Record<string, any>>({})
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY='
      link.crossOrigin = ''
      document.head.appendChild(link)
    }
    if (!document.getElementById('leaflet-js')) {
      const script = document.createElement('script')
      script.id = 'leaflet-js'
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo='
      script.crossOrigin = ''
      script.onload = () => setReady(true)
      document.body.appendChild(script)
    } else {
      setReady(true)
    }
  }, [])

  useEffect(() => {
    let map: any
    let tile: any
    const layers: Record<string, any> = {}

    async function init() {
      if (!ready || !mapRef.current || !window.L) return
      const L = window.L
      map = L.map(mapRef.current)
      mapInst.current = map
      tile = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data © OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(map)

      // Prefer static bundled boundaries, then localStorage, then API batch
      let feats: any[] = []
      try {
        const staticRes = await fetch('/poa-boundaries.json')
        if (staticRes.ok) {
          const sj = await staticRes.json()
          feats = sj?.features || []
        }
      } catch {}
      const uniqueCodes = Array.from(new Set(areas.map(a => a.postcode))).join(',')
      try {
        const cached = localStorage.getItem('poaBoundariesV1')
        if (cached) {
          const parsed = JSON.parse(cached)
          if (!feats.length) feats = parsed?.features || []
        }
      } catch {}
      if (!feats.length) {
        const batch = await fetch(`/api/postcodes?codes=${uniqueCodes}`).then(r=>r.json()).catch(()=>null)
        feats = batch?.geojson?.features || []
        try { if (feats.length) localStorage.setItem('poaBoundariesV1', JSON.stringify({ features: feats, ts: Date.now() })) } catch {}
      }

      const results = areas.map(a => {
        try {
          const fs = feats.filter((f:any)=>f?.properties?.poa_code_2021 === a.postcode)
          if (!fs.length) return { area:a, layer:null }
          const gj = { type:'FeatureCollection', features: fs } as any
          const layer = L.geoJSON(gj, {
            style: { color:'#2C3993', weight:2, opacity:0.9, fillColor:'#2C3993', fillOpacity:0.10 },
            onEachFeature: (_:any, lyr:any) => {
              lyr.on('click', () => (window.location.href = `/service-areas/${a.slug}`))
              lyr.bindTooltip(`${a.name} ${a.postcode}`, { sticky:true })
            }
          }).addTo(map)
          layers[a.slug] = layer
          try {
            const c = layer.getBounds().getCenter()
            const divIcon = L.divIcon({
              className:'poa-label',
              html:`<div style="background: rgba(44,57,147,0.9); color:#fff; padding:2px 6px; border-radius:6px; font-weight:700; font-size:12px;">${a.postcode}</div>`,
              iconSize:[44,20], iconAnchor:[22,10]
            })
            L.marker(c, { icon: divIcon, interactive:false }).addTo(map)
          } catch {}
          return { area:a, layer }
        } catch { return { area:a, layer:null } }
      })

      const boundsList = results.map(r=>{ try { return r.layer?.getBounds() } catch { return null }}).filter(Boolean)
      if (boundsList.length) {
        let merged = boundsList[0]
        for (let i=1;i<boundsList.length;i++) merged = merged.extend(boundsList[i])
        map.fitBounds(merged, { padding:[20,20] })
      } else {
        map.setView([-38.15, 144.36], 9)
      }
      layersRef.current = layers
    }

    init()
    return ()=>{ try { if (tile) map.removeLayer(tile); if (map) map.remove() } catch {} }
  }, [ready, areas])

  // Listen for region focus events from the left accordion
  useEffect(() => {
    function onFocusPoa(e: any) {
      const codes: string[] = e?.detail?.codes || []
      if (!codes.length || !mapInst.current) return
      const L = (window as any).L
      if (!L) return
      const boundsList: any[] = []
      for (const code of codes) {
        const area = areas.find(a => a.postcode === code)
        if (!area) continue
        const lyr = layersRef.current[area.slug]
        if (lyr && lyr.getBounds) {
          try { boundsList.push(lyr.getBounds()) } catch {}
        }
      }
      if (boundsList.length) {
        let merged = boundsList[0]
        for (let i = 1; i < boundsList.length; i++) merged = merged.extend(boundsList[i])
        mapInst.current.fitBounds(merged, { padding: [20,20] })
      }
    }
    window.addEventListener('focus-poa', onFocusPoa as any)
    return () => window.removeEventListener('focus-poa', onFocusPoa as any)
  }, [areas])

  return <div ref={mapRef} style={{ height: typeof height === 'number' ? `${height}px` : height }} className="w-full rounded-lg border border-deep-blue-light overflow-hidden shadow-sm" aria-label="Service areas boundary map" />
}
