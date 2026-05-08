import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosInstance';
import {
    ArrowLeft, Filter, RefreshCw, Loader2, Calendar, Download, ChevronDown,
    FileDown, Users, FileSpreadsheet, IndianRupee, User, Building, Award,
    Play, CheckCircle, XCircle, Clock, AlertCircle, Wallet, CreditCard
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Pagination from '../../Components/Pagination';
import { Toast } from '../../Components/ui/Toast';
import { exportSalaryStatusToPDF } from '../../utils/exportUtils/salary/pdfExportSalaryGenerationStatus';
import { exportSalaryStatusToExcel } from '../../utils/exportUtils/salary/excelExportSalaryGenerationStatus';

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

    const [filters, setFilters] = useState({ branch_id: '', department_id: '', designation_id: '', employee_id: '', month_year: '' });
    const [branches, setBranches] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [designations, setDesignations] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [dropdownLoading, setDropdownLoading] = useState(false);
    const [loading, setLoading] = useState(false);

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
            form.append('user_id', user.user_id);
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
            form.append('user_id', user.user_id);
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

    const handleGenerateReport = async () => {
        if (!filters.month_year) { showToast('Please select a month and year', 'error'); return; }
        try {
            setLoading(true); setError('');
            const formData = new FormData();
            formData.append('user_id', user.user_id);
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
                showToast('Report generated successfully', 'success');
            } else throw new Error(response.data?.message || 'Failed to generate report');
        } catch (err) {
            const msg = err.message || 'Failed to generate report';
            setError(msg); showToast(msg, 'error');
        } finally { setLoading(false); }
    };

    const handleFilterChange = (key, value) => {
        setReportData(null); setApiSummary(null); setError('');
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
            await exportSalaryStatusToPDF(reportData, filters, apiSummary);
            showToast('PDF exported successfully', 'success');
        } catch (e) { showToast(e.message || 'Export failed', 'error'); }
        setExportDropdown(false);
    };

    const handleExportExcel = () => {
        try {
            exportSalaryStatusToExcel(reportData, filters, apiSummary);
            showToast('Excel exported successfully', 'success');
        } catch (e) { showToast(e.message || 'Export failed', 'error'); }
        setExportDropdown(false);
    };

    return (
        <div className="min-h-screen bg-[var(--color-bg-primary)]">
            <div className="p-8  mx-auto">
                {/* Header */}
                <div className="bg-[var(--color-bg-secondary)] rounded-2xl shadow-xl mb-8 overflow-hidden">
                    <div className="bg-gradient-to-r from-[var(--color-primary-dark)] to-[var(--color-primary-darker)] p-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button onClick={() => navigate('/reports')} className="flex items-center gap-2 text-[var(--color-text-white)] transition-colors bg-[var(--color-bg-secondary-20)] hover:bg-[var(--color-bg-secondary-30)] px-4 py-2 rounded-lg backdrop-blur-sm">
                                    <ArrowLeft size={18} /> Back
                                </button>
                                <div>
                                    <h1 className="text-2xl font-bold text-[var(--color-text-white)]">Salary Generation Status</h1>
                                    <p className="text-sm text-white/70 mt-0.5">Generation & payment overview per employee</p>
                                </div>
                            </div>
                            <div className="relative">
                                <button ref={exportBtnRef} onClick={() => setExportDropdown(v => !v)} disabled={!reportData || reportData.length === 0}
                                    className="flex items-center gap-2 bg-[var(--color-bg-secondary)] text-[var(--color-primary-dark)] hover:bg-[var(--color-bg-primary)] px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
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

                {/* Filters */}
                <div className="bg-[var(--color-bg-secondary)] rounded-xl shadow-sm border border-[var(--color-border-primary)] p-5 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-[var(--color-icon-primary-bg)] rounded-lg"><Filter className="h-5 w-5 text-[var(--color-primary)]" /></div>
                            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Filters</h2>
                        </div>
                        <button onClick={resetFilters} className="flex items-center gap-2 px-4 py-2 bg-[var(--color-bg-gray-light)] text-[var(--color-text-secondary)] rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors duration-200">
                            <RefreshCw className="h-4 w-4" /> Reset
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        <div className="flex flex-col">
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
                        <div className="flex flex-col">
                            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2"><Building className="inline h-4 w-4 mr-1" />Branch</label>
                            <select value={filters.branch_id} onChange={e => handleFilterChange('branch_id', e.target.value)} disabled={dropdownLoading}
                                className="w-full px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border-secondary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-border-focus)] focus:border-transparent text-[var(--color-text-primary)]">
                                <option value="">All Branches</option>
                                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                        </div>
                        <div className="flex flex-col">
                            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2"><Users className="inline h-4 w-4 mr-1" />Department</label>
                            <select value={filters.department_id} onChange={e => handleFilterChange('department_id', e.target.value)} disabled={dropdownLoading}
                                className="w-full px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border-secondary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-border-focus)] focus:border-transparent text-[var(--color-text-primary)]">
                                <option value="">All Departments</option>
                                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        </div>
                        <div className="flex flex-col">
                            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2"><Award className="inline h-4 w-4 mr-1" />Designation</label>
                            <select value={filters.designation_id} onChange={e => handleFilterChange('designation_id', e.target.value)} disabled={dropdownLoading}
                                className="w-full px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border-secondary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-border-focus)] focus:border-transparent text-[var(--color-text-primary)]">
                                <option value="">All Designations</option>
                                {designations.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        </div>
                        <div className="flex flex-col">
                            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2"><User className="inline h-4 w-4 mr-1" />Employee (optional)</label>
                            <select value={filters.employee_id} onChange={e => handleFilterChange('employee_id', e.target.value)} disabled={dropdownLoading}
                                className="w-full px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border-secondary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-border-focus)] focus:border-transparent text-[var(--color-text-primary)]">
                                <option value="">All Employees</option>
                                {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                            </select>
                        </div>
                        <div className="flex flex-col">
                            <label className="block text-sm font-medium text-transparent mb-2">Generate</label>
                            <button onClick={handleGenerateReport} disabled={loading || !filters.month_year}
                                className={`flex items-center justify-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors duration-200 ${loading || !filters.month_year ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] shadow-lg hover:shadow-xl'}`}>
                                {loading ? <><RefreshCw className="h-4 w-4 animate-spin" />Generating...</> : <><Play className="h-4 w-4" />Generate Report</>}
                            </button>
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
                    <div className="bg-[var(--color-bg-secondary)] rounded-xl shadow-lg border border-[var(--color-border-primary)] overflow-hidden">
                        <div className="px-6 py-5 border-b border-[var(--color-border-primary)] bg-gradient-to-r from-[var(--color-primary-dark)] to-[var(--color-primary-darker)]">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center">
                                    <div className="p-2 bg-[var(--color-bg-secondary-20)] rounded-lg mr-3"><IndianRupee className="h-6 w-6 text-white" /></div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">Salary Generation Status</h3>
                                        <p className="text-sm text-white/80">{getMonthYearDisplay(filters.month_year)}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm text-white/80">Total Records</div>
                                    <div className="text-2xl font-bold text-white">{reportData.length}</div>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-[var(--color-bg-primary)] border-b border-[var(--color-border-primary)]">
                                        <th className="px-4 py-4 text-left text-sm font-semibold text-[var(--color-text-primary)] w-8">#</th>
                                        <th className="px-4 py-4 text-left text-sm font-semibold text-[var(--color-text-primary)]">
                                            <div className="flex items-center gap-2"><User className="h-4 w-4" />Employee</div>
                                        </th>
                                        <th className="px-4 py-4 text-center text-sm font-semibold text-[var(--color-text-primary)]">Monthly Salary</th>
                                        <th className="px-4 py-4 text-center text-sm font-semibold text-[var(--color-text-primary)]">Final Salary</th>
                                        <th className="px-4 py-4 text-center text-sm font-semibold text-[var(--color-text-primary)]">Net Payable</th>
                                        <th className="px-4 py-4 text-center text-sm font-semibold text-[var(--color-text-primary)]">Total Paid</th>
                                        <th className="px-4 py-4 text-center text-sm font-semibold text-[var(--color-text-primary)]">Balance Due</th>
                                        <th className="px-4 py-4 text-center text-sm font-semibold text-[var(--color-text-primary)]">Generated At</th>
                                        <th className="px-4 py-4 text-center text-sm font-semibold text-[var(--color-text-primary)]">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--color-border-primary)]">
                                    {currentItems.map((emp, idx) => {
                                        const isPaid = String(emp.payment_status_label || '').toLowerCase() === 'paid';
                                        const isGenerated = String(emp.salary_generation_status || '').toLowerCase() === 'generated';
                                        const balanceDue = parseFloat(emp.balance_due || 0);

                                        return (
                                            <tr key={emp.employee_id || idx} className="bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-primary)] transition-colors">
                                                <td className="px-4 py-4 text-sm text-[var(--color-text-secondary)]">
                                                    {(currentPage - 1) * itemsPerPage + idx + 1}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="font-semibold text-sm text-[var(--color-text-primary)]">{emp.employee_name || '--'}</div>
                                                    <div className="text-xs text-[var(--color-text-secondary)] bg-[var(--color-bg-primary)] px-2 py-0.5 rounded mt-1 inline-block">{emp.employee_code || '--'}</div>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <span className="text-sm font-semibold text-[var(--color-primary-dark)]">{formatCurrency(emp.monthly_salary)}</span>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    {isGenerated
                                                        ? <span className="text-sm font-semibold text-[var(--color-text-primary)]">{formatCurrency(emp.final_salary)}</span>
                                                        : <span className="text-xs text-[var(--color-text-secondary)]">—</span>}
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    {isGenerated
                                                        ? <span className="text-sm font-bold text-green-600">{formatCurrency(emp.net_payable)}</span>
                                                        : <span className="text-xs text-[var(--color-text-secondary)]">—</span>}
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    {isPaid
                                                        ? <span className="text-sm font-bold text-primary-600">{formatCurrency(emp.total_paid)}</span>
                                                        : <span className="text-xs text-[var(--color-text-secondary)]">—</span>}
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    {isGenerated
                                                        ? <span className={`text-sm font-semibold ${balanceDue > 0 ? 'text-red-500' : 'text-green-600'}`}>
                                                            {balanceDue > 0 ? formatCurrency(balanceDue) : '✓ Cleared'}
                                                        </span>
                                                        : <span className="text-xs text-[var(--color-text-secondary)]">—</span>}
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <span className="text-xs text-[var(--color-text-secondary)]">
                                                        {emp.generated_at
                                                            ? new Date(emp.generated_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                                                            : '—'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <SalaryStatusBadge genStatus={emp.salary_generation_status} paymentLabel={emp.payment_status_label} />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="border-t border-[var(--color-border-primary)] bg-[var(--color-bg-primary)]">
                            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} loading={loading} />
                        </div>
                    </div>
                )}

                {/* States */}
                {!reportData && !loading && filters.month_year && (
                    <div className="bg-[var(--color-bg-secondary)] rounded-xl shadow-sm border border-[var(--color-border-primary)] p-12 text-center">
                        <div className="flex flex-col items-center">
                            <div className="p-3 bg-[var(--color-bg-hover)] rounded-full mb-4"><IndianRupee className="h-8 w-8 text-[var(--color-text-secondary)]" /></div>
                            <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">No Data Found</h3>
                            <p className="text-[var(--color-text-secondary)]">No salary data for {getMonthYearDisplay(filters.month_year)}.</p>
                        </div>
                    </div>
                )}
                {!reportData && !loading && !filters.month_year && (
                    <div className="bg-[var(--color-bg-secondary)] rounded-xl shadow-sm border border-[var(--color-border-primary)] p-12 text-center">
                        <div className="flex flex-col items-center">
                            <div className="p-3 bg-[var(--color-primary-lightest)] rounded-full mb-4"><Calendar className="h-8 w-8 text-[var(--color-primary-dark)]" /></div>
                            <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">Select Month to Generate Report</h3>
                            <p className="text-[var(--color-text-secondary)]">Choose a month above and click "Generate Report".</p>
                        </div>
                    </div>
                )}
                {loading && (
                    <div className="bg-[var(--color-bg-secondary)] rounded-xl shadow-sm border border-[var(--color-border-primary)] p-12 text-center">
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