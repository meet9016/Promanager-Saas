import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosInstance';
import {
    ArrowLeft, Filter, RefreshCw, Loader2, Calendar, Download, ChevronDown,
    FileDown, TrendingUp, Users, Clock, FileSpreadsheet, IndianRupee,
    User, Building, Award, Play, CheckCircle, CreditCard, Wallet,
    Minus, Plus, AlertCircle, Gift, ChevronRight, X
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Pagination from '../../Components/Pagination';
import { Toast } from '../../Components/ui/Toast';
import { exportPaySalaryToPDF } from '../../utils/exportUtils/salary/pdfExportPayMonthlySalary';
import { exportPaySalaryToExcel } from '../../utils/exportUtils/salary/excelExportPayMonthlySalary';
import CustomSelect from '../../Components/comman/CustomSelect';
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

const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount || 0);

// Payment status badge
const PaymentBadge = ({ label }) => {
    const l = String(label || '').toLowerCase();
    if (l === 'paid') return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700"><CheckCircle className="h-3 w-3" />Paid</span>;
    if (l === 'partially paid') return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700"><AlertCircle className="h-3 w-3" />Partially Paid</span>;
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700"><Clock className="h-3 w-3" />Unpaid</span>;
};

// Expandable breakdown row for one employee
const EmployeeRow = ({ emp, idx, formatCurrency }) => {
    const [expanded, setExpanded] = useState(false);

    const allowances = emp.allowance_arr || [];
    const deductions = emp.deduction_arr || [];
    const loans = emp.loan_arr || [];
    const advances = emp.advance_arr || [];
    const holidays = emp.holiday_arr || [];
    const payments = emp.payment_arr || [];

    const totalPaid = parseFloat(emp.total_paid || 0);
    const netPayable = parseFloat(emp.net_payable || 0);
    // The "final payable" is total_paid if paid, else net_payable
    const isPaid = String(emp.payment_status_label || '').toLowerCase() === 'paid';
    const isPartial = String(emp.payment_status_label || '').toLowerCase() === 'partially paid';

    const hasExtras = allowances.length > 0 || deductions.length > 0 || loans.length > 0 || advances.length > 0 || holidays.length > 0 || payments.length > 0;

    return (
        <>
            {/* Main row */}
            <tr className={`bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-primary)] transition-colors ${expanded ? 'border-b-0' : ''}`}>
                <td className="px-4 py-4 text-center">
                    <span className="text-xs text-[var(--color-text-secondary)] bg-[var(--color-bg-primary)] px-2 py-0.5 rounded font-medium">{emp.employee_code || '--'}</span>
                </td>
                <td className="px-4 py-4">
                    <div className="font-semibold text-sm text-[var(--color-text-primary)]">{emp.employee_name || '--'}</div>
                </td>
                {/* Monthly salary */}
                <td className="px-4 py-4 text-center">
                    <span className="text-sm font-semibold text-[var(--color-primary-dark)]">{formatCurrency(emp.monthly_salary)}</span>
                </td>
                {/* Total salary (attendance-based) */}
                <td className="px-4 py-4 text-center">
                    <span className="text-sm font-semibold text-[var(--color-text-primary)]">{formatCurrency(emp.total_salary)}</span>
                </td>
                {/* Allowance */}
                <td className="px-4 py-4 text-center">
                    {allowances.length > 0
                        ? <span className="text-sm font-medium text-green-600">+{formatCurrency(emp.total_allowance_amount)}</span>
                        : <span className="text-xs text-[var(--color-text-secondary)]">—</span>}
                </td>
                {/* Deduction */}
                <td className="px-4 py-4 text-center">
                    {deductions.length > 0
                        ? <span className="text-sm font-medium text-red-500">-{formatCurrency(emp.total_deduction_amount)}</span>
                        : <span className="text-xs text-[var(--color-text-secondary)]">—</span>}
                </td>
                {/* Loan */}
                <td className="px-4 py-4 text-center">
                    {loans.length > 0
                        ? <span className="text-sm font-medium text-orange-500">-{formatCurrency(emp.total_loan_amount)}</span>
                        : <span className="text-xs text-[var(--color-text-secondary)]">—</span>}
                </td>
                {/* Advance */}
                <td className="px-4 py-4 text-center">
                    {advances.length > 0
                        ? <span className="text-sm font-medium text-purple-500">-{formatCurrency(emp.total_advance_amount)}</span>
                        : <span className="text-xs text-[var(--color-text-secondary)]">—</span>}
                </td>
                {/* Net Payable */}
                <td className="px-4 py-4 text-center">
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-2 border border-green-200">
                        <div className="text-sm font-bold text-green-700">{formatCurrency(netPayable)}</div>
                    </div>
                </td>
                {/* Total Paid */}
                <td className="px-4 py-4 text-center">
                    {(isPaid || isPartial)
                        ? <div className="bg-primary-50 rounded-lg p-2 border border-primary-200">
                            <div className="text-sm font-bold text-primary-700">{formatCurrency(totalPaid)}</div>
                        </div>
                        : <span className="text-xs text-[var(--color-text-secondary)]">—</span>}
                </td>
                {/* Payment Status */}
                <td className="px-4 py-4 text-center">
                    <PaymentBadge label={emp.payment_status_label} />
                </td>
                {/* Expand toggle */}
                <td className="px-4 py-4 text-center">
                    {hasExtras && (
                        <button onClick={() => setExpanded(v => !v)}
                            className="p-1.5 rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors text-[var(--color-text-secondary)]">
                            <ChevronRight className={`h-4 w-4 transition-transform ${expanded ? 'rotate-90' : ''}`} />
                        </button>
                    )}
                </td>
            </tr>

            {/* Expanded breakdown */}
            {expanded && (
                <tr className="bg-[var(--color-bg-primary)]">
                    <td colSpan={12} className="px-6 py-4 border-b border-[var(--color-border-primary)]">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                            {/* Allowances */}
                            {allowances.length > 0 && (
                                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Plus className="h-4 w-4 text-green-600" />
                                        <h4 className="text-sm font-semibold text-green-700">Allowances</h4>
                                        <span className="ml-auto text-sm font-bold text-green-700">+{formatCurrency(emp.total_allowance_amount)}</span>
                                    </div>
                                    <div className="space-y-2">
                                        {allowances.map((a, i) => (
                                            <div key={i} className="flex justify-between text-xs">
                                                <span className="text-green-700">{a.allowance_name}</span>
                                                <span className="font-medium text-green-700">{formatCurrency(a.allowance_amount)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Deductions */}
                            {deductions.length > 0 && (
                                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Minus className="h-4 w-4 text-red-600" />
                                        <h4 className="text-sm font-semibold text-red-700">Deductions</h4>
                                        <span className="ml-auto text-sm font-bold text-red-700">-{formatCurrency(emp.total_deduction_amount)}</span>
                                    </div>
                                    <div className="space-y-2">
                                        {deductions.map((d, i) => (
                                            <div key={i} className="flex justify-between text-xs">
                                                <span className="text-red-700">{d.deduction_name}</span>
                                                <span className="font-medium text-red-700">-{formatCurrency(d.deduction_amount)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Holidays */}
                            {holidays.length > 0 && (
                                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Gift className="h-4 w-4 text-purple-600" />
                                        <h4 className="text-sm font-semibold text-purple-700">Holidays</h4>
                                        <span className="ml-auto text-sm font-bold text-purple-700">+{formatCurrency(emp.total_holiday_amount)}</span>
                                    </div>
                                    <div className="space-y-2">
                                        {holidays.map((h, i) => (
                                            <div key={i} className="flex justify-between text-xs">
                                                <span className="text-purple-700">{h.holiday_name || 'Holiday'}</span>
                                                <span className="font-medium text-purple-700">{formatCurrency(h.holiday_amount)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Loans */}
                            {loans.length > 0 && (
                                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                                    <div className="flex items-center gap-2 mb-3">
                                        <CreditCard className="h-4 w-4 text-orange-600" />
                                        <h4 className="text-sm font-semibold text-orange-700">Loan Deductions</h4>
                                        <span className="ml-auto text-sm font-bold text-orange-700">-{formatCurrency(emp.total_loan_amount)}</span>
                                    </div>
                                    <div className="space-y-2">
                                        {loans.map((l, i) => (
                                            <div key={i} className="flex justify-between text-xs">
                                                <span className="text-orange-700">
                                                    Loan #{l.loan_id}
                                                    {l.loan_priority_name ? ` (${l.loan_priority_name})` : ''}
                                                    {l.loan_payment_date ? ` – ${l.loan_payment_date}` : ''}
                                                </span>
                                                <span className="font-medium text-orange-700">-{formatCurrency(l.installment_amount)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Advances */}
                            {advances.length > 0 && (
                                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Wallet className="h-4 w-4 text-yellow-600" />
                                        <h4 className="text-sm font-semibold text-yellow-700">Advance Deductions</h4>
                                        <span className="ml-auto text-sm font-bold text-yellow-700">-{formatCurrency(emp.total_advance_amount)}</span>
                                    </div>
                                    <div className="space-y-2">
                                        {advances.map((a, i) => (
                                            <div key={i} className="flex justify-between text-xs">
                                                <span className="text-yellow-700">{a.advance_name || `Advance #${a.advance_id}`}</span>
                                                <span className="font-medium text-yellow-700">-{formatCurrency(a.advance_amount || a.installment_amount)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Payments made */}
                            {payments.length > 0 && (
                                <div className="bg-primary-50 rounded-lg p-4 border border-primary-200">
                                    <div className="flex items-center gap-2 mb-3">
                                        <CheckCircle className="h-4 w-4 text-primary-600" />
                                        <h4 className="text-sm font-semibold text-primary-700">Payments Made</h4>
                                        <span className="ml-auto text-sm font-bold text-primary-700">{formatCurrency(emp.total_paid)}</span>
                                    </div>
                                    <div className="space-y-2">
                                        {payments.map((p, i) => (
                                            <div key={i} className="flex justify-between text-xs">
                                                <span className="text-primary-700">
                                                    Mode: {p.payment_mode === '1' ? 'Cash' : p.payment_mode === '2' ? 'Bank Transfer' : p.payment_mode === '3' ? 'Cheque' : `Mode ${p.payment_mode}`}
                                                    {p.payment_date ? ` – ${new Date(p.payment_date).toLocaleDateString('en-IN')}` : ''}
                                                </span>
                                                <span className="font-medium text-primary-700">{formatCurrency(p.pay_salary)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Salary calculation summary strip */}
                        <div className="mt-4 bg-[var(--color-bg-secondary)] rounded-lg p-4 border border-[var(--color-border-primary)]">
                            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-[var(--color-text-secondary)]">
                                <span>Attendance Salary: <strong className="text-[var(--color-text-primary)]">{formatCurrency(emp.total_salary)}</strong></span>
                                {parseFloat(emp.total_allowance_amount) > 0 && <><span className="text-green-600">+</span><span className="text-green-600">Allowances: <strong>{formatCurrency(emp.total_allowance_amount)}</strong></span></>}
                                {parseFloat(emp.total_deduction_amount) > 0 && <><span className="text-red-500">−</span><span className="text-red-500">Deductions: <strong>{formatCurrency(emp.total_deduction_amount)}</strong></span></>}
                                {parseFloat(emp.total_loan_amount) > 0 && <><span className="text-orange-500">−</span><span className="text-orange-500">Loan: <strong>{formatCurrency(emp.total_loan_amount)}</strong></span></>}
                                {parseFloat(emp.total_advance_amount) > 0 && <><span className="text-yellow-600">−</span><span className="text-yellow-600">Advance: <strong>{formatCurrency(emp.total_advance_amount)}</strong></span></>}
                                {parseFloat(emp.total_holiday_amount) > 0 && <><span className="text-purple-600">+</span><span className="text-purple-600">Holiday: <strong>{formatCurrency(emp.total_holiday_amount)}</strong></span></>}
                                <span className="ml-auto text-base font-bold text-green-700">= Net Payable: {formatCurrency(emp.net_payable)}</span>
                            </div>
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
};

const PayMonthlySalaryReport = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const currentDate = new Date();
    const prevDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const defaultMonthYear = `${prevDate.getFullYear()}-${String(
        prevDate.getMonth() + 1
    ).padStart(2, '0')}`;

    const getMonthYearDisplay = (monthYear) => {
        if (!monthYear) return '';
        const date = new Date(monthYear + '-01');
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    const [filters, setFilters] = useState({
        branch_id: '', department_id: '', designation_id: '', employee_id: '', month_year: defaultMonthYear
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

    const [reportData, setReportData] = useState(null);     // data array
    const [apiSummary, setApiSummary] = useState(null);     // summary object
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

    const handleGenerateReport = async (isAuto = false, customFilters = null) => {
        const activeFilters = customFilters || filters;
        if (!activeFilters.month_year) {
            if (!isAuto) showToast('Please select a month and year', 'error');
            return;
        }
        try {
            setLoading(true); setError('');
            const formData = new FormData();
            formData.append('month_year', activeFilters.month_year);
            if (activeFilters.branch_id) formData.append('branch_id', activeFilters.branch_id);
            if (activeFilters.department_id) formData.append('department_id', activeFilters.department_id);
            if (activeFilters.designation_id) formData.append('designation_id', activeFilters.designation_id);
            if (activeFilters.employee_id) formData.append('employee_id', activeFilters.employee_id);
            const response = await api.post('pay_monthly_salary_report_list', formData);
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

    const resetFilters = () => {
        const defaultFilters = { branch_id: '', department_id: '', designation_id: '', employee_id: '', month_year: defaultMonthYear };
        setFilters(defaultFilters);
        setError(''); setCurrentPage(1);
        showToast('Filters reset successfully', 'success');
        handleGenerateReport(true, defaultFilters);
    };

    const totalPages = Math.ceil((reportData?.length || 0) / itemsPerPage);
    const currentItems = reportData?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage) || [];
    useEffect(() => { setCurrentPage(1); }, [reportData]);

    const handleExportPDF = async () => {
        try {
            const companyName = user?.company_name || user?.company || user?.full_name || 'Your Company Name';
            await exportPaySalaryToPDF(reportData, filters, companyName);
            showToast('PDF exported successfully', 'success');
        } catch (e) { showToast(e.message || 'Export failed', 'error'); }
        setExportDropdown(false);
    };

    const handleExportExcel = async () => {
        try {
            const companyName = user?.company_name || user?.company || user?.full_name || 'Your Company Name';
            await exportPaySalaryToExcel(reportData, filters, apiSummary, 'Paid_Salary_Report', companyName);
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
                                    <h1 className="text-2xl font-bold text-[var(--color-text-white)]">Paid Salary Report {filters.month_year && `- ${getMonthYearDisplay(filters.month_year)}`}</h1>
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
                                                <button onClick={handleExportExcel}
                                                    className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-[var(--color-bg-hover)] transition-colors text-[var(--color-text-primary)]">
                                                    <FileSpreadsheet className="lucide lucide-file-spreadsheet h-4 w-4 text-[var(--color-success)]
" /> Export to Excel
                                                </button>
                                                <button onClick={handleExportPDF} className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-[var(--color-bg-hover)] transition-colors text-[var(--color-text-primary)]">
                                                    <FileDown className="
lucide lucide-file-down h-4 w-4 text-[var(--color-error)]" /> Export to PDF
                                                </button>
                                            </div>
                                        </>, document.body
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Summary from API */}
                {apiSummary && (
                    <div className="bg-[var(--color-bg-secondary)] rounded-2xl shadow-sm border border-[var(--color-border-primary)] mb-5 shrink-0 overflow-hidden">
                        <div className="grid grid-cols-4 lg:grid-cols-8 divide-x divide-[var(--color-border-primary)]">
                            {[
                                { label: 'Total Employees', value: apiSummary.total_employees, icon: Users, iconBg: 'bg-purple-100', iconColor: 'text-[var(--color-primary-dark)]', valueColor: 'text-[var(--color-primary-dark)]' },
                                { label: 'Grand Total Salary', value: formatCurrency(apiSummary.grand_total_salary), icon: IndianRupee, iconBg: 'bg-slate-100', iconColor: 'text-slate-600', valueColor: 'text-[var(--color-text-primary)]' },
                                { label: 'Total Allowances', value: formatCurrency(apiSummary.grand_total_allowance), icon: TrendingUp, iconBg: 'bg-green-100', iconColor: 'text-green-600', valueColor: 'text-green-700' },
                                { label: 'Total Deductions', value: formatCurrency(apiSummary.grand_total_deduction), icon: Minus, iconBg: 'bg-red-100', iconColor: 'text-red-500', valueColor: 'text-red-600' },
                                { label: 'Total Loans', value: formatCurrency(apiSummary.grand_total_loan), icon: CreditCard, iconBg: 'bg-orange-100', iconColor: 'text-orange-500', valueColor: 'text-orange-600' },
                                { label: 'Total Advance', value: formatCurrency(apiSummary.grand_total_advance), icon: Wallet, iconBg: 'bg-yellow-100', iconColor: 'text-yellow-600', valueColor: 'text-yellow-700' },
                                { label: 'Grand Net Payable', value: formatCurrency(apiSummary.grand_net_payable), icon: CheckCircle, iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', valueColor: 'text-emerald-700' },
                                { label: 'Grand Total Paid', value: formatCurrency(apiSummary.grand_total_paid), icon: CreditCard, iconBg: 'bg-blue-100', iconColor: 'text-blue-600', valueColor: 'text-blue-700' },
                            ].map(({ label, value, icon: Icon, iconBg, iconColor, valueColor }) => (
                                <div key={label} className="flex flex-col items-start gap-2 px-4 py-3">
                                    <div className={`p-1.5 rounded-lg ${iconBg}`}>
                                        <Icon className={`h-3.5 w-3.5 ${iconColor}`} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-medium text-[var(--color-text-secondary)] uppercase tracking-wide leading-tight mb-0.5">{label}</p>
                                        <p className={`text-sm font-bold ${valueColor} leading-tight`}>{value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Table */}
                {reportData && (
                    <div className="flex-1 flex flex-col min-h-0 bg-[var(--color-bg-secondary)] rounded-xl shadow-lg border border-[var(--color-border-primary)] overflow-hidden">
                        <div className="flex-1 overflow-auto custom-scrollbar">
                            <table className="w-full">
                                <thead className="sticky top-0 z-30">
                                    <tr className="bg-[var(--color-primary-dark)] border-b border-[var(--color-border-primary)]">
                                        <th className="px-4 py-4 text-center text-sm font-semibold text-white">Emp Code</th>
                                        <th className="px-4 py-4 text-left text-sm font-semibold text-white">Employee</th>
                                        <th className="px-4 py-4 text-center text-sm font-semibold text-white">Monthly Salary</th>
                                        <th className="px-4 py-4 text-center text-sm font-semibold text-white">Att. Salary</th>
                                        <th className="px-4 py-4 text-center text-sm font-semibold text-white">+ Allowance</th>
                                        <th className="px-4 py-4 text-center text-sm font-semibold text-white">− Deduction</th>
                                        <th className="px-4 py-4 text-center text-sm font-semibold text-white">− Loan</th>
                                        <th className="px-4 py-4 text-center text-sm font-semibold text-white">− Advance</th>
                                        <th className="px-4 py-4 text-center text-sm font-semibold text-white">Net Payable</th>
                                        <th className="px-4 py-4 text-center text-sm font-semibold text-white">Total Paid</th>
                                        <th className="px-4 py-4 text-center text-sm font-semibold text-white">Status</th>
                                        <th className="px-4 py-4 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--color-border-primary)]">
                                    {currentItems.map((emp, idx) => (
                                        <EmployeeRow
                                            key={emp.salary_id || emp.employee_id || idx}
                                            emp={emp}
                                            idx={(currentPage - 1) * itemsPerPage + idx + 1}
                                            formatCurrency={formatCurrency}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="border-t border-[var(--color-border-primary)] bg-[var(--color-bg-primary)]">
                            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} loading={loading} className='!py-5' />
                        </div>
                    </div>
                )}

                {/* States */}
                {!reportData && !loading && filters.month_year && (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 bg-[#FBF9FD] rounded-xl border border-[var(--color-border-primary)] shadow-sm">
                        <NoDataFound
                            title="No Paid Salary Data Found"
                            subtitle={`No salary payment records for ${getMonthYearDisplay(filters.month_year)}.`}
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
                            <p className="text-[var(--color-text-secondary)]">Please wait while we prepare your report...</p>
                        </div>
                    </div>
                )}
            </div>
            {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
        </div>
    );
};

export default PayMonthlySalaryReport;