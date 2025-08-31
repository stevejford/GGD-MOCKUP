import Link from 'next/link'
import Image from 'next/image'
import { Container, Breadcrumb } from '@/components/layout'
import { Button } from '@/components/ui'
import { ServiceSchema, BreadcrumbSchema } from '@/components/seo/JsonLd'

export const metadata = {
  title: 'Solutions for Custom Home Builders',
  description: 'Bespoke doors and collaborative partnerships for distinctive homes.',
  openGraph: { title: 'Solutions for Custom Home Builders', description: 'Bespoke doors and collaborative partnerships for distinctive homes.', images: ['/api/og?title=Custom%20Home%20Builders'], url: '/solutions/for-custom-home-builders' },
  twitter: { card: 'summary_large_image', title: 'Solutions for Custom Home Builders', description: 'Bespoke doors and collaborative partnerships for distinctive homes.', images: ['/api/og?title=Custom%20Home%20Builders'] },
}

export default function ForCustomBuilders() {
  const crumbs = [
    { label: 'Home', href: '/' },
    { label: 'Solutions', href: '/solutions/for-volume-builders' },
    { label: 'Custom Home Builders', active: true },
  ]

  return (
    <main>
      <Breadcrumb items={crumbs} />

      {/* Hero */}
      <section className="relative h-[600px] overflow-hidden">
        <Image className="w-full h-full object-cover" src="https://storage.googleapis.com/uxpilot-auth.appspot.com/334eb1f302-dbcb90c0cb2168d2ad77.png" alt="Luxury custom home construction" fill priority />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/60" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center max-w-4xl px-8">
            <h1 className="text-white text-5xl md:text-6xl font-bold mb-6 leading-tight">Distinctive Doors for Custom Home Excellence</h1>
            <p className="text-white/90 text-xl mb-8 max-w-2xl mx-auto">Partner with us to create architectural statements that reflect your vision and exceed your clients&apos; expectations.</p>
            <Link href="/contact"><Button variant="primary" className="px-8 py-4 text-lg">Design Your Custom Door</Button></Link>
          </div>
        </div>
      </section>

      {/* Inspiration Gallery (static grid) */}
      <section className="py-20 bg-white">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-deep-blue mb-4">Project Inspiration Gallery</h2>
            <p className="text-xl text-charcoal/80 max-w-3xl mx-auto">Explore distinctive custom installations crafted to complement unique architectural visions.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: 'Contemporary Minimalist', img: '182747acd2-917cfec084357bc78935.png' },
              { title: 'Natural Timber Elegance', img: '6d01b9ed8d-1e7a89cf22318780979d.png' },
              { title: 'Coastal Retreat', img: '62a1442841-c65c9f49c95cf4ea15c5.png' },
              { title: 'Glass & Steel Fusion', img: 'bf9b7b7b72-57586dc9e3b4152cf131.png' },
              { title: 'Heritage Restoration', img: '48e692be8f-f69000bd0aa8d1e2ffec.png' },
              { title: 'Cedar Horizontal', img: '3a580eb632-4e97b4670b49a8b9b478.png' },
            ].map((g) => (
              <div key={g.title} className="group cursor-pointer overflow-hidden rounded-lg shadow-sm">
                <Image className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300" src={`https://storage.googleapis.com/uxpilot-auth.appspot.com/${g.img}`} alt={g.title} width={800} height={512} />
                <div className="bg-white p-6">
                  <h3 className="text-xl font-bold text-charcoal mb-2">{g.title}</h3>
                  <p className="text-charcoal/70 text-sm">Premium craftsmanship matched to architectural intent</p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Configurator stub */}
      <section className="py-20 bg-[#F9F9F9]">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-deep-blue mb-4">Design Your Custom Door</h2>
            <p className="text-xl text-charcoal/80 max-w-2xl mx-auto">Visualize your custom design and receive an instant estimate.</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-8 grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-gray-100 rounded-lg p-8 h-96 flex items-center justify-center">
                <Image className="w-full h-80 object-cover rounded-lg" src="https://storage.googleapis.com/uxpilot-auth.appspot.com/464e7ca54e-14d9abfb70417b67fb34.png" alt="Customizable garage door preview" width={1000} height={640} />
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-charcoal font-semibold mb-3">Material</label>
                <select className="w-full p-3 border border-gray-300 rounded-lg focus:border-vibrant-orange focus:outline-none">
                  <option>Select Material</option>
                  <option>Premium Steel</option>
                  <option>Aluminum</option>
                  <option>Timber - Cedar</option>
                  <option>Composite</option>
                </select>
              </div>
              <div>
                <label className="block text-charcoal font-semibold mb-3">Color Finish</label>
                <div className="grid grid-cols-4 gap-3">
                  <div className="w-12 h-12 bg-white border-2 border-gray-300 rounded" />
                  <div className="w-12 h-12 bg-gray-800 border-2 border-gray-300 rounded" />
                  <div className="w-12 h-12 bg-amber-900 border-2 border-gray-300 rounded" />
                  <div className="w-12 h-12 bg-green-800 border-2 border-gray-300 rounded" />
                </div>
              </div>
              <div className="bg-deep-blue-light rounded-lg p-6">
                <h3 className="text-deep-blue font-bold text-lg mb-2">Estimated Price</h3>
                <div className="text-3xl font-bold text-deep-blue mb-2">$4,850 - $6,200</div>
                <p className="text-sm text-charcoal/70">*Includes supply and professional installation</p>
              </div>
              <Button variant="primary" className="w-full">Request This Quote</Button>
            </div>
          </div>
        </Container>
      </section>

      <ServiceSchema serviceName="Custom Builder Garage Door Solutions" description="Specification-driven garage door supply and automation for custom home projects." />
      <BreadcrumbSchema items={crumbs.map(c => ({ name: c.label, url: c.href }))} />
    </main>
  )
}

