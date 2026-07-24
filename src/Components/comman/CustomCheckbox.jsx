import React from 'react';
import { Check } from 'lucide-react';

const CustomCheckbox = ({ 
  id, 
  checked, 
  onChange, 
  label,
  children,
  disabled = false, 
  className = "",
  checkboxClassName = ""
}) => {
  return (
    <label 
      htmlFor={id} 
      className={`flex items-center gap-2 cursor-pointer select-none flex-shrink-0 ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      <div className="relative flex items-center justify-center">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="peer sr-only"
        />
        <div className={`
          w-4 h-4 rounded flex flex-shrink-0 items-center justify-center transition-colors duration-150
          ${checked 
            ? 'bg-[var(--color-primary)] border border-[var(--color-primary)] text-white' 
            : 'border-2 border-[var(--color-border-secondary)] bg-transparent text-transparent'
          }
          peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--color-primary)] peer-focus-visible:ring-offset-1
          ${checkboxClassName}
        `}>
          {checked && <Check size={12} strokeWidth={4} />}
        </div>
      </div>
      {label && (
        <span className="text-sm font-medium text-[var(--color-text-primary)]">
          {label}
        </span>
      )}
      {children}
    </label>
  );
};

export default CustomCheckbox;
