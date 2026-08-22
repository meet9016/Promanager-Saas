import React, { useState, useMemo, useEffect } from "react";
import { Trash2, MapPin, Building2, FileText, Search, X, Eye, Edit } from "lucide-react";
import { useSelector } from 'react-redux';
import { ConfirmDialog } from '../comman/ConfirmDialog';
import CompanyForm from "./CompanyForm";
import useCompanies from "../../hooks/useCompanies";
import LoadingSpinner from "../Loader/LoadingSpinner";
import { Toast } from "../ui/Toast";

// Standalone Preview Item Component (outside CompanyList to prevent re-render unmounting jerk)
const PreviewItem = React.memo(({ content, title, isText = false, companyName, onPreview }) => {
    const hasContent = Boolean(content && content.trim() !== '');

    return (
        <div className="flex items-center justify-between p-3 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-primary)] hover:border-[var(--color-primary-dark)] transition-colors">
            <span className="text-sm font-medium text-[var(--color-text-primary)]">{title}</span>
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    if (hasContent) {
                        onPreview(content, `${companyName} - ${title}`, isText);
                    }
                }}
                disabled={!hasContent}
                className={`p-2 rounded-lg transition-all duration-200 ${hasContent
                    ? 'bg-[var(--color-primary-lightest,#f3e8ff)] hover:bg-[var(--color-primary-lighter,#e9d5ff)] text-[var(--color-primary-dark)] active:scale-95 cursor-pointer shadow-sm'
                    : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-disabled)] cursor-not-allowed'
                    }`}
                title={hasContent ? `Preview ${title.toLowerCase()}` : `No ${title.toLowerCase()} available`}
            >
                <Eye className="w-4 h-4" />
            </button>
        </div>
    );
});

// Standalone Preview Modal Component with smooth popup & image fade-in
const PreviewModal = React.memo(({ isOpen, onClose, title, image, text }) => {
    const [imgLoading, setImgLoading] = useState(true);

    useEffect(() => {
        setImgLoading(true);
    }, [image]);

    if (!isOpen) return null;

    const isTextPreview = text && !image;

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300 animate-fadeIn"
            onClick={onClose}
        >
            <div
                className="relative bg-[var(--color-bg-primary)] rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-modalPop"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-4 border-b border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] shrink-0">
                    <h3 className="text-lg font-semibold text-[var(--color-text-primary)] flex items-center">
                        {isTextPreview ? (
                            <FileText className="w-5 h-5 mr-2 text-[var(--color-primary-dark)]" />
                        ) : (
                            <Eye className="w-5 h-5 mr-2 text-[var(--color-primary-dark)]" />
                        )}
                        {title}
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 hover:bg-[var(--color-bg-hover,#f3f4f6)] rounded-lg transition-colors"
                        title="Close preview"
                    >
                        <X className="w-5 h-5 text-[var(--color-text-secondary)]" />
                    </button>
                </div>

                <div className="overflow-auto flex-1 p-6 bg-[var(--color-bg-secondary)] custom-scrollbar min-h-[350px] flex items-center justify-center">
                    {isTextPreview ? (
                        <div className="w-full">
                            <div className="bg-[var(--color-bg-primary)] rounded-lg p-4 border border-[var(--color-border-primary)]">
                                <pre className="whitespace-pre-wrap text-sm text-[var(--color-text-primary)] font-mono leading-relaxed">
                                    {text}
                                </pre>
                            </div>
                        </div>
                    ) : image ? (
                        <div className="relative w-full h-full min-h-[350px] flex items-center justify-center">
                            {imgLoading && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary-dark)]"></div>
                                </div>
                            )}
                            <img
                                src={image}
                                alt="Preview"
                                onLoad={() => setImgLoading(false)}
                                onError={() => setImgLoading(false)}
                                className={`max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg transition-opacity duration-300 ${imgLoading ? 'opacity-0' : 'opacity-100'
                                    }`}
                            />
                        </div>
                    ) : null}
                </div>

                <div className="px-4 py-3 bg-[var(--color-bg-secondary)] border-t border-[var(--color-border-primary)] shrink-0">
                    <p className="text-xs text-[var(--color-text-muted)] text-center">Click outside to close</p>
                </div>
            </div>
        </div>
    );
});

