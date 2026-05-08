import React, { useState, useCallback, useMemo, useEffect } from 'react';
import Pagination from '../Pagination';
import {
    Users, CheckCircle, UserX, Coffee, TrendingUp, Calendar,
    Activity, Search, XCircle, ChevronDown, ChevronUp, Clock, Timer
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useDashboardData } from '../../context/DashboardContext';
import { StatusBadge } from '../../Components/Report/ReportComponents';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosInstance';
import {Toast} from '../ui/Toast';

const SORT_DIRECTIONS = {
    ASCENDING: 'ascending',
    DESCENDING: 'descending'
};

const COLUMN_KEYS = {
    NAME: 'name',
    SHIFT: 'shift',
    CLOCK_IN: 'clockIn',
    CLOCK_OUT: 'clockOut',
    WORK_HOURS: 'workHours',
    STATUS: 'status'
};

const KEY_MAPPING = {
    [COLUMN_KEYS.NAME]: 'employee_name',
    [COLUMN_KEYS.SHIFT]: 'shift_name',
    [COLUMN_KEYS.CLOCK_IN]: 'attandance_first_clock_in',
    [COLUMN_KEYS.CLOCK_OUT]: 'attandance_last_clock_out',
    [COLUMN_KEYS.WORK_HOURS]: 'attandance_hours',
    [COLUMN_KEYS.STATUS]: 'status'
};

