"use client"
import { useEffect, useMemo, useState } from 'react'

type Area = { name: string; slug: string; lat: number; lng: number }

function haversine(a: Area, lat: number, lng: number) {
  const R = 6371
  const dLat = ((lat - a.lat) * Math.PI) / 180
  const dLng = ((lng - a.lng) * Math.PI) / 180
  const la1 = (a.lat * Math.PI) / 180
  const la2 = (lat * Math.PI) / 180
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

export default function SuggestedArea({ areas }: { areas: Area[] }) {
  const [coord, setCoord] = useState<{ lat: number; lng: number } | null>(null)
  const [city, setCity] = useState<string | undefined>(undefined)

  useEffect(() => {
    fetch('/api/geo')
      .then((r) => r.json())
      .then((j) => {
        if (!j?.ok) return
        const loc = (j.data?.loc || '').split(',').map((x: string) => parseFloat(x))
        if (loc.length === 2 && !Number.isNaN(loc[0]) && !Number.isNaN(loc[1])) {
          setCoord({ lat: loc[0], lng: loc[1] })
        }
        setCity(j.data?.city)
      })
      .catch(() => {})
  }, [])

  const nearest = useMemo(() => {
    if (!coord || areas.length === 0) return null
    let best = areas[0]
    let bestD = haversine(best, coord.lat, coord.lng)
    for (let i = 1; i < areas.length; i++) {
      const d = haversine(areas[i], coord.lat, coord.lng)
      if (d < bestD) {
        best = areas[i]
        bestD = d
      }
    }
    return { ...best, km: Math.round(bestD) }
  }, [coord, areas])

  if (!nearest) return null

  return (
    <div className="mb-6 rounded-lg border border-deep-blue-light bg-white p-4 flex items-center justify-between">
      <div>
        <p className="text-sm text-charcoal/80">{city ? `Hello ${city}! ` : ''}Looking for your nearest service page?</p>
        <p className="font-semibold text-deep-blue">Nearest area: {nearest.name} {Number.isFinite(nearest.km) ? `(~${nearest.km} km)` : ''}</p>
      </div>
      <a href={`/service-areas/${nearest.slug}`} className="bg-vibrant-orange hover:bg-vibrant-orange-hover text-white px-4 py-2 rounded-lg font-medium">
        View {nearest.name}
      </a>
    </div>
  )
}

