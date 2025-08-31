import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { Container } from '../../components/layout';
import { Card } from '../../components/ui';
import { serviceAreasData } from '../../lib/service-areas-data';

export const metadata: Metadata = {
  title: 'Service Areas',
  description: 'Geelong Garage Doors serves communities across Victoria with premium garage door solutions. Find your local service area and discover our expertise in your region.',
  keywords: ['service areas', 'Geelong', 'Werribee', 'garage doors', 'local service'],
};

export default function ServiceAreasPage() {
  return (
    <>
      {/* Page Hero Section */}
      <section className="py-20 bg-white">
        <Container>
          <div className="text-center">
            <h1 className="text-5xl font-bold text-deep-blue mb-6">
              Our Service Areas
            </h1>
            <p className="text-xl text-charcoal/80 max-w-3xl mx-auto leading-relaxed">
              Delivering premium garage door solutions across Victoria. Our local expertise 
              and understanding of regional requirements ensure we provide the perfect solution 
              for your specific location and needs.
            </p>
          </div>
        </Container>
      </section>

      {/* Service Areas Grid */}
      <section className="py-16 bg-background">
        <Container>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {serviceAreasData.map((area) => (
              <Card
                key={area.slug}
                variant="project"
                hover
                padding="sm"
                className="group"
              >
                <Link href={`/service-areas/${area.slug}`}>
                  {/* Image */}
                  <div className="overflow-hidden rounded-t-lg">
                    <Image
                      src={area.heroImage.src}
                      alt={area.heroImage.alt}
                      width={400}
                      height={240}
                      className="w-full h-60 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  
                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-2xl font-bold text-charcoal mb-3 group-hover:text-deep-blue transition-colors">
                      {area.locationName}
                    </h3>
                    <p className="text-charcoal/80 mb-4 leading-relaxed">
                      {area.introductionContent.substring(0, 150)}...
                    </p>
                    <div className="flex items-center text-vibrant-orange font-medium">
                      View Services in {area.locationName}
                      <svg
                        className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </Link>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* Contact CTA Section */}
      <section className="py-20 bg-deep-blue">
        <Container>
          <div className="text-center">
            <h2 className="text-4xl font-bold text-white mb-6">
              Don't See Your Area Listed?
            </h2>
            <p className="text-xl text-deep-blue-light mb-8 max-w-2xl mx-auto">
              We're expanding our service areas regularly. Contact us to discuss 
              your project requirements and discover how we can serve your location.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="bg-vibrant-orange hover:bg-vibrant-orange-hover text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors inline-block"
              >
                Contact Us Today
              </Link>
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