const AttendanceReport = () => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [hoveredSegment, setHoveredSegment] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortConfig, setSortConfig] = useState({
        key: null,
        direction: SORT_DIRECTIONS.ASCENDING
    });

    const { user } = useAuth();

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(5);
    const [attendanceStatuses, setAttendanceStatuses] = useState([]);

    const [toast, setToast] = useState(null);
    const [hasShownPendingToast, setHasShownPendingToast] = useState(false);


    // Updated to use attendanceStatusId from context
    const {
        dashboardData,
        loading,
        setDate,
        setYearMonth,
        attendanceStatusId,
        setAttendanceStatusId
    } = useDashboardData();

    useEffect(() => {
        const pendingLeave = Number(dashboardData?.total_pending_leave || 0);

        if (pendingLeave > 0 && !hasShownPendingToast) {
            setToast({
                type: 'success',
                message: `You have ${pendingLeave} pending leave request${pendingLeave > 1 ? 's' : ''}`
            });
            setHasShownPendingToast(true);
        }

        if (pendingLeave === 0 && hasShownPendingToast) {
            setHasShownPendingToast(false);
        }
    }, [dashboardData?.total_pending_leave, hasShownPendingToast]);

    // Attendance rows from API (now filtered server-side)
    const attendanceData = useMemo(() => {
        if (!dashboardData || !dashboardData.attendance_details) return [];
        return dashboardData.attendance_details || [];
    }, [dashboardData]);

    // Prefer API totals (cards/donut). Fall back to calculating from rows if not present.
    const fallbackStatsFromRows = useMemo(() => {
        if (!attendanceData?.length) {
            return { totalEmployees: 0, present: 0, absent: 0, weekOff: 0, productivity: 0 };
        }
        let present = 0, absent = 0, weekOff = 0;
        attendanceData.forEach(e => {
            const id = e.status_id;
            if (id === '1' || id === 1 || id === 4 || id === '4' || id === 5 || id === '5') {
                present += 1;
            }
            else if (id === '2' || id === 2) absent += 1;
            else if (id === '3' || id === 3) weekOff += 1;
        });
        const total = attendanceData.length;
        return {
            totalEmployees: total,
            present,
            absent,
            weekOff,
            productivity: total ? Math.round((present / total) * 100) : 0
        };
    }, [attendanceData]);

    const stats = useMemo(() => {
        if (dashboardData) {
            const total = Number(dashboardData.total_employee || 0);
            const present = Number(dashboardData.present_employee || 0);
            const absent = Number(dashboardData.absent_employee || 0);
            const weekOff = Number(dashboardData.week_of_employee || 0);
            const rate = Number(dashboardData.attendance_rate || 0);

            // If API sent coherent totals, use them; else fallback to rows
            const apiHasTotals = total || present || absent || weekOff || rate;
            if (apiHasTotals) {
                return {
                    totalEmployees: total,
                    present,
                    absent,
                    weekOff,
                    productivity: rate
                };
            }
        }
        return fallbackStatsFromRows;
    }, [dashboardData, fallbackStatsFromRows]);

    const fetchDropdownData = useCallback(async () => {
        try {
            if (!user?.user_id) throw new Error('User ID is required');

            const formData = new FormData();

            const baseResp = await api.post('employee_drop_down_list', formData);
            if (baseResp.data?.success && baseResp.data.data) {
                const data = baseResp.data.data;

                setAttendanceStatuses((data.attendance_status || []).map((s) => ({
                    id: s.attendance_status_id ?? s.id ?? s.status_id,
                    name: s.name ?? s.status_name ?? s.label
                })));
            } else {
                throw new Error(baseResp.data?.message || 'Failed to fetch org dropdowns');
            }
        } catch (err) {
            const msg = err.message || 'Failed to load filter options';
        }
    }, [user?.user_id]);

    useEffect(() => {
        fetchDropdownData();
    }, [fetchDropdownData]);

    const statusOptions = useMemo(() => {
        const dynamic = Array.isArray(attendanceStatuses)
            ? attendanceStatuses
                .filter(s => s && s.name && s.id)
                .map(s => ({ value: s.id, label: s.name })) // Use id as value instead of name
            : [];

        return [
            { value: 'all', label: 'All Status' },
            ...dynamic
        ];
    }, [attendanceStatuses]);

    // Date change — keeps your original context-driven fetching
    const handleDateChange = (date) => {
        setSelectedDate(date);
        const formattedDate = date.toISOString().split('T')[0]; // yyyy-mm-dd
        const formattedMonth = formattedDate.slice(0, 7);        // yyyy-mm
        setDate(formattedDate);
        setYearMonth(formattedMonth);
        setCurrentPage(1);
        setSearchQuery('');
        setStatusFilter('all');
        setAttendanceStatusId('all'); // Reset status filter in context
    };

    // Client-side filtering + sorting (now only search and sort, status filtering is server-side)
    const filteredAndSortedData = useMemo(() => {
        let filtered = Array.isArray(attendanceData) ? [...attendanceData] : [];

        // Search (still client-side)
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(e =>
                e.employee_name?.toLowerCase().includes(q) ||
                e.employee_code?.toLowerCase().includes(q) ||
                e.shift_name?.toLowerCase().includes(q)
            );
        }

        // Status filtering is now handled server-side, so we don't filter here anymore

        // Sort
        if (sortConfig.key) {
            filtered.sort((a, b) => {
                const actualKey = KEY_MAPPING[sortConfig.key] || sortConfig.key;
                const aValue = a?.[actualKey] ?? '';
                const bValue = b?.[actualKey] ?? '';

                if (sortConfig.key === COLUMN_KEYS.CLOCK_IN || sortConfig.key === COLUMN_KEYS.CLOCK_OUT) {
                    const aTime = aValue ? new Date(`2000-01-01 ${aValue}`) : new Date(0);
                    const bTime = bValue ? new Date(`2000-01-01 ${bValue}`) : new Date(0);
                    return sortConfig.direction === SORT_DIRECTIONS.ASCENDING
                        ? aTime.getTime() - bTime.getTime()
                        : bTime.getTime() - aTime.getTime();
                }

                if (sortConfig.key === COLUMN_KEYS.WORK_HOURS) {
                    const aNum = parseFloat(aValue) || 0;
                    const bNum = parseFloat(bValue) || 0;
                    return sortConfig.direction === SORT_DIRECTIONS.ASCENDING ? aNum - bNum : bNum - aNum;
                }

                // lexical
                if (aValue < bValue) return sortConfig.direction === SORT_DIRECTIONS.ASCENDING ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === SORT_DIRECTIONS.ASCENDING ? 1 : -1;
                return 0;
            });
        }

        return filtered;
    }, [attendanceData, searchQuery, sortConfig]); // Removed statusFilter dependency

    // Pagination
    const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = filteredAndSortedData.slice(startIndex, startIndex + itemsPerPage);

    // Stable table height
    const MIN_ROWS = 5;
    const fillerCount = Math.max(0, MIN_ROWS - (Array.isArray(paginatedData) ? paginatedData.length : 0));

    // Sorting handler
    const requestSort = useCallback((key) => {
        setSortConfig(prev => {
            const direction =
                prev.key === key && prev.direction === SORT_DIRECTIONS.ASCENDING
                    ? SORT_DIRECTIONS.DESCENDING
                    : SORT_DIRECTIONS.ASCENDING;
            return { key, direction };
        });
    }, []);

    // Row styling by status
    const getRowStyling = (status = '') => {
        const s = status.toString().trim().toLowerCase();

        switch (s) {
            case 'week off':
            case 'weekoff':
                return '!bg-[var(--color-primary-lightest)] border-l-4 border-[var(--color-primary)]';
            case 'holiday':
                return '!bg-[var(--color-warning-light)] border-l-4 border-[var(--color-warning)]';
            case 'absent':
                return '!bg-[var(--color-cell-a-bg)] border-l-4 border-[var(--color-error)]';
            case 'leave':
                return '!bg-[var(--color-yellow-light)] border-l-4 border-[var(--color-yellow-dark)]';
            case 'half day':
                return '!bg-[var(--color-primary-lighter)] border-l-4 border-[var(--color-primary-dark)]';
            default:
                return '';
        }
    };

    const formatTime = (t) => (!t ? '-' : t);
    const formatHours = (h) => (!h || h === '0' ? '-' : `${h}`);

    const renderSortIcon = useCallback((key) => {
        if (sortConfig.key !== key) return <ChevronDown className="ml-1 h-4 w-4 text-gray-400" />;
        return sortConfig.direction === SORT_DIRECTIONS.ASCENDING
            ? <ChevronUp className="ml-1 h-4 w-4 text-primary-600" />
            : <ChevronDown className="ml-1 h-4 w-4 text-primary-600" />;
    }, [sortConfig]);

    const handleClearSearch = () => {
        setSearchQuery('');
        setCurrentPage(1);
    };

    // Updated filter change handler to use server-side filtering
    const handleFilterChange = (v) => {
        setStatusFilter(v);
        setAttendanceStatusId(v); // This will trigger API call with the status ID
        setCurrentPage(1);
    };

    const handleClearFilters = () => {
        setSearchQuery('');
        setStatusFilter('all');
        setAttendanceStatusId('all'); // Reset server-side filter
        setCurrentPage(1);
    };

    // Donut chart (accepts setHoveredSegment; hover handled in legend below)
    const DonutChart = ({ stats, hoveredSegment }) => {
        const data = [
            { name: 'Present', value: stats.present, color: 'var(--color-success)', key: 'present' },
            { name: 'Absent', value: stats.absent, color: 'var(--color-error)', key: 'absent' },
            { name: 'Week Off', value: stats.weekOff, color: 'var(--color-warning)', key: 'weekoff' }
        ];
        const { totalEmployees } = stats;

        if (!totalEmployees) {
            return (
                <div className="flex items-center justify-center h-48 text-[var(--color-text-muted)]">
                    <div className="text-center">
                        <Users size={32} className="mx-auto mb-2 opacity-50" />
                        <p className="font-medium">No Data</p>
                        <p className="text-sm">No attendance records for this day.</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="relative w-48 h-48 mx-auto">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value" paddingAngle={5}>
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.color}
                                    stroke={entry.color}
                                    opacity={hoveredSegment && hoveredSegment !== entry.key ? 0.3 : 1}
                                    strokeWidth={hoveredSegment === entry.key ? 3 : 1}
                                />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-[var(--color-text-primary)]">{totalEmployees}</span>
                    <span className="text-sm text-[var(--color-text-secondary)]">Employees</span>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--color-bg-primary)]">
                <div className="p-8  mx-auto">
                    <div className="bg-[var(--color-bg-secondary)] rounded-2xl shadow-xl mb-8 overflow-hidden">
                        <div className="bg-gradient-to-r from-[var(--color-primary-dark)] to-[var(--color-primary-darkest)] p-8">
                            <div className="animate-pulse">
                                <div className="h-8 bg-[var(--color-bg-secondary-20)] rounded w-1/3 mb-2"></div>
                                <div className="h-4 bg-[var(--color-bg-secondary-20)] rounded w-1/2"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Header */}
            <div className="bg-[var(--color-bg-secondary)] rounded-2xl shadow-xl mb-6 overflow-hidden">
                <div className="bg-gradient-to-r from-[var(--color-primary-dark)] to-[var(--color-primary-darker)] p-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-[var(--color-text-white)] mb-2">DASHBOARD</h1>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2 ">
                            <Calendar className="w-5 h-5 text-[var(--color-text-white)]" />
                            <DatePicker
                                selected={selectedDate}
                                onChange={(date) => handleDateChange(date)}
                                dateFormat="dd-MM-yyyy"
                                placeholderText="DD-MM-YYYY"
                                className="w-full bg-[var(--color-bg-secondary-20)] border border-[var(--color-bg-secondary-30)] rounded-lg px-3 py-2 text-sm text-[var(--color-text-white)] placeholder-[var(--color-text-white-90)] focus:outline-none focus:ring-2 focus:ring-[var(--color-bg-secondary-30)]"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                <div className="bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-secondary)] p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-[var(--color-text-secondary)]">Total Employees</p>
                            <p className="text-xl font-bold text-[var(--color-text-primary)]">{stats.totalEmployees}</p>
                        </div>
                        <div className="p-2 bg-[var(--color-primary-lightest)] rounded-full">
                            <Users className="w-5 h-5 text-[var(--color-primary)]" />
                        </div>
                    </div>
                </div>
                <div className="bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-secondary)] p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-[var(--color-text-secondary)]">Present</p>
                            <p className="text-xl font-bold text-[var(--color-success)]">{stats.present}</p>
                        </div>
                        <div className="p-2 bg-[var(--color-success-light)] rounded-full">
                            <CheckCircle className="w-5 h-5 text-[var(--color-success)]" />
                        </div>
                    </div>
                </div>
                <div className="bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-secondary)] p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-[var(--color-text-secondary)]">Absent</p>
                            <p className="text-xl font-bold text-[var(--color-error)]">{stats.absent}</p>
                        </div>
                        <div className="p-2 bg-[var(--color-error-light)] rounded-full">
                            <UserX className="w-5 h-5 text-[var(--color-error)]" />
                        </div>
                    </div>
                </div>
                <div className="bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-secondary)] p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-[var(--color-text-secondary)]">Week Off</p>
                            <p className="text-xl font-bold text-[var(--color-warning)]">{stats.weekOff}</p>
                        </div>
                        <div className="p-2 bg-[var(--color-warning-light)] rounded-full">
                            <Coffee className="w-5 h-5 text-[var(--color-warning)]" />
                        </div>
                    </div>
                </div>
                <div className="bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-secondary)] p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-[var(--color-text-secondary)]">Attendance Rate</p>
                            <p className="text-xl font-bold text-[var(--color-primary)]">{stats.productivity}%</p>
                        </div>
                        <div className="p-2 bg-[var(--color-primary-lightest)] rounded-full">
                            <TrendingUp className="w-5 h-5 text-[var(--color-primary)]" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:items-stretch">
                {/* Chart Section */}
                <div className="lg:col-span-1">
                    <div className="bg-[var(--color-bg-secondary)] rounded-lg shadow-sm p-8 h-full flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Attendance Overview</h3>
                            <span className="text-sm text-[var(--color-text-muted)] bg-[var(--color-bg-gray-light)] px-3 py-1 rounded-full">
                                {new Date(selectedDate).toLocaleDateString('en-US', {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric'
                                })}
                            </span>
                        </div>

                        <DonutChart
                            stats={stats}
                            hoveredSegment={hoveredSegment}
                            setHoveredSegment={setHoveredSegment}
                        />

                        {/* Legend */}
                        <div className="flex flex-col flex-1 justify-center">
                            <div
                                className="flex items-center space-x-3 cursor-pointer transition-all duration-200 hover:scale-105 p-3 rounded-lg hover:bg-[var(--color-success-light)]"
                                onMouseEnter={() => setHoveredSegment('present')}
                                onMouseLeave={() => setHoveredSegment(null)}
                            >
                                <div className="w-4 h-4 bg-[var(--color-success)] rounded-full shadow-sm"></div>
                                <span className="text-sm text-[var(--color-text-secondary)] font-medium flex-1">AT WORK</span>
                                <span className="text-sm text-[var(--color-text-primary)] font-bold">{stats.present}</span>
                            </div>
                            <div
                                className="flex items-center space-x-3 cursor-pointer transition-all duration-200 hover:scale-105 p-3 rounded-lg hover:bg-[var(--color-error-light)]"
                                onMouseEnter={() => setHoveredSegment('absent')}
                                onMouseLeave={() => setHoveredSegment(null)}
                            >
                                <div className="w-4 h-4 bg-[var(--color-error)] rounded-full shadow-sm"></div>
                                <span className="text-sm text-[var(--color-text-secondary)] font-medium flex-1">ABSENT</span>
                                <span className="text-sm text-[var(--color-text-primary)] font-bold">{stats.absent}</span>
                            </div>
                            <div
                                className="flex items-center space-x-3 cursor-pointer transition-all duration-200 hover:scale-105 p-3 rounded-lg hover:bg-[var(--color-warning-light)]"
                                onMouseEnter={() => setHoveredSegment('weekoff')}
                                onMouseLeave={() => setHoveredSegment(null)}
                            >
                                <div className="w-4 h-4 bg-[var(--color-warning)] rounded-full shadow-sm"></div>
                                <span className="text-sm text-[var(--color-text-secondary)] font-medium flex-1">WEEK OFF</span>
                                <span className="text-sm text-[var(--color-text-primary)] font-bold">{stats.weekOff}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                <div className="lg:col-span-2">
                    <div className="bg-[var(--color-bg-secondary)] rounded-lg shadow-sm overflow-hidden h-full flex flex-col">
                        {/* Table Header */}
                        <div className="bg-gradient-to-r from-[var(--color-primary-dark)] to-[var(--color-primary-darker)] px-6 py-4 border-b border-[var(--color-border-secondary)]">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <h3 className="text-lg font-semibold text-[var(--color-text-white)]">Employee Attendance</h3>

                                {/* Search and Filters */}
                                <div className="flex flex-col sm:flex-row gap-3">
                                    {/* Search Input */}
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--color-text-muted)] w-4 h-4" />
                                        <input
                                            type="text"
                                            placeholder="Search employees..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-10 pr-10 py-2 w-full sm:w-64 border border-[var(--color-border-secondary)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-light)] focus:border-transparent bg-[var(--color-bg-primary)]"
                                        />
                                        {searchQuery && (
                                            <button
                                                onClick={handleClearSearch}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                                            >
                                                <XCircle className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>

                                    <select
                                        value={statusFilter}
                                        onChange={(e) => handleFilterChange(e.target.value)}
                                        className="px-3 py-2 border border-[var(--color-border-secondary)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-light)] focus:border-transparent bg-[var(--color-bg-primary)]"
                                    >
                                        {statusOptions.map(option => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>

                                    {(searchQuery || statusFilter !== 'all') && (
                                        <button
                                            onClick={handleClearFilters}
                                            className="px-3 py-2 text-sm bg-[var(--color-bg-gray-light)] text-[var(--color-text-secondary)] rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors"
                                        >
                                            Clear
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="flex-1 overflow-x-hidden">
                            <div className="overflow-hidden">
                                <table className="w-full table-auto border-separate border-spacing-0">
                                    <thead className="bg-[var(--color-bg-gray-light)]/80 backdrop-blur sticky top-0 ">
                                        <tr className="text-left">
                                            {[
                                                { key: COLUMN_KEYS.NAME, label: 'Employee Name' },
                                                { key: COLUMN_KEYS.SHIFT, label: 'Shift' },
                                                { key: COLUMN_KEYS.CLOCK_IN, label: 'Clock In' },
                                                { key: COLUMN_KEYS.CLOCK_OUT, label: 'Clock Out' },
                                                { key: COLUMN_KEYS.WORK_HOURS, label: 'Work Hours' },
                                                { key: COLUMN_KEYS.STATUS, label: 'Status' }
                                            ].map(col => (
                                                <th
                                                    key={col.key}
                                                    className="px-4 py-3 cursor-pointer select-none text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider"
                                                    onClick={() => requestSort(col.key)}
                                                >
                                                    <div className="flex items-center gap-1">
                                                        <span>{col.label}</span>
                                                        {renderSortIcon(col.key)}
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {paginatedData.length ? (
                                            <>
                                                {paginatedData.map((employee, index) => (
                                                    <tr
                                                        key={`${employee.employee_code}-${index}`}
                                                        className={[
                                                            'transition-all',
                                                            'odd:bg-[var(--color-bg-secondary)] even:bg-[var(--color-bg-secondary)]',
                                                            'hover:bg-[var(--color-bg-hover)]',
                                                            'border-b border-[var(--color-border-secondary)]',
                                                            getRowStyling(employee.status)
                                                        ].join(' ')}
                                                    >
                                                        {/* NAME */}
                                                        <td className="px-4 py-3 align-middle min-w-[160px] max-w-[220px]">
                                                            <div className="flex items-center gap-3 min-w-0">
                                                                <div className="h-8 w-8 flex-shrink-0 rounded-full bg-[var(--color-primary-dark)] flex items-center justify-center">
                                                                    <span className="text-sm font-medium text-[var(--color-text-white)]">
                                                                        {employee.employee_name?.charAt(0)?.toUpperCase() || 'U'}
                                                                    </span>
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <div
                                                                        className="text-sm font-medium text-[var(--color-text-primary)] truncate"
                                                                        title={employee.employee_name || 'Unknown'}
                                                                    >
                                                                        {employee.employee_name || 'Unknown'}
                                                                    </div>
                                                                    <div
                                                                        className="text-[11px] text-[var(--color-text-primary)] mt-0.5 truncate"
                                                                        title={employee.employee_code || '--'}
                                                                    >
                                                                        {employee.employee_code || '--'}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* SHIFT */}
                                                        <td className="px-4 py-3 align-middle whitespace-nowrap">
                                                            <span className="inline-flex items-center rounded-full border border-[var(--color-border-secondary)] px-2 py-0.5 text-xs text-[var(--color-text-primary)]">
                                                                {employee.shift_name || '-'}
                                                            </span>
                                                        </td>

                                                        {/* CLOCK IN */}
                                                        <td className="px-4 py-3 align-middle whitespace-nowrap">
                                                            <div className="flex items-center gap-1.5 text-sm text-[var(--color-text-primary)]">
                                                                <Clock className="w-4 h-4 text-[var(--color-text-muted)]" />
                                                                <span>{formatTime(employee.attandance_first_clock_in)}</span>
                                                            </div>
                                                        </td>

                                                        {/* CLOCK OUT */}
                                                        <td className="px-4 py-3 align-middle whitespace-nowrap">
                                                            <div className="flex items-center gap-1.5 text-sm text-[var(--color-text-primary)]">
                                                                <Timer className="w-4 h-4 text-[var(--color-text-muted)]" />
                                                                <span>{formatTime(employee.attandance_last_clock_out)}</span>
                                                            </div>
                                                        </td>

                                                        {/* HOURS */}
                                                        <td className="px-4 py-3 align-middle whitespace-nowrap">
                                                            <span className="text-sm text-[var(--color-text-primary)]">
                                                                {formatHours(employee.attandance_hours)}
                                                            </span>
                                                        </td>

                                                        {/* STATUS */}
                                                        <td className="px-4 py-3 align-middle whitespace-nowrap">
                                                            <StatusBadge status={employee.status} />
                                                        </td>
                                                    </tr>
                                                ))}

                                                {Array.from({ length: fillerCount }).map((_, i) => (
                                                    <tr key={`filler-${i}`} className="opacity-0 pointer-events-none">
                                                        <td colSpan={6} className="px-4 py-3">&nbsp;</td>
                                                    </tr>
                                                ))}
                                            </>
                                        ) : (
                                            <tr>
                                                <td colSpan={6} className="px-4 py-12 text-center">
                                                    <div className="flex flex-col items-center justify-center text-[var(--color-text-muted)]" style={{ minHeight: 56 * MIN_ROWS }}>
                                                        <Activity className="w-12 h-12 mb-4 opacity-50" />
                                                        <h3 className="text-lg font-medium mb-2">No attendance records found</h3>
                                                        <p className="text-sm">
                                                            {searchQuery || statusFilter !== 'all'
                                                                ? 'Try adjusting your search or filter criteria'
                                                                : 'No attendance data available for the selected date'}
                                                        </p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                </div>
            </div>
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </>
    );
};

export default AttendanceReport;