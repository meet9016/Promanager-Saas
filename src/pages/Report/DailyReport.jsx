/* eslint-disable no-unused-vars */
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
    RefreshCw
} from 'lucide-react';
import NoDataFound from '../../Components/comman/NoDataFound';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosInstance';
import { createPortal } from 'react-dom';
import { exportToPDF } from '../../utils/exportUtils/DailyReport/pdfExport';
import { exportToExcel } from '../../utils/exportUtils/DailyReport/excelExport';
import { Toast } from '../../Components/ui/Toast';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import CustomSelect from '../../Components/comman/CustomSelect';

// ⬇️ ADD THIS: adjust the import path to where your Pagination component lives
// e.g. '../../Components/common/Pagination' or '../Pagination'
import Pagination from '../../Components/Pagination';
import { Table, TableHeader, TableBody, TableRow, TableHeaderRow, Th, Td } from '../../Components/ui/Table';
import CustomDatePicker from '../../Components/comman/CustomDatePicker';
import CustomInput from '../../Components/comman/CustomInput';

/** ---------- Floating Anchors: robust positioning utilities ---------- **/
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

const DailyReport = () => {
    const [selectedDate, setSelectedDate] = useState(new Date());

    // Table rows (from API -> data.attendance_details)
    const [attendanceData, setAttendanceData] = useState([]);

    // Summary cards (from API counts)
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

    // Row styling
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
        const isWeekOff = employee.status === 'Week Off';
        if (isWeekOff) return 'text-[var(--color-text-primary)] font-medium';
        if (isLate) return 'text-[var(--color-warning-dark)] font-medium';
        if (hasOvertime) return 'text-[var(--color-primary-dark)] font-medium';
        return 'text-[var(--color-text-primary)]';
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

                if (res.data?.success && res.data?.data) {
                    const d = res.data.data;

                    // rows
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
        fetchDailyReport(formatDate(selectedDate));
    }, [selectedDate, user?.user_id, fetchDailyReport]);

    // Client search over employee name/code
    const filteredData = useMemo(() => {
        const q = searchQuery.toLowerCase().trim();
        if (!q) return attendanceData;
        return attendanceData.filter(
            (emp) =>
                emp.employee_name?.toLowerCase().includes(q) ||
                emp.employee_code?.toLowerCase().includes(q)
        );
    }, [attendanceData, searchQuery]);

    // ⬇️ ADD: pagination state + memoized page slice & blank row filler
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;

    const totalPages = useMemo(() => {
        return Math.max(1, Math.ceil((filteredData?.length || 0) / rowsPerPage));
    }, [filteredData?.length]);

    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        return (filteredData || []).slice(start, end);
    }, [filteredData, currentPage]);

    const emptyRowCount = useMemo(() => {
        const count = rowsPerPage - (paginatedData?.length || 0);
        return count > 0 ? count : 0;
    }, [paginatedData]);

    // When filters/search/date change, keep user on page 1
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, appliedFilters, selectedDate, attendanceData]);

    // Helpers
    const handleFilterChange = (name, value) =>
        setFilters((prev) => ({ ...prev, [name]: value }));

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
            const fileName = `daily_attendance_report_${formatDate(selectedDate)}`;
            const companyName = user?.company_name || user?.company || user?.full_name || 'Your Company Name';
            const filterLabels = getFilterLabels();
            const dataWithSno = filteredData.map((emp, index) => ({ ...emp, sno: index + 1 }));

            await exportToPDF(dataWithSno, selectedDate, companyName, fileName, appliedFilters, filterLabels);

            showToast('PDF exported successfully!', 'success');
            setExportDropdown(false);
        } catch (error) {
            showToast('Failed to export PDF: ' + error.message, 'error');
            setExportDropdown(false);
        }
    }, [filteredData, selectedDate, appliedFilters]);

    const handleExportToExcel = useCallback(async () => {
        try {
            if (!filteredData || filteredData.length === 0) {
                showToast('No data available to export', 'error');
                return;
            }
            const exportData = filteredData.map((emp) => ({
                'Employee Name': emp.employee_name,
                'Employee Code': emp.employee_code || '',
                'Shift': emp.shift_name,
                'Shift Time': `${emp.shift_from_time} - ${emp.shift_to_time}`,
                'Clock In': emp.attandance_first_clock_in || '--',
                'Clock Out': emp.attandance_last_clock_out || '--',
                'Working Hours': emp.shift_working_hours ? `${emp.shift_working_hours}` : '--',
                'Attendance Hours': emp.attandance_hours ? `${emp.attandance_hours}` : '--',
                'Remaining Hours': emp.late_hours && parseFloat(emp.late_hours) > 0 ? `${emp.late_hours}` : '--',
                'Overtime Hours': emp.overtime_hours && parseFloat(emp.overtime_hours) > 0 ? `${emp.overtime_hours}` : '--',
                Status: emp.status || '--'
            }));

            const fileName = `daily_attendance_report_${formatDate(selectedDate)}`;
            await exportToExcel(exportData, selectedDate, fileName);
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
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }, []);

    // Auto-close dropdowns if anchor is fully off-screen
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
        <div className="h-[calc(100vh-64px)] bg-[var(--color-bg-primary)] overflow-hidden">
            {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}

            <div className="p-8 mx-auto h-full flex flex-col overflow-hidden">


                {/* Summary cards (API-driven) */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4 mb-4 sm:mb-6">
                    <SummaryCard
                        icon={Users}
                        label="Total Employees"
                        value={summaryStats.total}
                        tone="text-[var(--color-primary-dark)]"
                    />
                    <SummaryCard
                        icon={CheckCircle}
                        label="Present"
                        value={summaryStats.present}
                        tone="text-green-600"
                    />
                    <SummaryCard
                        icon={XCircle}
                        label="Absent"
                        value={summaryStats.absent}
                        tone="text-red-600"
                    />
                    <SummaryCard
                        icon={CalendarX}
                        label="Week Off"
                        value={summaryStats.weekOff}
                        tone="text-purple-600"
                    />
                    <SummaryCard
                        icon={AlertCircle}
                        label="Late Arrivals"
                        value={summaryStats.late}
                        tone="text-yellow-600"
                    />
                    <SummaryCard
                        icon={TrendingUp}
                        label="Overtime"
                        value={summaryStats.overtime}
                        tone="text-primary-600"
                    />
                </div>

                {/* Main content */}
                <div className="bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-primary-dark)] overflow-hidden shadow-sm flex flex-col flex-1 h-full">
                    <div className="px-6 py-4 border-b border-[var(--color-primary-light)] bg-[var(--color-primary-lighter)] ">





                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
                            <div className="flex items-center">
                                <Activity className="h-6 w-6 text-[var(--color-primary-darker)] mr-2" />
                                <h3 className="text-lg font-medium text-[var(--color-primary-darker)]">Daily Attendance Report</h3>
                            </div>

                            <div className="flex items-center gap-3">
                                {/* Export */}


                                <div className="relative flex items-center z-[40] w-full sm:w-[180px] xl:w-[250px]">
                                    <CustomInput
                                        type="text"
                                        name="searchQuery"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search employees..."
                                        clearable={true}
                                        icon={<Search className="w-4 h-4 text-[var(--color-text-secondary)] shrink-0" />}
                                        className="!h-[40px] [&_input]:!h-[40px] [&_input]:!leading-[40px] [&_input]:!py-0 [&_input]:!rounded-xl [&_input]:!text-xs sm:[&_input]:!text-sm"
                                    />
                                </div>

                                <div className="relative flex items-center z-[40] min-w-[140px] sm:min-w-[160px]">
                                    <CustomDatePicker
                                        name="dateOfBirth"
                                        value={selectedDate}
                                        onChange={(e) => handleDateChange(new Date(e.target.value))}
                                        placeholder="DD-MM-YYYY"
                                        maxDate={new Date()}
                                        clearable={true}
                                        className="!h-[40px] [&_button]:!h-[40px] [&_button]:!py-0 [&_button]:!rounded-xl [&_button]:!text-xs sm:[&_button]:!text-sm"
                                    />
                                </div>

                                <div className="relative">
                                    <button
                                        ref={filterBtnRef}
                                        onClick={() => setFilterDropdown((v) => !v)}
                                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[var(--color-bg-secondary)] text-[var(--color-primary-dark)] hover:bg-[var(--color-bg-primary)] px-4 h-[40px] py-0 rounded-xl font-medium text-xs sm:text-sm transition-colors whitespace-nowrap shrink-0"
                                    >
                                        <Filter className="h-4 w-4" />
                                        <span className="lg:hidden sm:hidden xl:inline">Filters</span>

                                        {getActiveFiltersCount() > 0 && (
                                            <span className="bg-[var(--color-primary-dark)] text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                                                {getActiveFiltersCount()}
                                            </span>
                                        )}
                                        <ChevronDown className="h-4 w-4 lg:hidden sm:hidden xl:inline" />

                                    </button>

                                    {filterDropdown &&
                                        createPortal(
                                            <>
                                                <div className="fixed inset-0 z-[100] bg-black/40" onClick={() => setFilterDropdown(false)} />

                                                <div
                                                    className="hidden sm:block absolute z-[110] bg-[var(--color-bg-secondary)] rounded-lg shadow-2xl border border-[var(--color-border-secondary)] max-h-[80vh] overflow-visible flex flex-col"
                                                    style={{
                                                        position: 'absolute',
                                                        top: filterPos.ready ? filterPos.top : -9999,
                                                        left: filterPos.ready ? Math.max(12, filterPos.left) : -9999,
                                                        width: Math.max(420, filterPos.width),
                                                        minWidth: 420
                                                    }}
                                                >
                                                    {/* <div className="flex items-center justify-between p-4 border-b border-[var(--color-border-secondary)]">
                                                        <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Filters </h3>
                                                        <button
                                                            onClick={() => setFilterDropdown(false)}
                                                            className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] p-1 rounded-lg hover:bg-[var(--color-bg-hover)]"
                                                        >
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
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                                                    <CheckCircle className="inline h-4 w-4 mr-1" />
                                                                    Attendance Status
                                                                </label>
                                                                {/* <select
                                                                    value={filters.attendance_status_id}
                                                                    onChange={(e) => handleFilterChange('attendance_status_id', e.target.value)}
                                                                    className="w-full px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-dark)] focus:border-transparent text-[var(--color-text-primary)] text-sm"
                                                                    disabled={dropdownLoading}
                                                                >
                                                                    <option value="">All Status</option>
                                                                    {attendanceStatuses.map((s) => (
                                                                        <option key={s.id} value={s.id}>
                                                                            {s.name}
                                                                        </option>
                                                                    ))}
                                                                </select> */}
                                                                <CustomSelect
                                                                    name="attendance_status_id"
                                                                    value={filters.attendance_status_id}
                                                                    onChange={(e) =>
                                                                        handleFilterChange(
                                                                            'attendance_status_id',
                                                                            e.target.value
                                                                        )
                                                                    }
                                                                    options={attendanceStatuses.map((s) => ({
                                                                        value: s.id,
                                                                        label: s.name,
                                                                    }))}
                                                                    placeholder="All Status"
                                                                    searchable={true}
                                                                    disabled={dropdownLoading}
                                                                />


                                                            </div>

                                                            <div>
                                                                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                                                    <Building className="inline h-4 w-4 mr-1" />
                                                                    Branch
                                                                </label>
                                                                {/* <select
                                                                    value={filters.branch_id}
                                                                    onChange={(e) => handleFilterChange('branch_id', e.target.value)}
                                                                    className="w-full px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-dark)] focus:border-transparent text-[var(--color-text-primary)] text-sm"
                                                                    disabled={dropdownLoading}
                                                                >
                                                                    <option value="">All Branches</option>
                                                                    {branches.map((b) => (
                                                                        <option key={b.id} value={b.id}>
                                                                            {b.name}
                                                                        </option>
                                                                    ))}
                                                                </select> */}
                                                                <CustomSelect
                                                                    name="branch_id"
                                                                    value={filters.branch_id}
                                                                    onChange={(e) =>
                                                                        handleFilterChange(
                                                                            'branch_id',
                                                                            e.target.value
                                                                        )
                                                                    }
                                                                    options={branches.map((b) => ({
                                                                        value: b.id,
                                                                        label: b.name,
                                                                    }))}
                                                                    placeholder="All Branches"
                                                                    searchable={true}
                                                                    disabled={dropdownLoading}
                                                                />
                                                            </div>

                                                            <div>
                                                                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                                                    <Users className="inline h-4 w-4 mr-1" />
                                                                    Department
                                                                </label>
                                                                {/* <select
                                                                    value={filters.department_id}
                                                                    onChange={(e) => handleFilterChange('department_id', e.target.value)}
                                                                    className="w-full px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-dark)] focus:border-transparent text-[var(--color-text-primary)] text-sm"
                                                                    disabled={dropdownLoading}
                                                                >
                                                                    <option value="">All Departments</option>
                                                                    {departments.map((d) => (
                                                                        <option key={d.id} value={d.id}>
                                                                            {d.name}
                                                                        </option>
                                                                    ))}
                                                                </select> */}
                                                                <CustomSelect
                                                                    name="department_id"
                                                                    value={filters.department_id}
                                                                    onChange={(e) =>
                                                                        handleFilterChange(
                                                                            'department_id',
                                                                            e.target.value
                                                                        )
                                                                    }
                                                                    options={departments.map((d) => ({
                                                                        value: d.id,
                                                                        label: d.name,
                                                                    }))}
                                                                    placeholder="All Departments"
                                                                    searchable={true}
                                                                    disabled={dropdownLoading}
                                                                />
                                                            </div>

                                                            <div>
                                                                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                                                    <Award className="inline h-4 w-4 mr-1" />
                                                                    Designation
                                                                </label>
                                                                {/* <select
                                                                    value={filters.designation_id}
                                                                    onChange={(e) => handleFilterChange('designation_id', e.target.value)}
                                                                    className="w-full px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-dark)] focus:border-transparent text-[var(--color-text-primary)] text-sm"
                                                                    disabled={dropdownLoading}
                                                                >
                                                                    <option value="">All Designations</option>
                                                                    {designations.map((d) => (
                                                                        <option key={d.id} value={d.id}>
                                                                            {d.name}
                                                                        </option>
                                                                    ))}
                                                                </select> */}
                                                                <CustomSelect
                                                                    name="designation_id"
                                                                    value={filters.designation_id}
                                                                    onChange={(e) =>
                                                                        handleFilterChange(
                                                                            'designation_id',
                                                                            e.target.value
                                                                        )
                                                                    }
                                                                    options={designations.map((d) => ({
                                                                        value: d.id,
                                                                        label: d.name,
                                                                    }))}
                                                                    placeholder="All Designations"
                                                                    searchable={true}
                                                                    disabled={dropdownLoading}
                                                                />
                                                            </div>

                                                            <div>
                                                                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                                                    <Timer className="inline h-4 w-4 mr-1" />
                                                                    Shift
                                                                </label>
                                                                {/* <select
                                                                    value={filters.shift_id}
                                                                    onChange={(e) => handleFilterChange('shift_id', e.target.value)}
                                                                    className="w-full px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-dark)] focus:border-transparent text-[var(--color-text-primary)] text-sm"
                                                                    disabled={dropdownLoading}
                                                                >
                                                                    <option value="">All Shifts</option>
                                                                    {shifts.map((s) => (
                                                                        <option key={s.id} value={s.id}>
                                                                            {s.name}
                                                                        </option>
                                                                    ))}
                                                                </select> */}
                                                                <CustomSelect
                                                                    name="shift_id"
                                                                    value={filters.shift_id}
                                                                    onChange={(e) =>
                                                                        handleFilterChange(
                                                                            'shift_id',
                                                                            e.target.value
                                                                        )
                                                                    }
                                                                    options={shifts.map((s) => ({
                                                                        value: s.id,
                                                                        label: s.name,
                                                                    }))}
                                                                    placeholder="All Shifts"
                                                                    searchable={true}
                                                                    disabled={dropdownLoading}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* <div className="flex flex-col sm:flex-row gap-2 p-4 border-t border-[var(--color-border-secondary)]">
                                                        <button
                                                            onClick={applyFilters}
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
                                                                <div>
                                                                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                                                        <CheckCircle className="inline h-4 w-4 mr-1" />
                                                                        Attendance Status
                                                                    </label>
                                                                    <select
                                                                        value={filters.attendance_status_id}
                                                                        onChange={(e) => handleFilterChange('attendance_status_id', e.target.value)}
                                                                        className="w-full px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-dark)] focus:border-transparent text-[var(--color-text-primary)] text-sm"
                                                                        disabled={dropdownLoading}
                                                                    >
                                                                        <option value="">All Status</option>
                                                                        {attendanceStatuses.map((s) => (
                                                                            <option key={s.id} value={s.id}>
                                                                                {s.name}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                </div>

                                                                <div>
                                                                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                                                        <Building className="inline h-4 w-4 mr-1" />
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
                                                                            <option key={b.id} value={b.id}>
                                                                                {b.name}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                </div>

                                                                <div>
                                                                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                                                        <Users className="inline h-4 w-4 mr-1" />
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
                                                                            <option key={d.id} value={d.id}>
                                                                                {d.name}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                </div>

                                                                <div>
                                                                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                                                        <Award className="inline h-4 w-4 mr-1" />
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
                                                                            <option key={d.id} value={d.id}>
                                                                                {d.name}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                </div>

                                                                <div>
                                                                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                                                        <Timer className="inline h-4 w-4 mr-1" />
                                                                        Shift
                                                                    </label>
                                                                    <select
                                                                        value={filters.shift_id}
                                                                        onChange={(e) => handleFilterChange('shift_id', e.target.value)}
                                                                        className="w-full px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-dark)] focus:border-transparent text-[var(--color-text-primary)] text-sm"
                                                                        disabled={dropdownLoading}
                                                                    >
                                                                        <option value="">All Shifts</option>
                                                                        {shifts.map((s) => (
                                                                            <option key={s.id} value={s.id}>
                                                                                {s.name}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                </div>
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

                                <div className="relative">
                                    <button
                                        ref={exportBtnRef}
                                        onClick={() => setExportDropdown((v) => !v)}
                                        className="flex items-center justify-center gap-2 bg-[var(--color-bg-secondary)] text-[var(--color-primary-dark)] hover:bg-[var(--color-bg-primary)] px-4 h-[40px] py-0 rounded-xl text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0"
                                    >
                                        <Download className="h-4 w-4" />
                                        <span className='lg:hidden sm:hidden xl:inline'>Export</span>
                                        <ChevronDown className="h-4 w-4 lg:hidden sm:hidden xl:inline" />
                                    </button>

                                    {exportDropdown &&
                                        exportPos.ready &&
                                        createPortal(
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

                    {/* Table */}
                    <div className="flex flex-1 flex-col custom-scrollbar min-h-0">
                        {loading ? (
                            <div className="p-8 text-center text-[var(--color-text-secondary)]">
                                <div className="flex items-center justify-center">
                                    <Loader2 className="h-8 w-8 animate-spin mr-3" />
                                    Loading...
                                </div>
                            </div>
                        ) : (filteredData?.length || 0) === 0 ? (
                            <div className="flex flex-1 h-full items-center justify-center bg-[#FBF9FD] rounded-xl">
                                <NoDataFound
                                    title="No records found"
                                    subtitle="Try adjusting your filters or select a different date."
                                />
                            </div>
                        ) : (
                            <>
                                <Table className="w-full min-w-[1200px] border-separate border-spacing-0">
                                    <TableHeader className="sticky top-0 z-10 bg-[var(--color-primary-dark)] backdrop-blur supports-[backdrop-filter]:bg-[var(--color-bg-gray-light)]/60">
                                        <TableHeaderRow>
                                            <Th className="text-center font-medium">
                                                Employee
                                            </Th>
                                            <Th className="text-center font-medium">
                                                Shift
                                            </Th>
                                            <Th className="text-center font-medium">
                                                Shift Time
                                            </Th>
                                            <Th className="text-center font-medium">
                                                Clock In
                                            </Th>
                                            <Th className="text-center font-medium">
                                                Clock Out
                                            </Th>
                                            <Th className="text-center font-medium">
                                                Working Hours
                                            </Th>
                                            <Th className="text-center font-medium">
                                                Attendance Hours
                                            </Th>
                                            <Th className="text-center font-medium">
                                                Status
                                            </Th>
                                        </TableHeaderRow>
                                    </TableHeader>
                                    <TableBody className="bg-[var(--color-bg-secondary)] divide-y divide-[var(--color-border-secondary)] ">
                                        {paginatedData.map((emp, idx) => {
                                            const timeColorClass = getTimeColor(emp);
                                            return (
                                                <TableRow
                                                    key={emp.employee_id || emp.employee_code || idx}
                                                    className={`hover:bg-[var(--color-bg-hover)] transition-colors ${getRowStyling(emp.status)}`}
                                                >
                                                    <Td className="bg-inherit">
                                                        <div className="flex flex-col text-center items-start px-6">
                                                            {/* Employee Name with truncate */}
                                                            <span
                                                                className="font-medium"
                                                                title={emp.employee_name || '--'}
                                                            >
                                                                {truncateText(emp.employee_name, 20)}
                                                            </span>

                                                            {/* Employee Code with truncate */}
                                                            <span
                                                                className="text-xs text-[var(--color-text-secondary)]"
                                                                title={emp.employee_code || '—'}
                                                            >
                                                                {truncateText(emp.employee_code, 15)}
                                                            </span>
                                                        </div>
                                                    </Td>

                                                    <Td className="px-6 py-4 text-center text-sm text-[var(--color-text-primary)]">
                                                        {emp.shift_name || '--'}
                                                    </Td>
                                                    <Td className="px-6 py-4 text-center text-sm text-[var(--color-text-primary)]">
                                                        {emp.shift_from_time && emp.shift_to_time ? `${emp.shift_from_time} - ${emp.shift_to_time}` : '--'}
                                                    </Td>
                                                    <Td className={`px-6 py-4 text-center text-sm ${timeColorClass}`}>
                                                        {emp.attandance_first_clock_in || '--'}
                                                    </Td>
                                                    <Td className={`px-6 py-4 text-center text-sm ${timeColorClass}`}>
                                                        {emp.attandance_last_clock_out || '--'}
                                                    </Td>
                                                    <Td className="px-6 py-4 text-center text-sm text-[var(--color-text-primary)]">
                                                        {emp.shift_working_hours ? `${emp.shift_working_hours}` : '--'}
                                                    </Td>
                                                    <Td className="px-6 py-4 text-center text-sm text-[var(--color-text-primary)]">
                                                        {emp.attandance_hours ? `${emp.attandance_hours}` : '--'}
                                                    </Td>
                                                    <Td className="px-6 py-4 text-center text-sm">
                                                        <span
                                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${emp.status === 'Present'
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
                                                                                    ? 'bg-primary-100 text-primary-800'
                                                                                    : emp.status === 'Incomplete'
                                                                                        ? 'bg-orange-100 text-orange-800'
                                                                                        : 'bg-gray-100 text-gray-800'
                                                                }`}
                                                        >
                                                            {emp.status || '--'}
                                                        </span>
                                                    </Td>
                                                </TableRow>
                                            );
                                        })}

                                        {/* ⬇️ Filler rows to keep 10 rows visible */}
                                        {Array.from({ length: emptyRowCount }).map((_, i) => (
                                            <TableRow key={`empty-${i}`} className="hover:bg-[var(--color-bg-hover)] transition-colors">
                                                <Td className="px-6 py-4 text-center text-sm text-transparent">—</Td>
                                                <Td className="px-6 py-4 text-center text-sm text-transparent">—</Td>
                                                <Td className="px-6 py-4 text-center text-sm text-transparent">—</Td>
                                                <Td className="px-6 py-4 text-center text-sm text-transparent">—</Td>
                                                <Td className="px-6 py-4 text-center text-sm text-transparent">—</Td>
                                                <Td className="px-6 py-4 text-center text-sm text-transparent">—</Td>
                                                <Td className="px-6 py-4 text-center text-sm text-transparent">—</Td>
                                                <Td className="px-6 py-4 text-center text-sm text-transparent">—</Td>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>

                                {/* ⬇️ Pagination controls */}
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={setCurrentPage}
                                    loading={loading}
                                    className="!py-5 bg-white border-t border-[var(--color-border-secondary)] !my-0"
                                />
                            </>
                        )}
                    </div>

                    {/* Summary at bottom */}
                    {/* <div className="px-6 py-4 border-t border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)]">
                        <div className="flex justify-end items-center text-sm text-[var(--color-text-secondary)]">
                            <div className="flex items-center space-x-4">
                                <span className="flex items-center">
                                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                                    Present ({summaryStats.present})
                                </span>
                                <span className="flex items-center">
                                    <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                                    Absent ({summaryStats.absent})
                                </span>
                                <span className="flex items-center">
                                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                                    Late ({summaryStats.late})
                                </span>
                                <span className="flex items-center">
                                    <div className="w-3 h-3 bg-primary-500 rounded-full mr-2"></div>
                                    Overtime ({summaryStats.overtime})
                                </span>
                                <span className="flex items-center">
                                    <div className="w-3 h-3 bg-purple-600 rounded-full mr-2"></div>
                                    Week Off ({summaryStats.weekOff})
                                </span>
                            </div>
                        </div>
                    </div> */}
                </div>
            </div>

            {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
        </div>
    );
};

export default DailyReport;
