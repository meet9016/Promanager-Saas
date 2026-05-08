/* eslint-disable no-unused-vars */
// src/pages/Reports/GeolocationReport.jsx
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
    ChevronRight,
    MapPin,
    Camera,
    Smartphone,
    Monitor,
    Eye,
    Navigation,
    Globe
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosInstance';
import { createPortal } from 'react-dom';
import { exportToPDF } from '../../utils/exportUtils/GeolocationReport/pdfExport';
import { exportGeolocationToExcel } from '../../utils/exportUtils/GeolocationReport/excelExport';
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
    <th className={`px-4 py-3 text-center ${small ? 'text-[11px]' : 'text-xs'} font-medium text-[var(--color-text-muted)] uppercase tracking-wider ${className}`}>
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
                <p className="text-sm text-[var(--color-text-secondary)] mb-1">{label}</p>
                <p className={`text-2xl font-bold ${tone}`}>{value}</p>
            </div>
            <Icon className={`h-8 w-8 ${tone}`} />
        </div>
    </div>
);

const Legend = ({ color, label }) => (
    <span className="flex items-center">
        <span className={`w-3 h-3 rounded-full mr-2 ${color}`} />
        <span className="text-sm">{label}</span>
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
            className="w-full px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-[var(--color-text-primary)] text-sm"
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
        <p className="text-xs text-[var(--color-text-secondary)] mb-1">{label}</p>
        <p className="text-sm font-medium text-[var(--color-text-primary)]">{value}</p>
    </div>
);

const getClockInTypeIcon = (type) => {
    switch (type) {
        case 1:
            return <Monitor className="h-4 w-4 text-primary-600" />;
        case 2:
            return <Monitor className="h-4 w-4 text-green-600" />;
        case 3:
            return <Smartphone className="h-4 w-4 text-purple-600" />;
        default:
            return <Clock className="h-4 w-4 text-gray-600" />;
    }
};

