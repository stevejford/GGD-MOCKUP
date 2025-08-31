import React from 'react';
import { BaseComponentProps } from '@/types/components';
import { cn } from '@/lib/utils';

interface ContainerProps extends BaseComponentProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  padding?: boolean;
  as?: keyof React.JSX.IntrinsicElements;
}

const Container: React.FC<ContainerProps> = ({ size = 'xl', padding = true, as: Component = 'div', className, children }) => {
  const sizes = { sm: 'max-w-2xl', md: 'max-w-4xl', lg: 'max-w-6xl', xl: 'max-w-container', full: 'max-w-full' };
  return (
    <Component className={cn('mx-auto', sizes[size], padding && 'px-container', className)}>
      {children}
    </Component>
  );
};

export default Container;

