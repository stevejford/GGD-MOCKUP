import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { serviceAreasData } from '@/lib/service-areas-data'
import { Breadcrumb, Container } from '@/components/layout'
import ServiceAreasMapSection from '@/components/maps/ServiceAreasMapSection'
import ServiceAreasAccordion from '@/components/ServiceAreasAccordion'

export const metadata: Metadata = {
  title: 'Service Areas',
  description: 'Find local service areas we serve across Victoria.',
  openGraph: { title: 'Service Areas', description: 'Find local service areas we serve across Victoria.', images: ['/og?title=Service%20Areas'], url: '/service-areas' },
  twitter: { card: 'summary_large_image', title: 'Service Areas', description: 'Find local service areas we serve across Victoria.', images: ['/og?title=Service%20Areas'] },
}

export default function ServiceAreasPage() {
  const crumbs = [
    { label: 'Home', href: '/' },
    { label: 'Service Areas', active: true },
  ]

  const areasForMap = serviceAreasData
    .filter((a) => a.postcode)
    .map((a) => ({
      name: a.locationName,
      slug: a.slug,
      postcode: a.postcode,
      lat: a.latLng?.lat,
      lng: a.latLng?.lng,
    }))

  return (
    <main>
      <Breadcrumb items={crumbs} />
      <Container className="py-12 max-w-6xl">
        <h1 className="text-4xl font-bold mb-6">Our Service Areas</h1>
        <div className="grid lg:grid-cols-2 gap-8 items-start mb-10">
          <div className="sticky top-24 max-h-vp overflow-auto pr-2">
            <ServiceAreasAccordion
              areas={serviceAreasData.map(a => ({ locationName: a.locationName, slug: a.slug, region: a.region, postcode: a.postcode }))}
              defaultOpen="Greater Geelong"
            />
          </div>
          <div className="sticky top-24 h-vp overflow-hidden flex flex-col">
            {/* Popular near Geelong (right column) */}
            {(() => {
              const preferred = new Set(['Belmont','Highton','Grovedale','Waurn Ponds','Lara','Corio','Norlane','North Geelong','East Geelong','Newcomb','Torquay','Ocean Grove'])
              const near = serviceAreasData
                .filter(a => ['Greater Geelong','Bellarine','Surf Coast'].includes(a.region))
                .filter(a => preferred.has(a.locationName))
                .sort((a,b)=>a.locationName.localeCompare(b.locationName))
              if (!near.length) return null
              return (
                <div className="mb-3 rounded border border-deep-blue-light bg-white/80 p-3">
                  <div className="text-sm font-semibold text-deep-blue mb-2">Popular near Geelong</div>
                  <div className="flex flex-wrap gap-2">
                    {near.map(a => (
                      <Link key={a.slug} href={`/service-areas/${a.slug}`} className="text-sm text-deep-blue hover:underline bg-gray-100 px-2 py-1 rounded-full">
                        {a.locationName}
                      </Link>
                    ))}
                  </div>
                </div>
              )
            })()}
            <div className="flex-1 min-h-0">
              <ServiceAreasMapSection areas={areasForMap} />
            </div>
            <p className="text-xs text-charcoal/70 mt-2">Map data © OpenStreetMap contributors • Boundaries © ABS ASGS 2021</p>
          </div>
        </div>
        {/* Removed the long directory grid to keep the page compact */}
      </Container>
    </main>
  )
}
