import { useState } from "react";
import CompanyList from "./CompanyList";
import useCompanies from "../../hooks/useCompanies";
import { useSelector } from 'react-redux';
import { Toast } from '../ui/Toast';
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from 'lucide-react';

const Company = () => {
    const {
        companies,
        loading,
        deleteCompany,
    } = useCompanies();
    
    const navigate = useNavigate();
    const [toast, setToast] = useState(null);
    
    const showToast = (message, type) => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 5000);
    };
    
    const permissions = useSelector(state => state.permissions) || {};

    const handleDeleteCompany = async (id) => {
        const result = await deleteCompany(id);
        return result;
    };

    return (
        <div className="h-full bg-[var(--color-bg-primary)]">
            <div className="mx-auto h-full flex flex-col">


                {/* Main Content */}
                <div className="flex-1 min-h-0">
                    {permissions['company_view'] && (
                        <CompanyList
                            companies={companies}
                            onDelete={handleDeleteCompany}
                            loading={loading}
                            showToast={showToast}
                        />
                    )}
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

export default Company;