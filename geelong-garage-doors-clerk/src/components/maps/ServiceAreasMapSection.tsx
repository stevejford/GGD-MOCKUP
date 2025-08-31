"use client"

import { useState } from 'react'
import CombinedBoundariesBatchMap from '@/components/maps/CombinedBoundariesBatchMap'

type Area = { name: string; slug: string; postcode: string; lat?: number; lng?: number }

export default function ServiceAreasMapSection({ areas }: { areas: Area[] }) {
  const [postcode, setPostcode] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSearch(e?: React.FormEvent) {
    e?.preventDefault()
    const code = (postcode || '').trim()
    if (!/^\d{4}$/.test(code)) { setMsg('Enter a valid 4‑digit postcode.'); return }
    setBusy(true); setMsg(null)
    const match = areas.find(a => a.postcode === code)
    if (match) {
      window.location.href = `/service-areas/${match.slug}`
    } else {
      setMsg(`We don’t have a page for ${code} yet. Try a nearby area or contact us.`)
    }
    setBusy(false)
  }

  async function useMyLocation() {
    setBusy(true); setMsg(null)
    const pickNearest = (lat:number,lng:number) => {
      const withCoords = areas.filter(a=>typeof a.lat==='number' && typeof a.lng==='number')
      if (!withCoords.length) return false
      let best = withCoords[0]!, bestD = dist(best.lat!, best.lng!, lat, lng)
      for (let i=1;i<withCoords.length;i++) { const d = dist(withCoords[i]!.lat!, withCoords[i]!.lng!, lat, lng); if (d<bestD){best=withCoords[i]!; bestD=d} }
      window.location.href = `/service-areas/${best.slug}`
      return true
    }
    const byIP = async () => { try { const geo = await fetch('/api/geo').then(r=>r.json()); const loc = geo?.data?.loc?.split(',').map((x:string)=>parseFloat(x)); if (Array.isArray(loc)&&loc.length===2) return pickNearest(loc[0],loc[1]); } catch {} return false }
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(async p=>{ pickNearest(p.coords.latitude,p.coords.longitude); setBusy(false) }, async ()=>{ const ok=await byIP(); if(!ok) setMsg('Location unavailable. Try entering a postcode.'); setBusy(false) }, { enableHighAccuracy:true, timeout:8000 })
    } else { const ok=await byIP(); if(!ok) setMsg('Location unavailable. Try entering a postcode.'); setBusy(false) }
  }

  return (
    <div style={{ height: '100%' }}>
      {/* controls removed on the map side; search is available on the left panel */}
      {/* Use batched map for faster initial load; height fits parent column */}
      <CombinedBoundariesBatchMap areas={areas} height={'75%'} />
    </div>
  )
}

function dist(lat1:number,lon1:number,lat2:number,lon2:number){ const R=6371; const dLat=((lat2-lat1)*Math.PI)/180; const dLon=((lon2-lon1)*Math.PI)/180; const a=Math.sin(dLat/2)**2+Math.cos((lat1*Math.PI)/180)*Math.cos((lat2*Math.PI)/180)*Math.sin(dLon/2)**2; return 2*R*Math.asin(Math.sqrt(a)) }
