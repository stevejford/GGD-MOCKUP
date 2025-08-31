// Component Type Definitions for Geelong Garage Doors

import { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes } from 'react';

// Base component props
export interface BaseComponentProps {
  className?: string;
  children?: ReactNode;
}

// Button Component Types
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'outlineLight' | 'text' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  className?: string;
  children: ReactNode;
}

// Card Component Types
export type CardVariant = 'default' | 'elevated' | 'outlined' | 'project';

export interface CardProps extends BaseComponentProps {
  variant?: CardVariant;
  hover?: boolean;
  padding?: 'sm' | 'md' | 'lg';
}

// Project Card Specific Types
export interface ProjectCardProps extends BaseComponentProps {
  title: string;
  location: string;
  date: string;
  category: 'Residential' | 'Commercial' | 'Industrial' | 'Custom' | 'Heritage' | 'Smart Systems';
  description: string;
  image: {
    src: string;
    alt: string;
  };
  onViewProject?: () => void;
}

// Form Component Types
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: Array<{
    value: string;
    label: string;
    disabled?: boolean;
  }>;
  placeholder?: string;
  fullWidth?: boolean;
}

export interface TextareaProps extends BaseComponentProps {
  label?: string;
  error?: string;
  helperText?: string;
  placeholder?: string;
  rows?: number;
  fullWidth?: boolean;
  value?: string;
  onChange?: (value: string) => void;
}

// Modal Component Types
export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnOverlayClick?: boolean;
  showCloseButton?: boolean;
}

// Badge Component Types
export type BadgeVariant = 'residential' | 'commercial' | 'industrial' | 'custom' | 'heritage' | 'smart';

export interface BadgeProps extends BaseComponentProps {
  variant: BadgeVariant;
  size?: 'sm' | 'md';
}

// Navigation Component Types
export interface NavItem {
  label: string;
  href: string;
  active?: boolean;
  external?: boolean;
}

export interface HeaderProps extends BaseComponentProps {
  phoneNumber?: string;
  ctaButton?: {
    label: string;
    href: string;
    onClick?: () => void;
  };
}

// Footer Component Types
export interface FooterLink {
  label: string;
  href: string;
  active?: boolean;
}

export interface FooterSection {
  title: string;
  links: FooterLink[];
}

export interface FooterProps extends BaseComponentProps {
  sections: FooterSection[];
  contactInfo: {
    address: string;
    phone: string;
    email: string;
    hours?: Array<{ label: string; value: string }>;
  };
  copyright: string;
  legalLinks: FooterLink[];
}

// Hero Section Types
export interface HeroProps extends BaseComponentProps {
  title: string;
  subtitle: string;
  backgroundImage?: {
    src: string;
    alt: string;
  };
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  overlay?: boolean;
}

// Statistics Component Types
export interface StatisticProps {
  value: string;
  label: string;
  color?: 'blue' | 'orange';
}

export interface StatisticsProps extends BaseComponentProps {
  statistics: StatisticProps[];
}

// Breadcrumb Component Types
export interface BreadcrumbItem {
  label: string;
  href?: string;
  active?: boolean;
}

export interface BreadcrumbProps extends BaseComponentProps {
  items: BreadcrumbItem[];
}

// Filter Toolbar Types
export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterToolbarProps extends BaseComponentProps {
  industryFilter: {
    value: string;
    onChange: (value: string) => void;
    options: FilterOption[];
  };
  productFilter: {
    value: string;
    onChange: (value: string) => void;
    options: FilterOption[];
  };
  resultCount: {
    showing: number;
    total: number;
  };
  viewMode: {
    current: 'grid' | 'list';
    onChange: (mode: 'grid' | 'list') => void;
  };
}

// Service Area Page Types
export interface ServiceAreaData {
  locationName: string;
  slug: string;
  heroImage: {
    src: string;
    alt: string;
  };
  introductionContent: string;
  localProjects?: ProjectCardProps[];
  localTestimonial?: {
    content: string;
    author: string;
    company: string;
  };
  metaTitle: string;
  metaDescription: string;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

// Form Data Types
export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message: string;
  projectType?: string;
  preferredContact?: 'email' | 'phone';
}

export interface QuoteRequestData extends ContactFormData {
  projectDetails: {
    type: 'residential' | 'commercial' | 'industrial';
    timeline: string;
    budget?: string;
    specifications?: string;
  };
}
