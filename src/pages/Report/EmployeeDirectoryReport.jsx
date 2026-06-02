import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosInstance';
import {
    Users,
    Building,
    Award,
    User,
    ArrowLeft,
    Filter,
    RefreshCw,
    Loader2,
    UserCheck,
    Mail,
    Phone,
    Download,
    ChevronDown,
    Briefcase,
    IndianRupee,
    FileDown,
    FileSpreadsheet,
    X,
    Eye
} from 'lucide-react';
import Pagination from '../../Components/Pagination';
import { Toast } from '../../Components/ui/Toast';
import { Table, TableHeader, TableBody, TableRow, TableHeaderRow, Th, Td } from '../../Components/ui/Table';
import { exportEmployeeDirectoryToPDF } from '../../utils/exportUtils/EmployeeReport/employeeDirectoryPdfExport';
import { exportToExcel } from '../../utils/exportUtils/EmployeeReport/excelExportEmployeeDirectory';
import CustomSelect from '../../Components/comman/CustomSelect';

/** ---------- Floating Anchors: robust positioning utilities ---------- **/
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
    const { placement = 'bottom-end', offset = 8, minWidth = 192 } = opts;
    const [pos, setPos] = useState({ top: 0, left: 0, width: 0, ready: false });
    const cleanupRef = useRef([]);

    const compute = useCallback(() => {
        const el = anchorRef.current;
        if (!el) return;

        const rect = el.getBoundingClientRect();
        const scrollX = window.scrollX || window.pageXOffset;
        const scrollY = window.scrollY || window.pageYOffset;

        let top = rect.bottom + scrollY + offset;
        let left;

        if (placement === 'bottom-start') {
            left = rect.left + scrollX;
        } else if (placement === 'bottom-center') {
            left = rect.left + scrollX + rect.width / 2 - minWidth / 2;
        } else {
            // bottom-end
            left = rect.left + scrollX + rect.width - minWidth;
        }

        setPos({ top, left, width: rect.width, ready: true });
    }, [anchorRef, offset, placement, minWidth]);

    useLayoutEffect(() => {
        if (!isOpen) {
            // cleanup listeners when closed
            cleanupRef.current.forEach((fn) => fn && fn());
            cleanupRef.current = [];
            setPos((p) => ({ ...p, ready: false }));
            return;
        }

        compute();

        // attach scroll/resize listeners for all scrollable parents
        const parents = getScrollParents(anchorRef.current);
        const rafThrottle = (fn) => {
            let ticking = false;
            return () => {
                if (ticking) return;
                ticking = true;
                requestAnimationFrame(() => {
                    fn();
                    ticking = false;
                });
            };
        };
        const handler = rafThrottle(() => {
            // if anchor moved off-screen, just recompute; consumer can decide to close
            compute();
        });

        parents.forEach((p) => {
            p.addEventListener('scroll', handler, { passive: true });
        });
        window.addEventListener('resize', handler, { passive: true });

        // cleanup
        const remove = () => {
            parents.forEach((p) => p.removeEventListener('scroll', handler));
            window.removeEventListener('resize', handler);
        };
        cleanupRef.current.push(remove);

        return () => {
            remove();
            cleanupRef.current = [];
        };
    }, [isOpen, compute, anchorRef]);

    return pos;
};

