import React from 'react';
import Link from 'next/link';
import { BreadcrumbProps } from '@/types/components';
import { cn } from '@/lib/utils';

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className }) => {
  return (
    <section className={cn("bg-white py-4 border-b border-gray-200", className)}>
      <div className="max-w-container mx-auto px-container">
        <nav className="flex items-center space-x-2 text-sm" aria-label="Breadcrumb">
          {items.map((item, index) => (
            <React.Fragment key={index}>
              {index > 0 && (
                <span className="text-charcoal" aria-hidden="true">/</span>
              )}
              {item.href && !item.active ? (
                <Link href={item.href} className="text-vibrant-orange hover:text-orange-600 cursor-pointer transition-colors">
                  {item.label}
                </Link>
              ) : (
                <span className={cn(item.active ? "text-charcoal font-medium" : "text-charcoal/70")} aria-current={item.active ? "page" : undefined}>
                  {item.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>
    </section>
  );
};

export default Breadcrumb;

