import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Users, Calendar, RefreshCw, X, Building, Filter, CheckCircle2, XCircle, Plus, Search, Eye } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosInstance';
import { useNavigate } from 'react-router-dom';
import { Toast } from '../../Components/ui/Toast';
import Pagination from '../../Components/Pagination';

const ShiftReallocation = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // View state - 'list' or 'form'
    const [view, setView] = useState('list');

    // List view states
    const [reallocationHistory, setReallocationHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [historyError, setHistoryError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchLoading, setSearchLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [employeeModal, setEmployeeModal] = useState({ isOpen: false, employees: [], shiftName: '' });

    // Form view states
    const [shifts, setShifts] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [branches, setBranches] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [employeesLoading, setEmployeesLoading] = useState(false);
    const [dropdownLoading, setDropdownLoading] = useState(false);
    const [error, setError] = useState(null);
    const [sourceShift, setSourceShift] = useState('');
    const [targetShift, setTargetShift] = useState('');
    const [selectedEmployees, setSelectedEmployees] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [effectiveDate, setEffectiveDate] = useState(null);
    const [filters, setFilters] = useState({
        branch_id: '',
        department_id: ''
    });

    const hasInitialized = useRef(false);

    const minDate = useMemo(() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow;
    }, []);

    // Toast helpers
    const showToast = (message, type = 'info') => setToast({ message, type });
    const closeToast = () => setToast(null);

    // Fetch reallocation history
    const fetchReallocationHistory = async (page = 1, search = '') => {
        try {
            if (search !== '') {
                setSearchLoading(true);
            } else {
                setHistoryLoading(true);
            }
            setHistoryError(null);

            if (!user?.user_id) {
                throw new Error('User ID is required');
            }

            const formData = new FormData();
            formData.append('user_id', user.user_id);
            formData.append('page', page.toString());

            if (search && search.trim() !== '') {
                formData.append('search', search.trim());
            }

            const response = await api.post('shift_change_schedule_list', formData);

            if (response.data.success) {
                const historyData = response.data.data || [];
                setReallocationHistory(historyData);

                const paginationData = response.data.pagination || {};
                setTotalPages(paginationData.total_pages || 1);
                setCurrentPage(paginationData.current_page || page);
            } else {
                throw new Error(response.data.message || 'Failed to fetch reallocation history');
            }
        } catch (error) {
            console.error('Error fetching reallocation history:', error);
            const errorMessage = error.response?.data?.message || error.message || "An unexpected error occurred";
            setHistoryError(errorMessage);
        } finally {
            setHistoryLoading(false);
            setSearchLoading(false);
        }
    };

    // Fetch shifts from API
    const fetchShifts = async () => {
        try {
            setLoading(true);
            setError(null);

            if (!user?.user_id) {
                throw new Error('User ID is required');
            }

            const formData = new FormData();
            formData.append('user_id', user.user_id);

            const response = await api.post('shift_list', formData);

            if (response.data.success) {
                const shiftsData = response.data.data || [];
                setShifts(shiftsData);
            } else {
                throw new Error(response.data.message || 'Failed to fetch shifts');
            }
        } catch (error) {
            console.error('Error fetching shifts:', error);
            const errorMessage = error.response?.data?.message || error.message || "An unexpected error occurred";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Fetch dropdown data (branches and departments)
    const fetchDropdownData = useCallback(async () => {
        try {
            setDropdownLoading(true);
            if (!user?.user_id) throw new Error('User ID is required');

            const formData = new FormData();
            formData.append('user_id', user.user_id);

            const response = await api.post('employee_drop_down_list', formData);

            if (response.data?.success && response.data.data) {
                const data = response.data.data;
                setBranches((data.branch_list || []).map(b => ({
                    id: b.branch_id,
                    name: b.name
                })));
                setDepartments((data.department_list || []).map(d => ({
                    id: d.department_id,
                    name: d.name
                })));
            } else {
                throw new Error(response.data?.message || 'Failed to load filter options');
            }
        } catch (error) {
            console.error('Error fetching dropdown data:', error);
            showToast('Failed to load filter options', 'error');
        } finally {
            setDropdownLoading(false);
        }
    }, [user?.user_id]);

    // Fetch employees for selected shift with filters
    const fetchEmployeesForShift = useCallback(async (shiftId) => {
        try {
            setEmployeesLoading(true);
            setEmployees([]);
            setSelectedEmployees([]);

            if (!user?.user_id) {
                throw new Error('User ID is required');
            }

            const formData = new FormData();
            formData.append('user_id', user.user_id);
            formData.append('from_shift_id', shiftId);

            if (filters.branch_id) {
                formData.append('branch_id', filters.branch_id);
            }

            if (filters.department_id) {
                formData.append('department_id', filters.department_id);
            }

            const response = await api.post('shift_change_list_drop_down', formData);

            if (response.data.success && response.data.data?.shift_change_employee) {
                const employeesData = response.data.data.shift_change_employee.map(emp => ({
                    employee_id: emp.employee_id,
                    full_name: emp.full_name,
                    id: emp.employee_id
                }));
                setEmployees(employeesData);
            } else {
                showToast(response.data.message || 'Failed to fetch employees', 'error');
            }
        } catch (error) {
            console.error('Error fetching employees:', error);
            showToast('Failed to load employees. Please try again.', 'error');
        } finally {
            setEmployeesLoading(false);
        }
    }, [user?.user_id, filters.branch_id, filters.department_id]);

    // Initialize data
    useEffect(() => {
        if (!user?.user_id || hasInitialized.current) return;
        hasInitialized.current = true;
        fetchReallocationHistory(currentPage);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    // Search debounce
    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            if (view === 'list') {
                if (searchQuery !== '') {
                    setCurrentPage(1);
                    fetchReallocationHistory(1, searchQuery);
                } else {
                    fetchReallocationHistory(currentPage, '');
                }
            }
        }, 500);

        return () => clearTimeout(delayDebounce);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery]);

    // Refetch employees when filters change
    useEffect(() => {
        if (view === 'form' && sourceShift) {
            fetchEmployeesForShift(sourceShift);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters.branch_id, filters.department_id]);

    // Handle page change
    const handlePageChange = (page) => {
        setCurrentPage(page);
        fetchReallocationHistory(page, searchQuery);
    };

    // Handle search input change
    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    // Clear search
    const clearSearch = () => {
        setSearchQuery('');
        setCurrentPage(1);
        fetchReallocationHistory(1, '');
    };

    // Open reallocation form
    const handleOpenForm = () => {
        setView('form');
        fetchShifts();
        fetchDropdownData();
    };

    // Close form and return to list
    const handleCloseForm = () => {
        setView('list');
        setSourceShift('');
        setTargetShift('');
        setSelectedEmployees([]);
        setSearchTerm('');
        setEffectiveDate(null);
        setEmployees([]);
        resetFilters();
        fetchReallocationHistory(currentPage);
    };

    // Handle source shift change
    const handleSourceShiftChange = (shiftId) => {
        setSourceShift(shiftId);
        setSelectedEmployees([]);
        setSearchTerm('');
        resetFilters();

        if (shiftId) {
            fetchEmployeesForShift(shiftId);
        } else {
            setEmployees([]);
        }
    };

    const eligibleEmployees = useMemo(() => {
        if (!sourceShift || employees.length === 0) return [];

        let filtered = [...employees];

        if (searchTerm) {
            const s = searchTerm.toLowerCase();
            filtered = filtered.filter((e) =>
                (e.full_name || '').toLowerCase().includes(s) ||
                String(e.employee_id || '').includes(searchTerm)
            );
        }

        return filtered;
    }, [sourceShift, employees, searchTerm]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const resetFilters = () => {
        setFilters({
            branch_id: '',
            department_id: ''
        });
        setSearchTerm('');
    };

    const toggleEmployee = (empId) => {
        setSelectedEmployees((prev) =>
            prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
        );
    };

    const selectAllFiltered = () => {
        const allIds = eligibleEmployees.map((e) => e.employee_id);
        setSelectedEmployees(allIds);
    };

    const clearAllSelected = () => setSelectedEmployees([]);

    const selectedEmployeeObjects = useMemo(() => {
        if (!selectedEmployees.length) return [];
        const mapById = new Map(employees.map((e) => [e.employee_id, e]));
        return selectedEmployees
            .map((id) => mapById.get(id))
            .filter(Boolean);
    }, [selectedEmployees, employees]);

    const handleSubmit = async () => {
        if (!sourceShift || !targetShift) {
            showToast('Please select both source and target shifts', 'error');
            return;
        }

        if (sourceShift === targetShift) {
            showToast('Source and target shifts cannot be the same', 'error');
            return;
        }

        if (selectedEmployees.length === 0) {
            showToast('Please select at least one employee to reallocate', 'error');
            return;
        }

        if (!effectiveDate) {
            showToast('Please select an effective date for the reallocation', 'error');
            return;
        }

        setSubmitting(true);

        try {
            const formData = new FormData();
            formData.append('user_id', user.user_id);

            selectedEmployees.forEach((empId, index) => {
                formData.append(`employee_ids[${index}]`, empId);
            });

            formData.append('from_shift_id', sourceShift);
            formData.append('to_shift_id', targetShift);

            const year = effectiveDate.getFullYear();
            const month = String(effectiveDate.getMonth() + 1).padStart(2, '0');
            const day = String(effectiveDate.getDate()).padStart(2, '0');
            const formattedDate = `${year}-${month}-${day}`;

            formData.append('change_date', formattedDate);

            const response = await api.post('shift_change_schedule', formData);

            if (response.data.success) {
                const day = String(effectiveDate.getDate()).padStart(2, '0');
                const month = String(effectiveDate.getMonth() + 1).padStart(2, '0');
                const year = effectiveDate.getFullYear();
                const displayDate = `${day}-${month}-${year}`;

                const targetShiftObj = shifts.find(s => s.shift_id === targetShift);
                showToast(`Successfully scheduled reallocation of ${selectedEmployees.length} employee(s) to ${targetShiftObj?.shift_name} effective from ${displayDate}`, 'success');

                handleCloseForm();
            } else {
                showToast(response.data.message || 'Failed to reallocate shifts', 'error');
            }
        } catch (error) {
            console.error('Error reallocating shifts:', error);
            showToast('An error occurred while reallocating shifts', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleBack = () => {
        navigate(-1);
    };

    // Get status badge color
    const getStatusBadge = (status) => {
        const statusLower = status?.toLowerCase();
        if (statusLower === 'Done' || statusLower === 'done') {
            return 'bg-green-100 text-green-800 border-green-200';
        } else if (statusLower === 'pending' || statusLower === 'scheduled') {
            return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        } else if (statusLower === 'cancelled' || statusLower === 'failed') {
            return 'bg-red-100 text-red-800 border-red-200';
        }
        return 'bg-gray-100 text-gray-800 border-gray-200';
    };
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';

        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString; // Return original if invalid

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        return `${day}-${month}-${year}`;
    };

    // Employee Modal Component
    const EmployeeModal = ({ isOpen, onClose, employees, shiftName }) => {
        if (!isOpen) return null;

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                <div className="bg-[var(--color-bg-secondary)] rounded-lg shadow-xl w-full mx-4 max-h-96">
                    <div className="p-8">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                                Selected Employees - {shiftName}
                            </h3>
                            <button
                                onClick={onClose}
                                className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {employees.length > 0 ? (
                            <div className="max-h-64 overflow-y-auto">
                                <div className="space-y-2">
                                    {employees.map((employee, index) => (
                                        <div key={employee.employee_id || index} className="flex items-center gap-3 p-3 bg-[var(--color-bg-primary)] rounded-lg">
                                            <div className="w-8 h-8 bg-[var(--color-primary-dark)] rounded-full flex items-center justify-center">
                                                <span className="text-[var(--color-text-white)] text-sm font-medium">
                                                    {employee.employee_name?.charAt(0)?.toUpperCase() || 'E'}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="font-medium text-[var(--color-text-primary)]">
                                                    {employee.employee_name || 'Unknown Employee'}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <Users className="w-12 h-12 text-[var(--color-text-muted)] mx-auto mb-3" />
                                <p className="text-[var(--color-text-secondary)]">No employees selected</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[var(--color-bg-primary)]">
            <div className=" mx-auto p-8">
                {/* Header */}
                <div className="bg-[var(--color-bg-secondary)] rounded-2xl shadow-xl mb-8 overflow-hidden">
                    <div className="bg-gradient-to-r from-[var(--color-primary-dark)] to-[var(--color-primary-darker)] p-8">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={view === 'form' ? handleCloseForm : handleBack}
                                className="flex items-center gap-2 text-[var(--color-text-white)] hover:text-[var(--color-text-white)] transition-colors bg-[var(--color-bg-secondary-20)] hover:bg-[var(--color-bg-secondary-30)] px-4 py-2 rounded-lg backdrop-blur-sm"
                            >
                                <ArrowLeft size={18} />
                                <span className="font-medium">Back</span>
                            </button>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold text-[var(--color-text-white)]">Shift Reallocation</h1>
                            </div>
                        </div>
                    </div>
                </div>

                {/* List View */}
                {view === 'list' && (
                    <div className="bg-[var(--color-bg-secondary)] rounded-lg shadow-sm border border-[var(--color-primary-dark)]">
                        <div className="px-6 py-4 border-b border-[var(--color-primary-light)] bg-[var(--color-primary-dark)]">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-[var(--color-text-white)] flex items-center gap-2">
                                    <Calendar className="w-5 h-5" />
                                    Reallocation History
                                </h2>
                                <div className="flex items-center gap-3">
                                    <div className="relative w-full sm:w-64">
                                        <input
                                            type="text"
                                            placeholder="Search..."
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
                                    <button
                                        onClick={handleOpenForm}
                                        className="flex items-center gap-2 bg-[var(--color-bg-secondary)] text-[var(--color-primary-dark)] hover:bg-[var(--color-bg-primary)] px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Shift Reallocation
                                    </button>
                                </div>
                            </div>
                        </div>

                        {historyLoading ? (
                            <div className="px-6 py-12 text-center">
                                <div className="inline-flex items-center space-x-2 text-[var(--color-text-secondary)]">
                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                    <span>Loading reallocation history...</span>
                                </div>
                            </div>
                        ) : historyError ? (
                            <div className="px-6 py-12 text-center">
                                <div className="bg-[var(--color-error-light)] border border-[var(--color-border-error)] rounded-lg p-8">
                                    <XCircle className="w-12 h-12 text-[var(--color-error)] mx-auto mb-4" />
                                    <p className="text-[var(--color-error-dark)] text-lg font-medium mb-2">Error Loading History</p>
                                    <p className="text-[var(--color-text-error)] mb-4">{historyError}</p>
                                    <button
                                        onClick={() => fetchReallocationHistory(currentPage, searchQuery)}
                                        className="inline-flex items-center space-x-2 bg-[var(--color-error-light)] text-[var(--color-error-dark)] px-4 py-2 rounded-md hover:bg-[var(--color-error-lighter)] transition-colors"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        <span>Try Again</span>
                                    </button>
                                </div>
                            </div>
                        ) : reallocationHistory.length === 0 ? (
                            <div className="px-6 py-12 text-center">
                                <div className="bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] rounded-lg p-8">
                                    <div className="w-16 h-16 bg-[var(--color-bg-gray-light)] rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Calendar className="w-8 h-8 text-[var(--color-text-muted)]" />
                                    </div>
                                    <p className="text-[var(--color-text-secondary)] text-lg font-medium mb-2">No Reallocation History</p>
                                    <p className="text-[var(--color-text-secondary)] text-sm mb-4">
                                        {searchQuery ? 'No reallocations match your search criteria.' : 'You haven\'t made any shift reallocations yet.'}
                                    </p>
                                    {!searchQuery && (
                                        <button
                                            onClick={handleOpenForm}
                                            className="inline-flex items-center space-x-2 bg-[var(--color-primary-dark)] text-[var(--color-text-white)] px-4 py-2 rounded-md hover:bg-[var(--color-primary-darker)] transition-colors"
                                        >
                                            <Plus className="w-4 w-4" />
                                            <span>Create First Reallocation</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-[var(--color-border-divider)]">
                                        <thead className="bg-[var(--color-primary-lightest)]">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                                                    From Shift
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                                                    To Shift
                                                </th>
                                                <th className="px-6 py-3 text-left  text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                                                    Reallocation Date
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                                                    Status
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                                                    Employees
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-[var(--color-bg-secondary)] divide-y divide-[var(--color-border-divider)]">
                                            {reallocationHistory.map((item, index) => (
                                                <tr key={item.id || index} className="hover:bg-[var(--color-bg-primary)] transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[var(--color-text-primary)]">
                                                        {item.from_shift_name || 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[var(--color-text-primary)]">
                                                        {item.to_shift_name || 'N/A'}
                                                    </td>
                                                    <td className="px-12 py-4 text-left whitespace-nowrap text-sm text-[var(--color-text-secondary)]">
                                                        {formatDate(item.change_date || item.reallocation_date)}
                                                    </td>
                                                    <td className="px-3 py-4 whitespace-nowrap">
                                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusBadge(item.executed_name)}`}>
                                                            {item.executed_name || 'Pending'}
                                                        </span>
                                                    </td>
                                                    <td className="px-9 py-4 whitespace-nowrap text-sm text-[var(--color-text-secondary)]">
                                                        <button
                                                            onClick={() => setEmployeeModal({
                                                                isOpen: true,
                                                                employees: item.employees || [],
                                                                shiftName: `${item.from_shift_name} → ${item.to_shift_name}`
                                                            })}
                                                            className="flex items-center gap-2 text-[var(--color-primary-dark)] hover:text-primary-800 transition-colors"
                                                        >
                                                            <span className="font-medium">
                                                                {item.employee_count || (item.employees?.length) || 0}
                                                            </span>
                                                            <Users className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {totalPages > 1 && (
                                    <Pagination
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        onPageChange={handlePageChange}
                                        loading={historyLoading}
                                    />
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* Form View */}
                {view === 'form' && (
                    <>
                        {loading ? (
                            <div className="bg-[var(--color-bg-secondary)] rounded-lg shadow-sm border border-[var(--color-primary-dark)] p-12 text-center">
                                <div className="inline-flex items-center space-x-2 text-[var(--color-text-secondary)]">
                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                    <span>Loading shifts...</span>
                                </div>
                            </div>
                        ) : error ? (
                            <div className="bg-[var(--color-bg-secondary)] rounded-lg shadow-sm border border-[var(--color-primary-dark)] p-12">
                                <div className="bg-[var(--color-error-light)] border border-[var(--color-border-error)] rounded-lg p-8">
                                    <XCircle className="w-12 h-12 text-[var(--color-error)] mx-auto mb-4" />
                                    <p className="text-[var(--color-error-dark)] text-lg font-medium mb-2">Error Loading Shifts</p>
                                    <p className="text-[var(--color-text-error)] mb-4">{error}</p>
                                    <button
                                        onClick={fetchShifts}
                                        className="inline-flex items-center space-x-2 bg-[var(--color-error-light)] text-[var(--color-error-dark)] px-4 py-2 rounded-md hover:bg-[var(--color-error-lighter)] transition-colors"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        <span>Try Again</span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Shift Selection */}
                                <div className="bg-[var(--color-bg-secondary)] rounded-lg shadow-sm border border-[var(--color-primary-dark)]">
                                    <div className="px-6 py-4 border-b border-[var(--color-primary-light)] bg-[var(--color-primary-dark)]">
                                        <h2 className="text-lg font-semibold text-[var(--color-text-white)] flex items-center gap-2">
                                            <Calendar className="w-5 h-5" />
                                            Shift Selection
                                        </h2>
                                    </div>
                                    <div className="p-8">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                                    From Shift <span className="text-[var(--color-error)]">*</span>
                                                </label>
                                                <select
                                                    value={sourceShift}
                                                    onChange={(e) => handleSourceShiftChange(e.target.value)}
                                                    className="w-full px-3 py-2 border border-[var(--color-border-secondary)] rounded-md focus:ring-2 focus:ring-[var(--color-primary-dark)] focus:border-transparent bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)]"
                                                >
                                                    <option value="">Select source shift</option>
                                                    {shifts.map((shift) => (
                                                        <option key={shift.shift_id} value={shift.shift_id}>
                                                            {shift.shift_name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                                    To Shift <span className="text-[var(--color-error)]">*</span>
                                                </label>
                                                <select
                                                    value={targetShift}
                                                    onChange={(e) => setTargetShift(e.target.value)}
                                                    disabled={!sourceShift}
                                                    className="w-full px-3 py-2 border border-[var(--color-border-secondary)] rounded-md focus:ring-2 focus:ring-[var(--color-primary-dark)] focus:border-transparent bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] disabled:bg-[var(--color-bg-gray-light)] disabled:cursor-not-allowed"
                                                >
                                                    <option value="">Select target shift</option>
                                                    {shifts.filter(s => s.shift_id !== sourceShift).map((shift) => (
                                                        <option key={shift.shift_id} value={shift.shift_id}>
                                                            {shift.shift_name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                                    Effective Date <span className="text-[var(--color-error)]">*</span>
                                                </label>
                                                <DatePicker
                                                    selected={effectiveDate}
                                                    onChange={(date) => setEffectiveDate(date)}
                                                    minDate={minDate}
                                                    disabled={!sourceShift || !targetShift}
                                                    dateFormat="MMMM d, yyyy"
                                                    placeholderText="Select date"
                                                    className="w-full px-3 py-2 border border-[var(--color-border-secondary)] rounded-md focus:ring-2 focus:ring-[var(--color-primary-dark)] focus:border-transparent bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] disabled:bg-[var(--color-bg-gray-light)] disabled:cursor-not-allowed"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Filters */}
                                {sourceShift && (
                                    <div className="bg-[var(--color-bg-secondary)] rounded-lg shadow-sm border border-[var(--color-primary-dark)]">
                                        <div className="px-6 py-4 border-b border-[var(--color-primary-light)] bg-[var(--color-primary-dark)] flex items-center justify-between">
                                            <h2 className="text-lg font-semibold text-[var(--color-text-white)] flex items-center gap-2">
                                                <Filter className="w-5 h-5" />
                                                Filters
                                            </h2>
                                            {(filters.branch_id || filters.department_id || searchTerm) && (
                                                <button
                                                    type="button"
                                                    onClick={resetFilters}
                                                    className="text-sm text-[var(--color-bg-secondary)] hover:text-[var(--color-text-white)] font-medium"
                                                >
                                                    Reset Filters
                                                </button>
                                            )}
                                        </div>
                                        <div className="p-8">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                <div>
                                                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                                        <Building className="w-4 h-4 inline mr-1" />
                                                        Branch
                                                    </label>
                                                    <select
                                                        value={filters.branch_id}
                                                        onChange={(e) => handleFilterChange('branch_id', e.target.value)}
                                                        disabled={dropdownLoading}
                                                        className="w-full px-3 py-2 border border-[var(--color-border-secondary)] rounded-md focus:ring-2 focus:ring-[var(--color-primary-dark)] focus:border-transparent bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] disabled:bg-[var(--color-bg-gray-light)] disabled:cursor-not-allowed"
                                                    >
                                                        <option value="">All Branches</option>
                                                        {branches.map(branch => (
                                                            <option key={branch.id} value={branch.id}>
                                                                {branch.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                                        <Users className="w-4 h-4 inline mr-1" />
                                                        Department
                                                    </label>
                                                    <select
                                                        value={filters.department_id}
                                                        onChange={(e) => handleFilterChange('department_id', e.target.value)}
                                                        disabled={dropdownLoading}
                                                        className="w-full px-3 py-2 border border-[var(--color-border-secondary)] rounded-md focus:ring-2 focus:ring-[var(--color-primary-dark)] focus:border-transparent bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] disabled:bg-[var(--color-bg-gray-light)] disabled:cursor-not-allowed"
                                                    >
                                                        <option value="">All Departments</option>
                                                        {departments.map(dept => (
                                                            <option key={dept.id} value={dept.id}>
                                                                {dept.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                                        Search Employee
                                                    </label>
                                                    <input
                                                        type="text"
                                                        placeholder="Name..."
                                                        value={searchTerm}
                                                        onChange={(e) => setSearchTerm(e.target.value)}
                                                        className="w-full px-3 py-2 border border-[var(--color-border-secondary)] rounded-md focus:ring-2 focus:ring-[var(--color-primary-dark)] focus:border-transparent bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)]"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Employee Selection */}
                                {sourceShift && (
                                    <div className="bg-[var(--color-bg-secondary)] rounded-lg shadow-sm border border-[var(--color-primary-dark)]">
                                        <div className="px-6 py-4 border-b border-[var(--color-primary-light)] bg-[var(--color-primary-dark)]">
                                            <div className="flex items-center justify-between">
                                                <h2 className="text-lg font-semibold text-[var(--color-text-white)] flex items-center gap-2">
                                                    <Users className="w-5 h-5" />
                                                    Select Employees ({eligibleEmployees.length} available)
                                                </h2>
                                                <div className="flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={selectAllFiltered}
                                                        disabled={eligibleEmployees.length === 0}
                                                        className="px-3 py-1.5 text-sm border border-[var(--color-text-white)] text-[var(--color-text-white)] rounded-md hover:bg-[var(--color-bg-secondary-20)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        Select All
                                                    </button>
                                                    {selectedEmployees.length > 0 && (
                                                        <button
                                                            type="button"
                                                            onClick={clearAllSelected}
                                                            className="px-3 py-1.5 text-sm border border-[var(--color-text-white)] text-[var(--color-text-white)] rounded-md hover:bg-[var(--color-bg-secondary-20)] transition-colors"
                                                        >
                                                            Clear All
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-8">
                                            {employeesLoading ? (
                                                <div className="text-center py-8">
                                                    <div className="inline-flex items-center space-x-2 text-[var(--color-text-secondary)]">
                                                        <RefreshCw className="w-5 h-5 animate-spin" />
                                                        <span>Loading employees...</span>
                                                    </div>
                                                </div>
                                            ) : eligibleEmployees.length > 0 ? (
                                                <>
                                                    <div className="max-h-96 overflow-y-auto space-y-2 mb-4">
                                                        {eligibleEmployees.map((emp) => (
                                                            <label
                                                                key={emp.employee_id}
                                                                className="flex items-center gap-3 p-3 hover:bg-[var(--color-bg-primary)] rounded-md cursor-pointer border border-[var(--color-border-secondary)]"
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedEmployees.includes(emp.employee_id)}
                                                                    onChange={() => toggleEmployee(emp.employee_id)}
                                                                    className="w-4 h-4 rounded border-[var(--color-border-secondary)] text-[var(--color-primary-dark)] focus:ring-[var(--color-primary-dark)]"
                                                                />
                                                                <div className="flex-1">
                                                                    <div className="font-medium text-[var(--color-text-primary)]">{emp.full_name}</div>
                                                                </div>
                                                            </label>
                                                        ))}
                                                    </div>

                                                    {selectedEmployeeObjects.length > 0 && (
                                                        <div className="pt-4 border-t border-[var(--color-border-divider)]">
                                                            <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                                                Selected ({selectedEmployeeObjects.length}):
                                                            </p>
                                                            <div className="flex flex-wrap gap-2">
                                                                {selectedEmployeeObjects.map((emp) => (
                                                                    <span
                                                                        key={emp.employee_id}
                                                                        className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--color-primary-lightest)] text-[var(--color-primary-dark)] rounded-full text-sm border border-[var(--color-primary-light)]"
                                                                    >
                                                                        {emp.full_name}
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => toggleEmployee(emp.employee_id)}
                                                                            className="hover:text-[var(--color-primary-darkest)]"
                                                                        >
                                                                            <X className="w-3 h-3" />
                                                                        </button>
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <div className="text-center py-8 text-[var(--color-text-secondary)]">
                                                    No employees found matching the filters
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="bg-[var(--color-bg-secondary)] rounded-lg shadow-sm border border-[var(--color-primary-dark)] p-8">
                                    <div className="flex items-center justify-end gap-4">
                                        <button
                                            type="button"
                                            onClick={handleCloseForm}
                                            disabled={submitting}
                                            className="px-6 py-2 border border-[var(--color-border-secondary)] text-[var(--color-text-secondary)] rounded-md hover:bg-[var(--color-bg-primary)] font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleSubmit}
                                            disabled={submitting || !selectedEmployees.length || !sourceShift || !targetShift || !effectiveDate}
                                            className="px-6 py-2 bg-[var(--color-primary-dark)] text-[var(--color-text-white)] rounded-md hover:bg-[var(--color-primary-darker)] font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                                        >
                                            {submitting ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white/30 rounded-full animate-spin border-t-white"></div>
                                                    Processing...
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    Confirm Reallocation
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Employee Modal */}
                <EmployeeModal
                    isOpen={employeeModal.isOpen}
                    onClose={() => setEmployeeModal({ isOpen: false, employees: [], shiftName: '' })}
                    employees={employeeModal.employees}
                    shiftName={employeeModal.shiftName}
                />

                {/* Toast */}
                {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
            </div>
        </div>
    );
};

export default ShiftReallocation;