import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosInstance';
import { ArrowLeft, Filter, Users, Calendar, Building, Award, RefreshCw, HelpCircle } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Toast } from '../../Components/ui/Toast';

/* ------------ utils ------------ */
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

/* All status codes including INC (Incomplete) and L (Late) */
const CODE_LABELS = {
    P: 'Present',
    A: 'Absent',
    WO: 'Week Off',
    '½P': 'Half Present',
    H: 'Holiday',
    INC: 'Incomplete',
    OT: 'Overtime',
};

/* Legend & totals order */
const TOTALS_ORDER = ['P', 'A', 'WO', '½P', 'H', 'INC', 'OT'];

/* Badge colors for legend and totals column — original CSS variables */
const CODE_COLORS = {
    P: 'bg-[var(--color-code-p-bg)] text-[var(--color-code-p-text)] border border-[var(--color-code-p-border)]',
    A: 'bg-[var(--color-code-a-bg)] text-[var(--color-a-text)] border border-[var(--color-code-a-border)]',
    L: 'bg-[var(--color-code-l-bg)] text-[var(--color-code-l-text)] border border-[var(--color-code-l-border)]',
    '½P': 'bg-[var(--color-code-halfp-bg)] text-[var(--color-code-halfp-text)] border border-[var(--color-code-halfp-border)]',
    WO: 'bg-[var(--color-code-wo-bg)] text-[var(--color-code-wo-text)] border border-[var(--color-code-wo-border)]',
    H: 'bg-[var(--color-code-h-bg)] text-[var(--color-code-h-text)] border border-[var(--color-code-h-border)]',
    INC: 'bg-[var(--color-code-l-bg)] text-[var(--color-code-l-text)] border border-[var(--color-code-l-border)]',
    OT: 'bg-purple-100 text-purple-700 border border-purple-200',
};

/* Day-cell background + left-border accent — original CSS variables */
const CELL_STATUS_COLORS = {
    P: 'bg-[var(--color-cell-p-bg)] text-[var(--color-cell-p-text)] border-l-4 border-l-[var(--color-cell-p-border)]',
    A: 'bg-[var(--color-cell-a-bg)] text-[var(--color-cell-a-text)] border-l-4 border-l-[var(--color-cell-a-border)]',
    L: 'bg-[var(--color-cell-l-bg)] text-[var(--color-cell-l-text)] border-l-4 border-l-[var(--color-cell-l-border)]',
    '½P': 'bg-[var(--color-cell-halfp-bg)] text-[var(--color-cell-halfp-text)] border-l-4 border-l-[var(--color-cell-halfp-border)]',
    WO: 'bg-[var(--color-cell-wo-bg)] text-[var(--color-cell-wo-text)] border-l-4 border-l-[var(--color-cell-wo-border)]',
    H: 'bg-[var(--color-cell-h-bg)] text-[var(--color-cell-h-text)] border-l-4 border-l-[var(--color-cell-h-border)]',
    INC: 'bg-[var(--color-cell-l-bg)] text-[var(--color-cell-l-text)] border-l-4 border-l-[var(--color-cell-l-border)]',
    OT: 'bg-purple-50 text-purple-700 border-l-4 border-l-purple-400',
};

/* Responsive cell dimensions — taller to fit late/early dots */
const CELL_W = 52;
const CELL_W_MOBILE = 40;
const CELL_H = 52;

/* Sticky column widths */
const CODE_COL_W = 90;
const NAME_COL_W = 140;
const CODE_COL_W_MOBILE = 70;
const NAME_COL_W_MOBILE = 110;

/**
 * Resolve a raw API row → one of our canonical codes.
 * Priority: short_status → is_late flag → status string
 */
