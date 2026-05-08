/* eslint-disable no-unused-vars */
// src/pages/Reports/DetailedDailyReport.jsx
import React, { useState, useEffect, useCallback, useMemo, useRef, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Calendar,
    Users,
    TrendingUp,
    Download,
    Search,
    ArrowLeft,
    CheckCircle,
    XCircle,
    AlertCircle,
    FileSpreadsheet,
    FileDown,
    ChevronDown,
    CalendarX,
    Filter,
    X,
    Loader2,
    Building,
    Award,
    Timer,
    Activity,
    Clock,
    ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosInstance';
import { createPortal } from 'react-dom';
import { exportToPDF } from '../../utils/exportUtils/DetailDailyReport/pdfExport';
import { exportDetailRangeToExcel } from '../../utils/exportUtils/DetailDailyReport/excelExport';
import { Toast } from '../../Components/ui/Toast';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Pagination from '../../Components/Pagination';

/** ---------- Floating Anchors ---------- **/
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

/** ---------- Small building blocks ---------- **/
const Th = ({ children, small, className = '' }) => (
    <th className={`px-4 py-2 text-center ${small ? 'text-[11px]' : 'text-xs'} font-medium text-[var(--color-text-muted)] uppercase tracking-wider ${className}`}>
        {children}
    </th>
);

const Td = ({ children, small, className = '', colSpan }) => (
    <td className={`px-4 py-3 text-center ${small ? 'text-xs' : 'text-sm'} text-[var(--color-text-primary)] ${className}`} colSpan={colSpan}>
        {children}
    </td>
);

const SummaryCard = ({ label, value, icon: Icon, tone = 'text-[var(--color-text-primary)]' }) => (
    <div className="bg-[var(--color-bg-secondary)] rounded-xl p-8 shadow-sm border border-[var(--color-border-primary)]">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm text-[var(--color-text-secondary)]">{label}</p>
                <p className={`text-2xl font-bold ${tone}`}>{value}</p>
            </div>
            <Icon className={`h-8 w-8 ${tone}`} />
        </div>
    </div>
);

const Legend = ({ color, label }) => (
    <span className="flex items-center">
        <span className={`w-3 h-3 rounded-full mr-2 ${color}`} />
        {label}
    </span>
);

const FilterSelect = ({ label, icon: Icon, value, onChange, options = [], disabled }) => (
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
            {options.map((o) => (
                <option key={o.id} value={o.id}>
                    {o.name}
                </option>
            ))}
        </select>
    </div>
);

const Meta = ({ label, value }) => (
    <div className="rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-bg-secondary)] px-4 py-3">
        <p className="text-xs text-[var(--color-text-secondary)]">{label}</p>
        <p className="text-sm font-medium text-[var(--color-text-primary)]">{value}</p>
    </div>
);

const Filters = ({
    filterBtnRef,
    filterDropdown,
    setFilterDropdown,
    filterPos,
    dropdownLoading,
    filters,
    attendanceStatuses,
    branches,
    departments,
    designations,
    shifts,
    handleFilterChange,
    activeFiltersCount,
    applyFilters,
    resetFilters,
}) => {
    return (
        <div className="relative">
            <button
                ref={filterBtnRef}
                onClick={() => setFilterDropdown((v) => !v)}
                className="flex items-center gap-2 bg-[var(--color-bg-secondary)] text-[var(--color-primary-dark)] hover:bg-[var(--color-bg-primary)] px-4 py-2 rounded-lg font-medium transition-colors"
            >
                <Filter className="h-4 w-4" />
                Filters
                {activeFiltersCount > 0 && (
                    <span className="bg-[var(--color-primary-dark)] text-white text-xs rounded-full px-2 py-1">
                        {activeFiltersCount}
                    </span>
                )}
                <ChevronDown className="h-4 w-4" />
            </button>

            {filterDropdown &&
                createPortal(
                    <>
                        <div className="fixed inset-0 z-[100] bg-black/40" onClick={() => setFilterDropdown(false)} />

                        {/* Desktop anchored */}
                        <div
                            className="hidden sm:block absolute z-[110] bg-[var(--color-bg-secondary)] rounded-lg shadow-2xl border border-[var(--color-border-secondary)] max-h-[80vh] overflow-hidden flex flex-col"
                            style={{
                                position: 'absolute',
                                top: filterPos.ready ? filterPos.top : -9999,
                                left: filterPos.ready ? Math.max(12, filterPos.left) : -9999,
                                width: Math.max(420, filterPos.width),
                                minWidth: 420
                            }}
                        >
                            <div className="flex items-center justify-between p-4 border-b border-[var(--color-border-secondary)]">
                                <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Filter Attendance</h3>
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

                            <div className="flex-1 overflow-y-auto p-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <FilterSelect
                                        label="Attendance Status"
                                        icon={CheckCircle}
                                        value={filters.attendance_status_id}
                                        onChange={(v) => handleFilterChange('attendance_status_id', v)}
                                        options={[{ id: '', name: 'All Status' }, ...attendanceStatuses]}
                                        disabled={dropdownLoading}
                                    />
                                    <FilterSelect
                                        label="Branch"
                                        icon={Building}
                                        value={filters.branch_id}
                                        onChange={(v) => handleFilterChange('branch_id', v)}
                                        options={[{ id: '', name: 'All Branches' }, ...branches]}
                                        disabled={dropdownLoading}
                                    />
                                    <FilterSelect
                                        label="Department"
                                        icon={Users}
                                        value={filters.department_id}
                                        onChange={(v) => handleFilterChange('department_id', v)}
                                        options={[{ id: '', name: 'All Departments' }, ...departments]}
                                        disabled={dropdownLoading}
                                    />
                                    <FilterSelect
                                        label="Designation"
                                        icon={Award}
                                        value={filters.designation_id}
                                        onChange={(v) => handleFilterChange('designation_id', v)}
                                        options={[{ id: '', name: 'All Designations' }, ...designations]}
                                        disabled={dropdownLoading}
                                    />
                                    <FilterSelect
                                        label="Shift"
                                        icon={Timer}
                                        value={filters.shift_id}
                                        onChange={(v) => handleFilterChange('shift_id', v)}
                                        options={[{ id: '', name: 'All Shifts' }, ...shifts]}
                                        disabled={dropdownLoading}
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-2 p-4 border-t border-[var(--color-border-secondary)]">
                                <button
                                    onClick={() => { applyFilters(); setFilterDropdown(false); }}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[var(--color-primary-dark)] text-[var(--color-text-white)] rounded-lg hover:bg-[var(--color-primary-darker)] transition-colors text-sm font-medium"
                                >
                                    <Filter className="h-4 w-4" />
                                    Apply Filters
                                </button>
                                <button
                                    onClick={resetFilters}
                                    className="flex items-center justify-center gap-2 px-4 py-2 bg-[var(--color-bg-gray-light)] text-[var(--color-text-secondary)] rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors text-sm font-medium min-w-[100px]"
                                >
                                    Reset
                                </button>
                            </div>
                        </div>

                        {/* Mobile sheet */}
                        <div className="sm:hidden fixed inset-0 z-[110] flex">
                            <div className="ml-auto h-full w-full bg-[var(--color-bg-secondary)] flex flex-col">
                                <div className="flex items-center justify-between p-4 border-b border-[var(--color-border-secondary)]">
                                    <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Filter Attendance</h3>
                                    <button
                                        onClick={() => setFilterDropdown(false)}
                                        className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] p-1 rounded-lg hover:bg-[var(--color-bg-hover)]"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>

                                {dropdownLoading && (
                                    <div className="flex items-center gap-2 p-4 text-[var(--color-text-secondary)] border-b border-[var(--color-border-secondary)]">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span className="text-sm">Loading filter options...</span>
                                    </div>
                                )}

                                <div className="flex-1 overflow-y-auto p-4">
                                    <div className="grid grid-cols-1 gap-4">
                                        <FilterSelect
                                            label="Attendance Status"
                                            icon={CheckCircle}
                                            value={filters.attendance_status_id}
                                            onChange={(v) => handleFilterChange('attendance_status_id', v)}
                                            options={[{ id: '', name: 'All Status' }, ...attendanceStatuses]}
                                            disabled={dropdownLoading}
                                        />
                                        <FilterSelect
                                            label="Branch"
                                            icon={Building}
                                            value={filters.branch_id}
                                            onChange={(v) => handleFilterChange('branch_id', v)}
                                            options={[{ id: '', name: 'All Branches' }, ...branches]}
                                            disabled={dropdownLoading}
                                        />
                                        <FilterSelect
                                            label="Department"
                                            icon={Users}
                                            value={filters.department_id}
                                            onChange={(v) => handleFilterChange('department_id', v)}
                                            options={[{ id: '', name: 'All Departments' }, ...departments]}
                                            disabled={dropdownLoading}
                                        />
                                        <FilterSelect
                                            label="Designation"
                                            icon={Award}
                                            value={filters.designation_id}
                                            onChange={(v) => handleFilterChange('designation_id', v)}
                                            options={[{ id: '', name: 'All Designations' }, ...designations]}
                                            disabled={dropdownLoading}
                                        />
                                        <FilterSelect
                                            label="Shift"
                                            icon={Timer}
                                            value={filters.shift_id}
                                            onChange={(v) => handleFilterChange('shift_id', v)}
                                            options={[{ id: '', name: 'All Shifts' }, ...shifts]}
                                            disabled={dropdownLoading}
                                        />
                                    </div>
                                </div>

                                <div className="p-4 border-t border-[var(--color-border-secondary)] bg-[var(--color-bg-secondary)] grid grid-cols-1 gap-2">
                                    <button
                                        onClick={applyFilters}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[var(--color-primary-dark)] text-[var(--color-text-white)] rounded-lg hover:bg-[var(--color-primary-darker)] transition-colors text-sm font-medium"
                                    >
                                        <Filter className="h-4 w-4" />
                                        Apply Filters
                                    </button>
                                    <button
                                        onClick={resetFilters}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[var(--color-bg-gray-light)] text-[var(--color-text-secondary)] rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors text-sm font-medium"
                                    >
                                        Reset
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>,
                    document.body
                )}
        </div>
    );
};

