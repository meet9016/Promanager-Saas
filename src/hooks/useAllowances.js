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
            formData.append('user_id', user_id);

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
            formData.append('user_id', user_id);

            const res = await api.post("/allowance_create", formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });

            // Check if the API response indicates success or failure
            if (res.data && res.data.success === false) {
                // API returned success: false - handle the error
                const errorMessage = res.data.message || "Failed to add allowance";
                setError(errorMessage);
                return { success: false, message: errorMessage };
            }

            // Check for other possible error indicators in the response
            if (res.data && res.data.error) {
                const errorMessage = res.data.error;
                setError(errorMessage);
                return { success: false, message: errorMessage };
            }

            // If we get here, assume success and refresh the allowances list
            await fetchAllowances();
            return { success: true };
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
            return { success: false, error: "No ID provided" };
        }

        try {
            const formData = new FormData();
            formData.append('allowance_id', id);
            formData.append('user_id', user_id);

            const res = await api.post("/allowance_delete", formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });

            if (res.data && res.data.success === false) {
                setError(`Delete failed: ${res.data.message}`);
                return { success: false, error: res.data.message };
            }

            await fetchAllowances();
            return { success: true };
        } catch (err) {
            console.error("Error deleting allowance:", err);
            const errorMessage = err.response?.data?.message || err.message || "Unknown error";
            setError(`Failed to delete allowance: ${errorMessage}`);
            return { success: false, error: errorMessage };
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