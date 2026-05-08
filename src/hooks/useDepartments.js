import { useEffect, useState } from "react";
import api from "../api/axiosInstance";
import useUserId from "./useUserId";

const FORMULA_KEYS = [
    "name",
    "ot_formula", "overtime",
    "late_coming", "early_going",
    "half_day_work_formula", "half_day_work_min",
    "absent_formula", "absent_min",
    "par_half_day_work_formula", "par_half_day_work_min",
    "par_absent_formula", "par_absent_min",
];

const useDepartments = () => {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const user_id = useUserId();

    const fetchDepartments = async () => {
        if (!user_id) return;
        setLoading(true);
        setError(null);
        try {
            const formData = new FormData();
            formData.append("user_id", user_id);
            const res = await api.post("/department_list", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            const departmentData = res.data.data || res.data || [];
            setDepartments(Array.isArray(departmentData) ? departmentData : []);
        } catch (err) {
            console.error("Error fetching departments:", err);
            setError("Failed to fetch departments");
            setDepartments([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user_id) fetchDepartments();
    }, [user_id]);

    // ── Shared helper ─────────────────────────────────────────────────────────
    const buildFormData = (payload, departmentId = null) => {
        const formData = new FormData();
        formData.append("user_id", user_id);
        // Only pass department_id when editing an existing department
        if (departmentId) {
            formData.append("department_id", departmentId);
        }
        FORMULA_KEYS.forEach((key) => {
            formData.append(key, payload[key] !== undefined ? payload[key] : "0");
        });
        return formData;
    };

    // ── addDepartment — NO department_id ──────────────────────────────────────
    const addDepartment = async (payload) => {
        const name = typeof payload === "string" ? payload : payload?.name;
        if (!name?.trim()) return { success: false, message: "Department name is required" };

        try {
            // buildFormData without departmentId = no department_id in request
            const formData = typeof payload === "object"
                ? buildFormData(payload)
                : (() => {
                    const fd = new FormData();
                    fd.append("user_id", user_id);
                    fd.append("name", name.trim());
                    fd.append("ot_formula", "1");
                    fd.append("overtime", "0");
                    fd.append("late_coming", "15");
                    fd.append("early_going", "15");
                    fd.append("half_day_work_formula", "1");
                    fd.append("half_day_work_min", "0");
                    fd.append("absent_formula", "1");
                    fd.append("absent_min", "0");
                    fd.append("par_half_day_work_formula", "1");
                    fd.append("par_half_day_work_min", "0");
                    fd.append("par_absent_formula", "1");
                    fd.append("par_absent_min", "0");
                    return fd;
                })();

            const res = await api.post("/department_create", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            if (res.data?.success === false) {
                const msg = res.data.message || "Failed to add department";
                setError(msg);
                return { success: false, message: msg };
            }
            if (res.data?.error) {
                setError(res.data.error);
                return { success: false, message: res.data.error };
            }

            await fetchDepartments();
            return { success: true };
        } catch (err) {
            console.error("Error adding department:", err);
            const msg =
                err.response?.data?.message ||
                err.response?.data?.error ||
                err.message ||
                "Failed to add department";
            setError(msg);
            return { success: false, message: msg };
        }
    };

    // ── updateDepartment — passes department_id ───────────────────────────────
    const updateDepartment = async (data) => {
        if (!data?.name?.trim()) return { success: false, message: "Department name is required" };

        const departmentId = data.department_id || data.id;
        if (!departmentId) return { success: false, message: "Department ID is required for update" };

        try {
            // buildFormData WITH departmentId — sends department_id in request
            const formData = buildFormData(data, departmentId);

            const res = await api.post("/department_create", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            if (res.data?.success === false) {
                const msg = res.data.message || "Failed to update department";
                setError(msg);
                return { success: false, message: msg };
            }
            if (res.data?.error) {
                setError(res.data.error);
                return { success: false, message: res.data.error };
            }

            await fetchDepartments();
            return { success: true };
        } catch (err) {
            console.error("Error updating department:", err);
            const msg =
                err.response?.data?.message ||
                err.response?.data?.error ||
                err.message ||
                "Failed to update department";
            setError(msg);
            return { success: false, message: msg };
        }
    };


    // ── Deelete — passes department_id ───────────────────────────────
    const deleteDepartment = async (id) => {

        if (!id) return { success: false, message: "Department ID is required for update" };

        try {
            // buildFormData WITH departmentId — sends department_id in request
            const formData = new FormData();

            formData.append("user_id", user_id);
            formData.append("department_id", id);

            const res = await api.post("/department_delete", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            if (res.data?.success === false) {
                const msg = res.data.message || "Failed to Delete department";
                setError(msg);
                return { success: false, message: msg };
            }
            if (res.data?.error) {
                setError(res.data.error);
                return { success: false, message: res.data.error };
            }

            await fetchDepartments();
            return { success: true };
        } catch (err) {
            console.error("Error deleting department:", err);
            const msg =
                err.response?.data?.message ||
                err.response?.data?.error ||
                err.message ||
                "Failed to delete department";
            setError(msg);
            return { success: false, message: msg };
        }
    };

    return {
        departments,
        loading,
        error,
        addDepartment,
        updateDepartment,
        deleteDepartment,
        refetchDepartments: fetchDepartments,
    };
};

export default useDepartments;