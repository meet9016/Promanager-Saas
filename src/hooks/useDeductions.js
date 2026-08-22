import { useEffect, useState } from "react";
import api from "../api/axiosInstance";
import useUserId from "./useUserId";

const useDeductions = () => {
    const [deductions, setDeductions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [initialLoad, setInitialLoad] = useState(true);
    const [error, setError] = useState(null);
    const user_id = useUserId();

    const fetchDeductions = async (page = 1) => {
        if (!user_id) return;

        setLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('page', page);

            const res = await api.post("/deduction_list", formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });

            const deductionData = res.data.data || res.data || [];
            setDeductions(Array.isArray(deductionData) ? deductionData : []);
        } catch (err) {
            console.error("Error fetching deductions:", err);
            setError("Failed to fetch deductions");
            setDeductions([]);
        } finally {
            setLoading(false);
            setInitialLoad(false);
        }
    };

    useEffect(() => {
        if (user_id) {
            fetchDeductions();
        }
    }, [user_id]);

    const addDeduction = async (name) => {
        if (!name.trim()) return { success: false, message: "Deduction name is required" };

        try {
            const formData = new FormData();
            formData.append('name', name.trim());

            const res = await api.post("/deduction_create", formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });

            // Check if the API response indicates success or failure
            if (res.data && (res.data.success === false || res.data.status === false || res.data.status === 0 || res.data.status === "0")) {
                const errorMessage = res.data.message || res.data.error || "Failed to add deduction";
                setError(errorMessage);
                return { success: false, message: errorMessage };
            }

            if (res.data && res.data.error) {
                const errorMessage = typeof res.data.error === 'string' ? res.data.error : (res.data.message || "Failed to add deduction");
                setError(errorMessage);
                return { success: false, message: errorMessage };
            }

            // If we get here, assume success and refresh the deductions list
            await fetchDeductions();
            const successMessage = res.data?.message || "Deduction added successfully!";
            return { success: true, message: successMessage };
        } catch (err) {
            console.error("Error adding deduction:", err);

            // Handle different types of errors
            let errorMessage = "Failed to add deduction";

            if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err.response?.data?.error) {
                errorMessage = err.response.data.error;
            } else if (err.message) {
                errorMessage = err.message;
            }

            setError(errorMessage);
            return { success: false, message: errorMessage };
        }
    };

    const deleteDeduction = async (id) => {
        if (!id) {
            return { success: false, message: "No ID provided", error: "No ID provided" };
        }

        try {
            const formData = new FormData();
            formData.append('deduction_id', id);

            const res = await api.post("/deduction_delete", formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });

            if (res.data && (res.data.success === false || res.data.status === false || res.data.status === 0 || res.data.status === "0")) {
                const errorMessage = res.data.message || res.data.error || "Failed to delete deduction";
                setError(`Delete failed: ${errorMessage}`);
                return { success: false, message: errorMessage, error: errorMessage };
            }

            if (res.data && res.data.error) {
                const errorMessage = typeof res.data.error === 'string' ? res.data.error : (res.data.message || "Failed to delete deduction");
                setError(`Delete failed: ${errorMessage}`);
                return { success: false, message: errorMessage, error: errorMessage };
            }

            await fetchDeductions();
            const successMessage = res.data?.message || "Deduction deleted successfully!";
            return { success: true, message: successMessage };
        } catch (err) {
            console.error("Error deleting deduction:", err);
            const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || "Unknown error";
            setError(`Failed to delete deduction: ${errorMessage}`);
            return { success: false, message: errorMessage, error: errorMessage };
        }
    };

    return {
        deductions,
        loading,
        initialLoad,
        error,
        addDeduction,
        deleteDeduction,
        refetchDeductions: fetchDeductions
    };
};

export default useDeductions;