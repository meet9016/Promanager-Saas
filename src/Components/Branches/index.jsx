import { useState } from "react";
import BranchList from "./BranchList";
import useBranches from "../../hooks/useBranches";
import { useSelector } from 'react-redux';
import { Toast } from '../ui/Toast';
import { useNavigate } from "react-router-dom";

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

    const handleDeleteBranch = async (id) => {
        const result = await deleteBranch(id);
        return result;
    };

    return (
        <div className="h-screen bg-[var(--color-bg-primary)] overflow-hidden">
            <div className="h-full mx-auto">

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