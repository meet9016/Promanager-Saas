import React, { useState, useMemo } from "react";
import { Trash2, Briefcase, X, Search } from "lucide-react";
import { useSelector } from 'react-redux';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import DesignationForm from "./DesignationForm";
import useDesignations from "../../hooks/useDesignations";
import LoadingSpinner from "../Loader/LoadingSpinner"

const DesignationList = () => {
    const [deletingId, setDeletingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        type: null,
        data: null
    });
    const permissions = useSelector(state => state.permissions) || {};

    const {
        designations,
        loading,
        addDesignation,
        deleteDesignation,
    } = useDesignations();

    // eslint-disable-next-line no-unused-vars
    const [toast, setToast] = useState(null);

    const showToast = (message, type) => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 5000);
    };

    const handleAddDesignation = async (name) => {
        const result = await addDesignation(name);
        return result;
    };

    const handleDeleteDesignation = async (id) => {
        const result = await deleteDesignation(id);
        if (result && result.success) {
            showToast("Designation deleted successfully!", "success");
        } else {
            showToast("Failed to delete designation. Please try again.", "error");
        }
    };

    // Real-time search filtering using useMemo for performance
    const filteredDesignations = useMemo(() => {
        if (!designations || !searchTerm.trim()) {
            return designations || [];
        }

        return designations.filter(designation =>
            designation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (designation.description && designation.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (designation.level && designation.level.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (designation.department && designation.department.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [designations, searchTerm]);

    const handleDeleteClick = (designation) => {
        setConfirmModal({
            isOpen: true,
            type: 'delete',
            data: designation
        });
    };

    const confirmDeleteDesignation = async () => {
        const designation = confirmModal.data;
        if (!designation) return;
        const designationId = designation.designation_id || designation.id;
        setDeletingId(designationId);
        try {
            await handleDeleteDesignation(designationId);
        } catch (error) {
            showToast("An error occurred while deleting the designation.", error);
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

    const totalDesignations = designations ? designations.length : 0;
    const filteredCount = filteredDesignations.length;

    return (
        <>
            <div className="bg-[var(--color-bg-secondary)] rounded-xl shadow-sm border border-[var(--color-primary-dark)] overflow-hidden">
                <div className="relative">
                    <div className="bg-[var(--color-primary-dark)] px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-[var(--color-bg-secondary-20)] rounded-lg">
                                    <Briefcase className="w-5 h-5 text-[var(--color-text-white)]" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-[var(--color-text-white)]">
                                        Designations
                                    </h3>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-8 bg-[var(--color-bg-secondary)] flex flex-col gap-4">
                    {permissions['designation_create'] &&
                        <DesignationForm
                            onSubmit={handleAddDesignation}
                            loading={loading}
                            showToast={showToast}
                        />
                    }
                    {totalDesignations === 0 ? (
                        <div className="text-center py-12">
                            <div className="mx-auto w-16 h-16 bg-[var(--color-primary-lighter)] rounded-full flex items-center justify-center mb-4">
                                <Briefcase className="w-8 h-8 text-[var(--color-primary)]" />
                            </div>
                            <h4 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">
                                No designations found
                            </h4>
                            <p className="text-[var(--color-text-secondary)] mb-1">
                                Get started by adding your first designation
                            </p>
                            <p className="text-sm text-[var(--color-text-muted)]">
                                Use the form above to create a new designation
                            </p>
                        </div>
                    ) : filteredCount === 0 ? (
                        <div className="text-center py-12">
                            <div className="mx-auto w-16 h-16 bg-[var(--color-primary-lighter)] rounded-full flex items-center justify-center mb-4">
                                <Search className="w-8 h-8 text-[var(--color-primary)]" />
                            </div>
                            <h4 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">
                                No designations match your search
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
                        <div className="grid gap-4">
                            {filteredDesignations.map((designation) => {
                                const designationId = designation.designation_id || designation.id;
                                const isDeleting = deletingId === designationId;

                                return (
                                    <div
                                        key={designationId}
                                        className="border border-[var(--color-border-primary)] rounded-lg p-4 hover:border-primary-300 hover:shadow-md transition-all duration-200 bg-gradient-to-r from-primary-50/20 to-indigo-50/20 hover:from-primary-50/40 hover:to-indigo-50/40"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center space-x-2 mb-2">
                                                    <div className="p-1.5 bg-[var(--color-primary-lighter)] rounded-md">
                                                        <Briefcase className="w-4 h-4 text-[var(--color-primary-dark)]" />
                                                    </div>
                                                    <h4 className="text-lg font-semibold text-[var(--color-text-primary)] truncate">
                                                        {designation.name}
                                                    </h4>
                                                </div>

                                                {designation.description && (
                                                    <p className="text-[var(--color-text-secondary)] mb-2 text-sm leading-relaxed pl-7">
                                                        {designation.description}
                                                    </p>
                                                )}

                                                {designation.level && (
                                                    <p className="text-[var(--color-text-secondary)] mb-1 text-sm pl-7">
                                                        <span className="font-medium text-[var(--color-primary-dark)]">Level:</span> {designation.level}
                                                    </p>
                                                )}

                                                {designation.department && (
                                                    <p className="text-[var(--color-text-secondary)] mb-2 text-sm pl-7">
                                                        <span className="font-medium text-[var(--color-primary-dark)]">Department:</span> {designation.department}
                                                    </p>
                                                )}
                                            </div>
                                            {permissions['designation_delete'] &&
                                                <button
                                                    onClick={() => handleDeleteClick(designation)}
                                                    disabled={isDeleting}
                                                    className="ml-4 p-2 text-[var(--color-text-error)] hover:text-[var(--color-error-dark)] hover:bg-[var(--color-error-light)] rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                                                    title="Delete designation"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            }
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
                <ConfirmDialog
                    isOpen={confirmModal.isOpen && confirmModal.type === 'delete'}
                    onClose={closeModal}
                    onConfirm={confirmDeleteDesignation}
                    title="Delete Designation"
                    message={`Are you sure you want to delete "${confirmModal.data?.name || 'this designation'}"? This action cannot be undone.`}
                    confirmText="Delete"
                    cancelText="Cancel"
                    type="danger"
                />
            </div>

        </>
    );
};

export default DesignationList;