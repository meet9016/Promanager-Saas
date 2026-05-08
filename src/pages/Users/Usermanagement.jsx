/* eslint-disable no-unused-vars */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, RefreshCw, X, CheckCircle, ArrowLeft, XCircle, User, Shield } from 'lucide-react';
import api from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import { useSelector } from 'react-redux';
import { Toast } from '../../Components/ui/Toast';
import { ConfirmDialog } from '../../Components/ui/ConfirmDialog';
import Pagination from '../../Components/Pagination';
import LoadingSpinner from "../../Components/Loader/LoadingSpinner"

const ITEMS_PER_PAGE = 10;

const UserManagement = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [paginationLoading, setPaginationLoading] = useState(false);
    const [error, setError] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const [toast, setToast] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: '', data: null });
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);
    const permissions = useSelector(state => state.permissions);

    const showToast = (message, type) => {
        setToast({ message, type });
    };

    const closeToast = () => {
        setToast(null);
    };

    // Helper function to check if user is admin
    const isAdminUser = (userData) => {
        return userData.role_status === '1' || userData.role_status === 1 || userData.user_type === 'admin';
    };

    // Helper function to check if user can be modified
    const canModifyUser = (userData) => {
        return !isAdminUser(userData);
    };

    // fetch users from the API with pagination
    const fetchUsers = useCallback(async (page = 1, resetData = false) => {
        if (!user?.user_id) {
            setError('User not authenticated');
            setLoading(false);
            return;
        }

        try {
            if (resetData) {
                setLoading(true);
                setCurrentPage(1);
                page = 1;
            } else {
                setPaginationLoading(true);
            }
            setError(null);

            const formData = new FormData();
            formData.append('user_id', String(user.user_id));
            formData.append('page', page.toString());

            const res = await api.post('/user_list', formData);

            if (res.data?.success) {
                const usersData = res.data.data || [];
                setUsers(usersData);

                // Calculate total pages based on response
                const itemsCount = usersData.length;
                if (itemsCount < ITEMS_PER_PAGE && page === 1) {
                    // If we get less than 10 items on first page, that's all we have
                    setTotalPages(1);
                    setTotalUsers(itemsCount);
                } else if (itemsCount < ITEMS_PER_PAGE && page > 1) {
                    // If we get less than 10 items on subsequent pages, this is the last page
                    setTotalPages(page);
                    setTotalUsers((page - 1) * ITEMS_PER_PAGE + itemsCount);
                } else {
                    // If we get exactly 10 items, there might be more pages
                    setTotalPages(page + 1); // We'll update this when we hit the last page
                    setTotalUsers(page * ITEMS_PER_PAGE);
                }
                setCurrentPage(page);
            } else {
                const errorMsg = res.data?.message || 'Failed to fetch users';
                setError(errorMsg);
                showToast(errorMsg, 'error');
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'Error fetching users';
            setError(errorMessage);
            showToast(errorMessage, 'error');
        } finally {
            setLoading(false);
            setPaginationLoading(false);
        }
    }, [user?.user_id]);

    useEffect(() => {
        if (user?.user_id) {
            fetchUsers(1, true);
        } else {
            setLoading(false);
            setError('User not authenticated');
        }
    }, [user?.user_id, fetchUsers]);

    // Handle page change
    const handlePageChange = (page) => {
        if (page !== currentPage) {
            fetchUsers(page);
        }
    };

    const handleEditUser = (userData) => {
        if (!canModifyUser(userData)) {
            showToast('Admin users cannot be modified', 'warning');
            return;
        }

        setConfirmModal({
            isOpen: true,
            type: 'edit',
            data: userData
        });
    };

    const confirmEditUser = () => {
        try {
            const userData = confirmModal.data;
            navigate(`/add-user?edit=${userData.edit_user_id}`);
          
            setConfirmModal({ isOpen: false, type: '', data: null });
        } catch (error) {
            showToast('Error preparing user for editing', error);
            setConfirmModal({ isOpen: false, type: '', data: null });
        }
    };

    const handleDeleteUser = (userData) => {
        if (!canModifyUser(userData)) {
            showToast('Admin users cannot be deleted', 'warning');
            return;
        }

        setConfirmModal({
            isOpen: true,
            type: 'delete',
            data: userData
        });
    };

    const confirmDeleteUser = async () => {
        const userData = confirmModal.data;
        setDeleting(userData.edit_user_id);
        setConfirmModal({ isOpen: false, type: '', data: null });

        try {
            const formData = new FormData();
            formData.append('user_id', String(user.user_id));
            formData.append('edit_user_id', String(userData.edit_user_id));

            const res = await api.post('/user_delete', formData);

            if (res.data?.success) {
                // After successful deletion, refresh the current page
                // If current page becomes empty and it's not the first page, go to previous page
                if (users.length === 1 && currentPage > 1) {
                    fetchUsers(currentPage - 1);
                } else {
                    fetchUsers(currentPage);
                }
                showToast('User deleted successfully', 'success');
            } else {
                showToast(res.data?.message || 'Failed to delete user', 'error');
            }
        } catch (err) {
            showToast(err.response?.data?.message || 'Error deleting user', 'error');
        } finally {
            setDeleting(null);
        }
    };

    const closeModal = () => {
        setConfirmModal({ isOpen: false, type: '', data: null });
    };

    // Show authentication error
    if (!user?.user_id && !loading) {
        return (
            <div className="p-8 max-w-6xl mx-auto">
                <div className="bg-[var(--color-error-light)] border border-[var(--color-border-error)] rounded-lg p-8 text-center">
                    <h2 className="text-xl font-semibold text-red-800 mb-2">Authentication Required</h2>
                    <p className="text-[var(--color-text-error)]">Please log in to manage users.</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="min-h-screen bg-[var(--color-bg-primary)]">
                <div className="p-8  mx-auto">
                    <div className="bg-[var(--color-bg-secondary)] rounded-2xl shadow-xl mb-8 overflow-hidden">
                        <div className="bg-gradient-to-r from-[var(--color-primary-dark)] to-[var(--color-primary-darker)] p-8">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => navigate(-1)}
                                        className="flex items-center gap-2 text-[var(--color-text-white)] hover:text-[var(--color-text-white)] transition-colors bg-[var(--color-bg-secondary-20)] hover:bg-[var(--color-bg-secondary-30)] px-4 py-2 rounded-lg backdrop-blur-sm"
                                    >
                                        <ArrowLeft size={18} />
                                        Back
                                    </button>
                                    <div className="flex items-center gap-3">
                                        <div>
                                            <h1 className="text-2xl font-bold text-[var(--color-text-white)]">
                                                User Management
                                            </h1>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {permissions['user_create'] && (
                                        <button
                                            onClick={() => navigate('/add-user')}
                                            className="flex items-center gap-2 text-[var(--color-text-white)] hover:text-[var(--color-text-white)] transition-colors bg-[var(--color-bg-secondary-20)] hover:bg-[var(--color-bg-secondary-30)] px-4 py-2 rounded-lg backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Plus className="w-4 h-4" />
                                            <span>Create User</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-primary-dark)] overflow-hidden shadow-sm">
                        <div className="px-6 py-4 border-b border-[var(--color-primary-light)] bg-[var(--color-primary-dark)]">
                            <h3 className="text-lg font-medium text-[var(--color-text-white)]">All Users</h3>
                        </div>

                        {loading ? (
                            <div className="">
                                <LoadingSpinner />
                            </div>
                        ) : error ? (
                            <div className="px-6 py-12 text-center">
                                <div className="bg-[var(--color-error-light)] border border-[var(--color-border-error)] rounded-lg p-8">
                                    <XCircle className="w-12 h-12 text-[var(--color-error)] mx-auto mb-4" />
                                    <p className="text-[var(--color-error-dark)] text-lg font-medium mb-2">Error Loading Users</p>
                                    <p className="text-[var(--color-text-error)] mb-4">{error}</p>
                                </div>
                            </div>
                        ) : users.length === 0 ? (
                            <div className="px-6 py-12 text-center">
                                <div className="bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] rounded-lg p-8">
                                    <div className="w-16 h-16 bg-[var(--color-bg-gray-light)] rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Plus className="w-8 h-8 text-[var(--color-text-muted)]" />
                                    </div>
                                    <p className="text-[var(--color-text-secondary)] text-lg font-medium mb-2">No Users Found</p>
                                    <p className="text-[var(--color-text-secondary)] text-sm mb-4">
                                        {currentPage > 1
                                            ? "No users found on this page. Try going back to previous pages."
                                            : "You haven't created any users yet. Create your first user to get started with user management."
                                        }
                                    </p>
                                    {currentPage === 1 && permissions['user_create'] && (
                                        <button
                                            onClick={() => navigate('/add-user')}
                                            className="inline-flex items-center space-x-2 bg-[var(--color-primary-dark)] text-[var(--color-text-white)] px-4 py-2 rounded-md hover:bg-[var(--color-primary-darker)] transition-colors"
                                        >
                                            <Plus className="w-4 h-4" />
                                            <span>Create First User</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-[var(--color-border-divider)]">
                                        <thead className="bg-[var(--color-primary-lightest)]">
                                            <tr>
                                                <th className="px-6 py-3 text-center text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                                                    Full Name
                                                </th>
                                                <th className="px-6 py-3 text-center text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                                                    Email
                                                </th>
                                                <th className="px-6 py-3 text-center text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                                                    Phone Number
                                                </th>
                                                <th className="px-6 py-3 text-center text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                                                    Role
                                                </th>
                                                {(permissions['user_edit'] || permissions['user_delete']) && (
                                                    <th className="px-6 py-3 text-center text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                                                        Actions
                                                    </th>
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody className="bg-[var(--color-bg-secondary)] divide-y divide-[var(--color-border-divider)]">
                                            {users.map(userData => (
                                                <tr key={userData.edit_user_id} className="hover:bg-[var(--color-bg-primary)] transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[var(--color-text-primary)] text-center">
                                                        <div className="flex items-center justify-center space-x-2">
                                                            {isAdminUser(userData) ? (
                                                                <Shield className="w-4 h-4 text-[var(--color-primary-dark)]" />
                                                            ) : (
                                                                <User className="w-4 h-4 text-[var(--color-text-secondary)]" />
                                                            )}
                                                            <span>{userData.full_name || 'Unnamed User'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-secondary)] text-center">
                                                        {userData.email || '--'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-secondary)] text-center">
                                                        {userData.number || '--'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-secondary)] text-center">
                                                        <div className="flex justify-center">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full ${isAdminUser(userData)
                                                                ? 'bg-[var(--color-primary-lighter)] text-[var(--color-primary-darkest)]'
                                                                : 'bg-[var(--color-bg-gradient-start)] text-gray-800'
                                                                }`}>
                                                                {isAdminUser(userData) ? (
                                                                    <>
                                                                        <Shield className="w-3 h-3 mr-1" />
                                                                        Admin
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <User className="w-3 h-3 mr-1" />
                                                                        {userData.user_role_name || 'User'}
                                                                    </>
                                                                )}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    {(permissions['user_edit'] || permissions['user_delete']) && (
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                                                            <div className="flex justify-center space-x-2">
                                                                {permissions['user_edit'] && (
                                                                    <button
                                                                        onClick={() => handleEditUser(userData)}
                                                                        className={`p-2 rounded-md transition-colors ${canModifyUser(userData)
                                                                            ? 'text-[var(--color-primary-dark)] hover:text-[var(--color-primary-darkest)] hover:bg-[var(--color-primary-lightest)]'
                                                                            : 'text-[var(--color-text-muted)] cursor-not-allowed'
                                                                            }`}
                                                                        title={canModifyUser(userData) ? "Edit User" : "Admin users cannot be edited"}
                                                                        disabled={deleting === userData.edit_user_id || !canModifyUser(userData) || paginationLoading}
                                                                    >
                                                                        <Edit className="w-4 h-4" />
                                                                    </button>
                                                                )}
                                                                {permissions['user_delete'] && (
                                                                    <button
                                                                        onClick={() => handleDeleteUser(userData)}
                                                                        className={`p-2 rounded-md transition-colors ${canModifyUser(userData)
                                                                            ? 'text-[var(--color-text-error)] hover:text-red-900 hover:bg-[var(--color-error-light)]'
                                                                            : 'text-[var(--color-text-muted)] cursor-not-allowed'
                                                                            }`}
                                                                        title={canModifyUser(userData) ? "Delete User" : "Admin users cannot be deleted"}
                                                                        disabled={deleting === userData.edit_user_id || !canModifyUser(userData) || paginationLoading}
                                                                    >
                                                                        {deleting === userData.edit_user_id ? (
                                                                            <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                                                                        ) : (
                                                                            <Trash2 className="w-4 h-4" />
                                                                        )}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination Component */}
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={handlePageChange}
                                    loading={paginationLoading}
                                />
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Toast Notification */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={closeToast}
                />
            )}

            {/* Confirmation Modals */}
            <ConfirmDialog
                isOpen={confirmModal.isOpen && confirmModal.type === 'delete'}
                onClose={closeModal}
                onConfirm={confirmDeleteUser}
                title="Delete User"
                message={`Are you sure you want to delete "${confirmModal.data?.full_name || 'this user'}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                type="danger"
            />

            {/* Confirmation Modals */}
            <ConfirmDialog
                isOpen={confirmModal.isOpen && confirmModal.type === 'edit'}
                onClose={closeModal}
                onConfirm={confirmEditUser}
                title="Edit User"
                message={`Do you want to edit the user "${confirmModal.data?.full_name || 'this user'}"?`}
                confirmText="Edit"
                cancelText="Cancel"
                type="warning"
            />
        </>
    );
};

export default UserManagement;