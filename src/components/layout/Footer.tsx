import React from 'react';
import Link from 'next/link';
import { FooterProps } from '../../types/components';
import { cn } from '../../lib/utils';

const Footer: React.FC<FooterProps> = ({
  sections,
  contactInfo,
  copyright,
  legalLinks,
  className,
}) => {
  return (
    <footer className={cn("bg-deep-blue py-16", className)}>
      <div className="max-w-container mx-auto px-container">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          {/* Company Info */}
          <div>
            <div className="text-white text-2xl font-bold mb-4">
              <span className="text-heritage-red">Geelong</span> Garage Doors
            </div>
            <p className="text-deep-blue-light leading-relaxed">
              Premium garage door solutions engineered for trade excellence. Serving Victoria's construction industry with quality, reliability, and innovation.
            </p>
          </div>
          
          {/* Navigation Sections */}
          {sections.map((section, index) => (
            <div key={index}>
              <h4 className="text-white text-lg font-semibold mb-4">
                {section.title}
              </h4>
              <ul className="space-y-2">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <Link
                      href={link.href}
                      className={cn(
                        "transition-colors cursor-pointer",
                        link.active
                          ? "text-vibrant-orange hover:text-orange-300"
                          : "text-deep-blue-light hover:text-white"
                      )}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          
          {/* Contact Information */}
          <div>
            <h4 className="text-white text-lg font-semibold mb-4">
              Contact Information
            </h4>
            <div className="space-y-3 text-deep-blue-light">
              <div dangerouslySetInnerHTML={{ __html: contactInfo.address }} />
              <p>
                <strong className="text-white">Phone:</strong><br />
                {contactInfo.phone}
              </p>
              <p>
                <strong className="text-white">Email:</strong><br />
                <Link
                  href={`mailto:${contactInfo.email}`}
                  className="hover:text-white transition-colors"
                >
                  {contactInfo.email}
                </Link>
              </p>
            </div>
          </div>
        </div>
        
        {/* Footer Bottom */}
        <div className="border-t border-deep-blue-light/20 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-deep-blue-light text-center md:text-left">
            {copyright}
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            {legalLinks.map((link, index) => (
              <Link
                key={index}
                href={link.href}
                className="text-deep-blue-light hover:text-white transition-colors cursor-pointer"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
