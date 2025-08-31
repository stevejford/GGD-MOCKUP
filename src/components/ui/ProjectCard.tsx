import React from 'react';
import Image from 'next/image';
import { ProjectCardProps } from '../../types/components';
import { cn } from '../../lib/utils';
import Button from './Button';
import Badge from './Badge';

const ProjectCard: React.FC<ProjectCardProps> = ({
  title,
  location,
  date,
  category,
  description,
  image,
  onViewProject,
  className,
}) => {
  const categoryVariantMap = {
    'Residential': 'residential' as const,
    'Commercial': 'commercial' as const,
    'Industrial': 'industrial' as const,
    'Custom': 'custom' as const,
    'Heritage': 'heritage' as const,
    'Smart Systems': 'smart' as const,
  };

  return (
    <div className={cn(
      "bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden group hover:shadow-lg transition-shadow duration-300",
      className
    )}>
      {/* Image Container */}
      <div className="overflow-hidden">
        <Image
          src={image.src}
          alt={image.alt}
          width={400}
          height={256}
          className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      
      {/* Content */}
      <div className="p-6">
        {/* Category and Date */}
        <div className="flex items-center justify-between mb-3">
          <Badge variant={categoryVariantMap[category]} />
          <span className="text-charcoal/60 text-sm">{date}</span>
        </div>
        
        {/* Title */}
        <h3 className="text-xl font-bold text-charcoal mb-2">{title}</h3>
        
        {/* Location */}
        <p className="text-charcoal/70 text-sm mb-3 flex items-center">
          <i className="fas fa-map-marker-alt text-vibrant-orange mr-1"></i>
          {location}
        </p>
        
        {/* Description */}
        <p className="text-charcoal/80 mb-4 text-sm leading-relaxed">
          {description}
        </p>
        
        {/* Action Button */}
        <Button
          variant="primary"
          size="md"
          fullWidth
          onClick={onViewProject}
        >
          View Project
        </Button>
      </div>
    </div>
  );
};

export default ProjectCard;
