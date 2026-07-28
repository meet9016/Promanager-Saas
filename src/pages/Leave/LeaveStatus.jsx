import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSelector } from 'react-redux';
import api from '../../api/axiosInstance';
import { Toast } from '../../Components/ui/Toast';
import LoadingSpinner from "../../Components/Loader/LoadingSpinner"
import { Table, TableHeader, TableBody, TableRow, TableHeaderRow, Th, Td } from '../../Components/ui/Table';
import CustomDatePicker from '../../Components/comman/CustomDatePicker';
import CustomInput from '../../Components/comman/CustomInput';
import CustomSelect from '../../Components/comman/CustomSelect';
import NoDataFound from '../../Components/comman/NoDataFound';
import CustomCheckbox from '../../Components/comman/CustomCheckbox';

// Lucide React Icons
import {
    Clock,
    CheckCircle,
    XCircle,
    Calendar,
    Eye,
    RefreshCw,
    Search,
    Users,
    ChevronDown,
    ChevronUp,
    ChevronLeft,
    ChevronRight,
    FileText,
    AlertCircle,
    Plus,
    X,
    User,
    CalendarDays,
    Timer,
    MessageSquare,
    AlertTriangle,
    ArrowLeft,
    Mail,
    Building,
    Badge,
    Ban
} from 'lucide-react';

const SORT_DIRECTIONS = {
    ASCENDING: 'ascending',
    DESCENDING: 'descending'
};

const COLUMN_KEYS = {
    NAME: 'name',
    LEAVE_TYPE: 'leave_type',
    START_DATE: 'start_date',
    END_DATE: 'end_date',
    TOTAL_DAYS: 'total_days',
    STATUS: 'status'
};

const KEY_MAPPING = {
    [COLUMN_KEYS.NAME]: 'full_name',
    [COLUMN_KEYS.LEAVE_TYPE]: 'leave_type',
    [COLUMN_KEYS.START_DATE]: 'start_date',
    [COLUMN_KEYS.END_DATE]: 'end_date',
    [COLUMN_KEYS.TOTAL_DAYS]: 'total_days',
    [COLUMN_KEYS.STATUS]: 'status'
};

// Updated STATUS_CONFIG with proper dark/light mode support
const STATUS_CONFIG = {
    '1': {
        name: 'Pending',
        icon: Clock,
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-800',
        tabColor: 'text-yellow-700 ',
        borderColor: 'border-yellow-300 '
    },
    '2': {
        name: 'Approved',
        icon: CheckCircle,
        bgColor: 'bg-green-100 ',
        textColor: 'text-green-800 ',
        tabColor: 'text-green-700 ',
        borderColor: 'border-green-300 '
    },
    '3': {
        name: 'Rejected',
        icon: XCircle,
        bgColor: 'bg-red-100 ',
        textColor: 'text-red-800 ',
        tabColor: 'text-red-700 ',
        borderColor: 'border-red-300 '
    },
    '4': {
        name: 'Cancelled',
        icon: Ban,
        bgColor: 'bg-gray-100 ',
        textColor: 'text-gray-800 ',
        tabColor: 'text-gray-700 ',
        borderColor: 'border-gray-300 '
    }
};

