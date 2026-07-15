/**
 * SoftwareConfigContext.jsx
 *
 * Fetches `software_config` on app boot.
 * Applies `theme_color` dynamically as CSS primary-color variables
 * so the entire app re-themes without a page reload.
 */
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../api/axiosInstance';

/* ─────────────────────────────────────────────
   Utility: hex → { r, g, b }
───────────────────────────────────────────── */
function hexToRgb(hex) {
    const clean = hex.replace('#', '');
    const full = clean.length === 3
        ? clean.split('').map(c => c + c).join('')
        : clean;
    const num = parseInt(full, 16);
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

/* Clamp 0-255 */
const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));

/* Lighten/darken a hex color by a ratio (positive = lighter, negative = darker) */
function shiftColor({ r, g, b }, ratio) {
    if (ratio > 0) {
        // Mix with white
        return {
            r: clamp(r + (255 - r) * ratio),
            g: clamp(g + (255 - g) * ratio),
            b: clamp(b + (255 - b) * ratio),
        };
    }
    // Mix with black
    return {
        r: clamp(r * (1 + ratio)),
        g: clamp(g * (1 + ratio)),
        b: clamp(b * (1 + ratio)),
    };
}

function rgbToHex({ r, g, b }) {
    return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

function rgbToStr({ r, g, b }, alpha) {
    return alpha !== undefined
        ? `rgba(${r}, ${g}, ${b}, ${alpha})`
        : `rgb(${r}, ${g}, ${b})`;
}

/**
 * Build the full primary color scale from a single hex color.
 * Mirrors the variable names used in ThemeContext.jsx
 */
function buildPrimaryScale(hex) {
    const base = hexToRgb(hex);
    return {
        '--color-primary':            hex,
        '--color-primary-dark':       rgbToHex(shiftColor(base, -0.15)),
        '--color-primary-darker':     rgbToHex(shiftColor(base, -0.28)),
        '--color-primary-darkest':    rgbToHex(shiftColor(base, -0.42)),
        '--color-primary-light':      rgbToHex(shiftColor(base,  0.25)),
        '--color-primary-lighter':    rgbToHex(shiftColor(base,  0.55)),
        '--color-primary-lightest':   rgbToHex(shiftColor(base,  0.80)),
        '--color-primary-alpha-10':   rgbToStr(base, 0.10),
        '--color-primary-alpha-20':   rgbToStr(base, 0.20),
        '--color-primary-alpha-30':   rgbToStr(base, 0.30),
        // Border / icon helpers
        '--color-border-primary':     rgbToHex(shiftColor(base,  0.70)),
        '--color-border-secondary':   rgbToHex(shiftColor(base,  0.75)),
        '--color-border-focus':       hex,
        '--color-icon-primary-bg':    rgbToHex(shiftColor(base,  0.80)),
        '--color-bg-hover':           rgbToHex(shiftColor(base,  0.85)),
        '--color-bg-sidebar':         rgbToHex(shiftColor(base,  0.90)),
        '--color-bg-sidebar-to':      rgbToHex(shiftColor(base,  0.88)),
        // Scrollbar
        '--color-scrollbar-track':    rgbToHex(shiftColor(base,  0.55)),
        '--color-scrollbar-thumb':    `linear-gradient(45deg, ${hex}, ${rgbToHex(shiftColor(base, -0.15))})`,
        '--color-scrollbar-thumb-hover': `linear-gradient(45deg, ${rgbToHex(shiftColor(base, -0.08))}, ${rgbToHex(shiftColor(base, -0.28))})`,
    };
}

/* Apply a map of CSS vars to :root */
function applyVars(vars) {
    const root = document.documentElement;
    Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
}

/* ─────────────────────────────────────────────
   Context
───────────────────────────────────────────── */
const SoftwareConfigContext = createContext(null);

export const SoftwareConfigProvider = ({ children }) => {
    const [config, setConfig] = useState({
        logo: '',
        faviconIcon: '',
        mainImageLoginPage: '',
        mobileNumber: '',
        whatsappNumber: '',
        email: '',
        themeColor: '',
        themeColorSecond: '',
        bankDetails: null,
        address: '',
        appstoreLink: '',
        playstoreLink: '',
        gstNumber: '',
        mobile_number: '',
    });console.log("config****",config);
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const applyThemeColor = useCallback((hex) => {
        if (!hex || !/^#[0-9a-fA-F]{3,6}$/.test(hex.trim())) return;
        const scale = buildPrimaryScale(hex.trim());
        applyVars(scale);
    }, []);

    const fetchConfig = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.post('software_config');
            if (res.data?.success && res.data?.data) {
                const d = res.data.data;
                const parsed = {
                    logo:                 d.logo                  || '',
                    faviconIcon:          d.favicon_icon           || '',
                    mainImageLoginPage:   d.main_image_login_page  || '',
                    mobileNumber:         d.mobile_number          || '',
                    whatsappNumber:       d.whatsapp_number        || '',
                    email:                d.email                  || '',
                    themeColor:           (d.theme_color           || '').trim(),
                    themeColorSecond:     (d['theme_color_second '] || d.theme_color_second || '').trim(),
                    bankDetails:          d.bank_detais || d.bank_details || d.bankDetails || d.bank_detail || d.bankdetails || null,
                    address:              d.address || '',
                    appstoreLink:         d.appstore_link || '',
                    playstoreLink:        d.playstore_link || '',
                    gstNumber:            d.gst_number || '',
                    mobile_number:         d.mobile_number || '',
                };

                setConfig(parsed);

                // ── Apply theme color to CSS variables ──
                if (parsed.themeColor) {
                    applyThemeColor(parsed.themeColor);
                    // Persist so ThemeContext refresh also picks it up
                    localStorage.setItem('app_theme_color', parsed.themeColor);
                }

                // ── Apply favicon dynamically ──
                if (parsed.faviconIcon) {
                    let link = document.querySelector("link[rel~='icon']");
                    if (!link) {
                        link = document.createElement('link');
                        link.rel = 'icon';
                        document.head.appendChild(link);
                    }
                    link.href = parsed.faviconIcon;
                }
            }
        } catch (e) {
            console.error('[SoftwareConfig] fetch error:', e);
            setError(e.message || 'Failed to load software config');

            // Fallback: re-apply persisted color if available
            const saved = localStorage.getItem('app_theme_color');
            if (saved) applyThemeColor(saved);
        } finally {
            setLoading(false);
        }
    }, [applyThemeColor]);

    useEffect(() => {
        // Apply any persisted color immediately (avoids flash of default color)
        const saved = localStorage.getItem('app_theme_color');
        if (saved) applyThemeColor(saved);

        fetchConfig();
    }, [fetchConfig]);

    return (
        <SoftwareConfigContext.Provider value={{ config, loading, error, refetch: fetchConfig, applyThemeColor }}>
            {children}
        </SoftwareConfigContext.Provider>
    );
};

export const useSoftwareConfig = () => {
    const ctx = useContext(SoftwareConfigContext);
    if (!ctx) throw new Error('useSoftwareConfig must be used within SoftwareConfigProvider');
    return ctx;
};
