// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import Cookies from "js-cookie";
import CryptoJS from "crypto-js";

const AuthContext = createContext();

const USER_KEY = "auth_user";
const COOKIE_EXPIRY_DAYS = 7;
const SECRET_KEY = import.meta.env.VITE_AES_SECRET_KEY;

// AES helpers
const encrypt = (data) => {
    const jsonString = JSON.stringify(data);
    return CryptoJS.AES.encrypt(jsonString, SECRET_KEY).toString();
};
const decrypt = (ciphertext) => {
    try {
        const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
        const decrypted = bytes.toString(CryptoJS.enc.Utf8);
        return JSON.parse(decrypted);
    } catch {
        return null;
    }
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // 1️⃣ Try cookies first
        const savedCookie = Cookies.get(USER_KEY);
        if (savedCookie) {
            const decryptedUser = decrypt(savedCookie);
            if (decryptedUser) setUser(decryptedUser);
        } else {
            // 2️⃣ Otherwise check sessionStorage
            const savedSession = sessionStorage.getItem(USER_KEY);
            if (savedSession) {
                const decryptedUser = decrypt(savedSession);
                if (decryptedUser) setUser(decryptedUser);
            }
        }
        setIsLoading(false);
    }, []);

    const login = (userData, remember = false) => {
        if (!userData) return false;
        const userWithSession = {
            ...userData,
            loginTime: Date.now(),
        };
        setUser(userWithSession);

        const encrypted = encrypt(userWithSession);

        if (remember) {
            // Persistent cookie (7 days)
            Cookies.set(USER_KEY, encrypted, { expires: COOKIE_EXPIRY_DAYS });
            sessionStorage.removeItem(USER_KEY);
        } else {
            // Session only (clears on tab close)
            sessionStorage.setItem(USER_KEY, encrypted);
            Cookies.remove(USER_KEY);
        }

        return true;
    };

    const logout = () => {
        setUser(null);
        Cookies.remove(USER_KEY);
        sessionStorage.removeItem(USER_KEY);
        localStorage.clear();
        window.location.href = "/";
    };

    const updateUser = (updates) => {
        if (!user) return false;
        const updatedUser = { ...user, ...updates, lastUpdated: Date.now() };
        setUser(updatedUser);
        const encrypted = encrypt(updatedUser);

        if (Cookies.get(USER_KEY)) {
            Cookies.set(USER_KEY, encrypted, { expires: COOKIE_EXPIRY_DAYS });
        } else {
            sessionStorage.setItem(USER_KEY, encrypted);
        }

        return true;
    };

    const isAuthenticated = () => !!user;

    return (
        <AuthContext.Provider
            value={{ user, login, logout, updateUser, isLoading, isAuthenticated }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within an AuthProvider");
    return context;
};
