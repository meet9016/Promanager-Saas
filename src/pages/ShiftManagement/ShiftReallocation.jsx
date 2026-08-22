import { useState, useMemo, useEffect, useCallback } from 'react';
import { Users, Calendar, RefreshCw, X, Building, Filter, CheckCircle2, XCircle, Plus, Search } from 'lucide-react';
import CustomDatePicker from '../../Components/comman/CustomDatePicker';
import { useAuth } from '../../context/AuthContext';
import { useSelector } from 'react-redux';
import api from '../../api/axiosInstance';

import { Toast } from '../../Components/ui/Toast';
import Pagination from '../../Components/Pagination';
import CustomSelect from '../../Components/comman/CustomSelect';
import CustomInput from '../../Components/comman/CustomInput';
import NoDataFound from '../../Components/comman/NoDataFound';
import { Table, TableHeader, TableBody, TableRow, TableHeaderRow, Th, Td } from '../../Components/ui/Table';
import LoadingSpinner from '../../Components/Loader/LoadingSpinner';
import { getStatusBadge, formatDate } from '../../utils/helpers';

const ShiftReallocation = () => {
    const { user } = useAuth();

    const permissions = useSelector(state => state.permissions) || {};

    const [view, setView] = useState('list');
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

    // Search debounce and initialization
    useEffect(() => {
        if (!user?.user_id) return;

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
    }, [user, searchQuery, view]);

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

    // Get status badge color

    // Employee Modal Component
    const EmployeeModal = ({ isOpen, onClose, employees, shiftName }) => {
        if (!isOpen) return null;

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
                <div className="bg-[var(--color-bg-secondary)] rounded-2xl shadow-2xl border border-[var(--color-border-secondary)] max-w-lg w-full overflow-hidden flex flex-col max-h-[85vh] transition-all">
                    {/* Header */}
                    <div className="px-6 py-4 bg-gradient-to-r from-[var(--color-primary-dark)] to-[var(--color-primary-darker)] text-white flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
                                <Users className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                                    Reallocated Employees
                                </h3>
                                <p className="text-xs text-white/80 font-medium">
                                    Shift: {shiftName}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="bg-white/20 text-white text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-md">
                                {`${employees.length} Total`}
                            </span>
                            <button
                                onClick={onClose}
                                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors"
                                aria-label="Close"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
                        {employees.length > 0 ? (
                            <div className="space-y-3">
                                {employees.map((employee, index) => (
                                    <div
                                        key={employee.employee_id || index}
                                        className="flex items-center justify-between p-3.5 bg-[var(--color-bg-primary)] hover:bg-[var(--color-bg-hover,#f9fafb)] border border-[var(--color-border-secondary)] rounded-xl transition-all duration-200 shadow-sm"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-10 h-10 bg-gradient-to-br from-[var(--color-primary-dark)] to-[var(--color-primary-darker)] rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
                                                {(employee.employee_name || employee.name)?.charAt(0)?.toUpperCase() || 'E'}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-semibold text-sm text-[var(--color-text-primary)] truncate">
                                                    {employee.employee_name || employee.name || 'Unknown Employee'}
                                                </p>
                                                {employee.employee_code && (
                                                    <p className="text-xs text-[var(--color-text-muted)] font-mono">
                                                        {employee.employee_code}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 px-4">
                                <div className="w-16 h-16 bg-[var(--color-primary-lightest,#f3e8ff)] rounded-2xl flex items-center justify-center mx-auto mb-3">
                                    <Users className="w-8 h-8 text-[var(--color-primary-dark)]" />
                                </div>
                                <h4 className="text-base font-semibold text-[var(--color-text-primary)] mb-1">
                                    No Employees Found
                                </h4>
                                <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] max-w-xs mx-auto">
                                    There are no employees currently assigned to this reallocation schedule.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-3 bg-[var(--color-bg-primary)] border-t border-[var(--color-border-secondary)] flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border-secondary)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] text-xs sm:text-sm font-medium rounded-xl transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="h-[calc(100vh-64px)] bg-[var(--color-bg-primary)] overflow-hidden flex flex-col">
            <div className="flex-1 flex flex-col mx-auto p-8 overflow-hidden h-0 w-full">

                {/* List View */}
                {view === 'list' && (
                    <div className="bg-[var(--color-bg-secondary)]  h-[86vh] rounded-[5px] shadow-sm border border-[var(--color-primary-dark)]">
                        <div className="px-6 py-4 border-b border-[var(--color-primary-light)] bg-[var(--color-primary-lighter)] ">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-[var(--color-primary-darker)] flex items-center gap-2">
                                    <Calendar className="w-5 h-5" />
                                    Reallocation History
                                </h2>
                                <div className="flex items-center gap-3">
                                    <div className="relative w-full sm:w-64">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)] z-10" />

                                        <CustomInput
                                            type="text"
                                            name="searchQuery"
                                            value={searchQuery}
                                            onChange={handleSearchChange}
                                            placeholder="Search..."
                                            clearable={!searchLoading}
                                            className="!h-[37px] [&_input]:!h-[37px] [&_input]:!pl-10 [&_input]:!pr-10 [&_input]:!rounded-md"
                                        />

                                        {searchLoading && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10">
                                                <RefreshCw className="h-4 w-4 animate-spin text-[var(--color-text-muted)]" />
                                            </div>
                                        )}

                                    </div>
                                    {permissions['shift_reallocation_create'] && (
                                        <button
                                            onClick={handleOpenForm}
                                            className="flex items-center gap-2 bg-[var(--color-bg-secondary)] text-[var(--color-primary-dark)] hover:bg-[var(--color-bg-primary)] px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                        >
                                            <Plus className="h-4 w-4" />
                                            Shift Reallocation
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {historyLoading ? (
                            <div className="overflow-hidden" style={{ height: 'calc(86vh - 73px)' }}>
                                <LoadingSpinner />
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
                            <div className="h-[70vh] flex items-center justify-center bg-[#FBF9FD]" style={{ height: "calc(86vh - 73px)" }}>
                                <NoDataFound
                                    title="No Reallocation History"
                                    subtitle={
                                        searchQuery
                                            ? 'No reallocations match your search criteria.'
                                            : 'You haven\'t made any shift reallocations yet.'
                                    }
                                >
                                    {!searchQuery && permissions['shift_reallocation_create'] && (
                                        <button
                                            onClick={handleOpenForm}
                                            className="inline-flex items-center space-x-2 bg-[var(--color-primary-dark)] text-[var(--color-text-white)] px-4 py-2 rounded-md hover:bg-[var(--color-primary-darker)] transition-colors"
                                        >
                                            <Plus className="w-4 h-4" />
                                            <span>Create First Reallocation</span>
                                        </button>
                                    )}
                                </NoDataFound>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto rounded-b-lg">
                                    <Table className="min-w-full divide-y divide-[var(--color-border-divider)]">
                                        <TableHeader className="bg-[var(--color-primary-dark)]">
                                            <TableHeaderRow>
                                                <Th className="px-6 py-3 text-left font-medium">
                                                    From Shift
                                                </Th>
                                                <Th className="px-6 py-3 text-left font-medium">
                                                    To Shift
                                                </Th>
                                                <Th className="px-6 py-3 text-left font-medium">
                                                    Reallocation Date
                                                </Th>
                                                <Th className="px-6 py-3 text-left font-medium">
                                                    Status
                                                </Th>
                                                <Th className="px-6 py-3 text-left font-medium">
                                                    Employees
                                                </Th>
                                            </TableHeaderRow>
                                        </TableHeader>
                                        <TableBody className="bg-[var(--color-bg-secondary)] divide-y divide-[var(--color-border-divider)]">
                                            {reallocationHistory.map((item, index) => (
                                                <TableRow key={item.id || index} className="hover:bg-[var(--color-bg-primary)] transition-colors">
                                                    <Td className="px-6 py-4 text-left whitespace-nowrap font-medium text-[var(--color-text-primary)]">
                                                        {item.from_shift_name || 'N/A'}
                                                    </Td>
                                                    <Td className="px-6 py-4 text-left whitespace-nowrap font-medium text-[var(--color-text-primary)]">
                                                        {item.to_shift_name || 'N/A'}
                                                    </Td>
                                                    <Td className="px-12 py-4 text-left whitespace-nowrap text-[var(--color-text-secondary)]">
                                                        {formatDate(item.change_date || item.reallocation_date)}
                                                    </Td>
                                                    <Td className="px-3 py-4 text-left whitespace-nowrap">
                                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusBadge(item.executed_name)}`}>
                                                            {item.executed_name || 'Pending'}
                                                        </span>
                                                    </Td>
                                                    <Td className="px-9 py-4 text-left whitespace-nowrap text-[var(--color-text-secondary)]">
                                                        {permissions['shift_reallocation_view'] && (
                                                            <button
                                                                onClick={() => setEmployeeModal({
                                                                    isOpen: true,
                                                                    employees: item.employees || [],
                                                                    shiftName: `${item.from_shift_name} → ${item.to_shift_name}`
                                                                })}
                                                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--color-primary-lightest,#f3e8ff)] text-[var(--color-primary-dark)]  transition-all duration-200 border border-[var(--color-primary-light,#d8b4fe)] font-medium text-xs sm:text-sm group cursor-pointer"
                                                                title="Click to view reallocated employees"
                                                            >
                                                                <Users className="w-4 h-4 text-[var(--color-primary-dark)] group-hover:scale-110 transition-transform" />
                                                                <span>{item.employee_count || (item.employees?.length) || 0} Employees</span>
                                                            </button>
                                                        )}
                                                    </Td>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
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
                            <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                                <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 space-y-6 scrollbar-hide">
                                    {/* Shift Selection */}
                                    <div className="bg-[var(--color-bg-secondary)] rounded-[5px] shadow-sm border border-[var(--color-primary-dark)] ">
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
                                                    <CustomSelect
                                                        name="sourceShift"
                                                        value={sourceShift}
                                                        onChange={(e) => handleSourceShiftChange(e.target.value)}
                                                        options={shifts.map((shift) => ({
                                                            value: shift.shift_id,
                                                            label: shift.shift_name,
                                                        }))}
                                                        placeholder="Select source shift"
                                                        searchable={true}
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                                        To Shift <span className="text-[var(--color-error)]">*</span>
                                                    </label>
                                                    <CustomSelect
                                                        name="targetShift"
                                                        value={targetShift}
                                                        onChange={(e) => setTargetShift(e.target.value)}
                                                        disabled={!sourceShift}
                                                        options={shifts
                                                            .filter(s => s.shift_id !== sourceShift)
                                                            .map((shift) => ({
                                                                value: shift.shift_id,
                                                                label: shift.shift_name,
                                                            }))}
                                                        placeholder="Select target shift"
                                                        searchable={true}
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                                        Effective Date <span className="text-[var(--color-error)]">*</span>
                                                    </label>
                                                    <CustomDatePicker
                                                        name="effectiveDate"
                                                        value={effectiveDate}
                                                        onChange={(e) => setEffectiveDate(new Date(e.target.value))}
                                                        minDate={minDate}
                                                        disabled={!sourceShift || !targetShift}
                                                        placeholder="Select date"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Filters */}
                                    {sourceShift && (
                                        <div className="bg-[var(--color-bg-secondary)] rounded-[5px] shadow-sm border border-[var(--color-primary-dark)]">
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
                                                        <CustomSelect
                                                            name="branch_id"
                                                            value={filters.branch_id}
                                                            onChange={(e) => handleFilterChange('branch_id', e.target.value)}
                                                            disabled={dropdownLoading}
                                                            options={branches.map(branch => ({
                                                                value: branch.id,
                                                                label: branch.name,
                                                            }))}
                                                            placeholder="All Branches"
                                                            searchable={true}
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                                            <Users className="w-4 h-4 inline mr-1" />
                                                            Department
                                                        </label>
                                                        <CustomSelect
                                                            name="department_id"
                                                            value={filters.department_id}
                                                            onChange={(e) => handleFilterChange('department_id', e.target.value)}
                                                            disabled={dropdownLoading}
                                                            options={departments.map(dept => ({
                                                                value: dept.id,
                                                                label: dept.name,
                                                            }))}
                                                            placeholder="All Departments"
                                                            searchable={true}
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                                            Search Employee
                                                        </label>
                                                        <CustomInput
                                                            type="text"
                                                            name="search"
                                                            placeholder="Name..."
                                                            value={searchTerm}
                                                            onChange={(e) => setSearchTerm(e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Employee Selection */}
                                    {sourceShift && (
                                        <div className="bg-[var(--color-bg-secondary)] rounded-[5px] shadow-sm border border-[var(--color-primary-dark)]">
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

                                </div>

                                {/* Actions */}

                                <div className="flex-shrink-0 bg-[var(--color-bg-secondary)] rounded-lg shadow-sm pt-4 mt-4">
                                    <div className="flex items-center justify-end gap-4">
                                        <button
                                            type="button"
                                            onClick={handleCloseForm}
                                            disabled={submitting}
                                            className="px-4 py-2 bg-transparent text-[var(--color-primary)] border-2 hover:bg-[var(--color-primary-lightest)] border-[var(--color-primary)] rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                                        >
                                            <X className="w-4 h-4" />
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