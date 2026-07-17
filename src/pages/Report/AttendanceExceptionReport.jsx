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
    RefreshCw,
    User
} from 'lucide-react';
import NoDataFound from '../../Components/comman/NoDataFound';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosInstance';
import { createPortal } from 'react-dom';
import { exportExceptionToPDF } from '../../utils/exportUtils/ExceptionReport/pdfExport';
import { exportExceptionToExcel } from '../../utils/exportUtils/ExceptionReport/excelExport';
import { Toast } from '../../Components/ui/Toast';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Pagination from '../../Components/Pagination';
import { Table, TableHeader, TableBody, TableRow, TableHeaderRow, Th, Td } from '../../Components/ui/Table';
import CustomDatePicker from '../../Components/comman/CustomDatePicker';
import CustomSelect from '../../Components/comman/CustomSelect';
import CustomInput from '../../Components/comman/CustomInput';
import LoadingSpinner from '../../Components/Loader/LoadingSpinner';

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

    const SummaryCard = ({ label, value, icon: Icon, tone = 'text-[var(--color-text-primary)]', onClick, isActive = false }) => {
        // Map tone classes to a rich color scheme
        const getScheme = (t) => {
            const tones = {
                'text-green-600': {
                    base: 'green', light: 'bg-green-500/10', border: 'border-green-500/20',
                    accent: 'bg-green-500', icon: 'text-green-600'
                },
                'text-red-600': {
                    base: 'red', light: 'bg-red-500/10', border: 'border-red-500/20',
                    accent: 'bg-red-500', icon: 'text-red-600'
                },
                'text-purple-600': {
                    base: 'purple', light: 'bg-purple-500/10', border: 'border-purple-500/20',
                    accent: 'bg-purple-500', icon: 'text-purple-600'
                },
                'text-orange-600': {
                    base: 'orange', light: 'bg-orange-500/10', border: 'border-orange-500/20',
                    accent: 'bg-orange-500', icon: 'text-orange-600'
                },
                'text-amber-600': {
                    base: 'amber', light: 'bg-amber-500/10', border: 'border-amber-500/20',
                    accent: 'bg-amber-500', icon: 'text-amber-600'
                },
                'text-yellow-600': {
                    base: 'amber', light: 'bg-amber-500/10', border: 'border-amber-500/20',
                    accent: 'bg-amber-500', icon: 'text-amber-600'
                },
                'text-primary-600': {
                    base: 'indigo', light: 'bg-indigo-500/10', border: 'border-indigo-500/20',
                    accent: 'bg-indigo-500', icon: 'text-indigo-600'
                },
                'text-teal-600': {
                    base: 'teal', light: 'bg-teal-500/10', border: 'border-teal-500/20',
                    accent: 'bg-teal-500', icon: 'text-teal-600'
                },
            };
            return tones[t] || {
                base: 'blue', light: 'bg-blue-500/10', border: 'border-blue-500/20',
                accent: 'bg-blue-500', icon: 'text-blue-600'
            };
        };

        const scheme = getScheme(tone);

        return (
            <div
                onClick={onClick}
                className={`relative overflow-hidden rounded-xl p-2 sm:p-3 transition-all duration-300 select-none group
            ${onClick ? 'cursor-pointer' : ''}
            ${isActive
                        ? `bg-[var(--color-bg-secondary)] shadow-md ring-1 ring-inset ${scheme.border.replace('/20', '/40')} -translate-y-0.5`
                        : 'bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] hover:shadow-md hover:-translate-y-0.5'
                    }`}
            >
                {/* Decorative background glow */}
                <div className={`absolute -right-6 -top-6 h-12 w-12 rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-10 ${scheme.accent} blur-xl`} />

                <div className="flex items-center gap-2 sm:gap-3 relative z-10">
                    {/* Icon container */}
                    <div className={`flex-shrink-0 p-1.5 sm:p-2 rounded-lg ${scheme.light} ${scheme.icon} transition-all duration-500 group-hover:scale-110 shadow-sm border border-white/5`}>
                        <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>

                    {/* Text content */}
                    <div className="min-w-0 flex-1">
                        <p className="text-[10px] sm:text-xs text-[var(--color-text-secondary)] leading-tight truncate opacity-80">
                            {label}
                        </p>
                        <p className={`text-sm sm:text-lg font-bold ${tone} leading-tight truncate`}>
                            {value}
                        </p>
                    </div>

                    {/* Active Indicator */}
                    {isActive && (
                        <div className="flex-shrink-0">
                            <span className={`block h-1.5 w-1.5 rounded-full ${scheme.accent} animate-pulse shadow-sm`} />
                        </div>
                    )}
                </div>

                {/* Interactive Progress Line */}
                <div className={`absolute bottom-0 left-0 h-1 transition-all duration-700 ease-out 
            ${isActive ? 'w-full opacity-100' : 'w-0 opacity-0 group-hover:w-full group-hover:opacity-60'} ${scheme.accent}`} />
            </div>
        );
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
                    pill: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
                    label: 'Late',
                    value: emp.late_coming_time,
                    valueColor: 'text-yellow-700',
                });
            }
            if (exTypes.includes('early_going') && emp.early_going_time && emp.early_going_time !== '0h 0m') {
                exDetails.push({
                    key: 'early',
                    pill: 'bg-orange-50 text-orange-700 border border-orange-200',
                    label: 'Early',
                    value: emp.early_going_time,
                    valueColor: 'text-orange-700',
                });
            }
            if (exTypes.includes('short_hours') && shortBy) {
                exDetails.push({
                    key: 'short',
                    pill: 'bg-red-50 text-red-700 border border-red-200',
                    label: 'Short',
                    value: shortBy,
                    valueColor: 'text-red-700',
                });
            }
            if (exTypes.includes('missed_punch')) {
                const punches = (emp.attendance_history || []).length;
                exDetails.push({
                    key: 'missed',
                    pill: 'bg-purple-50 text-purple-700 border border-purple-200',
                    label: 'Missed',
                    value: `${punches} punch${punches !== 1 ? 'es' : ''}`,
                    valueColor: 'text-purple-700',
                });
            }

            return (
                <TableRow key={emp.employee_id || emp.employee_code || idx}
                    className={`hover:bg-[var(--color-bg-hover)] transition-all duration-200 ${rowClass}`}>

                    {/* # */}
                    <Td className="text-center text-sm font-medium text-[var(--color-text-muted)] w-12">{sno}</Td>

                    {/* Employee */}
                    <Td className="min-w-[180px]">
                        <div className="flex flex-col items-start">
                            <span className="font-semibold text-sm text-[var(--color-text-primary)]" title={emp.employee_name}>
                                {emp.employee_name || '--'}
                            </span>
                            <span className="text-[11px] uppercase tracking-wider text-[var(--color-text-muted)] mt-0.5">{emp.employee_code || '--'}</span>
                        </div>
                    </Td>

                    {/* Shift */}
                    <Td className="text-center text-sm text-[var(--color-text-primary)]">
                        <div className="flex flex-col items-center gap-0.5">
                            <span className="font-medium text-slate-700">{emp.shift_name || '--'}</span>
                            {emp.shift_from_time && emp.shift_to_time && (
                                <span className="text-[11px] text-[var(--color-text-muted)] bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 mt-1">
                                    {emp.shift_from_time} – {emp.shift_to_time}
                                </span>
                            )}
                        </div>
                    </Td>

                    {/* Clock In */}
                    <Td className="text-center text-sm">
                        <span className={exTypes.includes('late_coming') ? 'font-bold text-yellow-600' : 'text-slate-600 font-medium'}>
                            {emp.attandance_first_clock_in || '--'}
                        </span>
                    </Td>

                    {/* Clock Out */}
                    <Td className="text-center text-sm">
                        <span className={exTypes.includes('early_going') ? 'font-bold text-orange-600' : 'text-slate-600 font-medium'}>
                            {emp.attandance_last_clock_out || '--'}
                        </span>
                    </Td>

                    {/* Working Hrs */}
                    <Td className="text-center text-sm font-medium text-slate-500">
                        {emp.shift_working_hours || '--'}
                    </Td>

                    {/* Attendance Hrs */}
                    <Td className="text-center text-sm">
                        <span className={exTypes.includes('short_hours') ? 'font-bold text-red-600' : 'text-slate-600 font-medium'}>
                            {emp.attandance_hours || '--'}
                        </span>
                    </Td>

                    {/* Status */}
                    <Td className="text-center text-sm">
                        <StatusBadge status={emp.status} />
                    </Td>

                    {/* Exception Details */}
                    <Td>
                        {exDetails.length === 0 ? (
                            !emp.attandance_first_clock_in ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-bold tracking-wide uppercase bg-red-50 text-red-600 border border-red-200 shadow-sm">
                                    No Punch
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-bold tracking-wide uppercase bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-sm">
                                    <CheckCircle className="h-3.5 w-3.5" />
                                    On Time
                                </span>
                            )
                        ) : (
                            <div className="flex flex-wrap gap-2 max-w-[280px]">
                                {exDetails.map((ex) => (
                                    <div key={ex.key} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md shadow-sm border ${ex.pill}`}>
                                        <span className="text-[11px] font-bold uppercase tracking-wider opacity-80">
                                            {ex.label}
                                        </span>
                                        <span className={`text-[12px] font-black ${ex.valueColor}`}>
                                            {ex.value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Td>
                </TableRow>
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
                    <Td className="text-center text-sm font-semibold text-yellow-700">
                        {emp.late_coming_time || '--'}
                    </Td>
                    <Td className="text-center text-sm">
                        <StatusBadge status={emp.status} />
                    </Td>
                </>
            ),
            early_going: (
                <>
                    <Td className="text-center text-sm font-semibold text-orange-700">
                        {emp.early_going_time || '--'}
                    </Td>
                    <Td className="text-center text-sm">
                        <StatusBadge status={emp.status} />
                    </Td>
                </>
            ),
            short_hours: (
                <>
                    <Td className="text-center text-sm text-[var(--color-text-secondary)]">
                        {emp.shift_working_hours || '--'}
                    </Td>
                    <Td className="text-center text-sm text-[var(--color-text-secondary)]">
                        {emp.attandance_hours || '--'}
                    </Td>
                    <Td className="text-center text-sm font-semibold text-red-700">
                        {shortMins}
                    </Td>
                    <Td className="text-center text-sm">
                        <StatusBadge status={emp.status} />
                    </Td>
                </>
            ),
            missed_punch: (
                <>
                    <Td className="text-center text-sm font-semibold text-purple-700">
                        {(emp.attendance_history || []).length} punch{(emp.attendance_history || []).length !== 1 ? 'es' : ''}
                    </Td>
                    <Td className="text-center text-sm">
                        <StatusBadge status={emp.status} />
                    </Td>
                </>
            )
        };

        return (
            <TableRow key={emp.employee_id || emp.employee_code || idx}
                className="hover:bg-[var(--color-bg-hover)] transition-colors border-b border-[var(--color-border-secondary)]">
                <Td className="text-center text-sm text-[var(--color-text-muted)]">{sno}</Td>
                <Td>
                    <div className="flex flex-col items-start">
                        <span className="font-medium text-sm text-[var(--color-text-primary)] truncate max-w-[160px]" title={emp.employee_name}>{emp.employee_name || '--'}</span>
                        <span className="text-xs text-[var(--color-text-secondary)]">{emp.employee_code || '--'}</span>
                    </div>
                </Td>
                <Td className="text-center text-sm text-[var(--color-text-primary)]">{emp.shift_name || '--'}</Td>
                <Td className="text-center text-sm text-[var(--color-text-secondary)]">
                    {emp.shift_from_time && emp.shift_to_time ? `${emp.shift_from_time} – ${emp.shift_to_time}` : '--'}
                </Td>
                <Td className="text-center text-sm text-[var(--color-text-primary)]">{emp.attandance_first_clock_in || '--'}</Td>
                <Td className="text-center text-sm text-[var(--color-text-primary)]">{emp.attandance_last_clock_out || '--'}</Td>
                {extraCells[activeTab]}
            </TableRow>
        );
    };

    const currentTab = TABS.find((t) => t.key === activeTab);

    return (
        <div className="h-[calc(100vh-64px)] bg-[var(--color-bg-primary)] overflow-hidden">
            {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}

            <div className="p-8  mx-auto h-full flex flex-col overflow-hidden">


                {/* ── Summary cards ── */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-4 mb-4 sm:mb-6">
                    {TABS.map((tab) => (
                        <SummaryCard
                            key={tab.key}
                            icon={tab.icon}
                            label={tab.label}
                            value={summaryCounts[tab.key]}
                            tone={tab.color}
                            isActive={activeTab === tab.key}
                            onClick={() => setActiveTab(tab.key)}
                        />
                    ))}
                </div>

                {/* ── Main content card ── */}
                <div className="bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-primary-dark)] overflow-hidden shadow-sm flex flex-col flex-1 min-h-0">

                    {/* Table toolbar */}
                    <div className="px-6 py-4 border-b border-[var(--color-primary-light)] bg-[var(--color-primary-lighter)]">
                        <div className="flex items-center justify-between flex-nowrap gap-3 w-full">
                            <div className="flex items-center gap-2">
                                {currentTab && <currentTab.icon className="h-5 w-5 text-[var(--color-primary-dark)]" />}
                                <h3 className="text-lg font-medium text-[var(--color-primary-dark)]">{currentTab?.label}</h3>
                                <span className="px-2 py-0.5 bg-white rounded-full text-xs text-[var(--color-primary-dark)] font-medium">
                                    {activeData.length} record{activeData.length !== 1 ? 's' : ''}
                                </span>
                            </div>

                            <div className="flex items-center gap-3 flex-wrap">
                                {/* Date Picker */}

                                {/* Search */}
                                {/* <div className="relative w-full sm:w-56">
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
                                </div> */}
                                <div className="relative w-full sm:w-56">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)] z-10" />
                                    <CustomInput
                                        type="text"
                                        name="searchQuery"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search employees..."
                                        clearable={true}
                                        className="!h-[37px] [&_input]:!h-[40px] [&_input]:!pl-10 [&_input]:!pr-10 [&_input]:!rounded-lg"
                                    />
                                </div>

                                <div className="relative flex items-center z-[40] min-w-[140px] sm:min-w-[160px]">
                                    {/* <Calendar className="absolute left-3 w-4 h-4 text-[var(--color-primary)] pointer-events-none z-10" /> */}

                                    {/* <DatePicker
                                        selected={selectedDate}
                                        onChange={(date) => setSelectedDate(date)}
                                        dateFormat="dd-MM-yyyy"
                                        placeholderText="DD-MM-YYYY"
                                        className="w-full bg-[var(--color-bg-primary)] hover:bg-[var(--color-bg-hover)] border border-[var(--color-border-secondary)] rounded-xl pl-9 pr-3 py-1.5 sm:py-2 text-xs sm:text-sm text-[var(--color-text-primary)] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-dark)] focus:border-transparent transition-all duration-200 cursor-pointer font-medium shadow-sm"
                                    /> */}

                                    <CustomDatePicker
                                        name="selected_date"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(new Date(e.target.value))}
                                        placeholder="DD-MM-YYYY"
                                        maxDate={new Date()}
                                        clearable={true}
                                    />
                                </div>

                                {/* Filter button */}
                                <div className="relative">
                                    <button
                                        ref={filterBtnRef}
                                        onClick={() => setFilterDropdown((v) => !v)}
                                        className="flex items-center gap-2 bg-[var(--color-bg-secondary)] text-[var(--color-primary-dark)] hover:bg-[var(--color-bg-primary)] px-4 py-2 rounded-lg font-medium transition-colors"
                                    >
                                        <Filter className="h-6 w-6" />
                                        <span className="lg:hidden sm:hidden xl:inline">Filters</span>
                                        {getActiveFiltersCount() > 0 && (
                                            <span className="bg-[var(--color-primary-dark)] text-white text-xs rounded-full px-2 py-1">{getActiveFiltersCount()}</span>
                                        )}
                                        <ChevronDown className="h-4 w-4 lg:hidden sm:hidden xl:inline" />
                                    </button>

                                    {filterDropdown && createPortal(
                                        <>
                                            <div className="fixed inset-0 z-[100] bg-black/40" onClick={() => setFilterDropdown(false)} />
                                            <div
                                                className="hidden sm:flex flex-col absolute z-[110] bg-[var(--color-bg-secondary)] rounded-lg shadow-2xl border border-[var(--color-border-secondary)] max-h-[80vh] overflow-visible"
                                                style={{ position: 'absolute', top: filterPos.ready ? filterPos.top : -9999, left: filterPos.ready ? Math.max(12, filterPos.left) : -9999, width: Math.max(420, filterPos.width), minWidth: 420 }}
                                            >
                                                {/* <div className="flex items-center justify-between p-4 border-b border-[var(--color-border-secondary)]">
                                                    <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Filter Exceptions</h3>
                                                    <button onClick={() => setFilterDropdown(false)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] p-1 rounded-lg hover:bg-[var(--color-bg-hover)]">
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div> */}

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
                                                {dropdownLoading && (
                                                    <div className="flex items-center gap-2 p-4 text-[var(--color-text-secondary)] border-b border-[var(--color-border-secondary)]">
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                        <span className="text-sm">Loading filter options...</span>
                                                    </div>
                                                )}
                                                <div className="flex-1 overflow-visible p-4">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <FilterSelect label="Branch" icon={Building} value={filters.branch_id} onChange={(v) => handleFilterChange('branch_id', v)} options={branches} disabled={dropdownLoading} placeholder="All Branches" />
                                                        <FilterSelect label="Department" icon={Users} value={filters.department_id} onChange={(v) => handleFilterChange('department_id', v)} options={departments} disabled={dropdownLoading} placeholder="All Departments" />
                                                        <FilterSelect label="Designation" icon={Award} value={filters.designation_id} onChange={(v) => handleFilterChange('designation_id', v)} options={designations} disabled={dropdownLoading} placeholder="All Designations" />
                                                        <FilterSelect label="Shift" icon={Timer} value={filters.shift_id} onChange={(v) => handleFilterChange('shift_id', v)} options={shifts} disabled={dropdownLoading} placeholder="All Shifts" />
                                                    </div>
                                                </div>
                                                {/* <div className="flex gap-2 p-4 border-t border-[var(--color-border-secondary)]">
                                                    <button onClick={applyFilters} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[var(--color-primary-dark)] text-[var(--color-text-white)] rounded-lg hover:bg-[var(--color-primary-darker)] transition-colors text-sm font-medium">
                                                        <Filter className="h-4 w-4" /> Apply Filters
                                                    </button>
                                                    <button onClick={resetFilters} className="flex items-center justify-center gap-2 px-4 py-2 bg-[var(--color-bg-gray-light)] text-[var(--color-text-secondary)] rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors text-sm font-medium min-w-[90px]">
                                                        Reset
                                                    </button>
                                                </div> */}
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

                                {/* Export */}
                                <div className="relative">
                                    <button
                                        ref={exportBtnRef}
                                        onClick={() => setExportDropdown((v) => !v)}
                                        className="flex items-center gap-2 bg-[var(--color-bg-secondary)] text-[var(--color-primary-dark)] hover:bg-[var(--color-bg-primary)] px-4 py-2 rounded-lg font-medium transition-colors"
                                    >
                                        <Download className="h-6 w-6" />
                                        <span className='lg:hidden sm:hidden xl:inline'>Export</span>
                                        <ChevronDown className="h-4 w-4 lg:hidden sm:hidden xl:inline" />
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
                    <div className="overflow-x-auto flex flex-col flex-1 min-h-0 custom-scrollbar">
                        {loading ? (
                            <div className="p-12 text-center text-[var(--color-text-secondary)]">
                                <div className="flex items-center justify-center gap-3">
                                    {/* <Loader2 className="h-8 w-8 animate-spin" />
                                    Loading... */}
                                    <LoadingSpinner />
                                </div>
                            </div>
                        ) : activeData.length === 0 ? (
                            <div className="flex items-center justify-center p-8 bg-[var(--color-bg-secondary)] rounded-xl shadow-sm">
                                <NoDataFound
                                    title={activeTab === 'all_employees' ? 'No employees found' : `No ${currentTab?.label} exceptions found`}
                                    subtitle={searchQuery ? 'Try a different search term' : `No data for ${formatDate(selectedDate)}`}
                                />
                            </div>
                        ) : (
                            <>
                                <Table className="w-full min-w-[900px]">
                                    <TableHeader className="bg-[var(--color-primary-dark)] border-b border-[var(--color-border-secondary)]">
                                        <TableHeaderRow>
                                            {renderTableHead().map((col) => (
                                                <Th key={col.key} className="text-center font-medium text-white">
                                                    {col.label}
                                                </Th>
                                            ))}
                                        </TableHeaderRow>
                                    </TableHeader>
                                    <TableBody className="bg-[var(--color-bg-secondary)] divide-y divide-[var(--color-border-secondary)]">
                                        {paginatedData.map((emp, idx) => renderTableRow(emp, idx, currentPage))}
                                        {Array.from({ length: emptyRowCount }).map((_, i) => (
                                            <TableRow key={`empty-${i}`} className="hover:bg-[var(--color-bg-hover)] transition-colors">
                                                {renderTableHead().map((col) => (
                                                    <Td key={col.key} className="text-center text-sm text-transparent">—</Td>
                                                ))}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>

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
                    {/* <div className="px-6 py-4 border-t border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)]">
                        <div className="flex flex-wrap justify-end items-center gap-4 text-sm text-[var(--color-text-secondary)]">
                            {TABS.map((tab) => (
                                <span key={tab.key} className="flex items-center gap-1.5">
                                    <tab.icon className={`h-3.5 w-3.5 ${tab.color}`} />
                                    {tab.label} ({summaryCounts[tab.key]})
                                </span>
                            ))}
                        </div>
                    </div> */}
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
        {/* <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-dark)] focus:border-transparent text-[var(--color-text-primary)] text-sm"
            disabled={disabled}
        >
            <option value="">{placeholder}</option>
            {options.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
            ))}
        </select> */}
        <CustomSelect
            value={value}
            onChange={(e) => onChange(e.target.value)}
            options={options.map((o) => ({
                value: o.id,
                label: o.name,
            }))}
            placeholder={placeholder}
            searchable={true}
            disabled={disabled}
        />
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