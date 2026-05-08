import { useEffect, useState } from "react";
import api from "../api/axiosInstance";
import useUserId from "./useUserId";

const useDeductions = () => {
    const [deductions, setDeductions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const user_id = useUserId();

    const fetchDeductions = async (page = 1) => {
        if (!user_id) return;

        setLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('page', page);
            formData.append('user_id', user_id);

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
            formData.append('user_id', user_id);

            const res = await api.post("/deduction_create", formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });

            // Check if the API response indicates success or failure
            if (res.data && res.data.success === false) {
                // API returned success: false - handle the error
                const errorMessage = res.data.message || "Failed to add deduction";
                setError(errorMessage);
                return { success: false, message: errorMessage };
            }

            // Check for other possible error indicators in the response
            if (res.data && res.data.error) {
                const errorMessage = res.data.error;
                setError(errorMessage);
                return { success: false, message: errorMessage };
            }

            // If we get here, assume success and refresh the deductions list
            await fetchDeductions();
            return { success: true };
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
            return { success: false, error: "No ID provided" };
        }

        try {
            const formData = new FormData();
            formData.append('deduction_id', id);
            formData.append('user_id', user_id);

            const res = await api.post("/deduction_delete", formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });

            if (res.data && res.data.success === false) {
                setError(`Delete failed: ${res.data.message}`);
                return { success: false, error: res.data.message };
            }

            await fetchDeductions();
            return { success: true };
        } catch (err) {
            console.error("Error deleting deduction:", err);
            const errorMessage = err.response?.data?.message || err.message || "Unknown error";
            setError(`Failed to delete deduction: ${errorMessage}`);
            return { success: false, error: errorMessage };
        }
    };

    return {
        deductions,
        loading,
        error,
        addDeduction,
        deleteDeduction,
        refetchDeductions: fetchDeductions
    };
};

export default useDeductions;