const normalizeCode = (rawShort, rawStatus, isLate) => {
    const s = (rawShort || '').toString().trim().toUpperCase();

    // Direct map
    if (s === 'P') return 'P';
    if (s === 'A') return 'A';
    if (s === 'WO') return 'WO';
    if (s === 'H') return 'H';
    if (s === 'L') return 'L';
    if (s === '½P' || s === '1/2P' || s === 'HP') return '½P';
    if (s === 'INC' || s === 'INCOMPLETE') return 'INC';
    if (s === 'OT') return 'OT';
    // Fallback: use status string
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

/* Short display text inside each cell */
const CELL_DISPLAY = {
    P: 'P',
    A: 'A',
    L: 'L',
    WO: 'WO',
    '½P': '½P',
    H: 'H',
    INC: 'INC',
    OT: 'OT',
};

const MonthlyAttendance = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const containerRef = useRef(null);

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
        branch_id: '',
        department_id: '',
        designation_id: '',
        employee_id: '',
        month_year: new Date().toISOString().slice(0, 7),
    };

    const [filters, setFilters] = useState(initialFilters);
    const [loading, setLoading] = useState(false);
    const [rows, setRows] = useState([]);
    const [error, setError] = useState('');
    const [branches, setBranches] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [designations, setDesignations] = useState([]);
    const [dropdownLoading, setDropdownLoading] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [toast, setToast] = useState(null);

    const daysInMonth = useMemo(() => getDaysInMonth(filters.month_year), [filters.month_year]);

    /* Day numbers 1…N */
    const dayMeta = useMemo(() => (
        Array.from({ length: daysInMonth }, (_, i) => ({ day: i + 1 }))
    ), [daysInMonth]);

    /* Build grid rows from flat API rows */
    const gridData = useMemo(() => {
        if (!rows?.length) return [];
        const byEmp = new Map();

        rows.forEach(r => {
            const key = `${r.employee_code}||${r.employee_name}`;
            if (!byEmp.has(key)) {
                byEmp.set(key, {
                    employee_code: r.employee_code,
                    employee_name: r.employee_name,
                    // Each slot: { code, late, early } or null
                    dayCells: Array.from({ length: daysInMonth }, () => null),
                    totals: TOTALS_ORDER.reduce((acc, c) => { acc[c] = 0; return acc; }, {}),
                    lateDays: 0,
                    earlyDays: 0,
                      overtimeDays: 0, 
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
                const h = str.match(/(\d+)h/);
                const m = str.match(/(\d+)m/);
                return (h ? +h[1] * 60 : 0) + (m ? +m[1] : 0);
            };

            const overtimeMinutes = parseMinutes(r.overtime_hours);
            const overtime = overtimeMinutes > 0;

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

    /* CSS grid template */
    const gridTemplate = useMemo(() => {
        const totalsW = isMobile ? '160px' : '220px';
        return `${codeColW}px ${nameColW}px repeat(${daysInMonth}, ${cellWidth}px) ${totalsW}`;
    }, [daysInMonth, isMobile, cellWidth, codeColW, nameColW]);

    /* Total min width for the inner scroll div */
    const minInnerWidth = codeColW + nameColW + daysInMonth * cellWidth + (isMobile ? 160 : 220);

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
        } catch (e) {
            console.error(e);
        } finally {
            setDropdownLoading(false);
        }
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
                setLoading(true);
                setError('');
                const data = await fetchReportData();
                setRows(data || []);
            } catch (e) {
                setError(e.message || 'Failed to load data');
                setRows([]);
            } finally {
                setLoading(false);
                if (containerRef.current) containerRef.current.scrollLeft = 0;
            }
        }, 300);
        return () => clearTimeout(debTimer.current);
    }, [fetchReportData]);

    useEffect(() => { fetchDropdownData(); }, [fetchDropdownData]);

    /* ---------- Handlers ---------- */
    const handleFilterChange = (key, value) => {
        setRows([]);
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
        setFilters({ branch_id: '', department_id: '', designation_id: '', employee_id: '', month_year: new Date().toISOString().slice(0, 7) });
        setRows([]);
        setError('');
    };

    const formatMonthYear = (my) => {
        if (!my) return '--';
        const [y, m] = my.split('-');
        return new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    /* ===================== RENDER ===================== */
    return (
        <div className="min-h-screen bg-[var(--color-bg-primary)] pb-4 sm:pb-8">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <div className="p-3 sm:p-8 mx-auto">

                {/* ── Header ── */}
                <div className="bg-[var(--color-bg-secondary)] rounded-xl sm:rounded-2xl shadow-xl mb-4 sm:mb-6 overflow-hidden">
                    <div className="bg-gradient-to-r from-[var(--color-primary-dark)] to-[var(--color-primary-darker)] p-4 sm:p-8">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => navigate(-1)}
                                    className="flex items-center gap-1 sm:gap-2 text-white bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg text-xs sm:text-sm transition-colors"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    <span className="hidden sm:inline">Back</span>
                                </button>
                                <h1 className="text-base sm:text-2xl font-bold text-white">Monthly Attendance</h1>
                            </div>
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="flex items-center gap-2 bg-white text-primary-600 hover:bg-primary-50 px-4 py-1.5 rounded-lg font-medium transition-colors text-xs sm:text-sm self-start sm:self-auto"
                            >
                                <Filter className="h-4 w-4" />
                                {showFilters ? 'Hide Filters' : 'Filters'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Error ── */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-4">
                        <div className="flex items-center gap-2 text-red-700 text-xs sm:text-sm">
                            <HelpCircle className="w-4 h-4 flex-shrink-0" />
                            <span className="font-medium">Error:</span>
                            <span>{error}</span>
                        </div>
                    </div>
                )}

                {/* ── Filters Panel ── */}
                {showFilters && (
                    <div className="bg-[var(--color-bg-secondary)] rounded-lg shadow-sm border border-[var(--color-border-secondary)] p-4 sm:p-5 mb-4 sm:mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-primary-50 rounded-lg">
                                    <Filter className="h-4 w-4 text-primary-600" />
                                </div>
                                <h2 className="text-sm sm:text-base font-semibold text-[var(--color-text-primary)]">Filters</h2>
                            </div>
                            <button
                                onClick={resetFilters}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)] rounded-lg hover:bg-[var(--color-bg-hover)] text-xs sm:text-sm transition-colors border border-[var(--color-border-secondary)]"
                            >
                                <RefreshCw className="h-3.5 w-3.5" />
                                Reset
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
                            {/* Month Year */}
                            <div className="flex flex-col z-40">
                                <label className="text-xs sm:text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
                                    <Calendar className="inline h-3.5 w-3.5 mr-1" />
                                    Month & Year <span className="text-red-500">*</span>
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
                                    className="w-full px-3 py-2 rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500 text-xs sm:text-sm"
                                    placeholderText="Select month and year"
                                    maxDate={new Date()}
                                    showPopperArrow={false}
                                />
                            </div>

                            {/* Branch */}
                            <div className="flex flex-col">
                                <label className="text-xs sm:text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
                                    <Building className="inline h-3.5 w-3.5 mr-1" />
                                    Branch
                                </label>
                                <select
                                    value={filters.branch_id}
                                    onChange={(e) => handleFilterChange('branch_id', e.target.value)}
                                    className="w-full px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border-secondary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-[var(--color-text-primary)] text-xs sm:text-sm"
                                    disabled={dropdownLoading}
                                >
                                    <option value="">All Branches</option>
                                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </select>
                            </div>

                            {/* Department */}
                            <div className="flex flex-col">
                                <label className="text-xs sm:text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
                                    <Users className="inline h-3.5 w-3.5 mr-1" />
                                    Department
                                </label>
                                <select
                                    value={filters.department_id}
                                    onChange={(e) => handleFilterChange('department_id', e.target.value)}
                                    className="w-full px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border-secondary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-[var(--color-text-primary)] text-xs sm:text-sm"
                                    disabled={dropdownLoading}
                                >
                                    <option value="">All Departments</option>
                                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                            </div>

                            {/* Designation */}
                            <div className="flex flex-col">
                                <label className="text-xs sm:text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
                                    <Award className="inline h-3.5 w-3.5 mr-1" />
                                    Designation
                                </label>
                                <select
                                    value={filters.designation_id}
                                    onChange={(e) => handleFilterChange('designation_id', e.target.value)}
                                    className="w-full px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border-secondary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-[var(--color-text-primary)] text-xs sm:text-sm"
                                    disabled={dropdownLoading}
                                >
                                    <option value="">All Designations</option>
                                    {designations.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Main Card ── */}
                <div className="bg-[var(--color-bg-secondary)] rounded-lg shadow-sm border border-[var(--color-border-secondary)] overflow-hidden">

                    {/* Card header: title + legend */}
                    <div className="px-3 sm:px-5 py-3 sm:py-4 border-b border-[var(--color-border-secondary)]">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                            <div>
                                <h3 className="font-bold text-[var(--color-text-primary)] text-sm sm:text-lg">
                                    Monthly Attendance Report
                                </h3>
                                <p className="text-[var(--color-text-secondary)] text-xs sm:text-sm mt-0.5">
                                    {formatMonthYear(filters.month_year)}
                                    {gridData.length > 0 && (
                                        <span className="ml-2 text-[var(--color-text-muted)]">· {gridData.length} employee{gridData.length !== 1 ? 's' : ''}</span>
                                    )}
                                </p>
                            </div>

                            {/* Legend */}
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                {TOTALS_ORDER.map((c) => (
                                    <div
                                        key={c}
                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-semibold shadow-sm ${CODE_COLORS[c]}`}
                                    >
                                        <span>{c}</span>
                                        <span className="hidden sm:inline opacity-70 font-normal">{CODE_LABELS[c]}</span>
                                    </div>
                                ))}
                                {/* Late indicator */}
                                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-semibold bg-[var(--color-code-l-bg)] text-[var(--color-code-l-text)] border border-[var(--color-code-l-border)] shadow-sm">
                                    <span className="w-2 h-2 rounded-full bg-[var(--color-cell-l-border)] inline-block" />
                                    <span className="hidden sm:inline font-normal opacity-70">Late Coming</span>
                                    <span className="sm:hidden">Late</span>
                                </div>
                                {/* Early going indicator */}
                                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-semibold bg-[var(--color-code-wo-bg)] text-[var(--color-code-wo-text)] border border-[var(--color-code-wo-border)] shadow-sm">
                                    <span className="w-2 h-2 rounded-full bg-[var(--color-cell-wo-border)] inline-block" />
                                    <span className="hidden sm:inline font-normal opacity-70">Early Going</span>
                                    <span className="sm:hidden">Early</span>
                                </div>

                            </div>
                        </div>
                    </div>

                    {/* Loading bar */}
                    {loading && (
                        <div className="h-0.5 bg-gray-100">
                            <div className="h-full bg-primary-500 animate-pulse w-2/3 transition-all" />
                        </div>
                    )}

                    {/* ── Scrollable Grid ── */}
                    <div
                        ref={containerRef}
                        className="overflow-auto"
                        style={{ maxHeight: '68vh' }}
                    >
                        <div style={{ minWidth: `${minInnerWidth}px` }}>

                            {/* ── Sticky Header Row ── */}
                            <div
                                className="sticky top-0 z-20 border-b-2 border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)]"
                                style={{ display: 'grid', gridTemplateColumns: gridTemplate }}
                            >
                                {/* Emp Code — sticky left */}
                                <div
                                    className="sticky left-0 z-30 bg-[var(--color-bg-primary)] px-2 sm:px-3 py-2.5 text-[10px] sm:text-xs font-bold text-[var(--color-text-primary)] uppercase tracking-wide border-r border-[var(--color-border-secondary)]"
                                    style={{ width: `${codeColW}px` }}
                                >
                                    Code
                                </div>

                                {/* Name — sticky left offset by codeCol */}
                                <div
                                    className="sticky z-30 bg-[var(--color-bg-primary)] px-2 sm:px-3 py-2.5 text-[10px] sm:text-xs font-bold text-[var(--color-text-primary)] uppercase tracking-wide border-r border-[var(--color-border-secondary)]"
                                    style={{ left: `${codeColW}px`, width: `${nameColW}px` }}
                                >
                                    Employee Name
                                </div>

                                {/* Day numbers */}
                                {dayMeta.map(({ day }) => (
                                    <div
                                        key={day}
                                        className="flex items-center justify-center text-[10px] sm:text-xs font-bold text-gray-600 border-r border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)]"
                                        style={{ height: `${CELL_H}px`, width: `${cellWidth}px` }}
                                    >
                                        {day}
                                    </div>
                                ))}

                                {/* Summary header */}
                                <div className="px-2 sm:px-3 py-2.5 text-[10px] sm:text-xs font-bold text-[var(--color-text-primary)] uppercase tracking-wide">
                                    Summary
                                </div>
                            </div>

                            {/* ── Empty State ── */}
                            {gridData.length === 0 && !loading && (
                                <div className="py-16 text-center">
                                    <Users size={40} className="mx-auto text-gray-300 mb-3" />
                                    <p className="text-gray-500 font-medium text-sm sm:text-base">No attendance data found</p>
                                    <p className="text-gray-400 text-xs sm:text-sm mt-1">
                                        Try adjusting the filters or selecting a different month
                                    </p>
                                </div>
                            )}

                            {/* ── Data Rows ── */}
                            {gridData.map((r, rowIndex) => (
                                <div
                                    key={`${r.employee_code}-${rowIndex}`}
                                    className="border-b border-[var(--color-border-secondary)] hover:bg-[var(--color-bg-hover)] transition-colors group"
                                    style={{ display: 'grid', gridTemplateColumns: gridTemplate }}
                                >
                                    {/* Employee Code — sticky */}
                                    <div
                                        className="sticky left-0 z-10 bg-[var(--color-bg-secondary)] group-hover:bg-[var(--color-bg-hover)] px-2 sm:px-3 py-2 text-[10px] sm:text-xs font-semibold text-[var(--color-text-primary)] border-r border-[var(--color-border-secondary)] flex items-center transition-colors"
                                        style={{ width: `${codeColW}px` }}
                                    >
                                        <span className="truncate">{r.employee_code}</span>
                                    </div>

                                    {/* Employee Name — sticky */}
                                    <div
                                        className="sticky z-10 bg-[var(--color-bg-secondary)] group-hover:bg-[var(--color-bg-hover)] px-2 sm:px-3 py-2 text-[10px] sm:text-xs text-[var(--color-text-primary)] border-r border-[var(--color-border-secondary)] flex items-center transition-colors"
                                        style={{ left: `${codeColW}px`, width: `${nameColW}px` }}
                                    >
                                        <span className="truncate" title={r.employee_name}>{r.employee_name}</span>
                                    </div>

                                    {/* Day cells */}
                                    {r.dayCells.map((cell, dayIndex) => (
                                        <div
                                            key={dayIndex}
                                            className="flex items-center justify-center py-0.5 px-0.5"
                                            style={{ height: `${CELL_H}px`, width: `${cellWidth}px` }}
                                        >
                                            {cell && cell.code ? (
                                                <div
                                                    title={[
                                                        CODE_LABELS[cell.code] || cell.code,
                                                        cell.late ? '⏰ Late' : '',
                                                        cell.early ? '🚪 Early Going' : '',
                                                    ].filter(Boolean).join(' · ')}
                                                    className={`w-full h-full rounded flex flex-col items-center justify-center gap-0.5 ${CELL_STATUS_COLORS[cell.code] || 'bg-gray-100 text-gray-600 border-l-4 border-l-gray-300'}`}
                                                >
                                                    {/* Status code */}
                                                    <span className="text-[8px] sm:text-[10px] font-bold leading-none">
                                                        {CELL_DISPLAY[cell.code] || cell.code}
                                                    </span>
                                                    {/* Late / Early indicators */}
                                                    {(cell.late || cell.early || cell.overtime)&& (
                                                        <div className="flex items-center gap-0.5">
                                                            {cell.late && (
                                                                <span
                                                                    className="w-1.5 h-1.5 rounded-full bg-[var(--color-cell-l-border)] flex-shrink-0"
                                                                    title="Late"
                                                                />
                                                            )}
                                                            {cell.early && (
                                                                <span
                                                                    className="w-1.5 h-1.5 rounded-full bg-[var(--color-cell-wo-border)] flex-shrink-0"
                                                                    title="Early Going"
                                                                />
                                                            )}
                                                            {cell.overtime && (
    <span
        className="w-1.5 h-1.5 rounded-full bg-purple-500 flex-shrink-0"
        title="Overtime"
    />
)}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="w-full h-full rounded flex items-center justify-center text-gray-200 text-[8px]">
                                                    –
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {/* Totals column */}
                                    <div className="px-2 sm:px-3 py-1.5 flex flex-wrap items-center gap-1 content-center">
                                        {TOTALS_ORDER.filter(k => r.totals[k] > 0).map(k => (
                                            <span
                                                key={k}
                                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-semibold ${CODE_COLORS[k]}`}
                                            >
                                                <span>{k}</span>
                                                <span className="bg-white/60 px-1 rounded font-bold text-[9px]">
                                                    {Number.isInteger(r.totals[k]) ? r.totals[k] : r.totals[k].toFixed(1)}
                                                </span>
                                            </span>
                                        ))}
                                        {/* Late count */}
                                        {r.lateDays > 0 && (
                                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-semibold bg-[var(--color-code-l-bg)] text-[var(--color-code-l-text)] border border-[var(--color-code-l-border)]">
                                                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-cell-l-border)] inline-block" />
                                                Late
                                                <span className="bg-white/60 px-1 rounded font-bold text-[9px]">{r.lateDays}</span>
                                            </span>
                                        )}
                                        {/* Early going count */}
                                        {r.earlyDays > 0 && (
                                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-semibold bg-[var(--color-code-wo-bg)] text-[var(--color-code-wo-text)] border border-[var(--color-code-wo-border)]">
                                                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-cell-wo-border)] inline-block" />
                                                Early
                                                <span className="bg-white/60 px-1 rounded font-bold text-[9px]">{r.earlyDays}</span>
                                            </span>
                                        )}
                                        {r.overtimeDays > 0 && (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-semibold bg-purple-100 text-purple-700 border border-purple-200">
        <span className="w-1.5 h-1.5 rounded-full bg-purple-500 inline-block" />
        OT
        <span className="bg-white/60 px-1 rounded font-bold text-[9px]">
            {r.overtimeDays}
        </span>
    </span>
)}
                                        {TOTALS_ORDER.every(k => r.totals[k] === 0) && r.lateDays === 0 && r.earlyDays === 0 && (
                                            <span className="text-gray-400 text-[10px]">No records</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MonthlyAttendance;