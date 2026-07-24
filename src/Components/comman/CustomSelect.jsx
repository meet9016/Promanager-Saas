import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X, Check } from 'lucide-react';

/**
 * CustomSelect - Reusable searchable dropdown component
 *
 * Props:
 * @param {string}   name          - Field name (for form handling)
 * @param {string}   value         - Currently selected value
 * @param {function} onChange       - Callback: onChange({ target: { name, value } })
 * @param {Array}    options        - [{ value, label }]
 * @param {string}   placeholder   - Placeholder text
 * @param {boolean}  required      - Whether field is required
 * @param {boolean}  disabled      - Whether field is disabled
 * @param {string}   label         - Label text (optional, render outside)
 * @param {boolean}  searchable    - Enable search (default: true)
 * @param {string}   className     - Extra wrapper className
 * @param {boolean}  error         - Show error state
 */
const CustomSelect = ({
    name,
    value,
    onChange,
    options = [],
    placeholder = 'Select an option',
    required = false,
    disabled = false,
    searchable = true,
    className = '',
    error = null,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const containerRef = useRef(null);
    const searchRef = useRef(null);
    const listRef = useRef(null);

    // Find the selected option label
    const selectedOption = options.find(opt => String(opt.value) === String(value));
    const selectedLabel = selectedOption ? selectedOption.label : '';

    // Filter options based on search query
    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Open dropdown
    const openDropdown = () => {
        if (disabled) return;
        setIsOpen(true);
        setSearchQuery('');
        setTimeout(() => searchRef.current?.focus(), 50);
    };

    // Close dropdown
    const closeDropdown = () => {
        setIsOpen(false);
        setSearchQuery('');
    };

    // Toggle dropdown
    const toggleDropdown = () => {
        if (isOpen) closeDropdown();
        else openDropdown();
    };

    // Handle option selection
    const handleSelect = (optionValue) => {
        onChange({ target: { name, value: optionValue } });
        closeDropdown();
    };

    // Clear selection
    const handleClear = (e) => {
        e.stopPropagation();
        onChange({ target: { name, value: '' } });
        setSearchQuery('');
    };

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                closeDropdown();
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Scroll selected item into view when dropdown opens
    useEffect(() => {
        if (isOpen && value && listRef.current) {
            setTimeout(() => {
                const selectedEl = listRef.current?.querySelector('[data-selected="true"]');
                if (selectedEl) {
                    selectedEl.scrollIntoView({ block: 'nearest' });
                }
            }, 60);
        }
    }, [isOpen]);

    // Keyboard navigation
    const handleKeyDown = (e) => {
        if (e.key === 'Escape') closeDropdown();
        if (e.key === 'Enter' && !isOpen) openDropdown();
    };

    return (
        <div
            ref={containerRef}
            className={`relative w-full ${className}`}
            onKeyDown={handleKeyDown}
        >
            {/* Trigger Button */}
            <button
                type="button"
                onClick={toggleDropdown}
                disabled={disabled}
                className={`
                    w-full flex items-center justify-between
                    px-4 py-3
                    border rounded-lg
                    text-left text-sm
                    transition-all duration-200
                    focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent
                    ${disabled
                        ? 'opacity-50 cursor-not-allowed bg-[var(--color-bg-secondary)] border-[var(--color-border-primary)]'
                        : 'cursor-pointer hover:border-[var(--color-primary)] bg-[var(--color-bg-secondary)] border-[var(--color-border-primary)]'
                    }
                    ${error ? 'border-[var(--color-error)] focus:ring-[var(--color-error)]' : ''}
                    ${isOpen ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)] ring-opacity-30' : ''}
                `}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
            >
                <span className={`truncate flex-1 ${selectedLabel ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-muted,#9ca3af)]'}`}>
                    {selectedLabel || placeholder}
                </span>

                <div className="flex items-center gap-1 ml-2 shrink-0">
                    {/* Clear button — only when a value is selected */}
                    {value && !disabled && (
                        <span
                            onClick={handleClear}
                            className="p-0.5 rounded-full hover:bg-[var(--color-bg-hover,#f3f4f6)] text-[var(--color-text-secondary)] hover:text-[var(--color-error)] transition-colors"
                            title="Clear selection"
                        >
                            <X size={14} />
                        </span>
                    )}
                    {/* Chevron icon */}
                    <span className={`transition-transform duration-200 text-[var(--color-text-secondary)] ${isOpen ? 'rotate-180' : ''}`}>
                        <ChevronDown size={16} />
                    </span>
                </div>
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <div
                    className="
                        absolute z-[9999] w-full mt-1
                        bg-[var(--color-bg-secondary)]
                        border border-[var(--color-border-primary)]
                        rounded-xl shadow-xl
                        overflow-hidden
                        animate-fadeIn
                    "
                    style={{ maxHeight: '280px' }}
                >
                    {/* Search Input */}
                    {searchable && (
                        <div className="p-2 border-b border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] rounded-tl-[12px] rounded-tr-[12px]">
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-bg-primary,#f9fafb)] border border-[var(--color-border-primary)]">
                                <Search size={14} className="text-[var(--color-text-secondary)] shrink-0" />
                                <input
                                    ref={searchRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search..."
                                    className="
                                        flex-1 text-sm bg-transparent
                                        text-[var(--color-text-primary)]
                                        placeholder:text-[var(--color-text-secondary)]
                                        focus:outline-none
                                        border-none outline-none ring-0
                                    "
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery('')}
                                        className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                                    >
                                        <X size={12} />
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Options List */}
                    <div
                        ref={listRef}
                        className="overflow-y-auto overflow-x-hidden custom-scrollbar"
                        style={{ maxHeight: searchable ? '210px' : '260px' }}
                        role="listbox"
                    >
                        {/* Empty placeholder option */}
                        {/* {!required && !searchQuery && (
                            <button
                                type="button"
                                onClick={() => handleSelect('')}
                                data-selected={!value}
                                className={`
                                    w-full text-left px-4 py-2.5 text-sm
                                    flex items-center gap-2
                                    transition-colors duration-150
                                    ${!value
                                        ? 'bg-[var(--color-primary-lighter,#ede9fe)] text-[var(--color-primary-dark)]'
                                        : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover,#f3f4f6)]'
                                    }
                                `}
                                role="option"
                                aria-selected={!value}
                            >
                                <span className="flex-1 italic opacity-70">{placeholder}</span>
                                {!value && <Check size={14} className="shrink-0" />}
                            </button>
                        )} */}

                        {/* Filtered Options */}
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt) => {
                                const isSelected = String(opt.value) === String(value);
                                return (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => !opt.disabled && handleSelect(opt.value)}
                                        disabled={opt.disabled}
                                        data-selected={isSelected}
                                        className={`
                                            w-full text-left px-4 py-2.5 text-sm
                                            flex items-center gap-2
                                            transition-colors duration-150
                                            ${opt.disabled ? 'opacity-50 cursor-not-allowed bg-[var(--color-bg-secondary)]' :
                                              isSelected
                                                ? 'bg-[var(--color-primary-lighter,#ede9fe)] text-[var(--color-primary-dark)] font-medium'
                                                : 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover,#f3f4f6)]'
                                            }
                                        `}
                                        role="option"
                                        aria-selected={isSelected}
                                    >
                                        <span className="flex-1 truncate">{opt.label}</span>
                                        {isSelected && (
                                            <Check size={14} className="shrink-0 text-[var(--color-primary-dark)]" />
                                        )}
                                    </button>
                                );
                            })
                        ) : (
                            <div className="px-4 py-6 text-center text-sm text-[var(--color-text-secondary)]">
                                <Search size={20} className="mx-auto mb-2 opacity-40" />
                                <p>No options found</p>
                                {searchQuery && (
                                    <p className="text-xs mt-1 opacity-60">Try a different search term</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && typeof error === 'string' && (
                <div className="text-[var(--color-error)] text-xs mt-1 text-left">
                    {error}
                </div>
            )}
        </div>
    );
};

export default CustomSelect;
