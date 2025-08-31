import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FooterProps } from '@/types/components';
import { cn } from '@/lib/utils';

const Footer: React.FC<FooterProps> = ({ sections, contactInfo, copyright, legalLinks, className }) => {
  const byTitle = (t: string) => sections.find(s => s.title.toLowerCase() === t);
  const companySection = byTitle('company');
  const supportSection = byTitle('support');
  const solutionsSection = byTitle('solutions');
  const productsSection = byTitle('products');
  const resourcesLinks = [
    { label: 'Service Areas', href: '/service-areas' },
    { label: 'Brands', href: '/brands' },
    { label: 'Technical Resources', href: '/technical-resources' },
    { label: 'Trade Portal', href: '/trade-portal/dashboard' },
  ];
  return (
    <footer className={cn("bg-deep-blue py-16", className)}>
      <div className="max-w-container mx-auto px-container">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-10 mb-12 items-start">
          <div className="md:col-span-2">
            <div className="mb-6">
              <Link href="/" className="inline-flex items-center">
                <Image
                  src="/logo.png"
                  alt="Geelong Garage Doors"
                  width={220}
                  height={48}
                  className="h-12 brightness-0 invert"
                  style={{ width: 'auto', height: 'auto' }}
                />
              </Link>
            </div>
            <h5 className="text-white font-semibold mb-2">Head Office</h5>
            <div className="text-deep-blue-light space-y-1">
              <div className="whitespace-nowrap">{contactInfo.address}</div>
            </div>
            <div className="mt-6">
              <h5 className="text-white font-semibold mb-2">Contact</h5>
              <div className="text-deep-blue-light flex flex-col gap-2">
                <a href="tel:+61352219222" className="block text-white text-xl font-semibold hover:text-deep-blue-light" aria-label={`Call ${contactInfo.phone}`}>
                  {contactInfo.phone}
                </a>
                <Link href={`mailto:${contactInfo.email}`} className="block hover:text-white transition-colors">{contactInfo.email}</Link>
              </div>
            </div>
            {/* Social icons remain in the first column */}
            <div className="flex items-center gap-4 mt-6">
                  <Link href="https://www.facebook.com/" target="_blank" className="text-deep-blue-light hover:text-white" aria-label="Facebook">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M22 12.07C22 6.48 17.52 2 11.93 2S1.86 6.48 1.86 12.07c0 5 3.66 9.15 8.44 9.93v-7.02H7.9v-2.91h2.4V9.41c0-2.37 1.41-3.68 3.57-3.68 1.03 0 2.11.18 2.11.18v2.33h-1.19c-1.17 0-1.54.73-1.54 1.48v1.78h2.62l-.42 2.91h-2.2V22c4.78-.78 8.44-4.93 8.44-9.93z"/></svg>
                  </Link>
                  <Link href="https://www.instagram.com/" target="_blank" className="text-deep-blue-light hover:text-white" aria-label="Instagram">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.9.2 2.4.4.6.2 1 .5 1.5 1 .5.5.8.9 1 1.5.2.5.3 1.2.4 2.4.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.2 1.9-.4 2.4-.2.6-.5 1-1 1.5-.5.5-.9.8-1.5 1-.5.2-1.2.3-2.4.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.9-.2-2.4-.4-.6-.2-1-.5-1.5-1-.5-.5-.8-.9-1-1.5-.2-.5-.3-1.2-.4-2.4C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.2-1.9.4-2.4.2-.6.5-1 1-1.5.5-.5.9-.8 1.5-1 .5-.2 1.2-.3 2.4-.4C8.4 2.2 8.8 2.2 12 2.2m0-2.2C8.7 0 8.3 0 7 0 5.7.1 4.7.2 3.9.5 3 .8 2.2 1.2 1.5 1.9.8 2.6.4 3.4.1 4.3-.2 5.1-.1 6.1 0 7.4c.1 1.3.1 1.7.1 4.6s0 3.3-.1 4.6c-.1 1.3-.2 2.3-.5 3.1-.3.9-.7 1.7-1.4 2.4-.7.7-1.5 1.1-2.4 1.4-.9.3-1.9.4-3.1.5C8.3 24 8.7 24 12 24s3.7 0 5 0c1.3-.1 2.3-.2 3.1-.5.9-.3 1.7-.7 2.4-1.4.7-.7 1.1-1.5 1.4-2.4.3-.9.4-1.9.5-3.1.1-1.3.1-1.7.1-5s0-3.7-.1-5c-.1-1.3-.2-2.3-.5-3.1-.3-.9-.7-1.7-1.4-2.4C20.7.4 19.9.1 19 .1 18.1 0 17.1 0 15.9 0 14.7 0 13.3 0 12 0z"/><path d="M12 5.8a6.2 6.2 0 1 0 0 12.4A6.2 6.2 0 0 0 12 5.8zm0 10.2a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.5-10.9a1.4 1.4 0 1 1-2.8 0 1.4 1.4 0 0 1 2.8 0z"/></svg>
                  </Link>
            </div>
          </div>

          {companySection && (
            <div className="md:col-span-1">
              <h4 className="text-white text-lg font-semibold mb-4">{companySection.title}</h4>
              <ul className="space-y-3">
                {companySection.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <Link href={link.href} className={cn("transition-colors cursor-pointer", link.active ? "text-vibrant-orange hover:text-orange-300" : "text-deep-blue-light hover:text-white")}>{link.label}</Link>
                  </li>
                ))}
              </ul>
              {/* Support moved to separate Resources column */}
            </div>
          )}

          {(solutionsSection || productsSection) && (
            <div className="md:col-span-1">
              {solutionsSection && (
                <>
                  <h4 className="text-white text-lg font-semibold mb-4">{solutionsSection.title}</h4>
                  <ul className="space-y-3 mb-6">
                    {solutionsSection.links.map((link, linkIndex) => (
                      <li key={`sol-${linkIndex}`}>
                        <Link href={link.href} className={cn("transition-colors cursor-pointer", link.active ? "text-vibrant-orange hover:text-orange-300" : "text-deep-blue-light hover:text-white")}>{link.label}</Link>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {productsSection && (
                <>
                  <h4 className="text-white text-lg font-semibold mb-4">{productsSection.title}</h4>
                  <ul className="space-y-3">
                    {productsSection.links.map((link, linkIndex) => (
                      <li key={`prod-${linkIndex}`}>
                        <Link href={link.href} className={cn("transition-colors cursor-pointer", link.active ? "text-vibrant-orange hover:text-orange-300" : "text-deep-blue-light hover:text-white")}>{link.label}</Link>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}

          <div className="md:col-span-1">
            <h4 className="text-white text-lg font-semibold mb-4">Resources</h4>
            <ul className="space-y-3">
              {resourcesLinks.map((link, idx) => (
                <li key={`res-${idx}`}>
                  <Link href={link.href} className="text-deep-blue-light hover:text-white transition-colors cursor-pointer">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {contactInfo.hours && (
            <div className="md:col-span-1">
              <h4 className="text-white text-lg font-semibold mb-4">Hours</h4>
              <div className="text-deep-blue-light grid grid-cols-2 gap-x-6 gap-y-1 min-w-[260px]">
                {contactInfo.hours.map((h, idx) => (
                  <React.Fragment key={idx}>
                    <span className="whitespace-nowrap">{h.label}</span>
                    <span className="text-right whitespace-nowrap">{h.value}</span>
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-deep-blue-light/20 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-deep-blue-light text-center md:text-left">{copyright}</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            {legalLinks.map((link, index) => (
              <Link key={index} href={link.href} className="text-deep-blue-light hover:text-white transition-colors cursor-pointer">{link.label}</Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
