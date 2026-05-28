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
    Badge
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
    const [viewModal, setViewModal] = useState({
        isOpen: false,
        leaveData: null
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
    }, [employees]);

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
    }, [user]);

    // Submit leave form
    const handleSubmitLeave = useCallback(async (e) => {
        e.preventDefault();

        if (!leaveFormData.employee_id) {
            showToast('Please select an employee', 'error');
            return;
        }

        setIsSubmitting(true);

        try {
            const submitData = new FormData();
            submitData.append('employee_id', leaveFormData.employee_id);
            submitData.append('leave_type', leaveFormData.leave_type);
            submitData.append('start_date', formatDateForAPI(leaveFormData.start_date));
            submitData.append('end_date', formatDateForAPI(leaveFormData.end_date));
            submitData.append('reason', leaveFormData.reason);

            const response = await api.post('/add_leave', submitData);

            showToast(response.data.message || 'Leave request submitted successfully!', 'success');

            // Reset form and close popup
            resetLeaveForm();
            handleCloseAddLeave();

            // Refresh leave list
            fetchLeaveRequests();

        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to submit leave request', 'error');
        } finally {
            setIsSubmitting(false);
        }
    }, [leaveFormData, formatDateForAPI, showToast, resetLeaveForm, handleCloseAddLeave, fetchLeaveRequests]);

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
        <div className="min-h-screen bg-[var(--color-bg-primary)]">
            <div className="p-8  mx-auto">
                <div className="bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border-primary)] overflow-hidden shadow-custom">
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
                        <div className="px-6 py-12 text-center">
                            <div className="bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] rounded-xl p-8 max-w-md mx-auto">
                                <div className="w-16 h-16 bg-[var(--color-bg-gray-light)] rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FileText className="w-8 h-8 text-[var(--color-text-muted)]" />
                                </div>
                                <p className="text-[var(--color-text-primary)] text-lg font-semibold mb-2">No {STATUS_CONFIG[selectedStatus]?.name} Leave Requests</p>
                                <p className="text-[var(--color-text-secondary)] text-sm mb-4">
                                    There are no leave requests with {STATUS_CONFIG[selectedStatus]?.name.toLowerCase()} status.
                                </p>
                            </div>
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
                                            <Td colSpan="8" className="px-6 py-8 text-center text-[var(--color-text-secondary)]">
                                                <FileText className="h-12 w-12 mx-auto mb-4 text-[var(--color-text-muted)]" />
                                                <p className="text-lg font-semibold">No leave requests found</p>
                                                <p className="text-sm">Try adjusting your search or filters</p>
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

                                                            {leave.status === '1' && (
                                                                <>
                                                                    {permissions['leave_approved'] && (
                                                                        <button
                                                                            onClick={() => handleApprove(leave.leave_id)}
                                                                            className="w-9 h-9 flex items-center justify-center rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 hover:scale-110 hover:shadow-md transition-all duration-200"
                                                                            title="Approve Leave"
                                                                        >
                                                                            <CheckCircle className="w-4 h-4" strokeWidth={2.5} />
                                                                        </button>
                                                                    )}
                                                                    {permissions['leave_rejected'] && (
                                                                        <button
                                                                            onClick={() => handleReject(leave)}
                                                                            className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-100 hover:scale-110 hover:shadow-md transition-all duration-200"
                                                                            title="Reject Leave"
                                                                        >
                                                                            <XCircle className="w-4 h-4" strokeWidth={2.5} />
                                                                        </button>
                                                                    )}
                                                                </>
                                                            )}
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
                            <div className="p-8 border-b border-[var(--color-border-primary)]">
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

                {/* View Modal Section */}
                {viewModal.isOpen && viewModal.leaveData && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                        <div className="bg-[var(--color-bg-secondary)] rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden ">

                            {/* Header */}
                            <div className="bg-[var(--color-bg-secondary)] px-6 py-5 relative overflow-hidden">
                                <div className="absolute inset-0 bg-[var(--color-primary-dark)]  transform "></div>
                                <div className="relative flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12  rounded-2xl flex items-center justify-center ">
                                            <User className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-white">Leave Request Details</h2>
                                            <p className="text-sm text-white/90 font-medium">Employee Information</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setViewModal({ isOpen: false, leaveData: null })}
                                        className="p-2 hover:bg-black/15 rounded-xl transition-all duration-200 border border-transparent hover:border-black/20"
                                    >
                                        <X className="w-6 h-6 text-white" />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-8 overflow-y-auto flex-1 custom-scrollbar bg-[var(--color-bg-primary)]">

                                {/* Employee Info */}
                                <div className="bg-[var(--color-card-info-bg)] border border-[var(--color-card-info-border)] rounded-2xl p-5 mb-6 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-14 h-14 bg-[var(--color-primary-dark)] rounded-2xl flex items-center justify-center shadow-lg">
                                                <User className="w-7 h-7 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-[var(--color-text-primary)]">
                                                    {viewModal.leaveData.full_name}
                                                </h3>
                                                <p className="text-sm text-[var(--color-text-secondary)] font-medium">Employee</p>
                                            </div>
                                        </div>
                                        <div className="transform hover:scale-105 transition-transform duration-200">
                                            <StatusChip status={viewModal.leaveData.status} />
                                        </div>
                                    </div>
                                </div>

                                {/* Leave Details */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    {/* Leave Type */}
                                    <div className="bg-[var(--color-card-detail-bg)] border border-[var(--color-card-detail-border)] rounded-2xl p-4 hover:shadow-md transition-all duration-200">
                                        <div className="flex items-center space-x-3 mb-2">
                                            <div className="w-10 h-10 bg-[var(--color-primary-dark)] rounded-xl flex items-center justify-center">
                                                <FileText className="w-5 h-5 text-[var(--color-text-white)]" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-[var(--color-text-secondary)]">Leave Type</p>
                                                <p className="text-lg font-bold text-[var(--color-text-primary)]">{viewModal.leaveData.leave_type}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Total Duration */}
                                    <div className="bg-[var(--color-card-detail-bg)] border border-[var(--color-card-detail-border)] rounded-2xl p-4 hover:shadow-md transition-all duration-200">
                                        <div className="flex items-center space-x-3 mb-2">
                                            <div className="w-10 h-10 bg-[var(--color-primary-dark)] rounded-xl flex items-center justify-center">
                                                <Timer className="w-5 h-5 text-[var(--color-text-white)]" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-[var(--color-text-secondary)]">Total Duration</p>
                                                <p className="text-lg font-bold text-[var(--color-text-primary)]">
                                                    {viewModal.leaveData.totalDays} {viewModal.leaveData.totalDays === 1 ? 'Day' : 'Days'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Start Date */}
                                    <div className="bg-[var(--color-card-detail-bg)] border border-[var(--color-card-detail-border)] rounded-2xl p-4 hover:shadow-md transition-all duration-200">
                                        <div className="flex items-center space-x-3 mb-2">
                                            <div className="w-10 h-10 bg-[var(--color-primary-dark)] rounded-xl flex items-center justify-center">
                                                <CalendarDays className="w-5 h-5 text-[var(--color-text-white)]" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-[var(--color-text-secondary)]">Start Date</p>
                                                <p className="text-lg font-bold text-[var(--color-text-primary)]">{formatDate(viewModal.leaveData.start_date)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* End Date */}
                                    <div className="bg-[var(--color-card-detail-bg)] border border-[var(--color-card-detail-border)] rounded-2xl p-4 hover:shadow-md transition-all duration-200">
                                        <div className="flex items-center space-x-3 mb-2">
                                            <div className="w-10 h-10 bg-[var(--color-primary-dark)] rounded-xl flex items-center justify-center">
                                                <CalendarDays className="w-5 h-5 text-[var(--color-text-white)]" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-[var(--color-text-secondary)]">End Date</p>
                                                <p className="text-lg font-bold text-[var(--color-text-primary)]">{formatDate(viewModal.leaveData.end_date)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Reason */}
                                {viewModal.leaveData.reason && (
                                    <div className="bg-[var(--color-card-detail-bg)] border border-[var(--color-status-warning-border)] rounded-2xl p-5 mb-6 shadow-sm">
                                        <div className="flex items-start space-x-3">
                                            <div className="w-10 h-10 bg-[var(--color-primary-dark)] rounded-xl flex items-center justify-center mt-1">
                                                <MessageSquare className="w-5 h-5 text-[var(--color-text-white)]" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">Leave Reason</h4>
                                                <p className="text-[var(--color-text-primary)] leading-relaxed">{viewModal.leaveData.reason}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Rejection Reason */}
                                {viewModal.leaveData.status === '3' && viewModal.leaveData.reject_reason && (
                                    <div className="bg-[var(--color-status-error-bg)] border border-[var(--color-status-error-border)] rounded-2xl p-5 mb-6 shadow-sm">
                                        <div className="flex items-start space-x-3">
                                            <div className="w-10 h-10 bg-[var(--color-icon-error-bg)] rounded-xl flex items-center justify-center mt-1">
                                                <AlertTriangle className="w-5 h-5 text-[var(--color-error)]" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">Rejection Reason</h4>
                                                <p className="text-[var(--color-text-primary)] leading-relaxed">{viewModal.leaveData.reject_reason}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Application Date */}
                                {viewModal.leaveData.applied_date && (
                                    <div className="border-t border-[var(--color-border-primary)] pt-5 mt-6">
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center space-x-2">
                                                <div className="w-8 h-8 bg-[var(--color-bg-gray-light)] rounded-lg flex items-center justify-center">
                                                    <Calendar className="w-4 h-4 text-[var(--color-text-secondary)]" />
                                                </div>
                                                <span className="text-[var(--color-text-secondary)] font-medium">Application submitted on:</span>
                                            </div>
                                            <span className="font-bold text-[var(--color-text-primary)] px-3 py-1 bg-[var(--color-bg-gray-light)] rounded-lg">
                                                {formatDate(viewModal.leaveData.applied_date)}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="bg-[var(--color-bg-secondary)] px-6 py-5 border-t border-[var(--color-border-primary)] flex justify-between items-center">
                                <div className="flex space-x-3">
                                    {viewModal.leaveData.status === '1' && (
                                        <>
                                            {permissions['leave_approved'] && (
                                                <button
                                                    onClick={() => {
                                                        handleApprove(viewModal.leaveData.leave_id);
                                                        setViewModal({ isOpen: false, leaveData: null });
                                                    }}
                                                    className="flex items-center px-6 py-3 text-sm font-bold text-white bg-[var(--color-primary-dark)] rounded-xl shadow-lg duration-200 transform"
                                                >
                                                    <CheckCircle className="w-5 h-5 mr-2" />
                                                    Approve
                                                </button>
                                            )}
                                            {permissions['leave_rejected'] && (
                                                <button
                                                    onClick={() => {
                                                        setViewModal({ isOpen: false, leaveData: null });
                                                        handleReject(viewModal.leaveData);
                                                    }}
                                                    className="flex items-center px-6 py-3 text-sm font-bold text-white bg-[var(--color-error)] rounded-xl shadow-lg duration-200 transform "
                                                >
                                                    <XCircle className="w-5 h-5 mr-2" />
                                                    Reject
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ====== ADD LEAVE POPUP MODAL - SMOOTH ANIMATION ====== */}
                {addLeaveModal.isOpen && (
                    <div 
                        className={`fixed inset-0 flex items-center justify-center p-4 z-50 overflow-y-auto transition-all duration-300 ease-out ${
                            showAddLeaveModal ? 'bg-black/50 backdrop-blur-sm' : 'bg-black/0'
                        }`}
                    >
                        <div 
                            className={`bg-[var(--color-bg-secondary)] rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-visible my-8 transition-all duration-300 ease-out ${
                                showAddLeaveModal 
                                    ? 'opacity-100 scale-100 translate-y-0' 
                                    : 'opacity-0 scale-95 translate-y-4'
                            }`}
                        >
                            {/* Popup Header */}
                            <div className="bg-[var(--color-primary-dark)] px-6 py-4 flex items-center justify-between">
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
                            <div className="p-6 overflow-visible flex-1 bg-[var(--color-bg-primary)]">
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

                                        {/* Start Date */}
                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-[var(--color-text-secondary)]">
                                                Start Date <span className="text-[var(--color-error)]">*</span>
                                            </label>
                                            <CustomDatePicker
                                                name="start_date"
                                                value={leaveFormData.start_date}
                                                onChange={(e) => handleStartDateChange(new Date(e.target.value))}
                                                minDate={today}
                                                placeholder="DD-MM-YYYY"
                                            />
                                        </div>

                                        {/* End Date */}
                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-[var(--color-text-secondary)]">
                                                End Date <span className="text-[var(--color-error)]">*</span>
                                            </label>
                                            <CustomDatePicker
                                                name="end_date"
                                                value={leaveFormData.end_date}
                                                onChange={(e) => handleEndDateChange(new Date(e.target.value))}
                                                minDate={leaveFormData.start_date || today}
                                                placeholder="DD-MM-YYYY"
                                            />
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
                                                className="w-full px-3 py-2 border border-[var(--color-border-secondary)] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] resize-none"
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
                                                className="px-5 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] bg-[var(--color-bg-secondary)] border border-[var(--color-border-secondary)] rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                className="px-6 py-2.5 text-sm font-medium text-[var(--color-text-white)] bg-[var(--color-primary-dark)] hover:bg-[var(--color-primary-darker)] rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                disabled={isSubmitting}
                                            >
                                                {isSubmitting ? (
                                                    <span className="flex items-center gap-2">
                                                        <LoadingSpinner size="sm" />
                                                        Submitting...
                                                    </span>
                                                ) : (
                                                    'Submit Request'
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

export default LeaveManagement;
