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
    Play
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Pagination from '../../Components/Pagination';
import { Toast } from '../../Components/ui/Toast';
import { handleSalaryReportPDFExport } from '../../utils/exportUtils/salary/pdfExportSalary';
import { handlePayrollExportExcel } from '../../utils/exportUtils/salary/exportSalaryReportToExcel';

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
    const navigate = useNavigate();
    const { user } = useAuth();

    // Filters
    const [filters, setFilters] = useState({
        branch_id: '',
        department_id: '',
        designation_id: '',
        employee_id: '',
        month_year: ''
    });
    const [branches, setBranches] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [designations, setDesignations] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [dropdownLoading, setDropdownLoading] = useState(false);

    const [loading, setLoading] = useState(false);

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
        <div className="min-h-screen bg-[var(--color-bg-primary)]">
            <div className="p-8  mx-auto">
                {/* Header Section */}
                <div className="bg-[var(--color-bg-secondary)] rounded-2xl shadow-xl mb-8 overflow-hidden">
                    <div className="bg-gradient-to-r from-[var(--color-primary-dark)] to-[var(--color-primary-darker)] p-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => navigate('/reports')}
                                    className="flex items-center gap-2 text-[var(--color-text-white)] hover:text-[var(--color-text-white)] transition-colors bg-[var(--color-bg-secondary-20)] hover:bg-[var(--color-bg-secondary-30)] px-4 py-2 rounded-lg backdrop-blur-sm"
                                >
                                    <ArrowLeft size={18} />
                                    Back
                                </button>
                                <div className="flex items-center gap-3">
                                    <div>
                                        <h1 className="text-2xl font-bold text-[var(--color-text-white)]">Monthly Salary Report</h1>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <button
                                        ref={exportBtnRef}
                                        onClick={() => setExportDropdown((v) => !v)}
                                        disabled={!reportData || reportData.length === 0}
                                        className="flex items-center gap-2 bg-[var(--color-bg-secondary)] text-[var(--color-primary-dark)] hover:bg-[var(--color-bg-primary)] px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

                {/* Filters Section */}
                <div className="bg-[var(--color-bg-secondary)] rounded-xl shadow-sm border border-[var(--color-border-primary)] p-5 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-[var(--color-icon-primary-bg)] rounded-lg">
                                <Filter className="h-5 w-5 text-[var(--color-primary)]" />
                            </div>
                            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Filters</h2>
                        </div>
                        <button
                            onClick={resetFilters}
                            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-bg-gray-light)] text-[var(--color-text-secondary)] rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors duration-200"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Reset
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {/* Month Year */}
                        <div className="flex flex-col">
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
                        <div className="flex flex-col">
                            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                                <Building className="inline h-4 w-4 mr-1" />
                                Branch
                            </label>
                            <select
                                value={filters.branch_id}
                                onChange={(e) => handleFilterChange('branch_id', e.target.value)}
                                className="w-full px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border-secondary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-border-focus)] focus:border-transparent text-[var(--color-text-primary)]"
                                disabled={dropdownLoading}
                            >
                                <option value="">All Branches</option>
                                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                        </div>

                        {/* Department */}
                        <div className="flex flex-col">
                            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                                <Users className="inline h-4 w-4 mr-1" />
                                Department
                            </label>
                            <select
                                value={filters.department_id}
                                onChange={(e) => handleFilterChange('department_id', e.target.value)}
                                className="w-full px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border-secondary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-border-focus)] focus:border-transparent text-[var(--color-text-primary)]"
                                disabled={dropdownLoading}
                            >
                                <option value="">All Departments</option>
                                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        </div>

                        {/* Designation */}
                        <div className="flex flex-col">
                            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                                <Award className="inline h-4 w-4 mr-1" />
                                Designation
                            </label>
                            <select
                                value={filters.designation_id}
                                onChange={(e) => handleFilterChange('designation_id', e.target.value)}
                                className="w-full px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border-secondary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-border-focus)] focus:border-transparent text-[var(--color-text-primary)]"
                                disabled={dropdownLoading}
                            >
                                <option value="">All Designations</option>
                                {designations.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        </div>

                        {/* Employee (optional) */}
                        <div className="flex flex-col">
                            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                                <User className="inline h-4 w-4 mr-1" />
                                Employee (optional)
                            </label>
                            <select
                                value={filters.employee_id}
                                onChange={(e) => handleFilterChange('employee_id', e.target.value)}
                                className="w-full px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border-secondary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-border-focus)] focus:border-transparent text-[var(--color-text-primary)]"
                                disabled={dropdownLoading}
                            >
                                <option value="">All Employees</option>
                                {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                            </select>
                        </div>

                        {/* Generate Button */}
                        <div className="flex flex-col">
                            <label className="block text-sm font-medium text-transparent mb-2">Generate</label>
                            <button
                                onClick={handleGenerateReport}
                                disabled={loading || !filters.month_year}
                                className={`flex items-center justify-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors duration-200 ${loading || !filters.month_year
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] shadow-lg hover:shadow-xl'
                                    }`}
                            >
                                {loading ? (
                                    <>
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Play className="h-4 w-4" />
                                        Generate Report
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Summary Statistics */}
                {summaryStats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <div className="bg-[var(--color-bg-secondary)] rounded-xl p-8 shadow-sm border border-[var(--color-border-primary)]">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-[var(--color-text-secondary)]">Total Employees</p>
                                    <p className="text-2xl font-bold text-[var(--color-text-primary)]">{summaryStats.totalEmployees}</p>
                                </div>
                                <Users className="h-8 w-8 text-[var(--color-primary-dark)]" />
                            </div>
                        </div>
                        <div className="bg-[var(--color-bg-secondary)] rounded-xl p-8 shadow-sm border border-[var(--color-border-primary)]">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-[var(--color-text-secondary)]">Total Paid</p>
                                    <p className="text-2xl font-bold text-green-600">{formatCurrency(summaryStats.totalPaidSalary)}</p>
                                </div>
                                <IndianRupee className="h-8 w-8 text-green-600" />
                            </div>
                        </div>
                        <div className="bg-[var(--color-bg-secondary)] rounded-xl p-8 shadow-sm border border-[var(--color-border-primary)]">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-[var(--color-text-secondary)]">Overtime Pay</p>
                                    <p className="text-2xl font-bold text-orange-600">{formatCurrency(summaryStats.totalOvertimeSalary)}</p>
                                </div>
                                <Clock className="h-8 w-8 text-orange-600" />
                            </div>
                        </div>
                        <div className="bg-[var(--color-bg-secondary)] rounded-xl p-8 shadow-sm border border-[var(--color-border-primary)]">
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
                    <div className="bg-[var(--color-bg-secondary)] rounded-xl shadow-lg border border-[var(--color-border-primary)] overflow-hidden">
                        {/* Header */}
                        <div className="px-6 py-5 border-b border-[var(--color-border-primary)] bg-gradient-to-r from-[var(--color-primary-dark)] to-[var(--color-primary-darker)]">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center">
                                    <div className="p-2 bg-[var(--color-bg-secondary-20)] rounded-lg mr-3">
                                        <IndianRupee className="h-6 w-6 text-[var(--color-text-white)]" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-[var(--color-text-white)]">Monthly Salary Report</h3>
                                        <p className="text-sm text-[var(--color-text-white)] opacity-80">
                                            {getMonthYearDisplay(filters.month_year)}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm text-[var(--color-text-white)] opacity-80">Total Records</div>
                                    <div className="text-2xl font-bold text-[var(--color-text-white)]">{reportData.length}</div>
                                </div>
                            </div>
                        </div>

                        {/* Table Container */}
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-[var(--color-bg-primary)] border-b border-[var(--color-border-primary)]">
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--color-text-primary)]">
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4" />
                                                Employee Details
                                            </div>
                                        </th>
                                        <th className="px-4 py-4 text-center text-sm font-semibold text-[var(--color-text-primary)]">
                                            <div className="flex items-center justify-center gap-2">
                                                <IndianRupee className="h-4 w-4" />
                                                Base Salary
                                            </div>
                                        </th>
                                        <th className="px-4 py-4 text-center text-sm font-semibold text-[var(--color-text-primary)]">
                                            <div className="flex items-center justify-center gap-2">
                                                <Calendar className="h-4 w-4" />
                                                Attendance Summary
                                            </div>
                                        </th>
                                        <th className="px-4 py-4 text-center text-sm font-semibold text-[var(--color-text-primary)]">
                                            <div className="flex items-center justify-center gap-2">
                                                <Clock className="h-4 w-4" />
                                                Overtime Details
                                            </div>
                                        </th>
                                        <th className="px-4 py-4 text-center text-sm font-semibold text-[var(--color-text-primary)]">
                                            <div className="flex items-center justify-center gap-2">
                                                <CalendarX className="h-4 w-4" />
                                                Week Off
                                            </div>
                                        </th>
                                        <th className="px-4 py-4 text-center text-sm font-semibold text-[var(--color-text-primary)]">
                                            <div className="flex items-center justify-center gap-2">
                                                <Calculator className="h-4 w-4" />
                                                Subtotal
                                            </div>
                                        </th>
                                        <th className="px-4 py-4 text-center text-sm font-semibold text-[var(--color-text-primary)]">
                                            <div className="flex items-center justify-center gap-2">
                                                <TrendingUp className="h-4 w-4" />
                                                Final Salary
                                            </div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--color-border-primary)]">
                                    {currentItems.map((employee, index) => (
                                        <tr key={employee.employee_code || index} className="bg-[var(--color-bg-secondary)]">
                                            {/* Employee Details */}
                                            <td className="px-6 py-5">
                                                <div className="flex items-center">
                                                    <div className="ml-4">
                                                        <div className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">
                                                            {employee.employee_name || '--'}
                                                        </div>
                                                        <div className="text-xs text-[var(--color-text-secondary)] bg-[var(--color-bg-primary)] px-2 py-1 rounded-md inline-block">
                                                            {employee.employee_code || '--'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Base Salary */}
                                            <td className="px-4 py-5 text-center">
                                                <div className="bg-[var(--color-bg-primary)] rounded-lg p-3 border border-[var(--color-border-primary)]">
                                                    <div className="text-lg font-bold text-[var(--color-primary-dark)]">
                                                        {formatCurrency(employee.employee_salary)}
                                                    </div>
                                                    <div className="text-xs text-[var(--color-text-secondary)] mt-1">Monthly Base</div>
                                                </div>
                                            </td>

                                            {/* Attendance Summary */}
                                            <td className="px-4 py-5">
                                                <div className="bg-[var(--color-bg-primary)] rounded-lg p-3 border border-[var(--color-border-primary)] space-y-2">
                                                    <div className="grid grid-cols-3 gap-2 text-xs">
                                                        <div className="text-center">
                                                            <div className="text-[var(--color-text-secondary)]">Working</div>
                                                            <div className="font-semibold text-[var(--color-primary-dark)]">
                                                                {employee.working_days || 0}
                                                            </div>
                                                        </div>
                                                        <div className="text-center">
                                                            <div className="text-[var(--color-text-secondary)]">Present</div>
                                                            <div className="font-semibold text-green-600">{employee.present_days || 0}</div>
                                                        </div>
                                                        <div className="text-center">
                                                            <div className="text-[var(--color-text-secondary)]">Absent</div>
                                                            <div className="font-semibold text-red-600">{employee.absent_days || 0}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Overtime Details */}
                                            <td className="px-4 py-5 text-center">
                                                <div className="bg-[var(--color-bg-primary)] rounded-lg p-3 border border-[var(--color-border-primary)]">
                                                    <div className="text-sm font-bold text-orange-600 mb-2">
                                                        {formatCurrency(employee.overtime_salary)}
                                                    </div>
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Clock className="h-3 w-3 text-orange-600" />
                                                        <span className="text-xs text-[var(--color-text-secondary)]">
                                                            {employee.overtime_days || 0} days
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Week Off */}
                                            <td className="px-4 py-5 text-center">
                                                <div className="bg-[var(--color-bg-primary)] rounded-lg p-3 border border-[var(--color-border-primary)]">
                                                    <div className="text-sm font-bold text-[var(--color-primary-dark)] mb-2">
                                                        {formatCurrency(employee.week_off_salary)}
                                                    </div>
                                                    <div className="flex items-center justify-center gap-1">
                                                        <CalendarX className="h-3 w-3 text-[var(--color-primary-dark)]" />
                                                        <span className="text-xs text-[var(--color-text-secondary)]">
                                                            {employee.week_off_days || 0} days
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Subtotal */}
                                            <td className="px-4 py-5 text-center">
                                                <div className="bg-[var(--color-bg-primary)] rounded-lg p-3 border border-[var(--color-border-primary)]">
                                                    <div className="text-lg font-bold text-[var(--color-text-primary)]">
                                                        {formatCurrency(employee.subtotal_salary)}
                                                    </div>
                                                    <div className="text-xs text-[var(--color-text-secondary)] mt-1">Before Final</div>
                                                </div>
                                            </td>

                                            {/* Final Salary */}
                                            <td className="px-4 py-5 text-center">
                                                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border-2 border-green-200 shadow-sm">
                                                    <div className="text-xl font-bold text-green-700 mb-1">
                                                        {formatCurrency(employee.total_salary)}
                                                    </div>
                                                    <div className="text-xs text-green-600 font-medium">Net Payable</div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

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
                    <div className="bg-[var(--color-bg-secondary)] rounded-xl shadow-sm border border-[var(--color-border-primary)] p-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                            <div className="p-3 bg-[var(--color-bg-hover)] rounded-full mb-4">
                                <IndianRupee className="h-8 w-8 text-[var(--color-text-secondary)]" />
                            </div>
                            <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">No Salary Data Found</h3>
                            <p className="text-[var(--color-text-secondary)] mb-4">
                                No salary data available for {getMonthYearDisplay(filters.month_year)}.
                            </p>
                            <div className="text-sm text-[var(--color-text-secondary)] space-y-1">
                                <p>• Try selecting a different month</p>
                                <p>• Or check if payroll has been processed</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Initial Message */}
                {!reportData && !reportGenerating && !error && !filters.month_year && (
                    <div className="bg-[var(--color-bg-secondary)] rounded-xl shadow-sm border border-[var(--color-border-primary)] p-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                            <div className="p-3 bg-[var(--color-primary-lightest)] rounded-full mb-4">
                                <Calendar className="h-8 w-8 text-[var(--color-primary-dark)]" />
                            </div>
                            <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">Select Month to Generate Report</h3>
                            <p className="text-[var(--color-text-secondary)] mb-4">
                                Please select a month and year to generate the salary report.
                            </p>
                            <div className="text-sm text-[var(--color-text-secondary)]">
                                <p>Choose the month from the filter above and click "Generate Report"</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {reportGenerating && (
                    <div className="bg-[var(--color-bg-secondary)] rounded-xl shadow-sm border border-[var(--color-border-primary)] p-12 text-center">
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