// Updated StatusChip component for better visibility
const StatusChip = ({ status }) => {
    const config = STATUS_CONFIG[status];
    if (!config) return null;

    const Icon = config.icon;

    return (
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor} ${config.borderColor} border`}>
            <Icon className="w-3 h-3 mr-1" />
            {config.name}
        </div>
    );
};

const LeaveManagement = () => {
    const { user, isAuthenticated, logout } = useAuth();
    const permissions = useSelector(state => state.permissions) || {};
    const navigate = useNavigate();

    // State management
    const [leaveRequests, setLeaveRequests] = useState([]);
    const [filteredRequests, setFilteredRequests] = useState([]);
    const [selectedStatus, setSelectedStatus] = useState('1');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState({
        key: null,
        direction: SORT_DIRECTIONS.ASCENDING
    });

    // Modal states
    const [rejectionModal, setRejectionModal] = useState({
        isOpen: false,
        leaveData: null,
        reason: ''
    });
    const [cancelModal, setCancelModal] = useState({
        isOpen: false,
        leaveData: null,
        reason: ''
    });
    const [viewModal, setViewModal] = useState({
        isOpen: false,
        leaveData: null
    });
    const [approvalModal, setApprovalModal] = useState({
        isOpen: false,
        leaveId: null
    });

    // ====== ADD LEAVE POPUP STATES (From LeaveApplication) ======
    const [addLeaveModal, setAddLeaveModal] = useState({
        isOpen: false
    });

    // Animation state for smooth popup
    const [showAddLeaveModal, setShowAddLeaveModal] = useState(false);

    const [leaveFormData, setLeaveFormData] = useState({
        user_id: '',
        employee_id: '',
        leave_type: '',
        start_date: '',
        end_date: '',
        reason: ''
    });

    const [employees, setEmployees] = useState([]);
    const [leaveTypes, setLeaveTypes] = useState([]);
    const [employeeSearch, setEmployeeSearch] = useState('');
    const [selectedEmployeeName, setSelectedEmployeeName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [selectedDates, setSelectedDates] = useState([]);
    const [isPaidMap, setIsPaidMap] = useState({});
    const [calendarData, setCalendarData] = useState(null);
    const [calendarLoading, setCalendarLoading] = useState(false);
    const [leaveBalanceData, setLeaveBalanceData] = useState(null);

    // Toast state
    const [toast, setToast] = useState({
        show: false,
        message: '',
        type: 'success'
    });

    // Date parsing and formatting functions - moved to top level
    const parseDate = useCallback((dateString) => {
        if (!dateString) return new Date(0);
        const [day, month, year] = dateString.split('-');
        return new Date(year, month - 1, day);
    }, []);

    const formatDate = useCallback((dateString) => {
        try {
            const date = parseDate(dateString);
            return date.toLocaleDateString('en-GB');
        } catch (error) {
            return dateString;
        }
    }, [parseDate]);

    // Toast functions
    const showToast = useCallback((message, type = 'success') => {
        setToast({ show: true, message, type });
    }, []);

    const hideToast = useCallback(() => {
        setToast(prev => ({ ...prev, show: false }));
    }, []);

    // Fetch leave requests
    const fetchLeaveRequests = useCallback(async (status = selectedStatus) => {
        if (!user?.user_id) {
            setError('User ID not available');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const formData = new FormData();
            formData.append('status', status);

            const response = await api.post('/leave_list', formData);

            if (response.data.success) {
                setLeaveRequests(response.data.data || []);
            } else {
                throw new Error(response.data.message || 'Failed to fetch leave requests');
            }
        } catch (error) {
            console.error("Fetch leave requests error:", error);
            const errorMessage = error.response?.data?.message || error.message || "An unexpected error occurred";

            if (error.response?.status === 401) {
                setError("Your session has expired. Please login again.");
                setTimeout(() => logout?.(), 2000);
            } else if (error.response?.status === 403) {
                setError("You don't have permission to view leave requests.");
            } else if (error.response?.status >= 500) {
                setError("Server error. Please try again later.");
            } else {
                setError(errorMessage);
            }
            showToast(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    }, [user, selectedStatus, logout, showToast]);

    // ====== ADD LEAVE POPUP FUNCTIONS (From LeaveApplication) ======

    // Set user_id from auth context
    useEffect(() => {
        if (user && user.user_id) {
            setLeaveFormData(prev => ({ ...prev, user_id: user.user_id }));
        }
    }, [user]);

    // Fetch employees and leave types for popup
    const fetchEmployees = useCallback(async () => {
        try {
            if (!user?.user_id) return;

            const formDataToSend = new FormData();
            const response = await api.post('/assign_shift_list_drop_down', formDataToSend);

            if (response.data.success && response.data.data.employee_list) {
                setEmployees(response.data.data.employee_list);
            }
        } catch (error) {
            console.error('Error fetching employees:', error);
            showToast(error.message || 'Failed to fetch employee list', 'error');
        }
    }, [user, showToast]);

    const fetchLeaveTypes = useCallback(async () => {
        try {
            const response = await api.post('/leave_type_drop_down');

            if (response.data.success && response.data.data.leave_type_list) {
                const leaveTypeData = response.data.data.leave_type_list || [];
                setLeaveTypes(Array.isArray(leaveTypeData) ? leaveTypeData : []);
            } else {
                setLeaveTypes([]);
            }
        } catch (error) {
            console.error('Error fetching leave types:', error);
            setLeaveTypes([]);
            showToast(error.message || 'Failed to fetch leave types', 'error');
        }
    }, [showToast]);

    // Fetch leave calendar data for selected employee
    const fetchLeaveCalendar = useCallback(async (employeeId) => {
        if (!employeeId) return;
        setCalendarLoading(true);
        setCalendarData(null);
        setSelectedDates([]);
        setIsPaidMap({});
        try {
            const formData = new FormData();
            formData.append('employee_id', employeeId);
            const response = await api.post('/leave_calendar', formData);
            if (response.data.success) {
                setCalendarData(response.data.data || null);
            }
        } catch (error) {
            console.error('Error fetching leave calendar:', error);
        } finally {
            setCalendarLoading(false);
        }
    }, []);

    // Fetch leave balance data for selected employee
    const fetchLeaveBalance = useCallback(async (employeeId) => {
        if (!employeeId) return;
        setLeaveBalanceData(null);
        try {
            const formData = new FormData();
            formData.append('employee_id', employeeId);
            const response = await api.post('/employee_leave_balance', formData);
            if (response.data.success) {
                setLeaveBalanceData(response.data.data || null);
            }
        } catch (error) {
            console.error('Error fetching leave balance:', error);
        }
    }, []);

    // Open Add Leave Popup - SMOOTH ANIMATION
    const handleOpenAddLeave = useCallback(async () => {
        // First set the modal data state
        setAddLeaveModal({ isOpen: true });
        setIsLoadingData(true);

        // Reset form
        setLeaveFormData({
            user_id: user?.user_id || '',
            employee_id: '',
            leave_type: '',
            start_date: '',
            end_date: '',
            reason: ''
        });
        setSelectedEmployeeName('');
        setEmployeeSearch('');
        setSelectedDates([]);
        setIsPaidMap({});
        setCalendarData(null);

        // Fetch data
        await Promise.all([fetchEmployees(), fetchLeaveTypes()]);
        setIsLoadingData(false);

        // Trigger the animation after data is loaded
        requestAnimationFrame(() => {
            setShowAddLeaveModal(true);
        });
    }, [user, fetchEmployees, fetchLeaveTypes]);

    // Close Add Leave Popup - SMOOTH ANIMATION
    const handleCloseAddLeave = useCallback(() => {
        // First animate out
        setShowAddLeaveModal(false);

        // Then remove from DOM after animation completes
        setTimeout(() => {
            setAddLeaveModal({ isOpen: false });
        }, 300);
    }, []);

    // Handle leave form change
    const handleLeaveFormChange = useCallback((e) => {
        const { name, value } = e.target;
        setLeaveFormData(prev => ({ ...prev, [name]: value }));
    }, []);

    // Handle employee select
    const handleEmployeeSelect = useCallback((e) => {
        const selectedEmployee = employees.find(
            (employee) => String(employee.employee_id) === String(e.target.value)
        );

        if (!selectedEmployee) return;

        setLeaveFormData(prev => ({
            ...prev,
            employee_id: selectedEmployee.employee_id,
        }));

        setSelectedEmployeeName(selectedEmployee.full_name);
        setEmployeeSearch(selectedEmployee.full_name);

        // Fetch calendar data for selected employee
        fetchLeaveCalendar(selectedEmployee.employee_id);
        fetchLeaveBalance(selectedEmployee.employee_id);
    }, [employees, fetchLeaveCalendar, fetchLeaveBalance]);

    // Format date for API
    const formatDateForAPI = useCallback((dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    }, []);

    // Handle start date change
    const handleStartDateChange = useCallback((date) => {
        setLeaveFormData(prev => ({
            ...prev,
            start_date: date,
            end_date: prev.end_date && date && prev.end_date < date ? '' : prev.end_date
        }));
    }, []);

    // Handle end date change
    const handleEndDateChange = useCallback((date) => {
        setLeaveFormData(prev => ({
            ...prev,
            end_date: date
        }));
    }, []);

    // Reset leave form
    const resetLeaveForm = useCallback(() => {
        setLeaveFormData({
            user_id: user?.user_id || '',
            employee_id: '',
            leave_type: '',
            start_date: '',
            end_date: '',
            reason: ''
        });
        setSelectedEmployeeName('');
        setEmployeeSearch('');
        setSelectedDates([]);
        setIsPaidMap({});
        setCalendarData(null);
        setLeaveBalanceData(null);
    }, [user]);

    // Validate and toggle paid leave status
    const handlePaidToggle = useCallback((dateStr, isChecked) => {
        if (!isChecked) {
            setIsPaidMap(prev => ({ ...prev, [dateStr]: 2 }));
            return;
        }

        // Validate if we can set it to paid based on leaveBalanceData
        if (leaveBalanceData && leaveBalanceData.month_wise) {
            const [day, month, year] = dateStr.split('/');
            const monthKey = `${year}-${month}`; // matches API format e.g. "2026-07"

            const monthData = leaveBalanceData.month_wise.find(m => m.month === monthKey);

            if (monthData) {
                const remaining = parseInt(monthData.remaining_paid_leave || '0', 10);

                // Count how many currently selected dates are marked as paid in this month
                let currentPaidCountForMonth = 0;
                selectedDates.forEach(d => {
                    if (isPaidMap[d] === 1 && d.endsWith(`/${month}/${year}`)) {
                        currentPaidCountForMonth++;
                    }
                });

                if (currentPaidCountForMonth >= remaining) {
                    showToast(`You have only ${remaining} paid leave(s) remaining for ${monthKey}`, 'error');
                    return; // Prevent checking
                }
            }
        }

        setIsPaidMap(prev => ({ ...prev, [dateStr]: 1 }));
    }, [leaveBalanceData, selectedDates, isPaidMap, showToast]);

    // Submit leave form
    const handleSubmitLeave = useCallback(async (e) => {
        e.preventDefault();

        if (!leaveFormData.employee_id) {
            showToast('Please select an employee', 'error');
            return;
        }

        if (selectedDates.length === 0) {
            showToast('Please select at least one date', 'error');
            return;
        }

        setIsSubmitting(true);

        try {
            const submitData = new FormData();
            submitData.append('employee_id', leaveFormData.employee_id);
            submitData.append('leave_type', leaveFormData.leave_type);

            const earliestDate = selectedDates[0];
            const latestDate = selectedDates[selectedDates.length - 1];

            const formatDDMMYYYY = (dateStr) => {
                if (!dateStr) return '';
                return dateStr.replace(/\//g, '-');
            };

            // submitData.append('start_date', formatDDMMYYYY(earliestDate));
            // submitData.append('end_date', formatDDMMYYYY(latestDate));
            submitData.append('reason', leaveFormData.reason);

            // Add leave_dates and is_paid arrays to FormData
            // Default is unpaid (2), checked = paid (1)
            selectedDates.forEach((date, index) => {
                const formattedDate = formatDDMMYYYY(date);
                const isPaidVal = isPaidMap[date] === 1 ? 1 : 2;
                submitData.append(`leave_dates[${index}]`, formattedDate);
                submitData.append(`is_paid[${index}]`, isPaidVal);
            });

            const response = await api.post('/add_leave', submitData);

            if (response.data.success === false) {
                // API returned success: false - show error toast, keep popup open
                showToast(response.data.message || 'Failed to submit leave request', 'error');
                return;
            }

            showToast(response.data.message || 'Leave request submitted successfully!', 'success');

            // Reset form and close popup only on actual success
            resetLeaveForm();
            handleCloseAddLeave();

            // Refresh leave list
            fetchLeaveRequests();

        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to submit leave request', 'error');
        } finally {
            setIsSubmitting(false);
        }
    }, [leaveFormData, showToast, resetLeaveForm, handleCloseAddLeave, fetchLeaveRequests, selectedDates, isPaidMap]);

    // Get today's date at midnight for comparison
    const today = useMemo(() => {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        return date;
    }, []);

    // Search and filter effect
    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            const filtered = leaveRequests.filter(leave => {
                return Object.values(leave).some(value =>
                    String(value).toLowerCase().includes(searchQuery.toLowerCase())
                );
            });
            setFilteredRequests(filtered);
        }, 300);

        return () => clearTimeout(delayDebounce);
    }, [searchQuery, leaveRequests]);

    // Initial data fetch
    useEffect(() => {
        if (isAuthenticated() && user?.user_id) {
            fetchLeaveRequests();
        }
    }, [isAuthenticated, fetchLeaveRequests, user?.user_id, selectedStatus]);

    // Sorting functionality
    const requestSort = useCallback((key) => {
        setSortConfig(prevConfig => {
            const direction = prevConfig.key === key && prevConfig.direction === SORT_DIRECTIONS.ASCENDING
                ? SORT_DIRECTIONS.DESCENDING
                : SORT_DIRECTIONS.ASCENDING;
            return { key, direction };
        });
    }, []);

    // Memoized sorted leave requests
    const sortedLeaveRequests = useMemo(() => {
        const source = searchQuery ? filteredRequests : leaveRequests;

        if (!sortConfig.key) return source;

        return [...source].sort((a, b) => {
            const actualKey = KEY_MAPPING[sortConfig.key] || sortConfig.key;
            let aValue = a[actualKey] || '';
            let bValue = b[actualKey] || '';

            // Special handling for dates
            if (sortConfig.key === COLUMN_KEYS.START_DATE || sortConfig.key === COLUMN_KEYS.END_DATE) {
                aValue = parseDate(aValue);
                bValue = parseDate(bValue);
            }

            if (aValue < bValue) {
                return sortConfig.direction === SORT_DIRECTIONS.ASCENDING ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === SORT_DIRECTIONS.ASCENDING ? 1 : -1;
            }
            return 0;
        });
    }, [leaveRequests, filteredRequests, sortConfig, searchQuery, parseDate]);

    // Action handlers
    const handleTabChange = useCallback((status) => {
        setSelectedStatus(status);
        setSortConfig({ key: null, direction: SORT_DIRECTIONS.ASCENDING });
        setSearchQuery('');
    }, []);

    const handleView = useCallback((leave) => {
        setViewModal({
            isOpen: true,
            leaveData: { ...leave, totalDays: leave.total_days }
        });
    }, []);

    const handleApprove = useCallback(async (leaveId) => {
        if (!user?.user_id) {
            showToast('User authentication required', 'error');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('status', '2');
            formData.append('leave_id', leaveId);
            formData.append('reject_reason', '');

            const response = await api.post('/change_leave_status', formData);

            if (response.data.success) {
                showToast('Leave request approved successfully!', 'success');
                fetchLeaveRequests();
            } else {
                showToast(response.data.message || 'Failed to approve leave request', 'error');
            }
        } catch (error) {
            console.error("Error approving leave request:", error);
            showToast('Failed to approve leave request. Please try again.', 'error');
        }
    }, [user, showToast, fetchLeaveRequests]);

    const handleReject = useCallback((leave) => {
        setRejectionModal({
            isOpen: true,
            leaveData: leave,
            reason: ''
        });
    }, []);

    const submitRejection = useCallback(async () => {
        if (!user?.user_id) {
            showToast('User authentication required', 'error');
            return;
        }

        if (!rejectionModal.reason.trim()) {
            showToast('Please provide a reason for rejection.', 'warning');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('status', '3');
            formData.append('leave_id', rejectionModal.leaveData.leave_id);
            formData.append('reject_reason', rejectionModal.reason);

            const response = await api.post('/change_leave_status', formData);

            if (response.data.success) {
                showToast('Leave request rejected successfully!', 'success');
                setRejectionModal({ isOpen: false, leaveData: null, reason: '' });
                fetchLeaveRequests();
            } else {
                showToast(response.data.message || 'Failed to reject leave request', 'error');
            }
        } catch (error) {
            console.error("Error rejecting leave request:", error);
            showToast('Failed to reject leave request. Please try again.', 'error');
        }
    }, [user, rejectionModal, showToast, fetchLeaveRequests]);

    const submitCancel = useCallback(async () => {
        if (!user?.user_id) {
            showToast('User authentication required', 'error');
            return;
        }

        if (!cancelModal.reason.trim()) {
            showToast('Please provide a reason for cancellation.', 'warning');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('leave_id', cancelModal.leaveData.leave_id);
            formData.append('cancel_reason', cancelModal.reason);

            const response = await api.post('/cancel_leave', formData);

            if (response.data.success) {
                showToast('Leave request cancelled successfully!', 'success');
                setCancelModal({ isOpen: false, leaveData: null, reason: '' });
                setViewModal({ isOpen: false, leaveData: null });
                fetchLeaveRequests();
            } else {
                showToast(response.data.message || 'Failed to cancel leave request', 'error');
            }
        } catch (error) {
            console.error("Error cancelling leave request:", error);
            showToast('Failed to cancel leave request. Please try again.', 'error');
        }
    }, [user, cancelModal, showToast, fetchLeaveRequests]);

    // Render sort icon
    const renderSortIcon = useCallback((key) => {
        if (sortConfig.key !== key) {
            return <ChevronDown className="ml-1 h-4 w-4 text-[var(--color-text-muted)]" />;
        }
        return sortConfig.direction === SORT_DIRECTIONS.ASCENDING ?
            <ChevronUp className="ml-1 h-4 w-4 text-[var(--color-primary)]" /> :
            <ChevronDown className="ml-1 h-4 w-4 text-[var(--color-primary)]" />;
    }, [sortConfig]);

    // Redirect if not authenticated
    if (!isAuthenticated()) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="h-[calc(100vh-64px)] overflow-hidden bg-[var(--color-bg-primary)]">
            <div className="p-8  mx-auto">
                <div className="bg-[var(--color-bg-secondary)] h-[87vh] rounded-xl border border-[var(--color-border-primary)] overflow-hidden shadow-custom">
                    {/* Header section with tabs */}
                    <div className="px-6 py-4 border-b border-[var(--color-border-primary)] bg-[var(--color-primary-lighter)] ">
                        <div className="flex justify-between items-center ">
                            <div className="flex items-center">
                                <FileText className="h-6 w-6 text-[var(--color-primary-darker)] mr-2" />
                                <h3 className="text-lg font-semibold text-[var(--color-primary-darker)]">Leave Requests</h3>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="relative w-full sm:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)] z-10" />
                                    <CustomInput
                                        type="text"
                                        name="searchQuery"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search leave requests..."
                                        clearable={true}
                                        className="!h-[37px] [&_input]:!h-[37px] [&_input]:!pl-10 [&_input]:!pr-4 [&_input]:!rounded-lg"
                                    />
                                </div>

                                {permissions['leave_create'] && (
                                    <button
                                        onClick={handleOpenAddLeave}
                                        className="flex items-center gap-2 bg-white text-[var(--color-primary-darker)] px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Add Leave
                                    </button>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* Status Tabs */}
                    <div className="px-6 py-2 border-b border-[var(--color-border-primary)] bg-white">
                        <div className="flex space-x-2">
                            {Object.entries(STATUS_CONFIG).map(([statusValue, config]) => {
                                const IconComponent = config.icon;
                                return (
                                    <button
                                        key={statusValue}
                                        className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${selectedStatus === statusValue
                                            ? 'bg-[var(--color-primary-dark)] text-white shadow-sm border border-[var(--color-border-primary)]'
                                            : 'text-[var(--color-primary-darker)] hover:bg-[var(--color-bg-secondary)] border-[var(--color-border-primary)] border'
                                            }`}
                                        onClick={() => handleTabChange(statusValue)}
                                    >
                                        <IconComponent className="mr-2 h-4 w-4" />
                                        {config.name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    {/* Content section */}
                    {loading ? (
                        <div className="px-6 py-12 text-center">
                            <LoadingSpinner />
                        </div>
                    ) : error ? (
                        <div className="px-6 py-12 text-center">
                            <div className="bg-[var(--color-error-light)] border border-[var(--color-error)] rounded-xl p-8 max-w-md mx-auto">
                                <AlertCircle className="w-12 h-12 text-[var(--color-error)] mx-auto mb-4" />
                                <p className="text-[var(--color-error-dark)] text-lg font-semibold mb-2">Error Loading Leave Requests</p>
                                <p className="text-[var(--color-error-dark)] mb-4">{error}</p>
                                <button
                                    onClick={() => fetchLeaveRequests()}
                                    className="inline-flex items-center space-x-2 bg-[var(--color-error)] text-[var(--color-text-white)] px-4 py-2 rounded-lg hover:bg-[var(--color-error-dark)] transition-colors"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    <span>Try Again</span>
                                </button>
                            </div>
                        </div>
                    ) : leaveRequests.length === 0 ? (
                        <div className="bg-[#FBF9FD] flex items-center justify-center h-full">
                            <NoDataFound
                                title={`No ${STATUS_CONFIG[selectedStatus]?.name} Leave Requests`}
                                subtitle={`There are no leave requests with ${STATUS_CONFIG[selectedStatus]?.name.toLowerCase()} status.`}
                            />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table className="min-w-full divide-y divide-[var(--color-border-divider)]">
                                <TableHeader className="bg-[var(--color-primary-dark)]">
                                    <TableHeaderRow>
                                        {[
                                            { key: COLUMN_KEYS.NAME, label: 'Employee Name' },
                                            { key: COLUMN_KEYS.LEAVE_TYPE, label: 'Leave Type' },
                                            { key: COLUMN_KEYS.START_DATE, label: 'Start Date' },
                                            { key: COLUMN_KEYS.END_DATE, label: 'End Date' },
                                            { key: COLUMN_KEYS.TOTAL_DAYS, label: 'Total Days' },
                                            { key: COLUMN_KEYS.STATUS, label: 'Status' }
                                        ].map(({ key, label }) => (
                                            <Th key={`header-${key}`} className="px-6 py-3 text-left">
                                                <button
                                                    className="flex items-center font-semibold uppercase transition-colors"
                                                    onClick={() => requestSort(key)}
                                                >
                                                    {label}
                                                    {renderSortIcon(key)}
                                                </button>
                                            </Th>
                                        ))}
                                        <Th className="px-6 py-3 text-left font-semibold">
                                            Actions
                                        </Th>
                                    </TableHeaderRow>
                                </TableHeader>
                                <TableBody className="bg-[var(--color-bg-secondary)] divide-y divide-[var(--color-border-divider)]">
                                    {!sortedLeaveRequests || sortedLeaveRequests.length === 0 ? (
                                        <TableRow>
                                            <Td colSpan="8" className="py-4 text-center">
                                                <NoDataFound
                                                    title="No Leave Requests Found"
                                                    subtitle="Try adjusting your search or filters."
                                                />
                                            </Td>
                                        </TableRow>
                                    ) : (
                                        sortedLeaveRequests.map((leave, index) => {
                                            const leaveId = leave.leave_id || `leave-${index}`;
                                            return (
                                                <TableRow
                                                    key={`leave-${leaveId}`}
                                                    className="hover:bg-[var(--color-bg-hover)] transition-colors"
                                                >
                                                    <Td className="px-6 py-4 text-left whitespace-nowrap text-[var(--color-text-primary)]">
                                                        <div className="flex items-center space-x-3">
                                                            <div className="w-8 h-8 bg-[var(--color-primary-lighter)] rounded-full flex items-center justify-center">
                                                                <Users className="w-4 h-4 text-[var(--color-primary-dark)]" />
                                                            </div>
                                                            <span className="font-medium text-sm">{leave.full_name || 'Unknown Employee'}</span>
                                                        </div>
                                                    </Td>
                                                    <Td className="px-6 py-4 text-left whitespace-nowrap text-sm text-[var(--color-text-secondary)]">
                                                        <span className="px-2 py-1 bg-[var(--color-bg-primary)] rounded-md text-xs font-medium">
                                                            {leave.leave_type || '--'}
                                                        </span>
                                                    </Td>
                                                    <Td className="px-6 py-4 text-left whitespace-nowrap text-sm text-[var(--color-text-secondary)]">
                                                        <div className="flex items-center">
                                                            <Calendar className="w-4 h-4 mr-2 text-[var(--color-text-muted)]" />
                                                            {formatDate(leave.start_date)}
                                                        </div>
                                                    </Td>
                                                    <Td className="px-6 py-4 text-left whitespace-nowrap text-sm text-[var(--color-text-secondary)]">
                                                        <div className="flex items-center">
                                                            <Calendar className="w-4 h-4 mr-2 text-[var(--color-text-muted)]" />
                                                            {formatDate(leave.end_date)}
                                                        </div>
                                                    </Td>
                                                    <Td className="px-6 py-4 text-left whitespace-nowrap text-sm text-[var(--color-text-primary)]">
                                                        <span className="font-semibold">{leave.total_days || 0}</span>
                                                        <span className="text-[var(--color-text-muted)] ml-1 text-xs">days</span>
                                                    </Td>
                                                    <Td className="px-6 py-4 text-left whitespace-nowrap text-[var(--color-text-secondary)]">
                                                        <StatusChip status={leave.status} />
                                                    </Td>
                                                    <Td className="px-6 py-4 text-left whitespace-nowrap font-medium">
                                                        <div className="flex space-x-2">
                                                            <button
                                                                onClick={() => handleView(leave)}
                                                                className="w-9 h-9 flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:scale-110 hover:shadow-md transition-all duration-200"
                                                                title="View Details"
                                                            >
                                                                <Eye className="w-4 h-4" strokeWidth={2.5} />
                                                            </button>
                                                        </div>
                                                    </Td>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>

                {/* Rejection Modal */}
                {rejectionModal.isOpen && (
                    <div className="fixed inset-0 bg-black/50  flex items-center justify-center p-4 z-50">
                        <div className="bg-[var(--color-bg-secondary)] rounded-xl shadow-2xl w-full max-w-md border border-[var(--color-border-primary)]">
                            <div className="p-8 border-b border-[var(--color-border-primary)] ">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-red-100  rounded-full flex items-center justify-center">
                                        <XCircle className="w-5 h-5 text-red-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Reject Leave Request</h2>
                                        <p className="text-sm text-[var(--color-text-secondary)]">Provide reason for rejection</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-8">
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                                        Rejection Reason *
                                    </label>
                                    <textarea
                                        className="w-full border border-[var(--color-border-secondary)] rounded-lg p-3 h-32 focus:ring-2 focus:ring-red-500 focus:border-red-500 text-[var(--color-text-primary)] bg-[var(--color-bg-secondary)] resize-none placeholder:text-[var(--color-text-muted)]"
                                        placeholder="Enter detailed reason for rejecting this leave request..."
                                        value={rejectionModal.reason}
                                        onChange={(e) => setRejectionModal(prev => ({ ...prev, reason: e.target.value }))}
                                    />
                                    <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                                        This reason will be visible to the employee
                                    </p>
                                </div>
                            </div>
                            <div className="p-4 bg-[var(--color-bg-primary)] flex justify-end space-x-3 rounded-b-xl border-t border-[var(--color-border-primary)]">
                                <button
                                    className="px-4 py-2 text-[var(--color-text-secondary)] bg-[var(--color-bg-secondary)] border border-[var(--color-border-secondary)] rounded-lg shadow-sm hover:bg-[var(--color-bg-hover)] transition-colors"
                                    onClick={() => setRejectionModal({ isOpen: false, leaveData: null, reason: '' })}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="px-4 py-2 text-white bg-red-600 hover:bg-red-700   border border-transparent rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={submitRejection}
                                    disabled={!rejectionModal.reason.trim()}
                                >
                                    Submit Rejection
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Cancel Modal */}
                {cancelModal.isOpen && (
                    <div className="fixed inset-0 bg-black/50  flex items-center justify-center p-4 z-50">
                        <div className="bg-[var(--color-bg-secondary)] rounded-xl shadow-2xl w-full max-w-md border border-[var(--color-border-primary)]">
                            <div className="p-8 border-b border-[var(--color-border-primary)] bg-[var(--color-primary-dark)]">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-[var(--color-primary-lighter)] rounded-full flex items-center justify-center">
                                        <Ban className="w-5 h-5 text-[var(--color-primary-dark)]" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-white">Cancel Leave Request</h2>
                                        <p className="text-sm text-white">Provide reason for cancellation</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-8">
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                                        Cancellation Reason *
                                    </label>
                                    <textarea
                                        className="w-full border border-[var(--color-border-secondary)] rounded-lg p-3 h-32 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] text-[var(--color-text-primary)] bg-[var(--color-bg-secondary)] resize-none placeholder:text-[var(--color-text-muted)]"
                                        placeholder="Enter detailed reason for cancelling this leave request..."
                                        value={cancelModal.reason}
                                        onChange={(e) => setCancelModal(prev => ({ ...prev, reason: e.target.value }))}
                                    />
                                    <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                                        This reason will be visible to the employee
                                    </p>
                                </div>
                            </div>
                            <div className="p-4 bg-[var(--color-bg-primary)] flex justify-end space-x-3 rounded-b-xl border-t border-[var(--color-border-primary)]">
                                <button
                                    className="px-4 py-2 text-[var(--color-text-secondary)] bg-[var(--color-bg-secondary)] border border-[var(--color-border-secondary)] rounded-lg shadow-sm hover:bg-[var(--color-bg-hover)] transition-colors"
                                    onClick={() => setCancelModal({ isOpen: false, leaveData: null, reason: '' })}
                                >
                                    Close
                                </button>
                                <button
                                    className="px-4 py-2 text-white bg-[var(--color-primary-dark)] hover:opacity-90 border border-transparent rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={submitCancel}
                                    disabled={!cancelModal.reason.trim()}
                                >
                                    Submit Cancellation
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Approval Modal */}
                {approvalModal.isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <div className="w-full max-w-md overflow-hidden rounded-2xl bg-[var(--color-bg-secondary)] shadow-2xl border border-[var(--color-border-primary)] animate-in fade-in zoom-in-95 duration-200">

                            {/* Header */}
                            <div className="relative bg-[var(--color-primary-dark)] px-6 py-6">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur">
                                        <CheckCircle className="h-7 w-7 text-white" />
                                    </div>

                                    <div>
                                        <h2 className="text-xl font-semibold text-white">
                                            Approve Leave
                                        </h2>
                                        <p className="text-sm text-green-100">
                                            Please confirm your action
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Body */}
                            <div className="px-6 py-8">
                                <div className="flex items-start gap-4">


                                    <div>
                                        <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                                            Approve this leave request?
                                        </h3>

                                        <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                                            This action will approve the employee's leave request.
                                            Once approved, the employee will be notified.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex justify-end gap-3 border-t border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] px-6 py-5">

                                <button
                                    onClick={() =>
                                        setApprovalModal({
                                            isOpen: false,
                                            leaveId: null,
                                        })
                                    }
                                    className="rounded-xl border border-[var(--color-border-secondary)] bg-[var(--color-bg-secondary)] px-5 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] transition-all duration-200 hover:bg-[var(--color-bg-hover)] hover:shadow"
                                >
                                    Cancel
                                </button>

                                <button
                                    onClick={() => {
                                        handleApprove(approvalModal.leaveId);
                                        setApprovalModal({
                                            isOpen: false,
                                            leaveId: null,
                                        });
                                    }}
                                    className="rounded-xl bg-[var(--color-primary-dark)] px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-200"
                                >
                                    Yes, Approve
                                </button>

                            </div>
                        </div>
                    </div>
                )}

                {/* View Modal Section */}
                {viewModal.isOpen && viewModal.leaveData && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden ">

                            {/* Header */}
                            <div className="bg-[var(--color-primary-dark)] px-6 py-5 flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center justify-center">
                                        <User className="w-5 h-5 text-white" strokeWidth={2} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white tracking-wide">Leave Request Details</h2>
                                        <p className="text-sm text-white/80 font-medium mt-0.5">Employee Information</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setViewModal({ isOpen: false, leaveData: null })}
                                    className="p-1 hover:bg-white/10 rounded-lg transition-all duration-200"
                                >
                                    <X className="w-5 h-5 text-white" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-8 overflow-y-auto flex-1 custom-scrollbar bg-white">

                                {/* Employee Info Card */}
                                <div className="bg-white rounded-xl shadow-sm border border-[var(--color-border-divider)] p-6 mb-6 flex items-center justify-between">
                                    <div className="flex items-center space-x-6">
                                        <div className="w-20 h-20 bg-[var(--color-primary-lightest)] rounded-full flex items-center justify-center shadow-inner">
                                            <User className="w-10 h-10 text-[var(--color-primary-dark)] fill-current opacity-80" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-[var(--color-text-secondary)] font-semibold mb-1 uppercase tracking-wider">Employee Name</p>
                                            <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-3">{viewModal.leaveData.full_name}</h3>

                                            <p className="text-xs text-[var(--color-text-secondary)] font-semibold mb-1 uppercase tracking-wider">Leave Type</p>
                                            <div className="inline-flex items-center px-3 py-1.5 bg-[#fbf9ff] text-[var(--color-primary-dark)] rounded-lg text-xs font-bold border border-[#ebdffc] shadow-sm">
                                                <Calendar className="w-3.5 h-3.5 mr-2" />
                                                {viewModal.leaveData.leave_type}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-[var(--color-text-secondary)] font-semibold mb-2 uppercase tracking-wider">Status</p>
                                        <StatusChip status={viewModal.leaveData.status} />
                                    </div>
                                </div>

                                {/* Stats Row */}
                                {(() => {
                                    const dates = viewModal.leaveData.leave_dates || [];
                                    const startDate = viewModal.leaveData.start_date || (dates.length > 0 ? dates[0].leave_date : '-');
                                    const endDate = viewModal.leaveData.end_date || (dates.length > 0 ? dates[dates.length - 1].leave_date : '-');
                                    const totalDays = viewModal.leaveData.total_days || dates.length;
                                    const paidDays = dates.filter(d => d.is_paid === "1").length;
                                    const unpaidDays = dates.filter(d => d.is_paid !== "1").length;

                                    return (
                                        <div className="flex bg-white rounded-xl shadow-sm border border-[var(--color-border-divider)] mb-6 py-4 md:py-5 divide-x divide-[var(--color-border-divider)] w-full overflow-hidden">
                                            <div className="flex flex-1 items-center justify-center gap-2 md:gap-4 px-2 md:px-4">
                                                <div className="hidden sm:flex w-10 h-10 md:w-12 md:h-12 rounded-xl bg-[#fbf9ff] items-center justify-center text-[var(--color-primary-dark)] border border-[#ebdffc] shrink-0">
                                                    <Calendar className="w-4 h-4 md:w-5 md:h-5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[10px] md:text-xs text-[var(--color-text-secondary)] font-semibold mb-0.5 md:mb-1 tracking-wide truncate">Start Date</p>
                                                    <p className="font-bold text-[var(--color-text-primary)] text-xs md:text-sm truncate">{startDate}</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-1 items-center justify-center gap-2 md:gap-4 px-2 md:px-4">
                                                <div className="hidden sm:flex w-10 h-10 md:w-12 md:h-12 rounded-xl bg-[#fbf9ff] items-center justify-center text-[var(--color-primary-dark)] border border-[#ebdffc] shrink-0">
                                                    <Calendar className="w-4 h-4 md:w-5 md:h-5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[10px] md:text-xs text-[var(--color-text-secondary)] font-semibold mb-0.5 md:mb-1 tracking-wide truncate">End Date</p>
                                                    <p className="font-bold text-[var(--color-text-primary)] text-xs md:text-sm truncate">{endDate}</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-1 items-center justify-center gap-2 md:gap-4 px-2 md:px-4">
                                                <div className="hidden sm:flex w-10 h-10 md:w-12 md:h-12 rounded-xl bg-blue-50 items-center justify-center text-blue-500 border border-blue-100 shrink-0">
                                                    <CalendarDays className="w-4 h-4 md:w-5 md:h-5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[10px] md:text-xs text-[var(--color-text-secondary)] font-semibold mb-0.5 md:mb-1 tracking-wide truncate">Total Days</p>
                                                    <p className="font-bold text-[var(--color-text-primary)] text-xs md:text-sm truncate">{totalDays} {totalDays === 1 ? 'Day' : 'Days'}</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-1 items-center justify-center gap-2 md:gap-4 px-2 md:px-4">
                                                <div className="hidden sm:flex w-10 h-10 md:w-12 md:h-12 rounded-xl bg-green-50 items-center justify-center text-green-500 border border-green-100 shrink-0">
                                                    <div className="w-5 h-5 md:w-6 md:h-6 rounded-[4px] border-2 border-current relative">
                                                        <div className="absolute top-1/2 right-0 w-2 h-1 md:w-2.5 md:h-1 bg-current -translate-y-1/2"></div>
                                                    </div>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[10px] md:text-xs text-[var(--color-text-secondary)] font-semibold mb-0.5 md:mb-1 tracking-wide truncate">Paid Days</p>
                                                    <p className="font-bold text-green-600 text-xs md:text-sm truncate">{paidDays} {paidDays === 1 ? 'Day' : 'Days'}</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-1 items-center justify-center gap-2 md:gap-4 px-2 md:px-4">
                                                <div className="hidden sm:flex w-10 h-10 md:w-12 md:h-12 rounded-xl bg-red-50 items-center justify-center text-red-500 border border-red-100 shrink-0">
                                                    <div className="w-5 h-5 md:w-6 md:h-6 rounded-[4px] border-2 border-current relative">
                                                        <div className="absolute top-1/2 right-0 w-2 h-1 md:w-2.5 md:h-1 bg-current -translate-y-1/2"></div>
                                                    </div>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[10px] md:text-xs text-[var(--color-text-secondary)] font-semibold mb-0.5 md:mb-1 tracking-wide truncate">Unpaid Days</p>
                                                    <p className="font-bold text-red-600 text-xs md:text-sm truncate">{unpaidDays} {unpaidDays === 1 ? 'Day' : 'Days'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* Leave Reason */}
                                {viewModal.leaveData.reason && (
                                    <div className="bg-[#faf7ff] border border-[#f3ebff] rounded-xl p-5 mb-6">
                                        <div className="flex items-center gap-2 mb-4">
                                            <FileText className="w-4 h-4 text-[var(--color-primary-dark)]" />
                                            <h4 className="text-sm font-bold text-[var(--color-primary-dark)]">Leave Reason</h4>
                                        </div>
                                        <p className="text-[var(--color-text-primary)] text-sm ml-6">{viewModal.leaveData.reason}</p>
                                    </div>
                                )}

                                {/* Additional Reasons (Rejection/Cancellation) */}
                                {viewModal.leaveData.status === '3' && viewModal.leaveData.reject_reason && (
                                    <div className="bg-red-50 border border-red-100 rounded-xl p-5 mb-6">
                                        <div className="flex items-center gap-2 mb-4">
                                            <FileText className="w-4 h-4 text-red-700" />
                                            <h4 className="text-sm font-bold text-red-700">Rejection Reason</h4>
                                        </div>
                                        <p className="text-red-900 text-sm ml-6">{viewModal.leaveData.reject_reason}</p>
                                    </div>
                                )}
                                {viewModal.leaveData.status === '4' && viewModal.leaveData.cancel_reason && (
                                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-6">
                                        <div className="flex items-center gap-2 mb-4">
                                            <FileText className="w-4 h-4 text-gray-700" />
                                            <h4 className="text-sm font-bold text-gray-700">Cancellation Reason</h4>
                                        </div>
                                        <p className="text-gray-900 text-sm ml-6">{viewModal.leaveData.cancel_reason}</p>
                                    </div>
                                )}

                                {/* Day Wise Details Section */}
                                {viewModal.leaveData.leave_dates?.length > 0 && (
                                    <div className="mb-2">
                                        <div className="flex items-center gap-2 mb-3">
                                            <CalendarDays className="w-5 h-5 text-[var(--color-primary-dark)]" />
                                            <h4 className="text-sm font-bold text-[var(--color-primary-dark)]">Day Wise Details</h4>
                                        </div>
                                        <div className="border border-[var(--color-border-divider)] rounded-xl overflow-hidden shadow-sm bg-white">
                                            <table className="w-full text-left text-sm">
                                                <thead className="bg-[var(--color-primary-dark)] text-white">
                                                    <tr>
                                                        <th className="px-6 py-4 font-semibold text-xs tracking-wider">Date</th>
                                                        <th className="px-6 py-4 font-semibold text-xs tracking-wider text-center w-[200px]">Paid / Unpaid Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-[var(--color-border-divider)] bg-white">
                                                    {viewModal.leaveData.leave_dates.map((d, i) => {
                                                        const dateStr = d.leave_date;
                                                        let displayDate = dateStr;
                                                        try {
                                                            const parts = dateStr.split('-');
                                                            if (parts.length === 3) {
                                                                const dt = new Date(parts[2], parts[1] - 1, parts[0]);
                                                                displayDate = dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' (' + dt.toLocaleDateString('en-US', { weekday: 'long' }) + ')';
                                                            }
                                                        } catch (e) { }

                                                        return (
                                                            <tr key={i} className="hover:bg-gray-50 transition-colors">
                                                                <td className="px-6 py-5 text-[var(--color-text-primary)] font-medium">
                                                                    {displayDate}
                                                                </td>
                                                                <td className="px-6 py-5 flex justify-center">
                                                                    {d.is_paid === "1" ? (
                                                                        <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-md text-xs font-bold border border-green-200">
                                                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                                                            Paid
                                                                        </span>
                                                                    ) : (
                                                                        <span className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-red-700 rounded-md text-xs font-bold border border-red-200">
                                                                            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                                                            Unpaid
                                                                        </span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="bg-white px-6 py-4 border-t border-[var(--color-border-divider)] flex justify-end items-center rounded-b-2xl">
                                <div className="flex space-x-4">
                                    {viewModal.leaveData.status === '1' && (
                                        <>
                                            {permissions['leave_approved'] && (
                                                <button
                                                    onClick={() => {
                                                        setViewModal({ isOpen: false, leaveData: null });
                                                        setApprovalModal({ isOpen: true, leaveId: viewModal.leaveData.leave_id });
                                                    }}
                                                    className="flex items-center px-6 py-2.5 text-sm font-bold text-white bg-[var(--color-primary-dark)] hover:opacity-90 rounded-xl shadow-md duration-200 transform"
                                                >
                                                    <CheckCircle className="w-4 h-4 mr-2" />
                                                    Approve
                                                </button>
                                            )}
                                            {permissions['leave_rejected'] && (
                                                <button
                                                    onClick={() => {
                                                        setViewModal({ isOpen: false, leaveData: null });
                                                        handleReject(viewModal.leaveData);
                                                    }}
                                                    className="flex items-center px-6 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-md duration-200 transform "
                                                >
                                                    <XCircle className="w-4 h-4 mr-2" />
                                                    Reject
                                                </button>
                                            )}
                                        </>
                                    )}
                                    {viewModal.leaveData.status === '2' && (
                                        <button
                                            onClick={() => {
                                                setViewModal({ isOpen: false, leaveData: null });
                                                setCancelModal({
                                                    isOpen: true,
                                                    leaveData: viewModal.leaveData,
                                                    reason: ''
                                                });
                                            }}
                                            className="flex items-center px-6 py-2.5 text-sm font-bold text-white bg-[var(--color-primary-dark)] hover:opacity-90 rounded-xl shadow-md duration-200 transform "
                                        >
                                            <Ban className="w-4 h-4 mr-2" />
                                            Cancel Leave
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setViewModal({ isOpen: false, leaveData: null })}
                                        className="px-6 py-2.5 text-sm font-bold text-[var(--color-primary-dark)] bg-white border border-[var(--color-primary-dark)] hover:bg-[#fbf9ff] rounded-xl transition-all duration-200"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ====== ADD LEAVE POPUP MODAL - SMOOTH ANIMATION ====== */}
                {addLeaveModal.isOpen && (
                    <div
                        className={`fixed inset-0 flex items-center justify-center p-4 z-50 overflow-y-auto transition-all duration-300 ease-out ${showAddLeaveModal ? 'bg-black/50 backdrop-blur-sm' : 'bg-black/0'
                            }`}
                    >
                        <div
                            className={`bg-[var(--color-bg-secondary)] rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-visible my-8 transition-all duration-300 ease-out ${showAddLeaveModal
                                ? 'opacity-100 scale-100 translate-y-0'
                                : 'opacity-0 scale-95 translate-y-4'
                                }`}
                        >
                            {/* Popup Header */}
                            <div className="bg-[var(--color-primary-dark)] px-6 py-4 flex items-center justify-between rounded-t-2xl">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                        <Plus className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">Apply for Leave</h2>
                                        <p className="text-sm text-white/80">Fill in the details below</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleCloseAddLeave}
                                    className="p-2 hover:bg-white/15 rounded-xl transition-all duration-200"
                                >
                                    <X className="w-6 h-6 text-white" />
                                </button>
                            </div>

                            {/* Popup Content */}
                            <div className="p-6 overflow-visible flex-1 bg-[var(--color-bg-primary)] rounded-b-2xl">
                                {isLoadingData ? (
                                    <div className="flex items-center justify-center py-12">
                                        <LoadingSpinner />
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmitLeave} className="grid grid-cols-1 md:grid-cols-2 gap-5">

                                        {/* Employee Selection */}
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
                                                Select Employee <span className="text-[var(--color-error)]">*</span>
                                            </label>
                                            <CustomSelect
                                                name="employee_id"
                                                value={leaveFormData.employee_id}
                                                onChange={handleEmployeeSelect}
                                                placeholder="Search and select employee"
                                                searchable={true}
                                                required
                                                options={employees.map((employee) => ({
                                                    value: employee.employee_id,
                                                    label: employee.full_name,
                                                }))}
                                            />
                                        </div>

                                        {/* Leave Type Selection */}
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
                                                Leave Type <span className="text-[var(--color-error)]">*</span>
                                            </label>
                                            <CustomSelect
                                                name="leave_type"
                                                value={leaveFormData.leave_type}
                                                onChange={handleLeaveFormChange}
                                                options={
                                                    Array.isArray(leaveTypes)
                                                        ? leaveTypes.map((leaveType) => ({
                                                            value: leaveType.leave_type_id,
                                                            label: leaveType.leave_type,
                                                        }))
                                                        : []
                                                }
                                                placeholder="Select leave type"
                                                required
                                                searchable={true}
                                            />
                                        </div>

                                        {/* Select Dates Calendar & Right Side */}
                                        <div className="space-y-2 md:col-span-2">
                                            <div className="flex items-center justify-between">
                                                <label className="block text-sm font-semibold text-[var(--color-text-secondary)]">
                                                    Select Dates <span className="text-[var(--color-error)]">*</span>
                                                </label>
                                                {/* Legend inline with label */}
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block flex-shrink-0" />
                                                        <span className="text-[10px] text-[var(--color-text-secondary)] font-medium">Holiday</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block flex-shrink-0" />
                                                        <span className="text-[10px] text-[var(--color-text-secondary)] font-medium">Leave Applied</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block flex-shrink-0" />
                                                        <span className="text-[10px] text-[var(--color-text-secondary)] font-medium">Selected</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                                                {/* Calendar Left Side */}
                                                <div className="md:col-span-7 border border-[var(--color-border-secondary)] rounded-xl p-2 bg-[var(--color-bg-primary)] shadow-sm transition-all flex justify-center">
                                                    {calendarLoading ? (
                                                        <div className="flex items-center justify-center h-[260px] w-full">
                                                            <div className="flex flex-col items-center gap-2">
                                                                <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
                                                                <span className="text-xs text-[var(--color-text-secondary)]">Loading calendar...</span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <DatePickerComponent
                                                            selectedDates={selectedDates}
                                                            setSelectedDates={setSelectedDates}
                                                            calendarData={calendarData}
                                                        />
                                                    )}
                                                </div>

                                                {/* Selected Dates Right Side */}
                                                <div className="md:col-span-5 bg-[var(--color-bg-secondary)] border border-[var(--color-border-secondary)] rounded-xl p-4 shadow-sm flex flex-col h-[300px]">
                                                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--color-border-primary)]">
                                                        <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">
                                                            Selected Dates
                                                        </h4>
                                                        <span className="bg-[var(--color-primary-lighter)] text-[var(--color-primary-dark)] py-0.5 px-2.5 rounded-full text-xs font-bold">
                                                            {selectedDates.length}
                                                        </span>
                                                    </div>

                                                    {selectedDates.length === 0 ? (
                                                        <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                                                            <div className="w-12 h-12 bg-[var(--color-primary-lightest)] rounded-full flex items-center justify-center mb-3">
                                                                <CalendarDays className="w-6 h-6 text-[var(--color-primary-light)]" />
                                                            </div>
                                                            <p className="text-sm text-[var(--color-text-secondary)] font-medium">No dates selected</p>
                                                            <p className="text-xs text-[var(--color-text-secondary)] mt-1 opacity-70">Click on the calendar to select leave dates</p>
                                                        </div>
                                                    ) : (
                                                        <div className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
                                                            {selectedDates.map((d) => {
                                                                const isPaid = isPaidMap[d] === 1;
                                                                return (
                                                                    <div
                                                                        key={d}
                                                                        className="flex items-center justify-between bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)] hover:border-[var(--color-primary-light)] px-3 py-2 rounded-lg text-sm transition-all group shadow-sm hover:shadow"
                                                                    >
                                                                        <div className="flex items-center gap-2.5 text-[var(--color-text-primary)] font-medium">
                                                                            <CalendarDays size={16} className="text-[var(--color-primary)]" />
                                                                            <span>{d}</span>
                                                                        </div>

                                                                        <div className="flex items-center gap-2 flex-shrink-0">
                                                                            <CustomCheckbox
                                                                                id={`is-paid-${d}`}
                                                                                checked={isPaid}
                                                                                onChange={(e) => {
                                                                                    handlePaidToggle(d, e.target.checked);
                                                                                }}
                                                                            />
                                                                            <label
                                                                                htmlFor={`is-paid-${d}`}
                                                                                className={`text-xs font-semibold w-10 text-right cursor-pointer select-none ${isPaid
                                                                                    ? 'text-[var(--color-primary-dark)]'
                                                                                    : 'text-[var(--color-text-secondary)]'
                                                                                    }`}
                                                                            >
                                                                                {isPaid ? 'Paid' : 'Unpaid'}
                                                                            </label>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Reason */}
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
                                                Reason for Leave <span className="text-[var(--color-error)]">*</span>
                                            </label>
                                            <textarea
                                                name="reason"
                                                value={leaveFormData.reason}
                                                onChange={handleLeaveFormChange}
                                                required
                                                rows="3"
                                                className="w-full px-3 py-2 border border-[var(--color-border-secondary)] rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] resize-none"
                                                placeholder="Please provide details about your leave request"
                                            />
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="md:col-span-2 flex items-center justify-end pt-4 space-x-4 border-t border-[var(--color-border-primary)]">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    resetLeaveForm();
                                                    handleCloseAddLeave();
                                                }}
                                                className="px-5 py-2.5 text-sm font-medium bg-transparent text-[var(--color-primary)] border-2 hover:bg-[var(--color-primary-lightest)] border-[var(--color-primary)] rounded-xl transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                className="px-6 py-2.5 min-w-[150px] flex justify-center text-sm font-medium text-[var(--color-text-white)] bg-[var(--color-primary-dark)] hover:bg-[var(--color-primary-darker)] rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                disabled={isSubmitting}
                                            >
                                                {isSubmitting ? (
                                                    <span className="flex items-center gap-2">
                                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                                        <span>Submitting...</span>
                                                    </span>
                                                ) : (
                                                    <span>Submit Request</span>
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Toast Component */}
                {toast.show && (
                    <Toast
                        message={toast.message}
                        type={toast.type}
                        onClose={hideToast}
                    />
                )}
            </div>
        </div>
    );
};

/* --- Date Picker Component for Modal --- */
function DatePickerComponent({ selectedDates, setSelectedDates, calendarData }) {
    const today = useMemo(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    }, []);

    // Parse available months from API: e.g. ["2025-07", "2025-08"]
    const availableMonths = useMemo(() => {
        if (!calendarData?.months) return null;
        return calendarData.months.map(m => {
            const [y, mo] = m.split('-').map(Number);
            return { year: y, month: mo - 1 }; // month is 0-indexed
        });
    }, [calendarData]);

    // Determine starting month: first available month from API, or current month
    const initialMonth = useMemo(() => {
        if (availableMonths && availableMonths.length > 0) {
            const first = availableMonths[0];
            return new Date(first.year, first.month, 1);
        }
        return new Date(today.getFullYear(), today.getMonth(), 1);
    }, [availableMonths, today]);

    const [currentMonth, setCurrentMonth] = useState(initialMonth);

    // Reset to initialMonth when calendarData changes
    useEffect(() => {
        setCurrentMonth(initialMonth);
    }, [initialMonth]);

    // Build sets for O(1) lookup
    // API returns YYYY-MM-DD format, formatDate() returns DD/MM/YYYY
    // Helper: convert "YYYY-MM-DD" → "DD/MM/YYYY"
    const apiDateToFormatted = (raw) => {
        if (!raw) return null;
        const parts = raw.split('-');
        if (parts.length === 3) {
            const [y, m, d] = parts;
            return `${d}/${m}/${y}`; // DD/MM/YYYY
        }
        return null;
    };

    const holidaySet = useMemo(() => {
        const set = new Set();
        if (calendarData?.holidays) {
            calendarData.holidays.forEach(h => {
                // API field: holiday_date, format: YYYY-MM-DD
                const formatted = apiDateToFormatted(h.holiday_date || h.date);
                if (formatted) set.add(formatted);
            });
        }
        return set;
    }, [calendarData]);

    const leaveDateSet = useMemo(() => {
        const set = new Set();
        if (calendarData?.leave_dates) {
            calendarData.leave_dates.forEach(d => {
                // API field: leave_date, format: YYYY-MM-DD
                const formatted = apiDateToFormatted(d.leave_date || d.date);
                if (formatted) set.add(formatted);
            });
        }
        return set;
    }, [calendarData]);

    const formatDate = (date) => {
        const d = String(date.getDate()).padStart(2, "0");
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const y = date.getFullYear();
        return `${d}/${m}/${y}`;
    };

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const dayNames = ["S", "M", "T", "W", "T", "F", "S"];

    // Check if prev/next navigation is allowed based on available months
    const canGoPrev = useMemo(() => {
        if (!availableMonths) return true;
        const prevDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
        return availableMonths.some(m => m.year === prevDate.getFullYear() && m.month === prevDate.getMonth());
    }, [availableMonths, currentMonth]);

    const canGoNext = useMemo(() => {
        if (!availableMonths) return true;
        const nextDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
        return availableMonths.some(m => m.year === nextDate.getFullYear() && m.month === nextDate.getMonth());
    }, [availableMonths, currentMonth]);

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();
        const days = [];
        for (let i = 0; i < startingDayOfWeek; i++) days.push(null);
        for (let day = 1; day <= daysInMonth; day++) days.push(new Date(year, month, day));
        return days;
    };

    const days = getDaysInMonth(currentMonth);

    const nextMonth = () => {
        if (!canGoNext) return;
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const prevMonth = () => {
        if (!canGoPrev) return;
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const handleDateClick = (date) => {
        const dateCopy = new Date(date);
        dateCopy.setHours(0, 0, 0, 0);
        const formatted = formatDate(date);
        // Only disable holidays and already applied leave dates (past dates are selectable)
        if (holidaySet.has(formatted) || leaveDateSet.has(formatted)) return;

        setSelectedDates((prev) => {
            let newDates;
            if (prev.includes(formatted)) {
                newDates = prev.filter((d) => d !== formatted);
            } else {
                newDates = [...prev, formatted];
            }
            return newDates.sort((a, b) => {
                const [dayA, monthA, yearA] = a.split("/").map(Number);
                const [dayB, monthB, yearB] = b.split("/").map(Number);
                if (yearA !== yearB) return yearA - yearB;
                if (monthA !== monthB) return monthA - monthB;
                return dayA - dayB;
            });
        });
    };

    // Legend
    const hasCalendarData = calendarData && (holidaySet.size > 0 || leaveDateSet.size > 0);

    return (
        <div className="w-full max-w-[290px]">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <button
                    onClick={prevMonth}
                    type="button"
                    disabled={!canGoPrev}
                    className={`p-1 rounded-md transition-colors ${canGoPrev
                        ? 'hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)]'
                        : 'opacity-30 cursor-not-allowed text-[var(--color-text-muted)]'
                        }`}
                >
                    <ChevronLeft size={16} />
                </button>

                <h3 className="text-xs font-semibold text-[var(--color-text-primary)]">
                    {monthNames[currentMonth.getMonth()]}{" "}{currentMonth.getFullYear()}
                </h3>

                <button
                    onClick={nextMonth}
                    type="button"
                    disabled={!canGoNext}
                    className={`p-1 rounded-md transition-colors ${canGoNext
                        ? 'hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)]'
                        : 'opacity-30 cursor-not-allowed text-[var(--color-text-muted)]'
                        }`}
                >
                    <ChevronRight size={16} />
                </button>
            </div>

            {/* Day names */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1">
                {dayNames.map((day, idx) => (
                    <div key={idx} className="text-[10px] font-semibold text-[var(--color-text-secondary)] py-1">
                        {day}
                    </div>
                ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1 text-center">
                {days.map((date, idx) => {
                    if (!date) return <div key={`empty-${idx}`} className="w-8 h-8" />;

                    const formatted = formatDate(date);
                    const isSelected = selectedDates.includes(formatted);
                    const isHoliday = holidaySet.has(formatted);
                    const isLeaveDate = leaveDateSet.has(formatted);
                    // Only holidays and existing leave dates are disabled (no past date restriction)
                    const isDisabled = isHoliday || isLeaveDate;

                    return (
                        <div key={idx} className="relative flex flex-col items-center">
                            <button
                                type="button"
                                onClick={() => !isDisabled && handleDateClick(date)}
                                disabled={isDisabled}
                                title={
                                    isHoliday ? 'Holiday' :
                                        isLeaveDate ? 'Leave applied' : ''
                                }
                                className={`w-8 h-8 text-xs rounded-md border flex items-center justify-center transition-all font-medium
                                    ${isDisabled
                                        ? isHoliday
                                            ? 'border-transparent bg-green-100 text-green-700 opacity-80 cursor-not-allowed'
                                            : isLeaveDate
                                                ? 'border-transparent bg-amber-100 text-amber-700 opacity-80 cursor-not-allowed'
                                                : 'border-transparent text-[var(--color-text-muted)] opacity-40 cursor-not-allowed'
                                        : isSelected
                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                            : 'border-[var(--color-border-secondary)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-primary)]'
                                    }`}
                            >
                                {date.getDate()}
                            </button>
                            {/* No dots - bg color is sufficient indicator */}
                        </div>
                    );
                })}
            </div>


        </div>
    );
}

export default LeaveManagement;
