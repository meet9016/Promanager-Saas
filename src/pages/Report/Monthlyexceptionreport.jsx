/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback, useMemo, useRef, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Calendar,
    Users,
    Download,
    Search,
    ArrowLeft,
    XCircle,
    FileSpreadsheet,
    FileDown,
    ChevronDown,
    Filter,
    X,
    Loader2,
    Building,
    Award,
    Timer,
    Clock,
    AlertTriangle,
    TrendingDown,
    LogOut,
    Activity,
    CheckCircle,
    Play,
    RefreshCw,
    User
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosInstance';
import { createPortal } from 'react-dom';
import { Toast } from '../../Components/ui/Toast';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Pagination from '../../Components/Pagination';
import { SearchableDropdown } from '../../Components/Report/ReportComponents';

// ─── Floating anchor helpers ──────────────────────────────────────────────────
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
        if (placement === 'bottom-start') left = rect.left + scrollX;
        else if (placement === 'bottom-center') left = rect.left + scrollX + rect.width / 2 - minWidth / 2;
        else left = rect.left + scrollX + rect.width - minWidth;
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

// ─── Tab config ───────────────────────────────────────────────────────────────
const TABS = [
    {
        key: 'all_employees',
        label: 'All Employees',
        icon: Users,
        color: 'text-primary-600',
        bg: 'bg-primary-50',
        badge: 'bg-primary-100 text-primary-700',
        borderColor: 'border-primary-400',
        description: 'All employees with monthly exception highlights'
    },
    {
        key: 'late_coming',
        label: 'Late Coming',
        icon: Clock,
        color: 'text-yellow-600',
        bg: 'bg-yellow-50',
        badge: 'bg-yellow-100 text-yellow-700',
        borderColor: 'border-yellow-400',
        description: 'Employees with late arrivals this month'
    },
    {
        key: 'early_going',
        label: 'Early Going',
        icon: LogOut,
        color: 'text-orange-600',
        bg: 'bg-orange-50',
        badge: 'bg-orange-100 text-orange-700',
        borderColor: 'border-orange-400',
        description: 'Employees who left early this month'
    },
    {
        key: 'short_hours',
        label: 'Short Hours',
        icon: TrendingDown,
        color: 'text-red-600',
        bg: 'bg-red-50',
        badge: 'bg-red-100 text-red-700',
        borderColor: 'border-red-400',
        description: 'Employees with fewer hours than required'
    },
    {
        key: 'missed_punch',
        label: 'Missed Punch',
        icon: AlertTriangle,
        color: 'text-purple-600',
        bg: 'bg-purple-50',
        badge: 'bg-purple-100 text-purple-700',
        borderColor: 'border-purple-400',
        description: 'Employees with incomplete clock in/out records'
    }
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const parseHoursToMinutes = (str) => {
    if (!str || str === '--' || str === '0h 0m') return 0;
    const match = str.match(/(\d+)h\s*(\d+)m/);
    if (!match) return 0;
    return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
};

const formatMinutesToHm = (totalMins) => {
    if (totalMins <= 0) return '0h 0m';
    return `${Math.floor(totalMins / 60)}h ${totalMins % 60}m`;
};

/**
 * Classify a single daily attendance record into exception types.
 * Returns array of exception keys that apply to this record.
 */
const classifyDayExceptions = (record) => {
    const exceptions = [];

    if (record.is_late || parseInt(record.late_coming_minutes || 0, 10) > 0) {
        exceptions.push('late_coming');
    }
    if (record.is_early_going || parseInt(record.early_going_minutes || 0, 10) > 0) {
        exceptions.push('early_going');
    }

    const attMins = parseHoursToMinutes(record.attandance_hours);
    const shiftMins = parseHoursToMinutes(record.shift_working_hours);
    const hasAnyPunch = record.attandance_first_clock_in && record.attandance_first_clock_in !== '--';
    if (hasAnyPunch && shiftMins > 0 && attMins < shiftMins) {
        exceptions.push('short_hours');
    }

    const clockIn = record.attandance_first_clock_in;
    const clockOut = record.attandance_last_clock_out;
    const historyCount = (record.attendance_history || []).length;
    const hasMissedPunch =
        (clockIn && !clockOut) ||
        (!clockIn && clockOut) ||
        (historyCount > 0 && historyCount % 2 !== 0);
    if (hasMissedPunch) {
        exceptions.push('missed_punch');
    }

    return exceptions;
};

/**
 * Aggregate a flat list of daily records (all belonging to one employee)
 * into a summary object used for display in the exception table rows.
 */
const aggregateEmployeeExceptions = (records) => {
    let lateDays = 0;
    let totalLateMinutes = 0;
    let earlyDays = 0;
    let totalEarlyMinutes = 0;
    let shortHoursDays = 0;
    let totalShortMinutes = 0;
    let missedPunchDays = 0;

    records.forEach((rec) => {
        const ex = classifyDayExceptions(rec);

        if (ex.includes('late_coming')) {
            lateDays++;
            totalLateMinutes += parseInt(rec.late_coming_minutes || 0, 10);
        }
        if (ex.includes('early_going')) {
            earlyDays++;
            totalEarlyMinutes += parseInt(rec.early_going_minutes || 0, 10);
        }
        if (ex.includes('short_hours')) {
            shortHoursDays++;
            const attMins = parseHoursToMinutes(rec.attandance_hours);
            const shiftMins = parseHoursToMinutes(rec.shift_working_hours);
            totalShortMinutes += shiftMins - attMins;
        }
        if (ex.includes('missed_punch')) {
            missedPunchDays++;
        }
    });

    return {
        lateDays,
        totalLateTime: formatMinutesToHm(totalLateMinutes),
        earlyDays,
        totalEarlyTime: formatMinutesToHm(totalEarlyMinutes),
        shortHoursDays,
        totalShortTime: formatMinutesToHm(totalShortMinutes),
        missedPunchDays,
    };
};

// ─── Main Component ───────────────────────────────────────────────────────────
const MonthlyExceptionReport = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    // Filters
    const [monthYear, setMonthYear] = useState(new Date().toISOString().slice(0, 7));
    const [filters, setFilters] = useState({
        branch_id: '', department_id: '', designation_id: '', employee_id: ''
    });

    // Data
    const [rawData, setRawData] = useState([]); // flat daily records from API
    const [hasGenerated, setHasGenerated] = useState(false);
    const [loading, setLoading] = useState(false);
    const [dropdownLoading, setDropdownLoading] = useState(false);
    const [error, setError] = useState(null);

    // UI state
    const [activeTab, setActiveTab] = useState('all_employees');
    const [searchQuery, setSearchQuery] = useState('');
    const [exportDropdown, setExportDropdown] = useState(false);
    const [filterDropdown, setFilterDropdown] = useState(false);
    const [toast, setToast] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;

    // Dropdown options
    const [branches, setBranches] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [designations, setDesignations] = useState([]);
    const [employees, setEmployees] = useState([]);

    const exportBtnRef = useRef(null);
    const filterBtnRef = useRef(null);
    const exportPos = useAnchoredPosition(exportBtnRef, exportDropdown, { placement: 'bottom-end', offset: 10, minWidth: 192 });
    const filterPos = useAnchoredPosition(filterBtnRef, filterDropdown, { placement: 'bottom-end', offset: 10, minWidth: 420 });

    const showToast = (message, type = 'info') => setToast({ message, type });
    const closeToast = () => setToast(null);

    const formatMonthYear = (my) => {
        if (!my) return '--';
        const [year, month] = my.split('-');
        return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    // ── Fetch dropdown options ────────────────────────────────────────────────
    const fetchDropdownData = useCallback(async () => {
        try {
            setDropdownLoading(true);
            if (!user?.user_id) throw new Error('User ID is required');
            const formData = new FormData();
            const resp = await api.post('employee_drop_down_list', formData);
            if (resp.data?.success && resp.data.data) {
                const d = resp.data.data;
                setBranches((d.branch_list || []).map((b) => ({ id: b.branch_id, name: b.name })));
                setDepartments((d.department_list || []).map((dep) => ({ id: dep.department_id, name: dep.name })));
                setDesignations((d.designation_list || []).map((des) => ({ id: des.designation_id, name: des.name })));
            } else {
                throw new Error(resp.data?.message || 'Failed to fetch dropdowns');
            }
        } catch (err) {
            showToast(err.message || 'Failed to load filter options', 'error');
        } finally {
            setDropdownLoading(false);
        }
    }, [user?.user_id]);

    const fetchEmployees = useCallback(async () => {
        try {
            if (!user?.user_id) return;
            const formData = new FormData();
            if (filters.branch_id) formData.append('branch_id', filters.branch_id);
            if (filters.department_id) formData.append('department_id', filters.department_id);
            if (filters.designation_id) formData.append('designation_id', filters.designation_id);
            const resp = await api.post('report_employee_list_drop_down', formData);
            if (resp.data?.success && resp.data.data) {
                const list = resp.data.data.employee_list || [];
                setEmployees(list.map((e) => ({ id: e.employee_id, name: e.full_name })));
            }
        } catch (_) { /* silent */ }
    }, [user?.user_id, filters.branch_id, filters.department_id, filters.designation_id]);

    useEffect(() => { fetchDropdownData(); }, [fetchDropdownData]);
    useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

    // ── Generate report ───────────────────────────────────────────────────────
    const handleGenerateReport = async () => {
        if (!user?.user_id || !monthYear) {
            showToast('Please select a month and year', 'error');
            return;
        }
        try {
            setLoading(true);
            setError(null);

            const formData = new FormData();
            formData.append('month_year', monthYear);
            if (filters.branch_id) formData.append('branch_id', filters.branch_id);
            if (filters.department_id) formData.append('department_id', filters.department_id);
            if (filters.designation_id) formData.append('designation_id', filters.designation_id);
            if (filters.employee_id) formData.append('employee_id', filters.employee_id);

            const res = await api.post('monthly_attendance_report_list', formData);
            if (res.data?.success && res.data?.data) {
                const rows = Array.isArray(res.data.data) ? res.data.data : [];
                setRawData(rows);
                setHasGenerated(true);
                showToast('Report generated successfully!', 'success');
            } else {
                throw new Error(res.data?.message || 'Failed to fetch report');
            }
        } catch (err) {
            const msg = err.message || 'An error occurred while fetching the report';
            setError(msg);
            showToast(msg, 'error');
            setRawData([]);
        } finally {
            setLoading(false);
        }
    };

    // ── Group raw daily records by employee, then classify exceptions ─────────
    /**
     * employeeMap: { [employee_code]: { employee_name, employee_code, records: [...] } }
     */
    const employeeMap = useMemo(() => {
        const map = {};
        rawData.forEach((rec) => {
            const code = rec.employee_code;
            if (!map[code]) {
                map[code] = {
                    employee_id: rec.employee_id,
                    employee_code: code,
                    employee_name: rec.employee_name,
                    records: [],
                };
            }
            map[code].records.push(rec);
        });
        return map;
    }, [rawData]);

    /**
     * employeeSummaries: array of per-employee aggregated exception data
     * Each entry has { employee_*, lateDays, earlyDays, shortHoursDays, missedPunchDays, ... }
     */
    const employeeSummaries = useMemo(() => {
        return Object.values(employeeMap).map((emp) => {
            const agg = aggregateEmployeeExceptions(emp.records);
            const exception_types = [];
            if (agg.lateDays > 0) exception_types.push('late_coming');
            if (agg.earlyDays > 0) exception_types.push('early_going');
            if (agg.shortHoursDays > 0) exception_types.push('short_hours');
            if (agg.missedPunchDays > 0) exception_types.push('missed_punch');
            return { ...emp, ...agg, exception_types, totalDays: emp.records.length };
        });
    }, [employeeMap]);

    // ── Exception buckets ─────────────────────────────────────────────────────
    const exceptionMap = useMemo(() => {
        const map = { all_employees: [], late_coming: [], early_going: [], short_hours: [], missed_punch: [] };
        employeeSummaries.forEach((emp) => {
            map.all_employees.push(emp);
            emp.exception_types.forEach((type) => map[type].push(emp));
        });
        return map;
    }, [employeeSummaries]);

    const summaryCounts = useMemo(() => ({
        all_employees: exceptionMap.all_employees.length,
        late_coming: exceptionMap.late_coming.length,
        early_going: exceptionMap.early_going.length,
        short_hours: exceptionMap.short_hours.length,
        missed_punch: exceptionMap.missed_punch.length,
    }), [exceptionMap]);

    // ── Active tab data + search ──────────────────────────────────────────────
    const activeData = useMemo(() => {
        const q = searchQuery.toLowerCase().trim();
        const base = exceptionMap[activeTab] || [];
        if (!q) return base;
        return base.filter(
            (emp) =>
                emp.employee_name?.toLowerCase().includes(q) ||
                emp.employee_code?.toLowerCase().includes(q)
        );
    }, [exceptionMap, activeTab, searchQuery]);

    // ── Pagination ────────────────────────────────────────────────────────────
    const totalPages = useMemo(() => Math.max(1, Math.ceil((activeData?.length || 0) / rowsPerPage)), [activeData?.length]);
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * rowsPerPage;
        return (activeData || []).slice(start, start + rowsPerPage);
    }, [activeData, currentPage]);
    const emptyRowCount = useMemo(() => Math.max(0, rowsPerPage - (paginatedData?.length || 0)), [paginatedData]);

    useEffect(() => { setCurrentPage(1); }, [activeTab, searchQuery, monthYear]);

    // ── Filter helpers ────────────────────────────────────────────────────────
    const handleFilterChange = (name, value) => {
        setFilters((prev) => {
            const next = { ...prev, [name]: value };
            if (name === 'branch_id') { next.department_id = ''; next.designation_id = ''; next.employee_id = ''; }
            else if (name === 'department_id') { next.designation_id = ''; next.employee_id = ''; }
            else if (name === 'designation_id') { next.employee_id = ''; }
            return next;
        });
    };

    const getActiveFiltersCount = () => Object.values(filters).filter((v) => v !== '').length;

    const resetAll = () => {
        setFilters({ branch_id: '', department_id: '', designation_id: '', employee_id: '' });
        setMonthYear(new Date().toISOString().slice(0, 7));
        setRawData([]);
        setHasGenerated(false);
        setSearchQuery('');
        setFilterDropdown(false);
        showToast('Filters reset', 'success');
    };

    const handleClearSearch = useCallback(() => setSearchQuery(''), []);

    // ── Table column config per tab ───────────────────────────────────────────
    const renderTableHead = () => {
        if (activeTab === 'all_employees') {
            return [
                { label: '#', key: 'sno' },
                { label: 'Employee', key: 'employee' },
                { label: 'Working Days', key: 'total_days' },
                { label: 'Late Days', key: 'late_days' },
                { label: 'Early Days', key: 'early_days' },
                { label: 'Short Hours Days', key: 'short_days' },
                { label: 'Missed Punch Days', key: 'missed_days' },
                { label: 'Exception Details', key: 'exceptions' },
            ];
        }

        const baseHeaders = [
            { label: '#', key: 'sno' },
            { label: 'Employee', key: 'employee' },
            { label: 'Working Days', key: 'total_days' },
        ];

        const extraHeaders = {
            late_coming: [
                { label: 'Late Days', key: 'late_days' },
                { label: 'Total Late Time', key: 'total_late' },
            ],
            early_going: [
                { label: 'Early Days', key: 'early_days' },
                { label: 'Total Early Time', key: 'total_early' },
            ],
            short_hours: [
                { label: 'Short Days', key: 'short_days' },
                { label: 'Total Short Time', key: 'total_short' },
            ],
            missed_punch: [
                { label: 'Missed Punch Days', key: 'missed_days' },
            ],
        };

        return [...baseHeaders, ...(extraHeaders[activeTab] || [])];
    };

    // Row highlight for exceptions in "All Employees" tab
    const getAllEmpRowHighlight = (exTypes) => {
        if (!exTypes || exTypes.length === 0) return '';
        if (exTypes.includes('missed_punch')) return 'border-l-4 border-purple-400';
        if (exTypes.includes('short_hours')) return 'border-l-4 border-red-400';
        if (exTypes.includes('early_going')) return 'border-l-4 border-orange-400';
        if (exTypes.includes('late_coming')) return 'border-l-4 border-yellow-400';
        return '';
    };

    const renderTableRow = (emp, idx) => {
        const sno = (currentPage - 1) * rowsPerPage + idx + 1;

        // ── All Employees tab ─────────────────────────────────────────────────
        if (activeTab === 'all_employees') {
            const exTypes = emp.exception_types || [];
            const rowClass = getAllEmpRowHighlight(exTypes);

            const exDetails = [];
            if (exTypes.includes('late_coming')) {
                exDetails.push({
                    key: 'late',
                    pill: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
                    label: 'Late',
                    value: `${emp.lateDays} day${emp.lateDays !== 1 ? 's' : ''} (${emp.totalLateTime})`,
                    valueColor: 'text-yellow-700',
                });
            }
            if (exTypes.includes('early_going')) {
                exDetails.push({
                    key: 'early',
                    pill: 'bg-orange-100 text-orange-800 border border-orange-300',
                    label: 'Early',
                    value: `${emp.earlyDays} day${emp.earlyDays !== 1 ? 's' : ''} (${emp.totalEarlyTime})`,
                    valueColor: 'text-orange-700',
                });
            }
            if (exTypes.includes('short_hours')) {
                exDetails.push({
                    key: 'short',
                    pill: 'bg-red-100 text-red-800 border border-red-300',
                    label: 'Short',
                    value: `${emp.shortHoursDays} day${emp.shortHoursDays !== 1 ? 's' : ''} (${emp.totalShortTime})`,
                    valueColor: 'text-red-700',
                });
            }
            if (exTypes.includes('missed_punch')) {
                exDetails.push({
                    key: 'missed',
                    pill: 'bg-purple-100 text-purple-800 border border-purple-300',
                    label: 'Missed Punch',
                    value: `${emp.missedPunchDays} day${emp.missedPunchDays !== 1 ? 's' : ''}`,
                    valueColor: 'text-purple-700',
                });
            }

            return (
                <tr key={emp.employee_code || idx}
                    className={`hover:bg-[var(--color-bg-hover)] transition-colors ${rowClass}`}>
                    <td className="px-4 py-3 text-center text-sm text-[var(--color-text-muted)]">{sno}</td>
                    <td className="px-4 py-3">
                        <div className="flex flex-col items-start">
                            <span className="font-medium text-sm text-[var(--color-text-primary)]">{emp.employee_name || '--'}</span>
                            <span className="text-xs text-[var(--color-text-secondary)] mt-0.5">{emp.employee_code || '--'}</span>
                        </div>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-[var(--color-text-secondary)]">
                        {emp.totalDays}
                    </td>
                    <td className="px-4 py-3 text-center text-sm">
                        <span className={emp.lateDays > 0 ? 'font-semibold text-yellow-700' : 'text-[var(--color-text-muted)]'}>
                            {emp.lateDays > 0 ? emp.lateDays : '--'}
                        </span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm">
                        <span className={emp.earlyDays > 0 ? 'font-semibold text-orange-700' : 'text-[var(--color-text-muted)]'}>
                            {emp.earlyDays > 0 ? emp.earlyDays : '--'}
                        </span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm">
                        <span className={emp.shortHoursDays > 0 ? 'font-semibold text-red-700' : 'text-[var(--color-text-muted)]'}>
                            {emp.shortHoursDays > 0 ? emp.shortHoursDays : '--'}
                        </span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm">
                        <span className={emp.missedPunchDays > 0 ? 'font-semibold text-purple-700' : 'text-[var(--color-text-muted)]'}>
                            {emp.missedPunchDays > 0 ? emp.missedPunchDays : '--'}
                        </span>
                    </td>
                    <td className="px-4 py-3">
                        {exDetails.length === 0 ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-300">
                                <CheckCircle className="h-3.5 w-3.5" />
                                No Exceptions
                            </span>
                        ) : (
                            <div className="flex flex-col gap-1.5">
                                {exDetails.map((ex) => (
                                    <div key={ex.key} className="flex items-center gap-1.5">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${ex.pill}`}>
                                            {ex.label}
                                        </span>
                                        <span className={`text-xs font-semibold ${ex.valueColor}`}>
                                            {ex.value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </td>
                </tr>
            );
        }

        // ── Exception-specific tabs ───────────────────────────────────────────
        const extraCells = {
            late_coming: (
                <>
                    <td className="px-4 py-3 text-center text-sm font-semibold text-yellow-700">
                        {emp.lateDays}
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-semibold text-yellow-700">
                        {emp.totalLateTime}
                    </td>
                </>
            ),
            early_going: (
                <>
                    <td className="px-4 py-3 text-center text-sm font-semibold text-orange-700">
                        {emp.earlyDays}
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-semibold text-orange-700">
                        {emp.totalEarlyTime}
                    </td>
                </>
            ),
            short_hours: (
                <>
                    <td className="px-4 py-3 text-center text-sm font-semibold text-red-700">
                        {emp.shortHoursDays}
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-semibold text-red-700">
                        {emp.totalShortTime}
                    </td>
                </>
            ),
            missed_punch: (
                <>
                    <td className="px-4 py-3 text-center text-sm font-semibold text-purple-700">
                        {emp.missedPunchDays} day{emp.missedPunchDays !== 1 ? 's' : ''}
                    </td>
                </>
            ),
        };

        return (
            <tr key={emp.employee_code || idx}
                className="hover:bg-[var(--color-bg-hover)] transition-colors border-b border-[var(--color-border-secondary)]">
                <td className="px-4 py-3 text-center text-sm text-[var(--color-text-muted)]">{sno}</td>
                <td className="px-4 py-3">
                    <div className="flex flex-col items-start">
                        <span className="font-medium text-sm text-[var(--color-text-primary)] truncate max-w-[160px]" title={emp.employee_name}>{emp.employee_name || '--'}</span>
                        <span className="text-xs text-[var(--color-text-secondary)]">{emp.employee_code || '--'}</span>
                    </div>
                </td>
                <td className="px-4 py-3 text-center text-sm text-[var(--color-text-secondary)]">
                    {emp.totalDays}
                </td>
                {extraCells[activeTab]}
            </tr>
        );
    };

    const currentTab = TABS.find((t) => t.key === activeTab);

    return (
        <div className="min-h-screen bg-[var(--color-bg-primary)]">
            {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}

            <div className="p-8  mx-auto">
                {/* ── Page Header ── */}
                <div className="bg-[var(--color-bg-secondary)] rounded-2xl shadow-xl mb-8 overflow-hidden">
                    <div className="bg-gradient-to-r from-[var(--color-primary-dark)] to-[var(--color-primary-darker)] p-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => navigate('/reports')}
                                    className="flex items-center gap-2 text-[var(--color-text-white)] transition-colors bg-[var(--color-bg-secondary-20)] hover:bg-[var(--color-bg-secondary-30)] px-4 py-2 rounded-lg backdrop-blur-sm"
                                >
                                    <ArrowLeft size={18} />
                                    Back
                                </button>
                                <div>
                                    <h1 className="text-2xl font-bold text-[var(--color-text-white)]">Monthly Exception Report</h1>
                                    {hasGenerated && (
                                        <p className="text-sm text-white/70 mt-0.5">{formatMonthYear(monthYear)}</p>
                                    )}
                                </div>
                            </div>
                            {/* Export button */}
                            <div className="relative">
                                <button
                                    ref={exportBtnRef}
                                    onClick={() => setExportDropdown((v) => !v)}
                                    disabled={!hasGenerated || rawData.length === 0}
                                    className="flex items-center gap-2 bg-[var(--color-bg-secondary)] text-[var(--color-primary-dark)] hover:bg-[var(--color-bg-primary)] px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Download className="h-4 w-4" />
                                    Export
                                    <ChevronDown className="h-4 w-4" />
                                </button>

                                {exportDropdown && exportPos.ready && createPortal(
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setExportDropdown(false)} />
                                        <div className="absolute z-50 bg-[var(--color-bg-secondary)] rounded-lg shadow-2xl border border-[var(--color-border-secondary)] py-2"
                                            style={{ position: 'absolute', top: exportPos.top, left: exportPos.left, width: Math.max(192, exportPos.width), minWidth: 192 }}>
                                            <button
                                                onClick={() => { showToast('Excel export coming soon', 'info'); setExportDropdown(false); }}
                                                className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-[var(--color-bg-hover)] transition-colors text-[var(--color-text-primary)]">
                                                <FileSpreadsheet className="h-4 w-4 text-primary-600" />
                                                Export to Excel
                                            </button>
                                            <button
                                                onClick={() => { showToast('PDF export coming soon', 'info'); setExportDropdown(false); }}
                                                className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-[var(--color-bg-hover)] transition-colors text-[var(--color-text-primary)]">
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

                {/* ── Filters Card ── */}
                <div className="bg-[var(--color-bg-secondary)] rounded-xl shadow-sm border border-[var(--color-border-secondary)] p-5 md:p-8 mb-6">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="p-2 bg-[var(--color-primary-lightest)] rounded-lg">
                            <Filter className="h-5 w-5 text-[var(--color-primary-dark)]" />
                        </div>
                        <h2 className="text-lg font-semibold text-[var(--color-text-primary)] flex-1">Report Filters</h2>
                        <button
                            onClick={resetAll}
                            className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-bg-gray-light)] text-[var(--color-text-secondary)] rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors text-sm"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Reset
                        </button>
                    </div>

                    {dropdownLoading && (
                        <div className="flex items-center gap-2 mb-4 text-[var(--color-text-secondary)]">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm">Loading filter options...</span>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {/* Month Year */}
                        <div className="flex flex-col">
                            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                                <Calendar className="inline h-4 w-4 mr-1" />
                                Month &amp; Year <span className="text-red-500">*</span>
                            </label>
                            <DatePicker
                                selected={monthYear ? new Date(`${monthYear}-01`) : null}
                                onChange={(date) => {
                                    const iso = date
                                        ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
                                        : '';
                                    setMonthYear(iso);
                                    setHasGenerated(false);
                                    setRawData([]);
                                }}
                                dateFormat="MMMM yyyy"
                                showMonthYearPicker
                                showFullMonthYearPicker
                                className="w-full px-3 py-2 rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-dark)]"
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
                                className="w-full px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border-secondary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-dark)] text-[var(--color-text-primary)]"
                                disabled={dropdownLoading}
                            >
                                <option value="">All Branches</option>
                                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
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
                                className="w-full px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border-secondary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-dark)] text-[var(--color-text-primary)]"
                                disabled={dropdownLoading}
                            >
                                <option value="">All Departments</option>
                                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
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
                                className="w-full px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border-secondary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-dark)] text-[var(--color-text-primary)]"
                                disabled={dropdownLoading}
                            >
                                <option value="">All Designations</option>
                                {designations.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        </div>

                        {/* Employee */}
                        <div className="flex flex-col">
                            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                                <User className="inline h-4 w-4 mr-1" />
                                Employee <span className="text-[var(--color-text-secondary)] font-normal">(optional)</span>
                            </label>
                            <SearchableDropdown
                                options={employees}
                                value={filters.employee_id}
                                onChange={(value) => handleFilterChange('employee_id', value)}
                                placeholder="Search and select employee..."
                                disabled={dropdownLoading}
                                displayKey="name"
                                valueKey="id"
                            />
                        </div>

                        {/* Generate button */}
                        <div className="flex flex-col">
                            <label className="block text-sm font-medium text-transparent mb-2">Generate</label>
                            <button
                                onClick={handleGenerateReport}
                                disabled={loading || !monthYear}
                                className={`flex items-center justify-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors duration-200 ${loading || !monthYear
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-[var(--color-primary-dark)] text-white hover:bg-[var(--color-primary-darker)] shadow-lg hover:shadow-xl'
                                    }`}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
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

                {/* ── Not-yet-generated state ── */}
                {!hasGenerated && !loading && (
                    <div className="bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border-secondary)] p-12 text-center">
                        <div className="text-[var(--color-text-muted)] mb-4">
                            <Activity size={64} className="mx-auto" />
                        </div>
                        <p className="text-[var(--color-text-primary)] font-medium text-lg mb-2">Ready to Generate Report</p>
                        <p className="text-sm text-[var(--color-text-muted)]">
                            Select a month and click "Generate Report" to view monthly exception data
                        </p>
                    </div>
                )}

                {/* ── Summary cards ── */}
                {hasGenerated && (
                    <>
                        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                            {TABS.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.key;
                                return (
                                    <button
                                        key={tab.key}
                                        type="button"
                                        onClick={() => setActiveTab(tab.key)}
                                        className={`text-left bg-[var(--color-bg-secondary)] rounded-xl p-5 shadow-sm border-2 transition-all duration-200 hover:shadow-md hover:scale-[1.02] ${isActive ? `${tab.borderColor} shadow-md scale-[1.02]` : 'border-[var(--color-border-primary)]'}`}
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <div className={`p-2 rounded-lg ${isActive ? tab.bg : 'bg-[var(--color-bg-gray-light)]'}`}>
                                                <Icon className={`h-5 w-5 ${isActive ? tab.color : 'text-[var(--color-text-muted)]'}`} />
                                            </div>
                                            <span className={`text-2xl font-bold ${isActive ? tab.color : 'text-[var(--color-text-primary)]'}`}>
                                                {summaryCounts[tab.key]}
                                            </span>
                                        </div>
                                        <p className={`text-sm font-semibold ${isActive ? tab.color : 'text-[var(--color-text-secondary)]'}`}>{tab.label}</p>
                                        <p className="text-xs text-[var(--color-text-muted)] mt-0.5 leading-tight">{tab.description}</p>
                                    </button>
                                );
                            })}
                        </div>

                        {/* ── Main content card ── */}
                        <div className="bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-primary-dark)] overflow-hidden shadow-sm">

                            {/* Table toolbar */}
                            <div className="px-6 py-4 border-b border-[var(--color-primary-light)] bg-[var(--color-primary-dark)]">
                                <div className="flex justify-between items-center flex-wrap gap-3">
                                    <div className="flex items-center gap-2">
                                        {currentTab && <currentTab.icon className="h-5 w-5 text-white" />}
                                        <h3 className="text-lg font-medium text-[var(--color-text-white)]">{currentTab?.label}</h3>
                                        <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs text-white font-medium">
                                            {activeData.length} record{activeData.length !== 1 ? 's' : ''}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-3 flex-wrap">
                                        {/* Search */}
                                        <div className="relative w-full sm:w-56">
                                            <input
                                                type="text"
                                                placeholder="Search employees..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="w-full pl-10 pr-10 py-2 border border-[var(--color-border-secondary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-[var(--color-border-primary)] text-sm"
                                            />
                                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--color-text-muted)]" />
                                            {searchQuery && (
                                                <button onClick={handleClearSearch} className="absolute right-3 top-2.5">
                                                    <XCircle className="h-4 w-4 text-[var(--color-text-muted)]" />
                                                </button>
                                            )}
                                        </div>

                                        {/* Filter button */}
                                        <div className="relative">
                                            <button
                                                ref={filterBtnRef}
                                                onClick={() => setFilterDropdown((v) => !v)}
                                                className="flex items-center gap-2 bg-[var(--color-bg-secondary)] text-[var(--color-primary-dark)] hover:bg-[var(--color-bg-primary)] px-4 py-2 rounded-lg font-medium transition-colors"
                                            >
                                                <Filter className="h-4 w-4" />
                                                Filters
                                                {getActiveFiltersCount() > 0 && (
                                                    <span className="bg-[var(--color-primary-dark)] text-white text-xs rounded-full px-2 py-1">{getActiveFiltersCount()}</span>
                                                )}
                                                <ChevronDown className="h-4 w-4" />
                                            </button>

                                            {filterDropdown && createPortal(
                                                <>
                                                    <div className="fixed inset-0 z-[100] bg-black/40" onClick={() => setFilterDropdown(false)} />
                                                    {/* Desktop */}
                                                    <div
                                                        className="hidden sm:flex flex-col absolute z-[110] bg-[var(--color-bg-secondary)] rounded-lg shadow-2xl border border-[var(--color-border-secondary)] max-h-[80vh] overflow-hidden"
                                                        style={{ position: 'absolute', top: filterPos.ready ? filterPos.top : -9999, left: filterPos.ready ? Math.max(12, filterPos.left) : -9999, width: Math.max(420, filterPos.width), minWidth: 420 }}
                                                    >
                                                        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border-secondary)]">
                                                            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Filter Exceptions</h3>
                                                            <button onClick={() => setFilterDropdown(false)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] p-1 rounded-lg hover:bg-[var(--color-bg-hover)]">
                                                                <X className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                        <div className="flex-1 overflow-y-auto p-4">
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <FilterSelect label="Branch" icon={Building} value={filters.branch_id} onChange={(v) => handleFilterChange('branch_id', v)} options={branches} disabled={dropdownLoading} placeholder="All Branches" />
                                                                <FilterSelect label="Department" icon={Users} value={filters.department_id} onChange={(v) => handleFilterChange('department_id', v)} options={departments} disabled={dropdownLoading} placeholder="All Departments" />
                                                                <FilterSelect label="Designation" icon={Award} value={filters.designation_id} onChange={(v) => handleFilterChange('designation_id', v)} options={designations} disabled={dropdownLoading} placeholder="All Designations" />
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2 p-4 border-t border-[var(--color-border-secondary)]">
                                                            <button
                                                                onClick={() => { setFilterDropdown(false); handleGenerateReport(); }}
                                                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[var(--color-primary-dark)] text-[var(--color-text-white)] rounded-lg hover:bg-[var(--color-primary-darker)] transition-colors text-sm font-medium">
                                                                <Filter className="h-4 w-4" /> Apply Filters
                                                            </button>
                                                            <button onClick={() => { resetAll(); setFilterDropdown(false); }} className="flex items-center justify-center gap-2 px-4 py-2 bg-[var(--color-bg-gray-light)] text-[var(--color-text-secondary)] rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors text-sm font-medium min-w-[90px]">
                                                                Reset
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Mobile */}
                                                    <div className="sm:hidden fixed inset-0 z-[110] flex">
                                                        <div className="ml-auto h-full w-full bg-[var(--color-bg-secondary)] flex flex-col">
                                                            <div className="flex items-center justify-between p-4 border-b border-[var(--color-border-secondary)]">
                                                                <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Filter Exceptions</h3>
                                                                <button onClick={() => setFilterDropdown(false)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] p-1 rounded-lg hover:bg-[var(--color-bg-hover)]">
                                                                    <X className="h-5 w-5" />
                                                                </button>
                                                            </div>
                                                            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 gap-4">
                                                                <FilterSelect label="Branch" icon={Building} value={filters.branch_id} onChange={(v) => handleFilterChange('branch_id', v)} options={branches} disabled={dropdownLoading} placeholder="All Branches" />
                                                                <FilterSelect label="Department" icon={Users} value={filters.department_id} onChange={(v) => handleFilterChange('department_id', v)} options={departments} disabled={dropdownLoading} placeholder="All Departments" />
                                                                <FilterSelect label="Designation" icon={Award} value={filters.designation_id} onChange={(v) => handleFilterChange('designation_id', v)} options={designations} disabled={dropdownLoading} placeholder="All Designations" />
                                                            </div>
                                                            <div className="p-4 border-t border-[var(--color-border-secondary)] grid grid-cols-1 gap-2">
                                                                <button onClick={() => { setFilterDropdown(false); handleGenerateReport(); }} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[var(--color-primary-dark)] text-[var(--color-text-white)] rounded-lg hover:bg-[var(--color-primary-darker)] transition-colors text-sm font-medium">
                                                                    <Filter className="h-4 w-4" /> Apply Filters
                                                                </button>
                                                                <button onClick={() => { resetAll(); setFilterDropdown(false); }} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[var(--color-bg-gray-light)] text-[var(--color-text-secondary)] rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors text-sm font-medium">
                                                                    Reset
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </>,
                                                document.body
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ── Tab strip ── */}
                            <div className="flex border-b border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] overflow-x-auto">
                                {TABS.map((tab) => {
                                    const Icon = tab.icon;
                                    const isActive = activeTab === tab.key;
                                    return (
                                        <button
                                            key={tab.key}
                                            type="button"
                                            onClick={() => setActiveTab(tab.key)}
                                            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${isActive ? `border-[var(--color-primary-dark)] text-[var(--color-primary-dark)]` : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'}`}
                                        >
                                            <Icon className={`h-4 w-4 ${isActive ? tab.color : ''}`} />
                                            {tab.label}
                                            <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${isActive ? tab.badge : 'bg-[var(--color-bg-gray-light)] text-[var(--color-text-muted)]'}`}>
                                                {summaryCounts[tab.key]}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* ── Table ── */}
                            <div className="overflow-x-auto">
                                {loading ? (
                                    <div className="p-12 text-center text-[var(--color-text-secondary)]">
                                        <div className="flex items-center justify-center gap-3">
                                            <Loader2 className="h-8 w-8 animate-spin" />
                                            Loading...
                                        </div>
                                    </div>
                                ) : activeData.length === 0 ? (
                                    <div className="p-12 text-center">
                                        <div className={`inline-flex p-4 rounded-full ${currentTab?.bg || 'bg-gray-50'} mb-4`}>
                                            {currentTab && <currentTab.icon className={`h-8 w-8 ${currentTab.color}`} />}
                                        </div>
                                        <p className="text-[var(--color-text-secondary)] font-medium">
                                            {activeTab === 'all_employees' ? 'No employees found' : `No ${currentTab?.label} exceptions found`}
                                        </p>
                                        <p className="text-sm text-[var(--color-text-muted)] mt-1">
                                            {searchQuery ? 'Try a different search term' : `No exceptions for ${formatMonthYear(monthYear)}`}
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        <table className="w-full min-w-[900px]">
                                            <thead className="bg-[var(--color-bg-gray-light)] border-b border-[var(--color-border-secondary)]">
                                                <tr>
                                                    {renderTableHead().map((col) => (
                                                        <th key={col.key} className="px-4 py-3 text-center text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                                                            {col.label}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="bg-[var(--color-bg-secondary)] divide-y divide-[var(--color-border-secondary)]">
                                                {paginatedData.map((emp, idx) => renderTableRow(emp, idx))}
                                                {Array.from({ length: emptyRowCount }).map((_, i) => (
                                                    <tr key={`empty-${i}`} className="hover:bg-[var(--color-bg-hover)] transition-colors">
                                                        {renderTableHead().map((col) => (
                                                            <td key={col.key} className="px-4 py-6 text-center text-sm text-transparent">—</td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>

                                        <Pagination
                                            currentPage={currentPage}
                                            totalPages={totalPages}
                                            onPageChange={setCurrentPage}
                                            loading={loading}
                                        />
                                    </>
                                )}
                            </div>

                            {/* ── Footer legend ── */}
                            <div className="px-6 py-4 border-t border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)]">
                                <div className="flex flex-wrap justify-end items-center gap-4 text-sm text-[var(--color-text-secondary)]">
                                    {TABS.map((tab) => (
                                        <span key={tab.key} className="flex items-center gap-1.5">
                                            <tab.icon className={`h-3.5 w-3.5 ${tab.color}`} />
                                            {tab.label} ({summaryCounts[tab.key]})
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

// ─── Reusable sub-components ──────────────────────────────────────────────────
const FilterSelect = ({ label, icon: Icon, value, onChange, options, disabled, placeholder }) => (
    <div>
        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
            <Icon className="inline h-4 w-4 mr-1" />
            {label}
        </label>
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-dark)] focus:border-transparent text-[var(--color-text-primary)] text-sm"
            disabled={disabled}
        >
            <option value="">{placeholder}</option>
            {options.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
            ))}
        </select>
    </div>
);

export default MonthlyExceptionReport;