import React, { useState, useEffect, useRef } from 'react';
import {
    ChevronDown,
    X,
    CheckCircle,
    AlertCircle,
    Clock,
    Activity,
    Coffee,
    Calendar
} from 'lucide-react';

// ✅ Searchable Dropdown Component (Dark Mode Support)
const SearchableDropdown = ({
    options,
    value,
    onChange,
    placeholder,
    disabled,
    displayKey = 'name',
    valueKey = 'id',
    className = ""
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const dropdownRef = useRef(null);

    const filteredOptions = options.filter(option =>
        option[displayKey].toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedOption = options.find(option => option[valueKey] === value);
    const displayText = selectedOption ? selectedOption[displayKey] : '';

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
                setSearchTerm('');
                setHighlightedIndex(-1);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (option) => {
        onChange(option[valueKey]);
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
    };

    const handleClear = () => {
        onChange('');
        setSearchTerm('');
        setIsOpen(false);
        setHighlightedIndex(-1);
    };

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <div
                className={`w-full px-3 py-2 bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-lg focus-within:ring-2 focus-within:ring-[var(--color-ring)] focus-within:border-transparent text-[var(--color-text-primary)] cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => !disabled && setIsOpen(true)}
            >
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        {isOpen ? (
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-transparent outline-none text-[var(--color-text-primary)]"
                                placeholder={placeholder}
                                autoFocus
                            />
                        ) : (
                            <span className={displayText ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]'}>
                                {displayText || placeholder}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                        {value && !disabled && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleClear();
                                }}
                                className="p-1 hover:bg-[var(--color-bg-hover)] rounded"
                            >
                                <X className="h-4 w-4 text-[var(--color-text-secondary)]" />
                            </button>
                        )}
                        <ChevronDown className={`h-4 w-4 text-[var(--color-text-secondary)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </div>
                </div>
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredOptions.length === 0 ? (
                        <div className="px-3 py-2 text-[var(--color-text-secondary)] text-sm">
                            No options found
                        </div>
                    ) : (
                        filteredOptions.map((option, index) => (
                            <div
                                key={option[valueKey]}
                                className={`px-3 py-2 cursor-pointer text-sm transition-colors ${index === highlightedIndex
                                        ? 'bg-[var(--color-bg-highlight)] text-[var(--color-text-accent)]'
                                        : 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'
                                    }`}
                                onClick={() => handleSelect(option)}
                            >
                                {option[displayKey]}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

// ✅ StatusBadge (Dark Mode Aware)
const StatusBadge = ({ status }) => {
    const statusLower = status?.toLowerCase() || '';

    const getStatusStyle = () => {
        switch (statusLower) {
            case 'present':
                return 'bg-[var(--color-cell-p-bg)] text-[var(--color-cell-p-text)] border-2 border-[var(--color-cell-p-border)]';
            case 'absent':
                return 'bg-[var(--color-cell-a-bg)] text-[var(--color-cell-a-text)] border-2 border-[var(--color-cell-a-border)]';
            case 'weekoff':
            case 'week-off':
            case 'week off':
                return 'bg-purple-100 text-purple-600 border-purple-300 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-500';
            case 'holiday':
                return 'bg-orange-100 text-orange-600 border-orange-300 dark:bg-orange-900 dark:text-orange-200 dark:border-orange-500';
            case 'incomplete':
                return 'bg-[var(--color-cell-halfp-bg)] text-[var(--color-cell-halfp-text)] border-2 border-[var(--color-cell-halfp-border)]';
            case 'half day':
            case 'half-day':
                return 'bg-[var(--color-cell-h-bg)] text-[var(--color-cell-h-text)] border-2 border-[var(--color-cell-h-border)]';
            default:
                return 'bg-[var(--color-bg-neutral)] text-[var(--color-text-primary)] border-[var(--color-border)]';
        }
    };

    const getStatusIcon = () => {
        switch (statusLower) {
            case 'present': return <CheckCircle className="h-3 w-3" />;
            case 'absent': return <AlertCircle className="h-3 w-3" />;
            case 'weekoff':
            case 'week-off':
            case 'week off': return <Coffee className="h-3 w-3" />;
            case 'holiday': return <Calendar className="h-3 w-3" />;
            case 'leave': return <Clock className="h-3 w-3" />;
            case 'half day':
            case 'half-day': return <Activity className="h-3 w-3" />;
            default: return null;
        }
    };

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusStyle()}`}>
            {getStatusIcon()}
            {status || '--'}
        </span>
    );
};

// ✅ Summary Card Component (Dark Mode Aware)
const SummaryCard = ({ title, value, icon: Icon, color, percentage }) => (
    <div className="bg-[var(--color-bg-surface)] rounded-lg p-8 shadow-sm border border-[var(--color-border)]">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-[var(--color-text-secondary)]">{title}</p>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                {percentage && (
                    <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                        {percentage}% of total days
                    </p>
                )}
            </div>
            {Icon && (
                <div className={`p-3 rounded-full bg-[var(--color-bg-highlight)]`}>
                    <Icon className={`h-6 w-6 ${color}`} />
                </div>
            )}
        </div>
    </div>
);

export { SearchableDropdown, StatusBadge, SummaryCard };
