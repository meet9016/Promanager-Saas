import React, { useState } from "react";
import { Trash2, IndianRupee } from "lucide-react";
import { useSelector } from 'react-redux';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import AllowanceForm from "./AllowanceForm";
import useAllowances from "../../hooks/useAllowances";
import LoadingSpinner from "../Loader/LoadingSpinner"

const AllowanceList = () => {
    const [deletingId, setDeletingId] = useState(null);
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        type: null,
        data: null
    });

    // eslint-disable-next-line no-unused-vars
    const [toast, setToast] = useState(null);

    const permissions = useSelector(state => state.permissions) || {};
    const { allowances, loading, addAllowance, deleteAllowance } = useAllowances();

    const showToast = (message, type) => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 5000);
    };

    const handleAddAllowance = async (name) => {
        return await addAllowance(name);
    };

    const handleDeleteAllowance = async (id) => {
        const result = await deleteAllowance(id);
        if (result?.success) {
            showToast("Allowance deleted successfully!", "success");
        } else {
            showToast("Failed to delete allowance. Please try again.", "error");
        }
    };

    const handleDeleteClick = (allowance) => {
        setConfirmModal({
            isOpen: true,
            type: 'delete',
            data: allowance
        });
    };

    const confirmDeleteAllowance = async () => {
        const allowance = confirmModal.data;
        if (!allowance) return;

        const allowanceId = allowance.allowance_id || allowance.id;
        setDeletingId(allowanceId);

        try {
            await handleDeleteAllowance(allowanceId);
        } catch (error) {
            showToast("An error occurred while deleting the allowance.", error);
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

    if (loading) {
        return (
            <div>
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <>
            <div className="bg-[var(--color-bg-secondary)] rounded-xl shadow-sm border border-[var(--color-primary-dark)] overflow-hidden">
                <div className="relative">
                    <div className="bg-[var(--color-primary-dark)] px-6 py-4">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-[var(--color-bg-secondary-20)] rounded-lg">
                                <IndianRupee className="w-5 h-5 text-[var(--color-text-white)]" />
                            </div>
                            <h3 className="text-lg font-semibold text-[var(--color-text-white)]">
                                Allowances
                            </h3>
                        </div>
                    </div>
                </div>

                <div className="p-8 bg-[var(--color-bg-secondary)] flex flex-col gap-4">
                    {permissions['allowance_create'] && (
                        <AllowanceForm
                            onSubmit={handleAddAllowance}
                            loading={loading}
                            showToast={showToast}
                        />
                    )}

                    {!allowances || allowances.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="mx-auto w-16 h-16 bg-[var(--color-primary-lighter)] rounded-full flex items-center justify-center mb-4">
                                <IndianRupee className="w-8 h-8 text-[var(--color-primary)]" />
                            </div>
                            <h4 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">
                                No allowances found
                            </h4>
                            <p className="text-[var(--color-text-secondary)] mb-1">
                                Get started by adding your first allowance
                            </p>
                            <p className="text-sm text-[var(--color-text-muted)]">
                                Use the form above to create a new allowance
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {allowances.map((allowance) => {
                                const allowanceId = allowance.allowance_id || allowance.id;
                                const isDeleting = deletingId === allowanceId;

                                return (
                                    <div
                                        key={allowanceId}
                                        className="border border-[var(--color-border-primary)] rounded-lg p-4 hover:border-primary-300 hover:shadow-md transition-all duration-200 bg-gradient-to-r from-green-50/20 to-emerald-50/20 hover:from-green-50/40 hover:to-emerald-50/40"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center space-x-2 mb-2">
                                                    <div className="p-1.5 bg-green-100 rounded-md">
                                                        <IndianRupee className="w-4 h-4 text-green-600" />
                                                    </div>
                                                    <h4 className="text-lg font-semibold text-[var(--color-text-primary)] truncate">
                                                        {allowance.name}
                                                    </h4>
                                                </div>

                                                {allowance.description && (
                                                    <p className="text-[var(--color-text-secondary)] mb-2 text-sm leading-relaxed pl-7">
                                                        {allowance.description}
                                                    </p>
                                                )}

                                                {allowance.amount && (
                                                    <div className="flex items-center text-sm text-[var(--color-text-secondary)] mb-2 pl-7">
                                                        <span className="font-medium text-green-600">
                                                            Amount: ₹{allowance.amount}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {permissions['allowance_delete'] && (
                                                <button
                                                    onClick={() => handleDeleteClick(allowance)}
                                                    disabled={isDeleting}
                                                    className="ml-4 p-2 text-[var(--color-text-error)] hover:text-[var(--color-error-dark)] hover:bg-[var(--color-error-light)] rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    title="Delete allowance"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <ConfirmDialog
                isOpen={confirmModal.isOpen && confirmModal.type === 'delete'}
                onClose={closeModal}
                onConfirm={confirmDeleteAllowance}
                title="Delete Allowance"
                message={`Are you sure you want to delete "${confirmModal.data?.name || 'this Allowance'}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                type="danger"
            />
        </>
    );
};

export default AllowanceList;