const CompanyList = () => {
    const [deletingId, setDeletingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        type: null,
        data: null
    });

    // Preview Modal State
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [previewImage, setPreviewImage] = useState('');
    const [previewTitle, setPreviewTitle] = useState('');
    const [previewText, setPreviewText] = useState('');

    const permissions = useSelector(state => state.permissions) || {};

    const {
        companies,
        loading,
        addCompany,
        deleteCompany,
    } = useCompanies();

    const [toast, setToast] = useState(null);
    const [editCompanyData, setEditCompanyData] = useState(null);
    const showToast = (message, type) => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 5000);
    };

    const handleAddCompany = async (companyData) => {
        const result = await addCompany(companyData);

        if (result && result.success) {
            setEditCompanyData(null);
        }
        return result;
    };
    const handleEditCompany = async (company) => {
        setEditCompanyData(company);

    };
    const handleDeleteCompany = async (id) => {
        const result = await deleteCompany(id);
        if (result && result.success) {
            showToast("Company deleted successfully!", "success");
        } else {
            showToast("Failed to delete company. Please try again.", "error");
        }
    };

    // Unified Preview handler
    const handlePreview = (content, title, isText = false) => {
        if (isText) {
            setPreviewImage('');
            setPreviewTitle(title);
            setPreviewText(content);
        } else {
            setPreviewImage(content);
            setPreviewTitle(title);
            setPreviewText('');
        }
        setShowPreviewModal(true);
    };

    const closePreviewModal = () => {
        setShowPreviewModal(false);
        setPreviewImage('');
        setPreviewTitle('');
        setPreviewText('');
    };

    // Real-time search filtering using useMemo for performance
    const filteredCompanies = useMemo(() => {
        if (!companies || !searchTerm.trim()) {
            return companies || [];
        }

        return companies.filter(company =>
            company.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            company.company_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            company.company_address?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [companies, searchTerm]);

    const handleDeleteClick = (company) => {
        setConfirmModal({
            isOpen: true,
            type: 'delete',
            data: company
        });
    };

    const confirmDeleteCompany = async () => {
        const company = confirmModal.data;
        if (!company) return;
        const companyId = company.company_id || company.id;
        setDeletingId(companyId);
        try {
            await handleDeleteCompany(companyId);
        } catch (error) {
            showToast("An error occurred while deleting the company.", error);
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

    const totalCompanies = companies ? companies.length : 0;
    const filteredCount = filteredCompanies.length;

    return (
        <>
            {/* Standalone Preview Modal */}
            <PreviewModal
                isOpen={showPreviewModal}
                onClose={closePreviewModal}
                title={previewTitle}
                image={previewImage}
                text={previewText}
            />

            <div className="bg-[var(--color-bg-secondary)] rounded-xl shadow-sm border border-[var(--color-primary-dark)] overflow-hidden flex flex-col h-full">
                <div className="relative shrink-0">
                    <div className="bg-[var(--color-primary-dark)] px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-[var(--color-bg-secondary-20)] rounded-lg">
                                    <Building2 className="w-5 h-5 text-[var(--color-text-white)]" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-[var(--color-text-white)]">
                                        Companies
                                    </h3>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-8 flex flex-col gap-4 flex-1 overflow-y-auto custom-scrollbar">
                    {/* Company Form */}
                    {permissions['company_create'] && (
                        <CompanyForm
                            onSubmit={handleAddCompany}
                            loading={loading}
                            showToast={showToast}
                            editData={editCompanyData}

                        />
                    )}

                    {/* Company List */}
                    {totalCompanies === 0 ? (
                        <div className="text-center py-12">
                            <div className="mx-auto w-16 h-16 bg-[var(--color-primary-lighter)] rounded-full flex items-center justify-center mb-4">
                                <Building2 className="w-8 h-8 text-[var(--color-primary)]" />
                            </div>
                            <h4 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">
                                No companies found
                            </h4>
                            <p className="text-[var(--color-text-secondary)] mb-1">
                                Get started by adding your first company
                            </p>
                            <p className="text-sm text-[var(--color-text-muted)]">
                                Use the form above to create a new company
                            </p>
                        </div>
                    ) : filteredCount === 0 ? (
                        <div className="text-center py-12">
                            <div className="mx-auto w-16 h-16 bg-[var(--color-primary-lighter)] rounded-full flex items-center justify-center mb-4">
                                <Search className="w-8 h-8 text-[var(--color-primary)]" />
                            </div>
                            <h4 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">
                                No companies match your search
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
                            {filteredCompanies.map((company) => {
                                const companyId = company.company_id || company.id;
                                const isDeleting = deletingId === companyId;

                                return (
                                    <div
                                        key={companyId}
                                        className="border border-[var(--color-border-primary)] rounded-lg p-4 hover:border-primary-300 hover:shadow-md transition-all duration-200 "
                                    >
                                        <div className="flex items-start justify-between">
                                            {/* Left side - Company Info */}
                                            <div className="flex-1 min-w-0 pr-4">
                                                <div className="flex items-center space-x-2 mb-2">
                                                    <div className="p-1.5 bg-[var(--color-primary-lighter)] rounded-md">
                                                        <Building2 className="w-4 h-4 text-[var(--color-primary-dark)]" />
                                                    </div>
                                                    <h4 className="text-lg font-semibold text-[var(--color-text-primary)] truncate">
                                                        {company.company_name}
                                                    </h4>
                                                </div>

                                                <div className="flex items-center space-x-4 mb-4 text-sm text-[var(--color-text-secondary)] pl-7">
                                                    {company.company_number && (
                                                        <div className="flex items-center space-x-1">
                                                            <Building2 className="w-4 h-4 text-[var(--color-primary)]" />
                                                            <span>{company.company_number}</span>
                                                        </div>
                                                    )}
                                                    {company.company_address && (
                                                        <div className="flex items-center space-x-1">
                                                            <MapPin className="w-4 h-4 text-[var(--color-primary)]" />
                                                            <span className="truncate max-w-md">{company.company_address}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Preview Section */}
                                                <div className="space-y-2 pl-7">
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                        <PreviewItem
                                                            content={company.company_logo}
                                                            title="Company Logo"
                                                            isText={false}
                                                            companyName={company.company_name}
                                                            onPreview={handlePreview}
                                                        />
                                                        <PreviewItem
                                                            content={company.authorized_signatory}
                                                            title="Authorized Signature"
                                                            isText={false}
                                                            companyName={company.company_name}
                                                            onPreview={handlePreview}
                                                        />
                                                        <PreviewItem
                                                            content={company.salary_slip_policy}
                                                            title="Salary Slip Policy"
                                                            isText={true}
                                                            companyName={company.company_name}
                                                            onPreview={handlePreview}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center space-x-2">
                                                {/* Right side - Actions */}
                                                {permissions['company_edit'] && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleEditCompany(company);
                                                        }}
                                                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 hover:scale-110 hover:shadow-md transition-all duration-200"
                                                        title="Company Edit"
                                                    >
                                                        <Edit className="w-4 h-4" strokeWidth={2.5} />
                                                    </button>
                                                )}

                                                {/* Right side - Actions */}
                                                {permissions['company_delete'] && (
                                                    <button
                                                        onClick={() => handleDeleteClick(company)}
                                                        disabled={isDeleting}
                                                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-100 hover:scale-110 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                                        title="Delete company"
                                                    >
                                                        <Trash2 className="w-4 h-4" strokeWidth={2.5} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Confirm Delete Modal */}
                <ConfirmDialog
                    isOpen={confirmModal.isOpen && confirmModal.type === 'delete'}
                    onClose={closeModal}
                    onConfirm={confirmDeleteCompany}
                    title="Delete Company"
                    message={`Are you sure you want to delete "${confirmModal.data?.company_name || 'this Company'}"? This action cannot be undone.`}
                    confirmText="Delete"
                    cancelText="Cancel"
                    type="danger"
                />
            </div>
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </>
    );
};

export default CompanyList;
