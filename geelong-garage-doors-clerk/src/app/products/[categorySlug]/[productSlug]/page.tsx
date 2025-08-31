import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Breadcrumb, Container } from '@/components/layout'
import { getProduct } from '@/lib/products-data'

export async function generateStaticParams() {
  return [
    { categorySlug: 'sectional', productSlug: 'premium-sectional' },
    { categorySlug: 'sectional', productSlug: 'panel-lift-standard' },
    { categorySlug: 'roller', productSlug: 'compact-roller' },
  ]
}

type ProductDetailPageProps = { params: Promise<{ categorySlug: string; productSlug: string }> }

export async function generateMetadata(ctx: ProductDetailPageProps): Promise<Metadata> {
  const { categorySlug, productSlug } = await ctx.params
  const product = getProduct(categorySlug, productSlug)
  if (!product) return { title: 'Product not found' }
  const title = product.title
  const description = product.description
  const ogImage = `/og?title=${encodeURIComponent(title)}`
  return {
    title,
    description,
    openGraph: { title, description, images: [ogImage], url: `/products/${product.category}/${product.slug}` },
    twitter: { card: 'summary_large_image', title, description, images: [ogImage] },
  }
}

export default async function ProductDetailPage(ctx: ProductDetailPageProps) {
  const { categorySlug, productSlug } = await ctx.params
  const product = getProduct(categorySlug, productSlug)
  if (!product) notFound()

  const crumbs = [
    { label: 'Home', href: '/' },
    { label: 'Products', href: '/products/sectional' },
    { label: product.category, href: `/products/${product.category}` },
    { label: product.title, active: true },
  ]

  return (
    <main>
      <Breadcrumb items={crumbs} />
      <Container className="py-12 max-w-4xl">
        <div className="grid md:grid-cols-2 gap-8 items-start">
          <Image
            className="w-full h-80 object-cover rounded-lg"
            src={`https://storage.googleapis.com/uxpilot-auth.appspot.com/${product.hero}`}
            alt={product.title}
            width={800}
            height={600}
          />
          <div>
            <h1 className="text-4xl font-bold text-charcoal mb-4">{product.title}</h1>
            <p className="text-charcoal/80 leading-relaxed mb-6">{product.description}</p>
            <ul className="list-disc list-inside space-y-2 text-charcoal">
              {product.features.map((f) => (<li key={f}>{f}</li>))}
            </ul>
          </div>
        </div>

        <div className="mt-12">
          <h2 className="text-2xl font-bold text-deep-blue mb-4">Preferred Brands</h2>
          <div className="flex flex-wrap items-center gap-6">
            {[
              { slug: 'b-and-d', name: 'B&D Doors' },
              { slug: 'steel-line', name: 'Steel-Line' },
              { slug: 'eco-garage-doors', name: 'ECO Garage Doors' },
              { slug: '4ddoors', name: '4Ddoors' },
              { slug: 'taurean', name: 'Taurean' },
              { slug: 'centurion', name: 'Centurion' },
            ].map(b => (
              <Link key={b.slug} href={`/brands/${b.slug}`} className="relative w-36 h-12 inline-block">
                <Image src={`/brands/${b.slug}.svg`} alt={`${b.name} logo`} fill className="object-contain" />
              </Link>
            ))}
          </div>
          <div className="mt-3">
            <Link href="/brands" className="text-vibrant-orange hover:underline">Explore all brands →</Link>
          </div>
        </div>
      </Container>
    </main>
  )
}
