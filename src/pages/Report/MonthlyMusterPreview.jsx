// src/pages/Reports/MonthlyMusterPreview.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosInstance';
import {
    ArrowLeft, Calendar, Users, Building, Award, User,
    Filter, RefreshCw, HelpCircle, Download,
    ChevronDown, FileDown, FileSpreadsheet, Play, X
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Toast } from '../../Components/ui/Toast';

// Exporters
import { exportMusterToPDF } from '../../utils/exportUtils/MonthlyMuster/pdfExport';
import { exportMusterToExcel } from '../../utils/exportUtils/MonthlyMuster/excelExport';
import CustomSelect from '../../Components/comman/CustomSelect';
import NoDataFound from '../../Components/comman/NoDataFound';

/** ------------------- Anchored positioning helpers ------------------- **/
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
/** -------------------------------------------------------------------- **/

/* ------------ utils ------------ */
const pad2 = (n) => (n < 10 ? `0${n}` : String(n));

/* Parse "YYYY-MM-DD" as LOCAL date to avoid off-by-one */
const localDateFromYmd = (ymd) => {
    if (!ymd) return null;
    const [y, m, d] = ymd.split('-').map(Number);
    return new Date(y, m - 1, d);
};

const getDaysInMonth = (yyyyMm) => {
    if (!yyyyMm) return 31;
    const [y, m] = yyyyMm.split('-').map(Number);
    return new Date(y, m, 0).getDate();
};

const getDayOfWeek = (yyyyMm, day) => {
    if (!yyyyMm) return -1;
    const [y, m] = yyyyMm.split('-').map(Number);
    return new Date(y, m - 1, day).getDay();
};

const DAY_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const CODE_LABELS = {
    P: 'Present',
    A: 'Absent',
    WO: 'Week Off',
    '½P': 'Half Present',
    H: 'Holiday',
    INC: 'Incomplete',
    OT: 'Overtime',
    L: 'Late Coming'
};

const CELL_DISPLAY_CODES = {
    P: 'P',
    A: 'A',
    L: 'L',
    WO: 'WO',
    '½P': '½P',
    H: 'H',
    INC: 'INC',
    OT: 'OT'
};

/* Legend order must stay fixed */
const TOTALS_ORDER = ['P', 'A', 'WO', '½P', 'H', 'INC', 'OT'];

/* Circular cell pill colors */
const CELL_CIRCLE = {
    P: 'bg-emerald-100  text-emerald-700',
    A: 'bg-red-100      text-red-500',
    WO: 'bg-slate-200    text-slate-500',
    '½P': 'bg-amber-100    text-amber-600',
    H: 'bg-violet-100   text-violet-600',
    INC: 'bg-orange-100   text-orange-600',
    OT: 'bg-purple-100   text-purple-600',
    L: 'bg-orange-50    text-orange-500',
};

/* Legend badge colors */
const CODE_COLORS = {
    P: 'bg-emerald-50  text-emerald-700 border-emerald-200',
    A: 'bg-red-50      text-red-500     border-red-200',
    WO: 'bg-slate-100   text-slate-500   border-slate-300',
    '½P': 'bg-amber-50    text-amber-600   border-amber-200',
    H: 'bg-violet-50   text-violet-600  border-violet-200',
    INC: 'bg-orange-50   text-orange-600  border-orange-200',
    OT: 'bg-purple-50   text-purple-600  border-purple-200',
    L: 'bg-orange-50   text-orange-500  border-orange-200',
};

/* Avatar palette */
const AVATAR_COLORS = [
    'bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-rose-500',
    'bg-amber-500', 'bg-cyan-500', 'bg-fuchsia-500', 'bg-teal-500',
    'bg-indigo-500', 'bg-orange-500',
];
const avatarColor = (name = '') => {
    const idx = (name.charCodeAt(0) || 0) % AVATAR_COLORS.length;
    return AVATAR_COLORS[idx];
};

/* Cell sizes */
const CELL_W = 44;
const CELL_H = 54;
const CODE_COL_W = 86;
const NAME_COL_W = 170;
const SUMMARY_COL_W = 220;

