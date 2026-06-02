import React from "react";
import Increment from "../../Components/Increment";

const IncrementPage = () => {
    return (
        <div className="h-[calc(100vh-64px)] bg-[var(--color-bg-primary)] p-8">
            <Increment />
        </div>
    );
};

export default IncrementPage;