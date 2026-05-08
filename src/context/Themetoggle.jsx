import React, { useState, useRef, useEffect, useContext } from 'react';
import { Moon, Sun, Palette } from 'lucide-react'; // <-- Make sure these are the icons you're using
import { ThemeContext } from './Themecontext'; // <-- Adjust this import path as needed

const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

export const ThemeToggle = () => {
    const { theme = 'default', themes, changeTheme } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const getThemeIcon = (themeName) => {
        switch (themeName) {
            case 'dark':
                return <Moon size={16} />;
            case 'light':
                return <Sun size={16} />;
            default:
                return <Palette size={16} />;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] rounded-full transition-colors"
                title="Change Theme"
            >
                {getThemeIcon(theme)}
            </button>

            {isOpen && (
                <div className="absolute right-0 top-12 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-lg shadow-lg w-48 overflow-hidden z-50">
                    <div className="px-3 py-2 bg-[var(--color-bg-primary)] border-b border-[var(--color-border-primary)]">
                        <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">Choose Theme</h4>
                    </div>
                    <div className="py-1">
                        {Object.entries(themes).map(([key, themeData]) => (
                            <button
                                key={key}
                                onClick={() => {
                                    changeTheme(key);
                                    setIsOpen(false);
                                }}
                                className={`w-full px-3 py-2 text-left text-sm hover:bg-[var(--color-bg-hover)] flex items-center justify-between transition-colors ${
                                    theme === key
                                        ? 'bg-[var(--color-bg-hover)] text-[var(--color-text-primary)]'
                                        : 'text-[var(--color-text-secondary)]'
                                }`}
                            >
                                <div className="flex items-center space-x-2">
                                    {getThemeIcon(key)}
                                    <span>{themeData.name}</span>
                                </div>
                                {theme === key && (
                                    <div className="w-2 h-2 bg-[var(--color-primary)] rounded-full"></div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
