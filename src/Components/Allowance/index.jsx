import { useState } from "react";
import AllowanceList from "./AllowanceList";
import useAllowances from "../../hooks/useAllowances";
import { useSelector } from 'react-redux';
import { Toast } from '../ui/Toast';
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from 'lucide-react';

const Allowance = () => {
    const {
        allowances,
        loading,
        deleteAllowance,
    } = useAllowances();
    const navigate = useNavigate();
    const [toast, setToast] = useState(null);

    const showToast = (message, type) => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 5000);
    };
    const permissions = useSelector(state => state.permissions) || {};

    const handleDeleteAllowance = async (id) => {
        const result = await deleteAllowance(id);
        return result;
    };

    return (
        <div className="h-screen bg-[var(--color-bg-primary)] overflow-hidden">
            <div className=" mx-auto  ">

                {/* Main Content */}
                <div className="space-y-8">
                    {permissions['allowance_view'] &&
                        <AllowanceList
                            allowances={allowances}
                            onDelete={handleDeleteAllowance}
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

export default Allowance;