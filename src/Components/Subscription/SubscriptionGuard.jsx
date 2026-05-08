// Components/SubscriptionGuard.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import SubscriptionExpiredPage from './SubscriptionExpiredPage';
import SubscriptionWarningModal from './SubscriptionWarningModal';

const SubscriptionGuard = ({ children }) => {
    const { user, isAuthenticated } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [showWarningModal, setShowWarningModal] = useState(false);
    const [isOpen, setIsOpen] = useState(false);


    useEffect(() => {
        // Simply set loading to false after checking user
        setIsLoading(false);

        // Check if we need to show warning modal
        if (user && isAuthenticated()) {
            const subscriptionStatus = parseInt(user?.subscriptions_status || 0);
            const subscriptionDays = parseInt(user?.subscriptions_days || 0);

            // Show warning if subscription is active (status 1) but expiring in 15 days or less
            if (subscriptionStatus === 1 && subscriptionDays <= 15 && subscriptionDays > 0) {
                // Check if warning was already shown for this login session
                const warningShownKey = `subscription_warning_shown_${user.user_id}`;
                const warningShown = sessionStorage.getItem(warningShownKey);

                // Only show if not already shown in this session
                if (!warningShown) {
                    setShowWarningModal(true);
                    // Mark as shown for this session
                    sessionStorage.setItem(warningShownKey, 'true');
                }
            }
        }
    }, [user, isAuthenticated]);

    // Loading state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[var(--color-bg-primary)]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)] mx-auto mb-4"></div>
                    <p className="text-[var(--color-text-secondary)]">Loading...</p>
                </div>
            </div>
        );
    }

    // Not authenticated - show login or children
    if (!isAuthenticated()) {
        return children;
    }

    // Get subscription status from user data
    const subscriptionStatus = parseInt(user?.subscriptions_status || 0);

    // Subscription expired (status 2)
    if (subscriptionStatus === 2) {
        return <SubscriptionExpiredPage />;
    }

    // Subscription active (status 1) or any other status - show app with potential warning
    return (
        <>
            {children}
            {showWarningModal && (
                <SubscriptionWarningModal
                    isOpen={showWarningModal}
                    onClose={() => setShowWarningModal(false)}
                    daysLeft={parseInt(user?.subscriptions_days || 0)}
                />
            )}
        </>
    );
};

export default SubscriptionGuard;