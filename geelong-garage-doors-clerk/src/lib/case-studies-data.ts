export type CaseStudy = { slug: string; title: string; image: string; summary: string; body?: string }

export const caseStudies: CaseStudy[] = [
  { slug: 'luxury-residential-project', title: 'Luxury Residential Project', image: '5aceb97141-96d91fd9aca6a261508a.png', summary: "Custom architectural doors for premium residential development in Melbourne's east.", body: 'Full case study content goes here.' },
  { slug: 'commercial-complex', title: 'Commercial Complex', image: 'dde1771d61-887a6a8c843554f9d7a7.png', summary: 'Large-scale commercial installation in Geelong CBD.', body: 'Full case study content goes here.' },
  { slug: 'industrial-facility', title: 'Industrial Facility', image: '4cf3a800b9-ab23de311e4281e780dc.png', summary: 'Heavy-duty doors for a manufacturing facility expansion.', body: 'Full case study content goes here.' },
]

export const getCaseStudy = (slug: string) => caseStudies.find(c => c.slug === slug)

