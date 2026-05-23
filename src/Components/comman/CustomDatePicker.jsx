import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';

/**
 * CustomDatePicker - Reusable styled date picker component
 *
 * Props:
 * @param {string}   name         - Field name
 * @param {string|Date} value     - Selected date value (string 'YYYY-MM-DD' or Date object)
 * @param {function} onChange     - Callback: onChange({ target: { name, value: 'YYYY-MM-DD' } })
 * @param {string}   placeholder  - Placeholder text (default: 'DD-MM-YYYY')
 * @param {boolean}  required     - Required field
 * @param {boolean}  disabled     - Disabled state
 * @param {Date}     minDate      - Minimum selectable date
 * @param {Date}     maxDate      - Maximum selectable date
 * @param {boolean}  clearable    - Show clear button
 * @param {boolean}  error        - Show error border state
 * @param {string}   className    - Extra wrapper className
 */
const CustomDatePicker = ({
    name,
    value,
    onChange,
    placeholder = 'DD-MM-YYYY',
    required = false,
    disabled = false,
    minDate,
    maxDate,
    clearable = true,
    error = false,
    className = '',
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [viewDate, setViewDate] = useState(null); // month/year being viewed
    const [mode, setMode] = useState('days'); // 'days' | 'months' | 'years'
    const containerRef = useRef(null);

    const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    // Parse value to Date
    const parseValue = (val) => {
        if (!val) return null;
        if (val instanceof Date && !isNaN(val)) return val;
        const d = new Date(val);
        return isNaN(d.getTime()) ? null : d;
    };

    const selectedDate = parseValue(value);

    // Format date for display  DD-MM-YYYY
    const formatDisplay = (date) => {
        if (!date) return '';
        const d = String(date.getDate()).padStart(2, '0');
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const y = date.getFullYear();
        return `${d}-${m}-${y}`;
    };

    // Format for emit  YYYY-MM-DD
    const formatEmit = (date) => {
        if (!date) return '';
        const d = String(date.getDate()).padStart(2, '0');
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const y = date.getFullYear();
        return `${y}-${m}-${d}`;
    };

    // Open calendar — init viewDate
    const openCalendar = () => {
        if (disabled) return;
        const base = selectedDate || new Date();
        setViewDate(new Date(base.getFullYear(), base.getMonth(), 1));
        setMode('days');
        setIsOpen(true);
    };

    const closeCalendar = () => {
        setIsOpen(false);
        setMode('days');
    };

    // Outside click
    useEffect(() => {
        const handler = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                closeCalendar();
            }
        };
        if (isOpen) document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [isOpen]);

    // Is a date disabled?
    const isDisabled = (date) => {
        if (minDate && date < new Date(minDate.setHours(0, 0, 0, 0))) return true;
        if (maxDate) {
            const max = new Date(maxDate);
            max.setHours(23, 59, 59, 999);
            if (date > max) return true;
        }
        return false;
    };

    const isSelected = (date) => {
        if (!selectedDate) return false;
        return date.getDate() === selectedDate.getDate() &&
            date.getMonth() === selectedDate.getMonth() &&
            date.getFullYear() === selectedDate.getFullYear();
    };

    const isToday = (date) => {
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    };

    // Select a day
    const handleDayClick = (date) => {
        if (isDisabled(date)) return;
        onChange({ target: { name, value: formatEmit(date) } });
        closeCalendar();
    };

    // Clear
    const handleClear = (e) => {
        e.stopPropagation();
        onChange({ target: { name, value: '' } });
    };

    // Navigate prev/next month
    const prevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    const nextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    const prevYear = () => setViewDate(new Date(viewDate.getFullYear() - 1, viewDate.getMonth(), 1));
    const nextYear = () => setViewDate(new Date(viewDate.getFullYear() + 1, viewDate.getMonth(), 1));

    // Build calendar days grid
    const buildDays = () => {
        if (!viewDate) return [];
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrev = new Date(year, month, 0).getDate();

        const cells = [];
        // Prev month trailing days
        for (let i = firstDay - 1; i >= 0; i--) {
            cells.push({ date: new Date(year, month - 1, daysInPrev - i), outside: true });
        }
        // Current month days
        for (let d = 1; d <= daysInMonth; d++) {
            cells.push({ date: new Date(year, month, d), outside: false });
        }
        // Next month leading days
        const remaining = 42 - cells.length;
        for (let d = 1; d <= remaining; d++) {
            cells.push({ date: new Date(year, month + 1, d), outside: true });
        }
        return cells;
    };

    // Year range for year picker (current view ± 10)
    const buildYears = () => {
        if (!viewDate) return [];
        const base = viewDate.getFullYear();
        const start = base - 10;
        const years = [];
        for (let y = start; y <= base + 10; y++) years.push(y);
        return years;
    };

    const selectMonth = (monthIdx) => {
        setViewDate(new Date(viewDate.getFullYear(), monthIdx, 1));
        setMode('days');
    };

    const selectYear = (year) => {
        setViewDate(new Date(year, viewDate.getMonth(), 1));
        setMode('months');
    };

    const days = buildDays();
    const years = buildYears();

    return (
        <div ref={containerRef} className={`relative w-full ${className}`}>
            {/* Trigger Input */}
            <button
                type="button"
                onClick={isOpen ? closeCalendar : openCalendar}
                disabled={disabled}
                className={`
                    w-full flex items-center justify-between
                    px-4 py-3 text-sm text-left
                    bg-[var(--color-bg-secondary)]
                    border rounded-lg
                    transition-all duration-200
                    focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent
                    group
                    ${disabled ? 'opacity-50 cursor-not-allowed border-[var(--color-border-primary)]' : 'cursor-pointer hover:border-[var(--color-primary)] border-[var(--color-border-primary)]'}
                    ${error ? 'border-[var(--color-error)] focus:ring-[var(--color-error)]' : ''}
                    ${isOpen ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)] ring-opacity-30' : ''}
                `}
            >
                {/* Left: Calendar icon + value/placeholder */}
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <Calendar
                        size={16}
                        className={`shrink-0 transition-colors ${selectedDate ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-secondary)]'}`}
                    />
                    <span className={`truncate ${selectedDate ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)] opacity-70'}`}>
                        {selectedDate ? formatDisplay(selectedDate) : placeholder}
                    </span>
                </div>

                {/* Right: Clear + Chevron */}
                <div className="flex items-center gap-1 shrink-0 ml-2">
                    {clearable && selectedDate && !disabled && (
                        <span
                            onClick={handleClear}
                            className="p-0.5 rounded-full hover:bg-[var(--color-bg-hover,#f3f4f6)] text-[var(--color-text-secondary)] hover:text-[var(--color-error)] transition-colors"
                            title="Clear date"
                        >
                            <X size={14} />
                        </span>
                    )}
                    <span className={`transition-transform duration-200 text-[var(--color-text-secondary)] ${isOpen ? 'rotate-180' : ''}`}>
                        <ChevronRight size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-90' : '-rotate-90'}`} />
                    </span>
                </div>
            </button>

            {/* Calendar Dropdown */}
            {isOpen && viewDate && (
                <div className="
                    absolute z-50 mt-1 left-0
                    bg-[var(--color-bg-secondary)]
                    border border-[var(--color-border-primary)]
                    rounded-xl shadow-2xl
                    overflow-hidden
                    animate-fadeIn
                    w-72
                ">
                    {/* ── DAYS VIEW ── */}
                    {mode === 'days' && (
                        <>
                            {/* Header */}
                            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[var(--color-primary-dark)] to-[var(--color-primary-darker)]">
                                <button type="button" onClick={prevMonth}
                                    className="p-1 rounded-lg hover:bg-white/20 transition-colors text-white">
                                    <ChevronLeft size={16} />
                                </button>

                                {/* Clickable month/year → navigate to month/year picker */}
                                <button
                                    type="button"
                                    onClick={() => setMode('months')}
                                    className="text-sm font-semibold text-white hover:text-white/80 transition-colors px-2 py-1 rounded-lg hover:bg-white/10"
                                >
                                    {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
                                </button>

                                <button type="button" onClick={nextMonth}
                                    className="p-1 rounded-lg hover:bg-white/20 transition-colors text-white">
                                    <ChevronRight size={16} />
                                </button>
                            </div>

                            {/* Day names */}
                            <div className="grid grid-cols-7 px-3 pt-3">
                                {DAYS.map(d => (
                                    <div key={d} className="text-center text-xs font-semibold text-[var(--color-text-secondary)] py-1">
                                        {d}
                                    </div>
                                ))}
                            </div>

                            {/* Day cells */}
                            <div className="grid grid-cols-7 px-3 pb-3 gap-0.5">
                                {days.map(({ date, outside }, i) => {
                                    const disabled_ = isDisabled(date);
                                    const selected_ = isSelected(date);
                                    const today_ = isToday(date);
                                    return (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => handleDayClick(date)}
                                            disabled={disabled_}
                                            className={`
                                                w-8 h-8 text-xs rounded-lg mx-auto flex items-center justify-center
                                                font-medium transition-all duration-150
                                                ${outside ? 'text-[var(--color-text-secondary)] opacity-30' : ''}
                                                ${selected_
                                                    ? 'bg-[var(--color-primary-dark)] text-white font-bold shadow-md'
                                                    : today_ && !outside
                                                        ? 'border border-[var(--color-primary)] text-[var(--color-primary-dark)] font-bold'
                                                        : !outside && !disabled_
                                                            ? 'text-[var(--color-text-primary)] hover:bg-[var(--color-primary-lighter,#ede9fe)] hover:text-[var(--color-primary-dark)]'
                                                            : ''
                                                }
                                                ${disabled_ ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
                                            `}
                                        >
                                            {date.getDate()}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Footer — Today shortcut */}
                            <div className="px-3 pb-3 flex justify-center">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const today = new Date();
                                        if (!isDisabled(today)) {
                                            handleDayClick(today);
                                        }
                                    }}
                                    className="text-xs text-[var(--color-primary-dark)] font-semibold hover:underline transition-colors px-3 py-1 rounded-lg hover:bg-[var(--color-primary-lighter,#ede9fe)]"
                                >
                                    Today
                                </button>
                            </div>
                        </>
                    )}

                    {/* ── MONTHS VIEW ── */}
                    {mode === 'months' && (
                        <>
                            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[var(--color-primary-dark)] to-[var(--color-primary-darker)]">
                                <button type="button" onClick={prevYear}
                                    className="p-1 rounded-lg hover:bg-white/20 transition-colors text-white">
                                    <ChevronLeft size={16} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMode('years')}
                                    className="text-sm font-semibold text-white hover:text-white/80 px-2 py-1 rounded-lg hover:bg-white/10 transition-colors"
                                >
                                    {viewDate.getFullYear()}
                                </button>
                                <button type="button" onClick={nextYear}
                                    className="p-1 rounded-lg hover:bg-white/20 transition-colors text-white">
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                            <div className="grid grid-cols-3 gap-2 p-4">
                                {MONTHS.map((m, idx) => {
                                    const isCurrent = selectedDate &&
                                        selectedDate.getMonth() === idx &&
                                        selectedDate.getFullYear() === viewDate.getFullYear();
                                    return (
                                        <button
                                            key={m}
                                            type="button"
                                            onClick={() => selectMonth(idx)}
                                            className={`
                                                py-2 text-xs rounded-lg font-medium transition-all duration-150
                                                ${isCurrent
                                                    ? 'bg-[var(--color-primary-dark)] text-white shadow-md'
                                                    : 'text-[var(--color-text-primary)] hover:bg-[var(--color-primary-lighter,#ede9fe)] hover:text-[var(--color-primary-dark)]'
                                                }
                                            `}
                                        >
                                            {m.slice(0, 3)}
                                        </button>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    {/* ── YEARS VIEW ── */}
                    {mode === 'years' && (
                        <>
                            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[var(--color-primary-dark)] to-[var(--color-primary-darker)]">
                                <button type="button" onClick={() => setViewDate(new Date(viewDate.getFullYear() - 21, viewDate.getMonth(), 1))}
                                    className="p-1 rounded-lg hover:bg-white/20 transition-colors text-white">
                                    <ChevronLeft size={16} />
                                </button>
                                <span className="text-sm font-semibold text-white">
                                    {years[0]} – {years[years.length - 1]}
                                </span>
                                <button type="button" onClick={() => setViewDate(new Date(viewDate.getFullYear() + 21, viewDate.getMonth(), 1))}
                                    className="p-1 rounded-lg hover:bg-white/20 transition-colors text-white">
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                            <div className="grid grid-cols-4 gap-1.5 p-3 max-h-52 overflow-y-auto custom-scrollbar">
                                {years.map((y) => {
                                    const isCurrent = selectedDate && selectedDate.getFullYear() === y;
                                    return (
                                        <button
                                            key={y}
                                            type="button"
                                            onClick={() => selectYear(y)}
                                            className={`
                                                py-1.5 text-xs rounded-lg font-medium transition-all duration-150
                                                ${isCurrent
                                                    ? 'bg-[var(--color-primary-dark)] text-white shadow-md'
                                                    : 'text-[var(--color-text-primary)] hover:bg-[var(--color-primary-lighter,#ede9fe)] hover:text-[var(--color-primary-dark)]'
                                                }
                                            `}
                                        >
                                            {y}
                                        </button>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default CustomDatePicker;
