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
    const { user } = useAuth();

    return (
        <div className="h-full bg-[var(--color-bg-primary)]">
            <div className="p-8 mx-auto space-y-6">
                {/* Header */}
                <div className="bg-[var(--color-bg-secondary)] rounded-2xl shadow-xl overflow-hidden">
                    <div className="bg-gradient-to-r from-[var(--color-primary-dark)] to-[var(--color-primary-darker)] p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => navigate(-1)}
                                    className="flex items-center gap-2 text-[var(--color-text-white)] hover:opacity-90 transition-colors bg-[var(--color-bg-secondary-20)] px-2 py-2 rounded-lg backdrop-blur-sm"
                                >
                                    <ArrowLeft size={18} />
                                   
                                </button>
                                <div className="flex items-center gap-3">
                                    <SettingsIcon className="w-7 h-7 text-[var(--color-text-white)]" />
                                    <h1 className="text-2xl font-bold text-[var(--color-text-white)]">Settings</h1>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <ProfileInfoTab />
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
        <div className="bg-[var(--color-primary-lighter)]  p-5">
            <div className="flex items-center gap-3">
                <div className="rounded-lg text-[var(--color-primary-darker)]">{titleIcon}</div>
                <h2 className="text-xl font-bold text-[var(--color-primary-darker)]">{title}</h2>
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
