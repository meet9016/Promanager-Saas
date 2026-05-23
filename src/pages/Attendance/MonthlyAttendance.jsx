import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosInstance';
import { Filter, Users, Calendar, Building, Award, RefreshCw, HelpCircle, ChevronDown, Search, X, CheckCircle, XCircle, Clock, AlertTriangle, Minus } from 'lucide-react';
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
    P:   'bg-emerald-100  text-emerald-700',
    A:   'bg-red-100      text-red-500',
    WO:  'bg-slate-200    text-slate-500',
    '½P':'bg-amber-100    text-amber-600',
    H:   'bg-violet-100   text-violet-600',
    INC: 'bg-orange-100   text-orange-600',
    OT:  'bg-purple-100   text-purple-600',
    L:   'bg-orange-50    text-orange-500',
};

/* Legend badge colors */
const CODE_COLORS = {
    P:   'bg-emerald-50  text-emerald-700 border-emerald-200',
    A:   'bg-red-50      text-red-500     border-red-200',
    WO:  'bg-slate-100   text-slate-500   border-slate-300',
    '½P':'bg-amber-50    text-amber-600   border-amber-200',
    H:   'bg-violet-50   text-violet-600  border-violet-200',
    INC: 'bg-orange-50   text-orange-600  border-orange-200',
    OT:  'bg-purple-50   text-purple-600  border-purple-200',
    L:   'bg-orange-50   text-orange-500  border-orange-200',
};

