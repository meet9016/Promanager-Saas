import React, { useState, useMemo } from "react";
import {
    Trash2,
    MapPin,
    Building2,
    X,
    Search,
    ChevronDown,
    ChevronRight,
    Edit,
    Info
} from "lucide-react";
import { useSelector } from "react-redux";
import { ConfirmDialog } from "../comman/ConfirmDialog";
import BranchForm from "./BranchForm";
import useBranches from "../../hooks/useBranches";
import LoadingSpinner from "../Loader/LoadingSpinner";
import { Toast } from "../ui/Toast";
import NoDataFound from "../comman/NoDataFound";

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
            <div className="bg-[var(--color-bg-secondary)] rounded-xl shadow-sm border border-[var(--color-primary-dark)] overflow-hidden h-full flex flex-col">
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

                <div className="p-8 bg-[var(--color-bg-secondary)] flex-1 flex flex-col gap-4 overflow-hidden">
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
                        <div className="bg-[#FBF9FD]">
                            <NoDataFound
                                title="No Branches Found"
                                subtitle="Get started by adding your first branch."
                            />
                        </div>
                    ) : filteredCount === 0 ? (
                        <NoDataFound
                            title="No Branches Match Your Search"
                            subtitle="Try adjusting your search terms."
                        />
                    ) : (
                        <div className="space-y-2 h-[460px] max-[1024px]:h-[250px] overflow-y-auto custom-scrollbar">
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
                                                <button
                                                    // onClick={(e) => {
                                                    //     e.stopPropagation();
                                                    //     setEditingBranch(branch);
                                                    // }}
                                                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-green-50 text-green-600 hover:bg-green-100 hover:scale-110 hover:shadow-md transition-all duration-200"
                                                    title="Info"
                                                >
                                                    <Info className="w-4 h-4" strokeWidth={2.5} />
                                                </button>
                                                {permissions['branch_edit'] && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEditingBranch(branch);
                                                        }}
                                                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 hover:scale-110 hover:shadow-md transition-all duration-200"
                                                        title="Branch Edit"
                                                    >
                                                        <Edit className="w-4 h-4" strokeWidth={2.5} />
                                                    </button>
                                                )}
                                                {permissions["branch_delete"] && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteClick(branch);
                                                        }}
                                                        disabled={isDeleting}
                                                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-100 hover:scale-110 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                                        title="Delete branch"
                                                    >
                                                        <Trash2 className="w-4 h-4" strokeWidth={2.5} />
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
                                            <div className="px-6 pb-6 border-t border-[var(--color-border-light)] bg-gradient-to-b from-transparent to-[var(--color-bg-secondary)]/10">
                                                <div className="pt-6 space-y-6">
                                                    {/* Branch Details Grid */}
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

                                                        {/* Location Code Card */}
                                                        <div className="group relative p-4 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl transition-all duration-200 hover:shadow-md hover:border-[var(--color-border-light)]">
                                                            <label className="block text-xs font-semibold tracking-wider uppercase text-[var(--color-text-secondary)] mb-2">
                                                                Location Code
                                                            </label>
                                                            <div className="text-base font-medium text-[var(--color-text-primary)]">
                                                                {branch.location_code || (
                                                                    <span className="text-sm italic opacity-50">Not specified</span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Device Name Card */}
                                                        <div className="group relative p-4 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl transition-all duration-200 hover:shadow-md hover:border-[var(--color-border-light)]">
                                                            <label className="block text-xs font-semibold tracking-wider uppercase text-[var(--color-text-secondary)] mb-2">
                                                                Device Name
                                                            </label>
                                                            <div className="text-base font-medium text-[var(--color-text-primary)]">
                                                                {(branch.devices?.[0]?.device_name) || (
                                                                    <span className="text-sm italic opacity-50">Not specified</span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Serial Number Card */}
                                                        <div className="group relative p-4 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl transition-all duration-200 hover:shadow-md hover:border-[var(--color-border-light)]">
                                                            <label className="block text-xs font-semibold tracking-wider uppercase text-[var(--color-text-secondary)] mb-2">
                                                                Serial Number
                                                            </label>
                                                            <div className="text-base font-mono font-medium text-[var(--color-text-primary)] tracking-wide">
                                                                {(branch.devices?.[0]?.serial_number) || (
                                                                    <span className="text-sm italic font-sans opacity-50">Not specified</span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Activation Code Card */}
                                                        <div className="group relative p-4 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl transition-all duration-200 hover:shadow-md hover:border-[var(--color-border-light)]">
                                                            <label className="block text-xs font-semibold tracking-wider uppercase text-[var(--color-text-secondary)] mb-2">
                                                                Activation Code
                                                            </label>
                                                            <div className="text-base font-mono font-medium text-[var(--color-text-primary)] tracking-wide">
                                                                {(branch.devices?.[0]?.activation_code) || (
                                                                    <span className="text-sm italic font-sans opacity-50">Not specified</span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Product Type Card */}
                                                        <div className="group relative p-4 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl transition-all duration-200 hover:shadow-md hover:border-[var(--color-border-light)]">
                                                            <label className="block text-xs font-semibold tracking-wider uppercase text-[var(--color-text-secondary)] mb-2">
                                                                Product Type
                                                            </label>
                                                            <div className="text-base font-medium text-[var(--color-text-primary)]">
                                                                {branch.product_type_name || (
                                                                    <span className="text-sm italic opacity-50">Not specified</span>
                                                                )}
                                                            </div>
                                                        </div>

                                                    </div>

                                                    {/* Additional Info Section / Footer Timeline */}
                                                    {(branch.created_at || branch.updated_at) && (
                                                        <div className="pt-4 border-t border-[var(--color-border-light)] flex flex-wrap gap-x-6 gap-y-2 text-xs text-[var(--color-text-secondary)] font-medium">
                                                            {branch.created_at && (
                                                                <div className="flex items-center gap-1.5 bg-[var(--color-bg-secondary)] px-2.5 py-1 rounded-md border border-[var(--color-border-primary)]">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                                    <span className="opacity-70">Created:</span>
                                                                    <span className="text-[var(--color-text-primary)]">  {new Date(branch.created_at).toLocaleDateString()}</span>
                                                                </div>
                                                            )}
                                                            {branch.updated_at && (
                                                                <div className="flex items-center gap-1.5 bg-[var(--color-bg-secondary)] px-2.5 py-1 rounded-md border border-[var(--color-border-primary)]">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                                                    <span className="opacity-70">Last Updated:</span>
                                                                    <span className="text-[var(--color-text-primary)]">   {new Date(branch.updated_at).toLocaleDateString()}</span>
                                                                </div>
                                                            )}
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

