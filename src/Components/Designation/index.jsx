import { useState } from "react";
import DesignationList from "./DesignationList";
import useDesignations from "../../hooks/useDesignations";
import { useSelector } from 'react-redux';
import { Toast } from '../ui/Toast';
import { useNavigate } from "react-router-dom";

const Designation = () => {
    const {
        designations,
        loading,
        // addDesignation,
        deleteDesignation,
    } = useDesignations();
    const [toast, setToast] = useState(null);

    const showToast = (message, type) => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 5000);
    };
    const permissions = useSelector(state => state.permissions) || {};

    const handleDeleteDesignation = async (id) => {
        const result = await deleteDesignation(id);
        return result;
    };

    return (
        <div className="h-screen bg-[var(--color-bg-primary)] overflow-hidden">
            <div className=" mx-auto">


                {/* Main Content */}
                <div className="space-y-8">
                    {permissions['designation_view'] &&
                        <DesignationList
                            designations={designations}
                            onDelete={handleDeleteDesignation}
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

export default Designation;