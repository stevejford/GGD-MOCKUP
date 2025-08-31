import Link from 'next/link'
import Image from 'next/image'
import { Container, Breadcrumb } from '@/components/layout'
import { Button } from '@/components/ui'
import { ServiceSchema, BreadcrumbSchema } from '@/components/seo/JsonLd'

export const metadata = {
  title: 'Solutions for Volume Builders',
  description: 'Standardized specs, reliable delivery, and volume pricing for large-scale developments.',
  openGraph: { title: 'Solutions for Volume Builders', description: 'Standardized specs, reliable delivery, and volume pricing for large-scale developments.', images: ['/api/og?title=Volume%20Builders'], url: '/solutions/for-volume-builders' },
  twitter: { card: 'summary_large_image', title: 'Solutions for Volume Builders', description: 'Standardized specs, reliable delivery, and volume pricing for large-scale developments.', images: ['/api/og?title=Volume%20Builders'] },
}

export default function ForVolumeBuilders() {
  const crumbs = [
    { label: 'Home', href: '/' },
    { label: 'Solutions', href: '/solutions/for-volume-builders' },
    { label: 'Volume Builders', active: true },
  ]

  return (
    <main>
      <Breadcrumb items={crumbs} />

      <section className="relative h-[500px] overflow-hidden">
        <Image className="w-full h-full object-cover" src="https://storage.googleapis.com/uxpilot-auth.appspot.com/c261880436-c0fc199338325350abb3.png" alt="Volume builder site" fill priority />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/70" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center max-w-4xl px-8">
            <h1 className="text-white text-5xl md:text-6xl font-bold mb-6 leading-tight">Streamlined Solutions for Volume Builders</h1>
            <p className="text-white/90 text-xl mb-8 max-w-3xl mx-auto">Reliable delivery schedules, standardized specs, and bulk pricing to keep developments on track.</p>
            <Link href="/contact"><Button variant="primary" className="px-12 py-4 text-xl">Request a Bulk Quote</Button></Link>
          </div>
        </div>
      </section>

      <Container className="py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-deep-blue mb-4">Why Volume Builders Choose Us</h2>
          <p className="text-xl text-charcoal/80 max-w-3xl mx-auto">Purpose-built solutions for large-scale development projects.</p>
        </div>

        <div className="grid md:grid-cols-4 gap-8">
          {[
            { title: 'On-Time Delivery', icon: 'fa-clock', desc: 'Guaranteed schedules aligned with your construction timeline.' },
            { title: 'Durable Products', icon: 'fa-shield-halved', desc: 'Premium materials reduce callbacks and warranty claims.' },
            { title: 'Volume Pricing', icon: 'fa-dollar-sign', desc: 'Competitive bulk pricing to improve project margins.' },
            { title: 'Dedicated Support', icon: 'fa-handshake', desc: 'Assigned account managers who know your business.' },
          ].map((item) => (
            <div key={item.title} className="text-center">
              <div className="w-16 h-16 bg-deep-blue-light rounded-lg flex items-center justify-center mx-auto mb-6 text-deep-blue">
                {item.icon === 'fa-clock' && (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7"><path d="M12 1.75A10.25 10.25 0 1 0 22.25 12 10.262 10.262 0 0 0 12 1.75zm0 18.5a8.25 8.25 0 1 1 8.25-8.25A8.26 8.26 0 0 1 12 20.25Zm.75-12.5h-1.5v5l4.25 2.55.75-1.23-3.5-2.07Z"/></svg>
                )}
                {item.icon === 'fa-shield-halved' && (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7"><path d="M12 2 4 5v6c0 5.25 3.4 9.74 8 11 4.6-1.26 8-5.75 8-11V5l-8-3Zm0 2.18L18 6.1v4.9c0 4.21-2.64 7.94-6 9.17-3.36-1.23-6-4.96-6-9.17V6.1l6-1.92Z"/></svg>
                )}
                {item.icon === 'fa-dollar-sign' && (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7"><path d="M13 3.5V2h-2v1.5a4.5 4.5 0 0 0-4 4.47c0 2.03 1.39 3.6 3.95 4.2l2.1.5c1.42.34 1.95.93 1.95 1.83 0 1.14-1.07 2-2.5 2s-2.5-.86-2.5-2H8c0 1.9 1.3 3.22 3 3.6V22h2v-1.4c1.95-.35 3.5-1.77 3.5-3.77 0-2.07-1.42-3.28-3.95-3.87l-2.1-.5C9.03 12.67 8.5 12.1 8.5 11.2c0-1.1 1.07-2 2.5-2s2.5.9 2.5 2h2c0-1.86-1.3-3.16-3-3.6Z"/></svg>
                )}
                {item.icon === 'fa-handshake' && (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7"><path d="M21 6h-5l-2-2H9L7 6H2v6h4.23l2.12 2.12a3 3 0 0 0 4.24 0l1.41-1.41 1.41 1.41a3 3 0 0 0 4.24 0L22 12V6ZM9.83 6l1-1h2.34l1 1H9.83ZM4 8h2.59L5 9.59 6.41 11H4V8Zm8.41 6.41a1 1 0 0 1-1.41 0L8.59 12 11 9.59 13.41 12l-1 1.41ZM20 11h-2.41L19 9.59 17.59 8H20v3Z"/></svg>
                )}
              </div>
              <h3 className="text-xl font-bold text-deep-blue mb-4">{item.title}</h3>
              <p className="text-charcoal leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </Container>

      <Container className="py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-deep-blue mb-4">Bulk Pricing Calculator</h2>
          <p className="text-xl text-charcoal/80 max-w-2xl mx-auto">Get instant pricing estimates for your volume projects.</p>
        </div>
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="block text-charcoal text-base font-medium mb-2">Product Type</label>
                <select className="w-full h-12 pl-4 pr-10 bg-white rounded border border-gray-300 text-charcoal appearance-none">
                  <option>Select product type...</option>
                  <option>Residential Sectional Doors</option>
                  <option>Panel Lift Doors</option>
                  <option>Roller Doors</option>
                  <option>Tilt Doors</option>
                </select>
              </div>
              <div>
                <label className="block text-charcoal text-base font-medium mb-2">Door Size</label>
                <select className="w-full h-12 pl-4 pr-10 bg-white rounded border border-gray-300 text-charcoal appearance-none">
                  <option>Select door size...</option>
                  <option>2400mm x 2100mm</option>
                  <option>2700mm x 2100mm</option>
                  <option>4800mm x 2100mm</option>
                  <option>5400mm x 2100mm</option>
                </select>
              </div>
              <div>
                <label className="block text-charcoal text-base font-medium mb-2">Quantity</label>
                <input type="number" className="w-full h-12 pl-4 bg-white rounded border border-gray-300 text-charcoal" placeholder="Enter quantity (min 10)" />
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-charcoal text-base font-medium mb-2">Material Finish</label>
                <select className="w-full h-12 pl-4 pr-10 bg-white rounded border border-gray-300 text-charcoal appearance-none">
                  <option>Select finish...</option>
                  <option>Colorbond Steel</option>
                  <option>Powder Coated Aluminium</option>
                  <option>Timber Look</option>
                  <option>Custom Color Match</option>
                </select>
              </div>
              <div>
                <label className="block text-charcoal text-base font-medium mb-2">Motor Type</label>
                <select className="w-full h-12 pl-4 pr-10 bg-white rounded border border-gray-300 text-charcoal appearance-none">
                  <option>Select motor type...</option>
                  <option>Standard Chain Drive</option>
                  <option>Belt Drive (Quiet)</option>
                  <option>Direct Drive (Premium)</option>
                  <option>No Motor Required</option>
                </select>
              </div>
              <div className="pt-4">
                <Button variant="primary" className="w-full px-8 py-4 text-lg">Calculate Estimate</Button>
              </div>
            </div>
          </div>
          <div className="mt-8 p-6 bg-deep-blue-light rounded-lg">
            <p className="text-sm text-deep-blue leading-relaxed"><strong>Disclaimer:</strong> Pricing estimates are indicative only and based on standard specifications.</p>
          </div>
        </div>
      </Container>

      <Container className="py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-deep-blue mb-4">Recommended Products for Volume Builds</h2>
          <p className="text-xl text-charcoal/80 max-w-3xl mx-auto">Our most popular door systems for residential developments.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { title: 'Premium Sectional Series', price: 'From $2,450 each', img: '57d8753c4b-91284fb77f30ff75bd0e.png', desc: 'High-quality doors with superior insulation and modern design.' },
            { title: 'Standard Panel Lift', price: 'From $1,850 each', img: 'a2993af33c-7d8fca66d466fdb48c2b.png', desc: 'Reliable, cost-effective solution for standard applications.' },
            { title: 'Compact Roller Series', price: 'From $2,150 each', img: '8de15f0fc8-d82d75eed42b6fce2f30.png', desc: 'Space-efficient design ideal for narrow driveways.' },
          ].map((p) => (
            <div key={p.title} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden group hover:shadow-md transition-shadow">
              <div className="overflow-hidden"><Image className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" src={`https://storage.googleapis.com/uxpilot-auth.appspot.com/${p.img}`} alt={p.title} width={800} height={400} /></div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-charcoal mb-3">{p.title}</h3>
                <p className="text-charcoal/70 mb-4 leading-relaxed">{p.desc}</p>
                <div className="flex justify-between items-center">
                  <span className="text-vibrant-orange font-semibold">{p.price}</span>
                  <span className="text-vibrant-orange font-medium">View Details →</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Container>

      <section className="py-20 bg-deep-blue text-center">
        <Container>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to Streamline Your Next Development?</h2>
          <p className="text-xl text-deep-blue-light mb-8 max-w-3xl mx-auto">Partner with our dedicated volume builder team to ensure your residential developments are delivered on time and on budget.</p>
          <Link href="/contact"><Button variant="primary" className="px-12 py-4 text-xl">Get in Touch with an Account Manager</Button></Link>
        </Container>
      </section>

      <ServiceSchema serviceName="Volume Builder Garage Door Solutions" description="Bulk supply, install, and automation packages for volume residential developments." />
      <BreadcrumbSchema items={crumbs.map(c => ({ name: c.label, url: c.href }))} />
    </main>
  )
}

