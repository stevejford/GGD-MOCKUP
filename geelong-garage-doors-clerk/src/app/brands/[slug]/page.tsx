import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { Container, Breadcrumb } from '@/components/layout'
import { brandsData, getAllBrandSlugs, getBrandBySlug } from '@/lib/brands-data'
import { ServiceSchema } from '@/components/seo/JsonLd'

export async function generateStaticParams() {
  return getAllBrandSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata(ctx: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await ctx.params
  const brand = getBrandBySlug(slug)
  if (!brand) return { title: 'Brand not found' }
  const title = `${brand.name} | Geelong Garage Doors`
  const description = `Supply, installation and service for ${brand.name} products in Geelong and across Victoria.`
  return {
    title,
    description,
    alternates: { canonical: `/brands/${brand.slug}` },
    openGraph: { title, description, url: `/brands/${brand.slug}`, images: ['/og?title=' + encodeURIComponent(brand.name)] },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function BrandPage(ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params
  const brand = getBrandBySlug(slug)
  if (!brand) notFound()

  const crumbs = [
    { label: 'Home', href: '/' },
    { label: 'Brands', href: '/brands' },
    { label: brand.name, active: true },
  ]

  return (
    <main className="bg-gray-50">
      <Breadcrumb items={crumbs} />

      <section className="py-14 bg-white">
        <Container>
          <div className="flex gap-6 items-center mb-3">
            <div className="relative w-64 h-20 sm:w-72 sm:h-24">
              <Image src={`/brands/${brand.slug}.svg`} alt={`${brand.name} logo`} fill className="object-contain" />
            </div>
            <h1 className="text-4xl font-bold text-deep-blue">{brand.name}</h1>
          </div>
          <p className="text-charcoal max-w-3xl mb-6">{brand.summary}</p>
          <div className="flex gap-3">
            <Link href="/contact" className="bg-vibrant-orange hover:bg-vibrant-orange-hover text-white px-6 py-3 rounded-lg font-medium">Request a Quote</Link>
            <a href={brand.siteUrl} target="_blank" rel="noopener noreferrer" className="border-2 border-deep-blue text-deep-blue hover:bg-deep-blue hover:text-white px-6 py-3 rounded-lg font-medium">Visit Official Site</a>
          </div>
        </Container>
      </section>

      <section className="py-12">
        <Container>
          <h2 className="text-2xl font-bold text-deep-blue mb-4">Typical Product Types</h2>
          <div className="flex flex-wrap gap-2 mb-8">
            {brand.productTypes.map(pt => (
              <span key={pt} className="text-sm px-3 py-1 rounded-full bg-gray-100 text-charcoal">{pt}</span>
            ))}
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-lg border border-deep-blue-light p-6 bg-white">
              <h3 className="font-semibold text-deep-blue mb-2">Supply & Install</h3>
              <p className="text-charcoal text-sm">We specify, supply and install {brand.name} doors and openers to suit commercial, industrial and architectural applications.</p>
            </div>
            <div className="rounded-lg border border-deep-blue-light p-6 bg-white">
              <h3 className="font-semibold text-deep-blue mb-2">Service & Repairs</h3>
              <p className="text-charcoal text-sm">Breakdowns, replacements and opener upgrades for {brand.name} systems. Emergency response available.</p>
            </div>
          </div>
        </Container>
      </section>

      <ServiceSchema serviceName={`${brand.name} supply and installation`} description={`Professional supply, installation and servicing for ${brand.name} products.`} />
    </main>
  )
}
