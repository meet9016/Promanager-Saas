import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
    ArrowLeft,
    Edit,
    UserPlus,
    User,
    Shield,
    ChevronDown,
    ChevronUp,
    Save,
    X,
    Settings
} from "lucide-react";
import api from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import { Toast } from '../../Components/ui/Toast';
import { ConfirmDialog } from '../../Components/ui/ConfirmDialog';
import { useRef } from 'react';
import LoadingSpinner from "../../Components/Loader/LoadingSpinner"
import { useSelector } from 'react-redux';

const AddRole = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { roleId } = useParams();
    const [searchParams] = useSearchParams();

    // Get role ID from query parameter 'edit'
    const editRoleId = searchParams.get('edit');

    const [name, setName] = useState('');
    const [permissionConfig, setPermissionConfig] = useState({});
    const [permission, setPermission] = useState({});
    const [expandedSections, setExpandedSections] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: '', data: null });
    const submitInProgressRef = useRef(false);
    const permissions = useSelector(state => state.permissions) || {};

    // Determine if we're in edit mode and get the current role ID
    const isEditMode = Boolean(roleId) || Boolean(editRoleId);
    const currentRoleId = roleId || editRoleId;

    // Toast helper functions
    const showToast = (message, type = 'info') => {
        setToast({ message, type });
    };

    const closeToast = () => {
        setToast(null);
    };

    // Find view permission in a subsection
    const findViewPermission = (sectionKey, subsectionKey) => {
        const subsection = permissionConfig[sectionKey]?.subsections[subsectionKey];
        if (!subsection) return null;

        return subsection.permission.find(perm =>
            perm.key.toLowerCase().includes('view') ||
            perm.key.toLowerCase().includes('list') ||
            perm.title.toLowerCase().includes('view') ||
            perm.title.toLowerCase().includes('list')
        );
    };

    // Fetch permission from API
    const fetchPermissions = async () => {
        try {
            setLoading(true);
            const response = await api.post('permission_list', {});

            if (response.data.success && response.data.data) {
                const config = transformApiDataToConfig(response.data.data);
                setPermissionConfig(config);
                return config;
            } else {
                throw new Error(response.data.message || 'Failed to fetch permission');
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message);
            showToast('Failed to load permission', 'error');
            return null;
        }
    };

    // Fetch role permission using user_role_id - FIXED VERSION
    const fetchRolePermissions = async (roleId) => {
        try {
            // Create FormData correctly
            const formData = new FormData();
            formData.append('user_roles_id', String(roleId));

            const response = await api.post('permission_list', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });

            if (response.data?.success && response.data.data) {
                const rolePermissionIds = [];

                response.data.data.forEach(section => {
                    if (section.permission_name_items && Array.isArray(section.permission_name_items)) {
                        section.permission_name_items.forEach(item => {
                            // Check for different possible access indicators
                            const hasAccess = item.has_access === 1 ||
                                item.has_access === "1" ||
                                item.has_access === true ||
                                item.has_access === "true";

                            if (hasAccess && item.main_permission_items_id) {
                                rolePermissionIds.push(parseInt(item.main_permission_items_id));
                            }
                        });
                    }
                });

                return rolePermissionIds;
            }

            showToast('No role permission found', 'warning');
            return [];
        } catch (error) {
            showToast('Failed to load role permission: ' + (error.response?.data?.message || error.message), 'error');
            return [];
        }
    };

    // Fetch role data for editing (basic info only) - IMPROVED VERSION
    const fetchRoleData = async (roleId) => {
        try {
            // Fetch from API
            const formData = new FormData();

            const response = await api.post('user_roles_list', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });

            if (response.data?.success && response.data.data) {
                const roleData = response.data.data.find(role => {
                    // Try different possible ID fields
                    const matchesId = role.user_roles_id == roleId ||
                        role.user_roles_id === parseInt(roleId) ||
                        role.id == roleId ||
                        role.id === parseInt(roleId);

                    return matchesId;
                });

                if (roleData) {
                    return roleData;
                } else {
                    throw new Error('Role not found in the list');
                }
            } else {
                throw new Error(response.data?.message || 'Failed to fetch role data');
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message);
            showToast('Failed to load role data', 'error');
            return null;
        }
    };

    // Transform API data to component config format
    const transformApiDataToConfig = (apiData) => {
        const config = {};

        apiData.forEach(section => {
            const sectionKey = section.permission_name_title.toLowerCase().replace(/\s+/g, '');

            config[sectionKey] = {
                title: section.permission_name_title,
                subtitle: `Permission settings for ${section.permission_name_title.toLowerCase()}`,
                id: section.main_permission_id,
                subsections: {
                    main: {
                        title: section.permission_name_title.toUpperCase(),
                        permission: section.permission_name_items.map(item => ({
                            key: item.items_name_input,
                            title: item.main_permission_items_title,
                            id: parseInt(item.main_permission_items_id)
                        }))
                    }
                }
            };
        });

        return config;
    };

    // Initialize permission state based on config
    const initializePermissions = (config) => {
        const newPermissions = {};
        Object.entries(config).forEach(([sectionKey, section]) => {
            newPermissions[sectionKey] = {};
            Object.entries(section.subsections).forEach(([subsectionKey, subsection]) => {
                newPermissions[sectionKey][subsectionKey] = { selectAll: false };
                subsection.permission.forEach(perm => {
                    newPermissions[sectionKey][subsectionKey][perm.key] = false;
                });
            });
        });
        return newPermissions;
    };

    // Apply role permission using permission_items_id array - IMPROVED VERSION
    const applyRolePermissions = (rolePermissionIds, config) => {
        const userPermissions = initializePermissions(config);

        if (rolePermissionIds && rolePermissionIds.length > 0) {
            Object.entries(config).forEach(([sectionKey, section]) => {
                Object.entries(section.subsections).forEach(([subsectionKey, subsection]) => {
                    let sectionSelectedCount = 0;

                    subsection.permission.forEach(perm => {
                        if (rolePermissionIds.includes(perm.id)) {
                            userPermissions[sectionKey][subsectionKey][perm.key] = true;
                            sectionSelectedCount++;
                        }
                    });

                    const totalPermissions = subsection.permission.length;
                    userPermissions[sectionKey][subsectionKey].selectAll = sectionSelectedCount === totalPermissions;
                });
            });
        }

        return userPermissions;
    };

    // Load component data on mount - IMPROVED VERSION
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                setError(null);

                // First, always fetch the permission configuration
                const config = await fetchPermissions();
                if (!config) {
                    setError('Failed to load permission configuration');
                    return;
                }

                if (isEditMode && currentRoleId) {
                    // Fetch role data
                    const roleData = await fetchRoleData(currentRoleId);
                    if (!roleData) {
                        setError('Failed to load role data');
                        return;
                    }

                    // Set the role name
                    const roleName = roleData.name || roleData.role_name || '';
                    setName(roleName);

                    // Fetch and apply role permission
                    const rolePermissionIds = await fetchRolePermissions(currentRoleId);

                    if (rolePermissionIds && rolePermissionIds.length > 0) {
                        const rolePermissions = applyRolePermissions(rolePermissionIds, config);
                        setPermission(rolePermissions);
                        showToast('Role data loaded successfully', 'success');
                    } else {
                        setPermission(initializePermissions(config));
                        showToast('Role loaded with no permission set', 'info');
                    }
                } else {
                    // Create mode - initialize empty permission
                    setPermission(initializePermissions(config));
                    showToast('Ready to create new role', 'info');
                }
            } catch (error) {
                setError('Failed to load data: ' + error.message);
                showToast('Failed to load data: ' + error.message, 'error');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [isEditMode, currentRoleId, user?.user_id]);

    // Function to get active checkbox count for a section
    const getActiveCheckboxCount = (sectionKey) => {
        const section = permission[sectionKey];
        let activeCount = 0;
        let totalCount = 0;

        if (section && permissionConfig[sectionKey]) {
            Object.entries(permissionConfig[sectionKey].subsections).forEach(([subsectionKey, subsection]) => {
                subsection.permission.forEach(perm => {
                    totalCount++;
                    if (section[subsectionKey] && section[subsectionKey][perm.key]) {
                        activeCount++;
                    }
                });
            });
        }

        return { activeCount, totalCount };
    };

    const toggleSection = (section) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const handlePermissionChange = (section, subsection, permissionKey) => {
        setPermission(prev => {
            const newPermissions = { ...prev };
            const subsectionPerms = newPermissions[section][subsection];

            if (permissionKey === 'selectAll') {
                const allSelected = !subsectionPerms[permissionKey];
                permissionConfig[section].subsections[subsection].permission.forEach(p => {
                    subsectionPerms[p.key] = allSelected;
                });
                subsectionPerms[permissionKey] = allSelected;
            } else {
                const isCurrentlySelected = subsectionPerms[permissionKey];

                // 🛡️ Prevent unchecking "view" if other permission are selected
                const viewPermission = findViewPermission(section, subsection);
                if (
                    viewPermission &&
                    permissionKey === viewPermission.key &&
                    isCurrentlySelected
                ) {
                    // check if any other permission is still true
                    const otherSelected = permissionConfig[section].subsections[subsection].permission.some(p =>
                        p.key !== permissionKey && subsectionPerms[p.key]
                    );
                    if (otherSelected) {
                        showToast('Cannot deselect view while other permission are active', 'warning');
                        return prev;
                    }
                }

                subsectionPerms[permissionKey] = !isCurrentlySelected;

                // ✅ Auto-select view if selecting another permission
                if (!isCurrentlySelected) {
                    if (viewPermission && !subsectionPerms[viewPermission.key]) {
                        subsectionPerms[viewPermission.key] = true;
                    }
                }

                // ✅ Update selectAll status
                const allPermissions = permissionConfig[section].subsections[subsection].permission.map(p => p.key);
                subsectionPerms.selectAll = allPermissions.every(p => subsectionPerms[p]);
            }

            return newPermissions;
        });
    };

    const handleSaveChanges = () => {
        if (submitInProgressRef.current) return;

        if (!name.trim()) {
            showToast('Please enter a role name', 'warning');
            return;
        }

        if (!user || !user.user_id) {
            showToast('Admin user ID is required. Please log in again.', 'error');
            return;
        }

        setConfirmModal({
            isOpen: true,
            type: 'save',
            data: null
        });
    };

    const confirmSave = async () => {
        setConfirmModal({ isOpen: false, type: '', data: null });
        if (submitInProgressRef.current) return;
        submitInProgressRef.current = true;

        try {
            setLoading(true);
            showToast('Saving role...', 'info');

            const permissionItemsIds = [];

            Object.entries(permissionConfig).forEach(([sectionKey, section]) => {
                Object.entries(section.subsections).forEach(([subsectionKey, subsection]) => {
                    subsection.permission.forEach(perm => {
                        if (permission[sectionKey]?.[subsectionKey]?.[perm.key]) {
                            permissionItemsIds.push(parseInt(perm.id));
                        }
                    });
                });
            });

            const formData = new FormData();
            formData.append('name', name.trim());

            // Add permission IDs
            permissionItemsIds.forEach((id, index) => {
                formData.append(`permission_items_id[${index}]`, String(id));
            });

            // Add role ID for edit mode
            if (isEditMode && currentRoleId) {
                formData.append('user_roles_id', String(currentRoleId));
            }

            const response = await api.post('user_roles_create', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data.success) {
                showToast(
                    isEditMode ? 'Role updated successfully!' : 'Role created successfully!',
                    'success'
                );
                setTimeout(() => {
                    navigate('/role');
                }, 1500);
            } else {
                throw new Error(response.data.message || 'Failed to save role');
            }
        } catch (err) {
            showToast(
                'Error saving role: ' + (err.response?.data?.message || err.message),
                'error'
            );
        } finally {
            setTimeout(() => {
                submitInProgressRef.current = false;
                setLoading(false);
            }, 1500);
        }
    };

    const handleCancel = () => {
        setConfirmModal({
            isOpen: true,
            type: 'cancel',
            data: null
        });
    };

    const confirmCancel = () => {
        setConfirmModal({ isOpen: false, type: '', data: null });
        navigate('/role');
    };

    const formatPermissionName = (permissionTitle) => {
        return permissionTitle;
    };

    // Check permissions before rendering
    useEffect(() => {
        if (!loading && !permissions['user_roles_edit'] && isEditMode) {
            navigate('/unauthorized');
        }
    }, [loading, permissions, isEditMode, navigate]);

    if (loading) {
        return (
            <div>
                <LoadingSpinner />
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-4xl mx-auto bg-[var(--color-bg-secondary)] min-h-screen">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="text-[var(--color-text-error)] text-lg font-semibold mb-2">Error</div>
                        <div className="text-[var(--color-text-secondary)] mb-4">{error}</div>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-[var(--color-primary-dark)] text-[var(--color-text-white)] rounded-md hover:bg-[var(--color-primary-darker)] transition-all duration-200"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--color-bg-primary)]">
            <div className=" mx-auto px-4 py-8">
                <div className="bg-[var(--color-bg-secondary)] rounded-2xl shadow-xl mb-8 overflow-hidden">
                    <div className="bg-gradient-to-r from-[var(--color-primary-dark)] to-[var(--color-primary-darker)]">
                        <div className="bg-gradient-to-r from-[var(--color-primary-dark)] to-[var(--color-primary-darker)] p-8">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={handleCancel}
                                    className="flex items-center gap-2 text-[var(--color-text-white)] hover:text-[var(--color-text-white)] transition-colors bg-[var(--color-bg-secondary-20)] hover:bg-[var(--color-bg-secondary-30)] px-4 py-2 rounded-lg backdrop-blur-sm"
                                >
                                    <ArrowLeft size={18} />
                                    Back
                                </button>
                                <div className="flex items-center gap-3">
                                    <div>
                                        <h2 className="text-2xl font-bold text-[var(--color-text-white)]">
                                            {isEditMode ? 'Edit Role' : 'Create New Role'}
                                        </h2>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-[var(--color-bg-secondary)] rounded-2xl border border-[var(--color-primary-light)] shadow-xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-[var(--color-primary-light)] bg-gradient-to-r from-[var(--color-primary-dark)] to-[var(--color-primary-darker)]">
                        <div className="flex items-center gap-3">
                            <Shield className="w-5 h-5 text-[var(--color-text-white)]" />
                            <h3 className="text-lg font-semibold text-[var(--color-text-white)]">Role Information</h3>
                        </div>
                    </div>

                    <div className="p-8 space-y-8">
                        {/* Role Name */}
                        <div className="space-y-2">
                            <label htmlFor="role_name" className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                                <User className="w-4 h-4 text-[var(--color-primary-dark)]" />
                                Role Name <span className="text-[var(--color-error)]">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    id="role_name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 py-3 pl-12 border rounded-xl shadow-sm focus:outline-none focus:ring-3 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] transition-all duration-200 border-[var(--color-border-secondary)] hover:border-[var(--color-primary-medium)]"
                                    placeholder="Enter role name"
                                />
                                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                            </div>
                        </div>

                        {/* Permissions Section */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2">
                                <Shield className="w-5 h-5 text-[var(--color-primary-dark)]" />
                                <h3 className="text-lg font-semibold text-gray-800">Permissions</h3>
                            </div>

                            {Object.entries(permissionConfig).map(([sectionKey, config]) => {
                                const isExpanded = expandedSections[sectionKey];
                                const { activeCount, totalCount } = getActiveCheckboxCount(sectionKey);

                                return (
                                    <div key={sectionKey} className="border border-[var(--color-border-primary)] rounded-xl overflow-hidden shadow-sm">
                                        <div
                                            onClick={() => toggleSection(sectionKey)}
                                            className="flex items-center justify-between py-4 px-6 cursor-pointer hover:bg-[var(--color-bg-primary)] transition-colors duration-200 bg-[var(--color-bg-secondary)]"
                                        >
                                            <div>
                                                <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">{config.title}</h4>
                                                <p className="text-xs text-[var(--color-text-secondary)] mt-1">{config.subtitle}</p>
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                <div className="flex items-center space-x-2">
                                                    <span className={`text-xs font-medium px-3 py-1 rounded-full ${activeCount > 0
                                                        ? 'bg-[var(--color-primary-lighter)] text-[var(--color-primary-darkest)]'
                                                        : 'bg-[var(--color-bg-gradient-start)] text-[var(--color-text-secondary)]'
                                                        }`}>
                                                        {activeCount}/{totalCount} Permissions
                                                    </span>
                                                    {activeCount > 0 && (
                                                        <div className="w-2 h-2 bg-[var(--color-primary-lightest)]0 rounded-full"></div>
                                                    )}
                                                </div>
                                                <div className="p-2 rounded-full hover:bg-[var(--color-bg-gradient-start)] transition-all duration-200">
                                                    {isExpanded ? (
                                                        <ChevronUp className="w-5 h-5 text-[var(--color-primary-dark)] transition-transform duration-200" />
                                                    ) : (
                                                        <ChevronDown className="w-5 h-5 text-[var(--color-primary-dark)] transition-transform duration-200" />
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className={`transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
                                            <div className="p-8 space-y-6 bg-[var(--color-bg-primary)] border-t border-[var(--color-border-primary)]">
                                                {Object.entries(config.subsections).map(([subsectionKey, subsection]) => {
                                                    const subsectionPerms = permission[sectionKey]?.[subsectionKey] || {};

                                                    return (
                                                        <div key={subsectionKey} className="border border-primary-100 rounded-lg p-4 bg-[var(--color-bg-secondary)]">
                                                            <div className="flex items-center justify-between mb-4">
                                                                <h5 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                                                                    <Settings className="w-4 h-4 text-[var(--color-primary-dark)]" />
                                                                    {subsection.title}
                                                                </h5>
                                                                <button
                                                                    onClick={() => handlePermissionChange(sectionKey, subsectionKey, 'selectAll')}
                                                                    className="text-xs text-[var(--color-primary-dark)] hover:text-[var(--color-primary-darkest)] font-medium transition-colors duration-200 px-3 py-1 rounded-lg hover:bg-[var(--color-primary-lightest)] border border-[var(--color-primary-light)]"
                                                                >
                                                                    {subsectionPerms.selectAll ? 'Deselect all' : 'Select all'}
                                                                </button>
                                                            </div>

                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                {subsection.permission.map(perm => (
                                                                    <label
                                                                        key={perm.key}
                                                                        className="flex items-center space-x-3 cursor-pointer group p-3 rounded-lg hover:bg-[var(--color-primary-lightest)] transition-colors duration-150 border border-transparent hover:border-[var(--color-primary-light)]"
                                                                    >
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={subsectionPerms[perm.key] || false}
                                                                            onChange={() => handlePermissionChange(sectionKey, subsectionKey, perm.key)}
                                                                            className="w-4 h-4 text-[var(--color-primary-dark)] border-2 border-[var(--color-border-secondary)] rounded focus:ring-[var(--color-primary)] focus:ring-2 transition-colors duration-150"
                                                                        />
                                                                        <span className="text-sm text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] transition-colors duration-150 font-medium">
                                                                            {formatPermissionName(perm.title)}
                                                                        </span>
                                                                    </label>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Form Actions */}
                        <div className="flex items-center justify-end space-x-4 pt-8 border-t border-[var(--color-border-primary)]">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-[var(--color-text-secondary)] bg-[var(--color-bg-secondary)] border-2 border-[var(--color-border-secondary)] rounded-xl shadow-sm hover:bg-[var(--color-bg-primary)] hover:border-gray-400 focus:outline-none focus:ring-3 focus:ring-gray-500/20 transition-all duration-200"
                            >
                                <X className="w-4 h-4" />
                                Discard
                            </button>
                            <button
                                onClick={handleSaveChanges}
                                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-[var(--color-text-white)] bg-gradient-to-r from-[var(--color-primary-dark)] to-[var(--color-primary-darker)] border border-transparent rounded-xl shadow-lg hover:from-[var(--color-primary-darker)] hover:to-[var(--color-primary-darkest)] focus:outline-none focus:ring-3 focus:ring-[var(--color-primary)] transition-all duration-200 transform hover:scale-105"
                            >
                                <Save className="w-4 h-4" />
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {/* Toast Notification */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => closeToast()}
                />
            )}

            {/* Confirmation Modal */}
            <ConfirmDialog
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, type: '', data: null })}
                type="info"
                onConfirm={confirmModal.type === 'save' ? confirmSave : confirmCancel}
                title={confirmModal.type === 'save' ? 'Save Changes' : 'Discard Changes'}
                message={
                    confirmModal.type === 'save'
                        ? `Are you sure you want to ${isEditMode ? 'update' : 'create'} this role?`
                        : 'Are you sure you want to discard all changes? This action cannot be undone.'
                }
                confirmText={confirmModal.type === 'save' ? 'Save' : 'Discard'}
                cancelText="Cancel"
            />
        </div>
    );
};

export default AddRole;