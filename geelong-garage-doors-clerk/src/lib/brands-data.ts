export type Brand = {
  name: string;
  slug: string;
  siteUrl: string;
  summary: string;
  productTypes: string[];
};

export const brandsData: Brand[] = [
  {
    name: 'B&D Doors',
    slug: 'b-and-d',
    siteUrl: 'https://www.bnd.com.au/',
    summary: 'Iconic Australian brand known for sectional and roller doors, openers, and security solutions for residential and commercial applications.',
    productTypes: ['Sectional doors', 'Roller doors', 'Commercial shutters', 'Automation & openers']
  },
  {
    name: 'Steel-Line Garage Doors',
    slug: 'steel-line',
    siteUrl: 'https://www.steeline.com.au/',
    summary: 'Australian manufacturer offering a wide range of stylish sectional and roller doors with options suited to coastal and architectural builds.',
    productTypes: ['Sectional doors', 'Roller doors', 'Custom profiles', 'Automation']
  },
  {
    name: 'ECO Garage Doors',
    slug: 'eco-garage-doors',
    siteUrl: 'https://www.ecogaragedoors.com.au/',
    summary: 'Premium architectural doors and openers with a focus on contemporary finishes and energy‑efficient construction.',
    productTypes: ['Architectural sectional', 'Insulated doors', 'Designer finishes', 'Openers']
  },
  {
    name: '4Ddoors',
    slug: '4ddoors',
    siteUrl: 'https://www.4ddoors.com.au/',
    summary: 'Supplier and distributor of premium door systems and automation, connecting leading European and local products to the Australian market.',
    productTypes: ['Sectional systems', 'Industrial doors', 'Automation & controls']
  },
  {
    name: 'Taurean Door Systems',
    slug: 'taurean',
    siteUrl: 'https://www.taureands.com.au/',
    summary: 'Durable roller doors and shutters engineered for Australian conditions across residential, commercial and industrial sites.',
    productTypes: ['Roller doors', 'Industrial shutters', 'Commercial solutions']
  },
  {
    name: 'Centurion Garage Doors',
    slug: 'centurion',
    siteUrl: 'https://www.cgdoors.com.au/',
    summary: 'Established Australian brand providing sectional and roller doors with a variety of profiles, colours and opener options.',
    productTypes: ['Sectional doors', 'Roller doors', 'Automation']
  },
]

export const getAllBrandSlugs = () => brandsData.map(b => b.slug)
export const getBrandBySlug = (slug: string) => brandsData.find(b => b.slug === slug)

