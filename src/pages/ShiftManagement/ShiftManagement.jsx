/* eslint-disable no-unused-vars */
import { useState, useEffect, useRef } from 'react';
import { Calendar, Users, Edit, Trash2, Plus, X, Search, RefreshCw, XCircle, Eye, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosInstance';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Toast } from '../../Components/ui/Toast';
import { ConfirmDialog } from '../../Components/comman/ConfirmDialog';
import Pagination from '../../Components/Pagination';
import { Table, TableHeader, TableBody, TableRow, TableHeaderRow, Th, Td } from '../../Components/ui/Table';
import CustomInput from '../../Components/comman/CustomInput';
import LoadingSpinner from '../../Components/Loader/LoadingSpinner';
import NoDataFound from "../../Components/comman/NoDataFound";

// Day Status Legend Component
const DayStatusLegend = () => {
    return (
        <div className="w-full lg:w-36 bg-[var(--color-bg-secondary)] border border-[var(--color-primary-dark)] rounded-lg shadow-sm flex flex-col items-stretch">
            {/* Header */}
            <div className="px-6 py-4 bg-[var(--color-primary-dark)] rounded-t-lg flex items-center justify-center" style={{ minHeight: '70px' }}>
                <h3 className="text-lg font-medium text-[var(--color-text-white)] text-center m-0 p-0">Day Status</h3>
            </div>
            {/* Content */}
            <div className="flex flex-row lg:flex-col items-center justify-center lg:justify-start gap-6 p-3">
                <div className="flex flex-col items-center gap-1">
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-xs text-[var(--color-text-secondary)] font-medium">W</span>
                    </div>
                    <span className="text-xs text-[var(--color-text-secondary)] text-center">Week Off</span>
                </div>

                <div className="flex flex-col items-center gap-1">
                    <div className="w-8 h-8 rounded-full bg-[var(--color-bg-secondary)] border-2 border-[var(--color-primary)]" />
                    <span className="text-xs text-[var(--color-text-secondary)] text-center">Occasional</span>

                </div>
                <div className="flex flex-col items-center gap-1">
                    <div className="w-8 h-8 rounded-full bg-[var(--color-primary-dark)] flex items-center justify-center">
                        <span className="text-xs text-[var(--color-text-white)] font-medium">D</span>
                    </div>
                    <span className="text-xs text-[var(--color-text-secondary)] text-center">Working Day</span>
                </div>
            </div>
        </div>
    );
};

// Employee Modal Component (Defined outside ShiftManagement to prevent re-creation lag on state updates)
const EmployeeModal = ({ isOpen, onClose, employees, loading, shiftName }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-backdropFadeIn">
            <div className="bg-[var(--color-bg-secondary)] rounded-2xl shadow-2xl border border-[var(--color-border-secondary)] max-w-lg w-full overflow-hidden flex flex-col max-h-[85vh] animate-modalPop">
                {/* Header */}
                <div className="px-6 py-4 bg-gradient-to-r from-[var(--color-primary-dark)] to-[var(--color-primary-darker)] text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/10 rounded-xl">
                            <Users className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                                Assigned Employees
                            </h3>
                            <p className="text-xs text-white/80 font-medium">
                                Shift: {shiftName}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="bg-white/20 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                            {loading ? '...' : `${employees.length} Total`}
                        </span>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
                            aria-label="Close"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--color-primary-dark)] border-t-transparent"></div>
                            <span className="text-xs sm:text-sm text-[var(--color-text-secondary)] font-medium">
                                Loading assigned employees...
                            </span>
                        </div>
                    ) : employees.length > 0 ? (
                        <div className="space-y-3">
                            {employees.map((employee, index) => (
                                <div
                                    key={employee.id || employee.employee_id || index}
                                    className="flex items-center justify-between p-3.5 bg-[var(--color-bg-primary)] hover:bg-[var(--color-bg-hover,#f9fafb)] border border-[var(--color-border-secondary)] rounded-xl transition-colors duration-150 shadow-xs"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 bg-gradient-to-br from-[var(--color-primary-dark)] to-[var(--color-primary-darker)] rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0">
                                            {(employee.full_name || employee.name)?.charAt(0)?.toUpperCase() || 'E'}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-semibold text-sm text-[var(--color-text-primary)] truncate">
                                                {employee.full_name || employee.name || 'Unknown Employee'}
                                            </p>
                                            {employee.employee_code && (
                                                <p className="text-xs text-[var(--color-text-muted)] font-mono">
                                                    {employee.employee_code}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    {employee.cdate && (
                                        <div className="text-right shrink-0">
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border-secondary)] text-[11px] font-medium text-[var(--color-text-secondary)]">
                                                <Calendar className="w-3 h-3 text-[var(--color-primary-dark)]" />
                                                {employee.cdate}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 px-4">
                            <div className="w-16 h-16 bg-[var(--color-primary-lightest,#f3e8ff)] rounded-2xl flex items-center justify-center mx-auto mb-3">
                                <Users className="w-8 h-8 text-[var(--color-primary-dark)]" />
                            </div>
                            <h4 className="text-base font-semibold text-[var(--color-text-primary)] mb-1">
                                No Employees Assigned
                            </h4>
                            <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] max-w-xs mx-auto">
                                There are currently no employees assigned to this shift configuration.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-3 bg-[var(--color-bg-primary)] border-t border-[var(--color-border-secondary)] flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border-secondary)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] text-xs sm:text-sm font-medium rounded-xl transition-colors cursor-pointer"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

// Custom Styled Month Picker Component
const CustomMonthPicker = ({ value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    // Parse YYYY-MM
    const [year, monthNum] = (value || '').split('-').map(Number);
    const currentYear = year || new Date().getFullYear();
    const currentMonthIdx = (monthNum ? monthNum - 1 : new Date().getMonth());

    const [viewYear, setViewYear] = useState(currentYear);

    useEffect(() => {
        if (year) setViewYear(year);
    }, [year]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const MONTH_NAMES = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    const FULL_MONTH_NAMES = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const handleSelectMonth = (mIdx) => {
        const formattedMonth = String(mIdx + 1).padStart(2, '0');
        const newValue = `${viewYear}-${formattedMonth}`;
        onChange(newValue);
        setIsOpen(false);
    };

    const handleThisMonth = () => {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        setViewYear(y);
        onChange(`${y}-${m}`);
        setIsOpen(false);
    };

    const displayString = `${FULL_MONTH_NAMES[currentMonthIdx] || 'Select Month'}, ${currentYear}`;

    return (
        <div className="relative" ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white text-xs font-semibold px-3 py-1.5 rounded-xl backdrop-blur-md border border-white/25 transition-all cursor-pointer shadow-xs"
            >
                <Calendar className="w-3.5 h-3.5 text-white/90" />
                <span>{displayString}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-white/80 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 z-50 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 animate-modalPop text-slate-800">
                    {/* Year Navigation Header */}
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 mb-3">
                        <button
                            type="button"
                            onClick={() => setViewYear(prev => prev - 1)}
                            className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                            title="Previous Year"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="font-bold text-sm text-[#340C8E] font-mono">
                            {viewYear}
                        </span>
                        <button
                            type="button"
                            onClick={() => setViewYear(prev => prev + 1)}
                            className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                            title="Next Year"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    {/* 12 Months Grid */}
                    <div className="grid grid-cols-4 gap-1.5 mb-3">
                        {MONTH_NAMES.map((mName, idx) => {
                            const isSelected = viewYear === currentYear && idx === currentMonthIdx;
                            return (
                                <button
                                    key={mName}
                                    type="button"
                                    onClick={() => handleSelectMonth(idx)}
                                    className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${isSelected
                                        ? 'bg-[#340C8E] text-white shadow-md scale-105'
                                        : 'text-slate-700 hover:bg-purple-50 hover:text-[#340C8E]'
                                        }`}
                                >
                                    {mName}
                                </button>
                            );
                        })}
                    </div>

                    {/* Footer Quick Actions */}
                    <div className="pt-2 border-t border-slate-100 flex justify-end">
                        <button
                            type="button"
                            onClick={handleThisMonth}
                            className="text-[11px] font-bold text-[#340C8E] hover:underline cursor-pointer"
                        >
                            This month
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// Helper to format time directly as returned from API response
const formatShiftTime = (fromTime, toTime) => {
    if (!fromTime && !toTime) return '-';
    if (fromTime && toTime) return `${fromTime} - ${toTime}`;
    return fromTime || toTime || '-';
};

// Helper for status text fallback
const getDayStatusTextFallback = (shiftType) => {
    switch (String(shiftType)) {
        case "1":
            return 'Working Day';
        case "2":
            return 'Week Off';
        case "3":
            return 'Occasional Working';
        default:
            return 'Week Off';
    }
};

// Shift Day Date Modal Component (Defined outside ShiftManagement to prevent re-creation lag/stutter on state updates)
const ShiftDayDateModal = ({ isOpen, onClose, shiftName, shiftId, selectedMonth, datesList, totalRecords, loading, onMonthChange }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-backdropFadeIn">
            <div className="bg-[var(--color-bg-secondary)] rounded-2xl shadow-2xl border border-[var(--color-border-secondary)] max-w-3xl w-full overflow-hidden flex flex-col max-h-[85vh] animate-modalPop">
                {/* Header */}
                <div className="px-6 py-4 bg-gradient-to-r from-[var(--color-primary-dark)] to-[var(--color-primary-darker)] text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/10 rounded-xl">
                            <Calendar className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                                Shift Days & Dates List
                            </h3>
                            <p className="text-xs text-white/80 font-medium truncate max-w-xs">
                                Shift: {shiftName}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Styled Custom Month Picker */}
                        <CustomMonthPicker
                            value={selectedMonth}
                            onChange={(newMonth) => onMonthChange(shiftId, shiftName, newMonth)}
                        />

                        {/* Total Count Badge */}
                        <span className="bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-xl backdrop-blur-md border border-white/20 whitespace-nowrap">
                            {loading ? '...' : `Total: ${totalRecords}`}
                        </span>

                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
                            aria-label="Close"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content Table / List */}
                <div className="p-6 flex-1 overflow-y-auto custom-scrollbar-slim">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--color-primary-dark)] border-t-transparent"></div>
                            <span className="text-xs sm:text-sm text-[var(--color-text-secondary)] font-medium">
                                Loading shift dates for {selectedMonth}...
                            </span>
                        </div>
                    ) : datesList && datesList.length > 0 ? (
                        <div className="border border-[var(--color-border-secondary)] rounded-xl overflow-hidden">
                            <Table wrapperClassName="custom-scrollbar-slim max-h-[55vh]" className="min-w-full divide-y divide-[var(--color-border-divider)]">
                                <TableHeader className="bg-[var(--color-primary-dark)]">
                                    <TableHeaderRow>
                                        <Th className="px-4 py-3 text-left text-xs font-semibold text-white">Date</Th>
                                        <Th className="px-4 py-3 text-left text-xs font-semibold text-white">Day Name</Th>
                                        <Th className="px-4 py-3 text-left text-xs font-semibold text-white">Shift Timing (From - To)</Th>
                                        <Th className="px-4 py-3 text-left text-xs font-semibold text-white">Shift Type / Status</Th>
                                    </TableHeaderRow>
                                </TableHeader>
                                <TableBody className="bg-[var(--color-bg-secondary)] divide-y divide-[var(--color-border-divider)]">
                                    {datesList.map((item, index) => {
                                        const dateVal = item.date || item.shift_date || item.cdate || item.day_date || '-';
                                        const dayName = item.day_name || item.day || item.sort_name || '-';
                                        const shiftType = String(item.shift_type || item.type || item.status_id || '');
                                        const statusLabel = item.status_label || item.status || item.shift_type_name || item.day_status || getDayStatusTextFallback(shiftType);
                                        const timeDisplay = formatShiftTime(item.from_time, item.to_time);

                                        return (
                                            <TableRow key={item.id || index} className="hover:bg-[var(--color-bg-primary)] transition-colors">
                                                <Td className="px-4 py-3 text-xs sm:text-sm font-mono font-semibold text-[var(--color-text-primary)]">
                                                    {dateVal}
                                                </Td>
                                                <Td className="px-4 py-3 text-xs sm:text-sm text-[var(--color-text-secondary)]">
                                                    {dayName}
                                                </Td>
                                                <Td className="px-4 py-3 text-xs sm:text-sm font-mono text-[var(--color-text-secondary)] whitespace-nowrap">
                                                    {timeDisplay}
                                                </Td>
                                                <Td className="px-4 py-3 text-xs sm:text-sm">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${shiftType === '1' || statusLabel.toLowerCase().includes('working')
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : shiftType === '2' || statusLabel.toLowerCase().includes('off')
                                                            ? 'bg-slate-100 text-slate-700 border border-slate-200'
                                                            : 'bg-purple-50 text-purple-700 border border-purple-200'
                                                        }`}>
                                                        {statusLabel}
                                                    </span>
                                                </Td>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="text-center py-12 px-4">
                            <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                <Calendar className="w-8 h-8 text-[var(--color-primary-dark)]" />
                            </div>
                            <h4 className="text-base font-semibold text-[var(--color-text-primary)] mb-1">
                                No Date Records Found
                            </h4>
                            <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] max-w-xs mx-auto">
                                No shift date records found for month {selectedMonth}.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-3 bg-[var(--color-bg-primary)] border-t border-[var(--color-border-secondary)] flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border-secondary)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] text-xs sm:text-sm font-medium rounded-xl transition-colors cursor-pointer"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

const ShiftManagement = () => {
    const { user } = useAuth();
    const [shifts, setShifts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchLoading, setSearchLoading] = useState(false);
    const [toast, setToast] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false });
    const navigate = useNavigate();
    const [employeeModal, setEmployeeModal] = useState({ isOpen: false, employees: [], loading: false, shiftName: '' });
    const [employeeCounts, setEmployeeCounts] = useState({});
    const permissions = useSelector(state => state.permissions) || {};

    // Helper to get current YYYY-MM month string
    const getCurrentMonth = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    };

    // Shift Date Modal State
    const [shiftDateModal, setShiftDateModal] = useState({
        isOpen: false,
        shiftId: null,
        shiftName: '',
        selectedMonth: getCurrentMonth(),
        datesList: [],
        loading: false,
        totalRecords: 0
    });

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalShifts, setTotalShifts] = useState(0);
    const ITEMS_PER_PAGE = 10;

    // Fetch shift day date list from API (shift_day_date_list)
    const fetchShiftDateList = async (shiftId, shiftName, monthToFetch) => {
        try {
            const monthVal = monthToFetch || shiftDateModal.selectedMonth || getCurrentMonth();
            setShiftDateModal(prev => ({
                ...prev,
                isOpen: true,
                shiftId,
                shiftName,
                selectedMonth: monthVal,
                loading: true
            }));

            const formData = new FormData();
            formData.append('shift_id', shiftId);
            formData.append('month', monthVal);

            const response = await api.post('shift_day_date_list', formData);

            if (response.data?.success) {
                const list = response.data.data || response.data.shift_days || response.data.dates || [];
                const total = response.data.total || response.data.total_records || list.length;
                setShiftDateModal(prev => ({
                    ...prev,
                    datesList: list,
                    totalRecords: total,
                    loading: false
                }));
            } else {
                showToast(response.data?.message || 'Failed to fetch shift day date list', 'error');
                setShiftDateModal(prev => ({ ...prev, datesList: [], totalRecords: 0, loading: false }));
            }
        } catch (error) {
            console.error('Error fetching shift day date list:', error);
            showToast('Failed to load shift dates. Please try again.', 'error');
            setShiftDateModal(prev => ({ ...prev, datesList: [], totalRecords: 0, loading: false }));
        }
    };

    useEffect(() => {
        if (!user?.user_id) return;
        const delayDebounce = setTimeout(() => {
            if (searchQuery !== '') {
                setCurrentPage(1);
                fetchShifts(1, searchQuery);
            } else {
                fetchShifts(currentPage, '');
            }
        }, 500);

        return () => clearTimeout(delayDebounce);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, searchQuery]);

    // Fetch assigned employees for a shift
    const fetchAssignedEmployees = async (shiftId, shiftName) => {
        try {
            setEmployeeModal({ isOpen: true, employees: [], loading: true, shiftName });

            const formData = new FormData();
            formData.append('shift_id', shiftId);

            const response = await api.post('assign_employee_list', formData);

            if (response.data.success) {
                const employees = response.data.data || [];
                setEmployeeModal({
                    isOpen: true,
                    employees: employees,
                    loading: false,
                    shiftName
                });

                // Update the count as well
                setEmployeeCounts(prev => ({
                    ...prev,
                    [shiftId]: employees.length
                }));
            } else {
                showToast(response.data.message || 'Failed to fetch assigned employees', 'error');
                setEmployeeModal({ isOpen: false, employees: [], loading: false, shiftName: '' });
            }
        } catch (error) {
            console.error('Error fetching assigned employees:', error);
            showToast('Failed to load assigned employees. Please try again.', 'error');
            setEmployeeModal({ isOpen: false, employees: [], loading: false, shiftName: '' });
        }
    };

    // Show toast notification
    const showToast = (message, type = 'info') => {
        setToast({ message, type });
    };

    // Close toast
    const closeToast = () => {
        setToast(null);
    };

    // Get day color and styling based on shift_type
    const getDayStyles = (shiftType) => {
        switch (shiftType) {
            case "1":
                return 'bg-[var(--color-primary-dark)] text-[var(--color-text-white)]'; // Working Day - Blue background with white text
            case "2":
                return 'bg-gray-300 text-[var(--color-text-secondary)]'; // Week Off - Gray background
            case "3":
                return 'bg-[var(--color-bg-secondary)] border-2 border-[var(--color-primary)] text-[var(--color-primary)]'; // Occasional - White background with blue border, no text
            default:
                return 'bg-gray-300 text-[var(--color-text-secondary)]';
        }
    };

    // Check if day should show text (only for working days and week off)
    const shouldShowDayText = (shiftType) => {
        return shiftType === "1" || shiftType === "2";
    };

    // Get day status text
    const getDayStatusText = (shiftType) => {
        switch (shiftType) {
            case "1":
                return 'Working Day';
            case "2":
                return 'Week Off';
            case "3":
                return 'Occasional Working';
            default:
                return 'Week Off';
        }
    };

    // Fetch employee count for a shift
    const fetchEmployeeCount = async (shiftId) => {
        try {
            const formData = new FormData();
            formData.append('shift_id', shiftId);

            const response = await api.post('assign_employee_list', formData);

            if (response.data.success) {
                const count = response.data.data ? response.data.data.length : 0;
                setEmployeeCounts(prev => ({
                    ...prev,
                    [shiftId]: count
                }));
            }
        } catch (error) {
            console.error('Error fetching employee count:', error);
            setEmployeeCounts(prev => ({
                ...prev,
                [shiftId]: 0
            }));
        }
    };

    // Generate empty rows to fill up to 10 rows
    const generateEmptyRows = (actualRows) => {
        const emptyRowsCount = Math.max(0, ITEMS_PER_PAGE - actualRows);
        return Array(emptyRowsCount).fill(null);
    };

    // Fetch shifts from API with pagination and search
    const fetchShifts = async (page = 1, search = '') => {
        try {
            // Set appropriate loading state
            if (search !== '') {
                setSearchLoading(true);
            } else {
                setLoading(true);
            }
            setError(null);

            if (!user?.user_id) {
                throw new Error('User ID is required');
            }

            const formData = new FormData();
            formData.append('page', page.toString());

            // Add search parameter if search query exists
            if (search && search.trim() !== '') {
                formData.append('search', search.trim());
            }

            const response = await api.post('shift_list', formData);

            if (response.data.success) {
                const shiftsData = response.data.data || [];
                setShifts(shiftsData);

                // Check if API provides pagination data
                const paginationData = response.data.pagination;

                if (paginationData) {
                    // Use API pagination data

                    setTotalPages(paginationData.total_pages || 1);
                    setTotalShifts(paginationData.total_records || shiftsData.length);
                    setCurrentPage(paginationData.current_page || page);
                } else {
                    if (shiftsData.length === ITEMS_PER_PAGE) {
                        setTotalPages(page + 1);
                    } else {
                        setTotalPages(page);
                    }

                    setTotalShifts(shiftsData.length);
                    setCurrentPage(page);
                }

                // Fetch employee counts for each shift
                shiftsData.forEach(shift => {
                    fetchEmployeeCount(shift.shift_id);
                });
            } else {
                throw new Error(response.data.message || 'Failed to fetch shifts');
            }
        } catch (error) {
            console.error('Error fetching shifts:', error);
            const errorMessage = error.response?.data?.message || error.message || "An unexpected error occurred";

            if (error.response?.status === 401) {
                setError("Your session has expired. Please login again.");
            } else if (error.response?.status === 403) {
                setError("You don't have permission to view shifts.");
            } else if (error.response?.status >= 500) {
                setError("Server error. Please try again later.");
            } else {
                setError(errorMessage);
            }
        } finally {
            setLoading(false);
            setSearchLoading(false);
        }
    };

    // Handle page change
    const handlePageChange = (page) => {
        setCurrentPage(page);
        fetchShifts(page, searchQuery);
    };

    // Handle search input change
    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    // Handle edit shift
    const handleEditShift = (shiftId) => {
        navigate(`/add-shift?edit=${shiftId}`);
    };

    // Handle delete shift 
    const handleDeleteShift = async (shiftId, shiftName) => {
        setConfirmDialog({
            isOpen: true,
            title: 'Delete Shift',
            message: `Are you sure you want to delete the shift "${shiftName}"? This action cannot be undone.`,
            confirmText: 'Delete',
            type: 'danger',
            onConfirm: async () => {
                try {
                    // Show loading state
                    setConfirmDialog({ isOpen: false });

                    const formData = new FormData();
                    formData.append('shift_id', shiftId);

                    const response = await api.post('shift_delete', formData);

                    if (response.data.success) {
                        showToast('Shift deleted successfully', 'success');

                        // Refresh the current page or go to previous page if current page becomes empty
                        const pageToLoad = shifts.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
                        fetchShifts(pageToLoad, searchQuery);
                    } else {
                        showToast(response.data.message || 'Failed to delete shift', 'error');
                    }
                } catch (error) {
                    console.error('Error deleting shift:', error);
                    showToast('An error occurred while deleting the shift', 'error');
                }
            }
        });
    };
    const handleAssignShift = () => {
        navigate('/assign-shift');
    };
    // Handle assign shift
    const handleReallocation = () => {
        navigate('/shift-reallocation');
    };

    // Handle create shift
    const handleCreateShift = () => {
        navigate('/add-shift');
    };

    return (
        <div className="h-[calc(100vh-64px)] bg-[var(--color-bg-primary)] relative overflow-hidden">
            {/* Shift Management header - spans full width */}
            <div className=" mx-auto p-8">

                {/* Flex row: Available Shifts card + Day Status Legend */}
                <div className="flex flex-col lg:flex-row items-start gap-8">
                    <div className="flex-1 w-full lg:w-auto order-1 overflow-x-auto">
                        {/*  card and rest of your main content */}
                        <div className="bg-[var(--color-bg-secondary)] h-[86vh] rounded-lg border border-[var(--color-primary-dark)] overflow-hidden shadow-sm">
                            {/* Header section */}
                            <div className="px-6 py-4 border-b border-[var(--color-primary-light)] bg-[var(--color-primary-lighter)] ">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center">
                                        <Calendar className="h-6 w-6 text-[var(--color-primary-darker)] mr-2" />
                                        <h3 className="text-lg font-medium text-[var(--color-primary-darker)]">
                                            Available Shifts
                                        </h3>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="relative w-full sm:w-64">

                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)] z-10" />

                                            <CustomInput
                                                type="text"
                                                name="searchQuery"
                                                value={searchQuery}
                                                onChange={handleSearchChange}
                                                placeholder="Search shifts..."
                                                clearable={!searchLoading}
                                                className="!h-[37px] [&_input]:!h-[37px] [&_input]:!pl-10 [&_input]:!pr-10 [&_input]:!rounded-md"
                                            />

                                            {searchLoading && (
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10">
                                                    <RefreshCw className="h-4 w-4 animate-spin text-[var(--color-text-muted)]" />
                                                </div>
                                            )}

                                        </div>

                                        {permissions['shift_create'] &&
                                            <button
                                                onClick={handleCreateShift}
                                                className="flex items-center gap-2 bg-[var(--color-bg-secondary)] text-[var(--color-primary-dark)] hover:bg-[var(--color-bg-primary)] px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                            >
                                                <Plus className="h-4 w-4" />
                                                Create Shift
                                            </button>
                                        }
                                        {permissions['shift_assign'] &&
                                            <button
                                                onClick={handleAssignShift}
                                                className="flex items-center gap-2 bg-[var(--color-bg-secondary)] text-[var(--color-primary-dark)] hover:bg-[var(--color-bg-primary)] px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                            >
                                                <Users className="h-4 w-4" />
                                                Assign Shift
                                            </button>
                                        }
                                        {permissions['shift_reallocation'] &&
                                            <button
                                                onClick={handleReallocation}
                                                className="flex items-center gap-2 bg-[var(--color-bg-secondary)] text-[var(--color-primary-dark)] hover:bg-[var(--color-bg-primary)] px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                            >
                                                <Users className="h-4 w-4" />
                                                Shift Reallocation
                                            </button>
                                        }
                                    </div>
                                </div>
                            </div>

                            {/* Content section */}
                            {loading ? (
                                <div className="px-0 py-0 text-center">
                                    <div className="inline-flex items-center space-x-2 text-[var(--color-text-secondary)]">
                                        <LoadingSpinner />
                                    </div>
                                </div>
                            ) : error ? (
                                <div className="px-6 py-12 text-center">
                                    <div className="bg-[var(--color-error-light)] border border-[var(--color-border-error)] rounded-lg p-8">
                                        <XCircle className="w-12 h-12 text-[var(--color-error)] mx-auto mb-4" />
                                        <p className="text-[var(--color-error-dark)] text-lg font-medium mb-2">Error Loading Shifts</p>
                                        <p className="text-[var(--color-text-error)] mb-4">{error}</p>
                                        <button
                                            onClick={() => fetchShifts(currentPage, searchQuery)}
                                            className="inline-flex items-center space-x-2 bg-[var(--color-error-light)] text-[var(--color-error-dark)] px-4 py-2 rounded-md hover:bg-[var(--color-error-lighter)] transition-colors"
                                        >
                                            <RefreshCw className="w-4 h-4" />
                                            <span>Try Again</span>
                                        </button>
                                    </div>
                                </div>
                            ) : shifts.length === 0 ? (
                                <div className="flex-1 flex items-center justify-center bg-[#FBF9FD] h-[calc(86vh-72px)]">
                                    <NoDataFound
                                        title="No Shifts Found"
                                        subtitle={searchQuery ? 'No shifts match your search criteria.' : 'You haven\'t created any shifts yet. Create your first shift to get started with shift management.'}
                                    >
                                        {permissions['shift_create'] && !searchQuery && (
                                            <button
                                                onClick={handleCreateShift}
                                                className="inline-flex items-center space-x-2 bg-[var(--color-primary-dark)] text-[var(--color-text-white)] px-4 py-2 rounded-md hover:bg-[var(--color-primary-darker)] transition-colors"
                                            >
                                                <Plus className="w-4 h-4" />
                                                <span>Create First Shift</span>
                                            </button>
                                        )}
                                    </NoDataFound>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table className="min-w-full divide-y divide-[var(--color-border-divider)]">
                                        <TableHeader className="bg-[var(--color-primary-dark)]">
                                            <TableHeaderRow>
                                                <Th className="px-6 py-3 text-left font-medium">
                                                    Shift Name
                                                </Th>
                                                <Th className="px-6 py-3 text-left font-medium">
                                                    Shift Days
                                                </Th>
                                                <Th className="px-6 py-3 text-left font-medium">
                                                    Assigned Employees
                                                </Th>
                                                <Th className="px-6 py-3 text-left font-medium">
                                                    Created On
                                                </Th>
                                                {(permissions?.shift_edit || permissions?.shift_delete) && (
                                                    <Th className="px-6 py-3 text-left font-medium">
                                                        Actions
                                                    </Th>
                                                )}
                                            </TableHeaderRow>
                                        </TableHeader>
                                        <TableBody className="bg-[var(--color-bg-secondary)] divide-y divide-[var(--color-border-divider)]">
                                            {/* Actual shift rows */}
                                            {shifts.map((shift) => (
                                                <TableRow key={shift.shift_id} className="border-b border-[var(--color-border-divider)] hover:bg-[var(--color-bg-primary)] transition-colors" >
                                                    <Td className="px-6 py-4 text-left whitespace-nowrap font-medium text-[var(--color-text-primary)] border-b border-[var(--color-border-divider)]">
                                                        <div className="flex items-center space-x-2">
                                                            <div className="w-8 h-8 bg-[var(--color-primary-lighter)] rounded-full flex items-center justify-center">
                                                                <Calendar className="w-4 h-4 text-[var(--color-primary-dark)]" />
                                                            </div>
                                                            <span>{shift.shift_name}</span>
                                                        </div>
                                                    </Td>
                                                    <Td className="px-6 py-4 text-left border-b border-[var(--color-border-divider)]">
                                                        <div className="flex gap-3">
                                                            {shift.shift_days.map((day) => (
                                                                <div key={day.day_id} className="relative group">
                                                                    <span
                                                                        className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium cursor-help ${getDayStyles(day.shift_type)}`}
                                                                    >
                                                                        {shouldShowDayText(day.shift_type) ? day.sort_name : (day.sort_name)}
                                                                    </span>
                                                                    {/* Tooltip */}
                                                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-800 text-[var(--color-text-white)] text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                                                                        {getDayStatusText(day.shift_type)}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </Td>
                                                    <Td className="px-6 py-4 text-left whitespace-nowrap text-[var(--color-text-secondary)] border-b border-[var(--color-border-divider)] ">
                                                        <button
                                                            onClick={() => fetchAssignedEmployees(shift.shift_id, shift.shift_name)}
                                                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--color-primary-lightest,#f3e8ff)] text-[var(--color-primary-dark)]  hover:shadow-sm transition-all duration-200 border border-[var(--color-primary-light,#d8b4fe)] font-medium text-xs sm:text-sm group cursor-pointer"
                                                            title="Click to view assigned employees"
                                                        >
                                                            <Users className="w-4 h-4 text-[var(--color-primary-dark)]  group-hover:scale-110 transition-transform " />
                                                            <span>{employeeCounts[shift.shift_id] || 0} Employees</span>
                                                        </button>
                                                    </Td>
                                                    <Td className="px-6 py-4 text-left whitespace-nowrap text-[var(--color-text-secondary)] border-b border-[var(--color-border-divider)]">
                                                        {shift.created_date}
                                                    </Td>
                                                    {(permissions?.shift_edit || permissions?.shift_delete) && (
                                                        <Td className="px-6 py-4 text-left whitespace-nowrap font-medium border-b border-[var(--color-border-divider)]">
                                                            <div className="flex space-x-3">
                                                                <button
                                                                    onClick={() => fetchShiftDateList(shift.shift_id, shift.shift_name, shiftDateModal.selectedMonth)}
                                                                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:scale-110 hover:shadow-md transition-all duration-200 cursor-pointer"
                                                                    title="View Shift Day Dates"
                                                                >
                                                                    <Eye className="w-4 h-4" strokeWidth={2.5} />
                                                                </button>
                                                                {permissions['shift_edit'] && (
                                                                    <button
                                                                        onClick={() => handleEditShift(shift.shift_id, shift.shift_name)}
                                                                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 hover:scale-110 hover:shadow-md transition-all duration-200"
                                                                        title="Edit Shift"
                                                                    >
                                                                        <Edit className="w-4 h-4" strokeWidth={2.5} />
                                                                    </button>
                                                                )}
                                                                {permissions['shift_delete'] && (
                                                                    <button
                                                                        onClick={() => handleDeleteShift(shift.shift_id, shift.shift_name)}
                                                                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-100 hover:scale-110 hover:shadow-md transition-all duration-200"
                                                                        title="Delete Shift"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" strokeWidth={2.5} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </Td>
                                                    )}
                                                </TableRow>
                                            ))}

                                            {/* Empty rows to fill up to 10 rows */}
                                            {generateEmptyRows(shifts.length).map((_, index) => (
                                                <TableRow key={`empty-${index}`} className="h-16 hover:bg-transparent [&>td]:border-b-0">
                                                    <Td className="px-6 py-4 text-left" colSpan={permissions?.shift_edit || permissions?.shift_delete ? 5 : 4}>
                                                        <div className="h-10">&nbsp;</div>
                                                    </Td>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}

                            {/* Pagination Component - Always show if there are shifts */}
                            {!loading && !error && shifts.length > 0 && (
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={handlePageChange}
                                    loading={loading}
                                />
                            )}
                        </div>
                    </div>
                    <div className="w-full lg:w-auto order-2">
                        <DayStatusLegend />
                    </div>
                </div>
            </div>

            {/* Employee Modal */}
            <EmployeeModal
                isOpen={employeeModal.isOpen}
                onClose={() => setEmployeeModal({ isOpen: false, employees: [], loading: false, shiftName: '' })}
                employees={employeeModal.employees}
                loading={employeeModal.loading}
                shiftName={employeeModal.shiftName}
            />

            {/* Shift Day Date List Modal */}
            <ShiftDayDateModal
                isOpen={shiftDateModal.isOpen}
                onClose={() => setShiftDateModal(prev => ({ ...prev, isOpen: false }))}
                shiftName={shiftDateModal.shiftName}
                shiftId={shiftDateModal.shiftId}
                selectedMonth={shiftDateModal.selectedMonth}
                datesList={shiftDateModal.datesList}
                totalRecords={shiftDateModal.totalRecords}
                loading={shiftDateModal.loading}
                onMonthChange={(id, name, newMonth) => fetchShiftDateList(id, name, newMonth)}
            />

            {/* Toast Notification */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={closeToast}
                />
            )}

            {/* Confirm Dialog */}
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                onClose={() => setConfirmDialog({ isOpen: false })}
                onConfirm={confirmDialog.onConfirm}
                title={confirmDialog.title}
                message={confirmDialog.message}
                confirmText={confirmDialog.confirmText}
                type={confirmDialog.type}
            />
        </div>
    );
};

export default ShiftManagement;