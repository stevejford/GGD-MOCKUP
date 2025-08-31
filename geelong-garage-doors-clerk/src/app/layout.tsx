import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { Header, Footer } from "@/components/layout";

const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat", weight: ["100","200","300","400","500","600","700","800","900"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: {
    default: 'Geelong Garage Doors',
    template: '%s | Geelong Garage Doors',
  },
  description: 'Premium garage door solutions engineered for trade excellence.',
  openGraph: {
    type: 'website',
    title: 'Geelong Garage Doors',
    description: 'Premium garage door solutions engineered for trade excellence.',
    url: '/',
    siteName: 'Geelong Garage Doors',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Geelong Garage Doors',
    description: 'Premium garage door solutions engineered for trade excellence.',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Navigation is now handled internally in Header component

  const footerSections = [
    {
      title: "Company",
      links: [
        { label: "About Us", href: "/about-us" },
        { label: "Our Work", href: "/our-work" },
        { label: "Contact", href: "/contact" },
      ],
    },
    {
      title: "Solutions",
      links: [
        { label: "Volume Builders", href: "/solutions/for-volume-builders" },
        { label: "Custom Home Builders", href: "/solutions/for-custom-home-builders" },
        { label: "Architects", href: "/solutions/for-architects" },
      ],
    },
    {
      title: "Products",
      links: [
        { label: "Sectional Doors", href: "/products/sectional" },
        { label: "Roller Doors", href: "/products/roller" },
      ],
    },
    {
      title: "Support",
      links: [
        { label: "Technical Resources", href: "/technical-resources" },
        { label: "Service Areas", href: "/service-areas" },
      ],
    },
  ];

  const contactInfo = {
    address: "31 Gordon Ave, Geelong West VIC 3218",
    phone: "(03) 5221 9222",
    email: "info@geelonggaragedoors.com.au",
    hours: [
      { label: "Saturday", value: "Closed" },
      { label: "Sunday", value: "Closed" },
      { label: "Monday", value: "9 am–4:30 pm" },
      { label: "Tuesday", value: "9 am–4:30 pm" },
      { label: "Wednesday", value: "9 am–4:30 pm" },
      { label: "Thursday", value: "9 am–4:30 pm" },
      { label: "Friday", value: "9 am–4:30 pm" },
    ],
  };

  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${montserrat.variable} antialiased`}>
          <Header ctaButton={{ label: "Trade Portal", href: "/trade-portal/dashboard" }} />
          {children}
          <Footer
            sections={footerSections}
            contactInfo={contactInfo}
            copyright={`© ${new Date().getFullYear()} Geelong Garage Doors. All rights reserved.`}
            legalLinks={[{ label: "Privacy Policy", href: "/privacy" }, { label: "Terms", href: "/terms" }]}
          />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        </body>
      </html>
    </ClerkProvider>
  );
}