/** ---------- Main Component ---------- **/
const DetailedDailyReport = () => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [attendanceData, setAttendanceData] = useState([]);

    // API-driven summary stats
    const [summaryStats, setSummaryStats] = useState({
        total: 0,
        present: 0,
        absent: 0,
        weekOff: 0,
        late: 0,
        overtime: 0
    });

    const [loading, setLoading] = useState(false);
    const [dropdownLoading, setDropdownLoading] = useState(false);
    const [error, setError] = useState(null);

    // Search
    const [searchQuery, setSearchQuery] = useState('');

    // Export/Filter UI
    const [exportDropdown, setExportDropdown] = useState(false);
    const [filterDropdown, setFilterDropdown] = useState(false);
    const [toast, setToast] = useState(null);

    // Timeline modal
    const [timelineFor, setTimelineFor] = useState(null);

    // Applied vs in-UI filters
    const [appliedFilters, setAppliedFilters] = useState({
        attendance_status_id: '',
        branch_id: '',
        department_id: '',
        designation_id: '',
        shift_id: ''
    });

    const [filters, setFilters] = useState({
        attendance_status_id: '',
        branch_id: '',
        department_id: '',
        designation_id: '',
        shift_id: ''
    });

    // Dropdown data
    const [attendanceStatuses, setAttendanceStatuses] = useState([]);
    const [branches, setBranches] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [designations, setDesignations] = useState([]);
    const [shifts, setShifts] = useState([]);

    const navigate = useNavigate();
    const { user } = useAuth();

    // Anchors
    const exportBtnRef = useRef(null);
    const filterBtnRef = useRef(null);
    const exportPos = useAnchoredPosition(exportBtnRef, exportDropdown, {
        placement: 'bottom-end',
        offset: 10,
        minWidth: 192
    });
    const filterPos = useAnchoredPosition(filterBtnRef, filterDropdown, {
        placement: 'bottom-end',
        offset: 10,
        minWidth: 420
    });

    // Toast helpers
    const showToast = (message, type = 'info') => setToast({ message, type });
    const closeToast = () => setToast(null);

    const getRowStyling = (status) => {
        const statusLower = status?.toLowerCase() || '';
        switch (statusLower) {
            case 'week off':
            case 'weekoff':
                return 'bg-[var(--color-primary-lightest)] border-l-4 border-[var(--color-primary-light)]';
            case 'holiday':
                return 'bg-[var(--color-warning-light)] border-l-4 border-[var(--color-warning)]';
            case 'absent':
                return 'bg-[var(--color-error-light)] border-l-4 border-[var(--color-error)]';
            case 'leave':
                return 'bg-[var(--color-yellow-light)] border-l-4 border-[var(--color-yellow-dark)]';
            case 'half day':
                return 'bg-[var(--color-primary-lighter)] border-l-4 border-[var(--color-primary-dark)]';
            case 'overtime':
                return 'bg-[var(--color-bg-secondary)] border-l-4 border-[var(--color-primary-dark)]';
            default:
                return '';
        }
    };

    const getFilterLabels = () => {
        const labels = {};
        if (appliedFilters.attendance_status_id) {
            const status = attendanceStatuses.find((s) => s.id == appliedFilters.attendance_status_id);
            labels.attendance_status = status?.name || '';
        }
        if (appliedFilters.branch_id) {
            const branch = branches.find((b) => b.id == appliedFilters.branch_id);
            labels.branch = branch?.name || '';
        }
        if (appliedFilters.department_id) {
            const department = departments.find((d) => d.id == appliedFilters.department_id);
            labels.department = department?.name || '';
        }
        if (appliedFilters.designation_id) {
            const designation = designations.find((d) => d.id == appliedFilters.designation_id);
            labels.designation = designation?.name || '';
        }
        if (appliedFilters.shift_id) {
            const shift = shifts.find((s) => s.id == appliedFilters.shift_id);
            labels.shift = shift?.name || '';
        }
        return labels;
    };

    const getTimeColor = (employee) => {
        const isLate = parseFloat(employee.late_hours || 0) > 0;
        const hasOvertime = parseFloat(employee.overtime_hours || 0) > 0;
        const isWeekOff = (employee.status || '').toLowerCase() === 'week off';
        if (isWeekOff) return 'text-[var(--color-text-primary)] font-medium';
        if (isLate) return 'text-[var(--color-warning-dark)] font-medium';
        if (hasOvertime) return 'text-[var(--color-primary-dark)] font-medium';
        return 'text-[var(--color-text-primary)]';
    };

    const formatDate = (dateObj) => {
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const handleDateChange = (date) => setSelectedDate(date);

    // Fetch dropdowns
    const fetchDropdownData = useCallback(async () => {
        try {
            setDropdownLoading(true);
            setError(null);
            if (!user?.user_id) throw new Error('User ID is required');

            const formData = new FormData();

            const baseResp = await api.post('employee_drop_down_list', formData);
            if (baseResp.data?.success && baseResp.data.data) {
                const data = baseResp.data.data;

                setBranches((data.branch_list || []).map((b) => ({ id: b.branch_id, name: b.name })));
                setDepartments((data.department_list || []).map((d) => ({ id: d.department_id, name: d.name })));
                setDesignations((data.designation_list || []).map((d) => ({ id: d.designation_id, name: d.name })));
                setAttendanceStatuses((data.attendance_status || []).map((s) => ({
                    id: s.attendance_status_id ?? s.id ?? s.status_id,
                    name: s.name ?? s.status_name ?? s.label
                })));
                setShifts((data.shift_list || []).map((s) => ({
                    id: s.shift_id ?? s.id,
                    name: s.name ?? s.shift_name
                })));
            } else {
                throw new Error(baseResp.data?.message || 'Failed to fetch org dropdowns');
            }
        } catch (err) {
            const msg = err.message || 'Failed to load filter options';
            setError(msg);
            showToast(msg, 'error');
        } finally {
            setDropdownLoading(false);
        }
    }, [user?.user_id]);

    // Fetch report (table + API-driven summary)
    const fetchDailyReport = useCallback(
        async (date, applied = {}) => {
            if (!user?.user_id) return;
            setLoading(true);
            setError(null);
            try {
                const formData = new FormData();
                formData.append('date', date);

                if (applied.attendance_status_id) formData.append('attendance_status_id', applied.attendance_status_id);
                if (applied.branch_id) formData.append('branch_id', applied.branch_id);
                if (applied.department_id) formData.append('department_id', applied.department_id);
                if (applied.designation_id) formData.append('designation_id', applied.designation_id);
                if (applied.shift_id) formData.append('shift_id', applied.shift_id);

                const res = await api.post('daily_attendance_report_list', formData);

                if (res.data?.success && res.data?.data !== undefined) {
                    const d = res.data.data;

                    // Accept both shapes
                    if (Array.isArray(d)) {
                        const rows = d;
                        setAttendanceData(rows);

                        // derive summary if API doesn't send totals
                        const norm = (s) => (s || '').toLowerCase().replace(/\s+/g, '');
                        const total = rows.length;
                        const present = rows.filter((e) => norm(e.status) === 'present').length;
                        const weekOff = rows.filter((e) => ['weekoff', 'week_off'].includes(norm(e.status))).length;
                        const absent = rows.filter((e) => norm(e.status) === 'absent').length;
                        const late = rows.filter((e) => parseFloat(e.late_hours || 0) > 0).length;
                        const overtime = rows.filter((e) => parseFloat(e.overtime_hours || 0) > 0).length;
                        setSummaryStats({ total, present, absent, weekOff, late, overtime });
                    } else {
                        const rows = Array.isArray(d.attendance_details) ? d.attendance_details : [];
                        setAttendanceData(rows);
                        setSummaryStats({
                            total: parseInt(d.total_employee ?? 0, 10),
                            present: parseInt(d.present_employee ?? 0, 10),
                            absent: parseInt(d.absent_employee ?? 0, 10),
                            weekOff: parseInt(d.week_of_employee ?? 0, 10),
                            late: parseInt(d.late_employee ?? 0, 10),
                            overtime: parseInt(d.overtime_employee ?? 0, 10)
                        });
                    }
                } else {
                    throw new Error(res.data?.message || 'Failed to fetch daily report');
                }
            } catch (err) {
                const msg = err.message || 'An error occurred while fetching the report';
                setError(msg);
                showToast(msg, 'error');
            } finally {
                setLoading(false);
            }
        },
        [user?.user_id]
    );

    // Initial loads
    useEffect(() => {
        fetchDropdownData();
    }, [fetchDropdownData]);

    useEffect(() => {
        fetchDailyReport(formatDate(selectedDate), appliedFilters);
    }, [selectedDate, user?.user_id, fetchDailyReport, appliedFilters]);

    // Client search
    const filteredData = useMemo(() => {
        const q = searchQuery.toLowerCase().trim();
        if (!q) return attendanceData;
        return attendanceData.filter(
            (emp) =>
                emp.employee_name?.toLowerCase().includes(q) ||
                emp.employee_code?.toLowerCase().includes(q) ||
                (emp.status || '').toLowerCase().includes(q) ||
                (emp.shift_name || '').toLowerCase().includes(q)
        );
    }, [attendanceData, searchQuery]);

    // ⬇️ Pagination (10 per page) + filler rows
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;

    const totalPages = useMemo(() => Math.max(1, Math.ceil((filteredData?.length || 0) / rowsPerPage)), [filteredData?.length]);

    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        return (filteredData || []).slice(start, end);
    }, [filteredData, currentPage]);

    const emptyRowCount = useMemo(() => {
        const count = rowsPerPage - (paginatedData?.length || 0);
        return count > 0 ? count : 0;
    }, [paginatedData]);

    // reset to page 1 on new data/filter/search/date
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, appliedFilters, selectedDate, attendanceData]);

    // Helpers
    const handleFilterChange = (name, value) => setFilters((prev) => ({ ...prev, [name]: value }));
    const getActiveFiltersCount = () =>
        Object.values(appliedFilters).filter((v) => v !== '' && v !== null && v !== undefined).length;

    const applyFilters = () => {
        setAppliedFilters(filters);
        setCurrentPage(1);
        fetchDailyReport(formatDate(selectedDate), filters);
        setFilterDropdown(false);
        showToast('Filters applied', 'success');
    };

    const resetFilters = () => {
        const empty = {
            attendance_status_id: '',
            branch_id: '',
            department_id: '',
            designation_id: '',
            shift_id: ''
        };
        setFilters(empty);
        setAppliedFilters(empty);
        setCurrentPage(1);
        setFilterDropdown(false);
        showToast('Filters reset', 'success');
        fetchDailyReport(formatDate(selectedDate), empty);
    };

    const handleExportToPDF = useCallback(async () => {
        try {
            if (!filteredData || filteredData.length === 0) {
                showToast('No data available to export', 'error');
                return;
            }
            showToast('Generating PDF...', 'info');
            const fileName = `detailed_daily_attendance_${formatDate(selectedDate)}`;
            const companyName = 'Your Company Name';
            const filterLabels = getFilterLabels();

            // Pass complete data with attendance_history intact
            const dataWithSno = filteredData.map((emp, index) => ({
                ...emp,
                sno: emp.sno || index + 1
            }));

            await exportToPDF(
                dataWithSno,
                selectedDate,
                companyName,
                fileName,
                appliedFilters,
                filterLabels
            );

            showToast('PDF exported successfully!', 'success');
            setExportDropdown(false);
        } catch (error) {
            showToast('Failed to export PDF: ' + error.message, 'error');
            setExportDropdown(false);
        }
    }, [filteredData, selectedDate, appliedFilters]);

    const handleExportToExcel = useCallback(() => {
        try {
            if (!filteredData || filteredData.length === 0) {
                showToast('No data available to export', 'error');
                return;
            }

            // Pass the original filteredData with attendance_history intact
            const dataWithSno = filteredData.map((emp, index) => ({
                ...emp,
                sno: emp.sno || index + 1
            }));

            const fileName = `detailed_daily_attendance_${formatDate(selectedDate)}`;
            exportDetailRangeToExcel(dataWithSno, formatDate(selectedDate), formatDate(selectedDate), fileName);

            showToast('Excel exported successfully!', 'success');
            setExportDropdown(false);
        } catch (error) {
            showToast('Failed to export Excel: ' + error.message, 'error');
            setExportDropdown(false);
        }
    }, [filteredData, selectedDate]);

    const handleClearSearch = useCallback(() => setSearchQuery(''), []);
    const activeFiltersCount = getActiveFiltersCount();
    const truncateText = useCallback((text, maxLength = 12) => {
        if (!text) return '--';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }, []);

    // Anchored dropdown autoclose if off-screen
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

    useEffect(() => {
        if (filterDropdown && filterBtnRef.current) {
            const rect = filterBtnRef.current.getBoundingClientRect();
            const off =
                rect.bottom < 0 ||
                rect.top > window.innerHeight ||
                rect.right < 0 ||
                rect.left > window.innerWidth;
            if (off) setFilterDropdown(false);
        }
    }, [filterDropdown, filterPos]);

    return (
        <div className="min-h-screen bg-[var(--color-bg-primary)]">
            {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}

            <div className="p-8  mx-auto">
                {/* Header */}
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
                                <h1 className="text-2xl font-bold text-[var(--color-text-white)]">Detailed Daily Attendance</h1>
                            </div>

                            <div className="flex items-center gap-3">
                                {/* Export */}
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
                                            <div
                                                className="absolute z-50 bg-[var(--color-bg-secondary)] rounded-lg shadow-2xl border border-[var(--color-border-secondary)] py-2"
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
                                                    className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-[var(--color-bg-hover)] transition-colors text-[var(--color-text-primary)]"
                                                >
                                                    <FileSpreadsheet className="h-4 w-4 text-primary-600" />
                                                    Export to Excel
                                                </button>
                                                <button
                                                    onClick={handleExportToPDF}
                                                    className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-[var(--color-bg-hover)] transition-colors text-[var(--color-text-primary)]"
                                                >
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
                </div>

                {/* Summary cards (API-driven) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
                    <SummaryCard icon={Users} label="Total Employees" value={summaryStats.total} tone="text-[var(--color-primary-dark)]" />
                    <SummaryCard icon={CheckCircle} label="Present" value={summaryStats.present} tone="text-green-600" />
                    <SummaryCard icon={XCircle} label="Absent" value={summaryStats.absent} tone="text-red-600" />
                    <SummaryCard icon={CalendarX} label="Week Off" value={summaryStats.weekOff} tone="text-purple-600" />
                    <SummaryCard icon={AlertCircle} label="Late Arrivals" value={summaryStats.late} tone="text-yellow-600" />
                    <SummaryCard icon={TrendingUp} label="Overtime" value={summaryStats.overtime} tone="text-primary-600" />
                </div>

                {/* Main content */}
                <div className="bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-primary-dark)] overflow-hidden shadow-sm">
                    <div className="px-6 py-4 border-b border-[var(--color-primary-light)] bg-[var(--color-primary-dark)]">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center">
                                <Activity className="h-6 w-6 text-[var(--color-text-white)] mr-2" />
                                <h3 className="text-lg font-medium text-[var(--color-text-white)]">Daily Attendance Details</h3>
                            </div>

                            <div className="flex items-center gap-3">
                                {/* Date */}
                                <div className="flex items-center space-x-2 z-20">
                                    <Calendar className="w-5 h-5 text-[var(--color-text-white)]" />
                                    <DatePicker
                                        selected={selectedDate}
                                        onChange={handleDateChange}
                                        dateFormat="dd-MM-yyyy"
                                        placeholderText="DD-MM-YYYY"
                                        className="w-full bg-[var(--color-bg-secondary-20)] border border-[var(--color-bg-secondary-30)] rounded-lg px-3 py-2 text-sm text-[var(--color-text-white)] placeholder-[var(--color-text-white-90)] focus:outline-none focus:ring-2 focus:ring-[var(--color-bg-secondary-30)]"
                                    />
                                </div>

                                {/* Search */}
                                <div className="relative w-full sm:w-64">
                                    <input
                                        type="text"
                                        placeholder="Search employees..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-10 py-2 border border-[var(--color-border-secondary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-text-white)] focus:border-[var(--color-border-primary)] text-sm"
                                    />
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--color-text-muted)]" />
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery('')}
                                            className="absolute right-3 top-2.5 h-4 w-4 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
                                        >
                                            <XCircle className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>

                                {/* Filters */}
                                <Filters
                                    filterBtnRef={filterBtnRef}
                                    filterDropdown={filterDropdown}
                                    setFilterDropdown={setFilterDropdown}
                                    filterPos={filterPos}
                                    dropdownLoading={dropdownLoading}
                                    filters={filters}
                                    attendanceStatuses={attendanceStatuses}
                                    branches={branches}
                                    departments={departments}
                                    designations={designations}
                                    shifts={shifts}
                                    handleFilterChange={(name, v) => handleFilterChange(name, v)}
                                    activeFiltersCount={activeFiltersCount}
                                    applyFilters={applyFilters}
                                    resetFilters={resetFilters}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        {loading ? (
                            <div className="p-8 text-center text-[var(--color-text-secondary)]">
                                <div className="flex items-center justify-center">
                                    <Loader2 className="h-8 w-8 animate-spin mr-3" />
                                    Loading...
                                </div>
                            </div>
                        ) : (filteredData?.length || 0) === 0 ? (
                            <div className="p-8 text-center text-[var(--color-text-secondary)]">No records found</div>
                        ) : (
                            <>
                                <table className="w-full min-w-[1200px] border-separate border-spacing-0">
                                    <thead className="sticky top-0 z-10 bg-[var(--color-bg-gray-light)]/90 backdrop-blur supports-[backdrop-filter]:bg-[var(--color-bg-gray-light)]/60">
                                        <tr className="border-b border-[var(--color-border-secondary)]">
                                            <Th>Employee</Th>
                                            <Th>Shift</Th>
                                            <Th>Shift Time</Th>
                                            <Th>Clock In</Th>
                                            <Th>Clock Out</Th>
                                            <Th>Working Hours</Th>
                                            <Th>Attendance Hours</Th>
                                            <Th>Remaining Hours</Th>
                                            <Th>OT Hours</Th>
                                            <Th>Status</Th>
                                            <Th>Timeline</Th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-[var(--color-border-secondary)]">
                                        {paginatedData.map((emp, idx) => {
                                            const timeColorClass = getTimeColor(emp);
                                            return (
                                                <tr
                                                    key={emp.employee_id || emp.employee_code || idx}
                                                    className={`hover:bg-[var(--color-bg-hover)] transition-colors ${getRowStyling(emp.status)}`}
                                                >
                                                    <Td className="bg-inherit text-left">
                                                        <div className="flex flex-col items-start">
                                                            {/* Employee Name with truncate */}
                                                            <span
                                                                className="font-medium text-left break-words whitespace-normal"
                                                                title={emp.employee_name || '--'}
                                                            >
                                                                {truncateText(emp.employee_name, 20)}
                                                            </span>

                                                            {/* Employee Code with truncate */}
                                                            <span
                                                                className="text-xs text-[var(--color-text-secondary)] text-left break-words whitespace-normal"
                                                                title={emp.employee_code || '—'}
                                                            >
                                                                {truncateText(emp.employee_code, 15)}
                                                            </span>
                                                        </div>
                                                    </Td>


                                                    <Td className="text-left">{emp.shift_name || '--'}</Td>

                                                    <Td className="whitespace-nowrap">
                                                        {emp.shift_from_time && emp.shift_to_time ? `${emp.shift_from_time} - ${emp.shift_to_time}` : '--'}
                                                    </Td>

                                                    <Td className={`whitespace-nowrap ${timeColorClass}`}>
                                                        {emp.attandance_first_clock_in || '--'}
                                                    </Td>

                                                    <Td className={`whitespace-nowrap ${timeColorClass}`}>
                                                        {emp.attandance_last_clock_out || '--'}
                                                    </Td>

                                                    <Td>
                                                        {emp.shift_working_hours ? `${emp.shift_working_hours}` : '--'}
                                                    </Td>

                                                    <Td>
                                                        {emp.attandance_hours ? `${emp.attandance_hours}` : '--'}
                                                    </Td>

                                                    <Td className={`${parseFloat(emp.late_hours || 0) > 0 ? 'text-[var(--color-warning-dark)] font-medium' : ''}`}>
                                                        {emp.late_hours && parseFloat(emp.late_hours) > 0 ? `${emp.late_hours}` : '--'}
                                                    </Td>

                                                    <Td className={`${parseFloat(emp.overtime_hours || 0) > 0 ? 'text-[var(--color-primary-dark)] font-medium' : ''}`}>
                                                        {emp.overtime_hours && parseFloat(emp.overtime_hours) > 0 ? `${emp.overtime_hours}` : '--'}
                                                    </Td>

                                                    <Td>
                                                        <span
                                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${emp.status === 'Present'
                                                                ? 'bg-green-100 text-green-800'
                                                                : emp.status === 'Week Off'
                                                                    ? 'bg-purple-100 text-purple-800'
                                                                    : emp.status === 'Absent'
                                                                        ? 'bg-red-100 text-red-800'
                                                                        : emp.status === 'Leave'
                                                                            ? 'bg-yellow-100 text-yellow-800'
                                                                            : emp.status === 'Half Day'
                                                                                ? 'bg-primary-100 text-primary-800'
                                                                                : emp.status === 'Overtime'
                                                                                    ? 'bg-sky-100 text-sky-800'
                                                                                    : 'bg-gray-100 text-gray-800'
                                                                }`}
                                                        >
                                                            {emp.status || '--'}
                                                        </span>
                                                    </Td>

                                                    <Td>
                                                        <button
                                                            onClick={() => setTimelineFor(emp)}
                                                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-[var(--color-border-secondary)] text-sm hover:bg-[var(--color-bg-hover)]"
                                                            title="View all clock-in/out"
                                                        >
                                                            <ChevronRight className="h-4 w-4" />
                                                            View
                                                        </button>
                                                    </Td>
                                                </tr>
                                            );
                                        })}

                                        {/* Filler rows to keep 10 visible */}
                                        {Array.from({ length: emptyRowCount }).map((_, i) => (
                                            <tr key={`empty-${i}`} className="transition-colors">
                                                <Td className="text-transparent">—</Td>
                                                <Td className="text-transparent">—</Td>
                                                <Td className="text-transparent">—</Td>
                                                <Td className="text-transparent">—</Td>
                                                <Td className="text-transparent">—</Td>
                                                <Td className="text-transparent">—</Td>
                                                <Td className="text-transparent">—</Td>
                                                <Td className="text-transparent">—</Td>
                                                <Td className="text-transparent">—</Td>
                                                <Td className="text-transparent">—</Td>
                                                <Td className="text-transparent">—</Td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {/* Pagination controls */}
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={setCurrentPage}
                                    loading={loading}
                                />
                            </>
                        )}
                    </div>

                    {/* Summary at bottom */}
                    <div className="px-6 py-4 border-t border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)]">
                        <div className="flex justify-end items-center text-sm text-[var(--color-text-secondary)]">
                            <div className="flex items-center space-x-4">
                                <Legend color="bg-green-500" label={`Present (${summaryStats.present})`} />
                                <Legend color="bg-red-500" label={`Absent (${summaryStats.absent})`} />
                                <Legend color="bg-yellow-500" label={`Late (${summaryStats.late})`} />
                                <Legend color="bg-primary-500" label={`Overtime (${summaryStats.overtime})`} />
                                <Legend color="bg-purple-600" label={`Week Off (${summaryStats.weekOff})`} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Timeline Modal */}
            {timelineFor &&
                createPortal(
                    <div className="fixed inset-0 z-[200]">
                        <div className="absolute inset-0 bg-black/40" onClick={() => setTimelineFor(null)} />
                        <div className="absolute inset-x-0 top-12 mx-auto w-[95%] max-w-3xl rounded-2xl shadow-2xl overflow-hidden border border-[var(--color-border-secondary)] bg-[var(--color-bg-secondary)]">
                            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border-secondary)]">
                                <div className="flex items-center gap-2">
                                    <Timer className="h-5 w-5 text-[var(--color-primary-dark)]" />
                                    <h4 className="text-sm sm:text-base font-semibold text-[var(--color-text-primary)]">
                                        Clock In/Out — {timelineFor.employee_name}
                                        {timelineFor.employee_code ? ` (${timelineFor.employee_code})` : ''}
                                    </h4>
                                </div>
                                <button
                                    onClick={() => setTimelineFor(null)}
                                    className="p-1 rounded-lg hover:bg-[var(--color-bg-hover)]"
                                >
                                    <X className="h-5 w-5 text-[var(--color-text-secondary)]" />
                                </button>
                            </div>

                            <div className="px-5 pt-4">
                                <div className="rounded-lg border border-[var(--color-border-secondary)] overflow-hidden">
                                    <div className="flex items-center gap-2 px-3 py-3 border-b border-[var(--color-border-secondary)]">
                                        <Clock className="h-4 w-4 text-[var(--color-primary-dark)]" />
                                        <h5 className="text-sm font-semibold">Timeline</h5>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-[var(--color-bg-gray-light)]">
                                                <tr>
                                                    <Th small>#</Th>
                                                    <Th small>Clock In</Th>
                                                    <Th small>Clock Out</Th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[var(--color-border-secondary)]">
                                                {Array.isArray(timelineFor.attendance_history) && timelineFor.attendance_history.length > 0 ? (
                                                    (() => {
                                                        // Group consecutive clock entries into in/out pairs
                                                        const pairs = [];
                                                        for (let i = 0; i < timelineFor.attendance_history.length; i += 2) {
                                                            pairs.push({
                                                                clock_in: timelineFor.attendance_history[i]?.clock_date_time || '--',
                                                                clock_out: timelineFor.attendance_history[i + 1]?.clock_date_time || '--'
                                                            });
                                                        }
                                                        return pairs.map((pair, idx) => (
                                                            <tr key={idx} className="bg-[var(--color-bg-secondary)]">
                                                                <Td small className="text-center">{idx + 1}</Td>
                                                                <Td small className="text-center">{pair.clock_in}</Td>
                                                                <Td small className="text-center">{pair.clock_out}</Td>
                                                            </tr>
                                                        ));
                                                    })()
                                                ) : (
                                                    <tr>
                                                        <Td colSpan={3} className="text-center text-sm text-[var(--color-text-secondary)] py-4">
                                                            No clock-in/out entries.
                                                        </Td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                <Meta label="Shift" value={timelineFor.shift_name || '—'} />
                                <Meta label="Working Hours" value={timelineFor.shift_working_hours ? `${timelineFor.shift_working_hours}` : '—'} />
                                <Meta label="Status" value={timelineFor.status || '—'} />
                            </div>
                        </div>
                    </div>,
                    document.body
                )
            }

            {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
        </div>
    );
};

export default DetailedDailyReport;
