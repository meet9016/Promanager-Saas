import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
} from 'react';
import api from '../api/axiosInstance';
import { Toast } from '../Components/ui/Toast';
import dayjs from 'dayjs';

const DashboardContext = createContext();
const today = dayjs().format('YYYY-MM-DD');
const currentYearMonth = dayjs().format('YYYY-MM');

export const DashboardProvider = ({ children, user, initialDate, initialYearMonth }) => {
    const [date, setDate] = useState(initialDate || today);
    const [yearMonth, setYearMonth] = useState(initialYearMonth || currentYearMonth);
    const [attendanceStatusId, setAttendanceStatusId] = useState(null); // New state for status filter
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'error') => setToast({ message, type });
    const handleToastClose = () => setToast(null);

    const fetchDashboardData = useCallback(async () => {
        if (!user?.user_id || !date || !yearMonth) return;

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('user_id', user.user_id);
            formData.append('date', date);
            formData.append('year_month', yearMonth);

            // Add attendance_status_id to the API call if it's set
            if (attendanceStatusId && attendanceStatusId !== 'all') {
                formData.append('attendance_status_id', attendanceStatusId);
            }

            const response = await api.post('dashboard', formData);

            if (response.data?.success && response.data.data) {
                setDashboardData(response.data.data);
            } else {
                throw new Error(response.data?.message || 'Failed to fetch dashboard data');
            }
        } catch (err) {
            const errorMessage =
                err.response?.data?.message || err.message || 'An error occurred';
            showToast(errorMessage, 'error');
            console.error('Dashboard fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, [user?.user_id, date, yearMonth, attendanceStatusId]); // Add attendanceStatusId to dependencies

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const value = {
        dashboardData,
        loading,
        date,
        yearMonth,
        attendanceStatusId,
        setDate,
        setYearMonth,
        setAttendanceStatusId, // Expose the setter
        refetch: fetchDashboardData,
    };

    return (
        <DashboardContext.Provider value={value}>
            {children}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={handleToastClose}
                />
            )}
        </DashboardContext.Provider>
    );
};

export const useDashboardData = () => {
    const context = useContext(DashboardContext);
    if (!context) {
        throw new Error('useDashboardData must be used within a DashboardProvider');
    }
    return context;
};