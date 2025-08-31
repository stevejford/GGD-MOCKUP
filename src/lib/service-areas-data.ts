// Service Areas Data for Static Generation
// This will be replaced with CMS data in the future

import { ServiceAreaData } from '@/types/components';

export const serviceAreasData: ServiceAreaData[] = [
  {
    locationName: "Geelong",
    slug: "geelong",
    heroImage: {
      src: "https://storage.googleapis.com/uxpilot-auth.appspot.com/3998becd13-a73dfabd59d7cb3838a8.png",
      alt: "Modern garage doors in Geelong residential area"
    },
    introductionContent: "Geelong Garage Doors has been serving the greater Geelong region for over 15 years, providing premium garage door solutions to residential, commercial, and industrial clients. Our local expertise and understanding of Geelong's unique architectural styles and weather conditions ensure we deliver solutions perfectly suited to your needs.",
    localProjects: [
      {
        title: "Luxury Residential Development",
        location: "Newtown, Geelong",
        date: "March 2024",
        category: "Residential",
        description: "Custom architectural doors for premium residential development featuring contemporary design and smart automation systems.",
        image: {
          src: "https://storage.googleapis.com/uxpilot-auth.appspot.com/5aceb97141-bb5b81270f521feb5cef.png",
          alt: "luxury residential garage door installation in Geelong"
        }
      },
      {
        title: "Corporate Headquarters",
        location: "Geelong CBD",
        date: "February 2024",
        category: "Commercial",
        description: "Large-scale commercial installation featuring high-security access systems and integrated building management.",
        image: {
          src: "https://storage.googleapis.com/uxpilot-auth.appspot.com/dde1771d61-15a2f70dfa0facc5ff13.png",
          alt: "commercial building garage doors in Geelong CBD"
        }
      }
    ],
    localTestimonial: {
      content: "Geelong Garage Doors transformed our warehouse operations with their industrial door solutions. The team's professionalism and attention to detail exceeded our expectations.",
      author: "Sarah Mitchell",
      company: "Geelong Manufacturing Co."
    },
    metaTitle: "Premium Garage Doors & Service in Geelong | Geelong Garage Doors",
    metaDescription: "Expert garage door installation, repair, and maintenance services in Geelong. Residential, commercial, and industrial solutions. Local expertise, premium quality. Call 1300 GGD DOORS."
  },
  {
    locationName: "Werribee",
    slug: "werribee",
    heroImage: {
      src: "https://storage.googleapis.com/uxpilot-auth.appspot.com/02df449531-e878e0d780b815c3e54c.png",
      alt: "Modern garage doors in Werribee residential development"
    },
    introductionContent: "Serving the growing Werribee community with reliable garage door solutions tailored to the area's expanding residential and commercial developments. Our team understands the unique requirements of Werribee's diverse architectural landscape and provides solutions that enhance both functionality and curb appeal.",
    localProjects: [
      {
        title: "Werribee Town Centre Expansion",
        location: "Werribee",
        date: "January 2024",
        category: "Commercial",
        description: "Multi-unit commercial installation with coordinated design elements and centralized access control systems for the expanding town centre.",
        image: {
          src: "https://storage.googleapis.com/uxpilot-auth.appspot.com/8f847eda4b-c1cf75693bb3eb707f6e.png",
          alt: "commercial garage doors at Werribee town centre"
        }
      },
      {
        title: "Residential Estate Development",
        location: "Point Cook Road, Werribee",
        date: "December 2023",
        category: "Residential",
        description: "Standardized residential solutions for 45-unit housing development with consistent design and reliable operation systems.",
        image: {
          src: "https://storage.googleapis.com/uxpilot-auth.appspot.com/02df449531-e878e0d780b815c3e54c.png",
          alt: "residential garage doors in Werribee housing development"
        }
      }
    ],
    localTestimonial: {
      content: "The team at Geelong Garage Doors provided exceptional service for our new home in Werribee. Professional installation and great follow-up support.",
      author: "Michael Chen",
      company: "Werribee Resident"
    },
    metaTitle: "Professional Garage Door Services in Werribee | Geelong Garage Doors",
    metaDescription: "Trusted garage door specialists serving Werribee and surrounding areas. Residential and commercial installations, repairs, and maintenance. Quality service guaranteed. Contact us today."
  }
];

// Helper function to get service area by slug
export function getServiceAreaBySlug(slug: string): ServiceAreaData | undefined {
  return serviceAreasData.find(area => area.slug === slug);
}

// Helper function to get all service area slugs for static generation
export function getAllServiceAreaSlugs(): string[] {
  return serviceAreasData.map(area => area.slug);
}
