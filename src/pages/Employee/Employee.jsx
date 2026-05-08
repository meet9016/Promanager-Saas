import { useEffect, useState, useCallback, useMemo } from 'react';
import {
    Edit,
    ChevronDown,
    ChevronUp,
    Users,
    Plus,
    Search,
    ArrowLeft,
    RefreshCw,
    XCircle,
    Eye,
    Smartphone,
    Fingerprint,
    Filter,
    Building,
    Award,
    UserCheck,
    DollarSign,
    UserCircle,
    CheckCircle
} from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosInstance';
import { useSelector } from 'react-redux';
import Pagination from '../../Components/Pagination'; // Adjust path as needed
import LoadingSpinner from '../../Components/Loader/LoadingSpinner';
import { Toast } from '../../Components/ui/Toast'; // Import your toast component

const SORT_DIRECTIONS = {
    ASCENDING: 'ascending',
    DESCENDING: 'descending'
};

const COLUMN_KEYS = {
    ID: 'id',
    NAME: 'name',
    DEPARTMENT: 'department',
    DESIGNATION: 'designation',
    ATTENDANCE_TYPE: 'attendance_type'
};

const KEY_MAPPING = {
    [COLUMN_KEYS.ID]: 'employee_code',
    [COLUMN_KEYS.NAME]: 'full_name',
    [COLUMN_KEYS.DEPARTMENT]: 'department_name',
    [COLUMN_KEYS.DESIGNATION]: 'designation_name',
    [COLUMN_KEYS.ATTENDANCE_TYPE]: 'attendance_type'
};

const ATTENDANCE_TYPES = {
    MOBILE: 1,
    BIOMETRIC: 2
};

const ITEMS_PER_PAGE = 10;

