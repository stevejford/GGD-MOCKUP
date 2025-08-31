'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { HeaderProps } from '@/types/components';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';
import ClientAuthWrapper from '@/components/auth/ClientAuthWrapper'

// Navigation item type
interface NavigationItem {
  label: string;
  href: string;
  dropdown?: { label: string; href: string }[];
}

// Navigation structure with dropdowns
const navigationItems: NavigationItem[] = [
  { label: 'Home', href: '/' },
  {
    label: 'Company',
    href: '/about-us',
    dropdown: [
      { label: 'About Us', href: '/about-us' },
      { label: 'Our Work', href: '/our-work' },
      { label: 'Contact', href: '/contact' },
    ]
  },
  {
    label: 'Solutions',
    href: '/solutions/for-volume-builders',
    dropdown: [
      { label: 'Volume Builders', href: '/solutions/for-volume-builders' },
      { label: 'Custom Home Builders', href: '/solutions/for-custom-home-builders' },
      { label: 'Architects', href: '/solutions/for-architects' },
    ]
  },
  {
    label: 'Products',
    href: '/products/sectional',
    dropdown: [
      { label: 'Sectional Doors', href: '/products/sectional' },
      { label: 'Roller Doors', href: '/products/roller' },
    ]
  },
  {
    label: 'Brands',
    href: '/brands',
    dropdown: [
      { label: 'B&D Doors', href: '/brands/b-and-d' },
      { label: 'Steel-Line', href: '/brands/steel-line' },
      { label: 'ECO Garage Doors', href: '/brands/eco-garage-doors' },
      { label: '4Ddoors', href: '/brands/4ddoors' },
      { label: 'Taurean', href: '/brands/taurean' },
      { label: 'Centurion', href: '/brands/centurion' },
    ]
  },
  { label: 'Service Areas', href: '/service-areas' },
  { label: 'Technical Resources', href: '/technical-resources' },
];

const Header: React.FC<HeaderProps> = ({ phoneNumber = "(03) 5221 9222", ctaButton = { label: "Trade Portal", href: "/trade-portal/login" }, className }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openLabel, setOpenLabel] = useState<string | null>(null);
  const [mobileDropdowns, setMobileDropdowns] = useState<{ [key: string]: boolean }>({});
  const pathname = usePathname();
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const isActiveLink = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      let shouldClose = true;

      Object.values(dropdownRefs.current).forEach(ref => {
        if (ref && ref.contains(target)) {
          shouldClose = false;
        }
      });

      if (shouldClose) {
        setOpenLabel(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDropdownToggle = (label: string) => {
    setOpenLabel(prev => (prev === label ? null : label));
  };

  const handleMobileDropdownToggle = (label: string) => {
    setMobileDropdowns(prev => ({
      ...prev,
      [label]: !prev[label]
    }));
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setMobileDropdowns({});
  };

  return (
    <header className={cn("sticky top-0 z-40 w-full bg-deep-blue backdrop-blur-sm px-container py-3 shadow-sm", className)}>
      <div className="max-w-container mx-auto flex items-center justify-between gap-4 min-h-16">
        {/* Logo */}
        <div className="flex items-center shrink-0">
          <Link href="/" className="hover:opacity-90 transition-opacity flex items-center">
            <Image
              src="/logo.png"
              alt="Geelong Garage Doors"
              width={220}
              height={48}
              className="h-12 brightness-0 invert"
              style={{ width: 'auto', height: 'auto' }}
              priority
            />
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center flex-nowrap gap-4 lg:gap-5 xl:gap-6 text-base">
          {navigationItems.map((item) => {
            if (item.dropdown) {
              return (
                <div
                  key={item.label}
                  className="relative"
                  ref={el => { dropdownRefs.current[item.label] = el; }}
                  onMouseEnter={() => setOpenLabel(item.label)}
                  onMouseLeave={() => setOpenLabel(null)}
                >
                  <button
                    onClick={() => handleDropdownToggle(item.label)}
                    className={cn(
                      "flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap",
                      isActiveLink(item.href)
                        ? "text-vibrant-orange hover:text-orange-300 font-medium"
                        : "text-white hover:text-deep-blue-light"
                    )}
                    aria-haspopup="menu"
                    aria-expanded={openLabel === item.label}
                  >
                    {item.label}
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {openLabel === item.label && (
                    <div
                      className="absolute left-0 top-full mt-0.5 bg-white text-charcoal rounded-lg shadow-lg min-w-[220px] py-2 z-50 border before:content-[''] before:absolute before:-top-2 before:left-0 before:w-full before:h-2"
                      role="menu"
                      onMouseLeave={() => setOpenLabel(null)}
                    >
                      {item.dropdown.map(dropdownItem => (
                        <Link
                          key={dropdownItem.href}
                          href={dropdownItem.href}
                          className="block px-4 py-2 hover:bg-gray-100 transition-colors"
                          onClick={() => setOpenLabel(null)}
                        >
                          {dropdownItem.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "transition-colors cursor-pointer whitespace-nowrap",
                  isActiveLink(item.href)
                    ? "text-vibrant-orange hover:text-orange-300 font-medium"
                    : "text-white hover:text-deep-blue-light"
                )}
                onMouseEnter={() => setOpenLabel(null)}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* CTA Section */}
        <div className="hidden md:flex">
          <ClientAuthWrapper
            ctaButton={ctaButton}
            phoneNumber={phoneNumber}
            isMobile={false}
          />
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-white p-2"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle mobile menu"
          aria-expanded={isMobileMenuOpen}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isMobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-deep-blue border-t border-deep-blue-light mt-4">
          <nav className="px-container py-4 space-y-2">
            {navigationItems.map((item) => {
              if (item.dropdown) {
                return (
                  <div key={item.label}>
                    <button
                      className="w-full text-left py-2 text-white hover:text-deep-blue-light flex items-center justify-between"
                      onClick={() => handleMobileDropdownToggle(item.label)}
                      aria-expanded={!!mobileDropdowns[item.label]}
                    >
                      {item.label}
                      <svg
                        className={cn("w-4 h-4 transition-transform", mobileDropdowns[item.label] ? "rotate-180" : "")}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {mobileDropdowns[item.label] && (
                      <div className="pl-4 py-2 space-y-2">
                        {item.dropdown.map(dropdownItem => (
                          <Link
                            key={dropdownItem.href}
                            href={dropdownItem.href}
                            className="block text-deep-blue-light hover:text-white py-1"
                            onClick={closeMobileMenu}
                          >
                            {dropdownItem.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "block py-2 transition-colors",
                    isActiveLink(item.href)
                      ? "text-vibrant-orange font-medium"
                      : "text-white hover:text-deep-blue-light"
                  )}
                  onClick={closeMobileMenu}
                >
                  {item.label}
                </Link>
              );
            })}

            <div className="pt-4 border-t border-deep-blue-light space-y-3">
              <a href="tel:+61352219222" className="text-white font-medium hover:text-deep-blue-light" aria-label={`Call ${phoneNumber}`}>
                {phoneNumber}
              </a>
              <ClientAuthWrapper
                ctaButton={ctaButton}
                isMobile={true}
                onMobileMenuClose={closeMobileMenu}
              />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