const getClockInTypeName = (type, typeName) => {
    if (typeName) return typeName;
    switch (type) {
        case 1:
            return "Web Browser";
        case 2:
            return "Desktop App";
        case 3:
            return "Mobile Device";
        default:
            return "Unknown";
    }
};

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
                className="flex items-center gap-2 bg-[var(--color-bg-secondary-20)] text-[var(--color-text-white)] hover:bg-[var(--color-bg-secondary-30)] px-4 py-2 rounded-lg font-medium transition-colors backdrop-blur-sm"
            >
                <Filter className="h-4 w-4" />
                Filters
                {activeFiltersCount > 0 && (
                    <span className="bg-[var(--color-bg-secondary)] text-primary-600 text-xs rounded-full px-2 py-1">
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
                                    className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-[var(--color-text-secondary)] rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium min-w-[100px]"
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
                                        onClick={() => { applyFilters(); setFilterDropdown(false); }}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[var(--color-primary-dark)] text-[var(--color-text-white)] rounded-lg hover:bg-[var(--color-primary-darker)] transition-colors text-sm font-medium"
                                    >
                                        <Filter className="h-4 w-4" />
                                        Apply Filters
                                    </button>
                                    <button
                                        onClick={resetFilters}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-[var(--color-text-secondary)] rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
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
const GeolocationReport = () => {
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

    // Timeline modal & Location modal
    const [timelineFor, setTimelineFor] = useState(null);
    const [locationDetailFor, setLocationDetailFor] = useState(null);

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
                return 'bg-primary-50 border-l-4 border-primary-400';
            case 'holiday':
                return 'bg-yellow-50 border-l-4 border-yellow-400';
            case 'absent':
                return 'bg-[var(--color-cell-a-bg)] border-l-4 border-[var(--color-cell-a-border)]';
            case 'leave':
                return 'bg-orange-50 border-l-4 border-orange-400';
            case 'half day':
                return 'bg-primary-50 border-l-4 border-primary-600';
            case 'overtime':
                return 'bg-[var(--color-bg-secondary)] border-l-4 border-primary-600';
            default:
                return '';
        }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        if (isWeekOff) return 'text-primary-600 font-medium';
        if (isLate) return 'text-orange-600 font-medium';
        if (hasOvertime) return 'text-primary-600 font-medium';
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
            formData.append('user_id', user.user_id);

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
    const fetchGeolocationReport = useCallback(
        async (date, applied = {}) => {
            if (!user?.user_id) return;
            setLoading(true);
            setError(null);
            try {
                const formData = new FormData();
                formData.append('user_id', user.user_id);
                formData.append('date', date);

                if (applied.attendance_status_id) formData.append('attendance_status_id', applied.attendance_status_id);
                if (applied.branch_id) formData.append('branch_id', applied.branch_id);
                if (applied.department_id) formData.append('department_id', applied.department_id);
                if (applied.designation_id) formData.append('designation_id', applied.designation_id);
                if (applied.shift_id) formData.append('shift_id', applied.shift_id);

                const res = await api.post('geo_attendance_report_list', formData);

                if (res.data?.success && res.data?.data !== undefined) {
                    const d = res.data.data;

                    // Handle the data structure from your API response
                    const rows = Array.isArray(d.attendance_details) ? d.attendance_details : [];
                    setAttendanceData(rows);

                    // Use API-provided summary stats
                    setSummaryStats({
                        total: parseInt(d.total_employee ?? 0, 10),
                        present: parseInt(d.present_employee ?? 0, 10),
                        absent: parseInt(d.absent_employee ?? 0, 10),
                        weekOff: parseInt(d.week_of_employee ?? 0, 10),
                        late: parseInt(d.late_employee ?? 0, 10),
                        overtime: parseInt(d.overtime_employee ?? 0, 10)
                    });
                } else {
                    throw new Error(res.data?.message || 'Failed to fetch geolocation report');
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
        fetchGeolocationReport(formatDate(selectedDate), appliedFilters);
    }, [selectedDate, user?.user_id, fetchGeolocationReport, appliedFilters]);

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

    // Pagination (10 per page)
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
        fetchGeolocationReport(formatDate(selectedDate), filters);
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
        fetchGeolocationReport(formatDate(selectedDate), empty);
    };

    const handleExportToPDF = useCallback(async () => {
        try {
            if (!filteredData || filteredData.length === 0) {
                showToast('No data available to export', 'error');
                return;
            }

            setExportDropdown(false);
            showToast('Generating PDF...', 'info');

            await exportToPDF(
                filteredData,
                selectedDate,
                'Your Company Name', // Replace with actual company name if available
                'geolocation_attendance_report',
                appliedFilters,
                getFilterLabels()
            );

            showToast('PDF exported successfully!', 'success');
        } catch (error) {
            showToast('Failed to export PDF: ' + error.message, 'error');
            setExportDropdown(false);
        }
    }, [filteredData, selectedDate, appliedFilters, getFilterLabels]);

    const handleExportToExcel = useCallback(() => {
        try {
            if (!filteredData || filteredData.length === 0) {
                showToast('No data available to export', 'error');
                return;
            }

            setExportDropdown(false);
            showToast('Generating Excel file...', 'info');

            // Use the correct function name and parameters
            exportGeolocationToExcel(
                filteredData,
                selectedDate,
                'geolocation_attendance_report'  // Only 3 parameters needed
            );

            showToast('Excel file exported successfully!', 'success');
        } catch (error) {
            showToast('Failed to export Excel: ' + error.message, 'error');
            setExportDropdown(false);
        }
    }, [filteredData, selectedDate]); // Remove appliedFilters and getFilterLabels from dependencies

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
                    <div className="bg-gradient-to-r from-primary-600 to-primary-800 p-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => navigate('/reports')}
                                    className="flex items-center gap-2 text-[var(--color-text-white)] transition-colors bg-[var(--color-bg-secondary-20)] hover:bg-[var(--color-bg-secondary-30)] px-4 py-2 rounded-lg backdrop-blur-sm"
                                >
                                    <ArrowLeft size={18} />
                                    Back
                                </button>
                                <div className="flex items-center gap-3">
                                    <Globe className="h-8 w-8 text-[var(--color-text-white)]" />
                                    <div>
                                        <h1 className="text-2xl font-bold text-[var(--color-text-white)]">Geolocation Attendance Report</h1>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                {/* Export */}
                                <div className="relative">
                                    <button
                                        ref={exportBtnRef}
                                        onClick={() => setExportDropdown((v) => !v)}
                                        className="flex items-center gap-2 bg-[var(--color-bg-secondary-20)] text-[var(--color-text-white)] hover:bg-[var(--color-bg-secondary-30)] px-4 py-2 rounded-lg font-medium transition-colors backdrop-blur-sm"
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
                                                    <FileSpreadsheet className="h-4 w-4 text-green-600" />
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
                    <SummaryCard icon={Users} label="Total Employees" value={summaryStats.total} tone="text-primary-600" />
                    <SummaryCard icon={CheckCircle} label="Present" value={summaryStats.present} tone="text-green-600" />
                    <SummaryCard icon={XCircle} label="Absent" value={summaryStats.absent} tone="text-red-600" />
                    <SummaryCard icon={CalendarX} label="Week Off" value={summaryStats.weekOff} tone="text-purple-600" />
                    <SummaryCard icon={AlertCircle} label="Late Arrivals" value={summaryStats.late} tone="text-orange-600" />
                    <SummaryCard icon={TrendingUp} label="Overtime" value={summaryStats.overtime} tone="text-primary-600" />
                </div>

                {/* Main content */}
                <div className="bg-[var(--color-bg-secondary)] rounded-lg border border-primary-200 overflow-hidden shadow-sm">
                    <div className="px-6 py-4 border-b border-primary-200 bg-[var(--color-primary-dark)]">
                        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
                            <div className="flex items-center">
                                <MapPin className="h-6 w-6 text-[var(--color-text-white)] mr-2" />
                                <h3 className="text-lg font-medium text-[var(--color-text-white)]">Location-Verified Attendance Details</h3>
                            </div>

                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                {/* Date */}
                                <div className="flex items-center space-x-2 z-20">
                                    <Calendar className="w-5 h-5 text-[var(--color-text-white)] flex-shrink-0" />
                                    <DatePicker
                                        selected={selectedDate}
                                        onChange={handleDateChange}
                                        dateFormat="dd-MM-yyyy"
                                        placeholderText="DD-MM-YYYY"
                                        className="w-32 bg-[var(--color-bg-secondary-20)] border border-white/30 rounded-lg px-3 py-2 text-sm text-[var(--color-text-white)] placeholder-white/90 focus:outline-none focus:ring-2 focus:ring-white/30"
                                    />
                                </div>

                                {/* Search */}
                                <div className="relative w-full sm:w-64">
                                    <input
                                        type="text"
                                        placeholder="Search employees..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-10 py-2 border border-white/30 bg-[var(--color-bg-secondary-20)] placeholder-white/90 text-[var(--color-text-white)] rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 text-sm"
                                    />
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--color-text-white)]" />
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery('')}
                                            className="absolute right-3 top-2.5 h-4 w-4 text-[var(--color-text-white)] hover:text-[var(--color-text-white)]"
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
                                    Loading geolocation data...
                                </div>
                            </div>
                        ) : (filteredData?.length || 0) === 0 ? (
                            <div className="p-8 text-center text-[var(--color-text-secondary)]">
                                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <p>No attendance records found</p>
                            </div>
                        ) : (
                            <>
                                <table className="w-full min-w-[1200px] border-separate border-spacing-0">
                                    <thead className="sticky top-0 z-10 bg-[var(--color-bg-secondary)] backdrop-blur">
                                        <tr className="border-b border-[var(--color-border-secondary)]">
                                            <Th className="text-left">Employee</Th>
                                            <Th className="text-left">Shift</Th>
                                            <Th className="text-center">Clock In/Out</Th>
                                            <Th className="text-center">Attendance Hours</Th>
                                            <Th className="text-center">Status</Th>
                                            <Th className="text-center">Timeline</Th>
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
                                                    <Td className="bg-inherit text-center">
                                                        <div className="flex flex-col">
                                                            <span
                                                                className="font-medium text-center break-words whitespace-normal"
                                                                title={emp.employee_name || '--'}
                                                            >
                                                                {emp.employee_name || '--'}
                                                            </span>
                                                            <span
                                                                className="text-xs text-[var(--color-text-secondary)] text-center break-words whitespace-normal"
                                                                title={emp.employee_code || '—'}
                                                            >
                                                                {emp.employee_code || '—'}
                                                            </span>
                                                        </div>
                                                    </Td>

                                                    <Td className="bg-inherit text-center">
                                                        <div className="flex flex-col">
                                                            <span
                                                                className="font-medium text-center break-words whitespace-normal"
                                                                title={emp.shift_name || '--'}
                                                            >
                                                                {emp.shift_name || '--'}
                                                            </span>
                                                            <span
                                                                className="text-xs text-[var(--color-text-secondary)] text-center break-words whitespace-normal"
                                                                title={emp.shift_from_time && emp.shift_to_time ? `${emp.shift_from_time} - ${emp.shift_to_time}` : '—'}
                                                            >
                                                                {emp.shift_from_time && emp.shift_to_time ? `${emp.shift_from_time} - ${emp.shift_to_time}` : '—'}
                                                            </span>
                                                        </div>
                                                    </Td>

                                                    <Td className={`whitespace-nowrap ${timeColorClass} bg-inherit text-center`}>
                                                        <div className="flex flex-col items-center gap-1">
                                                            <span className="text-xs text-[var(--color-text-secondary)]">
                                                                In: {emp.attandance_first_clock_in || '--'}
                                                            </span>
                                                            <span className="text-xs text-[var(--color-text-secondary)]">
                                                                Out: {emp.attandance_last_clock_out || '--'}
                                                            </span>
                                                        </div>
                                                    </Td>

                                                    <Td className="text-center">
                                                        {emp.attandance_hours ? `${emp.attandance_hours}` : '--'}
                                                    </Td>

                                                    <Td className="text-center">
                                                        <span
                                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${emp.status === 'Present'
                                                                ? 'bg-[var(--color-success-light)] text-[var(--color-success-dark)]'
                                                                : emp.status === 'Week Off'
                                                                    ? 'bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)]'
                                                                    : emp.status === 'Absent'
                                                                        ? 'bg-[var(--color-cell-a-bg)] text-[var(--color-error-dark)]'
                                                                        : emp.status === 'Leave'
                                                                            ? 'bg-[var(--color-warning-light)] text-[var(--color-warning-dark)]'
                                                                            : emp.status === 'Half Day'
                                                                                ? 'bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)]'
                                                                                : emp.status === 'Overtime'
                                                                                    ? 'bg-sky-100 text-sky-800'
                                                                                    : 'bg-[var(--color-cell-wo-bg)] text-[var(--color-text-primary)]'
                                                                }`}
                                                        >
                                                            {emp.status || '--'}
                                                        </span>
                                                    </Td>

                                                    <Td className="text-center">
                                                        <button
                                                            onClick={() => setTimelineFor(emp)}
                                                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-primary-300 text-sm hover:bg-primary-50 text-primary-600"
                                                            title="View detailed timeline"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                            Details
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
                            <div className="flex flex-wrap items-center gap-4">
                                <Legend color="bg-green-500" label={`Present (${summaryStats.present})`} />
                                <Legend color="bg-red-500" label={`Absent (${summaryStats.absent})`} />
                                <Legend color="bg-orange-500" label={`Late (${summaryStats.late})`} />
                                <Legend color="bg-primary-500" label={`Overtime (${summaryStats.overtime})`} />
                                <Legend color="bg-purple-600" label={`Week Off (${summaryStats.weekOff})`} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Enhanced Timeline Modal with Geolocation Details */}
            {timelineFor &&
                createPortal(
                    <div className="fixed inset-0 z-[200]">
                        <div className="absolute inset-0 bg-black/40" onClick={() => setTimelineFor(null)} />
                        <div className="absolute inset-x-0 top-12 mx-auto w-[95%] max-w-6xl rounded-2xl shadow-2xl overflow-hidden border border-[var(--color-border-secondary)] bg-[var(--color-bg-secondary)] max-h-[80vh] flex flex-col">
                            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border-secondary)] bg-[var(--color-primary-dark)]">
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-5 w-5 text-[var(--color-text-white)]" />
                                    <h4 className="text-sm sm:text-base font-semibold text-[var(--color-text-white)]">
                                        Geolocation Timeline — {timelineFor.employee_name}
                                        {timelineFor.employee_code ? ` (${timelineFor.employee_code})` : ''}
                                    </h4>
                                </div>
                                <button
                                    onClick={() => setTimelineFor(null)}
                                    className="p-1 rounded-lg hover:bg-[var(--color-bg-secondary-20)] text-[var(--color-text-white)]"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto px-5 pt-4">
                                <div className="rounded-lg border border-[var(--color-border-secondary)] overflow-hidden">
                                    <div className="flex items-center gap-2 px-3 py-3 border-b border-[var(--color-border-secondary)] bg-primary-50">
                                        <Clock className="h-4 w-4 text-primary-600" />
                                        <h5 className="text-sm font-semibold">Detailed Clock In/Out Timeline</h5>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[800px]">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <Th small className="text-left">#</Th>
                                                    <Th small className="text-center">Clock In</Th>
                                                    <Th small className="text-center">Clock Out</Th>
                                                    <Th small className="text-center">Clock In Type</Th>
                                                    <Th small className="text-center">Clock In Location</Th>
                                                    <Th small className="text-center">Clock Out Type</Th>
                                                    <Th small className="text-center">Clock Out Location</Th>
                                                    <Th small className="text-center">Face Photos</Th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[var(--color-border-secondary)]">
                                                {Array.isArray(timelineFor.attendance_history) && timelineFor.attendance_history.length > 0 ? (
                                                    (() => {
                                                        // Group consecutive clock entries into in/out pairs
                                                        const pairs = [];
                                                        for (let i = 0; i < timelineFor.attendance_history.length; i += 2) {
                                                            const clockIn = timelineFor.attendance_history[i];
                                                            const clockOut = timelineFor.attendance_history[i + 1];

                                                            pairs.push({
                                                                clock_in: clockIn?.clock_date_time || '--',
                                                                clock_out: clockOut?.clock_date_time || '--',
                                                                clock_in_type: clockIn?.clock_type,
                                                                clock_in_type_name: clockIn?.clock_type_name,
                                                                clock_in_map_link: clockIn?.map_link,
                                                                clock_in_face_img: clockIn?.face_img,
                                                                clock_out_type: clockOut?.clock_type,
                                                                clock_out_type_name: clockOut?.clock_type_name,
                                                                clock_out_map_link: clockOut?.map_link,
                                                                clock_out_face_img: clockOut?.face_img
                                                            });
                                                        }

                                                        return pairs.map((entry, idx) => (
                                                            <tr key={idx} className="bg-[var(--color-bg-secondary)]">
                                                                <Td small className="text-left">{idx + 1}</Td>
                                                                <Td small className="text-center">{entry.clock_in}</Td>
                                                                <Td small className="text-center">{entry.clock_out}</Td>
                                                                <Td small>
                                                                    <div className="flex items-center justify-center gap-1">
                                                                        {getClockInTypeIcon(entry.clock_in_type)}
                                                                        <span className="text-xs">
                                                                            {getClockInTypeName(entry.clock_in_type, entry.clock_in_type_name)}
                                                                        </span>
                                                                    </div>
                                                                </Td>
                                                                <Td small className="text-center">
                                                                    {entry.clock_in_map_link && entry.clock_in_map_link !== "https://www.google.com/maps?q=," ? (
                                                                        <button
                                                                            onClick={() => window.open(entry.clock_in_map_link, '_blank')}
                                                                            className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-primary-100 text-primary-800 hover:bg-primary-200"
                                                                        >
                                                                            <Navigation className="h-3 w-3" />
                                                                            Map
                                                                        </button>
                                                                    ) : (
                                                                        <span className="text-xs text-gray-500">No Location</span>
                                                                    )}
                                                                </Td>
                                                                <Td small>
                                                                    <div className="flex items-center justify-center gap-1">
                                                                        {getClockInTypeIcon(entry.clock_out_type)}
                                                                        <span className="text-xs">
                                                                            {getClockInTypeName(entry.clock_out_type, entry.clock_out_type_name)}
                                                                        </span>
                                                                    </div>
                                                                </Td>
                                                                <Td small className="text-center">
                                                                    {entry.clock_out_map_link && entry.clock_out_map_link !== "https://www.google.com/maps?q=," ? (
                                                                        <button
                                                                            onClick={() => window.open(entry.clock_out_map_link, '_blank')}
                                                                            className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-primary-100 text-primary-800 hover:bg-primary-200"
                                                                        >
                                                                            <Navigation className="h-3 w-3" />
                                                                            Map
                                                                        </button>
                                                                    ) : (
                                                                        <span className="text-xs text-gray-500">No Location</span>
                                                                    )}
                                                                </Td>
                                                                <Td small className="text-center">
                                                                    <div className="flex items-center justify-center gap-2">
                                                                        {entry.clock_in_face_img ? (
                                                                            <button
                                                                                onClick={() => window.open(entry.clock_in_face_img, '_blank')}
                                                                                className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-[var(--color-success-light)] text-[var(--color-success-dark)] hover:bg-green-200"
                                                                            >
                                                                                <Camera className="h-3 w-3" />
                                                                                In
                                                                            </button>
                                                                        ) : (
                                                                            <span className="text-xs text-gray-500">--</span>
                                                                        )}
                                                                        {entry.clock_out_face_img ? (
                                                                            <button
                                                                                onClick={() => window.open(entry.clock_out_face_img, '_blank')}
                                                                                className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-orange-100 text-orange-800 hover:bg-orange-200"
                                                                            >
                                                                                <Camera className="h-3 w-3" />
                                                                                Out
                                                                            </button>
                                                                        ) : (
                                                                            <span className="text-xs text-gray-500">--</span>
                                                                        )}
                                                                    </div>
                                                                </Td>
                                                            </tr>
                                                        ));
                                                    })()
                                                ) : (
                                                    <tr>
                                                        <Td colSpan={8} className="text-center text-sm text-[var(--color-text-secondary)] py-8">
                                                            No clock-in/out entries found.
                                                        </Td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 border-t border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)]">
                                <Meta label="Employee" value={`${timelineFor.employee_name} (${timelineFor.employee_code || '--'})`} />
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

export default GeolocationReport;