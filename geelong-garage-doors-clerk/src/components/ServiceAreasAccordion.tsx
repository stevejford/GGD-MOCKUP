"use client"

import { useMemo, useState } from 'react'
import Link from 'next/link'

type Area = {
  locationName: string
  slug: string
  region: string
  postcode: string
}

const REGION_ORDER = [
  'Wyndham',
  'Melton',
  'Greater Geelong',
  'Bellarine',
  'Surf Coast',
  'Golden Plains',
  'Moorabool',
  'Ballarat',
  'Hepburn',
  'Pyrenees',
  'Colac Otway',
  'Corangamite',
  'Moyne',
  'Warrnambool',
  'Ararat',
]

export default function ServiceAreasAccordion({ areas, defaultOpen }: { areas: Area[]; defaultOpen?: string }) {
  const [openRegion, setOpenRegion] = useState<string | null>(defaultOpen || null)
  const [query, setQuery] = useState('')
  const [msg, setMsg] = useState<string | null>(null)

  const groups = useMemo(() => {
    const by: Record<string, Area[]> = {}
    for (const a of areas) {
      const r = a.region || 'Other'
      if (!by[r]) by[r] = []
      by[r].push(a)
    }
    const orderedRegions = Object.keys(by).sort((a, b) => {
      const ia = REGION_ORDER.indexOf(a)
      const ib = REGION_ORDER.indexOf(b)
      if (ia === -1 && ib === -1) return a.localeCompare(b)
      if (ia === -1) return 1
      if (ib === -1) return -1
      return ia - ib
    })
    return orderedRegions.map((r) => ({ region: r, items: by[r].sort((x, y) => x.locationName.localeCompare(y.locationName)) }))
  }, [areas])

  async function onSearch(e?: React.FormEvent) {
    e?.preventDefault()
    setMsg(null)
    const q = query.trim().toLowerCase()
    if (!q) return

    // Postcode → navigate
    const pcHit = areas.find((a) => a.postcode === q)
    if (pcHit) {
      window.location.href = `/service-areas/${pcHit.slug}`
      return
    }

    // Major area (region) → open that accordion
    const regionHit = groups.find((g) => g.region.toLowerCase().includes(q))
    if (regionHit) {
      setOpenRegion(regionHit.region)
      return
    }

    // Smaller town → navigate to first fuzzy match
    const areaHit = areas.find((a) => a.locationName.toLowerCase().includes(q))
    if (areaHit) {
      window.location.href = `/service-areas/${areaHit.slug}`
      return
    }

    setMsg('No match found. Try a suburb name, region or postcode.')
  }

  return (
    <div>
      <form onSubmit={onSearch} className="mb-3 flex gap-2 items-end">
        <div className="flex-1">
          <label htmlFor="accordion-search" className="block text-sm font-medium text-charcoal">Search by postcode or suburb</label>
          <input
            id="accordion-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. 3030 or Torquay"
            className="border rounded px-3 py-2 w-full"
          />
        </div>
        <button type="submit" className="bg-deep-blue hover:bg-deep-blue-hover text-white px-4 py-2 rounded">Search</button>
      </form>
      {msg && <p className="text-sm text-heritage-red mb-3">{msg}</p>}

      <div className={'grid grid-cols-1 md:grid-cols-2 gap-2'}>
        {groups.map(({ region, items }) => {
          const open = openRegion === region
          return (
            <div
              key={region}
              className={`border rounded overflow-hidden bg-white ${open ? 'md:col-span-2' : ''}`}
            >
              <button
                type="button"
                className={`w-full flex items-center justify-between px-2 py-2 text-left transition-colors ${open ? 'bg-deep-blue-light border-l-4 border-deep-blue' : 'bg-white hover:bg-gray-100 border-l-4 border-transparent'}`}
                onClick={() => {
                  const willOpen = openRegion !== region
                  setOpenRegion((prev) => (prev === region ? null : region))
                  // Dispatch focus event so the map can zoom to this region when opening
                  if (willOpen) {
                    try {
                      const codes = items.map((i) => i.postcode)
                      window.dispatchEvent(new CustomEvent('focus-poa', { detail: { codes } }))
                    } catch {}
                  }
                }}
                aria-expanded={open}
              >
                <span className="font-semibold text-deep-blue">{region}</span>
                <span className="text-deep-blue" aria-hidden>
                  {/* brand-colored chevron */}
                  <svg
                    className={`transition-transform ${open ? 'rotate-90' : ''}`}
                    width="14" height="14" viewBox="0 0 24 24" fill="currentColor"
                  >
                    <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z" />
                  </svg>
                </span>
              </button>
              {open && (
                <div className="px-2 pb-2 pt-2 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-1">
                    {items.map((a) => (
                      <Link key={a.slug} href={`/service-areas/${a.slug}`} className="text-xs leading-tight text-deep-blue hover:underline bg-gray-100 px-2 py-1 rounded-full">
                        {a.locationName}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
