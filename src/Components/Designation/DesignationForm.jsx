import React, { useState } from "react";
import { Plus } from "lucide-react";
import CustomInput from "../comman/CustomInput";

const DesignationForm = ({ onSubmit, loading = false, showToast }) => {
    const [name, setName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!name.trim()) {
            showToast("Please enter a designation name", "error");
            return;
        }

        setIsSubmitting(true);

        try {
            const result = await onSubmit(name.trim());

            if (result && (result.success === true || result.status === true || result.status === 1)) {
                // Success case
                setName("");
                const successMessage = result.message || "Designation added successfully!";
                showToast(successMessage, "success");
            } else {
                // success: false case - show the specific error message
                const errorMessage = result?.message || result?.error || "Failed to add designation. Please try again.";
                showToast(errorMessage, "error");
            }
        } catch (error) {
            console.error("Error adding designation:", error);
            const errorMessage = error?.response?.data?.message || error?.response?.data?.error || error?.message || "An error occurred while adding the designation.";
            showToast(errorMessage, "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-[var(--color-bg-secondary)] rounded-xl shadow-sm border border-[var(--color-primary-dark)] overflow-hidden">
            <div className="p-6 bg-[var(--color-bg-secondary)]">
                <div className="flex w-full flex-row items-center justify-between ">
                    <div className="space-y-2" >
                        <label htmlFor="designationName" className=" text-sm font-medium text-[var(--color-text-secondary)] mb-2 ">
                            Add New Designation <span className="text-[var(--color-error)]">*</span>
                        </label>
                        <div className="w-[500px]">
                            <CustomInput
                                type="text"
                                name="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                // onBlur={handleFieldBlur}
                                placeholder="Enter designation name"
                                required
                                clearable={true}
                                maxLength={50}
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || loading || !name.trim()}
                        className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-[var(--color-primary-dark)] text-[var(--color-text-white)] font-medium rounded-lg hover:bg-[var(--color-primary-darker)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[var(--color-border-primary)] mr-2"></div>
                                Adding...
                            </>
                        ) : (
                            <>
                                <Plus className="w-4 h-4 mr-2" />
                                Add Designation
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DesignationForm;