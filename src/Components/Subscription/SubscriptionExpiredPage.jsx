// Components/SubscriptionExpiredPage.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CreditCard, RefreshCw, LogOut, Crown, AlertCircle, CheckCircle, XCircle, Mail, Phone, Clock } from 'lucide-react';
import { Toast } from '../ui/Toast'; // Adjust path as needed
import API from '../../api/axiosInstance';
import Cookies from "js-cookie";

import { Navigate, useNavigate } from "react-router-dom";

const SubscriptionExpiredPage = () => {
    const { logout, user } = useAuth();
    const [toast, setToast] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handleContextMenu = (e) => {
            e.preventDefault();
            setToast({
                message: 'Right-click is disabled on this page',
                type: 'warning'
            });
        };

        const handleKeyDown = (e) => {

            if (
                e.key === 'F12' ||
                (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
                (e.ctrlKey && e.key === 'U') ||
                (e.ctrlKey && e.shiftKey && e.key === 'K') ||
                (e.metaKey && e.altKey && e.key === 'I')) {
                e.preventDefault();
                setToast({
                    message: 'Developer tools are disabled',
                    type: 'error'
                });
            }
        };

        const handleSelectStart = (e) => {
            e.preventDefault();
        };

        const handleDragStart = (e) => {
            e.preventDefault();
        };

        // Add event listeners
        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('selectstart', handleSelectStart);
        document.addEventListener('dragstart', handleDragStart);

        const originalConsole = console.log;

        const detectDevTools = () => {
            const threshold = 160;
            setInterval(() => {
                if (
                    window.outerHeight - window.innerHeight > threshold ||
                    window.outerWidth - window.innerWidth > threshold
                ) {
                    setToast({
                        message: 'Developer tools detected. Please close them.',
                        type: 'error'
                    });
                }
            }, 500);
        };

        detectDevTools();

        return () => {
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('selectstart', handleSelectStart);
            document.removeEventListener('dragstart', handleDragStart);
            console.log = originalConsole;
        };
    }, []);



    const handleRefresh = async () => {


        try {
            const formData = new FormData();
            formData.append('user_id', user.user_id);
            const response = await API.post('/subscription_popup_status', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (response.data.success) {
                

                if(response.data.data.popup_type === 1 ){
                     navigate('/dashboard')};

                localStorage.removeItem(`subscription_cache_${user.user_id}`);

                localStorage.setItem(`subscription_cache_${user.user_id}`, JSON.stringify({
                    timestamp: now,
                    data: response.data.data
                }));
            }
        } catch (error) {
            // handle error
        } finally {

        }


    };

    const handleRecharge = () => {
        try {
            // Redirect to payment/pricing page
            window.location.href = '/renew';
        } catch (error) {
            setToast({
                message: 'Failed to redirect to pricing page',
                type: error
            });
        }
    };

    const handleLogout = () => {
        try {
            logout();
        } catch (error) {
            setToast({
                message: 'Failed to logout',
                type: error
            });
        }
    };


    const features = [
        { name: 'Employee Management', icon: CheckCircle, active: false },
        { name: 'Payroll Processing', icon: CheckCircle, active: false },
        { name: 'Reports & Analytics', icon: CheckCircle, active: false },
        { name: 'Leave Management', icon: CheckCircle, active: false },
        { name: 'Shift Management', icon: CheckCircle, active: false },
        { name: 'Time Tracking', icon: CheckCircle, active: false },
    ];

    return (
        <div
            className="subscription-security h-full min-h-screen overflow-auto bg-gradient-to-br from-[var(--color-bg-gradient-start)] via-[var(--color-bg-gradient-end)] to-[var(--color-bg-primary)] flex items-center justify-center p-6"
            style={{ userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none', WebkitTouchCallout: 'none' }}
        >
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <div className="w-full max-w-5xl flex flex-col lg:flex-row items-center gap-10">

                {/* Left Side */}
                <div className="flex-1 flex flex-col items-start">
                    <div className="w-14 h-14 bg-gradient-to-br from-[var(--color-error)] to-[var(--color-error-dark)] rounded-full flex items-center justify-center shadow-xl animate-pulse mb-5">
                        <Crown className="w-7 h-7 text-[var(--color-text-white)]" />
                    </div>
                    <h1 className="text-3xl xl:text-4xl font-bold text-[var(--color-text-primary)] mb-3 animate-pulse leading-tight">
                        Subscription<br />Expired
                    </h1>
                    <p className="text-sm xl:text-base text-[var(--color-text-secondary)] leading-relaxed max-w-sm">
                        Your premium features are temporarily unavailable. Renew now to continue accessing all our powerful tools.


                    </p>
                    <p className="animate-pulse leading-tigh text-md font-semibold xl:text-base text-[var(--color-text-error)] leading-relaxed max-w-sm mt-2">
                        Important: Your data will be deleted 15 days after the expiry date.
                    </p>

                </div>

                {/* Right Side - Card */}
                <div className="flex-1 w-full">
                    <div className="bg-[var(--color-bg-card)] rounded-2xl p-5 shadow-custom-hover border border-[var(--color-border-primary)] space-y-4">

                        {/* User Info */}
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] rounded-full flex items-center justify-center shrink-0">
                                <span className="text-[var(--color-text-white)] font-bold text-sm">
                                    {user?.full_name?.charAt(0) || 'U'}
                                </span>
                            </div>
                            <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
                                Welcome back, {user?.full_name}
                            </h3>
                        </div>

                        {/* What You're Missing */}
                        <div>
                            <h3 className="text-sm font-bold text-[var(--color-text-primary)] mb-2">Data in danger</h3>
                            <div className="grid grid-cols-2 gap-2">
                                {features.map((feature, index) => (
                                    <div key={index} className="flex items-center space-x-2 p-2 bg-[var(--color-bg-hover)] rounded-lg">
                                        <XCircle className="w-4 h-4 text-[var(--color-error)] shrink-0" />
                                        <span className="text-[var(--color-text-primary)] text-xs font-medium truncate">{feature.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <hr className="border-[var(--color-border-primary)]" />

                        {/* Ready to Continue */}
                        <div className="text-center">
                            <h3 className="text-base font-bold text-[var(--color-text-primary)] mb-1">Ready to Continue?</h3>
                            <p className="text-[var(--color-text-secondary)] text-xs mb-4">
                                Renew your subscription to regain access to all premium features.
                            </p>
                            <div className="flex flex-col gap-2">
                                <button onClick={handleRecharge}
                                    className="w-full bg-[var(--color-primary)] text-[var(--color-text-white)] py-2.5 px-4 rounded-xl text-sm font-semibold hover:bg-[var(--color-primary-darker)] transition-custom flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-custom">
                                    <CreditCard className="w-4 h-4" /><span>Renew Now</span>
                                </button>
                                <button onClick={handleRefresh}
                                    className="w-full bg-[var(--color-text-secondary)] text-[var(--color-text-white)] py-2.5 px-4 rounded-xl text-sm font-semibold hover:bg-[var(--color-text-primary)] transition-custom flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-custom">
                                    <RefreshCw className={`w-4 h-4`} />
                                    <span>Check Status</span>
                                </button>
                                <button onClick={handleLogout}
                                    className="w-full border border-[var(--color-border-secondary)] text-[var(--color-text-primary)] py-2.5 px-4 rounded-xl text-sm font-semibold hover:bg-[var(--color-bg-hover)] transition-custom flex items-center justify-center space-x-2">
                                    <LogOut className="w-4 h-4" /><span>Logout</span>
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionExpiredPage;