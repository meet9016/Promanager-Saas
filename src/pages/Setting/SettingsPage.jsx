import React, { useState, useEffect, useCallback } from 'react';
import {
    Settings as SettingsIcon,
    Clock,
    Save,
    ArrowLeft,
    Calendar,
    Shield,
    Zap,
    Users as UsersIcon,
    Award,
    AlertTriangle,
    Gift,
    User,
    Mail,
    Phone,
    Building2,
    Info,
    Cpu,
    Server,

} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosInstance';
import { Toast } from '../../Components/ui/Toast';
import { useNavigate } from 'react-router-dom';

/* ===========================
   SETTINGS PAGE (TABS WRAPPER)
   =========================== */
const SettingsPage = () => {
    const navigate = useNavigate();
    const [tab, setTab] = useState('subscription'); // 'time' | 'subscription' | 'profile'
    const { user, isAuthenticated } = useAuth();
    const [toast, setToast] = useState(null);
    const [subscriptions, setSubscriptions] = useState([]);


    useEffect(() => {

        const fetchInvoiceList = async () => {
            try {
                // Check if user is authenticated and has user_id
                if (!isAuthenticated() || !user?.user_id) {
                    setToast({
                        message: 'User authentication required. Please login again.',
                        type: 'error'
                    });
                    return;
                }
                const formData = new FormData();

                const response = await api.post('/subscription_list', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
                if (response.data.success) {

                    setSubscriptions(response.data.data);
                } else {
                    setToast({
                        message: response.data.message || 'Failed to load employee dropdown options.',
                        type: 'error'
                    });
                }
            } catch (error) {
                console.error('Error fetching employee dropdown data:', error);
                setToast({
                    message: 'Failed to load employee dropdown options. Please refresh the page.',
                    type: 'error'
                });
            } finally {
            }
        };

        fetchInvoiceList();
    }, [user, isAuthenticated]);


    const TabButton = ({ id, children }) => (
        <button
            onClick={() => setTab(id)}
            className={`px-4 py-2 text-sm font-medium transition-colors rounded-md
        ${tab === id
                    ? 'bg-[var(--color-primary-dark)] text-white'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-gradient-start)]'
                }`}
        >
            {children}
        </button>
    );

    return (
        <div className="min-h-screen bg-[var(--color-bg-primary)]">
            <div className="p-8  mx-auto space-y-6">
                {/* Header */}
                <div className="bg-[var(--color-bg-secondary)] rounded-2xl shadow-xl overflow-hidden">
                    <div className="bg-gradient-to-r from-[var(--color-primary-dark)] to-[var(--color-primary-darker)] p-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => navigate(-1)}
                                    className="flex items-center gap-2 text-[var(--color-text-white)] hover:opacity-90 transition-colors bg-[var(--color-bg-secondary-20)] px-4 py-2 rounded-lg backdrop-blur-sm"
                                >
                                    <ArrowLeft size={18} />
                                    Back
                                </button>
                                <div className="flex items-center gap-3">
                                    <SettingsIcon className="w-7 h-7 text-[var(--color-text-white)]" />
                                    <h1 className="text-2xl font-bold text-[var(--color-text-white)]">Settings</h1>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="px-4 py-4">
                        <div className="flex gap-2 bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] rounded-xl p-2 w-fit">
                            {/* <TabButton id="time">Time & Attendance</TabButton> */}
                            <TabButton id="subscription">Subscription</TabButton>
                            <TabButton id="profile">Profile & Info</TabButton>
                        </div>
                    </div>
                </div>

                {/* Tab Content */}
                {/* {tab === 'time' && <TimeConfigurationTab />} */}
                {tab === 'subscription' && <SubscriptionTab subscriptions={subscriptions} />}
                {tab === 'profile' && <ProfileInfoTab />}
            </div>
        </div>
    );
};

/* ==============================
   TIME & ATTENDANCE CONFIG (TAB)
   ============================== */
// const TimeConfigurationTab = () => {
//     const { user, logout } = useAuth();
//     const [config, setConfig] = useState({ earlyTimeMin: 15, lateTimeMin: 15, overtimeMin: 30 });
//     const [errors, setErrors] = useState({});
//     const [loading, setLoading] = useState(false);
//     const [updateLoading, setUpdateLoading] = useState(false);
//     const [toast, setToast] = useState(null);

//     const showToast = (message, type = 'info') => setToast({ message, type });
//     const closeToast = () => setToast(null);

//     const fetchSoftwareSettings = useCallback(async () => {
//         try {
//             setLoading(true);
//             if (!user?.user_id) throw new Error('User ID is required');

//             const formData = new FormData();
//             formData.append('user_id', user.user_id);
//             const response = await api.post('software_setting_list', formData);

//             if (response.data?.success) {
//                 const settingsData = response.data.data || response.data.settings || {};
//                 setConfig({
//                     earlyTimeMin: parseInt(settingsData.early_clock_in) || 20, // nicer defaults to match screenshot
//                     lateTimeMin: parseInt(settingsData.late_arrival) || 20,
//                     overtimeMin: parseInt(settingsData.overtime) || 30,
//                 });
//             } else if (response.data) {
//                 setConfig({
//                     earlyTimeMin: parseInt(response.data.early_clock_in) || 20,
//                     lateTimeMin: parseInt(response.data.late_arrival) || 20,
//                     overtimeMin: parseInt(response.data.overtime) || 30,
//                 });
//             } else {
//                 throw new Error(response.data?.message || 'Failed to fetch software settings');
//             }
//         } catch (error) {
//             const errorMessage = error?.response?.data?.message || error.message || "An unexpected error occurred";
//             if (error?.response?.status === 401) {
//                 showToast("Your session has expired. Please login again.", 'error');
//                 setTimeout(() => logout?.(), 2000);
//             } else if (error?.response?.status === 403) {
//                 showToast("You don't have permission to view settings.", 'error');
//             } else if (error?.response?.status >= 500) {
//                 showToast("Server error. Please try again later.", 'error');
//             } else {
//                 showToast(errorMessage, 'error');
//             }
//         } finally {
//             setLoading(false);
//         }
//     }, [user, logout]);

//     const updateSoftwareSettings = useCallback(async () => {
//         try {
//             setUpdateLoading(true);
//             if (!user?.user_id) throw new Error('User ID is required');

//             const formData = new FormData();
//             formData.append('user_id', user.user_id);
//             formData.append('early_clock_in', String(config.earlyTimeMin));
//             formData.append('late_arrival', String(config.lateTimeMin));
//             formData.append('overtime', String(config.overtimeMin));

//             const response = await api.post('software_setting_update', formData);
//             if (response.data?.success) {
//                 showToast('Configuration saved successfully!', 'success');
//             } else {
//                 throw new Error(response.data?.message || 'Failed to update software settings');
//             }
//         } catch (error) {
//             const errorMessage = error?.response?.data?.message || error.message || "An unexpected error occurred";
//             if (error?.response?.status === 401) {
//                 showToast("Your session has expired. Please login again.", 'error');
//                 setTimeout(() => logout?.(), 2000);
//             } else if (error?.response?.status === 403) {
//                 showToast("You don't have permission to update settings.", 'error');
//             } else if (error?.response?.status >= 500) {
//                 showToast("Server error. Please try again later.", 'error');
//             } else {
//                 showToast(errorMessage, 'error');
//             }
//         } finally {
//             setUpdateLoading(false);
//         }
//     }, [user, logout, config]);

//     useEffect(() => { fetchSoftwareSettings(); }, [fetchSoftwareSettings]);

//     const handleInputChange = (field, value) => {
//         if (value === '' || value === null || value === undefined) {
//             setConfig(prev => ({ ...prev, [field]: 0 }));
//             setErrors(prev => { const p = { ...prev }; delete p[field]; return p; });
//             return;
//         }
//         let numValue = parseInt(value);
//         if (isNaN(numValue) || numValue < 0) numValue = 0;

//         setErrors(prev => {
//             const p = { ...prev };
//             if (numValue > 480) p[field] = 'Value cannot exceed 480 minutes (8 hours)';
//             else delete p[field];
//             return p;
//         });
//         setConfig(prev => ({ ...prev, [field]: numValue }));
//     };

//     const formatTime = (minutes) => {
//         const hours = Math.floor(minutes / 60);
//         const mins = minutes % 60;
//         return hours ? `${hours}h ${mins}m` : `${mins}m`;
//     };

//     // Loading skeleton
//     if (loading) {
//         return (
//             <div className="bg-[var(--color-bg-secondary)] rounded-2xl p-10 flex items-center justify-center">
//                 <div className="text-center">
//                     <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary-dark)] mx-auto mb-4"></div>
//                     <p className="text-[var(--color-text-secondary)]">Loading settings...</p>
//                 </div>
//             </div>
//         );
//     }

//     return (
//         <>
//             {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}

//             <SectionCard
//                 titleIcon={<Clock className="w-6 h-6 text-[var(--color-text-white)]" />}
//                 title="Time Configuration"
//             >
//                 <div className="grid md:grid-cols-3 gap-6 mb-8">
//                     <ConfigCard
//                         title="Early Clock-In"
//                         subtitle="Tolerance Period"
//                         iconSlot={<Clock className="w-5 h-5 text-[var(--color-success-dark)]" />}
//                         pillBg="bg-green-100"
//                         current={formatTime(config.earlyTimeMin)}
//                         value={config.earlyTimeMin}
//                         error={errors.earlyTimeMin}
//                         onChange={v => handleInputChange('earlyTimeMin', v)}
//                     />
//                     <ConfigCard
//                         title="Late Arrival"
//                         subtitle="Grace Period"
//                         iconSlot={<Clock className="w-5 h-5 text-yellow-600" />}
//                         pillBg="bg-yellow-100"
//                         current={formatTime(config.lateTimeMin)}
//                         value={config.lateTimeMin}
//                         error={errors.lateTimeMin}
//                         onChange={v => handleInputChange('lateTimeMin', v)}
//                     />
//                     <ConfigCard
//                         title="Overtime"
//                         subtitle="Threshold"
//                         iconSlot={<Clock className="w-5 h-5 text-[var(--color-primary-dark)]" />}
//                         pillBg="bg-[var(--color-primary-lighter)]"
//                         current={formatTime(config.overtimeMin)}
//                         value={config.overtimeMin}
//                         error={errors.overtimeMin}
//                         onChange={v => handleInputChange('overtimeMin', v)}
//                     />
//                 </div>

//                 {/* Sticky Save Bar */}
//                 <div className="flex items-center justify-end pt-6 border-t border-[var(--color-border-primary)]">
//                     <button
//                         onClick={updateSoftwareSettings}
//                         disabled={Object.keys(errors).length > 0 || updateLoading}
//                         className={`flex items-center gap-2 px-6 py-2 rounded-md font-medium transition-colors
//             ${Object.keys(errors).length > 0 || updateLoading
//                                 ? 'bg-gray-300 text-[var(--color-text-secondary)] cursor-not-allowed'
//                                 : 'bg-[var(--color-primary-dark)] hover:bg-[var(--color-primary-darker)] text-[var(--color-text-white)]'
//                             }`}
//                     >
//                         {updateLoading ? (
//                             <>
//                                 <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[var(--color-border-primary)]"></div>
//                                 Saving...
//                             </>
//                         ) : (
//                             <>
//                                 <Save className="w-4 h-4" />
//                                 Save Configuration
//                             </>
//                         )}
//                     </button>
//                 </div>
//             </SectionCard>
//         </>
//     );
// };

// const ConfigCard = ({ title, subtitle, iconSlot, pillBg, current, value, error, onChange }) => (
//     <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl shadow-sm hover:shadow-md transition-shadow">
//         <div className="p-8">
//             <div className="flex items-center gap-3 mb-4">
//                 <div className={`p-2 ${pillBg} rounded-lg`}>{iconSlot}</div>
//                 <div>
//                     <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">{title}</h3>
//                     <p className="text-sm text-[var(--color-text-secondary)]">{subtitle}</p>
//                 </div>
//             </div>

//             <div className="text-center mb-4">
//                 <div className="text-3xl font-extrabold text-[var(--color-primary-dark)]">{current}</div>
//                 <div className="text-xs text-[var(--color-text-secondary)]">Current Setting</div>
//             </div>

//             <div className="mb-1">
//                 <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Minutes</label>
//                 <input
//                     type="number"
//                     min="0"
//                     max="480"
//                     value={value === 0 ? '' : value}
//                     onChange={(e) => onChange(e.target.value)}
//                     onKeyDown={(e) => {
//                         if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') e.preventDefault();
//                     }}
//                     className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]
//             ${error ? 'border-red-500' : 'border-[var(--color-border-secondary)]'}`}
//                 />
//             </div>
//             {error && <div className="text-[var(--color-text-error)] text-sm mt-1">{error}</div>}
//         </div>
//     </div>
// );


/* ========================
   SUBSCRIPTION (PRICING) TAB
   ======================== */
const SubscriptionTab = ({ subscriptions = [] }) => {
    const { user } = useAuth();

    const subscriptionDays = parseInt(user?.subscriptions_days) || 0;
    const subscriptionStatus = parseInt(user?.subscriptions_status) || 0;

    const expirationDate = new Date();
    expirationDate.setTime(expirationDate.getTime() + (subscriptionDays * 24 * 60 * 60 * 1000));

    const getUserInitials = (name) => {
        if (!name || name === 'Unknown User') return 'U';
        return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    };

    const getStatusInfo = (status, days) => {
        if (status === 1) {
            if (days <= 0) return { text: 'Expired', bgColor: 'bg-red-100', textColor: 'text-red-800', isActive: false, isExpired: true, isExpiringSoon: false };
            if (days <= 7) return { text: 'Expiring Soon', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800', isActive: true, isExpired: false, isExpiringSoon: true };
            return { text: 'Active', bgColor: 'bg-green-100', textColor: 'text-green-800', isActive: true, isExpired: false, isExpiringSoon: false };
        }
        return { text: 'Inactive', bgColor: 'bg-gray-100', textColor: 'text-gray-800', isActive: false, isExpired: false, isExpiringSoon: false };
    };

    const statusInfo = getStatusInfo(subscriptionStatus, subscriptionDays);

    const getBannerConfig = () => {
        if (statusInfo.isExpired) {
            return { bgClass: 'bg-gradient-to-r from-red-600 to-red-700', icon: AlertTriangle, title: 'Subscription Expired!', description: 'Renew now to continue using our services', textColorClass: 'text-red-100' };
        } else if (statusInfo.isExpiringSoon) {
            return { bgClass: 'bg-gradient-to-r from-yellow-600 to-orange-600', icon: Gift, title: 'Subscription Expiring Soon!', description: 'Renew before expiration to avoid interruption', textColorClass: 'text-yellow-100' };
        } else if (statusInfo.isActive) {
            return { bgClass: 'bg-gradient-to-r from-green-600 to-green-700', icon: Gift, title: 'Active Subscription', description: 'Your subscription is active and running smoothly', textColorClass: 'text-green-100' };
        }
        return { bgClass: 'bg-gradient-to-r from-gray-600 to-gray-700', icon: AlertTriangle, title: 'Inactive Subscription', description: 'Activate your subscription to access all features', textColorClass: 'text-gray-100' };
    };

    const bannerConfig = getBannerConfig();
    const BannerIcon = bannerConfig.icon;

    const getDaysColor = () => {
        if (subscriptionDays <= 0) return 'text-red-400';
        if (subscriptionDays <= 7) return 'text-yellow-400';
        return 'text-green-400';
    };

    return (
        <div className="space-y-8">
            {/* Banner */}
            <div className={`${bannerConfig.bgClass} text-[var(--color-text-white)] py-6 rounded-2xl`}>
                <div className="max-w-6xl mx-auto px-6">
                    <div className="flex items-center justify-center">
                        <div className="flex items-center">
                            <BannerIcon className="w-6 h-6 mr-3" />
                            <div className="text-center">
                                <h3 className="font-bold text-lg">{bannerConfig.title}</h3>
                                <p className={`${bannerConfig.textColorClass} text-sm`}>{bannerConfig.description}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Card */}
            <SectionCard tight titleIcon={
                <Gift className="w-6 h-6 text-[var(--color-text-white)]" />
            } title="Subscription">
                <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
                    <span className={`px-4 py-2 rounded-full text-sm font-medium ${statusInfo.bgColor} ${statusInfo.textColor}`}>
                        {statusInfo.text} Status
                    </span>
                    <span className="px-3 py-1 bg-primary-500 text-[var(--color-text-white)] rounded-full text-sm font-bold">
                        Current Plan
                    </span>
                </div>

                <div className="flex items-center space-x-4 mb-8">
                    <div className="w-16 h-16 bg-[var(--color-primary)] rounded-full flex items-center justify-center text-[var(--color-text-white)] text-xl font-bold">
                        {getUserInitials(user?.full_name)}
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">{user?.full_name || user?.name || user?.username || 'User'}</h2>
                        <p className="text-[var(--color-text-secondary)]">{user?.email || user?.username || user?.number || '--'}</p>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4 mb-8">
                    <InfoTile label="Status">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.textColor}`}>{statusInfo.text}</span>
                    </InfoTile>
                    <InfoTile label="Days Remaining">
                        <span className={`font-mono font-bold text-lg ${getDaysColor()}`}>{subscriptionDays} days</span>
                    </InfoTile>
                    <InfoTile label="Expires On">
                        <span className="font-mono">{expirationDate.toLocaleDateString('en-GB')}</span>
                    </InfoTile>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                    {statusInfo.isExpired ? (
                        <button className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors">Renew Subscription</button>
                    ) : statusInfo.isExpiringSoon ? (
                        <button className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors">Extend Subscription</button>
                    ) : statusInfo.isActive ? (
                        <button className="flex-1 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white py-3 px-6 rounded-lg font-semibold transition-colors">Manage Subscription</button>
                    ) : (
                        <button className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors">Activate Subscription</button>
                    )}
                    <button className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors">View Usage Details</button>
                    <button onClick={() => window.location.href = '/renew'} className={`flex-1  py-3 px-6 rounded-lg font-semibold transition-colors ${statusInfo.bgColor} ${statusInfo.textColor}`}>Renew Now</button>

                </div>
            </SectionCard>

            {/* Subscription List Table */}
            <SectionCard
                titleIcon={<UsersIcon className="w-6 h-6 text-[var(--color-text-white)]" />}
                title="Subscription History"
            >
                {subscriptions.length === 0 ? (
                    <div className="text-center py-10 text-[var(--color-text-secondary)]">
                        No subscription records found
                    </div>
                ) : (
                    <div className="overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gradient-to-r from-[var(--color-primary-dark)] to-[var(--color-primary-darker)]">
                                <tr>
                                    {[
                                        'Invoice',
                                        'Plan',
                                        'Price',
                                        'Employees',
                                        'Amount',
                                        'Start Date',
                                        'End Date',
                                        'Status',
                                        'PDF'
                                    ].map((label) => (
                                        <th key={label} className="px-3 py-3 text-xs text-center text-white uppercase">
                                            {label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-[var(--color-border-divider)]">
                                {subscriptions.map((item, index) => (
                                    <tr key={index} className="hover:bg-[var(--color-primary-lightest)] text-center">
                                        <td className="py-3">{item.invoice_no}</td>
                                        <td>{item.plan_name}</td>
                                        <td>₹{item.plan_price}</td>
                                        <td>{item.total_employee}</td>
                                        <td className="font-semibold">₹{item.amount}</td>
                                        <td>{item.starting_date}</td>
                                        <td>{item.ending_date}</td>
                                        <td>
                                            <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
                                                {item.status_label}
                                            </span>
                                        </td>
                                        <td>
                                            <a
                                                href={item.pdf_link}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-[var(--color-primary-dark)] hover:underline"
                                            >
                                                View
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </SectionCard>
        </div>

    );


};



/* =====================
   PROFILE & INFO (TAB)
   ===================== */
const ProfileInfoTab = () => {
    const { user } = useAuth();

    const pretty = (val, fallback = '--') => (val === undefined || val === null || val === '' ? fallback : val);

    const appDetails = [
        { icon: Cpu, label: 'App Version', value: 'v1.6.3' },
        { icon: Server, label: 'API Endpoint', value: 'Configured' },
        { icon: Shield, label: 'Security', value: 'SOC 2 Type II, 256-bit TLS' },
        { icon: Zap, label: 'Status', value: 'Operational (99.9% uptime)' },
    ];

    return (
        <div className="grid lg:grid-cols-3 gap-6">
            {/* User Card */}
            <div className="lg:col-span-2">
                <SectionCard titleIcon={<User className="w-6 h-6 text-[var(--color-text-white)]" />} title="User Profile">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 bg-[var(--color-primary)] rounded-full flex items-center justify-center text-white text-xl font-bold">
                            {getInitials(user?.full_name || user?.name || user?.username || 'User')}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-[var(--color-text-primary)]">
                                {pretty(user?.full_name || user?.name || user?.username, 'User')}
                            </h3>
                            <p className="text-[var(--color-text-secondary)]">
                                {pretty(user?.email || user?.username || user?.number)}
                            </p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <InfoTile label="Full Name">
                            {pretty(user?.full_name || user?.name || user?.username)}
                        </InfoTile>
                        <InfoTile label="Email">
                            <span className="inline-flex items-center gap-2"><Mail size={14} /> {pretty(user?.email)}</span>
                        </InfoTile>
                        <InfoTile label="Phone">
                            <span className="inline-flex items-center gap-2"><Phone size={14} /> {pretty(user?.number)}</span>
                        </InfoTile>
                        <InfoTile label="Username">
                            {pretty(user?.username)}
                        </InfoTile>
                        <InfoTile label="Company">
                            <span className="inline-flex items-center gap-2"><Building2 size={14} /> {pretty(user?.company_name || user?.company || '—')}</span>
                        </InfoTile>
                        <InfoTile label="Subscription Days Left">
                            {pretty(user?.subscriptions_days, '0')} days
                        </InfoTile>
                    </div>
                </SectionCard>
            </div>

            {/* Software / About Card */}
            <div className="lg:col-span-1">
                <SectionCard titleIcon={<Info className="w-6 h-6 text-[var(--color-text-white)]" />} title="Software Info">
                    <div className="space-y-3">
                        {appDetails.map((row, i) => (
                            <div key={i} className="flex items-center justify-between border border-[var(--color-border-primary)] rounded-lg px-3 py-2">
                                <div className="flex items-center gap-2">
                                    <row.icon size={16} className="text-[var(--color-primary-dark)]" />
                                    <span className="text-sm text-[var(--color-text-secondary)]">{row.label}</span>
                                </div>
                                <span className="text-sm font-medium text-[var(--color-text-primary)]">{row.value}</span>
                            </div>
                        ))}
                    </div>
                </SectionCard>
            </div>
        </div>
    );
};

/* ===========
   SMALL UI
   =========== */
const SectionCard = ({ title, titleIcon, children, tight = false }) => (
    <div className="bg-[var(--color-bg-secondary)] rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-[var(--color-primary-dark)] to-[var(--color-primary-darker)] p-5">
            <div className="flex items-center gap-3">
                <div className="rounded-lg">{titleIcon}</div>
                <h2 className="text-xl font-bold text-[var(--color-text-white)]">{title}</h2>
            </div>
        </div>
        <div className={`p-8 ${tight ? 'pt-5' : ''}`}>{children}</div>
    </div>
);

const InfoTile = ({ label, children }) => (
    <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl p-4">
        <div className="text-xs uppercase tracking-wide text-[var(--color-text-secondary)] mb-1">{label}</div>
        <div className="text-[var(--color-text-primary)] font-medium">{children}</div>
    </div>
);

const getInitials = (name) =>
    name
        .split(' ')
        .map(w => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

export default SettingsPage;
