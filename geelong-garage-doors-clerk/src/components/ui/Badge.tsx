import React from 'react';
import { BadgeProps } from '@/types/components';
import { cn } from '@/lib/utils';

const Badge: React.FC<BadgeProps> = ({ variant, size = 'md', className, children }) => {
  const baseStyles = "inline-flex items-center font-medium rounded-full";
  const variants = { residential: "bg-deep-blue-light text-deep-blue", commercial: "bg-green-100 text-green-800", industrial: "bg-purple-100 text-purple-800", custom: "bg-orange-100 text-orange-800", heritage: "bg-yellow-100 text-yellow-800", smart: "bg-blue-100 text-blue-800" } as const;
  const sizes = { sm: "px-2 py-1 text-xs", md: "px-3 py-1 text-sm" } as const;

  return (
    <span className={cn(baseStyles, variants[variant], sizes[size], className)}>
      {children || variant.charAt(0).toUpperCase() + variant.slice(1)}
    </span>
  );
};

export default Badge;

