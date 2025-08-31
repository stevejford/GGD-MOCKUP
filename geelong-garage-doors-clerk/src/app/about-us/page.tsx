import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Breadcrumb, Container } from '@/components/layout'
import Button from '@/components/ui/Button'
import { OrganizationSchema } from '@/components/seo/JsonLd'

export const metadata: Metadata = {
  title: 'About Us | Geelong Garage Doors',
  description: 'Premium garage door solutions engineered for trade excellence. Learn about our mission, values, and capabilities.',
  alternates: { canonical: '/about-us' },
  openGraph: {
    title: 'About Us | Geelong Garage Doors',
    description: 'Premium garage door solutions engineered for trade excellence for builders, architects, insurers and property managers.',
    url: '/about-us',
    images: ['/og?title=About%20Us']
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Us | Geelong Garage Doors',
    description: 'Premium garage door solutions engineered for trade excellence.'
  }
}

export default function AboutUs() {
  return (
    <main className="bg-gray-50">
      {/* Hero */}
      <section className="relative h-[440px] flex items-center justify-center bg-deep-blue">
        <Image
          className="object-cover"
          src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=1600&auto=format&fit=crop"
          alt="Team collaborating on a commercial door project"
          fill
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-deep-blue/60 to-deep-blue/30" />
        <Container>
          <div className="relative z-10 max-w-3xl text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">About Geelong Garage Doors</h1>
            <p className="text-deep-blue-light text-lg md:text-xl mb-6">
              Premium B2B garage door partner for builders, architects, insurers and property managers — engineered quality, reliable delivery, and accountable service.
            </p>
            <div className="flex gap-3">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center bg-vibrant-orange hover:bg-vibrant-orange-hover text-white px-6 py-3 rounded-lg font-medium"
              >
                Request a Quote
              </Link>
              <a
                href="tel:+61352219222"
                className="inline-flex items-center justify-center bg-white text-deep-blue hover:bg-deep-blue-light px-6 py-3 rounded-lg font-medium"
              >
                Call (03) 5221 9222
              </a>
            </div>
          </div>
        </Container>
      </section>

      {/* Breadcrumb */}
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'About Us', active: true }]} />

      {/* Company Overview */}
      <section className="py-16 bg-white">
        <Container>
          <div className="grid lg:grid-cols-2 gap-10 items-start">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-deep-blue mb-4">Engineering Quality. Delivering Reliability.</h2>
              <p className="text-charcoal text-lg mb-6">
                We partner with trade professionals to specify, supply, install and maintain commercial, industrial and architectural garage door systems across Victoria. Our workflows align to construction programs and insurance SLAs for predictable, on-time outcomes.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-lg border border-deep-blue-light p-5 bg-white">
                  <h3 className="font-semibold text-deep-blue mb-2">Mission</h3>
                  <p className="text-charcoal text-sm">Be the most dependable garage door partner for Victoria’s construction and property sectors.</p>
                </div>
                <div className="rounded-lg border border-deep-blue-light p-5 bg-white">
                  <h3 className="font-semibold text-deep-blue mb-2">Approach</h3>
                  <p className="text-charcoal text-sm">Specification support, quality supply, neat installs, and proactive aftercare.</p>
                </div>
                <div className="rounded-lg border border-deep-blue-light p-5 bg-white">
                  <h3 className="font-semibold text-deep-blue mb-2">Service SLAs</h3>
                  <p className="text-charcoal text-sm">New doors 5–6 weeks from order. Emergencies within 24 hours. Standard service ~1 week.</p>
                </div>
                <div className="rounded-lg border border-deep-blue-light p-5 bg-white">
                  <h3 className="font-semibold text-deep-blue mb-2">Values</h3>
                  <p className="text-charcoal text-sm">Safety, reliability, clear communication, and respect for site standards.</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl overflow-hidden shadow-sm border border-deep-blue-light bg-white">
              <Image
                src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1200&auto=format&fit=crop"
                alt="Operations team planning install schedule"
                width={1200}
                height={800}
                className="w-full h-64 md:h-full object-cover"
              />
            </div>
          </div>
        </Container>
      </section>

      {/* Capabilities */}
      <section className="py-16 bg-gray-50">
        <Container>
          <h2 className="text-3xl md:text-4xl font-bold text-deep-blue mb-10">Capabilities</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Commercial Installations', desc: 'Sectional, roller, overhead doors for new builds and upgrades.' },
              { title: 'Industrial Solutions', desc: 'Heavy‑duty systems, high‑cycle doors, warehouses and utilities.' },
              { title: 'Insurance & Make‑Safe', desc: 'Damage assessment, temporary secure, fast replacement processing.' },
              { title: 'Maintenance Contracts', desc: 'Planned servicing and compliance checks for portfolios.' },
            ].map((c) => (
              <div key={c.title} className="bg-white rounded-lg border border-deep-blue-light p-6 hover:shadow-md transition-shadow">
                <h3 className="text-lg font-semibold text-deep-blue mb-2">{c.title}</h3>
                <p className="text-charcoal text-sm">{c.desc}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Who We Serve */}
      <section className="py-16 bg-white">
        <Container>
          <h2 className="text-3xl md:text-4xl font-bold text-deep-blue mb-10">Who We Serve</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { t: 'Architects & Designers', d: 'Specification help, architectural finishes, compliance docs.' },
              { t: 'Builders & Developers', d: 'Program-aligned installs, neat finishes, reliable handover.' },
              { t: 'Insurance & Loss Adjusters', d: 'Make‑safe, rapid assessments, streamlined replacements.' },
              { t: 'Property & Facility Managers', d: 'Planned maintenance and responsive breakdown support.' },
            ].map((i) => (
              <div key={i.t} className="rounded-lg border border-deep-blue-light p-6 bg-white hover:shadow-sm transition-shadow">
                <h3 className="text-lg font-semibold text-deep-blue mb-2">{i.t}</h3>
                <p className="text-sm text-charcoal">{i.d}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Credentials */}
      <section className="py-14 bg-gray-50">
        <Container>
          <h2 className="text-2xl font-bold text-deep-blue mb-6">Credentials & Certifications</h2>
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-charcoal">
            <li className="bg-white border border-deep-blue-light rounded-lg p-4">Fully insured and industry compliant</li>
            <li className="bg-white border border-deep-blue-light rounded-lg p-4">Manufacturer-trained technicians</li>
            <li className="bg-white border border-deep-blue-light rounded-lg p-4">Safety-first methodology and SWMS</li>
          </ul>
        </Container>
      </section>

      {/* Credibility + Stats */}
      <section className="py-14 bg-white">
        <Container>
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <h3 className="text-xl font-semibold text-deep-blue mb-3">Trusted Partnerships</h3>
              <p className="text-charcoal mb-4">We work with leading Australian brands and trade partners to deliver consistent outcomes across residential developments, commercial properties and government facilities.</p>
              <div className="flex flex-wrap gap-2">
                {['B&D', 'Steel‑Line', 'Gliderol', 'ATA', 'Danmar'].map((b) => (
                  <span key={b} className="text-sm px-3 py-1 rounded-full bg-gray-100 text-charcoal">{b}</span>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { k: '5–6 weeks', v: 'New doors lead time' },
                { k: '24 hrs', v: 'Emergency response' },
                { k: 'Annual', v: 'Service programs' },
                { k: '40+ areas', v: 'Service coverage' },
              ].map((s) => (
                <div key={s.v} className="rounded-lg border border-deep-blue-light p-5 text-center">
                  <div className="text-2xl font-bold text-deep-blue">{s.k}</div>
                  <div className="text-sm text-charcoal mt-1">{s.v}</div>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="py-16 bg-vibrant-orange">
        <Container>
          <div className="text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to scope your project?</h2>
            <p className="text-lg mb-8 max-w-2xl mx-auto">Send plans/specs for quotation or book a site assessment. Our team will respond within one business day.</p>
            <div className="flex justify-center gap-4">
              <Link href="/contact" className="bg-white text-vibrant-orange hover:bg-gray-100 px-8 py-4 rounded-lg font-medium">Request a Quote</Link>
              <a href="tel:+61352219222" className="border-2 border-white text-white hover:bg-white hover:text-vibrant-orange px-8 py-4 rounded-lg font-medium">Call (03) 5221 9222</a>
            </div>
          </div>
        </Container>
      </section>
      <OrganizationSchema />
    </main>
  )
}
