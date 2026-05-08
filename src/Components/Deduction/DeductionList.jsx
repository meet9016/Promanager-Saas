import React, { useState } from "react";
import { Trash2, Calculator } from "lucide-react";
import { useSelector } from 'react-redux';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import DeductionForm from "./DeductionForm";
import useDeductions from "../../hooks/useDeductions";
import LoadingSpinner from "../Loader/LoadingSpinner"

const DeductionList = () => {
    const [deletingId, setDeletingId] = useState(null);
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        type: null,
        data: null
    });
    // eslint-disable-next-line no-unused-vars
    const [toast, setToast] = useState(null);

    const permissions = useSelector(state => state.permissions) || {};
    const { deductions, loading, addDeduction, deleteDeduction } = useDeductions();

    const showToast = (message, type) => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 5000);
    };

    const handleAddDeduction = async (name) => {
        return await addDeduction(name);
    };

    const handleDeleteDeduction = async (id) => {
        const result = await deleteDeduction(id);
        if (result?.success) {
            showToast("Deduction deleted successfully!", "success");
        } else {
            showToast("Failed to delete deduction. Please try again.", "error");
        }
    };

    const handleDeleteClick = (deduction) => {
        setConfirmModal({
            isOpen: true,
            type: 'delete',
            data: deduction
        });
    };

    const confirmDeleteDeduction = async () => {
        const deduction = confirmModal.data;
        if (!deduction) return;

        const deductionId = deduction.deduction_id || deduction.id;
        setDeletingId(deductionId);

        try {
            await handleDeleteDeduction(deductionId);
        } catch (error) {
            showToast("An error occurred while deleting the deduction.", error);
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
                                <Calculator className="w-5 h-5 text-[var(--color-text-white)]" />
                            </div>
                            <h3 className="text-lg font-semibold text-[var(--color-text-white)]">
                                Deductions
                            </h3>
                        </div>
                    </div>
                </div>

                <div className="p-8 bg-[var(--color-bg-secondary)] flex flex-col gap-4">
                    {permissions['deduction_create'] && (
                        <DeductionForm
                            onSubmit={handleAddDeduction}
                            loading={loading}
                            showToast={showToast}
                        />
                    )}

                    {!deductions || deductions.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="mx-auto w-16 h-16 bg-[var(--color-primary-lighter)] rounded-full flex items-center justify-center mb-4">
                                <Calculator className="w-8 h-8 text-[var(--color-primary)]" />
                            </div>
                            <h4 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">
                                No deductions found
                            </h4>
                            <p className="text-[var(--color-text-secondary)] mb-1">
                                Get started by adding your first deduction
                            </p>
                            <p className="text-sm text-[var(--color-text-muted)]">
                                Use the form above to create a new deduction
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {deductions.map((deduction) => {
                                const deductionId = deduction.deduction_id || deduction.id;
                                const isDeleting = deletingId === deductionId;

                                return (
                                    <div
                                        key={deductionId}
                                        className="border border-[var(--color-border-primary)] rounded-lg p-4 hover:border-primary-300 hover:shadow-md transition-all duration-200 bg-gradient-to-r from-red-50/20 to-orange-50/20 hover:from-red-50/40 hover:to-orange-50/40"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center space-x-2 mb-2">
                                                    <div className="p-1.5 bg-red-100 rounded-md">
                                                        <Calculator className="w-4 h-4 text-red-600" />
                                                    </div>
                                                    <h4 className="text-lg font-semibold text-[var(--color-text-primary)] truncate">
                                                        {deduction.name}
                                                    </h4>
                                                </div>

                                                {deduction.description && (
                                                    <p className="text-[var(--color-text-secondary)] mb-2 text-sm leading-relaxed pl-7">
                                                        {deduction.description}
                                                    </p>
                                                )}

                                                {deduction.amount && (
                                                    <div className="flex items-center text-sm text-[var(--color-text-secondary)] mb-2 pl-7">
                                                        <span className="font-medium text-red-600">
                                                            Amount: ₹{deduction.amount}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {permissions['deduction_delete'] && (
                                                <button
                                                    onClick={() => handleDeleteClick(deduction)}
                                                    disabled={isDeleting}
                                                    className="ml-4 p-2 text-[var(--color-text-error)] hover:text-[var(--color-error-dark)] hover:bg-[var(--color-error-light)] rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    title="Delete deduction"
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
                onConfirm={confirmDeleteDeduction}
                title="Delete Deduction"
                message={`Are you sure you want to delete "${confirmModal.data?.name || 'this Deduction'}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                type="danger"
            />
        </>
    );
};

export default DeductionList;