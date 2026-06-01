import { useState } from "react";
import DeductionList from "./DeductionList";
import useDeductions from "../../hooks/useDeductions";
import { useSelector } from 'react-redux';
import { Toast } from '../ui/Toast';
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from 'lucide-react';

const Deduction = () => {
    const {
        deductions,
        loading,
        deleteDeduction,
    } = useDeductions();
    const navigate = useNavigate();
    const [toast, setToast] = useState(null);

    const showToast = (message, type) => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 5000);
    };
    const permissions = useSelector(state => state.permissions) || {};

    const handleDeleteDeduction = async (id) => {
        const result = await deleteDeduction(id);
        return result;
    };

    return (
        <div className="h-full bg-[var(--color-bg-primary)]">
            <div className=" mx-auto  ">


                {/* Main Content */}
                <div className="space-y-8">
                    {permissions['deduction_view'] &&
                        <DeductionList
                            deductions={deductions}
                            onDelete={handleDeleteDeduction}
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

export default Deduction;