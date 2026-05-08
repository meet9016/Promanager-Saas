import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Calendar, Clock, ArrowLeft, Save, X, CheckCircle, AlertCircle, Info, Settings, Users, Timer, Edit, Copy, ChevronDown, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosInstance';
import { Toast } from '../../Components/ui/Toast';
import { useSelector } from 'react-redux';
import LoadingSpinner from '../../Components/Loader/LoadingSpinner';

// Enhanced Copy Dropdown Component
const CopyDropdown = ({ dayList, onCopy, sourceDay }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Find the source day configuration
    const sourceConfig = dayList.find(day => day.day_name.toLowerCase() === sourceDay.toLowerCase());
    const isSourceConfigured = sourceConfig && sourceConfig.from_time && sourceConfig.to_time && sourceConfig.shift_type;

    const availableDays = dayList.filter(day =>
        day.day_name.toLowerCase() !== sourceDay.toLowerCase()
    );

    // Check if this is Sunday (last day) to adjust dropdown position
    const isSunday = sourceDay.toLowerCase() === 'sunday';

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleCopyToDay = (targetDay) => {
        onCopy(sourceDay, [targetDay]);
        setIsOpen(false);
    };

    const handleCopyToAll = () => {
        const allTargetDays = availableDays.map(day => day.day_name.toLowerCase());
        onCopy(sourceDay, allTargetDays);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                disabled={!isSourceConfigured}
                className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-all duration-200 ${isSourceConfigured
                    ? 'text-[var(--color-primary-darker)] bg-[var(--color-primary-lightest)] border-[var(--color-primary-light)] hover:bg-[var(--color-primary-lighter)] hover:border-primary-300 focus:ring-2 focus:ring-[var(--color-primary)] focus:outline-none'
                    : 'text-[var(--color-text-muted)] bg-[var(--color-bg-primary)] border-[var(--color-border-primary)] cursor-not-allowed'
                    }`}
            >
                <Copy className="w-4 h-4" />
                Copy {sourceDay.charAt(0).toUpperCase() + sourceDay.slice(1)}
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && isSourceConfigured && (
                <div className={`absolute right-0 w-64 bg-[var(--color-bg-secondary)] rounded-xl shadow-xl border border-[var(--color-border-primary)] z-[999] overflow-hidden ${isSunday ? 'bottom-full mb-2' : 'top-full mt-2'
                    }`}>
                    <div className="p-3 bg-gradient-to-r from-[var(--color-primary-light)] to-[var(--color-indigo-light)] border-b border-[var(--color-border-primary)]">
                        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Copy Configuration</h3>
                        <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                            From: {sourceConfig.from_time} - {sourceConfig.to_time}
                        </p>
                    </div>

                    <div className="py-2">
                        <button
                            onClick={handleCopyToAll}
                            className="w-full px-4 py-3 text-left text-sm font-medium text-[var(--color-primary-darker)] hover:bg-[var(--color-primary-lightest)] transition-colors flex items-center gap-3"
                        >
                            <div className="w-8 h-8 bg-[var(--color-primary)] rounded-lg flex items-center justify-center">
                                <Copy className="w-4 h-4 text-[var(--color-text-white)]" />
                            </div>
                            <div>
                                <div className="font-medium">Copy to All Days</div>
                                <div className="text-xs text-[var(--color-text-secondary)]">Apply to all other days</div>
                            </div>
                        </button>

                        <div className="my-2 border-t border-[var(--color-border-primary)]"></div>

                        <div className="px-4 py-2">
                            <p className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide">Copy to Individual Days</p>
                        </div>

                        {availableDays.map(day => {
                            const isConfigured = day.from_time && day.to_time && day.shift_type;
                            return (
                                <button
                                    key={day.day_id}
                                    onClick={() => handleCopyToDay(day.day_name.toLowerCase())}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-[var(--color-bg-primary)] transition-colors flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${isConfigured ? 'bg-primary-100 text-primary-700' : 'bg-[var(--color-bg-gradient-start)] text-[var(--color-text-secondary)]'
                                            }`}>
                                            {day.day_name.charAt(0)}
                                        </div>
                                        <span className="text-[var(--color-text-secondary)]">{day.day_name}</span>
                                    </div>
                                    {isConfigured && (
                                        <Check className="w-4 h-4 text-green-500" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

const CreateShift = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user } = useAuth();

    // Get edit mode and shift ID from URL params
    const editShiftId = searchParams.get('edit');
    const isEditMode = !!editShiftId;

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState(null);

    // Form data
    const [shiftName, setShiftName] = useState('');
    const [remark, setRemark] = useState('');
    const [dayList, setDayList] = useState([]);
    const [shiftTypes, setShiftTypes] = useState([]);
    const [occasionalDayList, setOccasionalDayList] = useState([]);
    const permissions = useSelector(state => state.permissions) || {};

    // Show toast notification
    const showToast = (message, type = 'info') => {
        setToast({ message, type });
    };

    // Close toast
    const closeToast = () => {
        setToast(null);
    };

    // Apply default values to day list
    const applyDefaultValues = (days) => {
        return days.map(day => ({
            ...day,
            from_time: day.from_time || '09:00 PM',
            to_time: day.to_time || '06:00 AM',
            shift_type: day.shift_type || '1',
            occasional_days: day.occasional_day || '' // Map occasional_day to occasional_days
        }));
    };

    // Reorder days to put Sunday at the end
    const reorderDays = (days) => {
        const sundayDay = days.find(day => day.day_name.toLowerCase() === 'sunday');
        const otherDays = days.filter(day => day.day_name.toLowerCase() !== 'sunday');

        if (sundayDay) {
            return [...otherDays, sundayDay];
        }
        return days;
    };

    // Enhanced copy function with selective copying
    const handleCopyConfiguration = (sourceDay, targetDays) => {
        const sourceDayData = dayList.find(day => day.day_name.toLowerCase() === sourceDay.toLowerCase());

        if (!sourceDayData || !sourceDayData.from_time || !sourceDayData.to_time || !sourceDayData.shift_type) {
            showToast(`Please configure ${sourceDay} shift first before copying`, 'error');
            return;
        }

        setDayList(prevDays =>
            prevDays.map(day => {
                // Don't copy to the source day itself
                if (day.day_name.toLowerCase() === sourceDay.toLowerCase()) {
                    return day;
                }

                // Check if this day should be updated
                if (targetDays.includes(day.day_name.toLowerCase())) {
                    return {
                        ...day,
                        from_time: sourceDayData.from_time,
                        to_time: sourceDayData.to_time,
                        shift_type: sourceDayData.shift_type,
                        occasional_days: sourceDayData.occasional_days
                    };
                }

                return day;
            })
        );

        const targetDayNames = targetDays.map(day => day.charAt(0).toUpperCase() + day.slice(1)).join(', ');
        showToast(`${sourceDay.charAt(0).toUpperCase() + sourceDay.slice(1)} configuration copied to ${targetDayNames}`, 'success');
    };

    // Fetch shift day data (for creating new shifts or editing existing ones)
    const fetchShiftDayData = async (shiftId = null) => {
        try {
            const formData = new FormData();

            // If shiftId is provided, add it to fetch existing shift data
            if (shiftId) {
                formData.append('shift_id', shiftId);
            }

            const response = await api.post('shift_day_fetch', formData);

            if (response.data.success) {
                const data = response.data.data;

                // Process the data according to the actual API response structure
                return {
                    dayList: data.day_list || [],
                    shiftTypes: (data.shift_type || []).map(type => ({
                        shift_type_id: type.id,
                        shift_type_name: type.name
                    })),
                    occasionalDayList: (data.day_occasional_list || []).map(day => ({
                        occasional_day_id: day.id,
                        occasional_day_name: day.name
                    }))
                };
            } else {
                showToast(response.data.message || 'Failed to fetch shift data', 'error');
                return null;
            }
        } catch (err) {
            console.error('Error fetching shift data:', err);
            showToast('Failed to load shift data. Please try again.', 'error');
            return null;
        }
    };

    // Fetch existing shift details from shift_list API (for basic info like shift_name)
    const fetchShiftDetailsFromList = async (shiftId) => {
        try {
            if (!user?.user_id) {
                showToast('Admin user ID is required.', 'error');
                return null;
            }

            const formData = new FormData();

            const response = await api.post('shift_list', formData);

            if (response.data.success && Array.isArray(response.data.data)) {
                // Find the specific shift by ID
                const shiftDetails = response.data.data.find(shift =>
                    shift.shift_id === shiftId || shift.shift_id === parseInt(shiftId)
                );

                if (shiftDetails) {
                    return shiftDetails;
                } else {
                    showToast('Shift not found in the list', 'error');
                    return null;
                }
            } else {
                showToast(response.data.message || 'Failed to fetch shift list', 'error');
                return null;
            }
        } catch (err) {
            console.error('Error fetching shift list:', err);
            showToast('Failed to load shift details. Please try again.', 'error');
            return null;
        }
    };

    // Fetch existing shift data for editing
    const fetchExistingShiftData = async (shiftId) => {
        try {
            if (!user?.user_id) {
                showToast('Admin user ID is required.', 'error');
                return;
            }

            // Fetch shift day data with the specific shift_id
            const shiftDayData = await fetchShiftDayData(shiftId);
            if (!shiftDayData) return;

            // Set the fetched data
            setShiftTypes(shiftDayData.shiftTypes);
            setOccasionalDayList(shiftDayData.occasionalDayList);

            // Process the day list - map occasional_day to occasional_days for consistency
            const processedDayList = shiftDayData.dayList.map(day => ({
                ...day,
                occasional_days: day.occasional_day || '' // Map occasional_day to occasional_days
            }));

            // Reorder days to put Sunday at the end
            setDayList(reorderDays(processedDayList));

            // Fetch basic shift info (shift_name, remark) from shift_list API
            const shiftDetails = await fetchShiftDetailsFromList(shiftId);
            if (shiftDetails) {
                setShiftName(shiftDetails.shift_name || '');
                setRemark(shiftDetails.remark || ''); // This might still be empty if API doesn't provide it
            }
        } catch (err) {
            console.error('Error:', err);
            showToast('Failed to load shift details.', 'error');

            // Try to load at least the base data on error
            const shiftDayData = await fetchShiftDayData();
            if (shiftDayData) {
                setShiftTypes(shiftDayData.shiftTypes);
                setOccasionalDayList(shiftDayData.occasionalDayList);
                setDayList(reorderDays(applyDefaultValues(shiftDayData.dayList)));
            }
        }
    };

    // Initialize data on component mount
    useEffect(() => {
        const initializeData = async () => {
            if (!user?.user_id) return; // prevent API call if user ID is not ready

            setLoading(true);
            try {
                if (isEditMode && editShiftId) {
                    await fetchExistingShiftData(editShiftId);
                } else {
                    // For new shift creation
                    const shiftDayData = await fetchShiftDayData();
                    if (shiftDayData) {
                        setShiftTypes(shiftDayData.shiftTypes);
                        setOccasionalDayList(shiftDayData.occasionalDayList);
                        setDayList(reorderDays(applyDefaultValues(shiftDayData.dayList)));
                    }
                }
            } finally {
                setLoading(false);
            }
        };

        initializeData();
    }, [isEditMode, editShiftId, user?.user_id]);

    // Handle day data change
    const handleDayChange = (dayId, field, value) => {
        setDayList(prevDays =>
            prevDays.map(day =>
                day.day_id === dayId
                    ? { ...day, [field]: value }
                    : day
            )
        );
    };

    // Handle occasional day selection
    const handleOccasionalDayChange = (dayId, occasionalId, checked) => {
        setDayList(prevDays =>
            prevDays.map(day => {
                if (day.day_id === dayId) {
                    let occasionalDays = day.occasional_days ? day.occasional_days.split(',').filter(id => id) : [];

                    if (checked) {
                        if (!occasionalDays.includes(occasionalId)) {
                            occasionalDays.push(occasionalId);
                        }
                    } else {
                        occasionalDays = occasionalDays.filter(id => id !== occasionalId);
                    }

                    return { ...day, occasional_days: occasionalDays.join(',') };
                }
                return day;
            })
        );
    };

    // Validate form data
    const validateForm = () => {
        if (!shiftName.trim()) {
            showToast('Shift name is required to proceed', 'error');
            return false;
        }

        const hasValidDay = dayList.some(day => {
            return day.from_time && day.to_time && day.shift_type;
        });

        if (!hasValidDay) {
            showToast('Please configure at least one day with valid schedule', 'error');
            return false;
        }

        const invalidOccasionalDays = dayList.some(day => {
            if (day.shift_type === "3") {
                return !day.occasional_days || day.occasional_days.trim() === '';
            }
            return false;
        });

        if (invalidOccasionalDays) {
            showToast('Please select occasional days for "Occasional Working Day" shifts', 'error');
            return false;
        }

        return true;
    };

    // Enhanced Time Selector Component with separate Hour and Minute dropdowns
    const TimeSelector = ({ value, onChange, label, required = false, disabled = false }) => {
        // Parse the current time value (e.g., "09:30 AM" or "")
        const parseTimeValue = (timeStr) => {
            if (!timeStr) return { hour: '', minute: '', period: '' };

            const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
            if (match) {
                return {
                    hour: match[1].padStart(2, '0'),
                    minute: match[2],
                    period: match[3].toUpperCase()
                };
            }
            return { hour: '', minute: '', period: '' };
        };

        const { hour, minute, period } = parseTimeValue(value);

        // Generate hour options (1-12 for 12-hour format)
        const generateHourOptions = () => {
            const hours = [];
            for (let i = 1; i <= 12; i++) {
                hours.push({
                    value: i.toString().padStart(2, '0'),
                    label: i.toString()
                });
            }
            return hours;
        };

        // Generate minute options (0-59)
        const generateMinuteOptions = () => {
            const minutes = [];
            for (let i = 0; i < 60; i++) {
                minutes.push({
                    value: i.toString().padStart(2, '0'),
                    label: i.toString().padStart(2, '0')
                });
            }
            return minutes;
        };

        const hourOptions = generateHourOptions();
        const minuteOptions = generateMinuteOptions();
        const periodOptions = [
            { value: 'AM', label: 'AM' },
            { value: 'PM', label: 'PM' }
        ];

        // Handle individual field changes
        const handleFieldChange = (field, fieldValue) => {
            const currentParsed = parseTimeValue(value);

            const newTime = {
                hour: field === 'hour' ? fieldValue : currentParsed.hour,
                minute: field === 'minute' ? fieldValue : currentParsed.minute,
                period: field === 'period' ? fieldValue : currentParsed.period
            };

            // Only call onChange if all fields have values
            if (newTime.hour && newTime.minute && newTime.period) {
                const formattedTime = `${parseInt(newTime.hour).toString().padStart(2, '0')}:${newTime.minute} ${newTime.period}`;
                onChange(formattedTime);
            } else if (!newTime.hour && !newTime.minute && !newTime.period) {
                // If all fields are empty, pass empty string
                onChange('');
            }
        };

        return (
            <div>
                <label className="block text-sm font-semibold text-[var(--color-text-secondary)] mb-2">
                    {label} {required && <span className="text-[var(--color-error)]">*</span>}
                </label>
                <div className="flex gap-1">
                    {/* Hour Dropdown */}
                    <select
                        value={hour}
                        onChange={(e) => handleFieldChange('hour', e.target.value)}
                        className="flex-1 px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] transition-all duration-200 text-sm bg-[var(--color-bg-secondary)] shadow-sm"
                        required={required}
                        disabled={disabled}
                    >
                        <option value="">Hr</option>
                        {hourOptions.map(h => (
                            <option key={h.value} value={h.value}>
                                {h.label}
                            </option>
                        ))}
                    </select>

                    <span className="flex items-center px-1 text-slate-500 font-medium">:</span>

                    {/* Minute Dropdown */}
                    <select
                        value={minute}
                        onChange={(e) => handleFieldChange('minute', e.target.value)}
                        className="flex-1 px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] transition-all duration-200 text-sm bg-[var(--color-bg-secondary)] shadow-sm"
                        required={required}
                        disabled={disabled}
                    >
                        <option value="">Min</option>
                        {minuteOptions.map(m => (
                            <option key={m.value} value={m.value}>
                                {m.label}
                            </option>
                        ))}
                    </select>

                    {/* AM/PM Dropdown */}
                    <select
                        value={period}
                        onChange={(e) => handleFieldChange('period', e.target.value)}
                        className="px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] transition-all duration-200 text-sm bg-[var(--color-bg-secondary)] shadow-sm"
                        required={required}
                        disabled={disabled}
                    >
                        <option value="">--</option>
                        {periodOptions.map(p => (
                            <option key={p.value} value={p.value}>
                                {p.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        );
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        if (!user?.user_id) {
            showToast('Authentication required. Please log in again.', 'error');
            return;
        }

        try {
            setSubmitting(true);

            const formData = new FormData();
            formData.append('shift_name', shiftName.trim());
            formData.append('remark', remark.trim());

            // Add shift_id for edit mode
            if (isEditMode && editShiftId) {
                formData.append('shift_id', editShiftId);
                formData.append('action', 'update');
            }

            const validDays = dayList.filter(day =>
                day.from_time && day.to_time && day.shift_type
            );

            validDays.forEach(day => {
                formData.append('day_id[]', day.day_id);
                formData.append('from_time[]', day.from_time);
                formData.append('to_time[]', day.to_time);
                formData.append('shift_type[]', day.shift_type);

                const occasionalKey = `occasional_day_${day.day_id}`;
                formData.append(occasionalKey, day.occasional_days || '');
            });

            const response = await api.post('shift_create', formData);

            if (response.data.success) {
                const successMessage = isEditMode
                    ? 'Shift updated successfully! Redirecting...'
                    : 'Shift created successfully! Redirecting...';
                showToast(successMessage, 'success');
                setTimeout(() => {
                    navigate('/shift-management');
                }, 2000);
            } else {
                const errorMessage = isEditMode
                    ? 'Failed to update shift. Please try again.'
                    : 'Failed to create shift. Please try again.';
                showToast(response.data.message || errorMessage, 'error');
            }
        } catch (err) {
            console.error('Error submitting shift:', err);
            showToast('Network error. Please check your connection and try again.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        const loadingMessage = isEditMode
            ? "Loading shift details for editing..."
            : "Loading shift configuration...";
        return <LoadingSpinner message={loadingMessage} />;
    }

    if (!permissions['shift_edit'] && isEditMode) {
        navigate('/unauthorized')
    }
    return (
        <div className="min-h-screen bg-gradient-to-br from-[var(--color-bg-gradient-start)] to-[var(--color-bg-secondary)]">
            <div className="p-8 mx-auto px-4 py-8">
                {/* Enhanced Header */}
                <div className="bg-[var(--color-bg-secondary)] rounded-2xl shadow-xl mb-8 overflow-hidden">
                    <div className="bg-gradient-to-r from-[var(--color-primary-dark)] to-[var(--color-primary-darker)] p-8">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/shift-management')}
                                className="flex items-center gap-2 text-[var(--color-text-white)] hover:text-[var(--color-text-white)] transition-colors bg-[var(--color-bg-secondary-20)] hover:bg-[var(--color-bg-secondary-30)] px-4 py-2 rounded-lg backdrop-blur-sm"
                            >
                                <ArrowLeft size={18} />
                                Back
                            </button>
                            <div className="flex items-center gap-3">
                                <div>
                                    <h1 className="text-2xl font-bold text-[var(--color-text-white)]">
                                        {isEditMode ? 'Edit Shift Configuration' : 'Create New Shift'}
                                    </h1>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Enhanced Weekly Schedule Configuration */}
                    <div className="bg-[var(--color-bg-secondary)] backdrop-blur-sm rounded-2xl border border-slate-200 shadow-lg">
                        {/* Enhanced Basic Information */}
                        <div className="px-8 py-6 border-b border-slate-200 bg-gradient-to-r from-[var(--color-bg-primary)] to-[var(--color-bg-secondary)] rounded-t-2xl">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] rounded-xl flex items-center justify-center">
                                    <Settings className="w-5 h-5 text-[var(--color-text-white)]" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">Basic Information</h2>
                                </div>
                                {isEditMode && (
                                    <span className="ml-auto px-3 py-1.5 text-xs font-semibold bg-orange-100 text-orange-800 rounded-full border border-orange-200">
                                        Editing Mode
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="p-8">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div>
                                    <label className="block text-sm font-semibold text-[var(--color-text-secondary)] mb-3">
                                        Shift Name <span className="text-[var(--color-error)]">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={shiftName}
                                        onChange={(e) => setShiftName(e.target.value)}
                                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] transition-all duration-200 shadow-sm bg-[var(--color-bg-secondary)]"
                                        placeholder="Enter a descriptive shift name"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-[var(--color-text-secondary)] mb-3">
                                        Remarks
                                    </label>
                                    <textarea
                                        value={remark}
                                        onChange={(e) => setRemark(e.target.value)}
                                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] transition-all duration-200 shadow-sm bg-[var(--color-bg-secondary)] resize-none"
                                        rows={1}
                                        placeholder="Add any additional notes or remarks about this shift"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Weekly Schedule Header */}
                        <div className="px-8 py-6 border-t border-slate-200 bg-gradient-to-r from-[var(--color-bg-primary)] to-[var(--color-bg-secondary)]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] rounded-xl flex items-center justify-center">
                                    <Calendar className="w-5 h-5 text-[var(--color-text-white)]" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">Weekly Schedule Configuration</h2>
                                </div>
                            </div>
                        </div>

                        {/* Weekly Schedule Content */}
                        <div className="p-8">
                            <div className="space-y-6">
                                {dayList.map((day) => {
                                    const isOccasionalType = day.shift_type === "3";
                                    const selectedOccasionalDays = day.occasional_days ? day.occasional_days.split(',').filter(id => id) : [];

                                    return (
                                        <div key={day.day_id} className="bg-[var(--color-bg-secondary)] rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300">
                                            {/* Day Header */}
                                            <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-[var(--color-bg-primary)] to-[var(--color-bg-secondary)] rounded-t-2xl">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div
                                                            className={`px-6 py-3 rounded-lg flex items-center justify-center font-semibold text-white shadow-md transition-all duration-200 hover:shadow-lg ${day.day_name.toLowerCase() === 'sunday'
                                                                ? 'bg-gradient-to-r from-[var(--color-error)] to-[var(--color-error-dark)] hover:from-[var(--color-error-dark)] hover:to-[var(--color-error-darker)]'
                                                                : 'bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] hover:from-[var(--color-primary-dark)] hover:to-[var(--color-primary-darker)]'
                                                                }`}
                                                        >
                                                            {day.day_name}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <CopyDropdown
                                                            dayList={dayList}
                                                            onCopy={handleCopyConfiguration}
                                                            sourceDay={day.day_name}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Day Content */}
                                            <div className="p-8">
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                    {/* From Time */}
                                                    <div className="space-y-2">
                                                        <label className="block text-sm font-semibold text-[var(--color-text-secondary)]">
                                                            From Time
                                                        </label>
                                                        <div className="relative">
                                                            <TimeSelector
                                                                value={day.from_time}
                                                                onChange={(value) => handleDayChange(day.day_id, 'from_time', value)}
                                                                label=""
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* To Time */}
                                                    <div className="space-y-2">
                                                        <label className="block text-sm font-semibold text-[var(--color-text-secondary)]">
                                                            To Time
                                                        </label>
                                                        <div className="relative">
                                                            <TimeSelector
                                                                value={day.to_time}
                                                                onChange={(value) => handleDayChange(day.day_id, 'to_time', value)}
                                                                label=""
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Shift Type */}
                                                    <div className="space-y-2">
                                                        <label className="block text-sm font-semibold text-[var(--color-text-secondary)]">
                                                            Shift Type
                                                        </label>
                                                        <div className="relative">
                                                            <select
                                                                value={day.shift_type}
                                                                onChange={(e) => handleDayChange(day.day_id, 'shift_type', e.target.value)}
                                                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] transition-all duration-200 text-sm bg-[var(--color-bg-secondary)] shadow-sm hover:border-slate-400"
                                                            >
                                                                <option value="">Select Type</option>
                                                                {shiftTypes.map(type => (
                                                                    <option key={type.shift_type_id} value={type.shift_type_id}>
                                                                        {type.shift_type_name}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Occasional Days Section */}
                                                {isOccasionalType && (
                                                    <div className="mt-6 pt-6 border-t border-slate-200">
                                                        <div className="space-y-4">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-2 h-2 bg-[var(--color-primary-lightest)]0 rounded-full"></div>
                                                                <label className="text-sm font-semibold text-[var(--color-text-secondary)]">
                                                                    Occasional Days <span className="text-[var(--color-error)]">*</span>
                                                                </label>
                                                            </div>
                                                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                                                                <div className="max-h-40 overflow-y-auto">
                                                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                                                        {occasionalDayList.map(occasionalDay => {
                                                                            const isSelected = selectedOccasionalDays.includes(occasionalDay.occasional_day_id);
                                                                            return (
                                                                                <label
                                                                                    key={occasionalDay.occasional_day_id}
                                                                                    className={`flex items-center px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 text-sm ${isSelected
                                                                                        ? 'bg-[var(--color-primary-lighter)] border-2 border-primary-300 text-[var(--color-primary-darkest)] shadow-sm'
                                                                                        : 'bg-[var(--color-bg-secondary)] border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                                                                        }`}
                                                                                >
                                                                                    <input
                                                                                        type="checkbox"
                                                                                        checked={isSelected}
                                                                                        onChange={(e) => handleOccasionalDayChange(
                                                                                            day.day_id,
                                                                                            occasionalDay.occasional_day_id,
                                                                                            e.target.checked
                                                                                        )}
                                                                                        className="w-4 h-4 text-[var(--color-primary-dark)] border-slate-300 rounded focus:ring-[var(--color-primary)] focus:ring-2 mr-2"
                                                                                    />
                                                                                    <span className="font-medium truncate">
                                                                                        {occasionalDay.occasional_day_name}
                                                                                    </span>
                                                                                </label>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>

                                                                {/* Selection Counter */}
                                                                {selectedOccasionalDays.length > 0 && (
                                                                    <div className="mt-4 pt-3 border-t border-slate-200">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="w-2 h-2 bg-[var(--color-success-light)]0 rounded-full animate-pulse"></div>
                                                                            <span className="text-sm font-medium text-green-700">
                                                                                {selectedOccasionalDays.length} day{selectedOccasionalDays.length > 1 ? 's' : ''} selected
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Warning Message for Occasional Days */}
                                                {isOccasionalType && selectedOccasionalDays.length === 0 && (
                                                    <div className="mt-4 bg-[var(--color-primary-lightest)] border border-[var(--color-primary-light)] rounded-xl p-4">
                                                        <div className="flex items-start gap-3">
                                                            <div className="flex-shrink-0">
                                                                <AlertCircle className="w-5 h-5 text-[var(--color-primary-dark)] mt-0.5" />
                                                            </div>
                                                            <div>
                                                                <h4 className="text-sm font-semibold text-[var(--color-primary-darkest)]">Selection Required</h4>
                                                                <p className="text-sm text-[var(--color-primary-darker)] mt-1">Please select at least one occasional day for this shift type.</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Enhanced Action Buttons */}
                    <div className="bg-[var(--color-bg-secondary)] backdrop-blur-sm rounded-2xl border border-slate-200 shadow-lg">
                        <div className="p-8">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                </div>

                                <div className="flex items-center gap-4">
                                    <button
                                        type="button"
                                        onClick={() => navigate('/shift-management')}
                                        disabled={submitting}
                                        className="px-6 py-3 border border-[var(--color-border-secondary)] text-[var(--color-text-secondary)] rounded-lg hover:bg-[var(--color-bg-primary)] transition-colors font-medium"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="px-8 py-3 bg-gradient-to-r from-[var(--color-primary-dark)] to-[var(--color-primary-darker)] text-[var(--color-text-white)] rounded-xl hover:from-[var(--color-primary-darker)] hover:to-[var(--color-primary-darkest)] focus:ring-2 focus:ring-[var(--color-primary)] focus:outline-none transition-all duration-200 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <div className="flex items-center gap-2">
                                            {submitting ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-[var(--color-border-primary)] rounded-full animate-spin border-t-white"></div>
                                                    {isEditMode ? 'Updating...' : 'Creating...'}
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="w-4 h-4" />
                                                    {isEditMode ? 'Update Shift' : 'Create Shift'}
                                                </>
                                            )}
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>


                {/* Toast Notification */}
                {toast && (
                    <Toast
                        message={toast.message}
                        type={toast.type}
                        onClose={closeToast}
                    />
                )}
            </div>
        </div>
    );
};

export default CreateShift;