export default function Employee() {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState({
        key: null,
        direction: SORT_DIRECTIONS.ASCENDING
    });

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalEmployees, setTotalEmployees] = useState(0);
    const [paginationLoading, setPaginationLoading] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);

    // Attendance type change loading state
    const [attendanceChangingIds, setAttendanceChangingIds] = useState(new Set());

    // Toast state
    const [toast, setToast] = useState(null);

    // Filter states
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        branch_id: '',
        department_id: '',
        designation_id: '',
        employee_type_id: '',
        salary_type_id: '',
        gender_id: '',
        status_id: '1'
    });
    const [branches, setBranches] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [designations, setDesignations] = useState([]);
    const [employeeTypes, setEmployeeTypes] = useState([]);
    const [salaryTypes, setSalaryTypes] = useState([]);
    const [genders, setGenders] = useState([]);
    const [status, setStatus] = useState([]);
    const [dropdownLoading, setDropdownLoading] = useState(false);

    const navigate = useNavigate();
    const { user, isAuthenticated, logout } = useAuth();
    const permissions = useSelector(state => state.permissions) || {};

    // Toast helper function
    const showToast = useCallback((message, type = 'info') => {
        setToast({ message, type });
    }, []);

    const hideToast = useCallback(() => {
        setToast(null);
    }, []);

    // Fetch dropdown data for filters
    const fetchDropdownData = useCallback(async () => {
        try {
            setDropdownLoading(true);
            if (!user?.user_id) {
                throw new Error('User ID is required');
            }

            const formData = new FormData();
            formData.append('user_id', user.user_id);

            const response = await api.post('employee_drop_down_list', formData);

            if (response.data?.success && response.data.data) {
                const data = response.data.data;
                setBranches((data.branch_list || []).map(b => ({ id: b.branch_id, name: b.name })));
                setDepartments((data.department_list || []).map(d => ({ id: d.department_id, name: d.name })));
                setDesignations((data.designation_list || []).map(d => ({ id: d.designation_id, name: d.name })));
                setEmployeeTypes((data.employee_type_list || []).map(et => ({ id: et.employee_type_id, name: et.name })));
                setSalaryTypes((data.salary_type_list || []).map(st => ({ id: st.salary_type_id, name: st.name })));
                setGenders((data.gender_list || []).map(g => ({ id: g.gender_id, name: g.name })));
                setStatus((data.emp_status_list || []).map(s => ({ id: s.status_id, name: s.name })));
            } else {
                throw new Error(response.data?.message || 'Failed to load filter options');
            }

        } catch (error) {
            console.error("Fetch dropdown data error:", error);
            showToast('Failed to load filter options', 'error');
        } finally {
            setDropdownLoading(false);
        }
    }, [user?.user_id, showToast]);

    // Fetch employees data with pagination, search, and filters
    const fetchEmployees = useCallback(async (page = 1, search = '', resetData = false) => {
        try {
            if (resetData) {
                setLoading(true);
                setCurrentPage(1);
                page = 1;
            } else if (search !== searchQuery) {
                setSearchLoading(true);
            } else {
                setPaginationLoading(true);
            }

            setError(null);

            if (!user?.user_id) {
                throw new Error('User ID is required');
            }

            const formData = new FormData();
            formData.append('user_id', user.user_id);
            formData.append('page', page.toString());

            // Add search parameter if search query exists
            if (search && search.trim() !== '') {
                formData.append('search', search.trim());
            }

            // Add filter parameters
            if (filters.branch_id) {
                formData.append('branch_id', filters.branch_id);
            }
            if (filters.department_id) {
                formData.append('department_id', filters.department_id);
            }
            if (filters.designation_id) {
                formData.append('designation_id', filters.designation_id);
            }
            if (filters.employee_type_id) {
                formData.append('employee_type_id', filters.employee_type_id);
            }
            if (filters.salary_type_id) {
                formData.append('salary_type_id', filters.salary_type_id);
            }
            if (filters.gender_id) {
                formData.append('gender_id', filters.gender_id);
            }
            if (filters.status_id) {
                formData.append('status_id', filters.status_id);
            }

            const response = await api.post('employee_list', formData);

            if (response.data?.success && response.data.data) {
                const newEmployees = response.data.data;
                setEmployees(newEmployees);

                // Calculate total pages based on response
                const itemsCount = newEmployees.length;
                if (itemsCount < ITEMS_PER_PAGE && page === 1) {
                    // If we get less than 10 items on first page, that's all we have
                    setTotalPages(1);
                    setTotalEmployees(itemsCount);
                } else if (itemsCount < ITEMS_PER_PAGE && page > 1) {
                    // If we get less than 10 items on subsequent pages, this is the last page
                    setTotalPages(page);
                    setTotalEmployees((page - 1) * ITEMS_PER_PAGE + itemsCount);
                } else {
                    // If we get exactly 10 items, there might be more pages
                    setTotalPages(page + 1); // We'll update this when we hit the last page
                    setTotalEmployees(page * ITEMS_PER_PAGE);
                }

                setCurrentPage(page);
            } else {
                throw new Error(response.data?.message || 'Failed to fetch employees');
            }

        } catch (error) {
            console.error("Fetch employees error:", error);
            const errorMessage = error.response?.data?.message || error.message || "An unexpected error occurred";

            if (error.response?.status === 401) {
                setError("Your session has expired. Please login again.");
                setTimeout(() => logout?.(), 2000);
            } else if (error.response?.status === 403) {
                setError("You don't have permission to view employees.");
            } else if (error.response?.status >= 500) {
                setError("Server error. Please try again later.");
            } else {
                setError(errorMessage);
            }
        } finally {
            setLoading(false);
            setPaginationLoading(false);
            setSearchLoading(false);
        }
    }, [user, logout, searchQuery, filters]);

    // Handle filter changes
    const handleFilterChange = useCallback((key, value) => {
        setFilters(prev => {
            const next = { ...prev, [key]: value };
            // Reset dependent filters when parent filter changes
            if (key === 'branch_id') {
                next.department_id = '';
                next.designation_id = '';
            } else if (key === 'department_id') {
                next.designation_id = '';
            }
            return next;
        });
    }, []);

    // Reset filters
    const resetFilters = useCallback(() => {
        setFilters({
            branch_id: '',
            department_id: '',
            designation_id: '',
            employee_type_id: '',
            salary_type_id: '',
            gender_id: '',
            status_id: ''
        });
        setCurrentPage(1);
    }, []);

    // Handle attendance type change
    const handleAttendanceTypeChange = useCallback(async (employeeId, newAttendanceType) => {
        try {
            setAttendanceChangingIds(prev => new Set(prev.add(employeeId)));

            const formData = new FormData();
            formData.append('employee_id', employeeId.toString());
            formData.append('attendance_type', newAttendanceType.toString());

            const response = await api.post('attendance_type_change', formData);

            if (response.data?.success) {
                // Update the employee's attendance type in local state
                setEmployees(prevEmployees =>
                    prevEmployees.map(emp =>
                        emp.employee_id === employeeId
                            ? { ...emp, attendance_type: newAttendanceType.toString() }
                            : emp
                    )
                );

                // Show success toast
                const attendanceTypeText = newAttendanceType === ATTENDANCE_TYPES.BIOMETRIC ? 'Biometric' : 'Mobile';
                showToast(`Attendance type updated to ${attendanceTypeText} successfully!`, 'success');
            } else {
                throw new Error(response.data?.message || 'Failed to update attendance type');
            }

        } catch (error) {
            console.error("Attendance type change error:", error);
            const errorMessage = error.response?.data?.message || error.message || "Failed to update attendance type";

            // Show error toast instead of alert
            showToast(errorMessage, 'error');
        } finally {
            setAttendanceChangingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(employeeId);
                return newSet;
            });
        }
    }, [showToast]);

    // Debounced search functionality
    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            // Reset to page 1 when searching
            setCurrentPage(1);
            fetchEmployees(1, searchQuery);
        }, 500); // Increased debounce time for API calls

        return () => clearTimeout(delayDebounce);
    }, [searchQuery, filters]); // Added filters as dependency

    // Initial load and fetch dropdown data
    useEffect(() => {
        if (isAuthenticated() && user?.user_id) {
            fetchDropdownData();
            fetchEmployees(1, '', true);
        }
    }, [isAuthenticated, user?.user_id, fetchDropdownData]);

    // Client-side sorting (works on current page data)
    const requestSort = useCallback((key) => {
        setSortConfig(prevConfig => {
            const direction = prevConfig.key === key && prevConfig.direction === SORT_DIRECTIONS.ASCENDING
                ? SORT_DIRECTIONS.DESCENDING
                : SORT_DIRECTIONS.ASCENDING;
            return { key, direction };
        });
    }, []);

    // Memoized sorted employees (client-side sorting of current page results)
    const sortedEmployees = useMemo(() => {
        if (!sortConfig.key) return employees;

        return [...employees].sort((a, b) => {
            const actualKey = KEY_MAPPING[sortConfig.key] || sortConfig.key;
            const aValue = a[actualKey] || '';
            const bValue = b[actualKey] || '';

            if (aValue < bValue) {
                return sortConfig.direction === SORT_DIRECTIONS.ASCENDING ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === SORT_DIRECTIONS.ASCENDING ? 1 : -1;
            }
            return 0;
        });
    }, [employees, sortConfig]);

    // Pagination handler
    const handlePageChange = useCallback((newPage) => {
        if (newPage >= 1 && newPage <= totalPages && !paginationLoading && !searchLoading) {
            fetchEmployees(newPage, searchQuery);
        }
    }, [totalPages, paginationLoading, searchLoading, fetchEmployees, searchQuery]);

    // Action handlers
    const handleViewDetails = useCallback((employee_id) => {
        navigate(`/employee/details/${employee_id}`);
    }, [navigate]);

    const handleEditEmployee = useCallback((employee_id) => {
        navigate(`/add-employee?edit=${employee_id}`);
    }, [navigate]);

    // Clear search
    const handleClearSearch = useCallback(() => {
        setSearchQuery('');
    }, []);

    // Render sort icon
    const renderSortIcon = useCallback((key) => {
        if (sortConfig.key !== key) {
            return <ChevronDown className="ml-1 h-4 w-4 text-white/70" />;
        }
        return sortConfig.direction === SORT_DIRECTIONS.ASCENDING ?
            <ChevronUp className="ml-1 h-4 w-4 text-white" /> :
            <ChevronDown className="ml-1 h-4 w-4 text-white" />;
    }, [sortConfig]);

    // Render attendance type display - UPDATED TO SHOW ONLY ACTIVE TYPE
    const renderAttendanceTypeDisplay = useCallback((employee) => {
        const employeeId = employee.employee_id;
        const currentType = parseInt(employee.attendance_type);
        const isChanging = attendanceChangingIds.has(employeeId);
        const isMobile = currentType === ATTENDANCE_TYPES.MOBILE;
        const isBiometric = currentType === ATTENDANCE_TYPES.BIOMETRIC;

        // Check if user has permission to change attendance type
        const hasPermission = permissions['attendance_type_change'];

        if (!hasPermission) {
            // Read-only display - show only active type
            return (
                <div className="flex items-center justify-center">
                    {isMobile ? (
                        <div className="flex items-center space-x-2 px-2 py-1 bg-[var(--color-primary-lightest)] rounded-full">
                            <Smartphone className="w-4 h-4 text-[var(--color-primary)]" />
                            <span className="text-sm text-[var(--color-text-primary)] font-medium">Mobile</span>
                        </div>
                    ) : (
                        <div className="flex items-center space-x-2 px-2 py-1 bg-[var(--color-success-light)] rounded-full">
                            <Fingerprint className="w-4 h-4 text-[var(--color-success)]" />
                            <span className="text-sm text-[var(--color-text-success)] font-medium">Biometric</span>
                        </div>
                    )}
                </div>
            );
        }
        const isInactive = employee.status === 2 || employee.status === '2';
        // Interactive toggle for users with permission
        return (
            <div className="flex items-center justify-center relative">
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        id={`toggle-${employeeId}`}
                        checked={isBiometric}
                        onChange={(e) => {
                            if (!isChanging && !isInactive) {
                                const newType = e.target.checked ? ATTENDANCE_TYPES.BIOMETRIC : ATTENDANCE_TYPES.MOBILE;
                                handleAttendanceTypeChange(employeeId, newType);
                            }
                        }}
                        disabled={isChanging || paginationLoading || searchLoading || isInactive}
                        className="sr-only"
                    />
                    <label
                        htmlFor={`toggle-${employeeId}`}
                        className={`relative inline-flex items-center h-7 w-14 rounded-full transition-all duration-300 ease-in-out focus-within:ring-2 focus-within:ring-offset-2 ${isBiometric
                            ? 'bg-[var(--color-success)] focus-within:ring-[var(--color-success)]'
                            : 'bg-[var(--color-primary)] focus-within:ring-[var(--color-primary)]'
                            } ${isChanging || paginationLoading || searchLoading || isInactive
                                ? 'opacity-50 cursor-not-allowed'
                                : 'cursor-pointer hover:shadow-md'
                            }`}
                        title={isInactive ? 'Attendance type cannot be changed for inactive employees' : ''}
                    >
                        {/* Toggle Circle with Icon */}
                        <span
                            className={`inline-block h-6 w-6 rounded-full bg-[var(--color-bg-secondary)] shadow-lg transform transition-all duration-300 ease-in-out flex items-center justify-center ${isBiometric ? 'translate-x-7' : 'translate-x-0.5'
                                }`}
                        >
                            {isBiometric ? (
                                <Fingerprint className="w-3.5 h-3.5 text-[var(--color-success)]" />
                            ) : (
                                <Smartphone className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                            )}
                        </span>
                    </label>

                    {/* Active Type Label */}
                    <div className="ml-3 flex items-center">
                        <span className={`text-sm font-medium ${isBiometric ? 'text-[var(--color-text-success)]' : 'text-[var(--color-text-primary)]'
                            }`}>
                            {isBiometric ? 'Biometric' : 'Mobile'}
                        </span>
                    </div>
                </div>

                {/* Loading overlay */}
                {isChanging && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-bg-secondary)]/80 rounded-lg">
                        <RefreshCw className="w-4 h-4 animate-spin text-[var(--color-primary-dark)]" />
                    </div>
                )}
            </div>
        );
    }, [attendanceChangingIds, permissions, handleAttendanceTypeChange, paginationLoading, searchLoading]);

    // Function to truncate text with ellipsis
    const truncateText = useCallback((text, maxLength = 12) => {
        if (!text) return '--';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }, []);

    // Redirect if not authenticated
    if (!isAuthenticated()) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="min-h-screen bg-[var(--color-bg-primary)]">
            {/* Toast component */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={hideToast}
                />
            )}

            <div className="p-8  mx-auto ">
                <div className="bg-[var(--color-bg-secondary)] rounded-2xl shadow-xl mb-8 overflow-hidden">
                    <div className="bg-gradient-to-r from-[var(--color-primary-dark)] to-[var(--color-primary-darker)] p-8">
                        <div className="flex items-center justify-between">
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
                                            Employee Management
                                        </h1>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className="flex items-center gap-2 bg-[var(--color-bg-secondary)] text-primary-600 hover:bg-[var(--color-bg-primary)] px-4 py-2 rounded-lg font-medium transition-colors"
                                >
                                    <Filter className="h-4 w-4" />
                                    Filters
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters - Collapsible */}
                {showFilters && (
                    <div className="bg-[var(--color-bg-card)] rounded-lg shadow-[var(--color-shadow-light)] border border-[var(--color-border-secondary)] p-5 mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-[var(--color-primary-lightest)] rounded-lg">
                                    <Filter className="h-5 w-5 text-[var(--color-primary)]" />
                                </div>
                                <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Filters</h2>
                            </div>
                            <button
                                onClick={resetFilters}
                                className="flex items-center gap-2 px-4 py-2 bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors duration-200"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Reset
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                            {/* Branch */}
                            <div className="flex flex-col">
                                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                    <Building className="inline h-4 w-4 mr-1" />
                                    Branch
                                </label>
                                <select
                                    value={filters.branch_id}
                                    onChange={(e) => handleFilterChange('branch_id', e.target.value)}
                                    className="w-full px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border-secondary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent text-[var(--color-text-primary)]"
                                    disabled={dropdownLoading}
                                >
                                    <option value="">All Branches</option>
                                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </select>
                            </div>

                            {/* Department */}
                            <div className="flex flex-col">
                                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                    <Users className="inline h-4 w-4 mr-1" />
                                    Department
                                </label>
                                <select
                                    value={filters.department_id}
                                    onChange={(e) => handleFilterChange('department_id', e.target.value)}
                                    className="w-full px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border-secondary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent text-[var(--color-text-primary)]"
                                    disabled={dropdownLoading}
                                >
                                    <option value="">All Departments</option>
                                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                            </div>

                            {/* Designation */}
                            <div className="flex flex-col">
                                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                    <Award className="inline h-4 w-4 mr-1" />
                                    Designation
                                </label>
                                <select
                                    value={filters.designation_id}
                                    onChange={(e) => handleFilterChange('designation_id', e.target.value)}
                                    className="w-full px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border-secondary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent text-[var(--color-text-primary)]"
                                    disabled={dropdownLoading}
                                >
                                    <option value="">All Designations</option>
                                    {designations.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                            </div>

                            {/* Employee Type */}
                            <div className="flex flex-col">
                                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                    <UserCheck className="inline h-4 w-4 mr-1" />
                                    Employee Type
                                </label>
                                <select
                                    value={filters.employee_type_id}
                                    onChange={(e) => handleFilterChange('employee_type_id', e.target.value)}
                                    className="w-full px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border-secondary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent text-[var(--color-text-primary)]"
                                    disabled={dropdownLoading}
                                >
                                    <option value="">All Employee Types</option>
                                    {employeeTypes.map(et => <option key={et.id} value={et.id}>{et.name}</option>)}
                                </select>
                            </div>

                            {/* Salary Type */}
                            <div className="flex flex-col">
                                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                    <DollarSign className="inline h-4 w-4 mr-1" />
                                    Salary Type
                                </label>
                                <select
                                    value={filters.salary_type_id}
                                    onChange={(e) => handleFilterChange('salary_type_id', e.target.value)}
                                    className="w-full px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border-secondary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent text-[var(--color-text-primary)]"
                                    disabled={dropdownLoading}
                                >
                                    <option value="">All Salary Types</option>
                                    {salaryTypes.map(st => <option key={st.id} value={st.id}>{st.name}</option>)}
                                </select>
                            </div>

                            {/* Gender */}
                            <div className="flex flex-col">
                                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                    <UserCircle className="inline h-4 w-4 mr-1" />
                                    Gender
                                </label>
                                <select
                                    value={filters.gender_id}
                                    onChange={(e) => handleFilterChange('gender_id', e.target.value)}
                                    className="w-full px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border-secondary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent text-[var(--color-text-primary)]"
                                    disabled={dropdownLoading}
                                >
                                    <option value="">All Genders</option>
                                    {genders.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                </select>
                            </div>

                            {/* Status */}
                            <div className="flex flex-col">
                                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                    <CheckCircle className="inline h-4 w-4 mr-1" />
                                    Status
                                </label>
                                <select
                                    value={filters.status_id}
                                    onChange={(e) => handleFilterChange('status_id', e.target.value)}
                                    className="w-full px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border-secondary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent text-[var(--color-text-primary)]"
                                    disabled={dropdownLoading}
                                >
                                    <option value="">All Status</option>
                                    {status.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-primary-dark)] overflow-hidden shadow-sm">
                    {/* Header section */}
                    <div className="px-6 py-4 border-b border-[var(--color-primary-light)] bg-[var(--color-primary-dark)]">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center">
                                <Users className="h-6 w-6 text-[var(--color-text-white)] mr-2" />
                                <h3 className="text-lg font-medium text-[var(--color-text-white)]">
                                    All Employee List
                                </h3>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="relative w-full sm:w-64">
                                    <input
                                        type="text"
                                        placeholder="Search employees..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-10 py-2 border border-[var(--color-border-secondary)] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-text-white)] focus:border-[var(--color-border-primary)] text-sm text-[var(--color-text-primary)]"
                                    />
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--color-text-muted)]" />
                                    {searchQuery && (
                                        <button
                                            onClick={handleClearSearch}
                                            className="absolute right-3 top-2.5 h-4 w-4 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
                                        >
                                            <XCircle className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>

                                {permissions['employee_create'] && (
                                    <button
                                        onClick={() => navigate('/add-employee')}
                                        className="flex items-center gap-2 bg-[var(--color-bg-secondary)] text-[var(--color-primary-dark)] hover:bg-[var(--color-bg-primary)] px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Add Employee
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Content section */}
                    {loading ? (
                        <div>
                            <LoadingSpinner />
                        </div>
                    ) : error ? (
                        <div className="px-6 py-12 text-center">
                            <div className="bg-[var(--color-error-light)] border border-[var(--color-border-error)] rounded-lg p-8">
                                <XCircle className="w-12 h-12 text-[var(--color-error)] mx-auto mb-4" />
                                <p className="text-[var(--color-error-dark)] text-lg font-medium mb-2">Error Loading Employees</p>
                                <button
                                    onClick={() => fetchEmployees(currentPage, searchQuery)}
                                    className="inline-flex items-center space-x-2 bg-[var(--color-error-light)] text-[var(--color-error-dark)] px-4 py-2 rounded-md hover:bg-[var(--color-error-lighter)] transition-colors"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    <span>Try Again</span>
                                </button>
                            </div>
                        </div>
                    ) : employees.length === 0 ? (
                        <div className="px-6 py-12 text-center">
                            <div className="bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] rounded-lg p-8">
                                <div className="w-16 h-16 bg-[var(--color-bg-gray-light)] rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Users className="w-8 h-8 text-[var(--color-text-muted)]" />
                                </div>
                                <p className="text-[var(--color-text-secondary)] text-lg font-medium mb-2">
                                    {searchQuery ? 'No employees found' : 'No Employees Found'}
                                </p>
                                <p className="text-[var(--color-text-secondary)] text-sm mb-4">
                                    {searchQuery
                                        ? `No employees match your search "${searchQuery}". Try different search terms.`
                                        : currentPage > 1
                                            ? 'No employees found on this page.'
                                            : 'You haven\'t added any employees yet.'
                                    }
                                </p>
                                {searchQuery && (
                                    <button
                                        onClick={handleClearSearch}
                                        className="inline-flex items-center space-x-2 bg-[var(--color-bg-gradient-start)] text-[var(--color-text-secondary)] px-4 py-2 rounded-md hover:bg-[var(--color-bg-gray-light)] transition-colors mr-2"
                                    >
                                        <XCircle className="w-4 h-4" />
                                        <span>Clear Search</span>
                                    </button>
                                )}
                                {permissions['employee_create'] && !searchQuery && currentPage === 1 && (
                                    <button
                                        onClick={() => navigate('/add-employee')}
                                        className="inline-flex items-center space-x-2 bg-[var(--color-primary-dark)] text-[var(--color-text-white)] px-4 py-2 rounded-md hover:bg-[var(--color-primary-darker)] transition-colors"
                                    >
                                        <Plus className="w-4 h-4" />
                                        <span>Create First Employee</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Table */}
                            <div className="overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-gradient-to-r from-[var(--color-primary-dark)] to-[var(--color-primary-darker)]">
                                        <tr>
                                            {[
                                                { key: COLUMN_KEYS.NAME, label: 'Full Name', width: 'w-[15%]' },
                                                { key: COLUMN_KEYS.ID, label: 'Employee ID', width: 'w-[10%]' },
                                                { key: COLUMN_KEYS.DEPARTMENT, label: 'Department', width: 'w-[10%]' },
                                                { key: COLUMN_KEYS.DESIGNATION, label: 'Designation', width: 'w-[10%]' },
                                            ].map(({ key, label, width }) => (
                                                <th key={`header-${key}`} className={`${width} px-3 py-4 text-center`}>
                                                    <button
                                                        className="flex items-center justify-center w-full text-xs font-semibold text-white uppercase tracking-wider hover:text-gray-200 transition-colors"
                                                        onClick={() => requestSort(key)}
                                                    >
                                                        {label}
                                                        {renderSortIcon(key)}
                                                    </button>
                                                </th>
                                            ))}
                                            <th className="w-[20%] px-3 py-4 text-center text-xs font-semibold text-white uppercase tracking-wider">
                                                Email
                                            </th>
                                            <th className="w-[12%] px-3 py-4 text-center text-xs font-semibold text-white uppercase tracking-wider">
                                                Mobile
                                            </th>
                                            {/* Attendance Permission Column */}
                                            <th className="w-[18%] px-3 py-4 text-center">
                                                <button
                                                    className="flex items-center justify-center w-full text-xs font-semibold text-white uppercase tracking-wider hover:text-gray-200 transition-colors"
                                                    onClick={() => requestSort(COLUMN_KEYS.ATTENDANCE_TYPE)}
                                                >
                                                    Attendance Permission
                                                    {renderSortIcon(COLUMN_KEYS.ATTENDANCE_TYPE)}
                                                </button>
                                            </th>
                                            {(permissions?.employee_edit || permissions?.employee_view) && (
                                                <th className="w-[5%] px-3 py-4 text-center text-xs font-semibold text-white uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody className="bg-[var(--color-bg-secondary)] divide-y divide-[var(--color-border-divider)]">
                                        {/* Render actual employee rows */}
                                        {sortedEmployees.map((employee, index) => {
                                            const employeeId = employee.employee_id || `employee-${index}`;
                                            const truncatedName = truncateText(employee.full_name, 15);
                                            const truncatedDepartment = truncateText(employee.department_name, 10);
                                            const truncatedDesignation = truncateText(employee.designation_name, 10);

                                            return (
                                                <tr
                                                    key={`emp-${employeeId}`}
                                                    className={`h-[60px] hover:bg-[var(--color-primary-lightest)] transition-colors border-b border-[var(--color-border-divider)] ${(paginationLoading || searchLoading) ? 'opacity-50' : ''}`}
                                                >

                                                    {/* Full Name */}
                                                    <td className="px-3 py-4 text-center">
                                                        <div className="flex items-center justify-start gap-3">
                                                            <div className="flex-shrink-0 h-10 w-10 relative">
                                                                <div className="h-10 w-10 rounded-full bg-[var(--color-primary-dark)] flex items-center justify-center">
                                                                    <span className="text-sm font-medium text-[var(--color-text-white)]">
                                                                        {employee.full_name?.charAt(0) || 'N'}
                                                                    </span>
                                                                </div>
                                                                <div
                                                                    className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${employee.status_id === 1 || employee.status_id === '1'
                                                                        ? 'bg-green-500'
                                                                        : employee.status === 2 || employee.status === '2'
                                                                            ? 'bg-red-500'
                                                                            : 'bg-green-400'
                                                                        }`}
                                                                    title={
                                                                        employee.status === 1 || employee.status === '1'
                                                                            ? 'Active'
                                                                            : employee.status === 2 || employee.status === '2'
                                                                                ? 'Inactive'
                                                                                : 'Unknown'
                                                                    }
                                                                />
                                                            </div>
                                                            <div
                                                                className="text-sm font-medium text-[var(--color-text-primary)] cursor-help truncate max-w-[120px]"
                                                                title={employee.full_name}
                                                            >
                                                                {truncatedName || '--'}
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="px-3 py-4 text-center">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-[var(--color-text-primary)]">
                                                            {employee.employee_code || '-'}
                                                        </span>
                                                    </td>

                                                    {/* Department */}
                                                    <td className="px-3 py-4 text-center">
                                                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium  text-[var(--color-text-success)] max-w-[90px] truncate">
                                                            {truncatedDepartment}
                                                        </span>
                                                    </td>

                                                    {/* Designation */}
                                                    <td className="px-3 py-4 text-center">
                                                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium text-[var(--color-text-primary)] max-w-[90px] truncate">
                                                            {truncatedDesignation}
                                                        </span>
                                                    </td>

                                                    {/* Email */}
                                                    <td className="px-3 py-4 text-center">
                                                        <div className="text-sm text-[var(--color-text-secondary)] truncate max-w-[160px] mx-auto" title={employee.email}>
                                                            {employee.email || '--'}
                                                        </div>
                                                    </td>

                                                    {/* Mobile */}
                                                    <td className="px-3 py-4 text-center">
                                                        <div className="text-sm font-mono text-[var(--color-text-primary)]">
                                                            {employee.mobile_number || '--'}
                                                        </div>
                                                    </td>

                                                    {/* Attendance Permission */}
                                                    <td className="px-2 py-4 text-center">
                                                        {renderAttendanceTypeDisplay(employee)}
                                                    </td>

                                                    {/* Actions */}
                                                    {(permissions?.employee_edit || permissions?.employee_view) && (
                                                        <td className="px-3 py-4 text-center">
                                                            <div className="flex justify-center space-x-1">
                                                                {permissions['employee_edit'] && (
                                                                    <button
                                                                        onClick={() => handleEditEmployee(employee.employee_id)}
                                                                        disabled={paginationLoading || searchLoading}
                                                                        className="p-2 rounded-lg transition-all duration-200 text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] hover:bg-[var(--color-primary-lightest)] disabled:opacity-50 transform hover:scale-105"
                                                                        title="Edit Employee"
                                                                    >
                                                                        <Edit className="w-4 h-4" />
                                                                    </button>
                                                                )}
                                                                {permissions['employee_view'] && (
                                                                    <button
                                                                        onClick={() => handleViewDetails(employee.employee_id)}
                                                                        disabled={paginationLoading || searchLoading}
                                                                        className="p-2 rounded-lg transition-all duration-200 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-gray-light)] disabled:opacity-50 transform hover:scale-105"
                                                                        title="View Details"
                                                                    >
                                                                        <Eye className="w-4 h-4" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    )}
                                                </tr>
                                            );
                                        })}

                                        {/* Fill empty rows to maintain consistent height for 10 rows */}
                                        {Array.from({ length: Math.max(0, ITEMS_PER_PAGE - sortedEmployees.length) }).map((_, index) => (
                                            <tr key={`empty-${index}`} className="h-[60px] border-b border-[var(--color-border-divider)]">
                                                <td className="px-3 py-4 text-center">&nbsp;</td>
                                                <td className="px-3 py-4 text-center">&nbsp;</td>
                                                <td className="px-3 py-4 text-center">&nbsp;</td>
                                                <td className="px-3 py-4 text-center">&nbsp;</td>
                                                <td className="px-3 py-4 text-center">&nbsp;</td>
                                                <td className="px-3 py-4 text-center">&nbsp;</td>
                                                <td className="px-3 py-4 text-center">&nbsp;</td>
                                                {(permissions?.employee_edit || permissions?.employee_view) && (
                                                    <td className="px-3 py-4 text-center">&nbsp;</td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination Component */}
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                totalItems={totalEmployees}
                                itemsPerPage={ITEMS_PER_PAGE}
                                onPageChange={handlePageChange}
                                loading={paginationLoading || searchLoading}
                                showInfo={true}
                                maxVisiblePages={5}
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}