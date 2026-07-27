import { useState, useRef, useEffect, useCallback } from 'react';
import { Bell, ChevronDown, User, LogOut, Settings, Menu, X, Search, Loader2, IndianRupee, Eye, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDispatch, useSelector } from 'react-redux';
import { clearPermissions } from '../redux/permissionsSlice';
import { ConfirmDialog } from './comman/ConfirmDialog';
import { Link, useNavigate } from 'react-router-dom';
import CustomSelect from './comman/CustomSelect';
import Logo from '../assets/logo.png';
import api from '../api/axiosInstance';

// Function to get past months (starting from previous month)
const getPastMonths = () => {
    const months = [];
    const date = new Date();
    // Set date to the 1st of the current month to avoid month-wrapping bugs
    date.setDate(1);
    // Start from previous month
    date.setMonth(date.getMonth() - 1);
    for (let i = 0; i < 12; i++) {
        const year = date.getFullYear();
        const monthNum = (date.getMonth() + 1).toString().padStart(2, '0');
        const monthName = date.toLocaleString('default', { month: 'long' });
        months.push({
            value: `${year}-${monthNum}`,
            label: `${monthName} ${year}`
        });
        date.setMonth(date.getMonth() - 1);
    }
    return months;
};

const PAST_MONTHS = getPastMonths();
const DEFAULT_VALUE = PAST_MONTHS[0]?.value || '';

