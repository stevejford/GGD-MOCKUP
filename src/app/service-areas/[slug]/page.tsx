import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Container, Breadcrumb } from '../../../components/layout';
import { ProjectCard, Button } from '../../../components/ui';
import { serviceAreasData, getServiceAreaBySlug, getAllServiceAreaSlugs } from '../../../lib/service-areas-data';
import { findBestLocationImage } from '../../../lib/pixabay';
import { LocalBusinessSchema, BreadcrumbSchema } from '../../../components/seo/JsonLd';

// Generate static params for all service areas
export async function generateStaticParams() {
  const slugs = getAllServiceAreaSlugs();
  return slugs.map((slug) => ({
    slug: slug,
  }));
}

// Generate metadata for each service area
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const serviceArea = getServiceAreaBySlug(params.slug);
  
  if (!serviceArea) {
    return {
      title: 'Service Area Not Found',
    };
  }

  return {
    title: serviceArea.metaTitle,
    description: serviceArea.metaDescription,
    keywords: [`garage doors ${serviceArea.locationName}`, `${serviceArea.locationName} garage doors`, 'residential doors', 'commercial doors', 'industrial doors'],
    openGraph: {
      title: serviceArea.metaTitle,
      description: serviceArea.metaDescription,
      images: [serviceArea.heroImage.src],
    },
  };
}