/* Avatar palette — deterministic by first char */
const AVATAR_COLORS = [
    'bg-violet-500','bg-blue-500','bg-emerald-500','bg-rose-500',
    'bg-amber-500','bg-cyan-500','bg-fuchsia-500','bg-teal-500',
    'bg-indigo-500','bg-orange-500',
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
        branch_id: '', department_id: '', designation_id: '',
        employee_id: '', month_year: new Date().toISOString().slice(0, 7),
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
    const [searchQuery, setSearchQuery] = useState('');

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

    /* ===================== RENDER ===================== */
    return (
        <div className="min-h-screen bg-slate-50 pb-8" style={{ fontFamily: "'Inter', sans-serif" }}>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <div className="p-3 sm:p-6 mx-auto max-w-[1900px] space-y-4">

                {/* ══ HERO HEADER CARD ══ */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    {/* Rainbow top border */}
                    {/* <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-violet-500 via-fuchsia-500 to-orange-400" /> */}

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-6 py-5">
                        {/* Left */}
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-200 flex-shrink-0">
                                <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                    <rect x={3} y={4} width={18} height={18} rx={2} /><line x1={16} y1={2} x2={16} y2={6} /><line x1={8} y1={2} x2={8} y2={6} /><line x1={3} y1={10} x2={21} y2={10} />
                                </svg>
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full uppercase tracking-widest">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        Live · {formatMonthYearShort(filters.month_year)}
                                    </span>
                                </div>
                                <h1 className="text-base sm:text-2xl font-bold text-[var(--color-primary-darker)]">
                                    Monthly Attendance
                                </h1>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    {gridData.length} employee{gridData.length !== 1 ? 's' : ''} · {daysInMonth} days · tracked in real time
                                </p>
                            </div>
                        </div>

                        {/* Right: donut + filter btn */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all duration-200
                                    ${showFilters
                                        ? 'bg-violet-600 text-white border-violet-600 shadow-lg shadow-violet-100'
                                        : 'bg-white text-slate-600 border-slate-200 hover:border-violet-300 hover:text-violet-600'
                                    }`}
                            >
                                <Filter size={14} />
                                Filters
                                <ChevronDown size={13} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* ══ ERROR ══ */}
                {error && (
                    <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
                        <HelpCircle size={15} className="flex-shrink-0" />
                        <span><b>Error:</b> {error}</span>
                    </div>
                )}

                {/* ══ STATS ROW ══ */}
                {/* {gridData.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-wrap divide-x divide-slate-100">
                        <StatCard label="Present" value={summaryStats.totals['P']}
                            color="text-emerald-600" iconBg="bg-emerald-100" icon={CheckCircle} />
                        <StatCard label="Absent" value={summaryStats.totals['A']}
                            color="text-red-500" iconBg="bg-red-100" icon={XCircle} />
                        <StatCard label="Week Off" value={summaryStats.totals['WO']}
                            color="text-slate-600" iconBg="bg-slate-100" icon={Minus} />
                        <StatCard label="Incomplete" value={summaryStats.totals['INC']}
                            color="text-orange-500" iconBg="bg-orange-100" icon={AlertTriangle} />
                    </div>
                )} */}

                {/* ══ FILTERS PANEL ══ */}
                {showFilters && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50/60">
                            <span className="text-sm font-bold text-slate-700">Filter Attendance</span>
                            <button onClick={resetFilters}
                                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-violet-600 px-3 py-1.5 rounded-lg hover:bg-violet-50 border border-slate-200 hover:border-violet-200 transition-all">
                                <RefreshCw size={13} /> Reset
                            </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 p-5">
                            {/* Month Year */}
                            <div className="flex flex-col gap-1.5 z-40">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                    <Calendar size={11} /> Month & Year <span className="text-red-400">*</span>
                                </label>
                                <div className="relative">
                                    <DatePicker
                                        selected={filters.month_year ? new Date(`${filters.month_year}-01`) : null}
                                        onChange={(date) => {
                                            const iso = date ? `${date.getFullYear()}-${pad2(date.getMonth() + 1)}` : '';
                                            handleFilterChange('month_year', iso);
                                        }}
                                        dateFormat="MMMM yyyy"
                                        showMonthYearPicker showFullMonthYearPicker
                                        className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all"
                                        placeholderText="Select month and year"
                                        maxDate={new Date()} showPopperArrow={false}
                                    />
                                    <Calendar size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                </div>
                            </div>

                            {/* Branch */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                    <Building size={11} /> Branch
                                </label>
                                <div className="relative">
                                    <select value={filters.branch_id}
                                        onChange={(e) => handleFilterChange('branch_id', e.target.value)}
                                        className="w-full pl-8 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent text-slate-700 text-sm appearance-none transition-all"
                                        disabled={dropdownLoading}>
                                        <option value="">All Branches</option>
                                        {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                    <Building size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                </div>
                            </div>

                            {/* Department */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                    <Users size={11} /> Department
                                </label>
                                <div className="relative">
                                    <select value={filters.department_id}
                                        onChange={(e) => handleFilterChange('department_id', e.target.value)}
                                        className="w-full pl-8 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent text-slate-700 text-sm appearance-none transition-all"
                                        disabled={dropdownLoading}>
                                        <option value="">All Departments</option>
                                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                    <Users size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                </div>
                            </div>

                            {/* Designation */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                    <Award size={11} /> Designation
                                </label>
                                <div className="relative">
                                    <select value={filters.designation_id}
                                        onChange={(e) => handleFilterChange('designation_id', e.target.value)}
                                        className="w-full pl-8 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent text-slate-700 text-sm appearance-none transition-all"
                                        disabled={dropdownLoading}>
                                        <option value="">All Designations</option>
                                        {designations.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                    <Award size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>
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
                                    {/* Employee Code — sticky, solid bg */}
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

                                    {/* Employee Name — sticky, solid bg */}
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
                                                                cell.late ? '⏰ Late' : '',
                                                                cell.early ? '🚪 Early Going' : '',
                                                            ].filter(Boolean).join(' · ')}
                                                            className={`w-8 h-8 rounded-full flex items-center justify-center text-[9px] font-extrabold leading-none shadow-sm ${circleColor}`}
                                                        >
                                                            {cell.code === '½P' ? '½P' : cell.code}
                                                        </div>
                                                        {/* Indicator dots */}
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

                                    {/* ── Summary column ── */}
                                    <div
                                        className="flex flex-wrap items-center gap-1 px-2 py-1 content-center"
                                        style={{ height: `${CELL_H}px`, width: SUMMARY_COL_W }}
                                    >
                                        {TOTALS_ORDER.filter(k => r.totals[k] > 0).map(k => {
                                            const colorMap = {
                                                P:   'bg-emerald-100 text-emerald-700 border-emerald-200',
                                                A:   'bg-red-100 text-red-500 border-red-200',
                                                WO:  'bg-slate-200 text-slate-500 border-slate-300',
                                                '½P':'bg-amber-100 text-amber-600 border-amber-200',
                                                H:   'bg-violet-100 text-violet-600 border-violet-200',
                                                INC: 'bg-orange-100 text-orange-600 border-orange-200',
                                                OT:  'bg-purple-100 text-purple-600 border-purple-200',
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