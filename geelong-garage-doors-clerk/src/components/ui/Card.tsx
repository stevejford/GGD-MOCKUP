import React from 'react';
import { CardProps } from '@/types/components';
import { cn } from '@/lib/utils';

const Card: React.FC<CardProps> = ({ variant = 'default', hover = false, padding = 'md', className, children }) => {
  const baseStyles = "bg-white rounded-lg border transition-all duration-300";
  const variants = { default: "border-gray-200 shadow-sm", elevated: "border-gray-200 shadow-md", outlined: "border-gray-300 shadow-none", project: "border-gray-200 shadow-sm group overflow-hidden" } as const;
  const hoverStyles = hover ? "hover:shadow-lg hover:-translate-y-1" : "";
  const paddingStyles = { sm: "p-4", md: "p-6", lg: "p-8" } as const;

  return (
    <div className={cn(baseStyles, variants[variant], hoverStyles, paddingStyles[padding], className)}>
      {children}
    </div>
  );
};

export default Card;

