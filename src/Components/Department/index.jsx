import { useState } from "react";
import DepartmentList from "./DepartmentList";
import useDepartments from "../../hooks/useDepartments";
import { useSelector } from 'react-redux';
import { Toast } from '../ui/Toast';
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from 'lucide-react';

const Department = () => {
    const {
        departments,
        loading,
        // addDepartment,
        // deleteDepartment,
    } = useDepartments();
    const navigate = useNavigate();
    const [toast, setToast] = useState(null);

    const showToast = (message, type) => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 5000);
    };
    const permissions = useSelector(state => state.permissions) || {};

    // const handleAddDepartment = async (name) => {
    //     const result = await addDepartment(name);
    //     return result;
    // };


    return (
        <div className="h-full overflow-hidden bg-[var(--color-bg-primary)]">
            <div className=" mx-auto">


                {/* Main Content */}
                <div className="space-y-8">
                    {permissions['department_view'] &&
                       <DepartmentList
                            departments={departments}
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

export default Department;