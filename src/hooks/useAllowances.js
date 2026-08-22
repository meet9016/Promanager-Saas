import { useEffect, useState } from "react";
import api from "../api/axiosInstance";
import useUserId from "./useUserId";

const useAllowances = () => {
    const [allowances, setAllowances] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const user_id = useUserId();

    const fetchAllowances = async (page = 1) => {
        if (!user_id) return;

        setLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('page', page);

            const res = await api.post("/allowance_list", formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });

            const allowanceData = res.data.data || res.data || [];
            setAllowances(Array.isArray(allowanceData) ? allowanceData : []);
        } catch (err) {
            console.error("Error fetching allowances:", err);
            setError("Failed to fetch allowances");
            setAllowances([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user_id) {
            fetchAllowances();
        }
    }, [user_id]);

    const addAllowance = async (name) => {
        if (!name.trim()) return { success: false, message: "Allowance name is required" };

        try {
            const formData = new FormData();
            formData.append('name', name.trim());

            const res = await api.post("/allowance_create", formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });

            // Check if the API response indicates success or failure
            if (res.data && (res.data.success === false || res.data.status === false || res.data.status === 0 || res.data.status === "0")) {
                const errorMessage = res.data.message || res.data.error || "Failed to add allowance";
                setError(errorMessage);
                return { success: false, message: errorMessage };
            }

            if (res.data && res.data.error) {
                const errorMessage = typeof res.data.error === 'string' ? res.data.error : (res.data.message || "Failed to add allowance");
                setError(errorMessage);
                return { success: false, message: errorMessage };
            }

            // If we get here, assume success and refresh the allowances list
            await fetchAllowances();
            const successMessage = res.data?.message || "Allowance added successfully!";
            return { success: true, message: successMessage };
        } catch (err) {
            console.error("Error adding allowance:", err);

            // Handle different types of errors
            let errorMessage = "Failed to add allowance";

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

    const deleteAllowance = async (id) => {
        if (!id) {
            return { success: false, message: "No ID provided", error: "No ID provided" };
        }

        try {
            const formData = new FormData();
            formData.append('allowance_id', id);

            const res = await api.post("/allowance_delete", formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });

            if (res.data && (res.data.success === false || res.data.status === false || res.data.status === 0 || res.data.status === "0")) {
                const errorMessage = res.data.message || res.data.error || "Failed to delete allowance";
                setError(`Delete failed: ${errorMessage}`);
                return { success: false, message: errorMessage, error: errorMessage };
            }

            if (res.data && res.data.error) {
                const errorMessage = typeof res.data.error === 'string' ? res.data.error : (res.data.message || "Failed to delete allowance");
                setError(`Delete failed: ${errorMessage}`);
                return { success: false, message: errorMessage, error: errorMessage };
            }

            await fetchAllowances();
            const successMessage = res.data?.message || "Allowance deleted successfully!";
            return { success: true, message: successMessage };
        } catch (err) {
            console.error("Error deleting allowance:", err);
            const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || "Unknown error";
            setError(`Failed to delete allowance: ${errorMessage}`);
            return { success: false, message: errorMessage, error: errorMessage };
        }
    };

    return {
        allowances,
        loading,
        error,
        addAllowance,
        deleteAllowance,
        refetchAllowances: fetchAllowances
    };
};

export default useAllowances;