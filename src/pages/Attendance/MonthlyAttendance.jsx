import React, { useCallback, useEffect, useMemo, useRef, useState, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosInstance';
import { Filter, Users, Calendar, Building, Award, RefreshCw, HelpCircle, ChevronDown, Search, X, CheckCircle, XCircle, Clock, AlertTriangle, Minus, Loader2 } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Toast } from '../../Components/ui/Toast';
import CustomDatePicker from '../../Components/comman/CustomDatePicker';
import CustomSelect from '../../Components/comman/CustomSelect';
import LoadingSpinner from '../../Components/Loader/LoadingSpinner';

/* ============ Anchored Position Utility ============ */
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
    const { placement = 'bottom-end', offset = 8, minWidth = 420 } = opts;
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

/* ============ Utils ============ */
const pad2 = (n) => (n < 10 ? `0${n}` : String(n));

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

/* Status codes */
const CODE_LABELS = {
    P: 'Present', A: 'Absent', WO: 'Week Off',
    '½P': 'Half Present', H: 'Holiday', INC: 'Incomplete', OT: 'Overtime', L: 'Late Coming',
};
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

/* Cell dimensions */
const CELL_W = 44;
const CELL_W_MOBILE = 36;
const CELL_H = 54;
const CODE_COL_W = 86;
const NAME_COL_W = 170;
const CODE_COL_W_MOBILE = 68;
const NAME_COL_W_MOBILE = 130;

const normalizeCode = (rawShort, rawStatus, isLate) => {
    const s = (rawShort || '').toString().trim().toUpperCase();
    if (s === 'P') return 'P'; if (s === 'A') return 'A';
    if (s === 'WO') return 'WO'; if (s === 'H') return 'H';
    if (s === 'L') return 'L';
    if (s === '½P' || s === '1/2P' || s === 'HP') return '½P';
    if (s === 'INC' || s === 'INCOMPLETE') return 'INC';
    if (s === 'OT') return 'OT';
    const st = (rawStatus || '').toLowerCase();
    if (st.includes('incomplete')) return 'INC';
    if (st.includes('week') && st.includes('off')) return 'WO';
    if (st.includes('half') && st.includes('present')) return '½P';
    if (st === 'late' || isLate) return 'L';
    if (st.includes('present')) return 'P';
    if (st.includes('absent')) return 'A';
    if (st.includes('holiday')) return 'H';
    return '';
};

