// src/components/ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import API from '../api/axiosInstance';
import SubscriptionWarningModal from './Subscription/SubscriptionWarningModal';
import Cookies from "js-cookie";

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, user, isLoading } = useAuth();
    const location = useLocation();
    const [subscription, setSubscription] = useState(null);
    const [subLoading, setSubLoading] = useState(true); // ← add
    const [showWarningModal, setShowWarningModal] = useState(true);

    useEffect(() => {
        if (user?.user_id) {
            const lastShownStr = localStorage.getItem(`subscription_warning_shown_${user.user_id}`);
            if (lastShownStr) {
                const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
                if (Date.now() - parseInt(lastShownStr, 10) < TWENTY_FOUR_HOURS) {
                    setShowWarningModal(false);
                }
            }
        }
    }, [user?.user_id]);

    const handleCloseWarning = () => {
        setShowWarningModal(false);
        if (user?.user_id) {
            localStorage.setItem(`subscription_warning_shown_${user.user_id}`, Date.now().toString());
        }
    };

    useEffect(() => {
        if (!user?.user_id) {
            setSubLoading(false);
            return;
        }

        // ProtectedRoute.jsx — inside the subscription useEffect, replace cache check logic

        const CACHE_KEY = `subscription_cache_${user.user_id}`;
        const now = Date.now();
        const today = new Date().toDateString(); // e.g. "Fri Apr 03 2026"

        const cachedStr = localStorage.getItem(CACHE_KEY);
        if (cachedStr) {
            try {
                const cached = JSON.parse(cachedStr);
                if (cached.date === today && cached.data) {
                    setSubscription(cached.data);
                    setSubLoading(false);
                    return;
                }
            } catch (e) { }
        }

        const CheckSubscription = async () => {
            try {
                const formData = new FormData();
                formData.append('user_id', user.user_id);
                const response = await API.post('/subscription_popup_status', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                if (response.data.success) {
                    setSubscription(response.data.data);
                    // replace the localStorage.setItem inside CheckSubscription
                    localStorage.setItem(CACHE_KEY, JSON.stringify({
                        date: new Date().toDateString(),
                        data: response.data.data
                    }));
                }
            } catch (error) {
                // handle error
            } finally {
                setSubLoading(false);
            }
        };
        CheckSubscription();
    }, [user?.user_id]);


    // 1. Auth check FIRST
    if (isLoading) return <div>Loading...</div>;
    if (!isAuthenticated()) return <Navigate to="/" replace />;

    // 2. Subscription loading AFTER auth
    if (subLoading) return <div>Loading...</div>;

    // 3. Prevent redirect loop
    if (subscription?.popup_type === 3) {
        // Cookies.remove("auth_user");
        // sessionStorage.removeItem("auth_user");
        if (location.pathname !== "/expired") {
            return <Navigate to="/expired" replace />;
        }

    }

    // 4. Warning modal
    if (subscription?.popup_type === 2) {
        return (
            <>
                <SubscriptionWarningModal
                    isOpen={showWarningModal}
                    onClose={handleCloseWarning}
                    daysLeft={parseInt(subscription?.days_left || 0)}
                />
                {!showWarningModal && children}
            </>
        );
    }

    // 5. Default
    return children;
};

export default ProtectedRoute;