const normalizeCode = (rawShort, rawStatus) => {
    let s = (rawShort || '').toString().trim().toUpperCase();
    if (s === '1/2P' || s === '1/2' || s === 'HALF' || s === 'HALF PRESENT' || s === 'HP') s = '½P';
    if (s === 'INC' || s === 'INCOMPLETE') s = 'INC';
    if (TOTALS_ORDER.includes(s) || s === 'L') return s;

    const status = (rawStatus || '').toLowerCase();
    if (status.includes('incomplete')) return 'INC';
    if (status.includes('week') && status.includes('off')) return 'WO';
    if (status.includes('half') && status.includes('present')) return '½P';
    if (status.includes('present')) return 'P';
    if (status.includes('absent')) return 'A';
    if (status.includes('holiday')) return 'H';
    if (status === 'late') return 'L';
    return '';
};

/* Human labels used in export headers/footers */
const getFilterLabels = (filters, branches, departments, designations, employees) => {
    const labels = {};
    if (filters.branch_id) {
        const b = branches.find(x => String(x.id) === String(filters.branch_id));
        labels.branch = b?.name || '';
    }
    if (filters.department_id) {
        const d = departments.find(x => String(x.id) === String(filters.department_id));
        labels.department = d?.name || '';
    }
    if (filters.designation_id) {
        const d = designations.find(x => String(x.id) === String(filters.designation_id));
        labels.designation = d?.name || '';
    }
    if (filters.employee_id) {
        const e = employees.find(x => String(x.id) === String(filters.employee_id));
        labels.employee = e?.name || '';
    }
    return labels;
};

