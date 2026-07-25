import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosInstance';
import {
    ArrowLeft,
    Filter,
    RefreshCw,
    Loader2,
    Calendar,
    Download,
    ChevronDown,
    FileDown,
    TrendingUp,
    Users,
    Clock,
    FileSpreadsheet,
    IndianRupee,
    User,
    CalendarX,
    Calculator,
    Building,
    Award,
    Play,
    X
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Pagination from '../../Components/Pagination';
import { Toast } from '../../Components/ui/Toast';
import { handleSalaryReportPDFExport } from '../../utils/exportUtils/salary/pdfExportSalary';
import { handlePayrollExportExcel } from '../../utils/exportUtils/salary/exportSalaryReportToExcel';
import CustomSelect from '../../Components/comman/CustomSelect';
import { Table, TableHeader, TableBody, TableRow, TableHeaderRow, Th, Td } from '../../Components/ui/Table';
import CustomDatePicker from '../../Components/comman/CustomDatePicker';
import NoDataFound from '../../Components/comman/NoDataFound';

/** ------------------- Robust anchored positioning helpers ------------------- **/
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

const pad2 = (n) => (n < 10 ? `0${n}` : String(n));

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
                requestAnimationFrame(() => {
                    fn();
                    ticking = false;
                });
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

        return () => {
            remove();
            cleanupRef.current = [];
        };
    }, [isOpen, compute, anchorRef]);

    return pos;
};
/** -------------------------------------------------------------------------- **/

