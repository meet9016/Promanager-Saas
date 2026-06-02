import React from "react";
import Branches from "../../Components/Branches";

const BranchesPage = () => {
    return (
        <div className="h-[calc(100vh-64px)] p-8 bg-[var(--color-bg-primary)] py-8">
            <Branches />
        </div>
    );
};

export default BranchesPage;
