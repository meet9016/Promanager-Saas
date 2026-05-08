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
    CheckCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosInstance';
import { createPortal } from 'react-dom';
import { exportExceptionToPDF } from '../../utils/exportUtils/ExceptionReport/pdfExport';
import { exportExceptionToExcel } from '../../utils/exportUtils/ExceptionReport/excelExport';
import { Toast } from '../../Components/ui/Toast';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Pagination from '../../Components/Pagination';

// ─── Floating anchor helpers (same pattern as DailyReport) ───────────────────
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

// ─── Tab config ──────────────────────────────────────────────────────────────
const TABS = [
    {
        key: 'all_employees',
        label: 'All Employees',
        icon: Users,
        color: 'text-primary-600',
        bg: 'bg-primary-50',
        badge: 'bg-primary-100 text-primary-700',
        borderColor: 'border-primary-400',
        description: 'All employees with exception highlights'
    },
    {
        key: 'late_coming',
        label: 'Late Coming',
        icon: Clock,
        color: 'text-yellow-600',
        bg: 'bg-yellow-50',
        activeBg: 'bg-yellow-500',
        badge: 'bg-yellow-100 text-yellow-700',
        borderColor: 'border-yellow-400',
        description: 'Employees who clocked in after their shift start time'
    },
    {
        key: 'early_going',
        label: 'Early Going',
        icon: LogOut,
        color: 'text-orange-600',
        bg: 'bg-orange-50',
        activeBg: 'bg-orange-500',
        badge: 'bg-orange-100 text-orange-700',
        borderColor: 'border-orange-400',
        description: 'Employees who clocked out before their shift end time'
    },
    {
        key: 'short_hours',
        label: 'Short Hours',
        icon: TrendingDown,
        color: 'text-red-600',
        bg: 'bg-red-50',
        activeBg: 'bg-red-500',
        badge: 'bg-red-100 text-red-700',
        borderColor: 'border-red-400',
        description: 'Employees who worked fewer hours than required'
    },
    {
        key: 'missed_punch',
        label: 'Missed Punch',
        icon: AlertTriangle,
        color: 'text-purple-600',
        bg: 'bg-purple-50',
        activeBg: 'bg-purple-500',
        badge: 'bg-purple-100 text-purple-700',
        borderColor: 'border-purple-400',
        description: 'Employees with incomplete clock in/out records'
    }
];

// ─── Helper: parse "Xh Ym" → total minutes ───────────────────────────────────
const parseHoursToMinutes = (str) => {
    if (!str || str === '--' || str === '0h 0m') return 0;
    const match = str.match(/(\d+)h\s*(\d+)m/);
    if (!match) return 0;
    return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
};

// ─── Classify a record into exception types ──────────────────────────────────
const classifyExceptions = (emp) => {
    const exceptions = [];

    // Late Coming: is_late flag OR late_coming_minutes > 0
    if (emp.is_late || parseInt(emp.late_coming_minutes || 0, 10) > 0) {
        exceptions.push('late_coming');
    }

    // Early Going: is_early_going flag OR early_going_minutes > 0
    if (emp.is_early_going || parseInt(emp.early_going_minutes || 0, 10) > 0) {
        exceptions.push('early_going');
    }

    // Short Hours: attendance_hours < shift_working_hours (and employee was present/had some punch)
    const attMins = parseHoursToMinutes(emp.attandance_hours);
    const shiftMins = parseHoursToMinutes(emp.shift_working_hours);
    const hasAnyPunch = emp.attandance_first_clock_in && emp.attandance_first_clock_in !== '--';
    if (hasAnyPunch && shiftMins > 0 && attMins < shiftMins) {
        exceptions.push('short_hours');
    }

    // Missed Punch: has clock-in but no clock-out, or has clock-out but no clock-in,
    // or attendance_history has odd number of entries
    const clockIn = emp.attandance_first_clock_in;
    const clockOut = emp.attandance_last_clock_out;
    const historyCount = (emp.attendance_history || []).length;
    const hasMissedPunch =
        (clockIn && !clockOut) ||
        (!clockIn && clockOut) ||
        (historyCount > 0 && historyCount % 2 !== 0);
    if (hasMissedPunch) {
        exceptions.push('missed_punch');
    }

    return exceptions;
};

