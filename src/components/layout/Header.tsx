'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HeaderProps } from '../../types/components';
import { cn } from '../../lib/utils';
import Button from '../ui/Button';

const Header: React.FC<HeaderProps> = ({
  navigation,
  phoneNumber = "1300 GGD DOORS",
  ctaButton = {
    label: "Trade Portal Login",
    href: "/trade-portal/login"
  },
  className,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const isActiveLink = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <header className={cn("w-full bg-deep-blue px-container py-4", className)}>
      <div className="max-w-container mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <Link href="/" className="text-white text-2xl font-bold hover:opacity-90 transition-opacity">
            <span className="text-heritage-red">Geelong</span> Garage Doors
          </Link>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "transition-colors cursor-pointer",
                isActiveLink(item.href)
                  ? "text-vibrant-orange hover:text-orange-300 font-medium"
                  : "text-white hover:text-deep-blue-light"
              )}
              target={item.external ? "_blank" : undefined}
              rel={item.external ? "noopener noreferrer" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        
        {/* Desktop CTA Section */}
        <div className="hidden md:flex items-center space-x-4">
          <span className="text-white font-medium">{phoneNumber}</span>
          <Button
            variant="primary"
            size="md"
            onClick={() => window.location.href = ctaButton.href}
          >
            {ctaButton.label}
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-white p-2"
          onClick={toggleMobileMenu}
          aria-label="Toggle mobile menu"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isMobileMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-deep-blue border-t border-deep-blue-light mt-4">
          <nav className="px-container py-4 space-y-4">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "block py-2 transition-colors",
                  isActiveLink(item.href)
                    ? "text-vibrant-orange font-medium"
                    : "text-white hover:text-deep-blue-light"
                )}
                onClick={() => setIsMobileMenuOpen(false)}
                target={item.external ? "_blank" : undefined}
                rel={item.external ? "noopener noreferrer" : undefined}
              >
                {item.label}
              </Link>
            ))}
            
            {/* Mobile CTA Section */}
            <div className="pt-4 border-t border-deep-blue-light space-y-3">
              <div className="text-white font-medium">{phoneNumber}</div>
              <Button
                variant="primary"
                size="md"
                fullWidth
                onClick={() => {
                  window.location.href = ctaButton.href;
                  setIsMobileMenuOpen(false);
                }}
              >
                {ctaButton.label}
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
