import { useEffect, useState, useCallback, useMemo, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
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
    CheckCircle,
    Home,
    X
} from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosInstance';
import { useSelector } from 'react-redux';
import Pagination from '../../Components/Pagination';
import LoadingSpinner from '../../Components/Loader/LoadingSpinner';
import { Toast } from '../../Components/ui/Toast';
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHeaderRow,
    Th,
    Td
} from '../../Components/ui/Table';
import CustomSelect from '../../Components/comman/CustomSelect';
import CustomInput from '../../Components/comman/CustomInput';

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

const LOCATION_TYPES = {
    OFFICE: 1,
    HOME: 2
};

const ITEMS_PER_PAGE = 10;

// ─── Floating anchor helpers ──────────────────────────────────────────────────
const getScrollParents = (node) => {
    const parents = [];
    if (!node) return parents;
    let parent = node.parentNode;
    const scrollRegex = /(auto|scroll|overlay)/;
    while (parent && parent.nodeType === 1) {
        const style = window.getComputedStyle(parent);
        const overflow = `${style.overflow}${style.overflowY}${style.overflowX}`;
        if (scrollRegex.test(overflow)) parents.push(parent);
        parent = parent.parentNode;
    }
    parents.push(window);
    return parents;
};

const useAnchoredPosition = (anchorRef, isOpen, opts = {}) => {
    const { placement = 'bottom-end', offset = 10, minWidth = 192 } = opts;
    const [pos, setPos] = useState({ top: -9999, left: -9999, width: 0, ready: false });
    const cleanupRef = useRef([]);

    const compute = useCallback(() => {
        const el = anchorRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const scrollX = window.scrollX || window.pageXOffset;
        const scrollY = window.scrollY || window.pageYOffset;
        let top = rect.bottom + scrollY + offset;
        let left;
        if (placement === 'bottom-start') left = rect.left + scrollX;
        else if (placement === 'bottom-center') left = rect.left + scrollX + rect.width / 2 - minWidth / 2;
        else left = rect.left + scrollX + rect.width - minWidth;
        setPos({ top, left, width: rect.width, ready: true });
    }, [anchorRef, offset, placement, minWidth]);

    useLayoutEffect(() => {
        if (!isOpen) {
            cleanupRef.current.forEach((fn) => fn && fn());
            cleanupRef.current = [];
            setPos((p) => ({ ...p, ready: false }));
            return;
        }
        compute();
        const parents = getScrollParents(anchorRef.current);
        const rafThrottle = (fn) => {
            let ticking = false;
            return () => {
                if (ticking) return;
                ticking = true;
                requestAnimationFrame(() => { fn(); ticking = false; });
            };
        };
        const handler = rafThrottle(() => compute());
        parents.forEach((p) => p.addEventListener('scroll', handler, { passive: true }));
        window.addEventListener('resize', handler, { passive: true });
        const remove = () => {
            parents.forEach((p) => p.removeEventListener('scroll', handler));
            window.removeEventListener('resize', handler);
        };
        cleanupRef.current.push(remove);
        return () => { remove(); cleanupRef.current = []; };
    }, [isOpen, compute, anchorRef]);

    return pos;
};

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
    const [locationChangingIds, setLocationChangingIds] = useState(new Set());

    // Toast state
    const [toast, setToast] = useState(null);

    // Filter popup states
    const [filterDropdown, setFilterDropdown] = useState(false);
    const filterBtnRef = useRef(null);
    const filterPos = useAnchoredPosition(filterBtnRef, filterDropdown, { placement: 'bottom-end', offset: 10, minWidth: 420 });

    // ===== FILTER STATE FIX =====
    // appliedFilters: jo actually API call me jata hai
    const [appliedFilters, setAppliedFilters] = useState({
        branch_id: '',
        department_id: '',
        designation_id: '',
        employee_type_id: '',
        salary_type_id: '',
        gender_id: '',
        status_id: ''
    });

    // tempFilters: jo dropdown me dikhata hai aur select karte waqt update hota hai
    const [tempFilters, setTempFilters] = useState({
        branch_id: '',
        department_id: '',
        designation_id: '',
        employee_type_id: '',
        salary_type_id: '',
        gender_id: '',
        status_id: ''
    });
    // ============================

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
            formData.append('page', page.toString());

            // Add search parameter if search query exists
            if (search && search.trim() !== '') {
                formData.append('search', search.trim());
            }

            // ===== USE appliedFilters INSTEAD OF filters =====
            if (appliedFilters.branch_id) {
                formData.append('branch_id', appliedFilters.branch_id);
            }
            if (appliedFilters.department_id) {
                formData.append('department_id', appliedFilters.department_id);
            }
            if (appliedFilters.designation_id) {
                formData.append('designation_id', appliedFilters.designation_id);
            }
            if (appliedFilters.employee_type_id) {
                formData.append('employee_type_id', appliedFilters.employee_type_id);
            }
            if (appliedFilters.salary_type_id) {
                formData.append('salary_type_id', appliedFilters.salary_type_id);
            }
            if (appliedFilters.gender_id) {
                formData.append('gender_id', appliedFilters.gender_id);
            }
            if (appliedFilters.status_id) {
                formData.append('status_id', appliedFilters.status_id);
            }
            // ================================================

            const response = await api.post('employee_list', formData);

            if (response.data?.success && response.data.data) {
                const newEmployees = response.data.data;
                setEmployees(newEmployees);

                // Calculate total pages based on response
                const itemsCount = newEmployees.length;
                if (itemsCount < ITEMS_PER_PAGE && page === 1) {
                    setTotalPages(1);
                    setTotalEmployees(itemsCount);
                } else if (itemsCount < ITEMS_PER_PAGE && page > 1) {
                    setTotalPages(page);
                    setTotalEmployees((page - 1) * ITEMS_PER_PAGE + itemsCount);
                } else {
                    setTotalPages(page + 1);
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
    }, [user, logout, searchQuery, appliedFilters]);

    // Handle filter changes - ONLY updates tempFilters, NOT appliedFilters
    const handleFilterChange = useCallback((key, value) => {
        setTempFilters(prev => {
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

    // Apply filters - copies tempFilters to appliedFilters and closes popup
    const applyFilters = useCallback(() => {
        setAppliedFilters({ ...tempFilters });
        setCurrentPage(1);
        setFilterDropdown(false);
    }, [tempFilters]);

    // Reset filters - resets BOTH tempFilters and appliedFilters
    const resetFilters = useCallback(() => {
        const emptyFilters = {
            branch_id: '',
            department_id: '',
            designation_id: '',
            employee_type_id: '',
            salary_type_id: '',
            gender_id: '',
            status_id: ''
        };
        setTempFilters(emptyFilters);
        setAppliedFilters(emptyFilters);
        setCurrentPage(1);
    }, []);

    // Open filter popup - sync tempFilters with appliedFilters
    const openFilterDropdown = useCallback(() => {
        setTempFilters({ ...appliedFilters });
        setFilterDropdown(true);
    }, [appliedFilters]);

    const getActiveFiltersCount = useCallback(() => {
        return Object.values(appliedFilters).filter((v) => v !== '').length;
    }, [appliedFilters]);

    // Handle attendance type change
    const handleAttendanceTypeChange = useCallback(async (employeeId, newAttendanceType, attendanceTypeStatus) => {
        try {
            setAttendanceChangingIds(prev => new Set(prev.add(employeeId)));

            const formData = new FormData();
            formData.append('employee_id', employeeId.toString());
            formData.append('attendance_type', newAttendanceType.toString());
            formData.append(
                'attendance_type_status',
                attendanceTypeStatus.toString()
            );

            if (newAttendanceType === ATTENDANCE_TYPES.MOBILE) {
                const employee = employees.find(emp => emp.employee_id === employeeId);
                const currentStatus = employee?.attendance_type_status || '1';
                formData.append('attendance_type_status', currentStatus.toString());
            }

            const response = await api.post('attendance_type_change', formData);

            if (response.data?.success) {
                setEmployees(prevEmployees =>
                    prevEmployees.map(emp =>
                        emp.employee_id === employeeId
                            ? { ...emp, attendance_type: newAttendanceType.toString() }
                            : emp
                    )
                );

                const attendanceTypeText = newAttendanceType === ATTENDANCE_TYPES.BIOMETRIC ? 'Biometric' : 'Mobile';
                showToast(`Attendance type updated to ${attendanceTypeText} successfully!`, 'success');
            } else {
                throw new Error(response.data?.message || 'Failed to update attendance type');
            }

        } catch (error) {
            console.error("Attendance type change error:", error);
            const errorMessage = error.response?.data?.message || error.message || "Failed to update attendance type";
            showToast(errorMessage, 'error');
        } finally {
            setAttendanceChangingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(employeeId);
                return newSet;
            });
        }
    }, [showToast, employees]);

    // Debounced search functionality - ONLY depends on searchQuery, NOT on filters
    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            setCurrentPage(1);
            fetchEmployees(1, searchQuery);
        }, 500);

        return () => clearTimeout(delayDebounce);
    }, [searchQuery]); // REMOVED filters from dependency

    // Effect to fetch when appliedFilters change
    useEffect(() => {
        if (isAuthenticated() && user?.user_id) {
            fetchEmployees(1, searchQuery, true);
        }
    }, [appliedFilters]); // Fetch when appliedFilters change

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

        const hasPermission = permissions['attendance_type_change'];

        if (!hasPermission) {
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
                                handleAttendanceTypeChange(employeeId, newType, employee.attendance_type_status);
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

                    <div className="ml-3 flex items-center">
                        <span className={`text-sm font-medium ${isBiometric ? 'text-[var(--color-text-success)]' : 'text-[var(--color-text-primary)]'
                            }`}>
                            {isBiometric ? 'Biometric' : 'Mobile'}
                        </span>
                    </div>
                </div>

                {isChanging && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-bg-secondary)]/80 rounded-lg">
                        <RefreshCw className="w-4 h-4 animate-spin text-[var(--color-primary-dark)]" />
                    </div>
                )}
            </div>
        );
    }, [attendanceChangingIds, permissions, handleAttendanceTypeChange, paginationLoading, searchLoading]);

    // Handle location permission change
    const handleLocationPermissionChange = useCallback(async (employeeId, newLocationType) => {
        try {
            setLocationChangingIds(prev => new Set(prev.add(employeeId)));

            const formData = new FormData();
            formData.append('employee_id', employeeId.toString());
            formData.append('attendance_type', '1');
            formData.append('attendance_type_status', newLocationType.toString());

            const response = await api.post('attendance_type_change', formData);

            if (response.data?.success) {
                setEmployees(prevEmployees =>
                    prevEmployees.map(emp =>
                        emp.employee_id === employeeId
                            ? { ...emp, attendance_type_status: newLocationType.toString() }
                            : emp
                    )
                );
                const locationTypeText = newLocationType === LOCATION_TYPES.OFFICE ? 'Office' : 'Home';
                showToast(`Location permission updated to ${locationTypeText} successfully!`, 'success');
            } else {
                throw new Error(response.data?.message || 'Failed to update location permission');
            }
        } catch (error) {
            console.error("Location type change error:", error);
            setEmployees(prevEmployees =>
                prevEmployees.map(emp =>
                    emp.employee_id === employeeId
                        ? { ...emp, attendance_type_status: newLocationType.toString() }
                        : emp
                )
            );
            showToast(`UI Updated: Location set to ${newLocationType === LOCATION_TYPES.OFFICE ? 'Office' : 'Home'}`, 'info');
        } finally {
            setLocationChangingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(employeeId);
                return newSet;
            });
        }
    }, [showToast]);

    // Render location permission display
    const renderLocationPermissionDisplay = useCallback((employee) => {
        const employeeId = employee.employee_id;
        const attendanceType = parseInt(employee.attendance_type);
        const currentLocationType = parseInt(employee.attendance_type_status) || LOCATION_TYPES.OFFICE;
        const isChanging = locationChangingIds.has(employeeId);
        const isOffice = currentLocationType === LOCATION_TYPES.OFFICE;

        const isMobile = attendanceType === ATTENDANCE_TYPES.MOBILE;
        const isInactive = employee.status === 2 || employee.status === '2';
        const hasPermission = permissions['attendance_type_change'];

        if (!hasPermission) {
            return (
                <div className={`flex items-center justify-center ${!isMobile ? 'opacity-40 select-none' : ''}`}>
                    {isOffice ? (
                        <div className="flex items-center space-x-2 px-2 py-1 bg-blue-50 rounded-full">
                            <Building className="w-4 h-4 text-blue-600" />
                            <span className="text-sm text-blue-700 font-medium">Office</span>
                        </div>
                    ) : (
                        <div className="flex items-center space-x-2 px-2 py-1 bg-purple-50 rounded-full">
                            <Home className="w-4 h-4 text-purple-600" />
                            <span className="text-sm text-purple-700 font-medium">Home</span>
                        </div>
                    )}
                </div>
            );
        }

        const isSwitchDisabled = isChanging || paginationLoading || searchLoading || isInactive || !isMobile;

        return (
            <div className="flex items-center justify-center relative">
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        id={`location-toggle-${employeeId}`}
                        checked={!isOffice}
                        onChange={(e) => {
                            if (!isSwitchDisabled) {
                                const newType = e.target.checked ? LOCATION_TYPES.HOME : LOCATION_TYPES.OFFICE;
                                handleLocationPermissionChange(employeeId, newType);
                            }
                        }}
                        disabled={isSwitchDisabled}
                        className="sr-only"
                    />
                    <label
                        htmlFor={`location-toggle-${employeeId}`}
                        className={`relative inline-flex items-center h-7 w-14 rounded-full transition-all duration-300 ease-in-out focus-within:ring-2 focus-within:ring-offset-2 ${!isOffice
                            ? 'bg-purple-500 focus-within:ring-purple-500'
                            : 'bg-blue-500 focus-within:ring-blue-500'
                            } ${isSwitchDisabled
                                ? 'opacity-50 cursor-not-allowed'
                                : 'cursor-pointer hover:shadow-md'
                            }`}
                    >
                        <span
                            className={`inline-block h-6 w-6 rounded-full bg-white shadow-lg transform transition-all duration-300 ease-in-out flex items-center justify-center ${!isOffice ? 'translate-x-7' : 'translate-x-0.5'
                                }`}
                        >
                            {!isOffice ? (
                                <Home className="w-3.5 h-3.5 text-purple-600" />
                            ) : (
                                <Building className="w-3.5 h-3.5 text-blue-600" />
                            )}
                        </span>
                    </label>

                    <div className="ml-3 flex items-center">
                        <span className={`text-sm font-medium ${!isOffice ? 'text-purple-700' : 'text-blue-700'
                            } ${isSwitchDisabled ? 'opacity-70' : ''}`}>
                            {!isOffice ? 'Personal' : 'Office'}
                        </span>
                    </div>
                </div>

                {isChanging && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-bg-secondary)]/80 rounded-lg">
                        <RefreshCw className="w-4 h-4 animate-spin text-[var(--color-primary-dark)]" />
                    </div>
                )}
            </div>
        );
    }, [locationChangingIds, permissions, handleLocationPermissionChange, paginationLoading, searchLoading]);

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
        <div className="h-100 bg-[var(--color-bg-primary)]">
            {/* Toast component */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={hideToast}
                />
            )}

            <div className="p-8 mx-auto">

                <div className="bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-primary-dark)] overflow-hidden shadow-sm">
                    {/* Header section */}
                    <div className="px-6 py-4 border-b border-[var(--color-primary-light)] bg-[var(--color-primary-lighter)]">
                        <div className="flex justify-between items-center flex-wrap gap-3">
                            <div className="flex items-center">
                                <Users className="h-6 w-6 text-[var(--color-primary-darker)] mr-2" />
                                <h3 className="text-lg font-medium text-[var(--color-primary-darker)]">
                                    All Employee List
                                </h3>
                            </div>

                            <div className="flex items-center gap-3 flex-wrap">
                                {/* <div className="relative w-full sm:w-64">
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
                                </div> */}
                                <div className="relative w-full sm:w-64">

                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)] z-10" />

                                    <CustomInput
                                        type="text"
                                        name="searchQuery"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search employees..."
                                        clearable={true}
                                        className="!h-[37px] [&_input]:!h-[37px] [&_input]:!pl-10 [&_input]:!pr-10 [&_input]:!rounded-md"
                                    />

                                </div>

                                {/* Filter button with popup */}
                                <div className="relative">
                                    <button
                                        ref={filterBtnRef}
                                        onClick={() => {
                                            if (!filterDropdown) {
                                                openFilterDropdown();
                                            } else {
                                                setFilterDropdown(false);
                                            }
                                        }}
                                        className="flex items-center gap-2 bg-[var(--color-bg-secondary)] text-[var(--color-primary-dark)] hover:bg-[var(--color-bg-primary)] px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                    >
                                        <Filter className="h-4 w-4" />
                                        Filters
                                        {getActiveFiltersCount() > 0 && (
                                            <span className="bg-[var(--color-primary-dark)] text-white text-xs rounded-full px-2 py-0.5">
                                                {getActiveFiltersCount()}
                                            </span>
                                        )}
                                        <ChevronDown className="h-4 w-4" />
                                    </button>

                                    {filterDropdown && createPortal(
                                        <>
                                            {/* Overlay backdrop */}
                                            <div
                                                className="fixed inset-0 z-[100] bg-black/40"
                                                onClick={() => setFilterDropdown(false)}
                                            />
                                            {/* Desktop popup */}
                                            <div
                                                className="hidden sm:flex flex-col absolute z-[110] bg-[var(--color-bg-secondary)] rounded-lg shadow-2xl border border-[var(--color-border-secondary)] max-h-[80vh]"
                                                style={{
                                                    position: 'absolute',
                                                    top: filterPos.ready ? filterPos.top : -9999,
                                                    left: filterPos.ready ? Math.max(12, filterPos.left) : -9999,
                                                    width: Math.max(520, filterPos.width),
                                                    minWidth: 520
                                                }}
                                            >
                                                {/* Popup header */}
                                                <div className="flex items-center justify-between p-4 border-b border-[var(--color-border-secondary)]">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-[var(--color-primary-lightest)] rounded-lg">
                                                            <Filter className="h-5 w-5 text-[var(--color-primary)]" />
                                                        </div>
                                                        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Filters</h2>
                                                    </div>
                                                    <button
                                                        onClick={() => setFilterDropdown(false)}
                                                        className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] p-1 rounded-lg hover:bg-[var(--color-bg-hover)]"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>

                                                {/* Popup body */}
                                                <div className="flex-1 overflow-visible p-4">
                                                    {dropdownLoading && (
                                                        <div className="flex items-center gap-2 mb-4 text-[var(--color-text-secondary)]">
                                                            <RefreshCw className="h-4 w-4 animate-spin" />
                                                            <span className="text-sm">Loading filter options...</span>
                                                        </div>
                                                    )}

                                                    <div className="grid grid-cols-2 gap-4">
                                                        {/* Branch */}
                                                        <div>
                                                            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                                                <Building className="inline h-4 w-4 mr-1" />
                                                                Branch
                                                            </label>
                                                            <CustomSelect
                                                                name="branch_id"
                                                                value={tempFilters.branch_id}
                                                                onChange={(e) => handleFilterChange('branch_id', e.target.value)}
                                                                options={branches.map((b) => ({
                                                                    value: b.id,
                                                                    label: b.name,
                                                                }))}
                                                                placeholder="All Branches"
                                                                searchable={true}
                                                                disabled={dropdownLoading}
                                                            />
                                                        </div>

                                                        {/* Department */}
                                                        <div>
                                                            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                                                <Users className="inline h-4 w-4 mr-1" />
                                                                Department
                                                            </label>
                                                            <CustomSelect
                                                                name="department_id"
                                                                value={tempFilters.department_id}
                                                                onChange={(e) => handleFilterChange('department_id', e.target.value)}
                                                                options={departments.map((d) => ({
                                                                    value: d.id,
                                                                    label: d.name,
                                                                }))}
                                                                placeholder="All Departments"
                                                                searchable={true}
                                                                disabled={dropdownLoading}
                                                            />
                                                        </div>

                                                        {/* Designation */}
                                                        <div>
                                                            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                                                <Award className="inline h-4 w-4 mr-1" />
                                                                Designation
                                                            </label>
                                                            <CustomSelect
                                                                name="designation_id"
                                                                value={tempFilters.designation_id}
                                                                onChange={(e) => handleFilterChange('designation_id', e.target.value)}
                                                                options={designations.map((d) => ({
                                                                    value: d.id,
                                                                    label: d.name,
                                                                }))}
                                                                placeholder="All Designations"
                                                                searchable={true}
                                                                disabled={dropdownLoading}
                                                            />
                                                        </div>

                                                        {/* Employee Type */}
                                                        <div>
                                                            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                                                <UserCheck className="inline h-4 w-4 mr-1" />
                                                                Employee Type
                                                            </label>
                                                            <CustomSelect
                                                                name="employee_type_id"
                                                                value={tempFilters.employee_type_id}
                                                                onChange={(e) => handleFilterChange('employee_type_id', e.target.value)}
                                                                options={employeeTypes.map((et) => ({
                                                                    value: et.id,
                                                                    label: et.name,
                                                                }))}
                                                                placeholder="All Employee Types"
                                                                searchable={true}
                                                                disabled={dropdownLoading}
                                                            />
                                                        </div>

                                                        {/* Salary Type */}
                                                        <div>
                                                            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                                                <DollarSign className="inline h-4 w-4 mr-1" />
                                                                Salary Type
                                                            </label>
                                                            <CustomSelect
                                                                name="salary_type_id"
                                                                value={tempFilters.salary_type_id}
                                                                onChange={(e) => handleFilterChange('salary_type_id', e.target.value)}
                                                                options={salaryTypes.map((st) => ({
                                                                    value: st.id,
                                                                    label: st.name,
                                                                }))}
                                                                placeholder="All Salary Types"
                                                                searchable={true}
                                                                disabled={dropdownLoading}
                                                            />
                                                        </div>

                                                        {/* Gender */}
                                                        <div>
                                                            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                                                <UserCircle className="inline h-4 w-4 mr-1" />
                                                                Gender
                                                            </label>
                                                            <CustomSelect
                                                                name="gender_id"
                                                                value={tempFilters.gender_id}
                                                                onChange={(e) => handleFilterChange('gender_id', e.target.value)}
                                                                options={genders.map((g) => ({
                                                                    value: g.id,
                                                                    label: g.name,
                                                                }))}
                                                                placeholder="All Genders"
                                                                searchable={true}
                                                                disabled={dropdownLoading}
                                                            />
                                                        </div>

                                                        {/* Status */}
                                                        <div className="col-span-2">
                                                            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                                                <CheckCircle className="inline h-4 w-4 mr-1" />
                                                                Status
                                                            </label>
                                                            <CustomSelect
                                                                name="status_id"
                                                                value={tempFilters.status_id}
                                                                onChange={(e) => handleFilterChange('status_id', e.target.value)}
                                                                options={status.map((s) => ({
                                                                    value: s.id,
                                                                    label: s.name,
                                                                }))}
                                                                placeholder="All Status"
                                                                searchable={true}
                                                                disabled={dropdownLoading}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Popup footer */}
                                                {/* <div className="flex gap-2 p-4 border-t border-[var(--color-border-secondary)]">
                                                    <button
                                                        onClick={applyFilters}
                                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[var(--color-primary-dark)] text-[var(--color-text-white)] rounded-lg hover:bg-[var(--color-primary-darker)] transition-colors text-sm font-medium"
                                                    >
                                                        <Filter className="h-4 w-4" /> Apply Filters
                                                    </button>
                                                    <button
                                                        onClick={() => { resetFilters(); setFilterDropdown(false); }}
                                                        className="flex items-center justify-center gap-2 px-4 py-2 bg-[var(--color-bg-gray-light)] text-[var(--color-text-secondary)] rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors text-sm font-medium min-w-[90px]"
                                                    >
                                                        <RefreshCw className="h-4 w-4" /> Reset
                                                    </button>
                                                </div> */}
                                                <div className="flex flex-col sm:flex-row justify-end gap-2 p-4 border-t border-[var(--color-border-secondary)] rounded-b-2xl">
                                                    <button
                                                        onClick={() => { resetFilters(); setFilterDropdown(false); }}
                                                        className="flex items-center justify-center gap-2 px-4 py-2 bg-transparent text-[var(--color-primary)] border-2 hover:bg-[var(--color-primary-lightest)] border-[var(--color-primary)] rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors text-sm font-medium min-w-[100px]"
                                                    >
                                                        <RefreshCw size={14} />
                                                        Reset
                                                    </button>

                                                    <button
                                                        onClick={applyFilters}
                                                        disabled={loading}
                                                        className="w-auto sm:w-[140px] flex items-center justify-center gap-2 px-4 py-2 bg-[var(--color-primary-dark)] text-[var(--color-text-white)] rounded-lg hover:bg-[var(--color-primary-darker)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                                                    >
                                                        {loading ? <Loader2 size={14} className="animate-spin" /> : <Filter size={14} />}
                                                        {loading ? 'Loading...' : 'Apply Filters'}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Mobile popup */}
                                            <div className="sm:hidden fixed inset-0 z-[110] flex">
                                                <div className="ml-auto h-full w-full bg-[var(--color-bg-secondary)] flex flex-col">
                                                    <div className="flex items-center justify-between p-4 border-b border-[var(--color-border-secondary)]">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-[var(--color-primary-lightest)] rounded-lg">
                                                                <Filter className="h-5 w-5 text-[var(--color-primary)]" />
                                                            </div>
                                                            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Filters</h2>
                                                        </div>
                                                        <button
                                                            onClick={() => setFilterDropdown(false)}
                                                            className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] p-1 rounded-lg hover:bg-[var(--color-bg-hover)]"
                                                        >
                                                            <X className="h-5 w-5" />
                                                        </button>
                                                    </div>
                                                    <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 gap-4">
                                                        {/* Branch */}
                                                        <div>
                                                            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                                                <Building className="inline h-4 w-4 mr-1" />
                                                                Branch
                                                            </label>
                                                            <CustomSelect
                                                                name="branch_id"
                                                                value={tempFilters.branch_id}
                                                                onChange={(e) => handleFilterChange('branch_id', e.target.value)}
                                                                options={branches.map((b) => ({
                                                                    value: b.id,
                                                                    label: b.name,
                                                                }))}
                                                                placeholder="All Branches"
                                                                searchable={true}
                                                                disabled={dropdownLoading}
                                                            />
                                                        </div>

                                                        {/* Department */}
                                                        <div>
                                                            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                                                <Users className="inline h-4 w-4 mr-1" />
                                                                Department
                                                            </label>
                                                            <CustomSelect
                                                                name="department_id"
                                                                value={tempFilters.department_id}
                                                                onChange={(e) => handleFilterChange('department_id', e.target.value)}
                                                                options={departments.map((d) => ({
                                                                    value: d.id,
                                                                    label: d.name,
                                                                }))}
                                                                placeholder="All Departments"
                                                                searchable={true}
                                                                disabled={dropdownLoading}
                                                            />
                                                        </div>

                                                        {/* Designation */}
                                                        <div>
                                                            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                                                <Award className="inline h-4 w-4 mr-1" />
                                                                Designation
                                                            </label>
                                                            <CustomSelect
                                                                name="designation_id"
                                                                value={tempFilters.designation_id}
                                                                onChange={(e) => handleFilterChange('designation_id', e.target.value)}
                                                                options={designations.map((d) => ({
                                                                    value: d.id,
                                                                    label: d.name,
                                                                }))}
                                                                placeholder="All Designations"
                                                                searchable={true}
                                                                disabled={dropdownLoading}
                                                            />
                                                        </div>

                                                        {/* Employee Type */}
                                                        <div>
                                                            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                                                <UserCheck className="inline h-4 w-4 mr-1" />
                                                                Employee Type
                                                            </label>
                                                            <CustomSelect
                                                                name="employee_type_id"
                                                                value={tempFilters.employee_type_id}
                                                                onChange={(e) => handleFilterChange('employee_type_id', e.target.value)}
                                                                options={employeeTypes.map((et) => ({
                                                                    value: et.id,
                                                                    label: et.name,
                                                                }))}
                                                                placeholder="All Employee Types"
                                                                searchable={true}
                                                                disabled={dropdownLoading}
                                                            />
                                                        </div>

                                                        {/* Salary Type */}
                                                        <div>
                                                            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                                                <DollarSign className="inline h-4 w-4 mr-1" />
                                                                Salary Type
                                                            </label>
                                                            <CustomSelect
                                                                name="salary_type_id"
                                                                value={tempFilters.salary_type_id}
                                                                onChange={(e) => handleFilterChange('salary_type_id', e.target.value)}
                                                                options={salaryTypes.map((st) => ({
                                                                    value: st.id,
                                                                    label: st.name,
                                                                }))}
                                                                placeholder="All Salary Types"
                                                                searchable={true}
                                                                disabled={dropdownLoading}
                                                            />
                                                        </div>

                                                        {/* Gender */}
                                                        <div>
                                                            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                                                <UserCircle className="inline h-4 w-4 mr-1" />
                                                                Gender
                                                            </label>
                                                            <CustomSelect
                                                                name="gender_id"
                                                                value={tempFilters.gender_id}
                                                                onChange={(e) => handleFilterChange('gender_id', e.target.value)}
                                                                options={genders.map((g) => ({
                                                                    value: g.id,
                                                                    label: g.name,
                                                                }))}
                                                                placeholder="All Genders"
                                                                searchable={true}
                                                                disabled={dropdownLoading}
                                                            />
                                                        </div>

                                                        {/* Status */}
                                                        <div>
                                                            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                                                <CheckCircle className="inline h-4 w-4 mr-1" />
                                                                Status
                                                            </label>
                                                            <CustomSelect
                                                                name="status_id"
                                                                value={tempFilters.status_id}
                                                                onChange={(e) => handleFilterChange('status_id', e.target.value)}
                                                                options={status.map((s) => ({
                                                                    value: s.id,
                                                                    label: s.name,
                                                                }))}
                                                                placeholder="All Status"
                                                                searchable={true}
                                                                disabled={dropdownLoading}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="p-4 border-t border-[var(--color-border-secondary)] grid grid-cols-1 gap-2">
                                                        <button
                                                            onClick={applyFilters}
                                                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[var(--color-primary-dark)] text-[var(--color-text-white)] rounded-lg hover:bg-[var(--color-primary-darker)] transition-colors text-sm font-medium"
                                                        >
                                                            <Filter className="h-4 w-4" /> Apply Filters
                                                        </button>
                                                        <button
                                                            onClick={() => { resetFilters(); setFilterDropdown(false); }}
                                                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[var(--color-bg-gray-light)] text-[var(--color-text-secondary)] rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors text-sm font-medium"
                                                        >
                                                            Reset
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </>,
                                        document.body
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
                                <Table>
                                    <TableHeader>
                                        <TableHeaderRow>
                                            {[
                                                { key: COLUMN_KEYS.NAME, label: 'Full Name', width: 'w-[14%]' },
                                                { key: COLUMN_KEYS.ID, label: 'Employee ID', width: 'w-[8%]' },
                                                { key: COLUMN_KEYS.DEPARTMENT, label: 'Department', width: 'w-[9%]' },
                                                { key: COLUMN_KEYS.DESIGNATION, label: 'Designation', width: 'w-[9%]' },
                                            ].map(({ key, label, width }) => (
                                                <Th
                                                    key={`header-${key}`}
                                                    className={`${width} text-center`}
                                                    onClick={() => requestSort(key)}
                                                >
                                                    <div className="flex items-center justify-center w-full">
                                                        {label}
                                                        {renderSortIcon(key)}
                                                    </div>
                                                </Th>
                                            ))}

                                            <Th className="w-[15%] text-center">
                                                Email
                                            </Th>

                                            <Th className="w-[10%] text-center">
                                                Mobile
                                            </Th>

                                            <Th
                                                className="w-[15%] text-center"
                                                onClick={() => requestSort(COLUMN_KEYS.ATTENDANCE_TYPE)}
                                            >
                                                <div className="flex items-center justify-center w-full">
                                                    Attendance Permission
                                                    {renderSortIcon(COLUMN_KEYS.ATTENDANCE_TYPE)}
                                                </div>
                                            </Th>

                                            <Th className="w-[15%] text-center">
                                                Location Permission
                                            </Th>

                                            {(permissions?.employee_edit || permissions?.employee_view) && (
                                                <Th className="w-[5%] text-center">
                                                    Actions
                                                </Th>
                                            )}
                                        </TableHeaderRow>
                                    </TableHeader>

                                    <TableBody>
                                        {sortedEmployees.map((employee, index) => {
                                            const employeeId = employee.employee_id || `employee-${index}`;
                                            const truncatedName = truncateText(employee.full_name, 15);
                                            const truncatedDepartment = truncateText(employee.department_name, 10);
                                            const truncatedDesignation = truncateText(employee.designation_name, 10);

                                            return (
                                                <TableRow
                                                    key={`emp-${employeeId}`}
                                                    className={`${(paginationLoading || searchLoading)
                                                        ? 'opacity-50'
                                                        : ''
                                                        }`}
                                                >
                                                    {/* Full Name */}
                                                    <Td className="text-center">
                                                        <div className="flex items-center justify-start gap-3">
                                                            <div className="flex-shrink-0 h-10 w-10 relative">
                                                                <div className="h-10 w-10 rounded-full bg-[var(--color-primary-dark)] flex items-center justify-center">
                                                                    <span className="text-sm font-medium text-white">
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
                                                                />
                                                            </div>

                                                            <div
                                                                className="text-sm font-medium cursor-help truncate max-w-[120px]"
                                                                title={employee.full_name}
                                                            >
                                                                {truncatedName || '--'}
                                                            </div>
                                                        </div>
                                                    </Td>

                                                    {/* Employee ID */}
                                                    <Td className="text-center">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                                                            {employee.employee_code || '-'}
                                                        </span>
                                                    </Td>

                                                    {/* Department */}
                                                    <Td className="text-center">
                                                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium max-w-[90px] truncate">
                                                            {truncatedDepartment}
                                                        </span>
                                                    </Td>

                                                    {/* Designation */}
                                                    <Td className="text-center">
                                                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium max-w-[90px] truncate">
                                                            {truncatedDesignation}
                                                        </span>
                                                    </Td>

                                                    {/* Email */}
                                                    <Td className="text-center">
                                                        <div
                                                            className="text-sm truncate max-w-[160px] mx-auto"
                                                            title={employee.email}
                                                        >
                                                            {employee.email || '--'}
                                                        </div>
                                                    </Td>

                                                    {/* Mobile */}
                                                    <Td className="text-center">
                                                        <div className="text-sm font-mono">
                                                            {employee.mobile_number || '--'}
                                                        </div>
                                                    </Td>

                                                    {/* Attendance */}
                                                    <Td className="text-center">
                                                        {renderAttendanceTypeDisplay(employee)}
                                                    </Td>

                                                    {/* Location */}
                                                    <Td className="text-center">
                                                        {renderLocationPermissionDisplay(employee)}
                                                    </Td>

                                                    {/* Actions */}
                                                    {(permissions?.employee_edit || permissions?.employee_view) && (
                                                        <Td className="text-center">
                                                            <div className="flex justify-center space-x-1">

                                                                {permissions['employee_edit'] && (
                                                                    <button
                                                                        onClick={() => handleEditEmployee(employee.employee_id)}
                                                                        disabled={paginationLoading || searchLoading}
                                                                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 hover:scale-110 hover:shadow-md transition-all duration-200 disabled:opacity-50"
                                                                    >
                                                                        <Edit className="w-4 h-4" strokeWidth={2.5} />
                                                                    </button>
                                                                )}

                                                                {permissions['employee_view'] && (
                                                                    <button
                                                                        onClick={() => handleViewDetails(employee.employee_id)}
                                                                        disabled={paginationLoading || searchLoading}
                                                                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:scale-110 hover:shadow-md transition-all duration-200 disabled:opacity-50"
                                                                    >
                                                                        <Eye className="w-4 h-4" strokeWidth={2.5} />
                                                                    </button>
                                                                )}

                                                            </div>
                                                        </Td>
                                                    )}

                                                </TableRow>
                                            );
                                        })}

                                    </TableBody>
                                </Table>
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
