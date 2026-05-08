/* eslint-disable no-unused-vars */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, RefreshCw, X, ArrowLeft, AlertCircle, XCircle, Shield, User } from 'lucide-react';
import api from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import { useSelector } from 'react-redux';
import { Toast } from '../../Components/ui/Toast';
import { ConfirmDialog } from '../../Components/ui/ConfirmDialog';
import Pagination from '../../Components/Pagination'; // Import the Pagination component
import LoadingSpinner from "../../Components/Loader/LoadingSpinner"

const Role = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [paginationLoading, setPaginationLoading] = useState(false);
    const [error, setError] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const [toast, setToast] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: '', data: null });
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRoles, setTotalRoles] = useState(0);
    const permissions = useSelector(state => state.permissions);

    const showToast = (message, type) => {
        setToast({ message, type });
    };

    // Helper function to check if role is admin
    const isAdminRole = (role) => {
        return role.status === '1' || role.status === 1;
    };

    // Helper function to check if role can be modified
    const canModifyRole = (role) => {
        return !isAdminRole(role);
    };

    // Get roles from API with pagination
    const fetchRoles = useCallback(async (page = 1, resetData = false) => {
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
            formData.append('page', page.toString());

            const res = await api.post('/user_roles_list', formData);

            if (res.data?.success) {
                const rolesData = res.data.data || [];
                const pagination = res.data.pagination || {};

                setRoles(rolesData);
                setCurrentPage(pagination.current_page || page);
                setTotalPages(pagination.total_pages || 1);
                setTotalRoles(pagination.total_records || rolesData.length);
            } else {
                const errorMsg = res.data?.message || 'Failed to fetch roles';
                setError(errorMsg);
                showToast(errorMsg, 'error');
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'Error fetching roles';
            setError(errorMessage);
            showToast(errorMessage, 'error');
        } finally {
            setLoading(false);
            setPaginationLoading(false);
        }
    }, [user?.user_id]);

    useEffect(() => {
        if (user?.user_id) {
            fetchRoles(1, true);
        } else {
            setLoading(false);
            setError('User not authenticated');
        }
    }, [user?.user_id, fetchRoles]);

    const handlePageChange = (page) => {
        if (page !== currentPage && !paginationLoading) {
            fetchRoles(page);
        }
    };

    const handleCreateRole = () => {
        navigate('/add-role');
    };

    const handleEditRole = (role) => {
        if (!canModifyRole(role)) {
            showToast('Admin roles cannot be modified', 'warning');
            return;
        }

        setConfirmModal({
            isOpen: true,
            type: 'edit',
            data: role
        });
    };

    // Edit role 
    const confirmEditRole = () => {
        const role = confirmModal.data;
        navigate(`/add-role?edit=${role.user_roles_id}`);
        setConfirmModal({ isOpen: false, type: '', data: null });
    };
    // Delete role handler
    const handleDeleteRole = (role) => {
        if (!canModifyRole(role)) {
            showToast('Admin roles cannot be deleted', 'warning');
            return;
        }

        setConfirmModal({
            isOpen: true,
            type: 'delete',
            data: role
        });
    };

    const confirmDeleteRole = async () => {
        const role = confirmModal.data;
        setDeleting(role.user_roles_id);
        setConfirmModal({ isOpen: false, type: '', data: null });

        try {
            const formData = new FormData();
            formData.append('user_roles_id', String(role.user_roles_id));

            const res = await api.post('/user_roles_delete', formData);

            if (res.data?.success) {
                // After successful deletion, check if we need to go to previous page
                const remainingRoles = roles.length - 1;
                const shouldGoToPreviousPage = remainingRoles === 0 && currentPage > 1;

                if (shouldGoToPreviousPage) {
                    fetchRoles(currentPage - 1);
                } else {
                    fetchRoles(currentPage);
                }

                showToast('Role deleted successfully', 'success');
            } else {
                showToast(res.data?.message || 'Failed to delete role', 'error');
            }
        } catch (err) {
            showToast(err.response?.data?.message || 'Error deleting role', 'error');
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
                    <p className="text-[var(--color-text-error)]">Please log in to manage roles.</p>
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
                                                Role Management
                                            </h1>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {permissions['user_roles_create'] && (
                                        <button
                                            onClick={handleCreateRole}
                                            className="flex items-center space-x-2 text-[var(--color-text-white)] hover:text-[var(--color-text-white)] transition-colors bg-[var(--color-bg-secondary-20)] hover:bg-[var(--color-bg-secondary-30)] px-4 py-2 rounded-md "
                                        >
                                            <Plus className="w-4 h-4" />
                                            <span>Create Role</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-primary-dark)] overflow-hidden shadow-sm">
                        <div className="px-6 py-4 border-b border-[var(--color-primary-light)] bg-[var(--color-primary-dark)]">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-medium text-[var(--color-text-white)]">All Roles</h3>
                            </div>
                        </div>

                        {loading ? (
                            <div className="">
                                <LoadingSpinner />
                            </div>
                        ) : error ? (
                            <div className="px-6 py-12 text-center">
                                <div className="bg-[var(--color-error-light)] border border-[var(--color-border-error)] rounded-lg p-8">
                                    <XCircle className="w-12 h-12 text-[var(--color-error)] mx-auto mb-4" />
                                    <p className="text-[var(--color-error-dark)] text-lg font-medium mb-2">Error Loading Roles</p>
                                    <p className="text-[var(--color-text-error)] mb-4">{error}</p>
                                </div>
                            </div>
                        ) : roles.length === 0 ? (
                            <div className="px-6 py-12 text-center">
                                <div className="bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] rounded-lg p-8">
                                    <div className="w-16 h-16 bg-[var(--color-bg-gray-light)] rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Plus className="w-8 h-8 text-[var(--color-text-muted)]" />
                                    </div>
                                    <p className="text-[var(--color-text-secondary)] text-lg font-medium mb-2">No Roles Found</p>
                                    <p className="text-[var(--color-text-secondary)] text-sm mb-4">
                                        You haven't created any roles yet. Create your first role to get started with role management.
                                    </p>
                                    <button
                                        onClick={handleCreateRole}
                                        className="inline-flex items-center space-x-2 bg-[var(--color-primary-dark)] text-[var(--color-text-white)] px-4 py-2 rounded-md hover:bg-[var(--color-primary-darker)] transition-colors"
                                    >
                                        <Plus className="w-4 h-4" />
                                        <span>Create First Role</span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-[var(--color-border-divider)]">
                                        <thead className="bg-[var(--color-primary-lightest)]">
                                            <tr>
                                                <th className="px-6 py-3 text-center text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                                                    Role Name
                                                </th>
                                                <th className="px-6 py-3 text-center text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                                                    Type
                                                </th>
                                                <th className="px-6 py-3 text-center text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                                                    Created Date
                                                </th>
                                                {(permissions['user_roles_edit'] || permissions['user_roles_delete']) && (
                                                    <th className="px-6 py-3 text-center text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                                                        Actions
                                                    </th>
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody className="bg-[var(--color-bg-secondary)] divide-y divide-[var(--color-border-divider)]">
                                            {roles.map(role => (
                                                <tr key={role.user_roles_id} className="hover:bg-[var(--color-bg-primary)] transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[var(--color-text-primary)] text-center">
                                                        <div className="flex items-center justify-center space-x-2">
                                                            {isAdminRole(role) ? (
                                                                <Shield className="w-4 h-4 text-[var(--color-primary-dark)]" />
                                                            ) : (
                                                                <User className="w-4 h-4 text-[var(--color-text-secondary)]" />
                                                            )}
                                                            <span>{role.name || 'Unnamed Role'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-secondary)] text-center">
                                                        <div className="flex justify-center">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full ${isAdminRole(role)
                                                                ? 'bg-[var(--color-primary-lighter)] text-[var(--color-primary-darkest)]'
                                                                : 'bg-[var(--color-bg-gradient-start)] text-gray-800'
                                                                }`}>
                                                                {isAdminRole(role) ? (
                                                                    <>
                                                                        <Shield className="w-3 h-3 mr-1" />
                                                                        Admin
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <User className="w-3 h-3 mr-1" />
                                                                        User
                                                                    </>
                                                                )}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-secondary)] text-center">
                                                        {role.created_date ? new Date(role.created_date).toLocaleDateString('en-GB') : '--'}
                                                    </td>
                                                    {(permissions['user_roles_edit'] || permissions['user_roles_delete']) && (
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                                                            <div className="flex justify-center space-x-2">
                                                                {permissions['user_roles_edit'] && (
                                                                    <button
                                                                        onClick={() => handleEditRole(role)}
                                                                        className={`p-2 rounded-md transition-colors ${canModifyRole(role)
                                                                            ? 'text-[var(--color-primary-dark)] hover:text-[var(--color-primary-darkest)] hover:bg-[var(--color-primary-lightest)]'
                                                                            : 'text-[var(--color-text-muted)] cursor-not-allowed'
                                                                            }`}
                                                                        title={canModifyRole(role) ? "Edit Role" : "Admin roles cannot be edited"}
                                                                        disabled={deleting === role.user_roles_id || !canModifyRole(role)}
                                                                    >
                                                                        <Edit className="w-4 h-4" />
                                                                    </button>
                                                                )}
                                                                {permissions['user_roles_delete'] && (
                                                                    <button
                                                                        onClick={() => handleDeleteRole(role)}
                                                                        className={`p-2 rounded-md transition-colors ${canModifyRole(role)
                                                                            ? 'text-[var(--color-text-error)] hover:text-red-900 hover:bg-[var(--color-error-light)]'
                                                                            : 'text-[var(--color-text-muted)] cursor-not-allowed'
                                                                            }`}
                                                                        title={canModifyRole(role) ? "Delete Role" : "Admin roles cannot be deleted"}
                                                                        disabled={deleting === role.user_roles_id || !canModifyRole(role)}
                                                                    >
                                                                        {deleting === role.user_roles_id ? (
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

                                {/* Pagination */}
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
                    onClose={() => { setToast(null) }}
                />
            )}

            {/* Confirmation Modals */}
            <ConfirmDialog
                isOpen={confirmModal.isOpen && confirmModal.type === 'delete'}
                onClose={closeModal}
                onConfirm={confirmDeleteRole}
                title="Delete Role"
                message={`Are you sure you want to delete "${confirmModal.data?.name || 'this role'}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                type="danger"
            />

            <ConfirmDialog
                isOpen={confirmModal.isOpen && confirmModal.type === 'edit'}
                onClose={closeModal}
                onConfirm={confirmEditRole}
                title="Edit Role"
                message={`Do you want to edit the role "${confirmModal.data?.name || 'this role'}"?`}
                confirmText="Edit"
                cancelText="Cancel"
                type="warning"
            />
        </>
    );
};

export default Role;