const Navbar = ({ isCollapsed, setIsCollapsed }) => {
    const { user, logout } = useAuth();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const dropdownRef = useRef(null);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const permissions = useSelector(state => state.permissions) || {};

    // ── Search state ──────────────────────────────────────────────────
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [showSearchDropdown, setShowSearchDropdown] = useState(false);
    const [selectedMonths, setSelectedMonths] = useState({}); // { [employee_id]: 'MM' }
    const [salaryLoadingMap, setSalaryLoadingMap] = useState({}); // { [employee_id]: bool }
    const searchRef = useRef(null);
    const searchDebounceRef = useRef(null);

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Close profile dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Close search dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setShowSearchDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handle logout initiation
    const handleLogoutClick = () => {
        setIsDropdownOpen(false);
        setShowLogoutDialog(true);
    };

    // Handle logout confirmation
    const handleLogoutConfirm = () => {
        logout();
        dispatch(clearPermissions());
        setShowLogoutDialog(false);
    };

    // Handle logout cancellation
    const handleLogoutCancel = () => {
        setShowLogoutDialog(false);
    };

    // Get user initials for avatar
    const getUserInitials = (name) => {
        if (!name || name === 'Unknown User') return 'U';
        return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
    };

    // ── Employee search ───────────────────────────────────────────────
    const fetchEmployees = useCallback(async (query) => {
        if (!query || query.trim().length < 1) {
            setSearchResults([]);
            setShowSearchDropdown(false);
            return;
        }
        try {
            setSearchLoading(true);
            const formData = new FormData();
            formData.append('page', '1');
            formData.append('search', query.trim());
            const response = await api.post('employee_list', formData);
            if (response.data?.success && response.data?.data) {
                setSearchResults(response.data.data.slice(0, 6));
                setShowSearchDropdown(true);
            } else {
                setSearchResults([]);
                setShowSearchDropdown(true);
            }
        } catch {
            setSearchResults([]);
            setShowSearchDropdown(true);
        } finally {
            setSearchLoading(false);
        }
    }, []);

    const handleSearchChange = (e) => {
        const val = e.target.value;
        setSearchQuery(val);
        if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
        if (!val.trim()) {
            setSearchResults([]);
            setShowSearchDropdown(false);
            return;
        }
        searchDebounceRef.current = setTimeout(() => fetchEmployees(val), 350);
    };

    const handleEmployeeClick = (employee) => {
        navigate(`/employee/details/${employee.employee_id}`);
        setSearchQuery('');
        setShowSearchDropdown(false);
        setSearchResults([]);
    };

    // ── Salary click: fetch salary details for selected month → navigate to finalize-payroll and auto-open modal ──
    const handleSalaryClick = useCallback(async (e, employee) => {
        e.stopPropagation();
        const employeeId = employee.employee_id;
        const yearMonth = selectedMonths[employeeId] || DEFAULT_VALUE;

        try {
            setSalaryLoadingMap(prev => ({ ...prev, [employeeId]: true }));

            // Step 1: Get salary list for this employee & month
            const listFormData = new FormData();
            listFormData.append('page', '1');
            listFormData.append('search', employee.full_name || '');
            listFormData.append('year_month', yearMonth);
            const listResponse = await api.post('employee_salary_list', listFormData);

            if (!listResponse.data?.success) {
                alert('No salary record found for this month.');
                return;
            }

            const salaryList = listResponse.data.data || listResponse.data.salaries || [];
            // Match by employee_id
            const salaryRecord = Array.isArray(salaryList)
                ? salaryList.find(r => String(r.employee_id) === String(employeeId) || String(r.employee_code) === String(employee.employee_code))
                : null;

            if (!salaryRecord?.employee_salary_id) {
                alert('No salary record found for this employee and month.');
                return;
            }

            // Step 2: Fetch full salary details
            const detailFormData = new FormData();
            detailFormData.append('employee_salary_id', salaryRecord.employee_salary_id);
            const detailResponse = await api.post('single_employee_salary_list', detailFormData);

            if (!detailResponse.data?.success) {
                alert('Failed to fetch salary details.');
                return;
            }

            const salaryDetailsData = detailResponse.data.data;

            // Step 3: Navigate to finalize-payroll with state to auto-open modal
            setSearchQuery('');
            setShowSearchDropdown(false);
            setSearchResults([]);
            navigate('/finalize-payroll', {
                state: {
                    openViewModal: true,
                    salaryDetailsData,
                }
            });
        } catch (err) {
            console.error('Salary details fetch error:', err);
            alert('Failed to fetch salary details. Please try again.');
        } finally {
            setSalaryLoadingMap(prev => ({ ...prev, [employeeId]: false }));
        }
    }, [selectedMonths, navigate]);

    const handleMonthChange = (e, employeeId) => {
        e.stopPropagation();
        setSelectedMonths(prev => ({ ...prev, [employeeId]: e.target.value }));
    };

    return (
        <>
            <div className="fixed top-0 left-0 right-0 flex items-center justify-between w-full h-16 px-4 md:px-6 bg-gradient-to-r from-[var(--color-bg-secondary)] to-[var(--color-bg-gradient-end)] border-b border-[var(--color-border-primary)] z-50 shadow-lg backdrop-blur-sm">
                {/* Left side - Mobile Menu Button + Logo/Brand */}
                <div className="flex items-center space-x-4">
                    {/* Mobile Menu Toggle */}
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="md:hidden p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-gradient-start)] rounded-lg transition-all duration-200 hover:shadow-md"
                    >
                        {isCollapsed ? <Menu size={20} /> : <X size={20} />}
                    </button>

                    {/* Logo/Brand */}
                    <div className="flex items-center">
                        <Link to="/dashboard" aria-label="Go to Home" className="inline-flex items-center">
                            <img
                                src={Logo}
                                alt="promanager"
                                className="h-10 md:h-12 w-auto cursor-pointer"
                                draggable="false"
                            />
                        </Link>
                    </div>
                </div>

                {/* ── Global Search ── */}
                <div className="ml-auto mr-2 md:mr-4 w-40 sm:w-60 md:w-80 relative" ref={searchRef}>

                    {/* Search Bar */}
                    <div className="relative">
                        <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none z-10">
                            {searchLoading
                                ? <Loader2 size={15} className="text-[var(--color-primary)] animate-spin" />
                                : <Search size={15} className="text-[var(--color-text-secondary)]" />
                            }
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={handleSearchChange}
                            onFocus={() => searchResults.length > 0 && setShowSearchDropdown(true)}
                            placeholder="Search employee..."
                            className="w-full pl-10 pr-9 py-2 text-sm rounded-xl border text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent shadow-sm"
                            style={{ background: 'var(--color-bg-primary)', borderColor: 'var(--color-border-primary)' }}
                        />
                        {searchQuery && (
                            <button
                                onClick={() => { setSearchQuery(''); setShowSearchDropdown(false); setSearchResults([]); }}
                                className="absolute inset-y-0 right-3 flex items-center text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors duration-150"
                            >
                                <X size={13} />
                            </button>
                        )}
                    </div>

                    {/* ── Dropdown Panel ── */}
                    {/* ── Dropdown Panel ── */}
                    {showSearchDropdown && (
                        <div className="absolute top-full mt-3 right-0 w-[320px] sm:w-[400px] z-[9999] bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100/80 overflow-hidden flex flex-col ring-1 ring-black/5">
                            {/* Panel Header */}
                            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                                <div className="flex items-center gap-2 text-gray-500">
                                    <Search size={14} className="text-[var(--color-primary)]" />
                                    <span className="text-[11px] font-bold tracking-widest uppercase text-gray-600">
                                        {searchResults.length > 0
                                            ? `${searchResults.length} Result${searchResults.length > 1 ? 's' : ''}`
                                            : 'No Results'}
                                    </span>
                                </div>
                                <button
                                    onClick={() => { setShowSearchDropdown(false); setSearchQuery(''); setSearchResults([]); }}
                                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200/50 transition-all active:scale-95"
                                >
                                    <X size={14} />
                                </button>
                            </div>

                            {/* Results Body */}
                            <div className="custom-scrollbar overflow-y-auto max-h-[420px] p-2 space-y-2">
                                {searchResults.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 px-6 gap-3">
                                        <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-1 border border-gray-100 shadow-sm">
                                            <Search size={24} className="text-gray-300" />
                                        </div>
                                        <p className="text-[15px] font-semibold text-gray-700">No employee found</p>
                                        <p className="text-[13px] text-gray-400 text-center">Try searching with a different name or employee code.</p>
                                    </div>
                                ) : (
                                    <>
                                        {searchResults.map((employee, idx) => {
                                            const initials = (employee.full_name || '?')
                                                .split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase();
                                            const empMonth = selectedMonths[employee.employee_id] || DEFAULT_VALUE;
                                            const isLoadingSalary = salaryLoadingMap[employee.employee_id];

                                            return (
                                                <div
                                                    key={employee.employee_id}
                                                    className="group/emp flex flex-col bg-white border border-purple-200 rounded-xl shadow-md transition-all duration-200 overflow-visible"
                                                >
                                                    {/* ── Employee Row ── */}
                                                    <div
                                                        onClick={() => handleEmployeeClick(employee)}
                                                        className="w-full text-left flex items-center gap-3.5 px-4 py-3.5 cursor-pointer hover:bg-purple-50/30 transition-colors"
                                                    >
                                                        {/* Avatar */}
                                                        <div className="w-11 h-11 rounded-full flex items-center justify-center text-[13px] font-bold flex-shrink-0 bg-gradient-to-br from-purple-100 to-purple-50 text-[var(--color-primary-dark)] shadow-sm border border-purple-100/50">
                                                            {initials}
                                                        </div>

                                                        {/* Info */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="text-[14px] font-bold text-gray-900 truncate">
                                                                    {employee.full_name}
                                                                </span>
                                                                {employee.employee_code && (
                                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-[var(--color-primary-dark)] flex-shrink-0 border border-purple-100/50">
                                                                        {employee.employee_code}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-[12px] text-gray-500 font-medium">
                                                                {employee.department_name && (
                                                                    <span className="truncate">{employee.department_name}</span>
                                                                )}
                                                                {employee.department_name && employee.designation_name && (
                                                                    <span className="opacity-40">•</span>
                                                                )}
                                                                {employee.designation_name && (
                                                                    <span className="truncate">{employee.designation_name}</span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Arrow */}
                                                        <ChevronRight
                                                            size={16}
                                                            className="text-gray-300 opacity-0 -translate-x-2 group-hover/emp:opacity-100 group-hover/emp:translate-x-0 group-hover/emp:text-[var(--color-primary)] transition-all duration-300"
                                                        />
                                                    </div>

                                                    {/* ── Salary Strip ── */}
                                                    <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 px-4 py-2.5 bg-gray-50/80 border-t border-purple-100/50">
                                                        {/* Salary Label */}
                                                        <div className="flex items-center gap-1.5 flex-shrink-0 text-gray-500">
                                                            <div className="w-6 h-6 rounded flex items-center justify-center bg-white shadow-sm border border-gray-200/60">
                                                                <IndianRupee size={12} className="text-[var(--color-primary-dark)]" />
                                                            </div>
                                                            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-primary-dark)]">Salary</span>
                                                        </div>

                                                        <div className="flex items-stretch gap-2 flex-1 justify-end h-[42px]">
                                                            {/* Month Select */}
                                                            <div className="w-[120px] h-full flex items-center" onClick={e => e.stopPropagation()}>
                                                                <CustomSelect
                                                                    name="month"
                                                                    value={empMonth}
                                                                    onChange={(e) => handleMonthChange(e, employee.employee_id)}
                                                                    options={PAST_MONTHS}
                                                                    searchable={false}
                                                                    usePortal={true}
                                                                />
                                                            </div>

                                                            {/* View Button */}
                                                            <button
                                                                onClick={(e) => handleSalaryClick(e, employee)}
                                                                disabled={isLoadingSalary}
                                                                title="View Salary Details"
                                                                className="h-full flex-shrink-0 flex items-center justify-center gap-1.5 px-4 rounded-lg text-sm text-[var(--color-text-primary)] bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] hover:border-[var(--color-primary)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                                                            >
                                                                {isLoadingSalary
                                                                    ? <Loader2 size={15} className="animate-spin text-[var(--color-primary)]" />
                                                                    : <Eye size={15} className="text-[var(--color-primary)]" />
                                                                }
                                                                <span className="font-semibold text-gray-700">{isLoadingSalary ? 'Wait' : 'View'}</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right side - Theme Toggle + Notifications + User menu */}
                <div className="flex items-center space-x-2 md:space-x-4">
                    {/* User Profile Dropdown */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            className="flex items-center space-x-2 p-2 rounded-lg hover:bg-[var(--color-bg-gradient-start)] transition-all duration-200 hover:shadow-md group"
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        >
                            {/* User Avatar */}
                            <div className="w-8 h-8 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] rounded-full flex items-center justify-center text-[var(--color-text-white)] text-sm font-semibold shadow-md hover:shadow-lg transition-shadow duration-200">
                                {getUserInitials(user?.full_name)}
                            </div>

                            {/* User Name - Hidden on small screens */}
                            <span className="text-[var(--color-text-secondary)] font-medium hidden md:inline-block max-w-32 truncate group-hover:text-[var(--color-text-primary)] transition-colors duration-200">
                                {user?.full_name || user?.name || user?.username || 'User'}
                            </span>

                            {/* Dropdown Arrow */}
                            <ChevronDown
                                size={16}
                                className={`text-[var(--color-text-secondary)] transition-all duration-300 group-hover:text-[var(--color-text-primary)] ${isDropdownOpen ? 'rotate-180' : 'rotate-0'
                                    }`}
                            />
                        </button>

                        {/* Dropdown Menu */}
                        {isDropdownOpen && (
                            <div className="absolute right-0 top-14 rounded-2xl shadow-2xl w-[320px] overflow-hidden z-50 bg-white border border-[var(--color-border-secondary)]">
                                {/* Modern Compact Profile Header */}
                                <div className="p-5 border-b border-[var(--color-border-secondary)] bg-white">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-full flex items-center justify-center text-[var(--color-primary-dark)] font-bold text-xl bg-[var(--color-primary-lightest)] flex-shrink-0 shadow-sm border border-[var(--color-primary-lighter)]">
                                            {getUserInitials(user?.full_name)}
                                        </div>
                                        <div className="flex-1 min-w-0 flex flex-col items-start text-left">
                                            <p className="font-bold text-[var(--color-text-primary)] text-[15px] truncate w-full">
                                                {user?.full_name || user?.name || user?.username || 'User'}
                                            </p>
                                            <p className="text-[13px] text-[var(--color-text-secondary)] truncate mb-2 mt-0.5 w-full">
                                                {user?.email || user?.username || user?.number || '--'}
                                            </p>
                                            {user?.subscriptions_days && (
                                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 uppercase tracking-wider w-fit">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                                    Active • {user.subscriptions_days} days
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Menu Items */}
                                <div className="p-3 flex flex-col gap-1.5">
                                    {/* Profile */}
                                    <Link
                                        to="/profile"
                                        onClick={() => setIsDropdownOpen(false)}
                                        className="flex items-center justify-between w-full p-2 rounded-xl transition-all duration-200 hover:bg-[var(--color-bg-primary)] group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-50 text-[var(--color-primary-dark)] group-hover:bg-[var(--color-primary-lightest)] transition-colors">
                                                <User size={18} strokeWidth={2} />
                                            </div>
                                            <div className="flex flex-col text-left">
                                                <span className="text-sm font-semibold text-[var(--color-text-primary)]">Profile</span>
                                                <span className="text-[12px] text-[var(--color-text-secondary)] mt-0.5">View and manage your profile</span>
                                            </div>
                                        </div>
                                        <ChevronRight size={16} className="text-gray-400 group-hover:text-gray-600" />
                                    </Link>

                                    {/* Settings */}
                                    {(permissions?.configuration_view || permissions?.configuration_edit || permissions?.software_setting_view) && (
                                        <Link
                                            to="/settings"
                                            onClick={() => setIsDropdownOpen(false)}
                                            className="flex items-center justify-between w-full p-2 rounded-xl transition-all duration-200 hover:bg-[var(--color-bg-primary)] group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-50 text-[var(--color-primary-dark)] group-hover:bg-indigo-100 transition-colors">
                                                    <Settings size={18} strokeWidth={2} />
                                                </div>
                                                <div className="flex flex-col text-left">
                                                    <span className="text-sm font-semibold text-[var(--color-text-primary)]">Settings</span>
                                                    <span className="text-[12px] text-[var(--color-text-secondary)] mt-0.5">Manage your account preferences</span>
                                                </div>
                                            </div>
                                            <ChevronRight size={16} className="text-gray-400 group-hover:text-gray-600" />
                                        </Link>
                                    )}

                                    {/* Divider */}
                                    <div className="my-1.5 mx-2 h-px bg-[var(--color-border-secondary)]" />

                                    {/* Logout */}
                                    <button
                                        onClick={handleLogoutClick}
                                        className="flex items-center gap-3 w-full p-3 rounded-xl transition-all duration-200 hover:opacity-90 mt-1 bg-red-50 group border border-transparent hover:border-red-100"
                                    >
                                        <div className="flex items-center justify-center w-10 h-10 rounded-xl text-red-500 bg-red-50 group-hover:bg-red-100 transition-colors">
                                            <LogOut size={20} strokeWidth={2.5} className="ml-1" />
                                        </div>
                                        <div className="flex flex-col items-start text-left">
                                            <span className="text-sm font-semibold text-red-600">Logout</span>
                                            <span className="text-[12px] text-red-400 mt-0.5">Sign out from your account</span>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal Backdrop and Logout Confirmation Dialog */}
            {showLogoutDialog && (
                <>
                    {/* Modal Backdrop */}
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50 z-[9998] backdrop-blur-sm"
                        onClick={handleLogoutCancel}
                    />

                    {/* Logout Confirmation Dialog */}
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                        <ConfirmDialog
                            isOpen={showLogoutDialog}
                            onClose={handleLogoutCancel}
                            onConfirm={handleLogoutConfirm}
                            title="Confirm Logout"
                            message="Are you sure you want to logout? You will need to sign in again to access your account."
                            confirmText="Yes, Logout"
                            cancelText="Cancel"
                            type="danger"
                        />
                    </div>
                </>
            )}
        </>
    );
};

export default Navbar;