const MonthlySalaryReport = () => {

    const [selectedDate, setSelectedDate] = useState(new Date());
    const handleDateChange = (date) => setSelectedDate(date);
    const navigate = useNavigate();
    const { user } = useAuth();
    const currentDate = new Date();

    // Filters
    const [filters, setFilters] = useState({
        branch_id: '',
        department_id: '',
        designation_id: '',
        employee_id: '',
        month_year: `${currentDate.getFullYear()}-${String(
            currentDate.getMonth() + 1
        ).padStart(2, '0')}`
    });
    const [branches, setBranches] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [designations, setDesignations] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [dropdownLoading, setDropdownLoading] = useState(false);

    const [loading, setLoading] = useState(false);

    // Filter dropdown
    const [filterDropdown, setFilterDropdown] = useState(false);
    const filterBtnRef = useRef(null);
    const filterPos = useAnchoredPosition(filterBtnRef, filterDropdown, {
        placement: 'bottom-end',
        offset: 10,
        minWidth: 420
    });

    // Export dropdown
    const [exportDropdown, setExportDropdown] = useState(false);
    const exportBtnRef = useRef(null);
    const exportPos = useAnchoredPosition(exportBtnRef, exportDropdown, {
        placement: 'bottom-end',
        offset: 10,
        minWidth: 192
    });

    // Report
    // eslint-disable-next-line no-unused-vars
    const [reportGenerating, setReportGenerating] = useState(false);
    const [reportData, setReportData] = useState(null);
    const [error, setError] = useState(null);

    // Toast
    const [toast, setToast] = useState(null);
    const showToast = (message, type) => setToast({ message, type });
    const closeToast = () => setToast(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    // Auto-close export dropdown if anchor goes off-screen
    useEffect(() => {
        if (exportDropdown && exportBtnRef.current) {
            const rect = exportBtnRef.current.getBoundingClientRect();
            const off =
                rect.bottom < 0 ||
                rect.top > window.innerHeight ||
                rect.right < 0 ||
                rect.left > window.innerWidth;
            if (off) setExportDropdown(false);
        }
    }, [exportDropdown, exportPos]);

    // Calculate summary statistics
    const calculateSummaryStats = (data) => {
        if (!data || data.length === 0) return null;

        const totalEmployees = data.length;
        const totalBaseSalary = data.reduce((sum, emp) => sum + parseFloat(emp.employee_salary || 0), 0);
        const totalPaidSalary = data.reduce((sum, emp) => sum + parseFloat(emp.total_salary || 0), 0);
        const totalOvertimeSalary = data.reduce((sum, emp) => sum + parseFloat(emp.overtime_salary || 0), 0);
        const totalWorkingDays = data.reduce((sum, emp) => sum + parseFloat(emp.working_days || 0), 0);
        const totalPresentDays = data.reduce((sum, emp) => sum + parseFloat(emp.present_days || 0), 0);
        const totalAbsentDays = data.reduce((sum, emp) => sum + parseFloat(emp.absent_days || 0), 0);
        const averageSalary = totalEmployees > 0 ? totalPaidSalary / totalEmployees : 0;

        return {
            totalEmployees,
            totalBaseSalary,
            totalPaidSalary,
            totalOvertimeSalary,
            totalWorkingDays,
            totalPresentDays,
            totalAbsentDays,
            averageSalary
        };
    };

    const fetchDropdownData = useCallback(async () => {
        try {
            setDropdownLoading(true);
            setError('');
            if (!user?.user_id) throw new Error('User ID is required');
            const form = new FormData();
            const res = await api.post('employee_drop_down_list', form);
            if (res.data?.success && res.data.data) {
                const data = res.data.data;
                setBranches((data.branch_list || []).map(b => ({ id: b.branch_id, name: b.name })));
                setDepartments((data.department_list || []).map(d => ({ id: d.department_id, name: d.name })));
                setDesignations((data.designation_list || []).map(d => ({ id: d.designation_id, name: d.name })));
            } else {
                throw new Error(res.data?.message || 'Failed to load filter options');
            }
        } catch (e) {
            console.error(e);
            setError('Failed to load dropdown options');
        } finally {
            setDropdownLoading(false);
        }
    }, [user?.user_id]);

    const fetchEmployees = useCallback(async () => {
        try {
            setError('');
            if (!user?.user_id) throw new Error('User ID is required');
            const form = new FormData();
            if (filters.branch_id) form.append('branch_id', filters.branch_id);
            if (filters.department_id) form.append('department_id', filters.department_id);
            if (filters.designation_id) form.append('designation_id', filters.designation_id);
            const res = await api.post('report_employee_list_drop_down', form);
            if (res.data?.success && res.data.data) {
                const list = res.data.data.employee_list || [];
                setEmployees(list.map(emp => ({
                    id: emp.employee_id,
                    name: `${emp.full_name} `,
                })));
            } else {
                throw new Error(res.data?.message || 'Failed to fetch employees');
            }
        } catch (e) {
            console.error(e);
            setError('Failed to load employees');
        }
    }, [user?.user_id, filters.branch_id, filters.department_id, filters.designation_id]);

    useEffect(() => { fetchDropdownData(); }, [fetchDropdownData]);
    useEffect(() => { fetchEmployees(); }, [fetchEmployees]);


    const handleGenerateReport = async () => {
        try {
            setLoading(true);
            setError('');

            if (!user?.user_id) {
                throw new Error('User ID is required');
            }

            if (!filters.month_year) {
                showToast('Please select a month and year', 'error');
                return;
            }

            const formData = new FormData();
            formData.append('month_year', filters.month_year);
            if (filters.branch_id) formData.append('branch_id', filters.branch_id);
            if (filters.department_id) formData.append('department_id', filters.department_id);
            if (filters.designation_id) formData.append('designation_id', filters.designation_id);
            if (filters.employee_id) formData.append('employee_id', filters.employee_id);

            const response = await api.post('monthly_salary_report_list', formData);

            if (response.data?.success && response.data.data) {
                setReportData(response.data.data);
                setCurrentPage(1);
                showToast('Report generated successfully', 'success');
            } else {
                throw new Error(response.data?.message || 'Failed to generate report');
            }
        } catch (err) {
            const errorMessage = err.message || 'Failed to generate report';
            setError(errorMessage);
            showToast(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key, value) => {
        setReportData(null);
        setError('');
        setFilters(prev => {
            const next = { ...prev, [key]: value };
            if (key === 'branch_id') { next.department_id = ''; next.designation_id = ''; next.employee_id = ''; }
            else if (key === 'department_id') { next.designation_id = ''; next.employee_id = ''; }
            else if (key === 'designation_id') { next.employee_id = ''; }
            return next;
        });
    };

    // Currency format
    const formatCurrency = (amount) =>
        new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount || 0);

    // Exports
    const handleExportExcelClick = () => {
        handlePayrollExportExcel(
            reportData,
            filters,
            summaryStats,
            showToast,
            setExportDropdown,
            getMonthYearDisplay
        );
    };

    const handleExportPDF = () => {
        handleSalaryReportPDFExport(
            reportData,
            filters,
            showToast,
            'Your Company Name' // Replace with actual company name or fetch from context
        );
        setExportDropdown(false);
    };

    // Reset filters
    const resetFilters = () => {
        setFilters({
            branch_id: '',
            department_id: '',
            designation_id: '',
            employee_id: '',
            month_year: ''
        });
        setReportData(null);
        setError('');
        setCurrentPage(1);
        showToast('Filters reset successfully', 'success');
    };

    // Pagination logic
    const totalItems = reportData?.length || 0;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = reportData?.slice(indexOfFirstItem, indexOfLastItem) || [];

    const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

    useEffect(() => {
        setCurrentPage(1);
    }, [reportData]);

    const summaryStats = calculateSummaryStats(reportData);

    // Month label
    const getMonthYearDisplay = (monthYear) => {
        if (!monthYear) return 'Select Month';
        const date = new Date(monthYear + '-01');
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    return (
        <div className="h-[calc(100vh-64px)] bg-[var(--color-bg-primary)] flex flex-col">
            <div className="flex-1 p-8 mx-auto w-full flex flex-col min-h-0">
                {/* Header Section */}
                <div className="bg-[var(--color-bg-secondary)] rounded-2xl shadow-xl mb-8 overflow-hidden shrink-0">
                    <div className="bg-gradient-to-r from-[var(--color-primary-dark)] to-[var(--color-primary-darker)] p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => navigate('/reports')}
                                    className="flex items-center gap-2 text-[var(--color-text-white)] hover:text-[var(--color-text-white)] transition-colors bg-[var(--color-bg-secondary-20)] hover:bg-[var(--color-bg-secondary-30)] px-2 py-2 rounded-lg backdrop-blur-sm"
                                >
                                    <ArrowLeft size={18} />

                                </button>
                                <div className="flex items-center gap-3">
                                    <div>
                                        <h1 className="text-2xl font-bold text-[var(--color-text-white)]">Monthly Salary Report {filters.month_year && `- ${getMonthYearDisplay(filters.month_year)}`}</h1>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                {/* Filter button */}
                                <div className="relative">
                                    <button
                                        ref={filterBtnRef}
                                        onClick={() => setFilterDropdown((v) => !v)}
                                        className="flex items-center gap-2 bg-[var(--color-bg-secondary)] text-[var(--color-primary-dark)] hover:bg-[var(--color-bg-primary)] px-4 py-2 rounded-lg font-medium transition-colors"
                                    >
                                        <Filter className="h-4 w-4" />
                                        Filters
                                        <ChevronDown className="h-4 w-4" />
                                    </button>

                                    {filterDropdown && filterPos.ready && createPortal(
                                        <>
                                            <div className="fixed inset-0 z-[100] bg-black/40" onClick={() => setFilterDropdown(false)} />
                                            <div
                                                className="hidden sm:flex flex-col absolute z-[110] bg-[var(--color-bg-secondary)] rounded-lg shadow-2xl border border-[var(--color-border-secondary)] max-h-[80vh] overflow-visible"
                                                style={{
                                                    position: 'absolute',
                                                    top: filterPos.top,
                                                    left: Math.min(filterPos.left, window.innerWidth - 440),
                                                    width: Math.max(420, filterPos.width),
                                                    minWidth: 420
                                                }}
                                            >
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
                                                <div className="flex-1 overflow-visible p-4">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        {/* Month Year */}
                                                        <div className="col-span-1 flex flex-col">
                                                            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                                                                <Calendar className="inline h-4 w-4 mr-1" />
                                                                Month & Year <span className="text-[var(--color-error)]">*</span>
                                                            </label>
                                                            <DatePicker
                                                                selected={filters.month_year ? new Date(`${filters.month_year}-01`) : null}
                                                                onChange={(date) => {
                                                                    const iso = date ? `${date.getFullYear()}-${pad2(date.getMonth() + 1)}` : '';
                                                                    handleFilterChange('month_year', iso);
                                                                }}
                                                                dateFormat="MMMM yyyy"
                                                                showMonthYearPicker
                                                                showFullMonthYearPicker
                                                                className="w-full px-3 py-2 rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-border-focus)] focus:border-transparent"
                                                                placeholderText="Select month and year"
                                                                maxDate={new Date()}
                                                                showPopperArrow={false}
                                                            />
                                                        </div>

                                                        {/* Branch */}
                                                        <div className="col-span-1 flex flex-col">
                                                            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                                                                <Building className="inline h-4 w-4 mr-1" />
                                                                Branch
                                                            </label>
                                                            <CustomSelect
                                                                name="branch_id"
                                                                value={filters.branch_id}
                                                                onChange={(e) => handleFilterChange('branch_id', e.target.value)}
                                                                options={branches.map((b) => ({ value: b.id, label: b.name }))}
                                                                placeholder="All Branches"
                                                                searchable={true}
                                                                disabled={dropdownLoading}
                                                            />
                                                        </div>

                                                        {/* Department */}
                                                        <div className="col-span-1 flex flex-col">
                                                            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                                                                <Users className="inline h-4 w-4 mr-1" />
                                                                Department
                                                            </label>
                                                            <CustomSelect
                                                                name="department_id"
                                                                value={filters.department_id}
                                                                onChange={(e) => handleFilterChange('department_id', e.target.value)}
                                                                options={departments.map((d) => ({ value: d.id, label: d.name }))}
                                                                placeholder="All Departments"
                                                                searchable={true}
                                                                disabled={dropdownLoading}
                                                            />
                                                        </div>

                                                        {/* Designation */}
                                                        <div className="col-span-1 flex flex-col">
                                                            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                                                                <Award className="inline h-4 w-4 mr-1" />
                                                                Designation
                                                            </label>
                                                            <CustomSelect
                                                                name="designation_id"
                                                                value={filters.designation_id}
                                                                onChange={(e) => handleFilterChange('designation_id', e.target.value)}
                                                                options={designations.map((d) => ({ value: d.id, label: d.name }))}
                                                                placeholder="All Designations"
                                                                searchable={true}
                                                                disabled={dropdownLoading}
                                                            />
                                                        </div>

                                                        {/* Employee (optional) */}
                                                        <div className="col-span-2 flex flex-col">
                                                            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                                                                <User className="inline h-4 w-4 mr-1" />
                                                                Employee (optional)
                                                            </label>
                                                            <CustomSelect
                                                                name="employee_id"
                                                                value={filters.employee_id}
                                                                onChange={(e) => handleFilterChange('employee_id', e.target.value)}
                                                                options={employees.map((emp) => ({ value: emp.id, label: emp.name }))}
                                                                placeholder="All Employees"
                                                                searchable={true}
                                                                disabled={dropdownLoading}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col sm:flex-row justify-end gap-2 p-4 border-t border-[var(--color-border-secondary)] rounded-b-2xl">
                                                    <button
                                                        onClick={() => { resetFilters(); setFilterDropdown(false); }}
                                                        className="flex items-center justify-center gap-2 px-4 py-2 bg-transparent text-[var(--color-primary)] border-2 hover:bg-[var(--color-primary-lightest)] border-[var(--color-primary)] rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors text-sm font-medium min-w-[100px]"
                                                    >
                                                        <RefreshCw size={14} />
                                                        Reset
                                                    </button>
                                                    <button
                                                        onClick={() => { setFilterDropdown(false); handleGenerateReport(); }}
                                                        disabled={loading || !filters.month_year}
                                                        className="w-auto sm:w-[175px] flex items-center justify-center gap-2 px-4 py-2 bg-[var(--color-primary-dark)] text-[var(--color-text-white)] rounded-lg hover:bg-[var(--color-primary-darker)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                                                    >
                                                        {loading ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
                                                        {loading ? 'Generating...' : 'Generate Report'}
                                                    </button>
                                                </div>
                                            </div>
                                        </>,
                                        document.body
                                    )}
                                </div>

                                <div className="relative">
                                    <button
                                        ref={exportBtnRef}
                                        onClick={() => setExportDropdown((v) => !v)}
                                        disabled={!reportData || reportData.length === 0}
                                        // className="flex items-center gap-2 bg-[var(--color-bg-secondary)] text-[var(--color-primary-dark)] hover:bg-[var(--color-bg-primary)] px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        className="flex items-center gap-2 bg-[var(--color-bg-secondary)] text-[var(--color-primary-dark)] hover:bg-[var(--color-bg-primary)] px-4 py-2 rounded-lg font-medium transition-colors"

                                    >
                                        <Download className="h-4 w-4" />
                                        Export
                                        <ChevronDown className="h-4 w-4" />
                                    </button>

                                    {/* Export Dropdown (anchored) */}
                                    {exportDropdown &&
                                        exportPos.ready &&
                                        createPortal(
                                            <>
                                                <div className="fixed inset-0 z-40" onClick={() => setExportDropdown(false)} />
                                                <div
                                                    className="absolute z-50 bg-[var(--color-bg-secondary)] rounded-lg shadow-2xl border border-[var(--color-border-secondary)] py-2"
                                                    style={{
                                                        position: 'absolute',
                                                        top: exportPos.top,
                                                        left: exportPos.left,
                                                        width: Math.max(192, exportPos.width),
                                                        minWidth: 192
                                                    }}
                                                >
                                                    <button
                                                        onClick={handleExportExcelClick}
                                                        className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-[var(--color-bg-hover)] transition-colors text-[var(--color-text-primary)]"
                                                    >
                                                        <FileSpreadsheet className="h-4 w-4 text-primary-600" />
                                                        Export to Excel
                                                    </button>
                                                    <button
                                                        onClick={handleExportPDF}
                                                        className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-[var(--color-bg-hover)] transition-colors text-[var(--color-text-primary)]"
                                                    >
                                                        <FileDown className="h-4 w-4 text-red-600" />
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
                </div>

                {/* Summary Statistics */}
                {summaryStats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 shrink-0">
                        <div className="bg-[var(--color-bg-secondary)] rounded-xl p-5 shadow-sm border border-[var(--color-border-primary)]">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-[var(--color-text-secondary)]">Total Employees</p>
                                    <p className="text-2xl font-bold text-[var(--color-text-primary)]">{summaryStats.totalEmployees}</p>
                                </div>
                                <Users className="h-8 w-8 text-[var(--color-primary-dark)]" />
                            </div>
                        </div>
                        <div className="bg-[var(--color-bg-secondary)] rounded-xl p-5 shadow-sm border border-[var(--color-border-primary)]">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-[var(--color-text-secondary)]">Total Paid</p>
                                    <p className="text-2xl font-bold text-green-600">{formatCurrency(summaryStats.totalPaidSalary)}</p>
                                </div>
                                <IndianRupee className="h-8 w-8 text-green-600" />
                            </div>
                        </div>
                        <div className="bg-[var(--color-bg-secondary)] rounded-xl p-5 shadow-sm border border-[var(--color-border-primary)]">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-[var(--color-text-secondary)]">Overtime Pay</p>
                                    <p className="text-2xl font-bold text-orange-600">{formatCurrency(summaryStats.totalOvertimeSalary)}</p>
                                </div>
                                <Clock className="h-8 w-8 text-orange-600" />
                            </div>
                        </div>
                        <div className="bg-[var(--color-bg-secondary)] rounded-xl p-5 shadow-sm border border-[var(--color-border-primary)]">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-[var(--color-text-secondary)]">Average Salary</p>
                                    <p className="text-2xl font-bold text-purple-600">{formatCurrency(summaryStats.averageSalary)}</p>
                                </div>
                                <TrendingUp className="h-8 w-8 text-purple-600" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Salary Report Results */}
                {reportData && (
                    <div className="flex-1 flex flex-col min-h-0 bg-[var(--color-bg-secondary)] rounded-xl shadow-lg border border-[var(--color-border-primary)] overflow-hidden">
                        {/* Table Container */}
                        <Table wrapperClassName="flex-1 min-h-0 max-h-none overflow-auto custom-scrollbar" className="w-full">
                            <TableHeader>
                                <TableHeaderRow className="bg-[var(--color-primary-dark)] border-b border-[var(--color-border-primary)]">
                                    <Th className="text-left font-semibold text-white">
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4" />
                                            Employee Details
                                        </div>
                                    </Th>
                                    <Th className="text-center font-semibold text-white">
                                        <div className="flex items-center justify-center gap-2">
                                            <IndianRupee className="h-4 w-4" />
                                            Base Salary
                                        </div>
                                    </Th>
                                    <Th className="text-center font-semibold text-white">
                                        <div className="flex items-center justify-center gap-2">
                                            <Calendar className="h-4 w-4" />
                                            Attendance Summary
                                        </div>
                                    </Th>
                                    <Th className="text-center font-semibold text-white">
                                        <div className="flex items-center justify-center gap-2">
                                            <Clock className="h-4 w-4" />
                                            Overtime Details
                                        </div>
                                    </Th>
                                    <Th className="text-center font-semibold text-white">
                                        <div className="flex items-center justify-center gap-2">
                                            <CalendarX className="h-4 w-4" />
                                            Week Off
                                        </div>
                                    </Th>
                                    <Th className="text-center font-semibold text-white">
                                        <div className="flex items-center justify-center gap-2">
                                            <Calculator className="h-4 w-4" />
                                            Subtotal
                                        </div>
                                    </Th>
                                    <Th className="text-center font-semibold text-white">
                                        <div className="flex items-center justify-center gap-2">
                                            <TrendingUp className="h-4 w-4" />
                                            Final Salary
                                        </div>
                                    </Th>
                                </TableHeaderRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-[var(--color-border-primary)] ">
                                {currentItems.map((employee, index) => {
                                    const initials = employee.employee_name
                                        ? employee.employee_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
                                        : '??';

                                    return (
                                        <TableRow key={employee.employee_code || index} className="bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-hover)] transition-all duration-200 group border-b border-[var(--color-border-secondary)] last:border-0">
                                            {/* Employee Details */}
                                            <Td className="py-4">
                                                <div className="flex items-center gap-3 pl-2">
                                                    <div className="flex-shrink-0 h-9 w-9 rounded-full bg-gradient-to-br from-[var(--color-primary-light)] to-[var(--color-primary)] text-white flex items-center justify-center text-xs font-bold shadow-sm">
                                                        {initials}
                                                    </div>
                                                    <div className="flex flex-col items-start">
                                                        <span className="text-sm font-bold text-[var(--color-text-primary)] group-hover:text-[var(--color-primary-dark)] transition-colors tracking-tight">
                                                            {employee.employee_name || '--'}
                                                        </span>
                                                        <span className="text-[11px] font-semibold text-[var(--color-text-muted)] mt-0.5 bg-[var(--color-bg-gray-light)] px-1.5 py-0.5 rounded">
                                                            {employee.employee_code || '--'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </Td>

                                            {/* Base Salary */}
                                            <Td className="text-center py-4">
                                                <div className="inline-flex items-center justify-center px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg shadow-sm">
                                                    <span className="text-[14px] font-bold text-slate-700">
                                                        {formatCurrency(employee.employee_salary)}
                                                    </span>
                                                </div>
                                            </Td>

                                            {/* Attendance Summary */}
                                            <Td className="py-4">
                                                <div className="flex items-center justify-center gap-2 text-[11px] font-bold tracking-wide">
                                                    <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-md shadow-sm">
                                                        <span className="opacity-80">W</span>
                                                        <span className="text-[13px]">{employee.working_days || 0}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 text-green-700 border border-green-100 rounded-md shadow-sm">
                                                        <span className="opacity-80">P</span>
                                                        <span className="text-[13px]">{employee.present_days || 0}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 px-2 py-1 bg-red-50 text-red-700 border border-red-100 rounded-md shadow-sm">
                                                        <span className="opacity-80">A</span>
                                                        <span className="text-[13px]">{employee.absent_days || 0}</span>
                                                    </div>
                                                </div>
                                            </Td>

                                            {/* Overtime Details */}
                                            <Td className="text-center py-4">
                                                <div className="flex flex-col items-center justify-center gap-1">
                                                    {parseFloat(employee.overtime_salary || 0) > 0 ? (
                                                        <span className="inline-flex items-center justify-center px-2.5 py-1 bg-orange-50 text-orange-700 border border-orange-200 rounded-md font-bold text-[13px] shadow-sm">
                                                            {formatCurrency(employee.overtime_salary)}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[14px] font-medium text-gray-300">--</span>
                                                    )}
                                                    {parseFloat(employee.overtime_days || 0) > 0 && (
                                                        <span className="text-[10px] text-orange-600 font-bold flex items-center gap-1 uppercase tracking-wide">
                                                            <Clock className="h-3 w-3" /> {employee.overtime_days} days
                                                        </span>
                                                    )}
                                                </div>
                                            </Td>

                                            {/* Week Off */}
                                            <Td className="text-center py-4">
                                                <div className="flex flex-col items-center justify-center gap-1">
                                                    {parseFloat(employee.week_off_salary || 0) > 0 ? (
                                                        <span className="inline-flex items-center justify-center px-2.5 py-1 bg-[var(--color-primary-lightest)] text-[var(--color-primary-dark)] border border-[var(--color-primary-light)] rounded-md font-bold text-[13px] shadow-sm">
                                                            {formatCurrency(employee.week_off_salary)}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[14px] font-medium text-gray-300">--</span>
                                                    )}
                                                    {parseFloat(employee.week_off_days || 0) > 0 && (
                                                        <span className="text-[10px] text-[var(--color-primary)] font-bold flex items-center gap-1 uppercase tracking-wide">
                                                            <CalendarX className="h-3 w-3" /> {employee.week_off_days} days
                                                        </span>
                                                    )}
                                                </div>
                                            </Td>

                                            {/* Subtotal */}
                                            <Td className="text-center py-4">
                                                <span className="text-[15px] font-bold text-gray-600">
                                                    {formatCurrency(employee.subtotal_salary)}
                                                </span>
                                            </Td>

                                            {/* Final Salary */}
                                            <Td className="text-center py-4 pr-4">
                                                <div className="inline-flex items-center justify-center px-3.5 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg shadow-sm">
                                                    <span className="text-[15px] font-black text-emerald-700 tracking-tight">
                                                        {formatCurrency(employee.total_salary)}
                                                    </span>
                                                </div>
                                            </Td>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>

                        {/* Pagination */}
                        <div className="border-t border-[var(--color-border-primary)] bg-[var(--color-bg-primary)]">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={handlePageChange}
                                loading={reportGenerating}
                            />
                        </div>
                    </div>
                )}

                {/* No Data Message */}
                {!reportData && !reportGenerating && !error && filters.month_year && (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 bg-[#FBF9FD] rounded-xl border border-[var(--color-border-primary)] shadow-sm">
                        <NoDataFound
                            title="No Salary Data Found"
                            subtitle={`No salary data available for ${getMonthYearDisplay(filters.month_year)}. Try selecting a different month or check if payroll has been processed.`}
                        />
                    </div>
                )}

                {/* Initial Message */}
                {!reportData && !reportGenerating && !error && !filters.month_year && (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 bg-[#FBF9FD] rounded-xl border border-[var(--color-border-primary)] shadow-sm">
                        <NoDataFound
                            title="Select Month to Generate Report"
                            subtitle="Choose a month above and click 'Generate Report'."
                        />
                    </div>
                )}

                {/* Loading State */}
                {reportGenerating && (
                    <div className="flex-1 flex flex-col items-center justify-center bg-[var(--color-bg-secondary)] rounded-xl shadow-sm border border-[var(--color-border-primary)] p-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                            <div className="p-3 bg-[var(--color-primary-lightest)] rounded-full mb-4">
                                <Loader2 className="h-8 w-8 text-[var(--color-primary-dark)] animate-spin" />
                            </div>
                            <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">Generating Report</h3>
                            <p className="text-[var(--color-text-secondary)]">
                                Please wait while we prepare your monthly salary report...
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Toast */}
            {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
        </div>
    );
};

export default MonthlySalaryReport;


