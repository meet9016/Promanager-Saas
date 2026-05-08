import { createContext, useState, useEffect } from 'react';

export const ThemeContext = createContext();

const getInitialTheme = () => {
    const savedTheme = localStorage.getItem('theme');
    if (!savedTheme || savedTheme === 'blue') {
        return 'light';
    }
    return savedTheme;
};

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(getInitialTheme);

    // Base variables shared across both themes (status colors, etc.)
    const baseVariables = {
        '--color-primary': '#6C4CF1',
        '--color-primary-dark': '#4B2EDB',
        '--color-primary-light': '#8B6FF5',
        '--color-primary-lighter': '#B8A3F9',
        '--color-primary-lightest': '#E8E1FE',
        '--color-primary-darker': '#3d24b8',
        '--color-primary-darkest': '#2a1a8f',
        '--color-primary-alpha-10': 'rgba(108, 76, 241, 0.1)',
        '--color-primary-alpha-20': 'rgba(108, 76, 241, 0.2)',
        '--color-primary-alpha-30': 'rgba(108, 76, 241, 0.3)',
        '--color-text-white': '#ffffff',
        '--color-text-white-90': '#e6e6e6',
        '--color-success': '#10b981',
        '--color-success-medium': '#059669',
        '--color-success-dark': '#047857',
        '--color-warning': '#f59e0b',
        '--color-warning-dark': '#d97706',
        '--color-error': '#ef4444',
        '--color-error-dark': '#dc2626',
        '--color-border-error': '#ef4444',
        '--color-yellow-light': '#fde68a',
        '--color-yellow': '#facc15',
        '--color-yellow-dark': '#eab308',
    };

    const themes = {
        light: {
            name: 'Light Mode',
            colors: {
                // Backgrounds
                '--color-bg-primary': '#ffffff',
                '--color-bg-secondary': '#ffffff',
                '--color-bg-gradient-start': '#fefeff',
                '--color-bg-gradient-end': '#fcfbff',
                '--color-bg-hover': '#f5f3ff',
                '--color-bg-sidebar': '#f8f6ff',
                '--color-bg-sidebar-to': '#f6f4ff',
                '--color-bg-gray-light': '#e5e7eb',
                '--color-bg-card': '#ffffff',
                '--color-bg-secondary-20': 'rgba(255, 255, 255, 0.2)',
                '--color-bg-secondary-30': 'rgba(255, 255, 255, 0.3)',
                // Borders
                '--color-border-primary': '#e8e4fd',
                '--color-border-secondary': '#ede9fe',
                '--color-border-focus': '#6C4CF1',
                '--color-border-divider': '#e5e7eb',
                // Primary scale
                '--color-primary': '#6C4CF1',
                '--color-primary-dark': '#5b3dd9',
                '--color-primary-light': '#a78bfa',
                '--color-primary-lighter': '#ede9fe',
                '--color-primary-lightest': '#f5f3ff',
                '--color-icon-primary-bg': '#ede9fe',
                // Text
                '--color-text-primary': '#1f2937',
                '--color-text-secondary': '#4b5563',
                '--color-text-muted': '#9ca3af',
                '--color-text-error': '#dc2626',
                '--color-text-success': '#047857',
                // Status backgrounds (light)
                '--color-success-light': '#d1fae5',
                '--color-success-lighter': '#a7f3d0',
                '--color-error-light': '#fee2e2',
                '--color-error-lighter': '#fecaca',
                '--color-warning-light': '#fef3c7',
                '--color-warning-lighter': '#fde68a',
                // Shadows
                '--color-shadow-light': 'rgba(0, 0, 0, 0.05)',
                '--color-shadow-medium': 'rgba(0, 0, 0, 0.1)',
                '--color-shadow-dark': 'rgba(0, 0, 0, 0.15)',
                // Scrollbar
                '--color-scrollbar-track': '#baa9ff',
                '--color-scrollbar-thumb': 'linear-gradient(45deg, #6C4CF1, #4B2EDB)',
                '--color-scrollbar-thumb-hover': 'linear-gradient(45deg, #5b3dd9, #3d24b8)',

                /* ================= ATTENDANCE STATUS COLORS ================= */

                /* PRESENT */
                '--color-code-p-bg': '#dcfce7',
                '--color-code-p-text': '#166534',
                '--color-code-p-border': '#86efac',
                '--color-cell-p-bg': '#f0fdf4',
                '--color-cell-p-text': '#14532d',
                '--color-cell-p-border': '#22c55e',

                /* ABSENT */
                '--color-code-a-bg': '#fee2e2',
                '--color-a-text': '#991b1b',
                '--color-code-a-border': '#fca5a5',
                '--color-cell-a-bg': '#fef2f2',
                '--color-cell-a-text': '#7f1d1d',
                '--color-cell-a-border': '#ef4444',

                /* LATE */
                '--color-code-l-bg': '#fef3c7',
                '--color-code-l-text': '#92400e',
                '--color-code-l-border': '#fde68a',
                '--color-cell-l-bg': '#fffbeb',
                '--color-cell-l-text': '#78350f',
                '--color-cell-l-border': '#f59e0b',

                /* HALF DAY */
                '--color-code-halfp-bg': '#e0f2fe',
                '--color-code-halfp-text': '#075985',
                '--color-code-halfp-border': '#7dd3fc',
                '--color-cell-halfp-bg': '#f0f9ff',
                '--color-cell-halfp-text': '#0c4a6e',
                '--color-cell-halfp-border': '#38bdf8',




                /* HOLIDAY */
                '--color-code-h-bg': '#cffafe',
                '--color-code-h-text': '#155e75',
                '--color-code-h-border': '#67e8f9',
                '--color-cell-h-bg': '#ecfeff',
                '--color-cell-h-text': '#164e63',
                '--color-cell-h-border': '#06b6d4',
            }
        },
        dark: {
            name: 'Dark Mode',
            colors: {
                // Backgrounds
                '--color-bg-primary': '#18181b',
                '--color-bg-secondary': '#23232a',
                '--color-bg-gradient-start': '#23232a',
                '--color-bg-gradient-end': '#18181b',
                '--color-bg-hover': '#2d2d35',
                '--color-bg-sidebar': '#18181b',
                '--color-bg-sidebar-to': '#23232a',
                '--color-bg-gray-light': '#2d2d35',
                '--color-bg-card': '#23232a',
                '--color-bg-secondary-20': 'rgba(35, 35, 42, 0.8)',
                '--color-bg-secondary-30': 'rgba(35, 35, 42, 0.9)',
                // Borders
                '--color-border-primary': '#2d2d35',
                '--color-border-secondary': '#3f3f46',
                '--color-border-focus': '#8B6FF5',
                '--color-border-divider': '#3f3f46',
                // Primary scale (lighter in dark so it's visible on dark bg)
                '--color-primary': '#8B6FF5',
                '--color-primary-dark': '#6C4CF1',
                '--color-primary-light': '#a78bfa',
                '--color-primary-lighter': '#312c5e',
                '--color-primary-lightest': '#1e1b3a',
                '--color-primary-darker': '#5b3dd9',
                '--color-primary-darkest': '#4B2EDB',
                '--color-icon-primary-bg': '#27273a',
                // Text — ensure full contrast against dark backgrounds
                '--color-text-primary': '#f4f4f5',
                '--color-text-secondary': '#a1a1aa',
                '--color-text-muted': '#71717a',
                '--color-text-error': '#f87171',
                '--color-text-success': '#34d399',
                // Status backgrounds (dark-adapted)
                '--color-success-light': '#064e3b',
                '--color-success-lighter': '#065f46',
                '--color-error-light': '#450a0a',
                '--color-error-lighter': '#7f1d1d',
                '--color-warning-light': '#451a03',
                '--color-warning-lighter': '#78350f',
                // Shadows (more pronounced in dark)
                '--color-shadow-light': 'rgba(0, 0, 0, 0.2)',
                '--color-shadow-medium': 'rgba(0, 0, 0, 0.35)',
                '--color-shadow-dark': 'rgba(0, 0, 0, 0.5)',
                // Scrollbar
                '--color-scrollbar-track': '#23232a',
                '--color-scrollbar-thumb': 'linear-gradient(45deg, #6C4CF1, #4B2EDB)',
                '--color-scrollbar-thumb-hover': 'linear-gradient(45deg, #8B6FF5, #6C4CF1)',
            }
        },
    };

    const changeTheme = (newTheme) => {
        // Fallback for previous cached values and safety check
        if (newTheme === 'blue' || !themes[newTheme]) {
            newTheme = 'light';
        }

        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        const root = document.documentElement;
        const themeColors = themes[newTheme].colors;

        // Apply all base variables first
        Object.entries(baseVariables).forEach(([property, value]) => {
            root.style.setProperty(property, value);
        });

        // Then override with selected theme
        Object.entries(themeColors).forEach(([property, value]) => {
            root.style.setProperty(property, value);
        });

        // Add or remove dark-theme class on body
        if (newTheme === 'dark') {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
    };

    useEffect(() => {
        changeTheme(theme);
        // eslint-disable-next-line
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, themes, changeTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
