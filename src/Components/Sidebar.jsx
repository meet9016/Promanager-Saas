import { useState, useEffect, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    Home, Users, Clock, Calendar, IndianRupee, Briefcase, BarChart2,
    User as UserIcon, Settings as SettingsIcon, Phone, Youtube,
    ChevronRight, Star, ChevronLeft,
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { ThemeContext } from '../context/Themecontext';

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
    const location = useLocation();
    const currentPath = location.pathname;
    const [expandedSubmenu, setExpandedSubmenu] = useState(null);
    const [lastActiveItem, setLastActiveItem] = useState('dashboard');
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const navigate = useNavigate();
    const permissions = useSelector(state => state.permissions) || {};
    const { theme } = useContext(ThemeContext);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/dashboard' },
        {
            id: 'attendance', label: 'Attendance', icon: Calendar, hasSubmenu: true, path: '/attendance/daily',
            submenu: [
                permissions?.daily_attendance && { label: 'Daily Attendance', path: '/attendance/daily' },
                permissions?.monthly_attendance && { label: 'Monthly Attendance', path: '/attendance/monthly' },
            ].filter(Boolean)
        },
        (permissions?.employee_view || permissions?.employee_create || permissions?.employee_edit || permissions?.employee_delete ||
            permissions?.department_view || permissions?.department_create || permissions?.department_edit || permissions?.department_delete ||
            permissions?.branch_view || permissions?.branch_create || permissions?.branch_edit || permissions?.branch_delete ||
            permissions?.designation_view || permissions?.designation_create || permissions?.designation_edit || permissions?.designation_delete ||
            permissions?.deduction_view || permissions?.deduction_create || permissions?.deduction_edit || permissions?.deduction_delete ||
            permissions?.allowance_view || permissions?.allowance_create || permissions?.allowance_edit || permissions?.allowance_delete) && {
            id: 'employees', label: 'Employees', icon: Users, hasSubmenu: true, path: '/employee',
            submenu: [
                permissions?.employee_view && { label: 'Employee List', path: '/employee' },
                (permissions?.employee_create || permissions?.employee_edit) && { label: 'Add Employee', path: '/add-employee' },
                permissions?.branch_view && { label: 'Branch', path: '/branches' },
                permissions?.department_view && { label: 'Department', path: '/departments' },
                permissions?.designation_view && { label: 'Designation', path: '/designation' },
                permissions?.deduction_view && { label: 'Deductions', path: '/deductions' },
                permissions?.allowance_view && { label: 'Allowances', path: '/allowances' },
                permissions?.company_view && { label: 'Companies', path: '/companies' },
                permissions?.company_view && { label: 'Increment', path: '/increment' },
            ].filter(Boolean)
        },
        (permissions?.shift_view || permissions?.shift_create || permissions?.shift_edit || permissions?.shift_delete || permissions?.shift_assign) && {
            id: 'shift', label: 'Shift Management', icon: Clock, hasSubmenu: true, path: '/shift-management',
            submenu: [
                permissions?.shift_view && { label: 'Shifts', path: '/shift-management' },
                permissions?.shift_create && { label: 'Add Shift', path: '/add-shift' },
                permissions?.shift_assign && { label: 'Assign Shift', path: '/assign-shift' },
                permissions?.shift_assign && { label: 'Shift Reallocation', path: '/shift-reallocation' },
            ].filter(Boolean)
        },
        (permissions?.leave_view || permissions?.leave_create || permissions?.leave_approved || permissions?.leave_rejected) && {
            id: 'leaves', label: 'Leaves & Holidays', icon: Calendar, hasSubmenu: true, path: '/leavestatusPage',
            submenu: [
                permissions?.leave_view && { label: 'Leave Requests', path: '/leavestatusPage' },
                permissions?.leave_create && { label: 'Leave Application', path: '/leaveapplication' },
                permissions?.leave_create && { label: 'Holidays', path: '/holiday' },
            ].filter(Boolean)
        },
        (permissions?.salary_view || permissions?.salary_create || permissions?.salary_edit || permissions?.salary_delete || permissions?.add_salary_payment) && {
            id: 'payroll', label: 'Payroll', icon: IndianRupee, hasSubmenu: true, path: '/monthly-payroll',
            submenu: [
                (permissions?.salary_view || permissions?.salary_create) && { label: 'Monthly Payroll', path: '/monthly-payroll' },
                (permissions?.salary_create || permissions?.add_salary_payment) && { label: 'Finalize Payroll', path: '/Finalize-payroll' },
            ].filter(Boolean)
        },
        (permissions?.loan_view || permissions?.loan_create || permissions?.loan_edit || permissions?.loan_delete) && {
            id: 'loans', label: 'Loans & Advances', icon: Briefcase, hasSubmenu: true, path: '/loans',
            submenu: [
                permissions?.loan_view && { label: 'Loans & Advances', path: '/loans' },
                permissions?.loan_create && { label: 'Add Loan/Advance', path: '/add-loan-advance' },
            ].filter(Boolean)
        },
        (permissions?.employee_directory || permissions?.daily_attendance || permissions?.monthly_attendance ||
            permissions?.monthly_salary || permissions?.custom_range) && {
            id: 'reports', label: 'Reports', icon: BarChart2, hasSubmenu: true, path: '/reports',
            submenu: [
                (permissions?.employee_directory || permissions?.daily_attendance || permissions?.monthly_attendance ||
                    permissions?.monthly_salary || permissions?.custom_range) && { label: 'All Reports', path: '/reports' },
                permissions?.employee_directory && { label: 'Employee Directory', path: '/reports/employee-directory' },
                permissions?.daily_attendance && { label: 'Daily Report', path: '/reports/daily-attendance' },
                permissions?.daily_attendance && { label: 'Daily Detailed Report', path: '/reports/daily-attendance-detailed' },
                { label: 'Geolocation Report', path: '/reports/geolocation-report' },
                { label: 'Attendance Exception Report', path: '/reports/attendance-exception' },
                { label: 'Monthly Exception Report', path: '/reports/monthly-exception' },
                permissions?.monthly_attendance && { label: 'Monthly Report', path: '/reports/monthly-attendance' },
                permissions?.monthly_attendance && { label: 'Mothly Muster Report', path: '/reports/monthly-attendance-muster' },
                permissions?.monthly_salary && { label: 'Monthly Salary Report', path: '/reports/monthly-salary' },
                permissions?.monthly_salary && { label: 'Paid Salary Report', path: '/reports/pay-monthly-salary' },
                permissions?.monthly_salary && { label: 'Salary Generation Status', path: '/reports/salary-generation-status' },
                permissions?.custom_range && { label: 'Custom Range Report', path: '/reports/daterangereport' },
            ].filter(Boolean)
        },
        (permissions?.user_view || permissions?.user_create || permissions?.user_edit || permissions?.user_delete ||
            permissions?.user_roles_view || permissions?.user_roles_create || permissions?.user_roles_edit || permissions?.user_roles_delete) && {
            id: 'user', label: 'User Management', icon: UserIcon, hasSubmenu: true, path: '/usermanage',
            submenu: [
                permissions?.user_view && { label: 'Users', path: '/usermanage' },
                permissions?.user_roles_view && { label: 'Roles', path: '/role' },
            ].filter(Boolean)
        },
        { id: 'settings', label: 'Settings', icon: SettingsIcon, hasSubmenu: false, path: '/settings' },
    ].filter(Boolean);

    const getActiveItemId = () => {
        for (const item of menuItems) {
            if (item.path && currentPath === item.path) return item.id;
            if (item.submenu) {
                for (const sub of item.submenu) {
                    if (currentPath === sub.path) return item.id;
                }
            }
        }
        return null;
    };

    const getActiveSubmenuPath = () => {
        for (const item of menuItems) {
            if (item.submenu) {
                for (const sub of item.submenu) {
                    if (currentPath === sub.path) return sub.path;
                }
            }
        }
        return null;
    };

    const hasActiveSubmenuItem = (item) => {
        if (!item.submenu) return false;
        return item.submenu.some(subItem => subItem && currentPath === subItem.path);
    };

    const getExpandedMenuId = () => {
        for (const item of menuItems) {
            if (hasActiveSubmenuItem(item)) return item.id;
        }
        return null;
    };

    const currentActiveItem = getActiveItemId();
    const activeSubmenuPath = getActiveSubmenuPath();
    const shouldExpandMenuId = getExpandedMenuId();

    useEffect(() => {
        if (currentActiveItem !== null) setLastActiveItem(currentActiveItem);
    }, [currentActiveItem]);

    useEffect(() => {
        if (shouldExpandMenuId && !isCollapsed) setExpandedSubmenu(shouldExpandMenuId);
    }, [shouldExpandMenuId, currentPath, isCollapsed]);

    useEffect(() => {
        if (isCollapsed) setExpandedSubmenu(null);
    }, [isCollapsed]);

    const activeItem = currentActiveItem || lastActiveItem;
    
    const hasActualSubmenu = (item) => item.hasSubmenu && item.submenu && item.submenu.length > 0;

    const handleMenuClick = (item) => {
        if (hasActualSubmenu(item)) {
            if (isCollapsed && !isMobile) {
                // Desktop collapsed: expand sidebar and open submenu
                setIsCollapsed(false);
                setExpandedSubmenu(item.id);
            } else {
                // Toggle submenu normally
                setExpandedSubmenu(expandedSubmenu === item.id ? null : item.id);
            }
        } else if (item.path) {
            setExpandedSubmenu(null);
            navigate(item.path);
            if (isMobile) setIsCollapsed(true);
        }
    }; 

    const getSubmenuHeight = (itemId) => {
        const submenu = menuItems.find(item => item.id === itemId)?.submenu;
        if (!submenu) return 0;
        return submenu.length * 40 + 60;
    };

    // Mobile: slide in/out overlay. Desktop: collapse to icon strip.
    const sidebarWidth = isCollapsed ? (isMobile ? '0px' : '80px') : (isMobile ? '280px' : '256px');

    return (
        <>
            {/* Mobile backdrop */}
            {isMobile && !isCollapsed && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40"
                    style={{ top: '64px' }}
                    onClick={() => setIsCollapsed(true)}
                />
            )}

            <div
                className="fixed left-0 top-16 h-[calc(100vh-4rem)] bg-gradient-to-b from-[var(--color-bg-gradient-start)] to-[var(--color-bg-gradient-end)] border-r border-[var(--color-border-primary)] shadow-lg transition-all duration-300 z-50 flex flex-col overflow-hidden"
                style={{ width: sidebarWidth }}
            >
                {/* Collapse toggle — desktop only */}
                {!isMobile && (
                    <div className="absolute -right-7 top-[40%] transform -translate-y-1/2 z-20">
                        <button
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            className="w-7 h-20 flex items-center justify-center transition-all duration-300 shadow-md hover:shadow-lg
                                bg-gradient-to-b from-[var(--color-bg-gradient-start)] to-[var(--color-bg-gradient-end)]
                                border-r border-t border-b border-[var(--color-border-primary)]
                                text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]
                                hover:brightness-110 active:scale-95 relative overflow-hidden
                                rounded-tr-[20px] rounded-br-[20px]"
                            style={{ borderTopLeftRadius: '0', borderBottomLeftRadius: '0' }}
                            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
                        >
                            <div className="relative z-10">
                                {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                            </div>
                        </button>
                    </div>
                )}

                <div className="flex-1 relative min-h-0">
                    <div className="absolute top-0 left-0 right-0 h-4 z-10 scrollbar-fade-top" />
                    <div className="h-full overflow-y-auto custom-scrollbar py-3 px-3">
                        {menuItems.map((item) => {
                            if (!item) return null;
                            const Icon = item.icon;
                            const isActive = activeItem === item.id;
                            const isExpanded = expandedSubmenu === item.id;
                            const hasSubmenu = hasActualSubmenu(item);
                            // On mobile sidebar is always expanded (full width), so never show icon-only mode
                            const collapsed = isCollapsed && !isMobile;

                            return (
                                <div key={item.id} className="mb-1">
                                    {hasSubmenu ? (
                                        <div
                                            className={`relative cursor-pointer rounded-xl transition-all duration-300 group
                                                ${isActive
                                                    ? 'bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] text-[var(--color-text-white)] shadow-lg transform scale-[1.02]'
                                                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-gradient-start)] hover:shadow-md hover:transform hover:scale-[1.01]'
                                                }`}
                                            onClick={() => handleMenuClick(item)}
                                            title={collapsed ? item.label : ''}
                                        >
                                            <div className={`py-3 ${collapsed ? 'px-2 justify-center' : 'px-4 justify-between'} flex items-center`}>
                                                <div className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-3'}`}>
                                                    <div className={`p-2 rounded-full transition-all duration-300
                                                        ${isActive
                                                            ? 'bg-[var(--color-bg-secondary-20)] text-[var(--color-text-white)]'
                                                            : 'bg-[var(--color-bg-gradient-start)] text-[var(--color-text-secondary)] group-hover:bg-[var(--color-primary-lighter)] group-hover:text-[var(--color-primary-dark)]'
                                                        }`}>
                                                        <Icon size={16} />
                                                    </div>
                                                    {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                                                </div>
                                                {!collapsed && (
                                                    <ChevronRight
                                                        size={16}
                                                        className={`transform transition-all duration-300 ease-in-out
                                                            ${isExpanded ? 'rotate-90' : 'rotate-0'}
                                                            ${isActive ? 'text-[var(--color-text-white)]' : 'text-[var(--color-text-muted)]'}`}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <Link
                                            to={item.path}
                                            className={`relative block rounded-xl transition-all duration-300 group
                                                ${isActive
                                                    ? 'bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] text-[var(--color-text-white)] shadow-lg transform scale-[1.02]'
                                                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-gradient-start)] hover:shadow-md hover:transform hover:scale-[1.01]'
                                                }`}
                                            onClick={() => {
                                                setExpandedSubmenu(null);
                                                if (isMobile) setIsCollapsed(true);
                                            }}
                                            title={collapsed ? item.label : ''}
                                        >
                                            <div className={`py-3 ${collapsed ? 'px-2 justify-center' : 'px-4 justify-between'} flex items-center`}>
                                                <div className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-3'}`}>
                                                    <div className={`p-2 rounded-full transition-all duration-300
                                                        ${isActive
                                                            ? 'bg-[var(--color-bg-secondary-20)] text-[var(--color-text-white)]'
                                                            : 'bg-[var(--color-bg-gradient-start)] text-[var(--color-text-secondary)] group-hover:bg-[var(--color-primary-lighter)] group-hover:text-[var(--color-primary-dark)]'
                                                        }`}>
                                                        <Icon size={16} />
                                                    </div>
                                                    {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                                                </div>
                                            </div>
                                        </Link>
                                    )}

                                    {hasSubmenu && !collapsed && (
                                        <div
                                            className="overflow-hidden transition-all duration-500 ease-in-out"
                                            style={{ maxHeight: isExpanded ? `${getSubmenuHeight(item.id)}px` : '0px', opacity: isExpanded ? 1 : 0 }}
                                        >
                                            <div className="ml-6 mt-2 space-y-2">
                                                {item.submenu?.map((subItem, index) => {
                                                    if (!subItem) return null;
                                                    const isSubmenuActive = activeSubmenuPath === subItem.path;
                                                    const isMaster = subItem.label === 'Master';
                                                    return (
                                                        <Link
                                                            key={index}
                                                            to={subItem.path}
                                                            className={`flex items-center py-2 px-4 text-sm rounded-lg transition-all duration-300 hover:shadow-sm border-l-2 hover:pl-6
                                                                ${isSubmenuActive
                                                                    ? 'bg-[var(--color-primary-lighter)] text-[var(--color-primary-darker)] border-[var(--color-primary-medium)] font-medium shadow-sm'
                                                                    : 'text-[var(--color-text-secondary)] border-transparent hover:bg-[var(--color-primary-lightest)] hover:text-[var(--color-primary-dark)] hover:border-[var(--color-primary-light)]'
                                                                }`}
                                                            style={{ animationDelay: `${index * 50}ms` }}
                                                            onClick={() => {
                                                                if (isMobile) setIsCollapsed(true);
                                                            }}
                                                        >
                                                            <div className={`w-2 h-2 rounded-full mr-3 transition-colors duration-300
                                                                ${isMaster
                                                                    ? (isSubmenuActive ? 'bg-[var(--color-yellow)]' : 'bg-[var(--color-yellow-light)]')
                                                                    : (isSubmenuActive ? 'bg-[var(--color-primary-medium)]' : 'bg-[var(--color-border-secondary)]')
                                                                }`}
                                                            />
                                                            <div className="flex items-center space-x-2">
                                                                {isMaster && <Star size={12} className={isSubmenuActive ? 'text-[var(--color-yellow-dark)]' : 'text-[var(--color-yellow)]'} />}
                                                                <span>{subItem.label}</span>
                                                            </div>
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {!isCollapsed && (
                            <div className="flex-shrink-0 border-t border-gray-100 p-2">
                                <div className="space-y-2">
                                    <a href='https://www.youtube.com/@promanagerpayrollsoftware'>
                                        <div className="group flex items-center gap-4 p-2 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer">
                                            <div className="flex items-center gap-3">
                                                <div className="p-1 bg-gradient-to-br from-red-500 to-red-600 rounded-md shadow-md group-hover:scale-105 transition">
                                                    <Youtube size={15} className="text-white" />
                                                </div>
                                                <p className="text-sm font-semibold text-gray-900">Learn with Videos</p>
                                            </div>
                                        </div>
                                    </a>
                                    <div className="group flex items-center gap-4 p-2 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer">
                                        <div className="flex items-center gap-3">
                                            <div className="p-1 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] rounded-md shadow-md group-hover:scale-105 transition">
                                                <Phone size={15} className="text-white" />
                                            </div>
                                            <p className="text-sm font-semibold text-gray-900">+91 92748 89008</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-4 z-10 scrollbar-fade-bottom" />
                </div>
            </div>
        </>
    );
};

export default Sidebar;