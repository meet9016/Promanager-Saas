import React, { useState, useEffect } from "react";
import { Plus, Building2, Upload, X, Eye, Trash2 } from "lucide-react";

const CompanyForm = ({ onSubmit, loading = false, showToast, editData }) => {
    const [formData, setFormData] = useState({
        company_name: "",
        company_number: "",
        company_address: "",
        salary_slip_policy: "",
        authorized_signatory: null,
        company_logo: null
    });

    const [deleteFlags, setDeleteFlags] = useState({
        company_logo_delete: 0,
        signature_delete: 0
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    // File Previews State (matching SettingsComponent structure)
    const [filePreviews, setFilePreviews] = useState({
        company_logo: null,
        authorized_signatory: null
    });

    // Preview Modal State (matching SettingsComponent)
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [previewImage, setPreviewImage] = useState('');
    const [previewTitle, setPreviewTitle] = useState('');

    useEffect(() => {
        if (editData) {
            setFormData({
                company_name: editData.company_name || "",
                company_number: editData.company_number || "",
                company_address: editData.company_address || "",
                salary_slip_policy: editData.salary_slip_policy || "",
                authorized_signatory: null,
                company_logo: null
            });

            setFilePreviews({
                company_logo: editData.company_logo || null,
                authorized_signatory: editData.authorized_signatory || null
            });

            setDeleteFlags({
                company_logo_delete: 0,
                signature_delete: 0
            });
        }
    }, [editData]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Enhanced file handling (copied from SettingsComponent)
    const handleFileChange = (field, file) => {
        if (file) {
            // File size validation (5MB limit)
            if (file.size > 5 * 1024 * 1024) {
                showToast('File size should not exceed 5MB', 'error');
                return;
            }

            // File type validation
            if (!file.type.startsWith('image/')) {
                showToast('Please select a valid image file', 'error');
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, [field]: file }));
                setFilePreviews(prev => ({ ...prev, [field]: reader.result }));

                setDeleteFlags(prev => ({
                    ...prev,
                    ...(field === "company_logo" && { company_logo_delete: 0 }),
                    ...(field === "authorized_signatory" && { signature_delete: 0 })
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleFileDelete = (field) => {
        setFormData(prev => ({ ...prev, [field]: null }));
        setFilePreviews(prev => ({ ...prev, [field]: null }));

        setDeleteFlags(prev => ({
            ...prev,
            ...(field === "company_logo" && { company_logo_delete: 1 }),
            ...(field === "authorized_signatory" && { signature_delete: 1 })
        }));
    };

    const handleImagePreview = (imageSrc, title = "Document Preview") => {
        if (imageSrc) {
            setPreviewImage(imageSrc);
            setPreviewTitle(title);
            setShowPreviewModal(true);
        }
    };

    const closePreviewModal = () => {
        setShowPreviewModal(false);
        setPreviewImage('');
        setPreviewTitle('');
    };

    // Enhanced Image Upload Component (copied from SettingsComponent)
    const ImageUploadField = ({ field, label, preview }) => {
        const fieldId = `upload_${field}`;

        return (
            <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">{label}</label>
                <div className="relative">
                    {!preview ? (
                        /* Upload Button when no file */
                        <label
                            htmlFor={fieldId}
                            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[var(--color-border-secondary)] rounded-xl cursor-pointer bg-[var(--color-bg-gray-light)] hover:bg-[var(--color-bg-hover)] transition-all duration-300"
                        >
                            <div className="flex flex-col items-center justify-center pt-3 pb-3">
                                <div className="w-10 h-10 mb-2 bg-[var(--color-primary)] rounded-full flex items-center justify-center">
                                    <Upload className="w-5 h-5 text-[var(--color-text-white)]" />
                                </div>
                                <p className="mb-1 text-base font-medium text-[var(--color-text-primary)]">Upload {label}</p>
                                <p className="text-xs text-[var(--color-text-muted)]">PNG, JPG up to 5MB</p>
                            </div>
                            <input
                                id={fieldId}
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileChange(field, e.target.files[0])}
                                className="hidden"
                                disabled={isSubmitting || loading}
                            />
                        </label>
                    ) : (
                        /* Preview when file is uploaded */
                        <div className="relative w-full h-32 border-2 border-dashed border-[var(--color-border-secondary)] rounded-xl bg-[var(--color-bg-gray-light)] overflow-hidden">
                            <div className="relative w-full h-full group">
                                <img
                                    src={preview}
                                    alt={`${label} Preview`}
                                    className="w-full h-full object-contain group-hover:opacity-75 transition-opacity duration-200"
                                    onError={(e) => {
                                        console.error('Image failed to load:', preview);
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                    }}
                                />
                                {/* Fallback for broken images */}
                                <div
                                    className="w-full h-full bg-[var(--color-bg-hover)] flex items-center justify-center text-[var(--color-text-muted)] text-sm"
                                    style={{ display: 'none' }}
                                >
                                    Image Error
                                </div>

                                {/* Overlay with buttons */}
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center space-x-3 opacity-0 group-hover:opacity-100">
                                    {/* Preview button */}
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleImagePreview(preview, label);
                                        }}
                                        className="bg-[var(--color-bg-secondary)] bg-opacity-90 hover:bg-opacity-100 text-[var(--color-text-primary)] rounded-full w-10 h-10 flex items-center justify-center shadow-lg transition-all duration-200"
                                        title="Preview image"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </button>

                                    {/* Delete button */}
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleFileDelete(field);
                                        }}
                                        className="bg-[var(--color-error)] hover:bg-[var(--color-error-dark)] text-[var(--color-text-white)] rounded-full w-10 h-10 flex items-center justify-center shadow-lg transition-all duration-200"
                                        title="Remove image"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // Preview Modal Component (copied from SettingsComponent)
    const PreviewModal = () => {
        if (!showPreviewModal || !previewImage) return null;

        return (
            <div
                className="fixed inset-0 bg-[var(--color-modal-overlay)] backdrop-blur-sm flex items-center justify-center z-50"
                onClick={closePreviewModal}
            >
                <div className="relative bg-[var(--color-modal-bg)] rounded-2xl shadow-2xl max-w-2xl max-h-[85vh] m-4 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-[var(--color-border-divider)] bg-[var(--color-primary-lightest)]">
                        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] flex items-center">
                            <Eye className="w-5 h-5 mr-2 text-[var(--color-primary)]" />
                            {previewTitle}
                        </h3>
                        <button
                            onClick={closePreviewModal}
                            className="p-2 hover:bg-[var(--color-bg-hover)] rounded-full transition-all duration-200 group"
                            title="Close preview"
                        >
                            <X className="w-5 h-5 text-[var(--color-text-muted)] group-hover:text-[var(--color-text-primary)] group-hover:rotate-90 transition-all duration-200" />
                        </button>
                    </div>

                    {/* Image Content */}
                    <div className="p-8 flex items-center justify-center bg-[var(--color-bg-gray-light)] min-h-[300px]">
                        <img
                            src={previewImage}
                            alt="Preview"
                            className="max-w-full max-h-[65vh] object-contain rounded-lg shadow-lg border border-[var(--color-border-secondary)]"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-2 bg-[var(--color-bg-gray-light)] border-t border-[var(--color-border-divider)]">
                        <p className="text-xs text-[var(--color-text-muted)] text-center">Click outside to close or use the × button</p>
                    </div>
                </div>
            </div>
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.company_name.trim()) {
            showToast("Please enter a company name", "error");
            return;
        }

        setIsSubmitting(true);

        try {
            const payload = {
                ...formData,
                ...(editData && { company_id: editData.company_id || editData.id }),
                ...(editData && deleteFlags)

            };

            const result = await onSubmit(payload);

            // Handle the response based on the success property
            if (result && Object.prototype.hasOwnProperty.call(result, 'success')) {
                if (result.success === true) {
                    // Success case - reset form
                    setFormData({
                        company_name: "",
                        company_number: "",
                        company_address: "",
                        salary_slip_policy: "",
                        authorized_signatory: null,
                        company_logo: null
                    });
                    setFilePreviews({
                        company_logo: null,
                        authorized_signatory: null
                    });
                    setDeleteFlags({
                        company_logo_delete: 0,
                        signature_delete: 0
                    });
                    showToast("Company added successfully!", "success");
                } else {
                    // success: false case - show the specific error message
                    const errorMessage = result.message || "Failed to add company. Please try again.";
                    showToast(errorMessage, "error");
                }
            } else {
                // Handle case where result doesn't have success property or is null/undefined
                showToast("Failed to add company. Please try again.", "error");
            }
        } catch (error) {
            // Handle network errors or other exceptions
            console.error("Error adding company:", error);
            showToast("An error occurred while adding the company.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            {/* Preview Modal */}
            <PreviewModal />

            <div className="bg-[var(--color-bg-secondary)] rounded-xl shadow-sm border border-[var(--color-primary-dark)] overflow-hidden">
                <div className="p-8 bg-[var(--color-bg-secondary)]">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="p-2 bg-[var(--color-primary-lighter)] rounded-lg">
                                <Building2 className="w-5 h-5 text-[var(--color-primary-dark)]" />
                            </div>
                            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                                {editData ? "Edit Company" : "Add New Company"}
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Company Name */}
                            <div>
                                <label htmlFor="company_name" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                    Company Name <span className="text-[var(--color-error)]">*</span>
                                </label>
                                <input
                                    id="company_name"
                                    name="company_name"
                                    type="text"
                                    placeholder="Enter company name"
                                    value={formData.company_name}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-[var(--color-border-secondary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] transition-all duration-200 placeholder-gray-400 bg-[var(--color-bg-secondary)]"
                                    disabled={isSubmitting || loading}
                                    required
                                />
                            </div>

                            {/* Company Number */}
                            <div>
                                <label htmlFor="company_number" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                    Company Number
                                </label>
                                <input
                                    id="company_number"
                                    name="company_number"
                                    type="text"
                                    placeholder="Enter company number"
                                    value={formData.company_number}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-[var(--color-border-secondary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] transition-all duration-200 placeholder-gray-400 bg-[var(--color-bg-secondary)]"
                                    disabled={isSubmitting || loading}
                                />
                            </div>

                            {/* Company Address */}
                            <div className="md:col-span-2">
                                <label htmlFor="company_address" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                    Company Address
                                </label>
                                <textarea
                                    id="company_address"
                                    name="company_address"
                                    placeholder="Enter company address"
                                    value={formData.company_address}
                                    onChange={handleInputChange}
                                    rows={3}
                                    className="w-full px-4 py-3 border border-[var(--color-border-secondary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] transition-all duration-200 placeholder-gray-400 bg-[var(--color-bg-secondary)] resize-vertical"
                                    disabled={isSubmitting || loading}
                                />
                            </div>

                            {/* Salary Slip Policy */}
                            <div className="md:col-span-2">
                                <label htmlFor="salary_slip_policy" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                    Salary Slip Policy
                                </label>
                                <textarea
                                    id="salary_slip_policy"
                                    name="salary_slip_policy"
                                    placeholder="Enter salary slip policy details"
                                    value={formData.salary_slip_policy}
                                    onChange={handleInputChange}
                                    rows={4}
                                    className="w-full px-4 py-3 border border-[var(--color-border-secondary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] transition-all duration-200 placeholder-gray-400 bg-[var(--color-bg-secondary)] resize-vertical"
                                    disabled={isSubmitting || loading}
                                />
                            </div>

                            {/* Enhanced File Uploads using SettingsComponent style */}
                            <ImageUploadField
                                field="company_logo"
                                label="Company Logo"
                                preview={filePreviews.company_logo}
                            />

                            <ImageUploadField
                                field="authorized_signatory"
                                label="Authorized Signatory"
                                preview={filePreviews.authorized_signatory}
                            />
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={isSubmitting || loading || !formData.company_name.trim()}
                                className="inline-flex items-center justify-center px-6 py-3 bg-[var(--color-primary-dark)] text-[var(--color-text-white)] font-medium rounded-lg hover:bg-[var(--color-primary-darker)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[var(--color-border-primary)] mr-2"></div>
                                        {editData ? "Updating..." : "Adding..."}
                                    </>
                                ) : (
                                    <>
                                        <Plus className="w-4 h-4 mr-2" />
                                        {editData ? "Update Company" : "Add Company"}
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};

export default CompanyForm;