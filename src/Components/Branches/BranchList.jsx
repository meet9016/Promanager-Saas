import React, { useState, useMemo } from "react";
import {
    Trash2,
    MapPin,
    Building2,
    X,
    Search,
    ChevronDown,
    ChevronRight,
    Edit
} from "lucide-react";
import { useSelector } from "react-redux";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import BranchForm from "./BranchForm";
import useBranches from "../../hooks/useBranches";
import LoadingSpinner from "../Loader/LoadingSpinner";
import { Toast } from "../ui/Toast";

const BranchList = () => {
    const [deletingId, setDeletingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [expandedBranches, setExpandedBranches] = useState(new Set());
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        type: null,
        data: null,
    });
    const [editingBranch, setEditingBranch] = useState(null);
    const permissions = useSelector((state) => state.permissions) || {};

    const { branches, loading, addBranch, deleteBranch } = useBranches();

    // eslint-disable-next-line no-unused-vars
    const [toast, setToast] = useState(null);

    const showToast = (message, type) => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 5000);
    };

    const handleAddBranch = async (name) => {
        const result = await addBranch(name);
        return result;
    };
    const handleEditBranch = async (name) => {
        if (!editingBranch) return;

        const result = await addBranch(name, editingBranch.branch_id || editingBranch.id);
        return result;
    };

    const handleDeleteBranch = async (id) => {
        const result = await deleteBranch(id);
        if (result && result.success) {
            showToast("Branch deleted successfully!", "success");
        } else {
            showToast("Failed to delete branch. Please try again.", "error");
        }
    };

    const toggleBranchExpansion = (branchId) => {
        const newExpanded = new Set(expandedBranches);
        if (newExpanded.has(branchId)) {
            newExpanded.delete(branchId);
        } else {
            newExpanded.add(branchId);
        }
        setExpandedBranches(newExpanded);
    };

    const filteredBranches = useMemo(() => {
        if (!branches || !searchTerm.trim()) {
            return branches || [];
        }

        return branches.filter(
            (branch) =>
                branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (branch.description &&
                    branch.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (branch.location &&
                    branch.location.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [branches, searchTerm]);

    const handleDeleteClick = (branch) => {
        setConfirmModal({
            isOpen: true,
            type: "delete",
            data: branch,
        });
    };

    const confirmDeleteBranch = async () => {
        const branch = confirmModal.data;
        if (!branch) return;
        const branchId = branch.branch_id || branch.id;
        setDeletingId(branchId);
        try {
            await handleDeleteBranch(branchId);
        } catch (error) {
            showToast("An error occurred while deleting the branch.", error);
        } finally {
            setDeletingId(null);
            closeModal();
        }
    };

    const closeModal = () => {
        if (!deletingId) {
            setConfirmModal({ isOpen: false, type: null, data: null });
        }
    };

    const clearSearch = () => {
        setSearchTerm("");
    };

    if (loading) {
        return (
            <div>
                <LoadingSpinner />
            </div>
        );
    }

    const totalBranches = branches ? branches.length : 0;
    const filteredCount = filteredBranches.length;

    return (
        <>
            <div className="bg-[var(--color-bg-secondary)] rounded-xl shadow-sm border border-[var(--color-primary-dark)] overflow-hidden">
                <div className="relative">
                    <div className="bg-[var(--color-primary-dark)] px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-[var(--color-bg-secondary-20)] rounded-lg">
                                    <Building2 className="w-5 h-5 text-[var(--color-text-white)]" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-[var(--color-text-white)]">
                                        Branches
                                    </h3>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-8 bg-[var(--color-bg-secondary)] flex flex-col gap-4">
                    {permissions["branch_create"] && (
                        <BranchForm
                            onSubmit={editingBranch ? handleEditBranch : handleAddBranch}
                            loading={loading}
                            showToast={showToast}
                            initialData={editingBranch}
                            onCancelEdit={() => setEditingBranch(null)}
                        />

                    )}



                    {/* Search Bar */}
                    {totalBranches > 0 && (
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-[var(--color-text-muted)]" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search branches..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="block w-full pl-10 pr-10 py-2 border border-[var(--color-border-primary)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]"
                            />
                            {searchTerm && (
                                <button
                                    onClick={clearSearch}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                >
                                    <X className="h-4 w-4 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]" />
                                </button>
                            )}
                        </div>
                    )}

                    {totalBranches === 0 ? (
                        <div className="text-center py-12">
                            <div className="mx-auto w-16 h-16 bg-[var(--color-primary-lighter)] rounded-full flex items-center justify-center mb-4">
                                <Building2 className="w-8 h-8 text-[var(--color-primary)]" />
                            </div>
                            <h4 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">
                                No branches found
                            </h4>
                            <p className="text-[var(--color-text-secondary)] mb-1">
                                Get started by adding your first branch
                            </p>
                            <p className="text-sm text-[var(--color-text-muted)]">
                                Use the form above to create a new branch
                            </p>
                        </div>
                    ) : filteredCount === 0 ? (
                        <div className="text-center py-12">
                            <div className="mx-auto w-16 h-16 bg-[var(--color-primary-lighter)] rounded-full flex items-center justify-center mb-4">
                                <Search className="w-8 h-8 text-[var(--color-primary)]" />
                            </div>
                            <h4 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">
                                No branches match your search
                            </h4>
                            <p className="text-[var(--color-text-secondary)] mb-4">
                                Try adjusting your search terms or
                            </p>
                            <button
                                onClick={clearSearch}
                                className="inline-flex items-center px-4 py-2 bg-[var(--color-primary-dark)] text-[var(--color-text-white)] font-medium rounded-lg hover:bg-[var(--color-primary-darker)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)] transition-colors"
                            >
                                <X className="w-4 h-4 mr-2" />
                                Clear Search
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredBranches.map((branch) => {
                                const branchId = branch.branch_id || branch.id;
                                const isDeleting = deletingId === branchId;
                                const isExpanded = expandedBranches.has(branchId);

                                return (
                                    <div
                                        key={branchId}
                                        className="border border-[var(--color-border-primary)] rounded-lg bg-[var(--color-bg-primary)]  transition-all duration-200"
                                    >
                                        {/* Accordion Header */}
                                        <div
                                            className="flex items-center justify-between p-4 cursor-pointer hover:bg-[var(--color-bg-hover)] transition-colors"
                                            onClick={() => toggleBranchExpansion(branchId)}
                                        >
                                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                                                <div className="p-1.5 bg-[var(--color-primary-lighter)] rounded-md">
                                                    <Building2 className="w-4 h-4 text-[var(--color-primary-dark)]" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-lg font-semibold text-[var(--color-text-primary)] truncate">
                                                        {branch.name}
                                                    </h4>
                                                    {branch.location && (
                                                        <div className="flex items-center text-sm text-[var(--color-text-secondary)] mt-1">
                                                            <MapPin className="w-3 h-3 mr-1 text-[var(--color-primary)]" />
                                                            {branch.location}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center space-x-2">
                                                {permissions['branch_edit'] && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEditingBranch(branch);
                                                        }}
                                                        className="p-2 rounded-md transition-colors text-[var(--color-primary-dark)] hover:text-[var(--color-primary-darkest)] hover:bg-[var(--color-primary-lightest)]"
                                                        title="Branch Edit"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {permissions["branch_delete"] && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteClick(branch);
                                                        }}
                                                        disabled={isDeleting}
                                                        className="p-2 text-[var(--color-text-error)] hover:text-[var(--color-error-dark)] hover:bg-[var(--color-error-light)] rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        title="Delete branch"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}

                                                {/* Dropdown Arrow */}
                                                <div className="p-1">
                                                    {isExpanded ? (
                                                        <ChevronDown className="w-5 h-5 text-[var(--color-text-secondary)]" />
                                                    ) : (
                                                        <ChevronRight className="w-5 h-5 text-[var(--color-text-secondary)]" />
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Accordion Content with smooth transition */}
                                        <div
                                            className={`overflow-hidden transition-all duration-500 ease-in-out ${isExpanded ? "max-h-[1500px] opacity-100" : "max-h-0 opacity-0"
                                                }`}
                                        >
                                            <div className="px-4 pb-4 border-t border-[var(--color-border-light)]">
                                                <div className="pt-4 space-y-4">
                                                    {/* Branch Details Grid */}
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                        <div className="space-y-2">
                                                            <label className="block text-sm font-medium text-[var(--color-text-primary)]">
                                                                Location Code
                                                            </label>
                                                            <div className="p-3 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-lg">
                                                                <span className="text-[var(--color-text-primary)]">
                                                                    {branch.location_code || "Not specified"}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-2">
                                                            <label className="block text-sm font-medium text-[var(--color-text-primary)]">
                                                                Location Description{" "}

                                                            </label>
                                                            <div className="p-3 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-lg">
                                                                <span className="text-[var(--color-text-primary)]">
                                                                    {branch.location_description || "No description provided"}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-2">
                                                            <label className="block text-sm font-medium text-[var(--color-text-primary)]">
                                                                IP Address
                                                            </label>
                                                            <div className="p-3 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-lg">
                                                                <span className="text-[var(--color-text-primary)]">
                                                                    {branch.ip_address || "Not specified"}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-2">
                                                            <label className="block text-sm font-medium text-[var(--color-text-primary)]">
                                                                Device Name
                                                            </label>
                                                            <div className="p-3 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-lg">
                                                                <span className="text-[var(--color-text-primary)]">
                                                                    {branch.device_name || "Not specified"}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-2">
                                                            <label className="block text-sm font-medium text-[var(--color-text-primary)]">
                                                                Serial Number
                                                            </label>
                                                            <div className="p-3 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-lg">
                                                                <span className="text-[var(--color-text-primary)]">
                                                                    {branch.serial_number || "Not specified"}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-2">
                                                            <label className="block text-sm font-medium text-[var(--color-text-primary)]">
                                                                Activation Code{" "}
                                                            </label>
                                                            <div className="p-3 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-lg">
                                                                <span className="text-[var(--color-text-primary)]">
                                                                    {branch.activation_code || "Not specified"}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Additional Info Section */}
                                                    {(branch.created_at || branch.updated_at) && (
                                                        <div className="pt-4 border-t border-[var(--color-border-light)]">
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-[var(--color-text-secondary)]">
                                                                {branch.created_at && (
                                                                    <div>
                                                                        <span className="font-medium">Created: </span>
                                                                        {new Date(branch.created_at).toLocaleDateString()}
                                                                    </div>
                                                                )}
                                                                {branch.updated_at && (
                                                                    <div>
                                                                        <span className="font-medium">Last Updated: </span>
                                                                        {new Date(branch.updated_at).toLocaleDateString()}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <ConfirmDialog
                    isOpen={confirmModal.isOpen && confirmModal.type === "delete"}
                    onClose={closeModal}
                    onConfirm={confirmDeleteBranch}
                    title="Delete Branch"
                    message={`Are you sure you want to delete "${confirmModal.data?.name || "this Branch"
                        }"? This action cannot be undone.`}
                    confirmText="Delete"
                    cancelText="Cancel"
                    type="danger"
                />
                {toast && (
                    <Toast
                        message={toast.message}
                        type={toast.type}
                        onClose={() => setToast(null)}
                    />
                )}
            </div>
        </>
    );
};

export default BranchList;
