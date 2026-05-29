import React, { useState } from 'react';
import { Eye, EyeOff, X } from 'lucide-react';

/**
 * CustomInput - Reusable styled input component
 *
 * Props:
 * @param {string}   type          - Input type: 'text' | 'email' | 'tel' | 'number' | 'password' (default: 'text')
 * @param {string}   name          - Field name
 * @param {string}   value         - Current value
 * @param {function} onChange      - onChange handler
 * @param {function} onBlur        - onBlur handler (optional)
 * @param {string}   placeholder   - Placeholder text
 * @param {boolean}  required      - Required field
 * @param {boolean}  disabled      - Disabled state
 * @param {boolean}  clearable     - Show clear (X) button when has value
 * @param {node}     icon          - Left icon (optional)
 * @param {string}   maxLength     - Max characters allowed
 * @param {boolean}  error         - Show error state border
 * @param {string}   className     - Extra wrapper className
 */
const CustomInput = ({
    type = 'text',
    name,
    value,
    onChange,
    onBlur,
    placeholder = '',
    required = false,
    disabled = false,
    clearable = false,
    icon = null,
    maxLength,
    error = false,
    className = '',
    ...rest
}) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    const handleClear = () => {
        onChange({ target: { name, value: '' } });
    };

    const showClear = clearable && value && !disabled;
    const showPasswordToggle = isPassword && !disabled;

    return (
        <div className={`relative w-full group ${className}`}>
            {/* Left Icon */}
            {icon && (
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] pointer-events-none transition-colors duration-200 group-focus-within:text-[var(--color-primary)]">
                    {icon}
                </div>
            )}

            {/* Input Field */}
            <input
                type={inputType}
                name={name}
                value={value}
                onChange={onChange}
                onBlur={(e) => {
                    setIsFocused(false);
                    onBlur?.(e);
                }}
                onFocus={() => setIsFocused(true)}
                placeholder={placeholder}
                required={required}
                disabled={disabled}
                maxLength={maxLength}
                className={`
                    w-full py-3 text-sm
                    bg-[var(--color-bg-secondary)]
                    text-[var(--color-text-primary)]
                    border rounded-lg
                    placeholder:text-[var(--color-text-secondary)]
                    transition-all duration-200
                    focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${icon ? 'pl-10' : 'pl-4'}
                    ${(showClear || showPasswordToggle) ? 'pr-10' : 'pr-4'}
                    ${error
                        ? 'border-[var(--color-error)] focus:ring-[var(--color-error)]'
                        : 'border-[var(--color-border-primary)] hover:border-[var(--color-primary)]'
                    }
                `}
                {...rest}
            />

            {/* Right side actions */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {/* Clear button */}
                {showClear && !showPasswordToggle && (
                    <button
                        type="button"
                        onClick={handleClear}
                        tabIndex={-1}
                        className="text-[var(--color-text-secondary)] hover:text-[var(--color-error)] transition-colors p-0.5 rounded-full hover:bg-[var(--color-bg-hover,#f3f4f6)]"
                        title="Clear"
                    >
                        <X size={14} />
                    </button>
                )}

                {/* Password toggle */}
                {showPasswordToggle && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                        className="text-[var(--color-primary-darker)]  transition-colors p-0.5"
                        title={showPassword ? 'Hide password' : 'Show password'}
                    >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                )}
            </div>
        </div>
    );
};

export default CustomInput;
