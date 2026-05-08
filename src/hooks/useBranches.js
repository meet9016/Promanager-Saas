import { useEffect, useState } from "react";
import api from "../api/axiosInstance";
import useUserId from "./useUserId";

const useBranches = () => {
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [editingBranch, setEditingBranch] = useState(null);
    const user_id = useUserId();

    const fetchBranches = async () => {
        if (!user_id) return;

        setLoading(true);
        setError(null);

        try {
            const formData = new FormData();

            const res = await api.post("/branch_list", formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });

            const branchData = res.data.data || res.data || [];
            setBranches(Array.isArray(branchData) ? branchData : []);
        } catch (err) {
            console.error("Error fetching branches:", err);
            setError("Failed to fetch branches");
            setBranches([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user_id) {
            fetchBranches();
        }
    }, [user_id]);

    const addBranch = async (name, branch_id = null) => {
        if (!name.trim()) return { success: false, message: "Branch name is required" };

        try {
            const formData = new FormData();
            formData.append('name', name.trim());
            {branch_id && formData.append('branch_id', branch_id);}


            const res = await api.post("/branch_create", formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });

            // Check if the API response indicates success or failure
            if (res.data && res.data.success === false) {
                // API returned success: false - handle the error
                const errorMessage = res.data.message || "Failed to add branch";
                setError(errorMessage);
                return { success: false, message: errorMessage };
                
            }

            // Check for other possible error indicators in the response
            if (res.data && res.data.error) {
                const errorMessage = res.data.error;
                setError(errorMessage);
                return { success: false, message: errorMessage };

            }

            // If we get here, assume success and refresh the branches list
            await fetchBranches();
            return { success: true };
        } catch (err) {
            console.error("Error adding branch:", err);

            // Handle different types of errors
            let errorMessage = "Failed to add branch";

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



    const deleteBranch = async (id) => {
        if (!id) {
            return { success: false, error: "No ID provided" };
        }

        try {
            const formData = new FormData();
            formData.append('id', id);
            formData.append('branch_id', id);

            const res = await api.post("/branch_delete", formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });

            if (res.data && res.data.success === false) {
                setError(`Delete failed: ${res.data.message}`);
                return { success: false, error: res.data.message };
            }

            await fetchBranches();
            return { success: true };
        } catch (err) {
            console.error("Error deleting branch:", err);
            const errorMessage = err.response?.data?.message || err.message || "Unknown error";
            setError(`Failed to delete branch: ${errorMessage}`);
            return { success: false, error: errorMessage };
        }
    };

    return {
        branches,
        loading,
        error,
        addBranch,
        deleteBranch,
        refetchBranches: fetchBranches
    };
};

export default useBranches;