// AssignShift.jsx (multi-select employees; uses the SAME API `assign_shift_employee` per employee)
import { useState, useEffect, useMemo, useCallback, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Users, Calendar, Save, X, Building, Filter, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosInstance';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Toast } from '../../Components/ui/Toast';
import LoadingSpinner from '../../Components/Loader/LoadingSpinner';
import CustomSelect from '../../Components/comman/CustomSelect';

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

const AssignShift = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const editShiftId = searchParams.get('edit');

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState(null);
    const [employees, setEmployees] = useState([]);
    const [shifts, setShifts] = useState([]);
    const [selectedEmployees, setSelectedEmployees] = useState([]); // ← multiple
    const [selectedShift, setSelectedShift] = useState(editShiftId || '');

    // Filter states
    const [filters, setFilters] = useState({
        branch_id: '',
        department_id: ''
    });
    const [branches, setBranches] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [dropdownLoading, setDropdownLoading] = useState(false);

    // Filter popup states (same pattern as Employee.jsx)
    const [filterDropdown, setFilterDropdown] = useState(false);
    const filterBtnRef = useRef(null);
    const filterPos = useAnchoredPosition(filterBtnRef, filterDropdown, { placement: 'bottom-end', offset: 10, minWidth: 420 });

    // Searchable dropdown state
    const [searchTerm, setSearchTerm] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Toast helpers
    const showToast = (message, type = 'info') => setToast({ message, type });
    const closeToast = () => setToast(null);

    // Derived: filtered employees by search and filters
    const filteredEmployees = useMemo(() => {
        let filtered = employees;

        // Apply search term only
        if (searchTerm) {
            const s = searchTerm.toLowerCase();
            filtered = filtered.filter((e) =>
                (e.full_name || '').toLowerCase().includes(s) ||
                String(e.employee_id || '').includes(searchTerm)
            );
        }

        return filtered;
    }, [searchTerm, employees]);

    // Check if any filters are active
    const hasActiveFilters = filters.branch_id || filters.department_id;
    const getActiveFiltersCount = () =>
        Object.values(filters).filter((v) => v !== '' && v !== null && v !== undefined).length;

    // Modified fetchDropdownData to accept filter parameters
    const fetchDropdownData = async (appliedFilters = null) => {
        try {
            setLoading(true);
            setDropdownLoading(true);
            if (!user?.user_id) return;

            const formData = new FormData();

            // Add filter parameters to the API call
            const filterData = appliedFilters || filters;
            if (filterData.branch_id) {
                formData.append('branch_id', filterData.branch_id);
            }
            if (filterData.department_id) {
                formData.append('department_id', filterData.department_id);
            }

            // Fetch employee dropdown data for filters (only once initially)
            if (!appliedFilters) {
                const dropdownResponse = await api.post('employee_drop_down_list', formData);

                if (dropdownResponse.data?.success && dropdownResponse.data.data) {
                    const dropdownData = dropdownResponse.data.data;
                    setBranches((dropdownData.branch_list || []).map(b => ({ id: b.branch_id, name: b.name })));
                    setDepartments((dropdownData.department_list || []).map(d => ({ id: d.department_id, name: d.name })));
                }
            }

            // Fetch assign shift dropdown data with filters
            const response = await api.post('assign_shift_list_drop_down', formData);

            if (response.data?.success) {
                // Use un_assign_employee_list if available, otherwise use employee_list
                const emp = response.data.data?.un_assign_employee_list || response.data.data?.employee_list || [];
                const shf = response.data.data?.shift_list || [];
                setEmployees(emp);
                setShifts(shf);

                if (!editShiftId) setSelectedShift('');
            } else {
                showToast(response.data?.message || 'Failed to fetch dropdown data', 'error');
            }
        } catch (err) {
            console.error('Error fetching dropdown data:', err);
            showToast('Failed to load dropdown data. Please try again.', 'error');
        } finally {
            setLoading(false);
            setDropdownLoading(false);
        }
    };

    // Modified handleFilterChange to refetch employees when filters change
    const handleFilterChange = (key, value) => {
        setFilters(prev => {
            const next = { ...prev, [key]: value };
            // Reset department when branch changes
            if (key === 'branch_id') {
                next.department_id = '';
            }

            // Refetch employees with new filters
            fetchDropdownData(next);

            return next;
        });
    };

    // Modified resetFilters to refetch all employees
    const resetFilters = () => {
        const clearedFilters = {
            branch_id: '',
            department_id: ''
        };
        setFilters(clearedFilters);
        fetchDropdownData(clearedFilters);
    };

    useEffect(() => {
        fetchDropdownData();
    }, [user]);

    // Click outside to close the dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.employee-dropdown-container')) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Multi-select helpers
    const toggleEmployee = (empId) => {
        setSelectedEmployees((prev) =>
            prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
        );
    };

    // Select all currently filtered employees
    const selectAllFiltered = () => {
        const allIds = filteredEmployees.map((e) => e.employee_id);
        setSelectedEmployees((prev) => Array.from(new Set([...prev, ...allIds])));
    };

    const clearAllSelected = () => setSelectedEmployees([]);

    const removeOneSelected = (empId) => {
        setSelectedEmployees((prev) => prev.filter((id) => id !== empId));
    };

    const selectedEmployeeObjects = useMemo(() => {
        const map = new Map(employees.map((e) => [e.employee_id, e]));
        return selectedEmployees
            .map((id) => map.get(id))
            .filter(Boolean);
    }, [selectedEmployees, employees]);

    const handleBack = () => navigate(-1);

    const handleSubmit = async () => {
        if (!selectedEmployees.length || !selectedShift) {
            showToast('Please select employee(s) and a shift', 'error');
            return;
        }
        try {
            setSubmitting(true);
            // Loop and call SAME API per employee
            let successCount = 0;
            let failCount = 0;
            for (const empId of selectedEmployees) {
                const fd = new FormData();
                fd.append('employee_id', empId);
                fd.append('shift_id', selectedShift);
                try {
                    const res = await api.post('assign_shift_employee', fd);
                    if (res.data?.success) successCount++;
                    else failCount++;
                } catch {
                    failCount++;
                }
            }
            if (successCount) showToast(`Assigned shift to ${successCount} employee(s)`, 'success');
            if (failCount) showToast(`Failed for ${failCount} employee(s)`, 'error');
            if (successCount) navigate(-1);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading && !employees.length) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)]">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--color-bg-primary)]">
            <div className="p-8 mx-auto ">
                {/* Header */}
                <div className="bg-[var(--color-bg-secondary)] rounded-2xl shadow-xl mb-8 overflow-hidden">
                    <div className="bg-gradient-to-r from-[var(--color-primary-dark)] to-[var(--color-primary-darker)] p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={handleBack}
                                    className="flex items-center gap-2 text-[var(--color-text-white)] transition-colors bg-[var(--color-bg-secondary-20)] hover:bg-[var(--color-bg-secondary-30)] px-2 py-2 rounded-lg backdrop-blur-sm"
                                    title="Go Back"
                                >
                                    <ArrowLeft size={18} />
                                </button>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-2xl font-bold text-[var(--color-text-white)]">
                                        {editShiftId ? 'Assign Shift' : 'Assign New Shift'}
                                    </h1>
                                </div>
                            </div>

                            {/* Filter button with popup (Employee.jsx style) */}
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <button
                                        ref={filterBtnRef}
                                        onClick={() => setFilterDropdown((v) => !v)}
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
                                                    width: Math.max(420, filterPos.width),
                                                    minWidth: 420
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
                                                                value={filters.branch_id}
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
                                                                value={filters.department_id}
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
                                                    </div>
                                                </div>

                                                {/* Popup footer */}
                                                {/* <div className="flex gap-2 p-4 border-t border-[var(--color-border-secondary)]">
                                                    <button
                                                        onClick={() => setFilterDropdown(false)}
                                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[var(--color-primary-dark)] text-[var(--color-text-white)] rounded-lg hover:bg-[var(--color-primary-darker)] transition-colors text-sm font-medium"
                                                    >
                                                        <Filter className="h-4 w-4" /> Done
                                                    </button>
                                                    <button
                                                        onClick={() => { resetFilters(); }}
                                                        className="flex items-center justify-center gap-2 px-4 py-2 bg-[var(--color-bg-gray-light)] text-[var(--color-text-secondary)] rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors text-sm font-medium min-w-[90px]"
                                                    >
                                                        <RefreshCw className="h-4 w-4" /> Reset
                                                    </button>
                                                </div> */}

                                                <div className="flex flex-col sm:flex-row justify-end gap-2 p-4 border-t border-[var(--color-border-secondary)] rounded-b-2xl">
                                                    <button
                                                        onClick={() => setFilterDropdown(false)}
                                                        className="flex items-center justify-center gap-2 px-4 py-2 bg-transparent text-[var(--color-primary)] border-2 hover:bg-[var(--color-primary-lightest)] border-[var(--color-primary)] rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors text-sm font-medium min-w-[100px]"
                                                    >
                                                        <RefreshCw size={14} />
                                                        Reset
                                                    </button>

                                                    <button
                                                        onClick={() => { resetFilters(); }}
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
                                                                value={filters.branch_id}
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
                                                                value={filters.department_id}
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
                                                    </div>
                                                    <div className="p-4 border-t border-[var(--color-border-secondary)] grid grid-cols-1 gap-2">
                                                        <button
                                                            onClick={() => setFilterDropdown(false)}
                                                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[var(--color-primary-dark)] text-[var(--color-text-white)] rounded-lg hover:bg-[var(--color-primary-darker)] transition-colors text-sm font-medium"
                                                        >
                                                            <Filter className="h-4 w-4" /> Done
                                                        </button>
                                                        <button
                                                            onClick={() => { resetFilters(); }}
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
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Main Form Card */}
                    <div className="bg-[var(--color-bg-secondary)] backdrop-blur-sm rounded-2xl border border-slate-200 shadow-lg">
                        {/* Employee Selection */}
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="mb-6">
                                <div className="employee-dropdown-container relative">
                                    <label className="block text-sm font-semibold text-[var(--color-text-secondary)] mb-3">
                                        <Users className="w-4 h-4 inline mr-2" />
                                        Select Employee(s) <span className="text-[var(--color-error)]">*</span>
                                    </label>

                                    {/* Search input */}
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Search employees by name or ID..."
                                            value={searchTerm}
                                            onChange={(e) => {
                                                setSearchTerm(e.target.value);
                                                setIsDropdownOpen(true);
                                            }}
                                            onFocus={() => setIsDropdownOpen(true)}
                                            className="w-full px-4 py-3 border border-[var(--color-border-secondary)] rounded-xl focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] transition-all duration-200 shadow-sm bg-[var(--color-bg-secondary)]"
                                            disabled={loading}
                                        />

                                        {/* Dropdown */}
                                        {isDropdownOpen && (
                                            <div className="absolute top-full left-0 right-0 bg-[var(--color-bg-secondary)] border border-[var(--color-border-secondary)] rounded-xl shadow-lg z-50 max-h-72 overflow-y-auto mt-1">
                                                {/* Actions row */}
                                                <div className="sticky top-0 bg-[var(--color-bg-secondary)] border-b border-slate-200 p-2 flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={selectAllFiltered}
                                                        className="px-3 py-1 text-sm rounded-md border border-slate-300 hover:bg-slate-50"
                                                    >
                                                        Select All
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={clearAllSelected}
                                                        className="px-3 py-1 text-sm rounded-md border border-slate-300 hover:bg-slate-50"
                                                    >
                                                        Clear All
                                                    </button>
                                                    <div className="ml-auto text-xs text-[var(--color-text-secondary)] pr-2">
                                                        {filteredEmployees.length} results
                                                    </div>
                                                </div>

                                                {filteredEmployees.length ? (
                                                    filteredEmployees.map((emp) => {
                                                        const checked = selectedEmployees.includes(emp.employee_id);
                                                        return (
                                                            <label
                                                                key={emp.employee_id}
                                                                className="flex items-center gap-3 p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-200 last:border-b-0"
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={checked}
                                                                    onChange={() => toggleEmployee(emp.employee_id)}
                                                                    className="w-4 h-4"
                                                                />
                                                                <div className="flex flex-col">
                                                                    <span className="font-medium text-[var(--color-text-primary)]">
                                                                        {emp.full_name}
                                                                    </span>
                                                                    <div className="flex gap-2 text-xs text-[var(--color-text-secondary)]">
                                                                        {emp.department_name && (
                                                                            <span>{emp.department_name}</span>
                                                                        )}
                                                                        {emp.branch_name && (
                                                                            <span>• {emp.branch_name}</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </label>
                                                        );
                                                    })
                                                ) : (
                                                    <div className="p-3 text-[var(--color-text-secondary)] text-center">
                                                        {hasActiveFilters ?
                                                            'No employees found matching the selected filters' :
                                                            searchTerm ? 'No employees match your search' : 'No employees available'
                                                        }
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Selected chips */}
                                    {!!selectedEmployeeObjects.length && (
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {selectedEmployeeObjects.map((emp) => (
                                                <span
                                                    key={emp.employee_id}
                                                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-300 text-sm bg-white"
                                                >
                                                    {emp.full_name || emp.employee_id}
                                                    <button
                                                        type="button"
                                                        onClick={() => removeOneSelected(emp.employee_id)}
                                                        className="hover:text-red-600"
                                                        title="Remove"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                </div>
                            </div>

                            {/* Shift Selection */}
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-[var(--color-text-secondary)] mb-3">
                                    <Calendar className="w-4 h-4 inline mr-2" />
                                    Select Shift <span className="text-[var(--color-error)]">*</span>
                                </label>
                                <CustomSelect
                                    name="selectedShift"
                                    value={selectedShift}
                                    onChange={(e) => setSelectedShift(e.target.value)}
                                    options={shifts.map((shift) => ({
                                        value: shift.shift_id,
                                        label: shift.shift_name,
                                    }))}
                                    placeholder={loading ? 'Loading shifts...' : 'Choose a shift...'}
                                    searchable={true}
                                    disabled={loading}
                                    required
                                />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-3 pt-4 border-slate-200 p-4">
                            <div className="text-sm text-[var(--color-text-secondary)]">
                                {selectedEmployees.length
                                    ? `${selectedEmployees.length} employee(s) selected`
                                    : 'No employees selected'}
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={handleBack}
                                    disabled={submitting}
                                    className="px-4 py-2 text-sm border border-[var(--color-border-secondary)] text-[var(--color-text-secondary)] rounded-lg hover:bg-[var(--color-bg-primary)] transition-colors font-medium"
                                >
                                    Cancel
                                </button>

                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting || !selectedEmployees.length || !selectedShift}
                                    className="px-4 py-2 text-sm bg-gradient-to-r from-[var(--color-primary-dark)] to-[var(--color-primary-darker)] text-[var(--color-text-white)] rounded-md hover:from-[var(--color-primary-darker)] hover:to-[var(--color-primary-darkest)] focus:ring-2 focus:ring-[var(--color-primary)] focus:outline-none transition-all duration-200 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <div className="flex items-center gap-2">
                                        {submitting ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-[var(--color-border-primary)] rounded-full animate-spin border-t-white"></div>
                                                Assigning...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4" />
                                                Assign Shift
                                            </>
                                        )}
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Toast */}
                {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
            </div>
        </div>
    );
};

export default AssignShift;
