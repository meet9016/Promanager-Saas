import React, { useState, useEffect } from 'react';
import { ArrowLeft, Settings as SettingsIcon, Calendar, Save } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosInstance';
import { useNavigate } from 'react-router-dom';
import { Toast } from '../../Components/ui/Toast';

const AddSettingPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    
    const [leaveValue, setLeaveValue] = useState('0');
    const [isSaving, setIsSaving] = useState(false);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'info') => setToast({ message, type });
    const closeToast = () => setToast(null);

    // Fetch existing setting to populate the input
    useEffect(() => {
        const fetchSoftwareSettings = async () => {
            try {
                setLoading(true);
                if (!user?.user_id) throw new Error('User ID is required');

                const formData = new FormData();
                formData.append('user_id', user.user_id);
                const response = await api.post('software_setting_list', formData);

                if (response.data?.success) {
                    const data = response.data.data || response.data.settings || {};
                    setLeaveValue(data.total_monthly_paid_leave || '0');
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchSoftwareSettings();
    }, [user]);

    const handleSave = async () => {
        try {
            setIsSaving(true);
            
            const formData = new FormData();
            formData.append('user_id', user?.user_id);
            formData.append('total_monthly_paid_leave', leaveValue);

            const response = await api.post(`software_setting_update?total_monthly_paid_leave=${leaveValue}`, formData);
            
            if (response.data?.success) {
                showToast(response.data.message || 'Setting updated successfully!', 'success');
                setTimeout(() => {
                    navigate('/settings');
                }, 1000);
            } else {
                throw new Error('Failed to update setting');
            }
        } catch (error) {
            console.error(error);
            showToast("Error updating setting", "error");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="h-full bg-[var(--color-bg-primary)]">
            <div className="p-8 mx-auto space-y-6">
                {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
                
                {/* Header */}
                <div className="bg-[var(--color-bg-secondary)] rounded-2xl shadow-xl overflow-hidden">
                    <div className="bg-gradient-to-r from-[var(--color-primary-dark)] to-[var(--color-primary-darker)] p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => navigate('/settings')}
                                    className="flex items-center gap-2 text-[var(--color-text-white)] hover:opacity-90 transition-colors bg-[var(--color-bg-secondary-20)] px-2 py-2 rounded-lg backdrop-blur-sm"
                                >
                                    <ArrowLeft size={18} />
                                </button>
                                <div className="flex items-center gap-3">
                                    <SettingsIcon className="w-7 h-7 text-[var(--color-text-white)]" />
                                    <h1 className="text-2xl font-bold text-[var(--color-text-white)]">Add/Update Setting</h1>
                                </div>
                            </div>
                            
                            {/* Actions moved to header right side */}
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => navigate('/settings')}
                                    className="px-5 py-2 rounded-xl text-[var(--color-text-white)] bg-white/10 hover:bg-white/20 backdrop-blur-md font-medium transition-colors shadow-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="px-5 py-2 rounded-xl bg-white text-[var(--color-primary-dark)] hover:bg-gray-100 font-bold transition-colors disabled:opacity-70 flex items-center gap-2 shadow-md hover:shadow-lg"
                                >
                                    {isSaving ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[var(--color-primary-dark)]"></div>
                                    ) : (
                                        <Save size={16} />
                                    )}
                                    {isSaving ? 'Saving...' : 'Save Configuration'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form Content */}
                <div className="bg-[var(--color-bg-secondary)] rounded-2xl shadow-xl overflow-hidden max-w-2xl">
                    <div className="bg-[var(--color-primary-lighter)] p-5">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg text-[var(--color-primary-darker)]">
                                <Calendar className="w-6 h-6" />
                            </div>
                            <h2 className="text-xl font-bold text-[var(--color-primary-darker)]">Leave Configuration</h2>
                        </div>
                    </div>
                    
                    <div className="p-8">
                        {loading ? (
                             <div className="flex justify-center p-6">
                                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary-dark)]"></div>
                             </div>
                        ) : (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                                        Total Monthly Paid Leave
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Calendar className="h-5 w-5 text-[var(--color-text-secondary)]" />
                                        </div>
                                        <input
                                            type="number"
                                            min="0"
                                            value={leaveValue}
                                            onChange={(e) => setLeaveValue(e.target.value)}
                                            className="block w-full pl-10 pr-3 py-3 border border-[var(--color-border-primary)] rounded-xl bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
                                            placeholder="Enter days..."
                                        />
                                    </div>
                                    <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                                        Configure the maximum number of paid leaves an employee can take per month.
                                    </p>
                                </div>

                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddSettingPage;