// ─── Main Component ───────────────────────────────────────────────────────────
const AttendanceExceptionReport = () => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [attendanceData, setAttendanceData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dropdownLoading, setDropdownLoading] = useState(false);
    const [error, setError] = useState(null);

    const [activeTab, setActiveTab] = useState('all_employees');
    const [searchQuery, setSearchQuery] = useState('');
    const [exportDropdown, setExportDropdown] = useState(false);
    const [filterDropdown, setFilterDropdown] = useState(false);
    const [toast, setToast] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;

    const [appliedFilters, setAppliedFilters] = useState({
        branch_id: '', department_id: '', designation_id: '', shift_id: ''
    });
    const [filters, setFilters] = useState({
        branch_id: '', department_id: '', designation_id: '', shift_id: ''
    });

    const [branches, setBranches] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [designations, setDesignations] = useState([]);
    const [shifts, setShifts] = useState([]);

    const navigate = useNavigate();
    const { user } = useAuth();

    const exportBtnRef = useRef(null);
    const filterBtnRef = useRef(null);
    const exportPos = useAnchoredPosition(exportBtnRef, exportDropdown, { placement: 'bottom-end', offset: 10, minWidth: 192 });
    const filterPos = useAnchoredPosition(filterBtnRef, filterDropdown, { placement: 'bottom-end', offset: 10, minWidth: 420 });

    const showToast = (message, type = 'info') => setToast({ message, type });
    const closeToast = () => setToast(null);

    const formatDate = (dateObj) => {
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // ── Fetch dropdown options ────────────────────────────────────────────────
    const fetchDropdownData = useCallback(async () => {
        try {
            setDropdownLoading(true);
            if (!user?.user_id) throw new Error('User ID is required');
            const formData = new FormData();
            formData.append('user_id', user.user_id);
            const resp = await api.post('employee_drop_down_list', formData);
            if (resp.data?.success && resp.data.data) {
                const d = resp.data.data;
                setBranches((d.branch_list || []).map((b) => ({ id: b.branch_id, name: b.name })));
                setDepartments((d.department_list || []).map((dep) => ({ id: dep.department_id, name: dep.name })));
                setDesignations((d.designation_list || []).map((des) => ({ id: des.designation_id, name: des.name })));
                setShifts((d.shift_list || []).map((s) => ({ id: s.shift_id ?? s.id, name: s.name ?? s.shift_name })));
            } else {
                throw new Error(resp.data?.message || 'Failed to fetch dropdowns');
            }
        } catch (err) {
            showToast(err.message || 'Failed to load filter options', 'error');
        } finally {
            setDropdownLoading(false);
        }
    }, [user?.user_id]);

    // ── Fetch daily report and derive exceptions ──────────────────────────────
    const fetchReport = useCallback(async (date, applied = {}) => {
        if (!user?.user_id) return;
        setLoading(true);
        setError(null);
        try {
            const formData = new FormData();
            formData.append('user_id', user.user_id);
            formData.append('date', date);
            if (applied.branch_id) formData.append('branch_id', applied.branch_id);
            if (applied.department_id) formData.append('department_id', applied.department_id);
            if (applied.designation_id) formData.append('designation_id', applied.designation_id);
            if (applied.shift_id) formData.append('shift_id', applied.shift_id);

            const res = await api.post('daily_attendance_report_list', formData);
            if (res.data?.success && res.data?.data) {
                const rows = Array.isArray(res.data.data.attendance_details)
                    ? res.data.data.attendance_details
                    : [];
                setAttendanceData(rows);
            } else {
                throw new Error(res.data?.message || 'Failed to fetch report');
            }
        } catch (err) {
            const msg = err.message || 'An error occurred while fetching the report';
            setError(msg);
            showToast(msg, 'error');
        } finally {
            setLoading(false);
        }
    }, [user?.user_id]);

    useEffect(() => { fetchDropdownData(); }, [fetchDropdownData]);
    useEffect(() => { fetchReport(formatDate(selectedDate)); }, [selectedDate, user?.user_id, fetchReport]);

    // ── Classify all records into exception buckets ───────────────────────────
    const exceptionMap = useMemo(() => {
        const map = { all_employees: [], late_coming: [], early_going: [], short_hours: [], missed_punch: [] };
        attendanceData.forEach((emp) => {
            const types = classifyExceptions(emp);
            // All Employees tab — every record, with exception_types attached
            map.all_employees.push({ ...emp, exception_types: types });
            // Exception tabs — only records that match
            types.forEach((type) => {
                map[type].push({ ...emp, exception_types: types });
            });
        });
        return map;
    }, [attendanceData]);

    // ── Summary counts ────────────────────────────────────────────────────────
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

    useEffect(() => { setCurrentPage(1); }, [activeTab, searchQuery, appliedFilters, selectedDate]);

    // ── Filter helpers ────────────────────────────────────────────────────────
    const handleFilterChange = (name, value) => setFilters((prev) => ({ ...prev, [name]: value }));
    const getActiveFiltersCount = () => Object.values(appliedFilters).filter((v) => v !== '').length;

    const applyFilters = () => {
        setAppliedFilters(filters);
        setCurrentPage(1);
        fetchReport(formatDate(selectedDate), filters);
        setFilterDropdown(false);
        showToast('Filters applied', 'success');
    };

    const resetFilters = () => {
        const empty = { branch_id: '', department_id: '', designation_id: '', shift_id: '' };
        setFilters(empty);
        setAppliedFilters(empty);
        setCurrentPage(1);
        setFilterDropdown(false);
        showToast('Filters reset', 'success');
        fetchReport(formatDate(selectedDate), empty);
    };

    // ── Exports ───────────────────────────────────────────────────────────────
    const handleExportToExcel = useCallback(() => {
        try {
            if (!activeData || activeData.length === 0) {
                showToast('No data available to export', 'error');
                return;
            }
            const allTabs = [{ key: 'all_employees', label: 'All Employees' }, ...TABS];
            const tabLabel = allTabs.find((t) => t.key === activeTab)?.label || activeTab;
            const exportKey = activeTab === 'all_employees' ? 'all_employees' : activeTab;
            exportExceptionToExcel(activeData, selectedDate, exportKey, tabLabel, `exception_report_${exportKey}_${formatDate(selectedDate)}`);
            showToast('Excel exported successfully!', 'success');
            setExportDropdown(false);
        } catch (err) {
            showToast('Failed to export Excel: ' + err.message, 'error');
            setExportDropdown(false);
        }
    }, [activeData, selectedDate, activeTab]);

    const handleExportToPDF = useCallback(async () => {
        try {
            if (!activeData || activeData.length === 0) {
                showToast('No data available to export', 'error');
                return;
            }
            showToast('Generating PDF...', 'info');
            const allTabs = [{ key: 'all_employees', label: 'All Employees' }, ...TABS];
            const tabLabel = allTabs.find((t) => t.key === activeTab)?.label || activeTab;
            const exportKey = activeTab === 'all_employees' ? 'all_employees' : activeTab;
            await exportExceptionToPDF(activeData, selectedDate, exportKey, tabLabel, `exception_report_${exportKey}_${formatDate(selectedDate)}`);
            showToast('PDF exported successfully!', 'success');
            setExportDropdown(false);
        } catch (err) {
            showToast('Failed to export PDF: ' + err.message, 'error');
            setExportDropdown(false);
        }
    }, [activeData, selectedDate, activeTab]);

    const handleClearSearch = useCallback(() => setSearchQuery(''), []);

    // ── Column renderer per tab ───────────────────────────────────────────────
    const renderTableHead = () => {
        if (activeTab === 'all_employees') {
            return [
                { label: '#', key: 'sno' },
                { label: 'Employee', key: 'employee' },
                { label: 'Shift', key: 'shift' },
                { label: 'Clock In', key: 'clock_in' },
                { label: 'Clock Out', key: 'clock_out' },
                { label: 'Working Hrs', key: 'working_hrs' },
                { label: 'Attendance Hrs', key: 'attendance_hrs' },
                { label: 'Status', key: 'status' },
                { label: 'Exception Details', key: 'exceptions' },
            ];
        }

        const baseHeaders = [
            { label: '#', key: 'sno' },
            { label: 'Employee', key: 'employee' },
            { label: 'Shift', key: 'shift' },
            { label: 'Shift Time', key: 'shift_time' },
            { label: 'Clock In', key: 'clock_in' },
            { label: 'Clock Out', key: 'clock_out' },
        ];

        const extraHeaders = {
            late_coming: [{ label: 'Late By', key: 'late_by' }, { label: 'Status', key: 'status' }],
            early_going: [{ label: 'Left Early By', key: 'early_by' }, { label: 'Status', key: 'status' }],
            short_hours: [{ label: 'Required Hrs', key: 'required_hrs' }, { label: 'Worked Hrs', key: 'worked_hrs' }, { label: 'Short By', key: 'short_by' }, { label: 'Status', key: 'status' }],
            missed_punch: [{ label: 'Punch Count', key: 'punch_count' }, { label: 'Status', key: 'status' }],
        };

        return [...baseHeaders, ...(extraHeaders[activeTab] || [])];
    };

    // ── Compute short-by for a single employee ────────────────────────────────
    const getShortBy = (emp) => {
        const attMins = parseHoursToMinutes(emp.attandance_hours);
        const shiftMins = parseHoursToMinutes(emp.shift_working_hours);
        const diff = shiftMins - attMins;
        if (diff <= 0) return null;
        return `${Math.floor(diff / 60)}h ${diff % 60}m`;
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
            const shortBy = getShortBy(emp);

            // Build rich exception detail items
            const exDetails = [];
            if (exTypes.includes('late_coming') && emp.late_coming_time && emp.late_coming_time !== '0h 0m') {
                exDetails.push({
                    key: 'late',
                    pill: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
                    label: 'Late',
                    value: emp.late_coming_time,
                    valueColor: 'text-yellow-700',
                });
            }
            if (exTypes.includes('early_going') && emp.early_going_time && emp.early_going_time !== '0h 0m') {
                exDetails.push({
                    key: 'early',
                    pill: 'bg-orange-100 text-orange-800 border border-orange-300',
                    label: 'Early',
                    value: emp.early_going_time,
                    valueColor: 'text-orange-700',
                });
            }
            if (exTypes.includes('short_hours') && shortBy) {
                exDetails.push({
                    key: 'short',
                    pill: 'bg-red-100 text-red-800 border border-red-300',
                    label: 'Short',
                    value: shortBy,
                    valueColor: 'text-red-700',
                });
            }
            if (exTypes.includes('missed_punch')) {
                const punches = (emp.attendance_history || []).length;
                exDetails.push({
                    key: 'missed',
                    pill: 'bg-purple-100 text-purple-800 border border-purple-300',
                    label: 'Missed Punch',
                    value: `${punches} punch${punches !== 1 ? 'es' : ''}`,
                    valueColor: 'text-purple-700',
                });
            }

            return (
                <tr key={emp.employee_id || emp.employee_code || idx}
                    className={`hover:bg-[var(--color-bg-hover)] transition-colors ${rowClass}`}>

                    {/* # */}
                    <td className="px-4 py-3 text-center text-sm text-[var(--color-text-muted)]">{sno}</td>

                    {/* Employee */}
                    <td className="px-4 py-3">
                        <div className="flex flex-col items-start">
                            <span className="font-medium text-sm text-[var(--color-text-primary)]" title={emp.employee_name}>
                                {emp.employee_name || '--'}
                            </span>
                            <span className="text-xs text-[var(--color-text-secondary)] mt-0.5">{emp.employee_code || '--'}</span>
                        </div>
                    </td>

                    {/* Shift */}
                    <td className="px-4 py-3 text-center text-sm text-[var(--color-text-primary)]">
                        <div className="flex flex-col items-center gap-0.5">
                            <span>{emp.shift_name || '--'}</span>
                            {emp.shift_from_time && emp.shift_to_time && (
                                <span className="text-xs text-[var(--color-text-muted)]">
                                    {emp.shift_from_time} – {emp.shift_to_time}
                                </span>
                            )}
                        </div>
                    </td>

                    {/* Clock In */}
                    <td className="px-4 py-3 text-center text-sm">
                        <span className={exTypes.includes('late_coming') ? 'font-semibold text-yellow-700' : 'text-[var(--color-text-primary)]'}>
                            {emp.attandance_first_clock_in || '--'}
                        </span>
                    </td>

                    {/* Clock Out */}
                    <td className="px-4 py-3 text-center text-sm">
                        <span className={exTypes.includes('early_going') ? 'font-semibold text-orange-700' : 'text-[var(--color-text-primary)]'}>
                            {emp.attandance_last_clock_out || '--'}
                        </span>
                    </td>

                    {/* Working Hrs */}
                    <td className="px-4 py-3 text-center text-sm text-[var(--color-text-secondary)]">
                        {emp.shift_working_hours || '--'}
                    </td>

                    {/* Attendance Hrs */}
                    <td className="px-4 py-3 text-center text-sm">
                        <span className={exTypes.includes('short_hours') ? 'font-semibold text-red-700' : 'text-[var(--color-text-secondary)]'}>
                            {emp.attandance_hours || '--'}
                        </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 text-center text-sm">
                        <StatusBadge status={emp.status} />
                    </td>

                    {/* Exception Details */}
                    <td className="px-4 py-3">
                        {exDetails.length === 0 ? (
                            !emp.attandance_first_clock_in ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-300">
                                    No Punch
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-300">
                                    <CheckCircle className="h-3.5 w-3.5" />
                                    On Time
                                </span>
                            )
                        ) : (
                            <div className="flex flex-col gap-1.5">
                                {exDetails.map((ex) => (
                                    <div key={ex.key} className="flex items-center gap-1.5">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${ex.pill}`}>
                                            {ex.label}
                                        </span>
                                        <span className={`text-xs font-semibold ${ex.valueColor}`}>
                                            by {ex.value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </td>
                </tr>
            );
        }

        // ── Exception tabs ────────────────────────────────────────────────────
        const shortMins = (() => {
            const attMins = parseHoursToMinutes(emp.attandance_hours);
            const shiftMins = parseHoursToMinutes(emp.shift_working_hours);
            const diff = shiftMins - attMins;
            if (diff <= 0) return '--';
            const h = Math.floor(diff / 60);
            const m = diff % 60;
            return `${h}h ${m}m`;
        })();

        const extraCells = {
            late_coming: (
                <>
                    <td className="px-4 py-3 text-center text-sm font-semibold text-yellow-700">
                        {emp.late_coming_time || '--'}
                    </td>
                    <td className="px-4 py-3 text-center text-sm">
                        <StatusBadge status={emp.status} />
                    </td>
                </>
            ),
            early_going: (
                <>
                    <td className="px-4 py-3 text-center text-sm font-semibold text-orange-700">
                        {emp.early_going_time || '--'}
                    </td>
                    <td className="px-4 py-3 text-center text-sm">
                        <StatusBadge status={emp.status} />
                    </td>
                </>
            ),
            short_hours: (
                <>
                    <td className="px-4 py-3 text-center text-sm text-[var(--color-text-secondary)]">
                        {emp.shift_working_hours || '--'}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-[var(--color-text-secondary)]">
                        {emp.attandance_hours || '--'}
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-semibold text-red-700">
                        {shortMins}
                    </td>
                    <td className="px-4 py-3 text-center text-sm">
                        <StatusBadge status={emp.status} />
                    </td>
                </>
            ),
            missed_punch: (
                <>
                    <td className="px-4 py-3 text-center text-sm font-semibold text-purple-700">
                        {(emp.attendance_history || []).length} punch{(emp.attendance_history || []).length !== 1 ? 'es' : ''}
                    </td>
                    <td className="px-4 py-3 text-center text-sm">
                        <StatusBadge status={emp.status} />
                    </td>
                </>
            )
        };

        return (
            <tr key={emp.employee_id || emp.employee_code || idx}
                className="hover:bg-[var(--color-bg-hover)] transition-colors border-b border-[var(--color-border-secondary)]">
                <td className="px-4 py-3 text-center text-sm text-[var(--color-text-muted)]">{sno}</td>
                <td className="px-4 py-3">
                    <div className="flex flex-col items-start">
                        <span className="font-medium text-sm text-[var(--color-text-primary)] truncate max-w-[160px]" title={emp.employee_name}>{emp.employee_name || '--'}</span>
                        <span className="text-xs text-[var(--color-text-secondary)]">{emp.employee_code || '--'}</span>
                    </div>
                </td>
                <td className="px-4 py-3 text-center text-sm text-[var(--color-text-primary)]">{emp.shift_name || '--'}</td>
                <td className="px-4 py-3 text-center text-sm text-[var(--color-text-secondary)]">
                    {emp.shift_from_time && emp.shift_to_time ? `${emp.shift_from_time} – ${emp.shift_to_time}` : '--'}
                </td>
                <td className="px-4 py-3 text-center text-sm text-[var(--color-text-primary)]">{emp.attandance_first_clock_in || '--'}</td>
                <td className="px-4 py-3 text-center text-sm text-[var(--color-text-primary)]">{emp.attandance_last_clock_out || '--'}</td>
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
                                    <h1 className="text-2xl font-bold text-[var(--color-text-white)]">Attendance Exception Report</h1>
                                </div>
                            </div>
                            {/* Export button */}
                            <div className="relative">
                                <button
                                    ref={exportBtnRef}
                                    onClick={() => setExportDropdown((v) => !v)}
                                    className="flex items-center gap-2 bg-[var(--color-bg-secondary)] text-[var(--color-primary-dark)] hover:bg-[var(--color-bg-primary)] px-4 py-2 rounded-lg font-medium transition-colors"
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
                                            <button onClick={handleExportToExcel} className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-[var(--color-bg-hover)] transition-colors text-[var(--color-text-primary)]">
                                                <FileSpreadsheet className="h-4 w-4 text-primary-600" />
                                                Export to Excel
                                            </button>
                                            <button onClick={handleExportToPDF} className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-[var(--color-bg-hover)] transition-colors text-[var(--color-text-primary)]">
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

                {/* ── Summary cards ── */}
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
                                {/* Date Picker */}
                                <div className="flex items-center space-x-2">
                                    <Calendar className="w-5 h-5 text-white" />
                                    <DatePicker
                                        selected={selectedDate}
                                        onChange={(date) => setSelectedDate(date)}
                                        dateFormat="dd-MM-yyyy"
                                        placeholderText="DD-MM-YYYY"
                                        className="w-full bg-[var(--color-bg-secondary-20)] border border-[var(--color-bg-secondary-30)] rounded-lg px-3 py-2 text-sm text-[var(--color-text-white)] placeholder-[var(--color-text-white-90)] focus:outline-none focus:ring-2 focus:ring-[var(--color-bg-secondary-30)]"
                                    />
                                </div>

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
                                                {dropdownLoading && (
                                                    <div className="flex items-center gap-2 p-4 text-[var(--color-text-secondary)] border-b border-[var(--color-border-secondary)]">
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                        <span className="text-sm">Loading filter options...</span>
                                                    </div>
                                                )}
                                                <div className="flex-1 overflow-y-auto p-4">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <FilterSelect label="Branch" icon={Building} value={filters.branch_id} onChange={(v) => handleFilterChange('branch_id', v)} options={branches} disabled={dropdownLoading} placeholder="All Branches" />
                                                        <FilterSelect label="Department" icon={Users} value={filters.department_id} onChange={(v) => handleFilterChange('department_id', v)} options={departments} disabled={dropdownLoading} placeholder="All Departments" />
                                                        <FilterSelect label="Designation" icon={Award} value={filters.designation_id} onChange={(v) => handleFilterChange('designation_id', v)} options={designations} disabled={dropdownLoading} placeholder="All Designations" />
                                                        <FilterSelect label="Shift" icon={Timer} value={filters.shift_id} onChange={(v) => handleFilterChange('shift_id', v)} options={shifts} disabled={dropdownLoading} placeholder="All Shifts" />
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 p-4 border-t border-[var(--color-border-secondary)]">
                                                    <button onClick={applyFilters} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[var(--color-primary-dark)] text-[var(--color-text-white)] rounded-lg hover:bg-[var(--color-primary-darker)] transition-colors text-sm font-medium">
                                                        <Filter className="h-4 w-4" /> Apply Filters
                                                    </button>
                                                    <button onClick={resetFilters} className="flex items-center justify-center gap-2 px-4 py-2 bg-[var(--color-bg-gray-light)] text-[var(--color-text-secondary)] rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors text-sm font-medium min-w-[90px]">
                                                        Reset
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Mobile filter panel */}
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
                                                        <FilterSelect label="Shift" icon={Timer} value={filters.shift_id} onChange={(v) => handleFilterChange('shift_id', v)} options={shifts} disabled={dropdownLoading} placeholder="All Shifts" />
                                                    </div>
                                                    <div className="p-4 border-t border-[var(--color-border-secondary)] grid grid-cols-1 gap-2">
                                                        <button onClick={applyFilters} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[var(--color-primary-dark)] text-[var(--color-text-white)] rounded-lg hover:bg-[var(--color-primary-darker)] transition-colors text-sm font-medium">
                                                            <Filter className="h-4 w-4" /> Apply Filters
                                                        </button>
                                                        <button onClick={resetFilters} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[var(--color-bg-gray-light)] text-[var(--color-text-secondary)] rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors text-sm font-medium">
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
                                    {searchQuery ? 'Try a different search term' : `No data for ${formatDate(selectedDate)}`}
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
                                        {paginatedData.map((emp, idx) => renderTableRow(emp, idx, currentPage))}
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

const StatusBadge = ({ status }) => {
    const map = {
        Present: 'bg-green-100 text-green-800',
        Absent: 'bg-red-100 text-red-800',
        'Week Off': 'bg-purple-100 text-purple-800',
        Leave: 'bg-yellow-100 text-yellow-800',
        'Half Day': 'bg-primary-100 text-primary-800',
        Overtime: 'bg-primary-100 text-primary-800',
        Incomplete: 'bg-orange-100 text-orange-800',
    };
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${map[status] || 'bg-gray-100 text-gray-800'}`}>
            {status || '--'}
        </span>
    );
};

export default AttendanceExceptionReport;