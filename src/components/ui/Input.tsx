import React from 'react';
import { InputProps } from '../../types/components';
import { cn } from '../../lib/utils';

const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className,
  ...props
}) => {
  const baseStyles = "border border-gray-300 rounded px-4 py-2 text-charcoal focus:outline-none focus:border-deep-blue transition-colors";
  const errorStyles = error ? "border-red-500 focus:border-red-500" : "";
  const widthClass = fullWidth ? "w-full" : "";
  
  return (
    <div className={cn("flex flex-col", fullWidth && "w-full")}>
      {label && (
        <label className="text-sm font-medium text-charcoal mb-1">
          {label}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {leftIcon}
          </div>
        )}
        
        <input
          className={cn(
            baseStyles,
            errorStyles,
            widthClass,
            leftIcon && "pl-10",
            rightIcon && "pr-10",
            className
          )}
          {...props}
        />
        
        {rightIcon && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {rightIcon}
          </div>
        )}
      </div>
      
      {error && (
        <span className="text-sm text-red-500 mt-1">{error}</span>
      )}
      
      {helperText && !error && (
        <span className="text-sm text-gray-500 mt-1">{helperText}</span>
      )}
    </div>
  );
};

export default Input;
