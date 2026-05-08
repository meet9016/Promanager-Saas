/* eslint-disable no-unused-vars */
import { useState, useEffect, useRef } from 'react';
import { Calendar, Users, Edit, Trash2, Plus, X, CheckCircle, ArrowLeft, Info, Search, RefreshCw, XCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext'; // Adjust path as needed
import api from '../../api/axiosInstance'; // Adjust path as needed
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Toast } from '../../Components/ui/Toast';
import { ConfirmDialog } from '../../Components/ui/ConfirmDialog';
import Pagination from '../../Components/Pagination';

// Day Status Legend Component
const DayStatusLegend = () => {
    return (
        <div className="w-36 bg-[var(--color-bg-secondary)] border border-[var(--color-primary-dark)] rounded-lg shadow-sm flex flex-col items-stretch">
            {/* Header */}
            <div className="px-6 py-4 bg-[var(--color-primary-dark)] rounded-t-lg flex items-center justify-center" style={{ minHeight: '70px' }}>
                <h3 className="text-lg font-medium text-[var(--color-text-white)] text-center m-0 p-0">Day Status</h3>
            </div>
            {/* Content */}
            <div className="flex flex-col items-center gap-6 p-3">
                <div className="flex flex-col items-center gap-1">
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-xs text-[var(--color-text-secondary)] font-medium">W</span>
                    </div>
                    <span className="text-xs text-[var(--color-text-secondary)] text-center">Week Off</span>
                </div>

                <div className="flex flex-col items-center gap-1">
                    <div className="w-8 h-8 rounded-full bg-[var(--color-bg-secondary)] border-2 border-[var(--color-primary)]" />
                    <span className="text-xs text-[var(--color-text-secondary)] text-center">Occasional</span>

                </div>
                <div className="flex flex-col items-center gap-1">
                    <div className="w-8 h-8 rounded-full bg-[var(--color-primary-dark)] flex items-center justify-center">
                        <span className="text-xs text-[var(--color-text-white)] font-medium">D</span>
                    </div>
                    <span className="text-xs text-[var(--color-text-secondary)] text-center">Working Day</span>
                </div>
            </div>
        </div>
    );
};

