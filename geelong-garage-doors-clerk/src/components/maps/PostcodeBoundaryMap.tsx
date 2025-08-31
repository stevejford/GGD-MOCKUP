"use client"

import { useEffect, useRef, useState } from 'react'

declare global {
  interface Window { L?: any }
}

export default function PostcodeBoundaryMap({ postcode, height = 420 }: { postcode: string; height?: number }) {
  const mapRef = useRef<HTMLDivElement | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY='
      link.crossOrigin = ''
      document.head.appendChild(link)
    }
    // Leaflet JS
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
    let layer: any
    let tile: any
    async function init() {
      if (!ready || !mapRef.current || !window.L) return
      const L = window.L
      map = L.map(mapRef.current)
      tile = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data © OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(map)

      // Fetch polygon
      const res = await fetch(`/api/postcode/${postcode}`)
      const json = await res.json()
      if (!json?.ok || !json.geojson) {
        map.setView([-37.9, 144.6], 10)
        return
      }
      layer = L.geoJSON(json.geojson, {
        style: {
          color: '#2C3993', // deep blue
          weight: 3,
          opacity: 0.9,
          fillColor: '#2C3993',
          fillOpacity: 0.12,
        },
      }).addTo(map)
      try {
        const bounds = layer.getBounds()
        map.fitBounds(bounds, { padding: [16, 16] })
      } catch {
        map.setView([-37.9, 144.6], 10)
      }

      // Add label-like marker in center of bounds
      try {
        const c = layer.getBounds().getCenter()
        const divIcon = L.divIcon({
          className: 'poa-label',
          html: `<div style="background: rgba(44,57,147,0.9); color: #fff; padding: 2px 6px; border-radius: 6px; font-weight: 700;">${postcode}</div>`,
          iconSize: [40, 20],
          iconAnchor: [20, 10],
        })
        L.marker(c, { icon: divIcon, interactive: false }).addTo(map)
      } catch {}
    }
    init()
    return () => {
      try {
        if (map) {
          if (layer) map.removeLayer(layer)
          if (tile) map.removeLayer(tile)
          map.remove()
        }
      } catch {}
    }
  }, [ready, postcode])

  return <div ref={mapRef} style={{ height }} className="w-full rounded-lg border border-deep-blue-light overflow-hidden" />
}

