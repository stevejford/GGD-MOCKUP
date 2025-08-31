import React from 'react';
import { SelectProps } from '../../types/components';
import { cn } from '../../lib/utils';

const Select: React.FC<SelectProps> = ({
  label,
  error,
  helperText,
  options,
  placeholder,
  fullWidth = false,
  className,
  ...props
}) => {
  const baseStyles = "bg-white border border-gray-300 rounded px-4 py-2 text-charcoal focus:outline-none focus:border-deep-blue transition-colors";
  const errorStyles = error ? "border-red-500 focus:border-red-500" : "";
  const widthClass = fullWidth ? "w-full" : "";
  
  return (
    <div className={cn("flex flex-col", fullWidth && "w-full")}>
      {label && (
        <label className="text-sm font-medium text-charcoal mb-1">
          {label}
        </label>
      )}
      
      <select
        className={cn(
          baseStyles,
          errorStyles,
          widthClass,
          className
        )}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
      
      {error && (
        <span className="text-sm text-red-500 mt-1">{error}</span>
      )}
      
      {helperText && !error && (
        <span className="text-sm text-gray-500 mt-1">{helperText}</span>
      )}
    </div>
  );
};

export default Select;
