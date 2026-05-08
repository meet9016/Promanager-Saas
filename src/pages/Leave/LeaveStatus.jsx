import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSelector } from 'react-redux';
import api from '../../api/axiosInstance';
import { Toast } from '../../Components/ui/Toast';
import LoadingSpinner from "../../Components/Loader/LoadingSpinner"

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
            formData.append('user_id', user.user_id);
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
            formData.append('user_id', user.user_id);
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
            formData.append('user_id', user.user_id);
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
                <div className="bg-[var(--color-bg-secondary)] rounded-2xl shadow-custom mb-8 overflow-hidden">
                    <div className="bg-gradient-to-r from-[var(--color-primary-dark)] to-[var(--color-primary-darker)] p-8">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate(-1)}
                                className="flex items-center gap-2 text-[var(--color-text-white)] hover:text-[var(--color-text-white-90)] transition-colors bg-[var(--color-bg-secondary-20)] hover:bg-[var(--color-bg-secondary-30)] px-4 py-2 rounded-lg backdrop-blur-sm"
                            >
                                <ArrowLeft size={18} />
                                Back
                            </button>
                            <div className="flex items-center gap-3">
                                <div>
                                    <h1 className="text-2xl font-bold text-[var(--color-text-white)]">
                                        Leave Management
                                    </h1>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border-primary)] overflow-hidden shadow-custom">
                    {/* Header section with tabs */}
                    <div className="px-6 py-4 border-b border-[var(--color-border-primary)] bg-[var(--color-primary-dark)]">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center">
                                <FileText className="h-6 w-6 text-[var(--color-text-white)] mr-2" />
                                <h3 className="text-lg font-semibold text-[var(--color-text-white)]">Leave Requests</h3>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="relative w-full sm:w-64">
                                    <input
                                        type="text"
                                        placeholder="Search leave requests..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-[var(--color-border-secondary)] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] text-sm bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)]"
                                    />
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--color-text-muted)]" />
                                </div>

                                {permissions['leave_create'] && (
                                    <button
                                        onClick={() => navigate('/leaveapplication')}
                                        className="flex items-center gap-2 bg-[var(--color-primary)] text-[var(--color-text-white)] hover:bg-[var(--color-primary-dark)] px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Add Leave
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Status Tabs */}
                        <div className="flex space-x-2">
                            {Object.entries(STATUS_CONFIG).map(([statusValue, config]) => {
                                const IconComponent = config.icon;
                                return (
                                    <button
                                        key={statusValue}
                                        className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${selectedStatus === statusValue
                                            ? 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] shadow-sm border border-[var(--color-border-primary)]'
                                            : 'text-[var(--color-text-white)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text-primary)]'
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
                            <table className="min-w-full divide-y divide-[var(--color-border-divider)]">
                                <thead className="bg-[var(--color-bg-gradient-start)]">
                                    <tr>
                                        {[
                                            { key: COLUMN_KEYS.NAME, label: 'Employee Name' },
                                            { key: COLUMN_KEYS.LEAVE_TYPE, label: 'Leave Type' },
                                            { key: COLUMN_KEYS.START_DATE, label: 'Start Date' },
                                            { key: COLUMN_KEYS.END_DATE, label: 'End Date' },
                                            { key: COLUMN_KEYS.TOTAL_DAYS, label: 'Total Days' },
                                            { key: COLUMN_KEYS.STATUS, label: 'Status' }
                                        ].map(({ key, label }) => (
                                            <th key={`header-${key}`} className="px-6 py-3 text-left">
                                                <button
                                                    className="flex items-center text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider hover:text-[var(--color-text-primary)] transition-colors"
                                                    onClick={() => requestSort(key)}
                                                >
                                                    {label}
                                                    {renderSortIcon(key)}
                                                </button>
                                            </th>
                                        ))}
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-[var(--color-bg-secondary)] divide-y divide-[var(--color-border-divider)]">
                                    {!sortedLeaveRequests || sortedLeaveRequests.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="px-6 py-8 text-center text-[var(--color-text-secondary)]">
                                                <FileText className="h-12 w-12 mx-auto mb-4 text-[var(--color-text-muted)]" />
                                                <p className="text-lg font-semibold">No leave requests found</p>
                                                <p className="text-sm">Try adjusting your search or filters</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        sortedLeaveRequests.map((leave, index) => {
                                            const leaveId = leave.leave_id || `leave-${index}`;
                                            return (
                                                <tr
                                                    key={`leave-${leaveId}`}
                                                    className="hover:bg-[var(--color-bg-hover)] transition-colors"
                                                >
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-primary)]">
                                                        <div className="flex items-center space-x-3">
                                                            <div className="w-8 h-8 bg-[var(--color-primary-lighter)] rounded-full flex items-center justify-center">
                                                                <Users className="w-4 h-4 text-[var(--color-primary-dark)]" />
                                                            </div>
                                                            <span className="font-medium">{leave.full_name || 'Unknown Employee'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-secondary)]">
                                                        <span className="px-2 py-1 bg-[var(--color-bg-primary)] rounded-md text-xs font-medium">
                                                            {leave.leave_type || '--'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-secondary)]">
                                                        <div className="flex items-center">
                                                            <Calendar className="w-4 h-4 mr-2 text-[var(--color-text-muted)]" />
                                                            {formatDate(leave.start_date)}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-secondary)]">
                                                        <div className="flex items-center">
                                                            <Calendar className="w-4 h-4 mr-2 text-[var(--color-text-muted)]" />
                                                            {formatDate(leave.end_date)}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-primary)]">
                                                        <span className="font-semibold">{leave.total_days || 0}</span>
                                                        <span className="text-[var(--color-text-muted)] ml-1 text-xs">days</span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-secondary)]">
                                                        <StatusChip status={leave.status} />
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <div className="flex space-x-2">
                                                            <button
                                                                onClick={() => handleView(leave)}
                                                                className="p-2 rounded-lg transition-colors text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-lightest)]"
                                                                title="View Details"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </button>

                                                            {leave.status === '1' && (
                                                                <>
                                                                    {permissions['leave_approved'] && (
                                                                        <button
                                                                            onClick={() => handleApprove(leave.leave_id)}
                                                                            className="p-2 rounded-lg transition-colors text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] hover:bg-[var(--color-primary-lightest)]"
                                                                            title="Approve Leave"
                                                                        >
                                                                            <CheckCircle className="w-4 h-4" />
                                                                        </button>
                                                                    )}
                                                                    {permissions['leave_rejected'] && (
                                                                        <button
                                                                            onClick={() => handleReject(leave)}
                                                                            className="p-2 rounded-lg transition-colors text-[var(--color-error)] hover:text-[var(--color-error-dark)] hover:bg-[var(--color-error-light)]"
                                                                            title="Reject Leave"
                                                                        >
                                                                            <XCircle className="w-4 h-4" />
                                                                        </button>
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

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

                {/* Updated View Modal Section - Replace the existing viewModal section */}
                {viewModal.isOpen && viewModal.leaveData && (
                    <div className="fixed inset-0 bg-[var(--color-modal-overlay)] flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                        <div className="bg-[var(--color-modal-bg)] rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden ">

                            {/* Header */}
                            <div className="bg-[var(--color-modal-header-bg)] px-6 py-5 relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-primary-dark)] to-[var(--color-primary-darker)] transform "></div>
                                <div className="relative flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 bg-black/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-black/20">
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
                            <div className="p-8 overflow-y-auto flex-1 custom-scrollbar bg-[var(--color-modal-content-bg)]">

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
                            <div className="bg-[var(--color-modal-footer-bg)] px-6 py-5 border-t border-[var(--color-border-primary)] flex justify-between items-center">
                                <div className="flex space-x-3">
                                    {viewModal.leaveData.status === '1' && (
                                        <>
                                            {permissions['leave_approved'] && (
                                                <button
                                                    onClick={() => {
                                                        handleApprove(viewModal.leaveData.leave_id);
                                                        setViewModal({ isOpen: false, leaveData: null });
                                                    }}
                                                    className="flex items-center px-6 py-3 text-sm font-bold text-white bg-[var(--color-primary-dark)] hover:bg-[var(--color-primary-darker)] rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
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
                                                    className="flex items-center px-6 py-3 text-sm font-bold text-white bg-[var(--color-error)] hover:bg-[var(--color-error-dark)] rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
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