export type Product = {
  slug: string;
  category: string;
  title: string;
  description: string;
  hero: string;
  features: string[];
}

export const products: Product[] = [
  { slug: 'premium-sectional', category: 'sectional', title: 'Premium Sectional Series', description: 'High-quality sectional doors with superior insulation and modern styling.', hero: '57d8753c4b-91284fb77f30ff75bd0e.png', features: ['Insulated panels', 'Quiet operation', 'Multiple finishes'] },
  { slug: 'panel-lift-standard', category: 'sectional', title: 'Standard Panel Lift', description: 'Cost-effective panel lift solution for residential builds.', hero: 'a2993af33c-7d8fca66d466fdb48c2b.png', features: ['Reliable hardware', 'Classic profiles', 'Colorbond range'] },
  { slug: 'compact-roller', category: 'roller', title: 'Compact Roller Series', description: 'Space-saving roller doors ideal for narrow driveways.', hero: '8de15f0fc8-d82d75eed42b6fce2f30.png', features: ['Compact roll', 'Durable steel', 'Auto-reverse safety'] },
]

export const getCategories = () => Array.from(new Set(products.map(p => p.category)))
export const getByCategory = (categorySlug: string) => products.filter(p => p.category === categorySlug)
export const getProduct = (categorySlug: string, productSlug: string) => products.find(p => p.category === categorySlug && p.slug === productSlug)

