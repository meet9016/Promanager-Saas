import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosInstance';
import {
    ArrowLeft, Filter, RefreshCw, Loader2, Calendar, Download, ChevronDown,
    FileDown, Users, FileSpreadsheet, IndianRupee, User, Building, Award,
    Play, CheckCircle, XCircle, Clock, AlertCircle, Wallet, CreditCard, X
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Pagination from '../../Components/Pagination';
import { Toast } from '../../Components/ui/Toast';
import { exportSalaryStatusToPDF } from '../../utils/exportUtils/salary/pdfExportSalaryGenerationStatus';
import { exportSalaryStatusToExcel } from '../../utils/exportUtils/salary/excelExportSalaryGenerationStatus';
import CustomSelect from '../../Components/comman/CustomSelect';
import { Table, TableHeader, TableBody, TableRow, TableHeaderRow, Th, Td } from '../../Components/ui/Table';
import CustomDatePicker from '../../Components/comman/CustomDatePicker';
import NoDataFound from '../../Components/comman/NoDataFound';

/** ─── Anchored position helpers ─────────────────────────────────────────── **/
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
        const top = rect.bottom + scrollY + offset;
        const left = placement === 'bottom-start' ? rect.left + scrollX
            : placement === 'bottom-center' ? rect.left + scrollX + rect.width / 2 - minWidth / 2
                : rect.left + scrollX + rect.width - minWidth;
        setPos({ top, left, width: rect.width, ready: true });
    }, [anchorRef, offset, placement, minWidth]);
    useLayoutEffect(() => {
        if (!isOpen) { cleanupRef.current.forEach(fn => fn && fn()); cleanupRef.current = []; setPos(p => ({ ...p, ready: false })); return; }
        compute();
        const parents = getScrollParents(anchorRef.current);
        const rafThrottle = (fn) => { let t = false; return () => { if (t) return; t = true; requestAnimationFrame(() => { fn(); t = false; }); }; };
        const handler = rafThrottle(() => compute());
        parents.forEach(p => p.addEventListener('scroll', handler, { passive: true }));
        window.addEventListener('resize', handler, { passive: true });
        const remove = () => { parents.forEach(p => p.removeEventListener('scroll', handler)); window.removeEventListener('resize', handler); };
        cleanupRef.current.push(remove);
        return () => { remove(); cleanupRef.current = []; };
    }, [isOpen, compute, anchorRef]);
    return pos;
};
/** ──────────────────────────────────────────────────────────────────────── **/