export default async function ServiceAreaPage({ params }: { params: { slug: string } }) {
  const serviceArea = getServiceAreaBySlug(params.slug);

  if (!serviceArea) {
    notFound();
  }

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Service Areas', href: '/service-areas' },
    { label: serviceArea.locationName, active: true },
  ];

  const breadcrumbSchemaItems = breadcrumbItems.map(item => ({
    name: item.label,
    url: item.href ? `https://geelonggaragedoors.com.au${item.href}` : undefined
  }));

  return (
    <>
      <LocalBusinessSchema
        locationName={serviceArea.locationName}
        description={serviceArea.introductionContent}
      />
      <BreadcrumbSchema items={breadcrumbSchemaItems} />

      {/* Breadcrumb */}
      <Breadcrumb items={breadcrumbItems} />

      {/* Hero Section */}
      <section className="relative h-[600px] overflow-hidden bg-gradient-to-r from-[#002e5b] to-[#2c3993]">
        {(() => {
          // Pixabay hero image with 24h cache; falls back to static
          /* @ts-expect-error Async Server Component inline */
          return (async () => {
            const hit = await findBestLocationImage(serviceArea.locationName)
            const heroSrc = hit?.largeImageURL || hit?.webformatURL || serviceArea.heroImage.src
            const heroAlt = hit ? `${serviceArea.locationName} architecture — ${hit.tags}` : serviceArea.heroImage.alt
            return (
              <>
                <Image src={heroSrc} alt={heroAlt} fill className="object-cover opacity-30" priority />
                {hit && (
                  <div className="absolute bottom-2 right-3 text-white/80 text-xs bg-black/30 px-2 py-1 rounded">
                    Photo: <a className="underline hover:text-white" href={hit.pageURL} target="_blank" rel="noopener noreferrer">{hit.user} via Pixabay</a>
                  </div>
                )}
              </>
            )
          })()
        })()}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/60"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Container>
            <div className="text-center text-white">
              <h1 className="text-5xl font-montserrat font-bold mb-6 leading-tight">
                Premium Garage Door Services in {serviceArea.locationName}
              </h1>
              <p className="text-xl mb-8 max-w-2xl mx-auto text-[#e1ecf8]">
                Premium garage door solutions tailored for {serviceArea.locationName} residents and businesses
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="primary" size="lg">
                  Request a Quote
                </Button>
                <Button variant="outline" size="lg">
                  View Our Work
                </Button>
              </div>
            </div>
          </Container>
        </div>
      </section>

      {/* Introduction Section */}
      <section className="py-16 bg-white">
        <Container>
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-deep-blue mb-6">
              Your Local Garage Door Experts in {serviceArea.locationName}
            </h2>
            <p className="text-lg text-charcoal/80 leading-relaxed">
              {serviceArea.introductionContent}
            </p>
          </div>
        </Container>
      </section>

      {/* Services Section - Static content with internal links for SEO */}
      <section className="py-16 bg-background">
        <Container>
          <h2 className="text-3xl font-bold text-deep-blue text-center mb-12">
            Our Services in {serviceArea.locationName}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Residential Services */}
            <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-lg transition-shadow">
              <div className="text-vibrant-orange text-4xl mb-4">
                <i className="fas fa-home"></i>
              </div>
              <h3 className="text-xl font-bold text-charcoal mb-3">Residential Doors</h3>
              <p className="text-charcoal/80 mb-4">
                Custom residential garage doors designed to complement {serviceArea.locationName}'s architectural styles.
              </p>
              <Link
                href="/products/residential-doors"
                className="text-vibrant-orange hover:text-orange-600 font-medium transition-colors"
              >
                View Residential Solutions →
              </Link>
            </div>

            {/* Commercial Services */}
            <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-lg transition-shadow">
              <div className="text-vibrant-orange text-4xl mb-4">
                <i className="fas fa-building"></i>
              </div>
              <h3 className="text-xl font-bold text-charcoal mb-3">Commercial Doors</h3>
              <p className="text-charcoal/80 mb-4">
                Heavy-duty commercial solutions for {serviceArea.locationName} businesses and retail spaces.
              </p>
              <Link
                href="/products/commercial-doors"
                className="text-vibrant-orange hover:text-orange-600 font-medium transition-colors"
              >
                View Commercial Solutions →
              </Link>
            </div>

            {/* Industrial Services */}
            <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-lg transition-shadow">
              <div className="text-vibrant-orange text-4xl mb-4">
                <i className="fas fa-industry"></i>
              </div>
              <h3 className="text-xl font-bold text-charcoal mb-3">Industrial Doors</h3>
              <p className="text-charcoal/80 mb-4">
                High-performance industrial doors for {serviceArea.locationName}'s manufacturing and logistics facilities.
              </p>
              <Link
                href="/products/industrial-doors"
                className="text-vibrant-orange hover:text-orange-600 font-medium transition-colors"
              >
                View Industrial Solutions →
              </Link>
            </div>

            {/* Repair Services */}
            <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-lg transition-shadow">
              <div className="text-vibrant-orange text-4xl mb-4">
                <i className="fas fa-tools"></i>
              </div>
              <h3 className="text-xl font-bold text-charcoal mb-3">Repair & Maintenance</h3>
              <p className="text-charcoal/80 mb-4">
                24/7 emergency repair services and preventive maintenance for {serviceArea.locationName} properties.
              </p>
              <Link
                href="/services/repair-maintenance"
                className="text-vibrant-orange hover:text-orange-600 font-medium transition-colors"
              >
                View Repair Services →
              </Link>
            </div>

            {/* Smart Systems */}
            <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-lg transition-shadow">
              <div className="text-vibrant-orange text-4xl mb-4">
                <i className="fas fa-mobile-alt"></i>
              </div>
              <h3 className="text-xl font-bold text-charcoal mb-3">Smart Automation</h3>
              <p className="text-charcoal/80 mb-4">
                Advanced smart garage door systems with app control and home automation integration.
              </p>
              <Link
                href="/products/smart-systems"
                className="text-vibrant-orange hover:text-orange-600 font-medium transition-colors"
              >
                View Smart Solutions →
              </Link>
            </div>

            {/* Custom Solutions */}
            <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-lg transition-shadow">
              <div className="text-vibrant-orange text-4xl mb-4">
                <i className="fas fa-drafting-compass"></i>
              </div>
              <h3 className="text-xl font-bold text-charcoal mb-3">Custom Design</h3>
              <p className="text-charcoal/80 mb-4">
                Bespoke garage door designs tailored to unique architectural requirements in {serviceArea.locationName}.
              </p>
              <Link
                href="/products/custom-doors"
                className="text-vibrant-orange hover:text-orange-600 font-medium transition-colors"
              >
                View Custom Solutions →
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* Local Projects Section */}
      {serviceArea.localProjects && serviceArea.localProjects.length > 0 && (
        <section className="py-16 bg-white">
          <Container>
            <h2 className="text-3xl font-bold text-deep-blue text-center mb-12">
              Recent Projects in {serviceArea.locationName}
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              {serviceArea.localProjects.map((project, index) => (
                <ProjectCard
                  key={index}
                  {...project}
                  onViewProject={() => {
                    // Handle project view - could navigate to project detail page
                    console.log(`View project: ${project.title}`);
                  }}
                />
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* Testimonial Section */}
      {serviceArea.localTestimonial && (
        <section className="py-16 bg-background">
          <Container>
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-deep-blue mb-8">
                What Our {serviceArea.locationName} Customers Say
              </h2>
              <blockquote className="text-xl text-charcoal/80 italic mb-6 leading-relaxed">
                "{serviceArea.localTestimonial.content}"
              </blockquote>
              <div className="text-charcoal font-semibold">
                — {serviceArea.localTestimonial.author}
                {serviceArea.localTestimonial.company && (
                  <span className="text-charcoal/70 font-normal">
                    , {serviceArea.localTestimonial.company}
                  </span>
                )}
              </div>
            </div>
          </Container>
        </section>
      )}

      {/* Call-to-Action Section */}
      <section className="py-20 bg-deep-blue">
        <Container>
          <div className="text-center">
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Get Started in {serviceArea.locationName}?
            </h2>
            <p className="text-xl text-deep-blue-light mb-8 max-w-2xl mx-auto">
              Contact our local team for a free consultation and quote. We're here to help
              you find the perfect garage door solution for your {serviceArea.locationName} property.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="primary" size="lg">
                Get Free Quote
              </Button>
              <Link
                href="tel:1300443366"
                className="border-2 border-white text-white hover:bg-white hover:text-deep-blue px-8 py-4 rounded-lg font-semibold text-lg transition-all inline-block"
              >
                Call 1300 GGD DOORS
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