const MonthlyMusterPreview = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    /* Filters */
    const [filters, setFilters] = useState({
        branch_id: '',
        department_id: '',
        designation_id: '',
        employee_id: '',
        month_year: new Date().toISOString().slice(0, 7),
    });

    const [filterDropdown, setFilterDropdown] = useState(false);
    const filterBtnRef = useRef(null);
    const filterPos = useAnchoredPosition(filterBtnRef, filterDropdown, {
        placement: 'bottom-end',
        offset: 10,
        minWidth: 420
    });

    // Export dropdown (anchored)
    const [exportDropdown, setExportDropdown] = useState(false);
    const exportBtnRef = useRef(null);
    const exportPos = useAnchoredPosition(exportBtnRef, exportDropdown, {
        placement: 'bottom-end',
        offset: 10,
        minWidth: 192
    });

    // Toast
    const [toast, setToast] = useState(null);
    const showToast = (message, type) => setToast({ message, type });
    const closeToast = () => setToast(null);

    /* Dropdowns */
    const [branches, setBranches] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [designations, setDesignations] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [dropdownLoading, setDropdownLoading] = useState(false);

    /* Data */
    const [loading, setLoading] = useState(false);
    const [rows, setRows] = useState([]); // raw API rows
    const [error, setError] = useState('');
    const [hasGenerated, setHasGenerated] = useState(false); // Track if data has been generated

    const containerRef = useRef(null);

    const daysInMonth = useMemo(() => getDaysInMonth(filters.month_year), [filters.month_year]);

    /* Day meta with weekend styling */
    const dayMeta = useMemo(() => {
        if (!filters.month_year) return [];
        return Array.from({ length: daysInMonth }, (_, i) => {
            const d = i + 1;
            const dow = getDayOfWeek(filters.month_year, d);
            return { day: d, dow, isSun: dow === 0, isSat: dow === 6, isWeekend: dow === 0 || dow === 6 };
        });
    }, [filters.month_year, daysInMonth]);

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

    /* Dropdown data */
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
                    name: `${emp.full_name}`,
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

    useEffect(() => {
        if (user?.user_id) {
            handleGenerateReport(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.user_id]);

    /* API */
    const fetchReportData = useCallback(async () => {
        if (!user?.user_id) throw new Error('User ID is required');
        if (!filters.month_year) throw new Error('Please select Month & Year');

        const form = new FormData();
        form.append('month_year', filters.month_year);
        if (filters.branch_id) form.append('branch_id', filters.branch_id);
        if (filters.department_id) form.append('department_id', filters.department_id);
        if (filters.designation_id) form.append('designation_id', filters.designation_id);
        if (filters.employee_id) form.append('employee_id', filters.employee_id);

        const res = await api.post('monthly_attendance_report_list', form);
        if (res.data?.success && Array.isArray(res.data.data)) return res.data.data;
        throw new Error(res.data?.message || 'Failed to fetch report data');
    }, [user?.user_id, filters]);

    // Generate button handler - replaces automatic loading
    const handleGenerateReport = async (isAuto = false) => {
        try {
            setLoading(true);
            setError('');
            const data = await fetchReportData();
            setRows(data || []);
            setHasGenerated(true);
            if (!isAuto) {
                showToast('Report generated successfully!', 'success');
            }
            // Always start from day 1
            if (containerRef.current) containerRef.current.scrollLeft = 0;
        } catch (e) {
            console.error(e);
            setError(e.message || 'Failed to load data');
            if (!isAuto) {
                showToast(e.message || 'Failed to load data', 'error');
            }
            setRows([]);
        } finally {
            setLoading(false);
        }
    };

    const gridData = useMemo(() => {
        if (!rows?.length) return [];
        const byEmp = new Map();

        rows.forEach(r => {
            const key = `${r.employee_code}||${r.employee_name}`;
            if (!byEmp.has(key)) {
                byEmp.set(key, {
                    employee_code: r.employee_code,
                    employee_name: r.employee_name,
                    dayCodes: Array.from({ length: daysInMonth }, () => ''),
                    totals: TOTALS_ORDER.reduce((acc, c) => (acc[c] = 0, acc), {}),
                });
            }
            const obj = byEmp.get(key);
            const d = localDateFromYmd(r.date);
            if (!d || isNaN(d)) return;

            const day = d.getDate();
            const c = normalizeCode(r.short_status, r.status);
            if (day >= 1 && day <= daysInMonth && c) {
                obj.dayCodes[day - 1] = c;
                if (c in obj.totals) obj.totals[c] += 1;
            }
        });

        return Array.from(byEmp.values());
    }, [rows, daysInMonth]);

    const gridTemplate = useMemo(() => {
        return `${CODE_COL_W}px ${NAME_COL_W}px repeat(${daysInMonth}, ${CELL_W}px) ${SUMMARY_COL_W}px`;
    }, [daysInMonth]);

    const minInnerWidth = CODE_COL_W + NAME_COL_W + daysInMonth * CELL_W + SUMMARY_COL_W;

    /* Legend always shows full set (report order) */
    const legendCodes = TOTALS_ORDER;

    /* Filter change */
    const handleFilterChange = (key, value) => {
        setError('');
        setFilters(prev => {
            const next = { ...prev, [key]: value };
            if (key === 'branch_id') { next.department_id = ''; next.designation_id = ''; next.employee_id = ''; }
            else if (key === 'department_id') { next.designation_id = ''; next.employee_id = ''; }
            else if (key === 'designation_id') { next.employee_id = ''; }
            return next;
        });
    };

    const resetFilters = () => {
        setFilters({
            branch_id: '',
            department_id: '',
            designation_id: '',
            employee_id: '',
            month_year: new Date().toISOString().slice(0, 7),
        });
        setRows([]);
        setError('');
        setHasGenerated(false);
    };

    const formatMonthYear = (monthYear) => {
        if (!monthYear) return '--';
        const [year, month] = monthYear.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    /* Export handlers */
    const handleExportToPDF = async () => {
        try {
            if (!gridData?.length) {
                showToast('No data available to export', 'error');
                return;
            }
            const niceMonth = formatMonthYear(filters.month_year);
            const companyName = user?.company_name || user?.company || user?.full_name || 'Your Company Name';
            const filterLabels = getFilterLabels(filters, branches, departments, designations, employees);

            const payload = gridData.map((emp, idx) => ({
                sno: idx + 1,
                employee_code: emp.employee_code,
                employee_name: emp.employee_name,
                dayCodes: emp.dayCodes,
                totals: emp.totals
            }));

            await exportMusterToPDF({
                rows: payload,
                monthYear: filters.month_year,
                monthLabel: niceMonth,
                companyName,
                dayMeta,
                filterLabels,
                fileName: `monthly_attendance_muster_${niceMonth.replace(/\s+/g, '_')}`
            });

            showToast('PDF exported successfully!', 'success');
            setExportDropdown(false);
        } catch (err) {
            showToast(`Failed to export PDF: ${err.message || err}`, 'error');
            setExportDropdown(false);
        }
    };

    const handleExportToExcel = async () => {
        try {
            if (!gridData?.length) {
                showToast('No data available to export', 'error');
                return;
            }
            const niceMonth = formatMonthYear(filters.month_year);
            const filterLabels = getFilterLabels(filters, branches, departments, designations, employees);
            const companyName = user?.company_name || user?.company || user?.full_name || 'Your Company Name';

            const payload = gridData.map((emp, idx) => ({
                sno: idx + 1,
                employee_code: emp.employee_code,
                employee_name: emp.employee_name,
                dayCodes: emp.dayCodes,
                totals: emp.totals
            }));

            await exportMusterToExcel({
                rows: payload,
                monthYear: filters.month_year,
                monthLabel: niceMonth,
                companyName,
                dayMeta,
                filterLabels,
                fileName: `monthly_attendance_muster_${niceMonth.replace(/\s+/g, '_')}`
            });

            showToast('Excel exported successfully!', 'success');
            setExportDropdown(false);
        } catch (err) {
            showToast(`Failed to export Excel: ${err.message || err}`, 'error');
            setExportDropdown(false);
        }
    };

    return (
        <div className="h-[calc(100vh-64px)] bg-[var(--color-bg-primary)] flex flex-col">
            <div className="flex-1 p-8 mx-auto w-full flex flex-col min-h-0">
                {/* Header card */}
                <div className="bg-[var(--color-bg-secondary)] rounded-2xl shadow-xl mb-8 overflow-hidden">
                    <div className="bg-gradient-to-r from-[var(--color-primary-dark)] to-[var(--color-primary-darker)] p-6">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => navigate('/reports')}
                                    className="flex items-center justify-center text-[var(--color-text-white)] bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-colors"
                                >
                                    <ArrowLeft size={18} />
                                </button>
                                <h1 className="text-2xl font-bold text-[var(--color-text-white)]">
                                    Monthly Attendance Muster  {filters.month_year && `- ${formatMonthYear(filters.month_year)}`}
                                </h1>
                            </div>

                            <div className="flex items-center gap-3 flex-wrap">
                                {/* Filter button */}
                                <div className="relative">
                                    <button
                                        ref={filterBtnRef}
                                        onClick={() => setFilterDropdown((v) => !v)}
                                        className="flex items-center gap-2 bg-[var(--color-bg-secondary)] text-[var(--color-primary-dark)] hover:bg-[var(--color-bg-primary)] px-4 py-2 rounded-lg font-medium transition-colors shadow-sm text-[14px]"
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

                                {/* Export button */}
                                <div className="relative">
                                    <button
                                        ref={exportBtnRef}
                                        onClick={() => setExportDropdown((v) => !v)}
                                        className="flex items-center gap-2 bg-[var(--color-bg-secondary)] text-[var(--color-primary-dark)] hover:bg-[var(--color-bg-primary)] px-4 py-2 rounded-lg font-medium transition-colors shadow-sm text-[14px]"
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
                                                        onClick={handleExportToExcel}
                                                        className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-[var(--color-bg-hover)] transition-colors text-[var(--color-text-secondary)]"
                                                    >
                                                        <FileSpreadsheet className="h-4 w-4 text-[var(--color-success)]" />
                                                        Export to Excel
                                                    </button>
                                                    <button
                                                        onClick={handleExportToPDF}
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
                </div>

                {/* Error Display */}
                {error && (
                    <div className="bg-[var(--color-error-light)] border border-[var(--color-error-lighter)] rounded-lg p-4 mb-6">
                        <div className="flex items-center gap-2 text-[var(--color-error-dark)]">
                            <HelpCircle size={16} />
                            <span className="font-medium">Error:</span>
                            <span>{error}</span>
                        </div>
                    </div>
                )}



                {/* Legend + Grid */}
                <div className="flex-1 flex flex-col min-h-0 bg-[var(--color-bg-secondary)] rounded-xl shadow-sm border border-[var(--color-primary-dark)] overflow-hidden">
                    {/* Legend bar */}
                    {hasGenerated && (
                        <div className="px-6 py-2 border-b border-[var(--color-primary-light)] bg-[var(--color-primary-lighter)]">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3">
                                <div className="flex items-center gap-3 flex-wrap">
                                    <div className="flex flex-wrap gap-1.5 sm:ml-auto">
                                        {[...TOTALS_ORDER].map((c) => (
                                            <span key={c}
                                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${CODE_COLORS[c] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                                                {c === '½P' ? '½P' : c}&nbsp;
                                                <span className="font-normal opacity-70">{CODE_LABELS[c]}</span>
                                            </span>
                                        ))}
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-slate-100 text-slate-500 border-slate-300">
                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                            Sat
                                        </span>
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-red-50 text-red-400 border-red-200">
                                            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                                            Sun
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Loading indicator (thin bar) */}
                    <div className="h-0.5 w-full bg-transparent">
                        {loading && (
                            <div className="h-full bg-[var(--color-primary)] animate-pulse w-full rounded-full" />
                        )}
                    </div>

                    {/* Data Grid Container */}
                    <div ref={containerRef} className="flex-1 overflow-auto bg-[#FBF9FD] flex">
                        {!hasGenerated && (
                            <div className="flex-1 flex items-center justify-center bg-[#FBF9FD] shadow-sm">
                                <NoDataFound
                                    title="Ready to Generate Report"
                                    subtitle="Select your filters and click 'Generate Report' to view muster data."
                                />
                            </div>
                        )}

                        {hasGenerated && gridData.length === 0 && !loading && (
                            <div className="flex-1 flex items-center justify-center bg-[#FBF9FD] rounded-xl shadow-sm">
                                <NoDataFound
                                    title="No attendance data found"
                                    subtitle="Try adjusting your filters or select a different month."
                                />
                            </div>
                        )}

                        {hasGenerated && gridData.length > 0 && (
                            <div style={{ minWidth: `${minInnerWidth}px` }}>
                                {/* Header row */}
                                <div
                                    className="sticky top-0 z-20 border-b border-slate-200"
                                    style={{ display: 'grid', gridTemplateColumns: gridTemplate, background: '#f8fafc' }}
                                >
                                    {/* Code */}
                                    <div
                                        className="sticky left-0 z-30 flex items-center px-3 border-r border-slate-200"
                                        style={{ width: `${CODE_COL_W}px`, height: 54, background: '#f8fafc', boxShadow: '2px 0 4px -2px rgba(0,0,0,0.06)' }}
                                    >
                                        <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Code</span>
                                    </div>
                                    {/* Employee */}
                                    <div
                                        className="sticky z-30 flex items-center px-3 border-r border-slate-200"
                                        style={{ left: `${CODE_COL_W}px`, width: `${NAME_COL_W}px`, height: 54, background: '#f8fafc', boxShadow: '2px 0 4px -2px rgba(0,0,0,0.06)' }}
                                    >
                                        <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Employee</span>
                                    </div>
                                    {/* Days */}
                                    {dayMeta.map(({ day, dow, isSun, isSat }) => (
                                        <div
                                            key={day}
                                            className={`flex flex-col items-center justify-center gap-0.5
                                                ${isSun ? 'bg-red-50' : isSat ? 'bg-blue-50' : 'bg-slate-50'}`}
                                            style={{ height: 54, width: CELL_W }}
                                        >
                                            <span className={`text-[9px] font-semibold leading-none
                                                ${isSun ? 'text-red-400' : isSat ? 'text-blue-400' : 'text-slate-400'}`}>
                                                {DAY_SHORT[dow]}
                                            </span>
                                            <span className={`text-[11px] font-extrabold leading-none
                                                ${isSun ? 'text-red-500' : isSat ? 'text-blue-500' : 'text-slate-600'}`}>
                                                {day}
                                            </span>
                                        </div>
                                    ))}

                                    {/* Summary header */}
                                    <div className="flex items-center px-3" style={{ height: 54, width: SUMMARY_COL_W, background: '#f8fafc' }}>
                                        <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Summary</span>
                                    </div>
                                </div>

                                {/* Data rows */}
                                {gridData.map((r, rowIndex) => {
                                    const rowBg = rowIndex % 2 === 0 ? '#ffffff' : '#f8fafc';
                                    return (
                                        <div
                                            key={`${r.employee_code}-${rowIndex}`}
                                            className="border-b border-slate-100 group hover:bg-violet-50/40 transition-colors"
                                            style={{ display: 'grid', gridTemplateColumns: gridTemplate, background: rowBg }}
                                        >
                                            {/* Employee Code */}
                                            <div
                                                className="sticky left-0 z-10 border-r border-slate-100 flex items-center px-3 transition-colors"
                                                style={{
                                                    width: `${CODE_COL_W}px`, height: `${CELL_H}px`,
                                                    background: rowBg,
                                                    boxShadow: '2px 0 4px -2px rgba(0,0,0,0.06)'
                                                }}
                                            >
                                                <span className="text-xs font-bold text-blue-500 tracking-wide truncate">
                                                    {r.employee_code}
                                                </span>
                                            </div>

                                            {/* Employee Name */}
                                            <div
                                                className="sticky z-10 border-r border-slate-100 flex items-center gap-2.5 px-3 transition-colors"
                                                style={{
                                                    left: `${CODE_COL_W}px`, width: `${NAME_COL_W}px`, height: `${CELL_H}px`,
                                                    background: rowBg,
                                                    boxShadow: '2px 0 4px -2px rgba(0,0,0,0.06)'
                                                }}
                                            >
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white font-extrabold text-xs shadow-sm ${avatarColor(r.employee_name)}`}>
                                                    {(r.employee_name || '?').slice(0, 2).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[13px] font-bold text-slate-700 truncate leading-tight">{r.employee_name}</p>
                                                    <p className="text-[10px] text-slate-400 font-medium">Employee</p>
                                                </div>
                                            </div>

                                            {/* Day cells */}
                                            {r.dayCodes.map((c, dayIndex) => {
                                                const { isSun, isSat } = dayMeta[dayIndex] || {};
                                                const circleColor = c ? (CELL_CIRCLE[c] || 'bg-gray-100 text-gray-500') : '';
                                                return (
                                                    <div
                                                        key={dayIndex}
                                                        className={`flex items-center justify-center
                                                            ${isSun ? 'bg-red-50/60' : isSat ? 'bg-blue-50/60' : ''}`}
                                                        style={{ height: `${CELL_H}px`, width: CELL_W }}
                                                    >
                                                        {c ? (
                                                            <div
                                                                title={CODE_LABELS[c] || c}
                                                                className={`w-8 h-8 rounded-full flex items-center justify-center text-[9px] font-extrabold leading-none shadow-sm ${circleColor}`}
                                                            >
                                                                {c === '½P' ? '½P' : c}
                                                            </div>
                                                        ) : (
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-light
                                                                ${isSun ? 'bg-red-50 text-red-200' : isSat ? 'bg-blue-50 text-blue-200' : 'text-slate-200'}`}>
                                                                –
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}

                                            {/* Summary column */}
                                            <div
                                                className="flex flex-wrap items-center gap-1 px-2 py-1 content-center"
                                                style={{ height: `${CELL_H}px`, width: SUMMARY_COL_W }}
                                            >
                                                {TOTALS_ORDER.filter(k => r.totals[k] > 0).map(k => {
                                                    const colorMap = {
                                                        P: 'bg-emerald-100 text-emerald-700 border-emerald-200',
                                                        A: 'bg-red-100 text-red-500 border-red-200',
                                                        WO: 'bg-slate-200 text-slate-500 border-slate-300',
                                                        '½P': 'bg-amber-100 text-amber-600 border-amber-200',
                                                        H: 'bg-violet-100 text-violet-600 border-violet-200',
                                                        INC: 'bg-orange-100 text-orange-600 border-orange-200',
                                                        OT: 'bg-purple-100 text-purple-600 border-purple-200',
                                                    };
                                                    return (
                                                        <span key={k}
                                                            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold border ${colorMap[k] || 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                                                            {k} <span className="font-extrabold">{Number.isInteger(r.totals[k]) ? r.totals[k] : r.totals[k].toFixed(1)}</span>
                                                        </span>
                                                    );
                                                })}
                                                {TOTALS_ORDER.every(k => r.totals[k] === 0) && (
                                                    <span className="text-slate-300 text-[9px] italic">No records</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Toast */}
            {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
        </div>
    );
};

export default MonthlyMusterPreview;