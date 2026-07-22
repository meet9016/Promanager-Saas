import React from "react";
import Company from "../../Components/Company";

const CompaniesPage = () => {
    return (
        <div className="h-[calc(100vh-64px)] bg-[var(--color-bg-primary)] p-6 md:p-8">
            <Company />
        </div>
    );
};

export default CompaniesPage;