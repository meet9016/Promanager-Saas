import { useEffect, useState } from "react";
import api from "../api/axiosInstance";
import useUserId from "./useUserId";

const useDesignations = () => {
    const [designations, setDesignations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const user_id = useUserId();

    const fetchDesignations = async () => {
        if (!user_id) return;

        setLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('user_id', user_id);

            const res = await api.post("/designation_list", formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });

            const designationData = res.data.data || res.data || [];
            setDesignations(Array.isArray(designationData) ? designationData : []);
        } catch (err) {
            console.error("Error fetching designations:", err);
            setError("Failed to fetch designations");
            setDesignations([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user_id) {
            fetchDesignations();
        }
    }, [user_id]);

    const addDesignation = async (name) => {
        if (!name.trim()) return { success: false, message: "Designation name is required" };

        try {
            const formData = new FormData();
            formData.append('name', name.trim());
            formData.append('user_id', user_id);

            const res = await api.post("/designation_create", formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });

            // Check if the API response indicates success or failure
            if (res.data && res.data.success === false) {
                // API returned success: false - handle the error
                const errorMessage = res.data.message || "Failed to add designation";
                setError(errorMessage);
                return { success: false, message: errorMessage };
            }

            // Check for other possible error indicators in the response
            if (res.data && res.data.error) {
                const errorMessage = res.data.error;
                setError(errorMessage);
                return { success: false, message: errorMessage };
            }

            // If we get here, assume success and refresh the designations list
            await fetchDesignations();
            return { success: true };
        } catch (err) {
            console.error("Error adding designation:", err);

            // Handle different types of errors
            let errorMessage = "Failed to add designation";

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

    const deleteDesignation = async (id) => {
        if (!id) {
            return { success: false, error: "No ID provided" };
        }

        try {
            const formData = new FormData();
            formData.append('id', id);
            formData.append('user_id', user_id);
            formData.append('designation_id', id);

            const res = await api.post("/designation_delete", formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });

            if (res.data && res.data.success === false) {
                setError(`Delete failed: ${res.data.message}`);
                return { success: false, error: res.data.message };
            }

            await fetchDesignations();
            return { success: true };
        } catch (err) {
            console.error("Error deleting designation:", err);
            const errorMessage = err.response?.data?.message || err.message || "Unknown error";
            setError(`Failed to delete designation: ${errorMessage}`);
            return { success: false, error: errorMessage };
        }
    };

    return {
        designations,
        loading,
        error,
        addDesignation,
        deleteDesignation,
        refetchDesignations: fetchDesignations
    };
};

export default useDesignations;