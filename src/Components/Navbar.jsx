import { useState, useRef, useEffect } from 'react';
import { Bell, ChevronDown, User, LogOut, Settings, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDispatch } from 'react-redux';
import { clearPermissions } from '../redux/permissionsSlice';
import { ThemeToggle } from '../context/Themetoggle';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { Link } from 'react-router-dom'; // ← add this
import Logo from '../assets/logo.png'

const Navbar = ({ isCollapsed, setIsCollapsed }) => {
    const { user, logout } = useAuth();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const dropdownRef = useRef(null);
    const dispatch = useDispatch();

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsDropdownOpen(false);
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

                {/* Right side - Theme Toggle + Notifications + User menu */}
                <div className="flex items-center space-x-2 md:space-x-4">
                    {/* Theme Toggle */}
                    {/* <div className="hidden sm:block">
                        <ThemeToggle />
                    </div> */}

                    {/* Notifications */}
                    {/* <button className="relative p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-gradient-start)] rounded-lg transition-all duration-200 hover:shadow-md group">
                        <Bell size={18} className="group-hover:animate-pulse" />
                        <span className="absolute top-1 right-1 w-2 h-2 bg-gradient-to-r from-[var(--color-error)] to-[var(--color-error-light)] rounded-full animate-pulse"></span>
                    </button> */}

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
                            <div className="absolute right-0 top-12 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl shadow-xl w-80 overflow-hidden backdrop-blur-sm animate-in slide-in-from-top-2 duration-200">
                                {/* User Info Header */}
                                <div className="px-4 py-4 bg-gradient-to-r from-[var(--color-bg-primary)] to-[var(--color-bg-gradient-start)] border-b border-[var(--color-border-primary)]">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-12 h-12 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] rounded-full flex items-center justify-center text-[var(--color-text-white)] font-bold text-lg shadow-lg">
                                            {getUserInitials(user?.full_name)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-[var(--color-text-primary)] truncate">
                                                {user?.full_name || user?.name || user?.username || 'User'}
                                            </h3>
                                            <p className="text-sm text-[var(--color-text-secondary)] truncate">
                                                {user?.email || user?.username || user?.number || '--'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* User Details */}
                                <div className="px-4 py-4 border-b border-[var(--color-border-primary)] bg-[var(--color-bg-gradient-start)]">
                                    <h4 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3 flex items-center">
                                        <User size={14} className="mr-2" />
                                        Account Details
                                    </h4>
                                    <div className="space-y-2 text-sm">

                                        <div className="flex justify-between items-center py-1">
                                            <span className="text-[var(--color-text-secondary)]">Username:</span>
                                            <span className="font-mono text-[var(--color-text-primary)] font-medium">
                                                {user?.username || '--'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center py-1">
                                            <span className="text-[var(--color-text-secondary)]">Phone:</span>
                                            <span className="font-mono text-[var(--color-text-primary)] font-medium">
                                                {user?.number || '--'}
                                            </span>
                                        </div>

                                        <div className="flex justify-between items-center py-1">
                                            <span className="text-[var(--color-text-secondary)]">Expire In:</span>
                                            <span className="font-mono text-[var(--color-text-primary)] font-medium">
                                                {user?.subscriptions_days ? `${user.subscriptions_days} days` : '--'}
                                            </span>
                                        </div>
                                        {user?.email && (
                                            <div className="flex justify-between items-center py-1">
                                                <span className="text-[var(--color-text-secondary)]">Email:</span>
                                                <span className="font-mono text-[var(--color-text-primary)] font-medium truncate ml-2 max-w-32">
                                                    {user.email}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Theme Toggle for Mobile */}
                                {/* <div className="sm:hidden px-4 py-3 border-b border-[var(--color-border-primary)]">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-[var(--color-text-primary)]">Theme</span>
                                        <ThemeToggle />
                                    </div>
                                </div> */}

                                {/* Menu Actions */}
                                <div className="py-2">
                                    <Link
                                        to="/settings"
                                        onClick={() => setIsDropdownOpen(false)}
                                        className="w-full px-4 py-3 text-left text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-gradient-start)] hover:text-[var(--color-text-primary)] flex items-center space-x-3 transition-all duration-200 group no-underline"
                                    >
                                        <div className="p-1 rounded-md bg-[var(--color-bg-gradient-start)] group-hover:bg-[var(--color-primary-lighter)] transition-colors duration-200">
                                            <Settings size={14} className="group-hover:text-[var(--color-primary-dark)]" />
                                        </div>
                                        <span>Settings</span>
                                    </Link>


                                    <button
                                        onClick={handleLogoutClick}
                                        className="w-full px-4 py-3 text-left text-sm text-[var(--color-error)] hover:bg-[var(--color-error-light)] hover:text-[var(--color-error-dark)] flex items-center space-x-3 transition-all duration-200 group"
                                    >
                                        <div className="p-1 rounded-md bg-[var(--color-error-light)] group-hover:bg-[var(--color-error)] transition-colors duration-200">
                                            <LogOut size={14} className="group-hover:text-[var(--color-text-white)]" />
                                        </div>
                                        <span>Logout</span>
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