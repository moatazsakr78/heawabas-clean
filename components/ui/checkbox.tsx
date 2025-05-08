"use client"

import * as React from "react"

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ id, checked, onCheckedChange, disabled, className, ...props }, ref) => {
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (onCheckedChange) {
        onCheckedChange(event.target.checked);
      }
    };

    const handleClick = () => {
      if (onCheckedChange && !disabled) {
        onCheckedChange(!checked);
      }
    };

    return (
      <div 
        className="relative inline-flex items-center cursor-pointer" 
        onClick={handleClick}
      >
        <input
          type="checkbox"
          id={id}
          ref={ref}
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          className="sr-only"
          {...props}
        />
        <div 
          className={`
            h-6 w-6 rounded-full transition-colors duration-200
            ${checked ? 'bg-green-500' : 'bg-gray-200 hover:bg-gray-300'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        />
        {checked && (
          <svg
            className="absolute top-1 left-1 h-4 w-4 text-white stroke-2"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";

export { Checkbox }; 