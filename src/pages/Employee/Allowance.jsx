import React from "react";
import Allowance from "../../Components/Allowance";

const AllowancePage = () => {
    return (
        <div className="h-[calc(100vh-64px)] bg-[var(--color-bg-primary)] p-8 overflow-hidden">
            <Allowance />
        </div>
    );
};

export default AllowancePage;