/* ── Stat Card ── */
const StatCard = ({ label, value, color, icon: Icon, iconBg }) => (
    <div className="flex flex-col gap-1 px-5 py-4 flex-1 min-w-0">
        <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</span>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center ${iconBg}`}>
                <Icon size={13} className={color} />
            </span>
        </div>
        <span className={`text-3xl font-extrabold tracking-tight ${color}`}>{value}</span>
    </div>
);

/* ============ Active Filters Badge ============ */
const getActiveFiltersCount = (filters) => {
    let count = 0;
    if (filters.branch_id) count++;
    if (filters.department_id) count++;
    if (filters.designation_id) count++;
    return count;
};

/* ===================== MAIN COMPONENT ===================== */
const MonthlyAttendance = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const containerRef = useRef(null);
    const filterBtnRef = useRef(null);

    /* Responsive */
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    const cellWidth = isMobile ? CELL_W_MOBILE : CELL_W;
    const codeColW = isMobile ? CODE_COL_W_MOBILE : CODE_COL_W;
    const nameColW = isMobile ? NAME_COL_W_MOBILE : NAME_COL_W;

    const initialFilters = location.state?.filters || {
        branch_id: '', department_id: '', designation_id: '',
        employee_id: '', month_year: new Date().toISOString().slice(0, 7),
    };

    const [filters, setFilters] = useState(initialFilters);
    const [loading, setLoading] = useState(true);
    const [rows, setRows] = useState([]);
    const [error, setError] = useState('');
    const [branches, setBranches] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [designations, setDesignations] = useState([]);
    const [dropdownLoading, setDropdownLoading] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [toast, setToast] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    /* Anchored position for filter dropdown */
    const filterPos = useAnchoredPosition(filterBtnRef, showFilters, {
        placement: 'bottom-end',
        offset: 10,
        minWidth: 420
    });

    const activeFiltersCount = useMemo(() => getActiveFiltersCount(filters), [filters]);

    const daysInMonth = useMemo(() => getDaysInMonth(filters.month_year), [filters.month_year]);

    const dayMeta = useMemo(() =>
        Array.from({ length: daysInMonth }, (_, i) => {
            const d = i + 1;
            const dow = getDayOfWeek(filters.month_year, d);
            return { day: d, dow, isSun: dow === 0, isSat: dow === 6, isWeekend: dow === 0 || dow === 6 };
        })
        , [daysInMonth, filters.month_year]);

    const gridData = useMemo(() => {
        if (!rows?.length) return [];
        const byEmp = new Map();
        rows.forEach(r => {
            const key = `${r.employee_code}||${r.employee_name}`;
            if (!byEmp.has(key)) {
                byEmp.set(key, {
                    employee_code: r.employee_code,
                    employee_name: r.employee_name,
                    dayCells: Array.from({ length: daysInMonth }, () => null),
                    totals: TOTALS_ORDER.reduce((acc, c) => { acc[c] = 0; return acc; }, {}),
                    lateDays: 0, earlyDays: 0, overtimeDays: 0,
                });
            }
            const obj = byEmp.get(key);
            const d = localDateFromYmd(r.date);
            if (!d || isNaN(d)) return;
            const day = d.getDate();
            const c = normalizeCode(r.short_status, r.status, r.is_late);
            const late = r.is_late === true;
            const early = r.is_early_going === true;
            const parseMinutes = (str) => {
                if (!str) return 0;
                const h = str.match(/(\d+)h/); const m = str.match(/(\d+)m/);
                return (h ? +h[1] * 60 : 0) + (m ? +m[1] : 0);
            };
            const overtime = parseMinutes(r.overtime_hours) > 0;
            if (day >= 1 && day <= daysInMonth) {
                obj.dayCells[day - 1] = { code: c, late, early, overtime };
                if (c && c in obj.totals) obj.totals[c] += 1;
                if (late) obj.lateDays += 1;
                if (early) obj.earlyDays += 1;
                if (overtime) obj.overtimeDays += 1;
            }
        });
        return Array.from(byEmp.values());
    }, [rows, daysInMonth]);

    /* Filtered by search */
    const filteredData = useMemo(() => {
        if (!searchQuery.trim()) return gridData;
        const q = searchQuery.toLowerCase();
        return gridData.filter(r =>
            r.employee_name?.toLowerCase().includes(q) ||
            r.employee_code?.toLowerCase().includes(q)
        );
    }, [gridData, searchQuery]);

    const SUMMARY_COL_W = isMobile ? 160 : 220;

    const gridTemplate = useMemo(() => {
        return `${codeColW}px ${nameColW}px repeat(${daysInMonth}, ${cellWidth}px) ${SUMMARY_COL_W}px`;
    }, [daysInMonth, isMobile, cellWidth, codeColW, nameColW, SUMMARY_COL_W]);

    const minInnerWidth = codeColW + nameColW + daysInMonth * cellWidth + SUMMARY_COL_W;

    /* Summary stats */
    const summaryStats = useMemo(() => {
        const totals = TOTALS_ORDER.reduce((acc, c) => { acc[c] = 0; return acc; }, {});
        let late = 0, early = 0, ot = 0;
        gridData.forEach(r => {
            TOTALS_ORDER.forEach(c => { totals[c] += r.totals[c] || 0; });
            late += r.lateDays; early += r.earlyDays; ot += r.overtimeDays;
        });
        return { totals, late, early, ot };
    }, [gridData]);

    /* Attendance rate */
    const attendanceRate = useMemo(() => {
        const total = TOTALS_ORDER.reduce((s, c) => s + (summaryStats.totals[c] || 0), 0);
        const present = (summaryStats.totals['P'] || 0) + (summaryStats.totals['½P'] || 0) * 0.5;
        if (!total) return 0;
        return Math.round((present / total) * 100);
    }, [summaryStats]);

    /* ---------- Data fetching ---------- */
    const fetchDropdownData = useCallback(async () => {
        try {
            setDropdownLoading(true);
            if (!user?.user_id) return;
            const form = new FormData();
            const res = await api.post('employee_drop_down_list', form);
            if (res.data?.success && res.data.data) {
                const data = res.data.data;
                setBranches((data.branch_list || []).map(b => ({ id: b.branch_id, name: b.name })));
                setDepartments((data.department_list || []).map(d => ({ id: d.department_id, name: d.name })));
                setDesignations((data.designation_list || []).map(d => ({ id: d.designation_id, name: d.name })));
            }
        } catch (e) { console.error(e); } finally { setDropdownLoading(false); }
    }, [user?.user_id]);

    const fetchReportData = useCallback(async () => {
        if (!user?.user_id) throw new Error('User ID is required');
        if (!filters.month_year) throw new Error('Please select Month & Year');
        const form = new FormData();
        form.append('month_year', filters.month_year);
        if (filters.branch_id) form.append('branch_id', filters.branch_id);
        if (filters.department_id) form.append('department_id', filters.department_id);
        if (filters.designation_id) form.append('designation_id', filters.designation_id);
        const res = await api.post('monthly_attendance_report_list', form);
        if (res.data?.success && Array.isArray(res.data.data)) return res.data.data;
        throw new Error(res.data?.message || 'Failed to fetch report data');
    }, [user?.user_id, filters]);

    const debTimer = useRef(null);
    useEffect(() => {
        if (debTimer.current) clearTimeout(debTimer.current);
        debTimer.current = setTimeout(async () => {
            try {
                setLoading(true); setError('');
                const data = await fetchReportData();
                setRows(data || []);
            } catch (e) {
                setError(e.message || 'Failed to load data'); setRows([]);
            } finally {
                setLoading(false);
                if (containerRef.current) containerRef.current.scrollLeft = 0;
            }
        }, 300);
        return () => clearTimeout(debTimer.current);
    }, [fetchReportData]);

    useEffect(() => { fetchDropdownData(); }, [fetchDropdownData]);

    const handleFilterChange = (key, value) => {
        setRows([]); setError('');
        setFilters(prev => {
            const next = { ...prev, [key]: value };
            if (key === 'branch_id') { next.department_id = ''; next.designation_id = ''; next.employee_id = ''; }
            else if (key === 'department_id') { next.designation_id = ''; next.employee_id = ''; }
            else if (key === 'designation_id') { next.employee_id = ''; }
            return next;
        });
    };

    const resetFilters = () => {
        setFilters({ branch_id: '', department_id: '', designation_id: '', employee_id: '', month_year: new Date().toISOString().slice(0, 7) });
        setRows([]); setError('');
        setToast({ message: 'Filters reset successfully', type: 'success' });
    };

    const applyFilters = () => {
        /* Filters auto-apply via debounce; just close panel */
        setShowFilters(false);
    };

    const formatMonthYear = (my) => {
        if (!my) return '--';
        const [y, m] = my.split('-');
        return new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    const formatMonthYearShort = (my) => {
        if (!my) return '--';
        const [y, m] = my.split('-');
        return new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase();
    };

    /* Auto-close dropdown if anchor scrolled off-screen */
    useEffect(() => {
        if (showFilters && filterBtnRef.current) {
            const rect = filterBtnRef.current.getBoundingClientRect();
            const fullyOut =
                rect.bottom < 0 ||
                rect.top > window.innerHeight ||
                rect.right < 0 ||
                rect.left > window.innerWidth;
            if (fullyOut) setShowFilters(false);
        }
    }, [showFilters, filterPos]);


    if (loading && rows.length === 0) {
        return <LoadingSpinner />;
    }

    /* ===================== RENDER ===================== */
    return (
        <div className="h-100 bg-slate-50 pb-8" style={{ fontFamily: "'Inter', sans-serif" }}>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <div className="p-3 sm:p-6 mx-auto max-w-[1900px] space-y-4">

                {/* ══ HERO HEADER CARD ══ */}
                <div className="bg-[var(--color-primary-dark)]  rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-6 py-5">
                        {/* Left */}
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl  flex items-center justify-center  flex-shrink-0">
                                <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                    <rect x={3} y={4} width={18} height={18} rx={2} /><line x1={16} y1={2} x2={16} y2={6} /><line x1={8} y1={2} x2={8} y2={6} /><line x1={3} y1={10} x2={21} y2={10} />
                                </svg>
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                    <h1 className="text-base sm:text-2xl font-bold text-white">
                                        Monthly Attendance
                                    </h1>

                                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full uppercase tracking-widest">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        Live &middot; {formatMonthYearShort(filters.month_year)}
                                    </span>
                                </div>

                                <p className="text-xs text-white mt-0.5">
                                    {gridData.length} employee{gridData.length !== 1 ? 's' : ''} &middot; {daysInMonth} days &middot; tracked in real time
                                </p>
                            </div>
                        </div>

                        {/* Right: filter btn */}
                        <div className="flex items-center gap-3">
                            <button
                                ref={filterBtnRef}
                                onClick={() => setShowFilters(!showFilters)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all duration-200
                                    ${showFilters
                                        ? 'bg-white  text-[var(--color-primary-dark)] border-violet-600 shadow-lg'
                                        : 'bg-white  text-[var(--color-primary-dark)] border-slate-200 '
                                    }`}
                            >
                                <Filter size={14} />
                                Filters
                                {activeFiltersCount > 0 && (
                                    <span className="bg-[var(--color-primary-dark)] text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                                        {activeFiltersCount}
                                    </span>
                                )}
                                <ChevronDown size={13} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* ══ FILTER DROPDOWN (EmployeeDirectoryReport Style) ══ */}
                {showFilters &&
                    createPortal(
                        <>
                            {/* Backdrop */}
                            <div
                                className="fixed inset-0 z-[100] bg-black/40"
                                onClick={() => setShowFilters(false)}
                            />

                            {/* ── Desktop Anchored Dropdown ── */}
                            <div
                                className="hidden sm:block absolute z-[110] bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-secondary)] max-h-[80vh] overflow-visible flex flex-col"
                                style={{
                                    position: 'absolute',
                                    top: filterPos.ready ? filterPos.top : -9999,
                                    left: filterPos.ready ? Math.max(12, filterPos.left) : -9999,
                                    width: Math.max(420, filterPos.width),
                                    minWidth: 420
                                }}
                            >
                                {/* Header */}

                                <div className="flex items-center justify-between p-4 border-b border-[var(--color-border-secondary)]">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-[var(--color-primary-lightest)] rounded-lg">
                                            <Filter className="h-5 w-5 text-[var(--color-primary)]" />
                                        </div>
                                        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Filters</h2>
                                    </div>
                                    <button
                                        onClick={() => setShowFilters(false)}
                                        className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] p-1 rounded-lg hover:bg-[var(--color-bg-hover)]"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>

                                {/* Loading */}
                                {dropdownLoading && (
                                    <div className="flex items-center gap-2 p-4 text-[var(--color-text-secondary)] border-b border-[var(--color-border-secondary)]">
                                        <Loader2 size={14} className="animate-spin" />
                                        <span className="text-sm">Loading filter options...</span>
                                    </div>
                                )}

                                {/* Content */}
                                <div className="flex-1 p-4 w-full overflow-visible max-h-none">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {/* Month Year */}
                                        <div>
                                            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                                <Calendar size={14} className="inline mr-1" />
                                                Month & Year <span className="text-red-400">*</span>
                                            </label>
                                            <CustomDatePicker
                                                name="month_year"
                                                value={
                                                    filters.month_year
                                                        ? new Date(`${filters.month_year}-01`)
                                                        : null
                                                }
                                                onChange={(e) => {
                                                    const value = e?.target?.value || '';
                                                    if (!value) {
                                                        handleFilterChange('month_year', '');
                                                        return;
                                                    }
                                                    const [year, month] = value.split('-');
                                                    handleFilterChange('month_year', `${year}-${month}`);
                                                }}
                                                placeholder="Select month and year"
                                                maxDate={new Date()}
                                                clearable={true}
                                                showMonthYearPicker={true}
                                                showFullMonthYearPicker={true}
                                                showPopperArrow={false}
                                                className="w-full h-[40px]"
                                            />
                                        </div>

                                        {/* Branch */}
                                        <div>
                                            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                                <Building size={14} className="inline mr-1" />
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
                                        <div>
                                            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                                <Users size={14} className="inline mr-1" />
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
                                        <div>
                                            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                                <Award size={14} className="inline mr-1" />
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
                                    </div>
                                </div>

                                {/* Footer */}

                                <div className="flex flex-col sm:flex-row justify-end gap-2 p-4 border-t border-[var(--color-border-secondary)] rounded-b-2xl">
                                    <button
                                        onClick={resetFilters}
                                        className="flex items-center justify-center gap-2 px-4 py-2 bg-transparent text-[var(--color-primary)] border-2 hover:bg-[var(--color-primary-lightest)] border-[var(--color-primary)] rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors text-sm font-medium min-w-[100px]"
                                    >
                                        <RefreshCw size={14} />
                                        Reset
                                    </button>

                                    <button
                                        onClick={applyFilters}
                                        disabled={loading}
                                        className="w-auto sm:w-[140px] flex items-center justify-center gap-2 px-4 py-2 bg-[var(--color-primary-dark)] text-[var(--color-text-white)] rounded-lg hover:bg-[var(--color-primary-darker)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                                    >
                                        {loading ? <Loader2 size={14} className="animate-spin" /> : <Filter size={14} />}
                                        {loading ? 'Loading...' : 'Apply Filters'}
                                    </button>
                                </div>
                            </div>

                            {/* ── Mobile Sheet ── */}
                            <div className="sm:hidden fixed inset-0 z-[110] flex">
                                <div className="ml-auto h-full w-full bg-[var(--color-bg-secondary)] flex flex-col">
                                    {/* Mobile Header */}
                                    <div className="flex items-center justify-between p-4 border-b border-[var(--color-border-secondary)]">
                                        <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Filter Attendance</h3>
                                        <button
                                            onClick={() => setShowFilters(false)}
                                            className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] p-1 rounded-lg hover:bg-[var(--color-bg-hover)]"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>

                                    {/* Mobile Loading */}
                                    {dropdownLoading && (
                                        <div className="flex items-center gap-2 p-4 text-[var(--color-text-secondary)] border-b border-[var(--color-border-secondary)]">
                                            <Loader2 size={14} className="animate-spin" />
                                            <span className="text-sm">Loading filter options...</span>
                                        </div>
                                    )}

                                    {/* Mobile Content */}
                                    <div className="flex-1 overflow-y-auto p-4">
                                        <div className="grid grid-cols-1 gap-4">
                                            {/* Month Year */}
                                            <div>
                                                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                                    <Calendar size={14} className="inline mr-1" />
                                                    Month & Year <span className="text-red-400">*</span>
                                                </label>
                                                <CustomDatePicker
                                                    name="month_year"
                                                    value={
                                                        filters.month_year
                                                            ? new Date(`${filters.month_year}-01`)
                                                            : null
                                                    }
                                                    onChange={(e) => {
                                                        const value = e?.target?.value || '';
                                                        if (!value) {
                                                            handleFilterChange('month_year', '');
                                                            return;
                                                        }
                                                        const [year, month] = value.split('-');
                                                        handleFilterChange('month_year', `${year}-${month}`);
                                                    }}
                                                    placeholder="Select month and year"
                                                    maxDate={new Date()}
                                                    clearable={true}
                                                    showMonthYearPicker={true}
                                                    showFullMonthYearPicker={true}
                                                    showPopperArrow={false}
                                                    className="w-full h-[40px]"
                                                />
                                            </div>

                                            {/* Branch */}
                                            <div>
                                                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                                    <Building size={14} className="inline mr-1" />
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

                                            {/* Department */}
                                            <div>
                                                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                                    <Users size={14} className="inline mr-1" />
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

                                            {/* Designation */}
                                            <div>
                                                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                                    <Award size={14} className="inline mr-1" />
                                                    Designation
                                                </label>
                                                <select
                                                    value={filters.designation_id}
                                                    onChange={(e) => handleFilterChange('designation_id', e.target.value)}
                                                    className="w-full px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-dark)] focus:border-transparent text-[var(--color-text-primary)] text-sm"
                                                    disabled={dropdownLoading}
                                                >
                                                    <option value="">All Designations</option>
                                                    {designations.map((d) => (
                                                        <option key={d.id} value={d.id}>{d.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Mobile Footer */}
                                    <div className="flex flex-col gap-2 p-4 border-t border-[var(--color-border-secondary)] bg-[var(--color-bg-secondary)]">
                                        <button
                                            onClick={applyFilters}
                                            disabled={loading}
                                            className="w-auto sm:w-[160px] flex items-center justify-center gap-2 px-4 py-2 bg-[var(--color-primary-dark)] text-[var(--color-text-white)] rounded-lg hover:bg-[var(--color-primary-darker)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                                        >
                                            {loading ? <Loader2 size={14} className="animate-spin" /> : <Filter size={14} />}
                                            {loading ? 'Loading...' : 'Apply Filters'}
                                        </button>
                                        <button
                                            onClick={resetFilters}
                                            className="flex items-center justify-center gap-2 px-4 py-2 bg-[var(--color-bg-gray-light)] text-[var(--color-text-secondary)] rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors text-sm font-medium"
                                        >
                                            <RefreshCw size={14} />
                                            Reset
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </>,
                        document.body
                    )}

                {/* ══ ERROR ══ */}
                {error && (
                    <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
                        <HelpCircle size={15} className="flex-shrink-0" />
                        <span><b>Error:</b> {error}</span>
                    </div>
                )}

                {/* ══ MAIN GRID CARD ══ */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">

                    {/* Search + Legend toolbar */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 sm:px-5 py-3 border-b border-slate-100">
                        {/* Search */}
                        <div className="relative flex-shrink-0">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search employee or code..."
                                className="pl-8 pr-8 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent w-52 transition-all"
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                    <X size={13} />
                                </button>
                            )}
                        </div>

                        {/* Legend */}
                        <div className="flex flex-wrap items-center gap-1.5 sm:ml-auto">
                            {[...TOTALS_ORDER, 'L'].map(c => (
                                <span key={c}
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold border ${CODE_COLORS[c] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                                    {c === '½P' ? '½P' : c}&nbsp;
                                    <span className="font-normal opacity-70">{CODE_LABELS[c]}</span>
                                </span>
                            ))}
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold border bg-slate-100 text-slate-500 border-slate-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                Sat
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold border bg-red-50 text-red-400 border-red-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                                Sun
                            </span>
                        </div>
                    </div>

                    {/* Loading bar */}
                    {loading && (
                        <div className="h-0.5 bg-slate-100">
                            <div className="h-full bg-gradient-to-r from-violet-400 to-blue-400 animate-pulse w-2/3 rounded-full" />
                        </div>
                    )}

                    {/* ── Scrollable Grid ── */}
                    <div ref={containerRef} className="overflow-auto" style={{ maxHeight: '65vh' }}>
                        <div style={{ minWidth: `${minInnerWidth}px` }}>

                            {/* Header row */}
                            <div
                                className="sticky top-0 z-20 border-b border-slate-200"
                                style={{ display: 'grid', gridTemplateColumns: gridTemplate, background: '#f8fafc' }}
                            >
                                {/* Code */}
                                <div
                                    className="sticky left-0 z-30 flex items-center px-3 border-r border-slate-200"
                                    style={{ width: `${codeColW}px`, height: 54, background: '#f8fafc', boxShadow: '2px 0 4px -2px rgba(0,0,0,0.06)' }}
                                >
                                    <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Code</span>
                                </div>
                                {/* Employee */}
                                <div
                                    className="sticky z-30 flex items-center px-3 border-r border-slate-200"
                                    style={{ left: `${codeColW}px`, width: `${nameColW}px`, height: 54, background: '#f8fafc', boxShadow: '2px 0 4px -2px rgba(0,0,0,0.06)' }}
                                >
                                    <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Employee</span>
                                </div>
                                {/* Days */}
                                {dayMeta.map(({ day, dow, isSun, isSat }) => (
                                    <div
                                        key={day}
                                        className={`flex flex-col items-center justify-center gap-0.5
                                            ${isSun ? 'bg-red-50' : isSat ? 'bg-blue-50' : 'bg-slate-50'}`}
                                        style={{ height: 54, width: cellWidth }}
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

                            {/* Empty state */}
                            {filteredData.length === 0 && !loading && (
                                <div className="py-20 text-center">
                                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 mb-4">
                                        <Users size={28} className="text-slate-400" />
                                    </div>
                                    <p className="text-slate-600 font-semibold text-sm">No attendance data found</p>
                                    <p className="text-slate-400 text-xs mt-1">Try adjusting the filters or selecting a different month</p>
                                </div>
                            )}

                            {/* Data rows */}
                            {filteredData.map((r, rowIndex) => {
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
                                                width: `${codeColW}px`, height: `${CELL_H}px`,
                                                background: rowBg,
                                                boxShadow: '2px 0 4px -2px rgba(0,0,0,0.06)'
                                            }}
                                        >
                                            <span className="text-xs font-bold text-blue-500 hover:underline cursor-pointer tracking-wide truncate">
                                                {r.employee_code}
                                            </span>
                                        </div>

                                        {/* Employee Name */}
                                        <div
                                            className="sticky z-10 border-r border-slate-100 flex items-center gap-2.5 px-3 transition-colors"
                                            style={{
                                                left: `${codeColW}px`, width: `${nameColW}px`, height: `${CELL_H}px`,
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
                                        {r.dayCells.map((cell, dayIndex) => {
                                            const { isSun, isSat } = dayMeta[dayIndex] || {};
                                            const circleColor = cell?.code ? (CELL_CIRCLE[cell.code] || 'bg-gray-100 text-gray-500') : '';
                                            return (
                                                <div
                                                    key={dayIndex}
                                                    className={`flex items-center justify-center
                                                    ${isSun ? 'bg-red-50/60' : isSat ? 'bg-blue-50/60' : ''}`}
                                                    style={{ height: `${CELL_H}px`, width: cellWidth }}
                                                >
                                                    {cell && cell.code ? (
                                                        <div className="relative flex flex-col items-center gap-0.5">
                                                            <div
                                                                title={[
                                                                    CODE_LABELS[cell.code] || cell.code,
                                                                    cell.late ? 'Late' : '',
                                                                    cell.early ? 'Early Going' : '',
                                                                ].filter(Boolean).join(' · ')}
                                                                className={`w-8 h-8 rounded-full flex items-center justify-center text-[9px] font-extrabold leading-none shadow-sm ${circleColor}`}
                                                            >
                                                                {cell.code === '½P' ? '½P' : cell.code}
                                                            </div>
                                                            {(cell.late || cell.early || cell.overtime) && (
                                                                <div className="flex items-center gap-0.5">
                                                                    {cell.late && <span className="w-1 h-1 rounded-full bg-orange-400 flex-shrink-0" title="Late" />}
                                                                    {cell.early && <span className="w-1 h-1 rounded-full bg-blue-400 flex-shrink-0" title="Early Going" />}
                                                                    {cell.overtime && <span className="w-1 h-1 rounded-full bg-purple-400 flex-shrink-0" title="Overtime" />}
                                                                </div>
                                                            )}
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
                                                        {k} <span className="font-extrabold">{r.totals[k]}</span>
                                                    </span>
                                                );
                                            })}
                                            {r.lateDays > 0 && (
                                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-orange-100 text-orange-500 border border-orange-200">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                                                    Late <span className="font-extrabold">{r.lateDays}</span>
                                                </span>
                                            )}
                                            {r.earlyDays > 0 && (
                                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-blue-100 text-blue-500 border border-blue-200">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                                    Early <span className="font-extrabold">{r.earlyDays}</span>
                                                </span>
                                            )}
                                            {r.overtimeDays > 0 && (
                                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-purple-100 text-purple-600 border border-purple-200">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                                                    OT <span className="font-extrabold">{r.overtimeDays}</span>
                                                </span>
                                            )}
                                            {TOTALS_ORDER.every(k => r.totals[k] === 0) && r.lateDays === 0 && r.earlyDays === 0 && (
                                                <span className="text-slate-300 text-[9px] italic">No records</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MonthlyAttendance;
