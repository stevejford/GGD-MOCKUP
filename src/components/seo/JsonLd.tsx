import React from 'react';

// Organization Schema for the homepage
export function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Geelong Garage Doors",
    "alternateName": "GGD",
    "url": "https://geelonggaragedoors.com.au",
    "logo": "https://geelonggaragedoors.com.au/logo.png",
    "description": "Premium garage door solutions engineered for trade excellence. Serving Victoria's construction industry with quality, reliability, and innovation.",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "123 Industrial Drive",
      "addressLocality": "Geelong",
      "addressRegion": "VIC",
      "postalCode": "3220",
      "addressCountry": "AU"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+61-1300-443-366",
      "contactType": "customer service",
      "availableLanguage": "English"
    },
    "sameAs": [
      "https://www.facebook.com/geelonggaragedoors",
      "https://www.linkedin.com/company/geelong-garage-doors"
    ],
    "areaServed": [
      {
        "@type": "City",
        "name": "Geelong",
        "addressRegion": "Victoria",
        "addressCountry": "Australia"
      },
      {
        "@type": "City",
        "name": "Werribee",
        "addressRegion": "Victoria",
        "addressCountry": "Australia"
      },
      {
        "@type": "City",
        "name": "Melbourne",
        "addressRegion": "Victoria",
        "addressCountry": "Australia"
      }
    ],
    "serviceType": [
      "Garage Door Installation",
      "Garage Door Repair",
      "Commercial Door Solutions",
      "Industrial Door Systems",
      "Smart Garage Door Automation"
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// Local Business Schema for service area pages
interface LocalBusinessSchemaProps {
  locationName: string;
  description: string;
}

export function LocalBusinessSchema({ locationName, description }: LocalBusinessSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": `Geelong Garage Doors - ${locationName}`,
    "description": description,
    "url": `https://geelonggaragedoors.com.au/service-areas/${locationName.toLowerCase()}`,
    "telephone": "+61-1300-443-366",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": locationName,
      "addressRegion": "Victoria",
      "addressCountry": "Australia"
    },
    "areaServed": {
      "@type": "City",
      "name": locationName,
      "addressRegion": "Victoria",
      "addressCountry": "Australia"
    },
    "serviceType": [
      "Garage Door Installation",
      "Garage Door Repair",
      "Commercial Door Solutions",
      "Residential Door Solutions",
      "Emergency Garage Door Service"
    ],
    "priceRange": "$$",
    "openingHours": "Mo-Fr 07:00-17:00, Sa 08:00-16:00"
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// Breadcrumb Schema
interface BreadcrumbSchemaProps {
  items: Array<{
    name: string;
    url?: string;
  }>;
}

export function BreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      ...(item.url && { "item": item.url })
    }))
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// Service Schema for service pages
interface ServiceSchemaProps {
  serviceName: string;
  description: string;
  areaServed?: string;
}

export function ServiceSchema({ serviceName, description, areaServed }: ServiceSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": serviceName,
    "description": description,
    "provider": {
      "@type": "Organization",
      "name": "Geelong Garage Doors",
      "url": "https://geelonggaragedoors.com.au"
    },
    "serviceType": serviceName,
    ...(areaServed && {
      "areaServed": {
        "@type": "City",
        "name": areaServed,
        "addressRegion": "Victoria",
        "addressCountry": "Australia"
      }
    })
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
