"use client"

import { useMemo, useRef, useState } from 'react'
import Link from 'next/link'

type Area = {
  locationName: string
  slug: string
  region: string
  postcode: string
}

const DEFAULT_REGION_ORDER = [
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

export default function ServiceAreasDirectory({
  areas,
  regionOrder = DEFAULT_REGION_ORDER,
  columns = 1,
  maxItemsPerRegion = 10,
  defaultOpenRegions = ['Wyndham', 'Greater Geelong'],
}: {
  areas: Area[]
  regionOrder?: string[]
  columns?: number
  maxItemsPerRegion?: number
  defaultOpenRegions?: string[]
}) {
  const [q, setQ] = useState('')
  const [regionFilter, setRegionFilter] = useState<string>('All regions')
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [openRegions, setOpenRegions] = useState<Record<string, boolean>>(() => (
    (defaultOpenRegions || []).reduce((acc, r) => { acc[r] = true; return acc }, {} as Record<string, boolean>)
  ))

  const regions = useMemo(() => {
    const set = new Set<string>()
    areas.forEach((a) => a.region && set.add(a.region))
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [areas])

  const groups = useMemo(() => {
    // Filter by region and search
    const norm = (s: string) => s.toLowerCase()
    const query = norm(q)
    const byRegion: Record<string, Area[]> = {}
    for (const a of areas) {
      if (regionFilter !== 'All regions' && a.region !== regionFilter) continue
      if (
        query &&
        !norm(a.locationName).includes(query) &&
        !norm(a.region || '').includes(query) &&
        !norm(a.postcode).includes(query)
      )
        continue
      const r = a.region || 'Other'
      if (!byRegion[r]) byRegion[r] = []
      byRegion[r].push(a)
    }
    const orderedRegions = Object.keys(byRegion).sort((a, b) => {
      const ia = regionOrder.indexOf(a)
      const ib = regionOrder.indexOf(b)
      if (ia === -1 && ib === -1) return a.localeCompare(b)
      if (ia === -1) return 1
      if (ib === -1) return -1
      return ia - ib
    })
    return orderedRegions.map((r) => ({
      region: r,
      items: byRegion[r].sort((x, y) => x.locationName.localeCompare(y.locationName)),
    }))
  }, [areas, q, regionFilter, regionOrder])

  return (
    <div ref={containerRef} className="space-y-6">
      <div className="flex flex-col md:flex-row gap-3 md:items-end">
        <div className="flex-1 min-w-[220px]">
          <label className="block text-sm font-medium text-charcoal" htmlFor="area-search">Search locations</label>
          <input
            id="area-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Type suburb, region or postcode"
            className="border rounded px-3 py-2 w-full"
          />
        </div>
        <div className="min-w-[220px]">
          <label className="block text-sm font-medium text-charcoal" htmlFor="region-select">Jump to region</label>
          <select
            id="region-select"
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="border rounded px-3 py-2 w-full"
          >
            <option>All regions</option>
            {regionOrder
              .filter((r) => regions.includes(r))
              .concat(regions.filter((r) => !regionOrder.includes(r)))
              .map((r) => (
                <option key={r}>{r}</option>
              ))}
          </select>
        </div>
      </div>

      <div className="mt-3 p-3 bg-gray-100 rounded text-sm text-charcoal">
        Don’t see your area listed? We likely still cover nearby suburbs.
        <Link href="/contact" className="ml-2 text-deep-blue underline">Contact us</Link>
        <span className="mx-2">or</span>
        <a href="tel:(03) 5221 9222" className="text-deep-blue underline">call (03) 5221 9222</a>.
      </div>

      <div className={columns > 1 ? `grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8` : 'space-y-8'}>
        {groups.map(({ region, items }) => (
          <section key={region} id={`region-${region.replace(/\s+/g, '-')}`}>
            <h3 className="text-xl font-semibold text-deep-blue mb-3">{region}</h3>
            <div className="flex flex-wrap gap-2">
              {(openRegions[region] ? items : items.slice(0, maxItemsPerRegion)).map((area) => (
                <Link
                  key={area.slug}
                  href={`/service-areas/${area.slug}`}
                  className="text-deep-blue hover:underline bg-gray-100 px-3 py-1 rounded-full"
                  aria-label={`${area.locationName} (${area.postcode})`}
                >
                  {area.locationName}
                </Link>
              ))}
            </div>
            {items.length > maxItemsPerRegion && (
              <button
                className="mt-3 text-sm text-deep-blue underline"
                onClick={() => setOpenRegions((s) => ({ ...s, [region]: !s[region] }))}
              >
                {openRegions[region] ? 'Show less' : `Show ${items.length - maxItemsPerRegion} more`}
              </button>
            )}
          </section>
        ))}
        {groups.length === 0 && (
          <p className="text-charcoal">No locations match your search.</p>
        )}
      </div>
    </div>
  )
}