const ShiftManagement = () => {
    const { user } = useAuth();
    const [shifts, setShifts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchLoading, setSearchLoading] = useState(false);
    const [toast, setToast] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false });
    const navigate = useNavigate();
    const [employeeModal, setEmployeeModal] = useState({ isOpen: false, employees: [], loading: false, shiftName: '' });
    const [employeeCounts, setEmployeeCounts] = useState({});
    const permissions = useSelector(state => state.permissions) || {};
    const hasInitialized = useRef(false);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalShifts, setTotalShifts] = useState(0);
    const ITEMS_PER_PAGE = 10;

    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            if (searchQuery !== '') {
                setCurrentPage(1);
                fetchShifts(1, searchQuery);
            } else {
                fetchShifts(currentPage, '');
            }
        }, 500);

        return () => clearTimeout(delayDebounce);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery]);

    // Fetch assigned employees for a shift
    const fetchAssignedEmployees = async (shiftId, shiftName) => {
        try {
            setEmployeeModal({ isOpen: true, employees: [], loading: true, shiftName });

            const formData = new FormData();
            formData.append('shift_id', shiftId);

            const response = await api.post('assign_employee_list', formData);

            if (response.data.success) {
                const employees = response.data.data || [];
                setEmployeeModal({
                    isOpen: true,
                    employees: employees,
                    loading: false,
                    shiftName
                });

                // Update the count as well
                setEmployeeCounts(prev => ({
                    ...prev,
                    [shiftId]: employees.length
                }));
            } else {
                showToast(response.data.message || 'Failed to fetch assigned employees', 'error');
                setEmployeeModal({ isOpen: false, employees: [], loading: false, shiftName: '' });
            }
        } catch (error) {
            console.error('Error fetching assigned employees:', error);
            showToast('Failed to load assigned employees. Please try again.', 'error');
            setEmployeeModal({ isOpen: false, employees: [], loading: false, shiftName: '' });
        }
    };

    // Employee Modal Component
    const EmployeeModal = ({ isOpen, onClose, employees, loading, shiftName }) => {
        if (!isOpen) return null;

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                <div className="bg-[var(--color-bg-secondary)] rounded-lg shadow-xl max-w-md w-full mx-4 max-h-96">
                    <div className="p-8">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                                Assigned Employees - {shiftName}
                            </h3>
                            <button
                                onClick={onClose}
                                className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {loading ? (
                            <div className="flex justify-center items-center h-32">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary-dark)]"></div>
                            </div>
                        ) : employees.length > 0 ? (
                            <div className="max-h-64 overflow-y-auto">
                                <div className="space-y-2">
                                    {employees.map((employee, index) => (
                                        <div key={employee.id || index} className="flex items-center gap-3 p-3 bg-[var(--color-bg-primary)] rounded-lg">
                                            <div className="w-8 h-8 bg-[var(--color-primary-dark)] rounded-full flex items-center justify-center">
                                                <span className="text-[var(--color-text-white)] text-sm font-medium">
                                                    {employee.full_name?.charAt(0)?.toUpperCase() || 'E'}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="font-medium text-[var(--color-text-primary)]">
                                                    {employee.full_name || 'Unknown Employee'}
                                                </p>

                                                {employee.cdate && (
                                                    <p className="text-sm text-[var(--color-text-secondary)]">
                                                        Assigned: {employee.cdate}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <Users className="w-12 h-12 text-[var(--color-text-muted)] mx-auto mb-3" />
                                <p className="text-[var(--color-text-secondary)]">No employees assigned to this shift</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // Show toast notification
    const showToast = (message, type = 'info') => {
        setToast({ message, type });
    };

    // Close toast
    const closeToast = () => {
        setToast(null);
    };

    // Get day color and styling based on shift_type
    const getDayStyles = (shiftType) => {
        switch (shiftType) {
            case "1":
                return 'bg-[var(--color-primary-dark)] text-[var(--color-text-white)]'; // Working Day - Blue background with white text
            case "2":
                return 'bg-gray-300 text-[var(--color-text-secondary)]'; // Week Off - Gray background
            case "3":
                return 'bg-[var(--color-bg-secondary)] border-2 border-[var(--color-primary)] text-[var(--color-primary)]'; // Occasional - White background with blue border, no text
            default:
                return 'bg-gray-300 text-[var(--color-text-secondary)]';
        }
    };

    // Check if day should show text (only for working days and week off)
    const shouldShowDayText = (shiftType) => {
        return shiftType === "1" || shiftType === "2";
    };

    // Get day status text
    const getDayStatusText = (shiftType) => {
        switch (shiftType) {
            case "1":
                return 'Working Day';
            case "2":
                return 'Week Off';
            case "3":
                return 'Occasional Working';
            default:
                return 'Week Off';
        }
    };

    // Fetch employee count for a shift
    const fetchEmployeeCount = async (shiftId) => {
        try {
            const formData = new FormData();
            formData.append('shift_id', shiftId);

            const response = await api.post('assign_employee_list', formData);

            if (response.data.success) {
                const count = response.data.data ? response.data.data.length : 0;
                setEmployeeCounts(prev => ({
                    ...prev,
                    [shiftId]: count
                }));
            }
        } catch (error) {
            console.error('Error fetching employee count:', error);
            setEmployeeCounts(prev => ({
                ...prev,
                [shiftId]: 0
            }));
        }
    };

    // Generate empty rows to fill up to 10 rows
    const generateEmptyRows = (actualRows) => {
        const emptyRowsCount = Math.max(0, ITEMS_PER_PAGE - actualRows);
        return Array(emptyRowsCount).fill(null);
    };

    // Fetch shifts from API with pagination and search
    const fetchShifts = async (page = 1, search = '') => {
        try {
            // Set appropriate loading state
            if (search !== '') {
                setSearchLoading(true);
            } else {
                setLoading(true);
            }
            setError(null);

            if (!user?.user_id) {
                throw new Error('User ID is required');
            }

            const formData = new FormData();
            formData.append('page', page.toString());

            // Add search parameter if search query exists
            if (search && search.trim() !== '') {
                formData.append('search', search.trim());
            }

            const response = await api.post('shift_list', formData);

         
            if (response.data.success) {
                const shiftsData = response.data.data || [];
                setShifts(shiftsData);

                // Check if API provides pagination data
                const paginationData = response.data.pagination;

                if (paginationData) {
                    // Use API pagination data
                   
                    setTotalPages(paginationData.total_pages || 1);
                    setTotalShifts(paginationData.total_records || shiftsData.length);
                    setCurrentPage(paginationData.current_page || page);
                } else {
                    // Backend is paginating but not sending metadata
                    // If we received exactly ITEMS_PER_PAGE items, there might be more pages
               

                    // Simple approach: if we get exactly 10 items, assume there might be more
                    // Show next page button, and disable it if next page returns 0 items
                    if (shiftsData.length === ITEMS_PER_PAGE) {
                        // Assume there might be more pages - show pagination
                        setTotalPages(page + 1); // Show at least next page
                    } else {
                        // Less than ITEMS_PER_PAGE means this is the last page
                        setTotalPages(page);
                    }

                    setTotalShifts(shiftsData.length);
                    setCurrentPage(page);
                }

                // Fetch employee counts for each shift
                shiftsData.forEach(shift => {
                    fetchEmployeeCount(shift.shift_id);
                });
            } else {
                throw new Error(response.data.message || 'Failed to fetch shifts');
            }
        } catch (error) {
            console.error('Error fetching shifts:', error);
            const errorMessage = error.response?.data?.message || error.message || "An unexpected error occurred";

            if (error.response?.status === 401) {
                setError("Your session has expired. Please login again.");
            } else if (error.response?.status === 403) {
                setError("You don't have permission to view shifts.");
            } else if (error.response?.status >= 500) {
                setError("Server error. Please try again later.");
            } else {
                setError(errorMessage);
            }
        } finally {
            setLoading(false);
            setSearchLoading(false);
        }
    };

    // Handle page change
    const handlePageChange = (page) => {
        setCurrentPage(page);
        fetchShifts(page, searchQuery);
    };

    // Handle search input change
    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    // Clear search
    const clearSearch = () => {
        setSearchQuery('');
        setCurrentPage(1);
        fetchShifts(1, '');
    };

    useEffect(() => {
        if (!user?.user_id || hasInitialized.current) return;

        hasInitialized.current = true;
        fetchShifts(currentPage);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    // Handle edit shift
    const handleEditShift = (shiftId) => {
        navigate(`/add-shift?edit=${shiftId}`);
    };

    // Handle delete shift 
    const handleDeleteShift = async (shiftId, shiftName) => {
        setConfirmDialog({
            isOpen: true,
            title: 'Delete Shift',
            message: `Are you sure you want to delete the shift "${shiftName}"? This action cannot be undone.`,
            confirmText: 'Delete',
            type: 'danger',
            onConfirm: async () => {
                try {
                    // Show loading state
                    setConfirmDialog({ isOpen: false });

                    const formData = new FormData();
                    formData.append('shift_id', shiftId);

                    const response = await api.post('shift_delete', formData);

                    if (response.data.success) {
                        showToast('Shift deleted successfully', 'success');

                        // Refresh the current page or go to previous page if current page becomes empty
                        const pageToLoad = shifts.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
                        fetchShifts(pageToLoad, searchQuery);
                    } else {
                        showToast(response.data.message || 'Failed to delete shift', 'error');
                    }
                } catch (error) {
                    console.error('Error deleting shift:', error);
                    showToast('An error occurred while deleting the shift', 'error');
                }
            }
        });
    };
    const handleAssignShift = () => {
        navigate('/assign-shift');
    };
    // Handle assign shift
    const handleReallocation = () => {
        navigate('/shift-reallocation');
    };

    // Handle create shift
    const handleCreateShift = () => {
        navigate('/add-shift');
    };

    return (
        <div className="min-h-screen bg-[var(--color-bg-primary)] relative">
            {/* Shift Management header - spans full width */}
            <div className=" mx-auto p-8">
                <div className="bg-[var(--color-bg-secondary)] rounded-2xl shadow-xl mb-8 overflow-hidden">
                    <div className="bg-gradient-to-r from-[var(--color-primary-dark)] to-[var(--color-primary-darker)] p-8">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate(-1)}
                                className="flex items-center gap-2 text-[var(--color-text-white)] hover:text-[var(--color-text-white)] transition-colors bg-[var(--color-bg-secondary-20)] hover:bg-[var(--color-bg-secondary-30)] px-4 py-2 rounded-lg backdrop-blur-sm"
                            >
                                <ArrowLeft size={18} />
                                Back
                            </button>
                            <div className="flex items-center gap-3">
                                <div>
                                    <h1 className="text-2xl font-bold text-[var(--color-text-white)]">
                                        Shift Management
                                    </h1>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Flex row: Available Shifts card + Day Status Legend */}
                <div className="flex flex-row items-start gap-8">
                    <div className="flex-1">
                        {/* Available Shifts card and rest of your main content */}
                        <div className="bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-primary-dark)] overflow-hidden shadow-sm">
                            {/* Header section */}
                            <div className="px-6 py-4 border-b border-[var(--color-primary-light)] bg-[var(--color-primary-dark)]">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center">
                                        <Calendar className="h-6 w-6 text-[var(--color-text-white)] mr-2" />
                                        <h3 className="text-lg font-medium text-[var(--color-text-white)]">
                                            Available Shifts
                                        </h3>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="relative w-full sm:w-64">
                                            <input
                                                type="text"
                                                placeholder="Search shifts..."
                                                value={searchQuery}
                                                onChange={handleSearchChange}
                                                className="w-full pl-10 pr-10 py-2 border border-[var(--color-border-secondary)] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-text-white)] focus:border-[var(--color-border-primary)] text-sm"
                                            />
                                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--color-text-muted)]" />
                                            {searchQuery && (
                                                <button
                                                    onClick={clearSearch}
                                                    className="absolute right-3 top-2.5 h-4 w-4 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            )}
                                            {searchLoading && (
                                                <div className="absolute right-3 top-2.5">
                                                    <RefreshCw className="h-4 w-4 animate-spin text-[var(--color-text-muted)]" />
                                                </div>
                                            )}
                                        </div>

                                        {permissions['shift_create'] &&
                                            <button
                                                onClick={handleCreateShift}
                                                className="flex items-center gap-2 bg-[var(--color-bg-secondary)] text-[var(--color-primary-dark)] hover:bg-[var(--color-bg-primary)] px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                            >
                                                <Plus className="h-4 w-4" />
                                                Create Shift
                                            </button>
                                        }
                                        {permissions['shift_assign'] &&
                                            <button
                                                onClick={handleAssignShift}
                                                className="flex items-center gap-2 bg-[var(--color-bg-secondary)] text-[var(--color-primary-dark)] hover:bg-[var(--color-bg-primary)] px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                            >
                                                <Users className="h-4 w-4" />
                                                Assign Shift
                                            </button>
                                        }
                                        {permissions['shift_reallocation'] &&
                                            <button
                                                onClick={handleReallocation}
                                                className="flex items-center gap-2 bg-[var(--color-bg-secondary)] text-[var(--color-primary-dark)] hover:bg-[var(--color-bg-primary)] px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                            >
                                                <Users className="h-4 w-4" />
                                                Shift Reallocation
                                            </button>
                                        }
                                    </div>
                                </div>
                            </div>



                            {/* Content section */}
                            {loading ? (
                                <div className="px-6 py-12 text-center">
                                    <div className="inline-flex items-center space-x-2 text-[var(--color-text-secondary)]">
                                        <RefreshCw className="w-5 h-5 animate-spin" />
                                        <span>Loading shifts...</span>
                                    </div>
                                </div>
                            ) : error ? (
                                <div className="px-6 py-12 text-center">
                                    <div className="bg-[var(--color-error-light)] border border-[var(--color-border-error)] rounded-lg p-8">
                                        <XCircle className="w-12 h-12 text-[var(--color-error)] mx-auto mb-4" />
                                        <p className="text-[var(--color-error-dark)] text-lg font-medium mb-2">Error Loading Shifts</p>
                                        <p className="text-[var(--color-text-error)] mb-4">{error}</p>
                                        <button
                                            onClick={() => fetchShifts(currentPage, searchQuery)}
                                            className="inline-flex items-center space-x-2 bg-[var(--color-error-light)] text-[var(--color-error-dark)] px-4 py-2 rounded-md hover:bg-[var(--color-error-lighter)] transition-colors"
                                        >
                                            <RefreshCw className="w-4 h-4" />
                                            <span>Try Again</span>
                                        </button>
                                    </div>
                                </div>
                            ) : shifts.length === 0 ? (
                                <div className="px-6 py-12 text-center">
                                    <div className="bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] rounded-lg p-8">
                                        <div className="w-16 h-16 bg-[var(--color-bg-gray-light)] rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Calendar className="w-8 h-8 text-[var(--color-text-muted)]" />
                                        </div>
                                        <p className="text-[var(--color-text-secondary)] text-lg font-medium mb-2">No Shifts Found</p>
                                        <p className="text-[var(--color-text-secondary)] text-sm mb-4">
                                            {searchQuery ? 'No shifts match your search criteria.' : 'You haven\'t created any shifts yet. Create your first shift to get started with shift management.'}
                                        </p>
                                        {permissions['shift_create'] && !searchQuery && (
                                            <button
                                                onClick={handleCreateShift}
                                                className="inline-flex items-center space-x-2 bg-[var(--color-primary-dark)] text-[var(--color-text-white)] px-4 py-2 rounded-md hover:bg-[var(--color-primary-darker)] transition-colors"
                                            >
                                                <Plus className="w-4 h-4" />
                                                <span>Create First Shift</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-[var(--color-border-divider)]">
                                        <thead className="bg-[var(--color-primary-lightest)]">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                                                    Shift Name
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                                                    Shift Days
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                                                    Assigned Employees
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                                                    Created On
                                                </th>
                                                {(permissions?.shift_edit || permissions?.shift_delete) && (
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                                                        Actions
                                                    </th>
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody className="bg-[var(--color-bg-secondary)] divide-y divide-[var(--color-border-divider)]">
                                            {/* Actual shift rows */}
                                            {shifts.map((shift) => (
                                                <tr key={shift.shift_id} className="hover:bg-[var(--color-bg-primary)] transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[var(--color-text-primary)]">
                                                        <div className="flex items-center space-x-2">
                                                            <div className="w-8 h-8 bg-[var(--color-primary-lighter)] rounded-full flex items-center justify-center">
                                                                <Calendar className="w-4 h-4 text-[var(--color-primary-dark)]" />
                                                            </div>
                                                            <span>{shift.shift_name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-wrap gap-3">
                                                            {shift.shift_days.map((day) => (
                                                                <div key={day.day_id} className="relative group">
                                                                    <span
                                                                        className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium cursor-help ${getDayStyles(day.shift_type)}`}
                                                                    >
                                                                        {shouldShowDayText(day.shift_type) ? day.sort_name : (day.sort_name)}
                                                                    </span>
                                                                    {/* Tooltip */}
                                                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-[var(--color-text-white)] text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                                                        {getDayStatusText(day.shift_type)}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-secondary)] ">
                                                        <button
                                                            onClick={() => fetchAssignedEmployees(shift.shift_id, shift.shift_name)}
                                                            className="flex items-center gap-2 text-[var(--color-primary-dark)] hover:text-primary-800 transition-colors"
                                                        >
                                                            <span className="font-medium text-lg">
                                                                {employeeCounts[shift.shift_id] || 0}
                                                            </span>
                                                            <Users className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-secondary)]">
                                                        {shift.created_date}
                                                    </td>
                                                    {(permissions?.shift_edit || permissions?.shift_delete) && (
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                            <div className="flex space-x-2">
                                                                {permissions['shift_edit'] && (
                                                                    <button
                                                                        onClick={() => handleEditShift(shift.shift_id, shift.shift_name)}
                                                                        className="p-2 rounded-md transition-colors text-[var(--color-primary-dark)] hover:text-[var(--color-primary-darkest)] hover:bg-[var(--color-primary-lightest)]"
                                                                        title="Edit Shift"
                                                                    >
                                                                        <Edit className="w-4 h-4" />
                                                                    </button>
                                                                )}
                                                                {permissions['shift_delete'] && (
                                                                    <button
                                                                        onClick={() => handleDeleteShift(shift.shift_id, shift.shift_name)}
                                                                        className="p-2 rounded-md transition-colors text-[var(--color-text-error)] hover:text-red-900 hover:bg-[var(--color-error-light)]"
                                                                        title="Delete Shift"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    )}
                                                </tr>
                                            ))}

                                            {/* Empty rows to fill up to 10 rows */}
                                            {generateEmptyRows(shifts.length).map((_, index) => (
                                                <tr key={`empty-${index}`} className="h-16">
                                                    <td className="px-6 py-4" colSpan={permissions?.shift_edit || permissions?.shift_delete ? 5 : 4}>
                                                        <div className="h-10">&nbsp;</div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}


                            {/* Pagination Component - Always show if there are shifts */}
                            {!loading && !error && shifts.length > 0 && (
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={handlePageChange}
                                    loading={loading}
                                />
                            )}
                        </div>
                    </div>
                    <DayStatusLegend />
                </div>
            </div>

            {/* Employee Modal */}
            <EmployeeModal
                isOpen={employeeModal.isOpen}
                onClose={() => setEmployeeModal({ isOpen: false, employees: [], loading: false, shiftName: '' })}
                employees={employeeModal.employees}
                loading={employeeModal.loading}
                shiftName={employeeModal.shiftName}
            />

            {/* Toast Notification */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={closeToast}
                />
            )}

            {/* Confirm Dialog */}
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                onClose={() => setConfirmDialog({ isOpen: false })}
                onConfirm={confirmDialog.onConfirm}
                title={confirmDialog.title}
                message={confirmDialog.message}
                confirmText={confirmDialog.confirmText}
                type={confirmDialog.type}
            />
        </div>
    );
};

export default ShiftManagement;