// Status badge using payment_status_label + salary_generation_status
const SalaryStatusBadge = ({ genStatus, paymentLabel }) => {
    const gen = String(genStatus || '').toLowerCase();
    const pay = String(paymentLabel || '').toLowerCase();

    if (gen === 'generated' && (pay === 'paid' || pay === 'partially paid')) {
        return (
            <div className="flex flex-col items-center gap-1">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    <CheckCircle className="h-3 w-3" />Generated
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                    <Wallet className="h-3 w-3" />{paymentLabel}
                </span>
            </div>
        );
    }
    if (gen === 'generated') {
        return (
            <div className="flex flex-col items-center gap-1">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    <CheckCircle className="h-3 w-3" />Generated
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                    <Clock className="h-3 w-3" />{paymentLabel || 'Unpaid'}
                </span>
            </div>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            <AlertCircle className="h-3 w-3" />{paymentLabel || 'Not Generated'}
        </span>
    );
};

const SalaryGenerationStatusReport = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const currentDate = new Date();

    const [filters, setFilters] = useState({
        branch_id: '', department_id: '', designation_id: '', employee_id: '', month_year: `${currentDate.getFullYear()}-${String(
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
    const filterPos = useAnchoredPosition(filterBtnRef, filterDropdown, { placement: 'bottom-end', offset: 10, minWidth: 420 });
    const [exportDropdown, setExportDropdown] = useState(false);
    const exportBtnRef = useRef(null);
    const exportPos = useAnchoredPosition(exportBtnRef, exportDropdown, { placement: 'bottom-end', offset: 10, minWidth: 192 });

    const [reportData, setReportData] = useState(null);   // array
    const [apiSummary, setApiSummary] = useState(null);   // summary object from API
    const [error, setError] = useState(null);
    const [toast, setToast] = useState(null);
    const showToast = (message, type) => setToast({ message, type });
    const closeToast = () => setToast(null);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        if (exportDropdown && exportBtnRef.current) {
            const rect = exportBtnRef.current.getBoundingClientRect();
            if (rect.bottom < 0 || rect.top > window.innerHeight || rect.right < 0 || rect.left > window.innerWidth) setExportDropdown(false);
        }
    }, [exportDropdown, exportPos]);

    const fetchDropdownData = useCallback(async () => {
        try {
            setDropdownLoading(true);
            if (!user?.user_id) throw new Error('User ID required');
            const form = new FormData();
            const res = await api.post('employee_drop_down_list', form);
            if (res.data?.success && res.data.data) {
                const d = res.data.data;
                setBranches((d.branch_list || []).map(b => ({ id: b.branch_id, name: b.name })));
                setDepartments((d.department_list || []).map(d => ({ id: d.department_id, name: d.name })));
                setDesignations((d.designation_list || []).map(d => ({ id: d.designation_id, name: d.name })));
            }
        } catch (e) { console.error(e); } finally { setDropdownLoading(false); }
    }, [user?.user_id]);

    const fetchEmployees = useCallback(async () => {
        try {
            if (!user?.user_id) return;
            const form = new FormData();
            if (filters.branch_id) form.append('branch_id', filters.branch_id);
            if (filters.department_id) form.append('department_id', filters.department_id);
            if (filters.designation_id) form.append('designation_id', filters.designation_id);
            const res = await api.post('report_employee_list_drop_down', form);
            if (res.data?.success && res.data.data)
                setEmployees((res.data.data.employee_list || []).map(e => ({ id: e.employee_id, name: e.full_name })));
        } catch (e) { console.error(e); }
    }, [user?.user_id, filters.branch_id, filters.department_id, filters.designation_id]);

    useEffect(() => { fetchDropdownData(); }, [fetchDropdownData]);
    useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

    useEffect(() => {
        if (user?.user_id) {
            handleGenerateReport(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.user_id]);

    const handleGenerateReport = async (isAuto = false) => {
        if (!filters.month_year) {
            if (!isAuto) showToast('Please select a month and year', 'error');
            return;
        }
        try {
            setLoading(true); setError('');
            const formData = new FormData();
            formData.append('month_year', filters.month_year);
            if (filters.branch_id) formData.append('branch_id', filters.branch_id);
            if (filters.department_id) formData.append('department_id', filters.department_id);
            if (filters.designation_id) formData.append('designation_id', filters.designation_id);
            if (filters.employee_id) formData.append('employee_id', filters.employee_id);
            const response = await api.post('salary_generation_status_report', formData);
            if (response.data?.success && response.data.data) {
                setReportData(response.data.data);
                setApiSummary(response.data.summary || null);
                setCurrentPage(1);
                if (!isAuto) showToast('Report generated successfully', 'success');
            } else throw new Error(response.data?.message || 'Failed to generate report');
        } catch (err) {
            const msg = err.message || 'Failed to generate report';
            setError(msg);
            if (!isAuto) showToast(msg, 'error');
        } finally { setLoading(false); }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => {
            const next = { ...prev, [key]: value };
            if (key === 'branch_id') { next.department_id = ''; next.designation_id = ''; next.employee_id = ''; }
            else if (key === 'department_id') { next.designation_id = ''; next.employee_id = ''; }
            else if (key === 'designation_id') { next.employee_id = ''; }
            return next;
        });
    };

    const formatCurrency = (amount) =>
        new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount || 0);

    const resetFilters = () => {
        setFilters({ branch_id: '', department_id: '', designation_id: '', employee_id: '', month_year: '' });
        setReportData(null); setApiSummary(null); setError(''); setCurrentPage(1);
        showToast('Filters reset successfully', 'success');
    };

    const totalPages = Math.ceil((reportData?.length || 0) / itemsPerPage);
    const currentItems = reportData?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage) || [];
    useEffect(() => { setCurrentPage(1); }, [reportData]);

    const getMonthYearDisplay = (monthYear) => {
        if (!monthYear) return 'Select Month';
        return new Date(monthYear + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    const handleExportPDF = async () => {
        try {
            const companyName = user?.company_name || user?.company || user?.full_name || 'Your Company Name';
            await exportSalaryStatusToPDF(reportData, filters, companyName);
            showToast('PDF exported successfully', 'success');
        } catch (e) { showToast(e.message || 'Export failed', 'error'); }
        setExportDropdown(false);
    };

    const handleExportExcel = async () => {
        try {
            const companyName = user?.company_name || user?.company || user?.full_name || 'Your Company Name';
            await exportSalaryStatusToExcel(reportData, filters, apiSummary, 'Salary_Generation_Status', companyName);
            showToast('Excel exported successfully', 'success');
        } catch (e) { showToast(e.message || 'Export failed', 'error'); }
        setExportDropdown(false);
    };

    return (
        <div className="h-[calc(100vh-64px)] bg-[var(--color-bg-primary)] flex flex-col">
            <div className="flex-1 p-8 mx-auto w-full flex flex-col min-h-0">
                {/* Header */}
                <div className="bg-[var(--color-bg-secondary)] rounded-2xl shadow-xl mb-8 overflow-hidden">
                    <div className="bg-gradient-to-r from-[var(--color-primary-dark)] to-[var(--color-primary-darker)] p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button onClick={() => navigate('/reports')} className="flex items-center gap-2 text-[var(--color-text-white)] transition-colors bg-[var(--color-bg-secondary-20)] hover:bg-[var(--color-bg-secondary-30)] px-2 py-2 rounded-lg backdrop-blur-sm">
                                    <ArrowLeft size={18} />
                                </button>
                                <div>
                                    <h1 className="text-2xl font-bold text-[var(--color-text-white)]">Salary Generation Status  {filters.month_year && `- ${getMonthYearDisplay(filters.month_year)}`}</h1>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {/* Filter button */}
                                <div className="relative">
                                    <button
                                        ref={filterBtnRef}
                                        onClick={() => setFilterDropdown((v) => !v)}
                                        className="flex items-center gap-2 bg-[var(--color-bg-secondary)] text-[var(--color-primary-dark)] hover:bg-[var(--color-bg-primary)] px-4 py-2 rounded-lg font-medium transition-colors text-[14px]"
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
                                                        <div className="col-span-1 flex flex-col">
                                                            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                                                                <Calendar className="inline h-4 w-4 mr-1" />Month & Year <span className="text-[var(--color-error)]">*</span>
                                                            </label>
                                                            <DatePicker
                                                                selected={filters.month_year ? new Date(`${filters.month_year}-01`) : null}
                                                                onChange={(date) => handleFilterChange('month_year', date ? `${date.getFullYear()}-${pad2(date.getMonth() + 1)}` : '')}
                                                                dateFormat="MMMM yyyy" showMonthYearPicker showFullMonthYearPicker
                                                                className="w-full px-3 py-2 rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-border-focus)] focus:border-transparent"
                                                                placeholderText="Select month and year" maxDate={new Date()} showPopperArrow={false}
                                                            />
                                                        </div>
                                                        <div className="col-span-1 flex flex-col">
                                                            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2"><Building className="inline h-4 w-4 mr-1" />Branch</label>
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
                                                        <div className="col-span-1 flex flex-col">
                                                            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2"><Users className="inline h-4 w-4 mr-1" />Department</label>
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
                                                        <div className="col-span-1 flex flex-col">
                                                            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2"><Award className="inline h-4 w-4 mr-1" />Designation</label>
                                                            <CustomSelect
                                                                name="designation_id"
                                                                value={filters.designation_id}
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
                                                        <div className="col-span-2 flex flex-col">
                                                            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2"><User className="inline h-4 w-4 mr-1" />Employee (optional)</label>
                                                            <CustomSelect
                                                                name="employee_id"
                                                                value={filters.employee_id}
                                                                onChange={(e) => handleFilterChange('employee_id', e.target.value)}
                                                                options={employees.map((e) => ({
                                                                    value: e.id,
                                                                    label: e.name,
                                                                }))}
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
                                    <button ref={exportBtnRef} onClick={() => setExportDropdown(v => !v)} disabled={!reportData || reportData.length === 0}
                                        // className="flex items-center gap-2 bg-[var(--color-bg-secondary)] text-[var(--color-primary-dark)] hover:bg-[var(--color-bg-primary)] px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        className="flex items-center gap-2 bg-[var(--color-bg-secondary)] text-[var(--color-primary-dark)] hover:bg-[var(--color-bg-primary)] px-4 py-2 rounded-lg font-medium transition-colors text-[14px]"

                                    >
                                        <Download className="h-4 w-4" /> Export <ChevronDown className="h-4 w-4" />
                                    </button>
                                    {exportDropdown && exportPos.ready && createPortal(
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setExportDropdown(false)} />
                                            <div className="absolute z-50 bg-[var(--color-bg-secondary)] rounded-lg shadow-2xl border border-[var(--color-border-secondary)] py-2"
                                                style={{ position: 'absolute', top: exportPos.top, left: exportPos.left, width: Math.max(192, exportPos.width), minWidth: 192 }}>
                                                <button onClick={handleExportExcel} className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-[var(--color-bg-hover)] transition-colors text-[var(--color-text-primary)]">
                                                    <FileSpreadsheet className="h-4 w-4 text-primary-600" /> Export to Excel
                                                </button>
                                                <button onClick={handleExportPDF} className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-[var(--color-bg-hover)] transition-colors text-[var(--color-text-primary)]">
                                                    <FileDown className="h-4 w-4 text-red-600" /> Export to PDF
                                                </button>
                                            </div>
                                        </>, document.body
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Summary Stats — from API summary object */}
                {apiSummary && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                        {[
                            { label: 'Total Employees', value: apiSummary.total_employees, icon: Users, color: 'text-[var(--color-primary-dark)]' },
                            { label: 'Generated', value: apiSummary.generated_count, icon: CheckCircle, color: 'text-green-600' },
                            { label: 'Pending', value: apiSummary.pending_count, icon: Clock, color: 'text-yellow-600' },
                            { label: 'Paid', value: apiSummary.paid_count, icon: Wallet, color: 'text-primary-600' },
                            { label: 'Generated Total', value: formatCurrency(apiSummary.generated_total_salary), icon: IndianRupee, color: 'text-green-600' },
                            { label: 'Total Paid', value: formatCurrency(apiSummary.paid_total_salary), icon: CreditCard, color: 'text-primary-600' },
                        ].map(({ label, value, icon: Icon, color }) => (
                            <div key={label} className="bg-[var(--color-bg-secondary)] rounded-xl p-4 shadow-sm border border-[var(--color-border-primary)]">
                                <div className="flex items-center justify-between mb-1">
                                    <p className="text-xs text-[var(--color-text-secondary)]">{label}</p>
                                    <Icon className={`h-5 w-5 ${color}`} />
                                </div>
                                <p className={`text-lg font-bold ${color}`}>{value}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Table */}
                {reportData && (
                    <div className="flex-1 flex flex-col min-h-0 bg-[var(--color-bg-secondary)] rounded-xl shadow-lg border border-[var(--color-border-primary)] overflow-hidden">
                        <Table wrapperClassName="flex-1 min-h-0 max-h-none overflow-auto custom-scrollbar" className="w-full">
                            <TableHeader>
                                <TableHeaderRow className="bg-[var(--color-primary-dark)] border-b border-[var(--color-border-primary)]">

                                    <Th className="text-left font-semibold text-white">
                                        <div className="flex items-center gap-2"><User className="h-4 w-4" />Employee</div>
                                    </Th>
                                    <Th className="text-center font-semibold text-white">Monthly Salary</Th>
                                    <Th className="text-center font-semibold text-white">Final Salary</Th>
                                    <Th className="text-center font-semibold text-white">Net Payable</Th>
                                    <Th className="text-center font-semibold text-white">Total Paid</Th>
                                    <Th className="text-center font-semibold text-white">Balance Due</Th>
                                    <Th className="text-center font-semibold text-white">Generated At</Th>
                                    <Th className="text-center font-semibold text-white">Status</Th>
                                </TableHeaderRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-[var(--color-border-primary)]">
                                {currentItems.map((emp, idx) => {
                                    const isPaid = String(emp.payment_status_label || '').toLowerCase() === 'paid';
                                    const isGenerated = String(emp.salary_generation_status || '').toLowerCase() === 'generated';
                                    const balanceDue = parseFloat(emp.balance_due || 0);

                                    return (
                                        <TableRow key={emp.employee_id || idx} className="bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-primary)] transition-colors">

                                            <Td>
                                                <div className="font-semibold text-sm text-[var(--color-text-primary)]">{emp.employee_name || '--'}</div>
                                                <div className="text-xs text-[var(--color-text-secondary)] bg-[var(--color-bg-primary)] px-2 py-0.5 rounded mt-1 inline-block">{emp.employee_code || '--'}</div>
                                            </Td>
                                            <Td className="text-center">
                                                <span className="text-sm font-semibold text-[var(--color-primary-dark)]">{formatCurrency(emp.monthly_salary)}</span>
                                            </Td>
                                            <Td className="text-center">
                                                {isGenerated
                                                    ? <span className="text-sm font-semibold text-[var(--color-text-primary)]">{formatCurrency(emp.final_salary)}</span>
                                                    : <span className="text-xs text-[var(--color-text-secondary)]">—</span>}
                                            </Td>
                                            <Td className="text-center">
                                                {isGenerated
                                                    ? <span className="text-sm font-bold text-green-600">{formatCurrency(emp.net_payable)}</span>
                                                    : <span className="text-xs text-[var(--color-text-secondary)]">—</span>}
                                            </Td>
                                            <Td className="text-center">
                                                {isPaid
                                                    ? <span className="text-sm font-bold text-primary-600">{formatCurrency(emp.total_paid)}</span>
                                                    : <span className="text-xs text-[var(--color-text-secondary)]">—</span>}
                                            </Td>
                                            <Td className="text-center">
                                                {isGenerated
                                                    ? <span className={`text-sm font-semibold ${balanceDue > 0 ? 'text-red-500' : 'text-green-600'}`}>
                                                        {balanceDue > 0 ? formatCurrency(balanceDue) : '✓ Cleared'}
                                                    </span>
                                                    : <span className="text-xs text-[var(--color-text-secondary)]">—</span>}
                                            </Td>
                                            <Td className="text-center">
                                                <span className="text-xs text-[var(--color-text-secondary)]">
                                                    {emp.generated_at
                                                        ? new Date(emp.generated_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                                                        : '—'}
                                                </span>
                                            </Td>
                                            <Td className="text-center">
                                                <SalaryStatusBadge genStatus={emp.salary_generation_status} paymentLabel={emp.payment_status_label} />
                                            </Td>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>

                        <div className="border-t border-[var(--color-border-primary)] bg-[var(--color-bg-primary)]">
                            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} loading={loading} className='!py-4' />
                        </div>
                    </div>
                )}

                {/* States */}
                {!reportData && !loading && filters.month_year && (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 bg-[#FBF9FD] rounded-xl border border-[var(--color-border-primary)] shadow-sm">
                        <NoDataFound
                            title="No Data Found"
                            subtitle={`No salary data for ${getMonthYearDisplay(filters.month_year)}.`}
                        />
                    </div>
                )}
                {!reportData && !loading && !filters.month_year && (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 bg-[#FBF9FD] rounded-xl border border-[var(--color-border-primary)] shadow-sm">
                        <NoDataFound
                            title="Select Month to Generate Report"
                            subtitle="Choose a month above and click 'Generate Report'."
                        />
                    </div>
                )}
                {loading && (
                    <div className="flex-1 flex flex-col items-center justify-center bg-[var(--color-bg-secondary)] rounded-xl shadow-sm border border-[var(--color-border-primary)] p-12 text-center">
                        <div className="flex flex-col items-center">
                            <div className="p-3 bg-[var(--color-primary-lightest)] rounded-full mb-4"><Loader2 className="h-8 w-8 text-[var(--color-primary-dark)] animate-spin" /></div>
                            <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">Generating Report</h3>
                            <p className="text-[var(--color-text-secondary)]">Please wait...</p>
                        </div>
                    </div>
                )}
            </div>
            {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
        </div>
    );
};

export default SalaryGenerationStatusReport;