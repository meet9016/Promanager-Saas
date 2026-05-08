// AssignShift.jsx (multi-select employees; uses the SAME API `assign_shift_employee` per employee)
import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Users, Calendar, Save, X, Building, Filter, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosInstance';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Toast } from '../../Components/ui/Toast';
import LoadingSpinner from '../../Components/Loader/LoadingSpinner';

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
    const [showFilters, setShowFilters] = useState(false); // NEW: Toggle filter visibility

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

    // Modified fetchDropdownData to accept filter parameters
    const fetchDropdownData = async (appliedFilters = null) => {
        try {
            setLoading(true);
            setDropdownLoading(true);
            if (!user?.user_id) return;

            const formData = new FormData();
            formData.append('user_id', user.user_id);

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

    // Toggle a single employee id
    const toggleEmployee = (empId) => {
        setSelectedEmployees((prev) =>
            prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
        );
    };

    // Select all currently filtered employees
    const selectAllFiltered = () => {
        const allIds = filteredEmployees.map((e) => e.employee_id);
        // union
        setSelectedEmployees((prev) => Array.from(new Set([...prev, ...allIds])));
    };

    // Clear all selections
    const clearAllSelected = () => setSelectedEmployees([]);

    // Handle chip removal
    const removeOneSelected = (empId) => {
        setSelectedEmployees((prev) => prev.filter((id) => id !== empId));
    };

    // Resolve display object for selected chips
    const selectedEmployeeObjects = useMemo(() => {
        if (!selectedEmployees.length) return [];
        const mapById = new Map(employees.map((e) => [e.employee_id, e]));
        return selectedEmployees
            .map((id) => mapById.get(id))
            .filter(Boolean);
    }, [selectedEmployees, employees]);

    // Submit: call SAME API once per selected employee
    // Modified handleSubmit function to pass employee ID array
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedEmployees.length || !selectedShift) {
            showToast('Please select at least one employee and a shift', 'error');
            return;
        }

        if (!user?.user_id) {
            showToast('User not found', 'error');
            return;
        }

        try {
            setSubmitting(true);

            // Create FormData with employee ID array
            const formData = new FormData();
            formData.append('user_id', user.user_id);
            formData.append('shift_id', selectedShift);

            selectedEmployees.forEach(employeeId => {
                formData.append('employee_id[]', employeeId);
            });

            const response = await api.post('assign_shift_employee_new', formData);

            if (response.data?.success) {
                showToast(
                    `Shift assigned successfully to ${selectedEmployees.length} employee(s)`,
                    'success'
                );

                // Reset form
                setSelectedEmployees([]);
                setSelectedShift(editShiftId || '');
                setSearchTerm('');

                // Navigate back after success
                setTimeout(() => navigate('/shift-management'), 1200);
            } else {
                showToast(
                    response.data?.message || 'Failed to assign shift to employees',
                    'error'
                );
            }

        } catch (error) {
            console.error('Error assigning shifts:', error);
            showToast('An error occurred while assigning shifts', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleBack = () => navigate('/shift-management');

    if (loading) {
        return (
            <div className="">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--color-bg-primary)]">
            <div className="p-8 mx-auto ">
                {/* Header */}
                <div className="bg-[var(--color-bg-secondary)] rounded-2xl shadow-xl mb-8 overflow-hidden">
                    <div className="bg-gradient-to-r from-[var(--color-primary-dark)] to-[var(--color-primary-darker)] p-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={handleBack}
                                    className="flex items-center gap-2 text-[var(--color-text-white)] transition-colors bg-[var(--color-bg-secondary-20)] hover:bg-[var(--color-bg-secondary-30)] px-4 py-2 rounded-lg backdrop-blur-sm"
                                    title="Go Back"
                                >
                                    <ArrowLeft size={18} />
                                    Back
                                </button>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-2xl font-bold text-[var(--color-text-white)]">
                                        {editShiftId ? 'Assign Shift' : 'Assign New Shift'}
                                    </h1>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className="flex items-center gap-2 bg-[var(--color-bg-secondary)] text-primary-600 hover:bg-[var(--color-bg-primary)] px-4 py-2 rounded-lg font-medium transition-colors"
                                >
                                    <Filter className="h-4 w-4" />
                                    Filters
                                    {hasActiveFilters && (
                                        <span className="ml-1 w-2 h-2 bg-primary-600 rounded-full"></span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Collapsible Filters */}
                    {showFilters && (
                        <div className="bg-[var(--color-bg-card)] rounded-lg shadow-[var(--color-shadow-light)] border border-[var(--color-border-secondary)] p-5">
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

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {/* Branch Filter */}
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
                                        {branches.map(branch => (
                                            <option key={branch.id} value={branch.id}>{branch.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Department Filter */}
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
                                        {departments.map(department => (
                                            <option key={department.id} value={department.id}>{department.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Main Form Card */}
                    <div className="bg-[var(--color-bg-secondary)] backdrop-blur-sm rounded-2xl border border-slate-200 shadow-lg">
                        {/* Employee Selection */}
                        <div className="p-8">
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
                                <select
                                    value={selectedShift}
                                    onChange={(e) => setSelectedShift(e.target.value)}
                                    className="w-full px-4 py-3 border border-[var(--color-border-secondary)] rounded-xl focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] transition-all duration-200 shadow-sm bg-[var(--color-bg-secondary)]"
                                    disabled={loading}
                                    required
                                >
                                    <option value="">
                                        {loading ? 'Loading shifts...' : 'Choose a shift...'}
                                    </option>
                                    {shifts.map((shift) => (
                                        <option key={shift.shift_id} value={shift.shift_id}>
                                            {shift.shift_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
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
                                        className="px-6 py-2.5 border border-[var(--color-border-secondary)] text-[var(--color-text-secondary)] rounded-lg hover:bg-[var(--color-bg-primary)] transition-colors font-medium"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        onClick={handleSubmit}
                                        disabled={submitting || !selectedEmployees.length || !selectedShift}
                                        className="px-6 py-2.5 bg-gradient-to-r from-[var(--color-primary-dark)] to-[var(--color-primary-darker)] text-[var(--color-text-white)] rounded-xl hover:from-[var(--color-primary-darker)] hover:to-[var(--color-primary-darkest)] focus:ring-2 focus:ring-[var(--color-primary)] focus:outline-none transition-all duration-200 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
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
                </div>

                {/* Toast */}
                {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
            </div>
        </div>
    );
};

export default AssignShift;