/** ---------- Component ---------- **/
const EmployeeDirectoryReport = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [filters, setFilters] = useState({
        branch_id: '',
        department_id: '',
        designation_id: '',
        employee_type_id: '',
        salary_type_id: '',
        gender_id: '',
        status_id: ''
    });

    const [branches, setBranches] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [designations, setDesignations] = useState([]);
    const [employeeTypes, setEmployeeTypes] = useState([]);
    const [salaryTypes, setSalaryTypes] = useState([]);
    const [genders, setGenders] = useState([]);
    const [status, setStatus] = useState([]);
    const [loading, setLoading] = useState(false);

    const [dropdownLoading, setDropdownLoading] = useState(false);
    const [reportGenerating, setReportGenerating] = useState(false);

    const [reportData, setReportData] = useState(null);
    const [error, setError] = useState(null);

    const [toast, setToast] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [exportDropdown, setExportDropdown] = useState(false);
    const [filterDropdown, setFilterDropdown] = useState(false);

    const exportBtnRef = useRef(null);
    const filterBtnRef = useRef(null);

    // anchored positions
    const exportPos = useAnchoredPosition(exportBtnRef, exportDropdown, {
        placement: 'bottom-end',
        offset: 10,
        minWidth: 192
    });

    const filterPos = useAnchoredPosition(filterBtnRef, filterDropdown, {
        placement: 'bottom-end',
        offset: 10,
        minWidth: 420
    });

    const showToast = (message, type) => setToast({ message, type });
    const closeToast = () => setToast(null);

    const calculateSummaryStats = (data) => {
        if (!data || data.length === 0) return null;
        const totalEmployees = data.length;
        const activeEmployees = data.filter((e) => e.status === 1 || e.status === '1').length;
        const inactiveEmployees = data.filter((e) => e.status === 2 || e.status === '2').length;
        const maleCount = data.filter((e) => e.gender?.toLowerCase() === 'male').length;
        const femaleCount = data.filter((e) => e.gender?.toLowerCase() === 'female').length;

        const departmentCounts = {};
        data.forEach((e) => {
            if (e.department_name) departmentCounts[e.department_name] = (departmentCounts[e.department_name] || 0) + 1;
        });

        return { totalEmployees, activeEmployees, inactiveEmployees, maleCount, femaleCount, departmentCounts };
    };

    const getActiveFiltersCount = () => Object.values(filters).filter((v) => v !== '').length;

    const fetchDropdownData = useCallback(async () => {
        try {
            setDropdownLoading(true);
            setError(null);
            if (!user?.user_id) throw new Error('User ID is required');

            const formData = new FormData();
            const response = await api.post('employee_drop_down_list', formData);

            if (response.data?.success && response.data.data) {
                const data = response.data.data;

                setBranches((data.branch_list || []).map((b) => ({ id: b.branch_id, name: b.name })));
                setDepartments((data.department_list || []).map((d) => ({ id: d.department_id, name: d.name })));
                setDesignations((data.designation_list || []).map((d) => ({ id: d.designation_id, name: d.name })));

                if (data.employee_type_list) {
                    setEmployeeTypes(data.employee_type_list.map((t) => ({ id: t.employee_type_id, name: t.name })));
                }
                if (data.salary_type_list) {
                    setSalaryTypes(data.salary_type_list.map((t) => ({ id: t.salary_type_id, name: t.name })));
                }
                if (data.gender_list) {
                    setGenders(data.gender_list.map((g) => ({ id: g.gender_id, name: g.name })));
                }
                if (data.emp_status_list) {
                    setStatus(data.emp_status_list.map((s) => ({ id: s.status_id, name: s.name })));
                }
            } else {
                throw new Error(response.data?.message || 'Failed to fetch dropdown data');
            }
        } catch (err) {
            const msg = err.message || 'Failed to load filter options';
            setError(msg);
            showToast(msg, 'error');
        } finally {
            setDropdownLoading(false);
        }
    }, [user?.user_id]);

    const generateReport = useCallback(async () => {
        try {
            setReportGenerating(true);
            setError(null);
            if (!user?.user_id) throw new Error('User ID is required');

            const formData = new FormData();

            if (filters.branch_id) formData.append('branch_id', filters.branch_id);
            if (filters.department_id) formData.append('department_id', filters.department_id);
            if (filters.designation_id) formData.append('designation_id', filters.designation_id);
            if (filters.employee_type_id) formData.append('employee_type_id', filters.employee_type_id);
            if (filters.salary_type_id) formData.append('salary_type_id', filters.salary_type_id);
            if (filters.gender_id) formData.append('gender_id', filters.gender_id);
            if (filters.status_id) formData.append('status_id', filters.status_id);

            const response = await api.post('employee_list_report', formData);

            if (response.data?.success && response.data.data) {
                setReportData(response.data.data);
                setCurrentPage(1);
            } else {
                throw new Error(response.data?.message || 'Failed to generate report');
            }
        } catch (err) {
            const msg = err.message || 'Failed to generate report';
            setError(msg);
            showToast(msg, 'error');
        } finally {
            setReportGenerating(false);
        }
    }, [user?.user_id, filters]);

    const handleFilterChange = (name, value) => setFilters((p) => ({ ...p, [name]: value }));

    const handleExportPDF = useCallback(async () => {
        try {
            if (!reportData || reportData.length === 0) {
                showToast('No data available to export', 'error');
                return;
            }

            const filterNames = {
                branch_name: branches.find((b) => b.id == filters.branch_id)?.name || '',
                department_name: departments.find((d) => d.id == filters.department_id)?.name || '',
                designation_name: designations.find((d) => d.id == filters.designation_id)?.name || '',
                employee_type_name: employeeTypes.find((et) => et.id == filters.employee_type_id)?.name || '',
                salary_type_name: salaryTypes.find((st) => st.id == filters.salary_type_id)?.name || '',
                gender_name: genders.find((g) => g.id == filters.gender_id)?.name || '',
                status_name: status.find((s) => s.id == filters.status_id)?.name || ''
            };

            await exportEmployeeDirectoryToPDF(reportData, filterNames, 'Your Company Name');
            showToast('PDF export completed successfully!', 'success');
            setExportDropdown(false);
        } catch (error) {
            showToast('Failed to export PDF: ' + error.message, 'error');
            setExportDropdown(false);
        }
    }, [reportData, filters, branches, departments, designations, employeeTypes, salaryTypes, genders, status]);

    const handleExportExcel = useCallback(() => {
        try {
            if (!reportData || reportData.length === 0) {
                showToast('No data available to export', 'error');
                return;
            }

            const exportData = reportData.map((employee, index) => ({
                'S.No': index + 1,
                'Employee Name': employee.full_name || '',
                'Employee Code': employee.employee_code || '',
                'Department': employee.department_name || '',
                'Designation': employee.designation_name || '',
                'Branch': employee.branch_name || '',
                'Email': employee.email || '',
                'Phone': employee.mobile_number || '',
                'Gender': employee.gender || '',
                'Date of Joining': employee.date_of_joining
                    ? new Date(employee.date_of_joining).toLocaleDateString('en-GB')
                    : '',
                'Employee Type': employee.employee_type || '',
                'Salary Type': employee.salary_type || '',
                'Status':
                    employee.status === 1 || employee.status === '1'
                        ? 'Active'
                        : employee.status === 2 || employee.status === '2'
                            ? 'Inactive'
                            : 'Unknown'
            }));

            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            const fileName = `Employee_Directory_Report_${timestamp}`;
            exportToExcel(exportData, fileName);

            showToast('Excel export completed successfully!', 'success');
            setExportDropdown(false);
        } catch (error) {
            showToast('Failed to export Excel: ' + error.message, 'error');
            setExportDropdown(false);
        }
    }, [reportData]);

    const resetFilters = () => {
        setFilters({
            branch_id: '',
            department_id: '',
            designation_id: '',
            employee_type_id: '',
            salary_type_id: '',
            gender_id: '',
            status_id: ''
        });
        setReportData(null);
        setError(null);
        setCurrentPage(1);
        showToast('Filters reset successfully', 'success');
        setFilterDropdown(false);
    };

    const applyFilters = () => {
        generateReport();
        setFilterDropdown(false);
    };
    const truncateText = useCallback((text, maxLength = 20) => {
        if (!text) return '--';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }, []);

    // ----- Pagination math (10 rows per page + padding) -----
    const totalItems = reportData?.length || 0;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = reportData?.slice(indexOfFirstItem, indexOfLastItem) || [];
    const emptyRows = Math.max(0, itemsPerPage - currentItems.length);

    const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

    useEffect(() => {
        fetchDropdownData();
    }, [fetchDropdownData]);

    useEffect(() => {
        if (!dropdownLoading && user?.user_id) {
            generateReport();
        }
    }, [dropdownLoading, user?.user_id, generateReport]);

    useEffect(() => {
        setCurrentPage(1);
    }, [reportData]);

    // Auto-close dropdowns if anchor becomes hidden (e.g., scroll out)
    useEffect(() => {
        if (exportDropdown && exportBtnRef.current) {
            const rect = exportBtnRef.current.getBoundingClientRect();
            const fullyOut =
                rect.bottom < 0 ||
                rect.top > window.innerHeight ||
                rect.right < 0 ||
                rect.left > window.innerWidth;
            if (fullyOut) setExportDropdown(false);
        }
    }, [exportDropdown, exportPos]);

    useEffect(() => {
        if (filterDropdown && filterBtnRef.current) {
            const rect = filterBtnRef.current.getBoundingClientRect();
            const fullyOut =
                rect.bottom < 0 ||
                rect.top > window.innerHeight ||
                rect.right < 0 ||
                rect.left > window.innerWidth;
            if (fullyOut) setFilterDropdown(false);
        }
    }, [filterDropdown, filterPos]);

    const summaryStats = calculateSummaryStats(reportData);
    const activeFiltersCount = getActiveFiltersCount();

    const handleViewDetails = useCallback((employee_id) => {
        navigate(`/employee/details/${employee_id}`);
    }, [navigate]);

    return (
        <div className="h-[calc(100vh-64px)] bg-[var(--color-bg-primary)] overflow-hidden">
            <div className="p-8  mx-auto h-full flex flex-col overflow-hidden">
                {/* Header */}


                {/* Summary */}
                {summaryStats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <div className="bg-[var(--color-bg-secondary)] rounded-xl p-6 shadow-sm border border-[var(--color-border-primary)]">
                            <div className="flex items-center justify-between ">
                                <div>
                                    <p className="text-sm text-[var(--color-text-secondary)]">Total Employees</p>
                                    <p className="text-2xl font-bold text-[var(--color-text-primary)]">{summaryStats.totalEmployees}</p>
                                </div>
                                <Users className="h-8 w-8 text-[var(--color-primary)]" />
                            </div>
                        </div>
                        <div className="bg-[var(--color-bg-secondary)] rounded-xl p-6 shadow-sm border border-[var(--color-border-primary)]">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-[var(--color-text-secondary)]">Active</p>
                                    <p className="text-2xl font-bold text-[var(--color-text-primary)]">{summaryStats.activeEmployees}</p>
                                </div>
                                <UserCheck className="h-8 w-8 text-[var(--color-success)]" />
                            </div>
                        </div>
                        <div className="bg-[var(--color-bg-secondary)] rounded-xl p-6 shadow-sm border border-[var(--color-border-primary)]">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-[var(--color-text-secondary)]">Male</p>
                                    <p className="text-2xl font-bold text-[var(--color-text-primary)]">{summaryStats.maleCount}</p>
                                </div>
                                <User className="h-8 w-8 text-[var(--color-primary)]" />
                            </div>
                        </div>
                        <div className="bg-[var(--color-bg-secondary)] rounded-xl p-6 shadow-sm border border-[var(--color-border-primary)]">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-[var(--color-text-secondary)]">Female</p>
                                    <p className="text-2xl font-bold text-[var(--color-text-primary)]">{summaryStats.femaleCount}</p>
                                </div>
                                <User className="h-8 w-8 text-pink-500" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Results */}
                {reportData && (
                    <div className="h-[80vh] bg-[var(--color-bg-secondary)] rounded-xl shadow-sm border border-primary-200 overflow-hidden flex flex-col flex-1 min-h-0 custom-scrollbar">
                        <div className="px-6 py-4 border-b border-primary-200 bg-[var(--color-primary-lighter)] ">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center">
                                    <Users className="h-6 w-6 text-[var(--color-primary-darker)] mr-2" />
                                    <h3 className="text-lg font-medium text-[var(--color-primary-darker)]">Employee Directory</h3>
                                </div>

                                <div className="flex items-center gap-3">


                                    {/* Filters button */}
                                    <div className="relative">
                                        <button
                                            ref={filterBtnRef}
                                            onClick={() => setFilterDropdown((v) => !v)}
                                            className="flex items-center gap-2 bg-[var(--color-bg-secondary)] text-[var(--color-primary-dark)] hover:bg-[var(--color-bg-primary)] px-4 py-2 rounded-lg font-medium transition-colors"
                                        >
                                            <Filter className="h-4 w-4" />
                                            Filters
                                            {activeFiltersCount > 0 && (
                                                <span className="bg-[var(--color-primary-dark)] text-white text-xs rounded-full px-2 py-1">
                                                    {activeFiltersCount}
                                                </span>
                                            )}
                                            <ChevronDown className="h-4 w-4" />
                                        </button>

                                        {/* Filters: anchored dropdown on desktop, full-screen sheet on mobile */}
                                        {filterDropdown &&
                                            createPortal(
                                                <>
                                                    {/* backdrop */}
                                                    <div
                                                        className="fixed inset-0 z-[100] bg-black/40"
                                                        onClick={() => setFilterDropdown(false)}
                                                    />

                                                    {/* Desktop anchored (sm and up) */}
                                                    <div
                                                        className="hidden sm:block absolute z-[110] bg-[var(--color-bg-secondary)] rounded-lg shadow-2xl border border-[var(--color-border-secondary)] max-h-[80vh] overflow-visible flex flex-col"
                                                        style={{
                                                            position: 'absolute',
                                                            top: filterPos.ready ? filterPos.top : -9999,
                                                            left: filterPos.ready ? Math.max(12, filterPos.left) : -9999,
                                                            width: Math.max(420, filterPos.width),
                                                            minWidth: 420
                                                        }}
                                                    >
                                                        {/* Header */}
                                                        {/* <div className="flex items-center justify-between p-4 border-b border-[var(--color-border-secondary)] bg-[var(--color-bg-secondary)]">
                                                            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Filter</h3>
                                                            <button
                                                                onClick={() => setFilterDropdown(false)}
                                                                className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] p-1 rounded-lg hover:bg-[var(--color-bg-hover)]"
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </button>
                                                        </div> */}
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

                                                        {dropdownLoading && (
                                                            <div className="flex items-center gap-2 p-4 text-[var(--color-text-secondary)] border-b border-[var(--color-border-secondary)]">
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                                <span className="text-sm">Loading filter options...</span>
                                                            </div>
                                                        )}

                                                        <div className="flex-1 p-4 w-full overflow-visible max-h-none">
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                                {/* Branch */}
                                                                <div>
                                                                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                                                        <Building className="inline h-4 w-4 mr-1" />
                                                                        Branch
                                                                    </label>
                                                                    {/* <select
                                                                        value={filters.branch_id}
                                                                        onChange={(e) => handleFilterChange('branch_id', e.target.value)}
                                                                        className="w-full px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-dark)] focus:border-transparent text-[var(--color-text-primary)] text-sm"
                                                                        disabled={dropdownLoading}
                                                                    >
                                                                        <option value="">All Branches</option>
                                                                        {branches.map((b) => (
                                                                            <option key={b.id} value={b.id}>{b.name}</option>
                                                                        ))}
                                                                    </select> */}
                                                                    <CustomSelect
                                                                        name="branch_id"
                                                                        value={filters.branch_id}
                                                                        onChange={(e) =>
                                                                            handleFilterChange('branch_id', e.target.value)
                                                                        }
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
                                                                    {/* <select
                                                                        value={filters.department_id}
                                                                        onChange={(e) => handleFilterChange('department_id', e.target.value)}
                                                                        className="w-full px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-dark)] focus:border-transparent text-[var(--color-text-primary)] text-sm"
                                                                        disabled={dropdownLoading}
                                                                    >
                                                                        <option value="">All Departments</option>
                                                                        {departments.map((d) => (
                                                                            <option key={d.id} value={d.id}>{d.name}</option>
                                                                        ))}
                                                                    </select> */}
                                                                    <CustomSelect
                                                                        name="department_id"
                                                                        value={filters.department_id}
                                                                        onChange={(e) =>
                                                                            handleFilterChange('department_id', e.target.value)
                                                                        }
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
                                                                    {/* <select
                                                                        value={filters.designation_id}
                                                                        onChange={(e) => handleFilterChange('designation_id', e.target.value)}
                                                                        className="w-full px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-dark)] focus:border-transparent text-[var(--color-text-primary)] text-sm"
                                                                        disabled={dropdownLoading}
                                                                    >
                                                                        <option value="">All Designations</option>
                                                                        {designations.map((g) => (
                                                                            <option key={g.id} value={g.id}>{g.name}</option>
                                                                        ))}
                                                                    </select> */}
                                                                    <CustomSelect
                                                                        name="designation_id"
                                                                        value={filters.designation_id}
                                                                        onChange={(e) =>
                                                                            handleFilterChange('designation_id', e.target.value)
                                                                        }
                                                                        options={designations.map((g) => ({
                                                                            value: g.id,
                                                                            label: g.name,
                                                                        }))}
                                                                        placeholder="All Designations"
                                                                        searchable={true}
                                                                        disabled={dropdownLoading}
                                                                    />
                                                                </div>

                                                                {/* Employee Type */}
                                                                <div>
                                                                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                                                        <Briefcase className="inline h-4 w-4 mr-1" />
                                                                        Employee Type
                                                                    </label>
                                                                    {/* <select
                                                                        value={filters.employee_type_id}
                                                                        onChange={(e) => handleFilterChange('employee_type_id', e.target.value)}
                                                                        className="w-full px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-dark)] focus:border-transparent text-[var(--color-text-primary)] text-sm"
                                                                        disabled={dropdownLoading}
                                                                    >
                                                                        <option value="">All Employee Types</option>
                                                                        {employeeTypes.map((t) => (
                                                                            <option key={t.id} value={t.id}>{t.name}</option>
                                                                        ))}
                                                                    </select> */}
                                                                    <CustomSelect
                                                                        name="employee_type_id"
                                                                        value={filters.employee_type_id}
                                                                        onChange={(e) =>
                                                                            handleFilterChange('employee_type_id', e.target.value)
                                                                        }
                                                                        options={employeeTypes.map((t) => ({
                                                                            value: t.id,
                                                                            label: t.name,
                                                                        }))}
                                                                        placeholder="All Employee Types"
                                                                        searchable={true}
                                                                        disabled={dropdownLoading}
                                                                    />
                                                                </div>

                                                                {/* Salary Type */}
                                                                <div>
                                                                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                                                        <IndianRupee className="inline h-4 w-4 mr-1" />
                                                                        Salary Type
                                                                    </label>
                                                                    {/* <select
                                                                        value={filters.salary_type_id}
                                                                        onChange={(e) => handleFilterChange('salary_type_id', e.target.value)}
                                                                        className="w-full px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-dark)] focus:border-transparent text-[var(--color-text-primary)] text-sm"
                                                                        disabled={dropdownLoading}
                                                                    >
                                                                        <option value="">All Salary Types</option>
                                                                        {salaryTypes.map((t) => (
                                                                            <option key={t.id} value={t.id}>{t.name}</option>
                                                                        ))}
                                                                    </select> */}
                                                                    <CustomSelect
                                                                        name="salary_type_id"
                                                                        value={filters.salary_type_id}
                                                                        onChange={(e) =>
                                                                            handleFilterChange('salary_type_id', e.target.value)
                                                                        }
                                                                        options={salaryTypes.map((t) => ({
                                                                            value: t.id,
                                                                            label: t.name,
                                                                        }))}
                                                                        placeholder="All Salary Types"
                                                                        searchable={true}
                                                                        disabled={dropdownLoading}
                                                                    />
                                                                </div>

                                                                {/* Gender */}
                                                                <div>
                                                                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                                                        <User className="inline h-4 w-4 mr-1" />
                                                                        Gender
                                                                    </label>
                                                                    {/* <select
                                                                        value={filters.gender_id}
                                                                        onChange={(e) => handleFilterChange('gender_id', e.target.value)}
                                                                        className="w-full px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-dark)] focus:border-transparent text-[var(--color-text-primary)] text-sm"
                                                                        disabled={dropdownLoading}
                                                                    >
                                                                        <option value="">All Genders</option>
                                                                        {genders.map((g) => (
                                                                            <option key={g.id} value={g.id}>{g.name}</option>
                                                                        ))}
                                                                    </select> */}
                                                                    <CustomSelect
                                                                        name="gender_id"
                                                                        value={filters.gender_id}
                                                                        onChange={(e) =>
                                                                            handleFilterChange('gender_id', e.target.value)
                                                                        }
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
                                                                        <UserCheck className="inline h-4 w-4 mr-1" />
                                                                        Status
                                                                    </label>
                                                                    {/* <select
                                                                        value={filters.status_id}
                                                                        onChange={(e) => handleFilterChange('status_id', e.target.value)}
                                                                        className="w-full px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-dark)] focus:border-transparent text-[var(--color-text-primary)] text-sm"
                                                                        disabled={dropdownLoading}
                                                                    >
                                                                        <option value="">All Status</option>
                                                                        {status.map((s) => (
                                                                            <option key={s.id} value={s.id}>{s.name}</option>
                                                                        ))}
                                                                    </select> */}
                                                                    <CustomSelect
                                                                        name="status_id"
                                                                        value={filters.status_id}
                                                                        onChange={(e) =>
                                                                            handleFilterChange('status_id', e.target.value)
                                                                        }
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

                                                        {/* Footer */}
                                                        {/* <div className="flex flex-col sm:flex-row gap-2 p-4 border-t border-[var(--color-border-secondary)] bg-[var(--color-bg-secondary)]">
                                                            <button
                                                                onClick={applyFilters}
                                                                disabled={reportGenerating}
                                                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[var(--color-primary-dark)] text-[var(--color-text-white)] rounded-lg hover:bg-[var(--color-primary-darker)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                                                            >
                                                                {reportGenerating ? <Loader2 className="h-8 w-4 animate-spin" /> : <Filter className="h-4 w-4" />}
                                                                {reportGenerating ? 'Loading...' : 'Apply Filters'}
                                                            </button>
                                                            <button
                                                                onClick={resetFilters}
                                                                className="flex items-center justify-center gap-2 px-4 py-2 bg-[var(--color-bg-gray-light)] text-[var(--color-text-secondary)] rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors text-sm font-medium min-w-[100px]"
                                                            >
                                                                <RefreshCw className="h-4 w-4" />
                                                                Reset
                                                            </button>
                                                        </div> */}
                                                        <div className="flex flex-col sm:flex-row justify-end gap-2 p-4 border-t border-[var(--color-border-secondary)] rounded-b-2xl">
                                                            <button
                                                                onClick={resetFilters}
                                                                disabled={reportGenerating}
                                                                className="flex items-center justify-center gap-2 px-4 py-2 bg-transparent text-[var(--color-primary)] border-2 hover:bg-[var(--color-primary-lightest)] border-[var(--color-primary)] rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors text-sm font-medium min-w-[100px]"
                                                            >
                                                                <RefreshCw size={14} />
                                                                Reset
                                                            </button>

                                                            <button
                                                                onClick={applyFilters}
                                                                disabled={reportGenerating}
                                                                className="w-auto sm:w-[140px] flex items-center justify-center gap-2 px-4 py-2 bg-[var(--color-primary-dark)] text-[var(--color-text-white)] rounded-lg hover:bg-[var(--color-primary-darker)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                                                            >
                                                                {loading ? <Loader2 size={14} className="animate-spin" /> : <Filter size={14} />}
                                                                {loading ? 'Loading...' : 'Apply Filters'}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Mobile sheet (sm:hidden) */}
                                                    <div className="sm:hidden fixed inset-0 z-[110] flex">
                                                        <div className="ml-auto h-full w-full bg-[var(--color-bg-secondary)] flex flex-col">
                                                            <div className="flex items-center justify-between p-4 border-b border-[var(--color-border-secondary)]">
                                                                <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Filter Employees</h3>
                                                                <button
                                                                    onClick={() => setFilterDropdown(false)}
                                                                    className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] p-1 rounded-lg hover:bg-[var(--color-bg-hover)]"
                                                                >
                                                                    <X className="h-5 w-5" />
                                                                </button>
                                                            </div>

                                                            {dropdownLoading && (
                                                                <div className="flex items-center gap-2 p-4 text-[var(--color-text-secondary)] border-b border-[var(--color-border-secondary)]">
                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                    <span className="text-sm">Loading filter options...</span>
                                                                </div>
                                                            )}

                                                            <div className="flex-1 overflow-y-auto p-4">
                                                                <div className="grid grid-cols-1 gap-4">
                                                                    {/* Branch */}
                                                                    <div>
                                                                        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                                                            <Building className="inline h-4 w-4 mr-1" />
                                                                            Branch
                                                                        </label>
                                                                        <select
                                                                            value={filters.branch_id}
                                                                            onChange={(e) => handleFilterChange('branch_id', e.target.value)}
                                                                            className="w-full px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-dark)] focus:border-transparent text-[var(--color-text-primary)] text-sm"
                                                                            disabled={dropdownLoading}
                                                                        >
                                                                            <option value="">All Branches</option>
                                                                            {branches.map((b) => (
                                                                                <option key={b.id} value={b.id}>{b.name}</option>
                                                                            ))}
                                                                        </select>
                                                                    </div>

                                                                    <div>
                                                                        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                                                            <Users className="inline h-4 w-4 mr-1" />
                                                                            Department
                                                                        </label>
                                                                        <select
                                                                            value={filters.department_id}
                                                                            onChange={(e) => handleFilterChange('department_id', e.target.value)}
                                                                            className="w-full px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-dark)] focus:border-transparent text-[var(--color-text-primary)] text-sm"
                                                                            disabled={dropdownLoading}
                                                                        >
                                                                            <option value="">All Departments</option>
                                                                            {departments.map((d) => (
                                                                                <option key={d.id} value={d.id}>{d.name}</option>
                                                                            ))}
                                                                        </select>
                                                                    </div>

                                                                    <div>
                                                                        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                                                            <Award className="inline h-4 w-4 mr-1" />
                                                                            Designation
                                                                        </label>
                                                                        <select
                                                                            value={filters.designation_id}
                                                                            onChange={(e) => handleFilterChange('designation_id', e.target.value)}
                                                                            className="w-full px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-dark)] focus:border-transparent text-[var(--color-text-primary)] text-sm"
                                                                            disabled={dropdownLoading}
                                                                        >
                                                                            <option value="">All Designations</option>
                                                                            {designations.map((g) => (
                                                                                <option key={g.id} value={g.id}>{g.name}</option>
                                                                            ))}
                                                                        </select>
                                                                    </div>

                                                                    <div>
                                                                        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                                                            <Briefcase className="inline h-4 w-4 mr-1" />
                                                                            Employee Type
                                                                        </label>
                                                                        <select
                                                                            value={filters.employee_type_id}
                                                                            onChange={(e) => handleFilterChange('employee_type_id', e.target.value)}
                                                                            className="w-full px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-dark)] focus:border-transparent text-[var(--color-text-primary)] text-sm"
                                                                            disabled={dropdownLoading}
                                                                        >
                                                                            <option value="">All Employee Types</option>
                                                                            {employeeTypes.map((t) => (
                                                                                <option key={t.id} value={t.id}>{t.name}</option>
                                                                            ))}
                                                                        </select>
                                                                    </div>

                                                                    <div>
                                                                        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                                                            <IndianRupee className="inline h-4 w-4 mr-1" />
                                                                            Salary Type
                                                                        </label>
                                                                        <select
                                                                            value={filters.salary_type_id}
                                                                            onChange={(e) => handleFilterChange('salary_type_id', e.target.value)}
                                                                            className="w-full px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-dark)] focus:border-transparent text-[var(--color-text-primary)] text-sm"
                                                                            disabled={dropdownLoading}
                                                                        >
                                                                            <option value="">All Salary Types</option>
                                                                            {salaryTypes.map((t) => (
                                                                                <option key={t.id} value={t.id}>{t.name}</option>
                                                                            ))}
                                                                        </select>
                                                                    </div>

                                                                    <div>
                                                                        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                                                            <User className="inline h-4 w-4 mr-1" />
                                                                            Gender
                                                                        </label>
                                                                        <select
                                                                            value={filters.gender_id}
                                                                            onChange={(e) => handleFilterChange('gender_id', e.target.value)}
                                                                            className="w-full px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-dark)] focus:border-transparent text-[var(--color-text-primary)] text-sm"
                                                                            disabled={dropdownLoading}
                                                                        >
                                                                            <option value="">All Genders</option>
                                                                            {genders.map((g) => (
                                                                                <option key={g.id} value={g.id}>{g.name}</option>
                                                                            ))}
                                                                        </select>
                                                                    </div>

                                                                    <div>
                                                                        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                                                            <UserCheck className="inline h-4 w-4 mr-1" />
                                                                            Status
                                                                        </label>
                                                                        <select
                                                                            value={filters.status_id}
                                                                            onChange={(e) => handleFilterChange('status_id', e.target.value)}
                                                                            className="w-full px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-dark)] focus:border-transparent text-[var(--color-text-primary)] text-sm"
                                                                            disabled={dropdownLoading}
                                                                        >
                                                                            <option value="">All Status</option>
                                                                            {status.map((s) => (
                                                                                <option key={s.id} value={s.id}>{s.name}</option>
                                                                            ))}
                                                                        </select>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </>,
                                                document.body
                                            )}
                                    </div>

                                    {/* Export button */}
                                    <div className="relative">
                                        <button
                                            ref={exportBtnRef}
                                            onClick={() => setExportDropdown((v) => !v)}
                                            className="flex items-center gap-2 bg-[var(--color-bg-secondary)] text-[var(--color-primary-dark)] hover:bg-[var(--color-bg-primary)] px-4 py-2 rounded-lg font-medium transition-colors"
                                        >
                                            <Download className="h-4 w-4" />
                                            Export
                                            <ChevronDown className="h-4 w-4" />
                                        </button>

                                        {/* Export dropdown (anchored, scroll/resize-safe) */}
                                        {exportDropdown &&
                                            exportPos.ready &&
                                            createPortal(
                                                <>
                                                    <div
                                                        className="fixed inset-0 z-[40]"
                                                        onClick={() => setExportDropdown(false)}
                                                    />
                                                    <div
                                                        className="absolute z-[50] bg-[var(--color-bg-secondary)] rounded-lg shadow-2xl border border-[var(--color-border-secondary)] py-2"
                                                        style={{
                                                            position: 'absolute',
                                                            top: exportPos.top,
                                                            left: exportPos.left,
                                                            width: Math.max(192, exportPos.width),
                                                            minWidth: 192
                                                        }}
                                                    >
                                                        <button
                                                            onClick={handleExportExcel}
                                                            className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-[var(--color-bg-hover)] transition-colors text-[var(--color-text-secondary)]"
                                                        >
                                                            <FileSpreadsheet className="h-4 w-4 text-[var(--color-success)]" />
                                                            Export to Excel
                                                        </button>
                                                        <button
                                                            onClick={handleExportPDF}
                                                            className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-[var(--color-bg-hover)] transition-colors text-[var(--color-text-secondary)]"
                                                        >
                                                            <FileDown className="h-4 w-4 text-[var(--color-error)]" />
                                                            Export to PDF
                                                        </button>
                                                    </div>
                                                </>,
                                                document.body
                                            )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Table */}
                        {/* <div className="custom-scrollbar  min-h-0 overflow-auto"> */}
                        <Table className="w-full min-w-[1200px] ">
                            <TableHeader className=" bg-[var(--color-primary-dark)] border-b border-[var(--color-border-secondary)]">
                                <TableHeaderRow>
                                    <Th className="px-6 py-3 text-center font-medium">Employee</Th>
                                    <Th className="px-6 py-3 text-center font-medium">Code</Th>
                                    <Th className="px-6 py-3 text-center font-medium">Department</Th>
                                    <Th className="px-6 py-3 text-center font-medium">Designation</Th>
                                    <Th className="px-6 py-3 text-center font-medium">Branch</Th>
                                    <Th className="px-6 py-3 text-center font-medium">Contact</Th>
                                    <Th className="px-6 py-3 text-center font-medium">Join Date</Th>
                                    <Th className="px-6 py-3 text-center font-medium">Action</Th>
                                </TableHeaderRow>
                            </TableHeader>

                            <TableBody className="bg-[var(--color-bg-secondary)] divide-y divide-[var(--color-border-secondary)] ">
                                {currentItems.map((employee, index) => (
                                    <TableRow key={employee.employee_id || index} className="hover:bg-[var(--color-bg-hover)] transition-colors">
                                        <Td className="px-6 py-4 whitespace-nowrap text-left">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 relative">
                                                    <div className="h-10 w-10 rounded-full bg-[var(--color-primary-dark)] flex items-center justify-center">
                                                        <span className="text-sm font-medium text-[var(--color-text-white)]">
                                                            {employee.full_name?.charAt(0) || 'N'}
                                                        </span>
                                                    </div>
                                                    <div
                                                        className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${employee.status === 1 || employee.status === '1'
                                                            ? 'bg-green-500'
                                                            : employee.status === 2 || employee.status === '2'
                                                                ? 'bg-red-500'
                                                                : 'bg-gray-400'
                                                            }`}
                                                    />
                                                </div>
                                                <div className="ml-4">
                                                    {/* Employee Name with truncate */}
                                                    <div
                                                        className="text-sm font-medium text-[var(--color-text-primary)]"
                                                        title={employee.full_name || '--'}
                                                    >
                                                        {truncateText(employee.full_name, 15)}
                                                    </div>

                                                    {/* Gender (no truncate) */}
                                                    <div className="text-sm text-[var(--color-text-muted)]">
                                                        {employee.gender || '--'}
                                                    </div>
                                                </div>

                                            </div>
                                        </Td>
                                        <Td className="px-6 py-4 text-center whitespace-nowrap text-sm text-[var(--color-text-primary)]">
                                            {employee.employee_code || '--'}
                                        </Td>
                                        <Td className="px-6 py-4 text-center whitespace-nowrap text-sm text-[var(--color-text-primary)]">
                                            {truncateText(employee.department_name, 10)}
                                        </Td>
                                        <Td className="px-6 py-4 text-center whitespace-nowrap text-sm text-[var(--color-text-primary)]">
                                            {truncateText(employee.designation_name, 10)}
                                        </Td>
                                        <Td className="px-6 py-4 text-center whitespace-nowrap text-sm text-[var(--color-text-primary)]">
                                            {truncateText(employee.branch_name, 10)}
                                        </Td>
                                        <Td className="px-6 py-4 text-center whitespace-nowrap text-sm text-[var(--color-text-primary)]">
                                            <div className="space-y-1">
                                                {employee.email && (
                                                    <div className="flex items-center gap-1">
                                                        <Mail className="h-3 w-3 text-[var(--color-text-muted)]" />
                                                        <span className="text-xs">{truncateText(employee.email, 18) || '--'}</span>
                                                    </div>
                                                )}
                                                {employee.mobile_number && (
                                                    <div className="flex items-center gap-1">
                                                        <Phone className="h-3 w-3 text-[var(--color-text-muted)]" />
                                                        <span className="text-xs">{employee.mobile_number}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </Td>
                                        <Td className="px-6 py-4 text-center whitespace-nowrap text-sm text-[var(--color-text-primary)]">
                                            {employee.date_of_joining ? new Date(employee.date_of_joining).toLocaleDateString('en-GB') : '--'}
                                        </Td>
                                        <Td className="px-6 py-4 text-center whitespace-nowrap">
                                            <button
                                                onClick={() => handleViewDetails(employee.employee_id)}
                                                disabled={reportGenerating}
                                                className="w-9 h-9 flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:scale-110 hover:shadow-md transition-all duration-200 mx-auto disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                                title="View Details"
                                            >
                                                <Eye className="w-4 h-4" strokeWidth={2.5} />
                                            </button>
                                        </Td>
                                    </TableRow>
                                ))}

                                {/* Empty placeholder rows to keep exactly 10 rows per page */}
                                {Array.from({ length: emptyRows }).map((_, i) => (
                                    <TableRow key={`empty-${i}`} className="hover:bg-transparent">
                                        <Td className="px-6 py-4 h-12">&nbsp;</Td>
                                        <Td className="px-6 py-4 h-12">&nbsp;</Td>
                                        <Td className="px-6 py-4 h-12">&nbsp;</Td>
                                        <Td className="px-6 py-4 h-12">&nbsp;</Td>
                                        <Td className="px-6 py-4 h-12">&nbsp;</Td>
                                        <Td className="px-6 py-4 h-12">&nbsp;</Td>
                                        <Td className="px-6 py-4 h-12">&nbsp;</Td>
                                        <Td className="px-6 py-4 h-12">&nbsp;</Td>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        {/* </div> */}

                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                            loading={reportGenerating}
                        />
                    </div>
                )}

                {/* States */}
                {!reportData && !reportGenerating && !error && (
                    <div className="bg-[var(--color-bg-secondary)] rounded-xl shadow-sm border border-[var(--color-border-secondary)] p-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                            <div className="p-3 bg-[var(--color-bg-gray-light)] rounded-full mb-4">
                                <Users className="h-8 w-8 text-[var(--color-text-muted)]" />
                            </div>
                            <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">No Employees Found</h3>
                            <p className="text-[var(--color-text-secondary)] mb-4">No employees match your current filter criteria.</p>
                            <div className="text-sm text-[var(--color-text-muted)]">
                                <p>• Try adjusting your filters</p>
                                <p>• Or reset filters to see all employees</p>
                            </div>
                        </div>
                    </div>
                )}

                {reportGenerating && (
                    <div className="bg-[var(--color-bg-secondary)] rounded-xl shadow-sm border border-[var(--color-border-secondary)] p-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                            <div className="p-3 bg-[var(--color-primary-lightest)] rounded-full mb-4">
                                <Loader2 className="h-8 w-8 text-[var(--color-primary)] animate-spin" />
                            </div>
                            <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">Generating Report</h3>
                            <p className="text-[var(--color-text-secondary)]">Please wait while we prepare your monthly attendance report...</p>
                        </div>
                    </div>
                )}
            </div>

            {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
        </div>
    );
};

export default EmployeeDirectoryReport;
