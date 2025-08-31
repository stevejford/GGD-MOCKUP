"use client"

import { useEffect, useRef, useState } from 'react'

type AreaPin = { name: string; slug: string; lat: number; lng: number }

declare global {
  interface Window {
    L?: any
  }
}

export default function ServiceAreasMap({ areas, height = 480 }: { areas: AreaPin[]; height?: number }) {
  const mapRef = useRef<HTMLDivElement | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Inject Leaflet CSS
    const cssId = 'leaflet-css'
    if (!document.getElementById(cssId)) {
      const link = document.createElement('link')
      link.id = cssId
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY='
      link.crossOrigin = ''
      document.head.appendChild(link)
    }
    // Inject Leaflet JS
    const jsId = 'leaflet-js'
    if (!document.getElementById(jsId)) {
      const script = document.createElement('script')
      script.id = jsId
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
    if (!ready || !mapRef.current || !window.L) return
    const L = window.L
    // Center roughly on Geelong region
    const map = L.map(mapRef.current).setView([-38.15, 144.36], 10)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map)

    areas.forEach((a) => {
      const marker = L.marker([a.lat, a.lng]).addTo(map)
      marker.bindPopup(`<b>${a.name}</b><br/><a href="/service-areas/${a.slug}">View page</a>`)
      marker.on('click', () => {
        window.location.href = `/service-areas/${a.slug}`
      })
    })

    // Fit bounds to markers if we have multiple
    if (areas.length > 1) {
      const bounds = L.latLngBounds(areas.map((a) => [a.lat, a.lng]))
      map.fitBounds(bounds, { padding: [20, 20] })
    }

    return () => {
      map.remove()
    }
  }, [ready, areas])

  return (
    <div
      ref={mapRef}
      style={{ height }}
      className="w-full rounded-lg border border-deep-blue-light overflow-hidden shadow-sm"
      aria-label="Service areas map"
    />
  )
}

