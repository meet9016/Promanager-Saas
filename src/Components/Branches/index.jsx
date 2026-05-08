import { useState } from "react";
import BranchForm from "./BranchForm";
import BranchList from "./BranchList";
import useBranches from "../../hooks/useBranches";
import { useSelector } from 'react-redux';
import { Toast } from '../ui/Toast';
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from 'lucide-react';

const Branch = () => {
    const {
        branches,
        loading,
        // addBranch,
        deleteBranch,
    } = useBranches();
    const navigate = useNavigate();
    const [toast, setToast] = useState(null);

    const showToast = (message, type) => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 5000);
    };
    const permissions = useSelector(state => state.permissions) || {};

    // const handleAddBranch = async (name) => {
    //     const result = await addBranch(name);
    //     return result;
    // };

    const handleDeleteBranch = async (id) => {
        const result = await deleteBranch(id);
        return result;
    };

    return (
        <div className="min-h-screen bg-[var(--color-bg-primary)]">
            <div className=" mx-auto  ">
                <div className="bg-[var(--color-bg-secondary)] rounded-2xl shadow-xl mb-8 overflow-hidden">
                    <div className="bg-gradient-to-r from-[var(--color-primary-dark)] to-[var(--color-primary-darker)] p-8">
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
                                        Branch Management
                                    </h1>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="space-y-8">
                    {permissions['branch_view'] &&
                        <BranchList
                            branches={branches}
                            onDelete={handleDeleteBranch}
                            loading={loading}
                            showToast={showToast}
                        />
                    }
                </div>

                {/* Toast Notification */}
                {toast && (
                    <Toast
                        message={toast.message}
                        type={toast.type}
                        onClose={() => setToast(null)}
                    />
                )}
            </div>
        </div>
    );
};

export default Branch;