import React from "react";
import Deduction from "../../Components/Deduction";

const DeductionPage = () => {
    return (
        <div className="h-[calc(100vh-64px)] bg-[var(--color-bg-primary)] p-8 overflow-hidden">
            <Deduction />
        </div>
    );
};

export default DeductionPage;