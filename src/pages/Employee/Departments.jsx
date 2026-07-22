import React from "react";
import Department from "../../Components/Department";

const DepartmentsPage = () => {
    return (
        <div className="h-[calc(100vh-64px)] bg-[var(--color-bg-primary)] p-6 lg:p-8 flex flex-col">
            <Department />
        </div>
    );
};

export default DepartmentsPage;
