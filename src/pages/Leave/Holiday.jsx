import React, { useState, useMemo, useEffect } from "react";
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosInstance';
import {
    Calendar,
    X,
    Search,
    Plus,
    ArrowLeft,
    Trash2,
    Eye,
    Filter,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Edit2,
    Check,
    Sun,
    Building2,
    Star,
} from "lucide-react";
import LoadingSpinner from "../../Components/Loader/LoadingSpinner";
import { ConfirmDialog } from "../../Components/ui/ConfirmDialog";
import { Toast } from "../../Components/ui/Toast";

export default function HolidayManagement() {
    const { user } = useAuth();

    // Form state includes holiday_paid (1 = paid, 2 = unpaid)
    const [selectedDates, setSelectedDates] = useState([]);
    const [formData, setFormData] = useState({
        holiday_name: "",
        holiday_type_id: "",
        description: "",
        holiday_paid: "1", // default = Paid
    });
    const [editingId, setEditingId] = useState(null);

    const [holidays, setHolidays] = useState([]);
    const [holidayTypes, setHolidayTypes] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState("");
    const [viewModal, setViewModal] = useState({ isOpen: false, holidayData: null });
    const [createModal, setCreateModal] = useState(false);
    const [showCalendarView, setShowCalendarView] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [toast, setToast] = useState({ show: false, message: "", type: "" });
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const currentYear = new Date().getFullYear();
    const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, holidayId: null, holidayName: "" });
    const [editDialog, setEditDialog] = useState({ isOpen: false, holidayData: null });

    useEffect(() => {
        if (user && user.user_id) {
            fetchHolidays();
            fetchHolidayTypes();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const fetchHolidays = async () => {
        try {
            setIsLoading(true);
            const form = new FormData();
            form.append('user_id', user.user_id);

            if (filterType) form.append('holiday_type_id', filterType);
            if (searchTerm) form.append('search', searchTerm);

            const response = await api.post('/holiday_list', form);

            if (response.data.success && response.data.data) {
                const mapped = (response.data.data || []).map(h => {
                    // convert "YYYY-MM-DD,YYYY-MM-DD" -> ["DD/MM/YYYY", ...]
                    const convertedDates = h.holiday_dates
                        ? h.holiday_dates.split(',').map(dateStr => {
                            const parts = dateStr.split('-');
                            if (parts.length === 3) {
                                const [y, m, d] = parts;
                                return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
                            }
                            return dateStr; // fallback
                        })
                        : [];

                    return {
                        ...h,
                        // keep original holiday_paid (string "1"/"2") if provided, default to "1"
                        holiday_paid: (h.holiday_paid ?? "1") + "",
                        holiday_dates: convertedDates,
                        is_active: true
                    };
                });

                setHolidays(mapped);
            } else {
                setHolidays([]);
            }
        } catch (error) {
            console.error('Error fetching holidays:', error);
            showToast(error.response?.data?.message || 'Failed to fetch holidays', 'error');
            setHolidays([]);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchHolidayTypes = async () => {
        try {
            const response = await api.post('/holiday_drop_down_list');
            if (response.data.success && response.data.data) {
                setHolidayTypes(response.data.data);
            } else {
                setHolidayTypes([]);
            }
        } catch (error) {
            console.error('Error fetching holiday types:', error);
            setHolidayTypes([]);
        }
    };

    // Refetch when user types or filter changes (debounced)
    useEffect(() => {
        if (!user || !user.user_id) return;
        const t = setTimeout(() => fetchHolidays(), 500);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTerm, filterType]);

    const stats = useMemo(() => {
        const activeHolidays = holidays.filter(h => h.is_active);
        const totalHolidays = activeHolidays.length;
        const totalDays = activeHolidays.reduce((acc, h) => acc + (Array.isArray(h.holiday_dates) ? h.holiday_dates.length : 0), 0);
        const byType = activeHolidays.reduce((acc, h) => {
            const typeName = h.holiday_type_name || 'Other';
            acc[typeName] = (acc[typeName] || 0) + 1;
            return acc;
        }, {});
        const upcoming = activeHolidays.filter(h => {
            const dates = Array.isArray(h.holiday_dates) ? h.holiday_dates : [];
            if (dates.length === 0) return false;
            const first = dates[0].split('/');
            if (first.length !== 3) return false;
            const d = new Date(first[2], parseInt(first[1], 10) - 1, first[0]);
            d.setHours(0, 0, 0, 0);
            const today = new Date(); today.setHours(0, 0, 0, 0);
            return d >= today;
        }).length;

        return { totalHolidays, totalDays, byType, upcoming };
    }, [holidays]);

    const showToast = (message, type = "success") => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
    };

    const resetForm = () => {
        setFormData({ holiday_name: "", holiday_type_id: "", description: "", holiday_paid: "1" });
        setSelectedDates([]);
        setEditingId(null);
    };

    const handleSubmit = async () => {
        const { holiday_name, holiday_type_id, holiday_paid } = formData;

        if (!holiday_name.trim()) {
            showToast("Please enter holiday name", "error");
            return;
        }
        if (!holiday_type_id) {
            showToast("Please select holiday type", "error");
            return;
        }
        if (selectedDates.length === 0) {
            showToast("Please select at least one date", "error");
            return;
        }

        setIsSubmitting(true);
        try {
            const submitData = new FormData();
            submitData.append('user_id', user.user_id);
            submitData.append('holiday_name', holiday_name.trim());
            submitData.append('holiday_type_id', holiday_type_id);
            submitData.append('description', formData.description.trim());
            submitData.append('holiday_paid', holiday_paid + ""); // send as string "1"/"2"

            // Convert DD/MM/YYYY -> YYYY-MM-DD
            const apiDates = selectedDates.map(dateStr => {
                const parts = dateStr.split('/');
                return `${parts[2]}-${parts[1]}-${parts[0]}`;
            }).join(',');

            submitData.append('holiday_dates', apiDates);

            if (editingId) submitData.append('holiday_id', editingId);

            const response = await api.post('/holiday_create', submitData);

            if (response.data.success) {
                showToast(editingId ? "Holiday updated successfully" : "Holiday added successfully");
                resetForm();
                setCreateModal(false);
                fetchHolidays();
            } else {
                showToast(response.data.message || 'Operation failed', 'error');
            }
        } catch (error) {
            console.error('Error submitting holiday:', error);
            showToast(error.response?.data?.message || 'Failed to submit holiday', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (holiday) => {
        setEditDialog({ isOpen: true, holidayData: holiday });
    };

    const confirmEdit = () => {
        const holiday = editDialog.holidayData;
        // set form values including holiday_paid (fallback to "1")
        setFormData({
            holiday_name: holiday.holiday_name || "",
            holiday_type_id: holiday.holiday_type_id || "",
            description: holiday.description || "",
            holiday_paid: (holiday.holiday_paid ?? "1") + ""
        });

        const dates = Array.isArray(holiday.holiday_dates) ? holiday.holiday_dates : (holiday.holiday_dates ? holiday.holiday_dates.split(',') : []);
        setSelectedDates(dates);
        setEditingId(holiday.holiday_id);
        setCreateModal(true);
        setEditDialog({ isOpen: false, holidayData: null });
    };

    const handleDelete = async () => {
        try {
            const form = new FormData();
            form.append('holiday_id', deleteDialog.holidayId);
            form.append('user_id', user.user_id);

            const response = await api.post('/holiday_delete', form);
            if (response.data.success) {
                showToast("Holiday deleted successfully");
                fetchHolidays();
            } else {
                showToast(response.data.message || 'Failed to delete holiday', 'error');
            }
        } catch (error) {
            console.error('Error deleting holiday:', error);
            showToast(error.response?.data?.message || 'Failed to delete holiday', 'error');
        } finally {
            setDeleteDialog({ isOpen: false, holidayId: null, holidayName: "" });
        }
    };

    const handleView = (holiday) => setViewModal({ isOpen: true, holidayData: holiday });

    const getTypeColor = (type) => {
        const map = {
            "Public Holiday": "bg-primary-50 text-primary-700 border-primary-200",
            "Company Holiday": "bg-purple-50 text-purple-700 border-purple-200",
            "Optional Holiday": "bg-amber-50 text-amber-700 border-amber-200",
            "Festival": "bg-pink-50 text-pink-700 border-pink-200",
            "National": "bg-green-50 text-green-700 border-green-200",
        };
        return map[type] || "bg-gray-50 text-gray-700 border-gray-200";
    };

    const getTypeIcon = (type) => {
        const map = {
            "Public Holiday": <Sun size={14} />,
            "Company Holiday": <Building2 size={14} />,
            "Optional Holiday": <Star size={14} />,
            "Festival": <Calendar size={14} />,
            "National": <Calendar size={14} />,
        };
        return map[type] || <Calendar size={14} />;
    };

    const getHolidayForDate = (date) => {
        const d = String(date.getDate()).padStart(2, '0');
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const y = date.getFullYear();
        const dateStr = `${d}/${m}/${y}`;

        return holidays.filter(h => {
            const dates = Array.isArray(h.holiday_dates) ? h.holiday_dates : (h.holiday_dates ? h.holiday_dates.split(',') : []);
            return dates.includes(dateStr) && h.is_active;
        });
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--color-bg-primary)]">
            {toast.show && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast({ show: false, message: "", type: "" })}
                />
            )}

            <div className="p-4 sm:p-8 lg:p-8  mx-auto">
                <div className="bg-[var(--color-bg-secondary)] rounded-2xl shadow-custom mb-8 overflow-hidden">
                    <div className="bg-gradient-to-r from-[var(--color-primary-dark)] to-[var(--color-primary-darker)] p-8">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => window.history.back()}
                                    className="flex items-center gap-2 text-[var(--color-text-white)] hover:text-[var(--color-text-white-90)] transition-colors bg-[var(--color-bg-secondary-20)] hover:bg-[var(--color-bg-secondary-30)] px-4 py-2 rounded-lg backdrop-blur-sm"
                                >
                                    <ArrowLeft size={18} />
                                    Back
                                </button>
                                <div>
                                    <h1 className="text-2xl font-bold text-[var(--color-text-white)]">
                                        Holiday Management for {currentYear}
                                    </h1>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowCalendarView(!showCalendarView)}
                                className="flex items-center gap-2 px-4 py-2 bg-[var(--color-bg-secondary-20)] hover:bg-[var(--color-bg-secondary-30)] text-white rounded-lg transition-colors font-medium shadow-sm backdrop-blur-sm"
                            >
                                <CalendarDays size={18} />
                                {showCalendarView ? "List View" : "Calendar View"}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <StatCard title="Total Holidays" value={stats.totalHolidays} icon={<Calendar size={24} />} color="primary" />
                    <StatCard title="Total Days Off" value={stats.totalDays} icon={<CalendarDays size={24} />} color="green" />
                    <StatCard title="Upcoming" value={stats.upcoming} icon={<Sun size={24} />} color="amber" />
                    <StatCard title="Public Holidays" value={stats.byType["Public Holiday"] || 0} icon={<Building2 size={24} />} color="purple" />
                </div>

                {showCalendarView && (
                    <section className="bg-[var(--color-bg-secondary)] rounded-xl shadow-sm border border-[var(--color-border-primary)] mb-6 p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                                <Calendar size={20} className="text-[var(--color-primary)]" />
                                Holiday Calendar
                            </h3>
                        </div>

                        <CalendarComponent
                            holidays={holidays}
                            currentMonth={currentMonth}
                            setCurrentMonth={setCurrentMonth}
                            getHolidayForDate={getHolidayForDate}
                        />

                        <div className="mt-6 pt-6 border-t border-[var(--color-border-primary)]">
                            <h4 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Upcoming Holidays</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                {holidays.slice(0, 4).map((holiday) => {
                                    const dates = Array.isArray(holiday.holiday_dates) ? holiday.holiday_dates : (holiday.holiday_dates ? holiday.holiday_dates.split(',') : []);
                                    return (
                                        <div key={holiday.holiday_id} className="flex items-center gap-3 p-3 bg-[var(--color-bg-primary)] rounded-lg border border-[var(--color-border-secondary)] hover:border-[var(--color-primary)] transition-colors">
                                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${holiday.holiday_type_name === "Public Holiday" ? "bg-primary-500" : holiday.holiday_type_name === "National" ? "bg-green-500" : holiday.holiday_type_name === "Festival" ? "bg-pink-500" : "bg-amber-500"}`}></div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">{holiday.holiday_name}</p>
                                                <p className="text-xs text-[var(--color-text-secondary)]">{dates[0]}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </section>
                )}

                <section className="bg-[var(--color-bg-secondary)] rounded-xl shadow-sm border border-[var(--color-border-primary)] overflow-hidden">
                    <div className="px-6 py-4 border-b border-[var(--color-border-primary)] bg-[var(--color-primary-dark)]">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <Calendar size={20} />
                                Holiday List
                            </h3>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        resetForm();
                                        setCreateModal(true);
                                    }}
                                    className="flex items-center gap-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm"
                                >
                                    <Plus size={18} /> Add Holiday
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-6 py-4 bg-[var(--color-bg-primary)] border-b border-[var(--color-border-primary)]">
                        <div className="relative w-full sm:w-80">
                            <input
                                type="text"
                                placeholder="Search holidays..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-[var(--color-border-secondary)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] transition-all bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)]"
                            />
                            <Search className="absolute left-3 top-3 h-4 w-4 text-[var(--color-text-muted)]" />
                        </div>

                        <div className="relative w-full sm:w-auto">
                            <select
                                className="pl-10 pr-8 py-2.5 border border-[var(--color-border-secondary)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-primary)] bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] appearance-none cursor-pointer min-w-[180px]"
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                            >
                                <option value="">All Types</option>
                                {holidayTypes.map((type) => (
                                    <option key={type.holiday_type_id} value={type.holiday_type_id}>
                                        {type.holiday_type_name}
                                    </option>
                                ))}
                            </select>
                            <Filter className="absolute left-3 top-3 h-4 w-4 text-[var(--color-text-muted)] pointer-events-none" />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-[var(--color-border-divider)]">
                            <thead className="bg-[var(--color-bg-primary)]">
                                <tr>
                                    {["Holiday Name", "Type", "Paid?", "Dates", "Description", "Actions"].map((head) => (
                                        <th key={head} className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                                            {head}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-[var(--color-bg-secondary)] divide-y divide-[var(--color-border-divider)]">
                                {holidays.length ? (
                                    holidays.map((h) => {
                                        const dates = Array.isArray(h.holiday_dates) ? h.holiday_dates : (h.holiday_dates ? h.holiday_dates.split(',') : []);
                                        return (
                                            <tr key={h.holiday_id} className="hover:bg-[var(--color-bg-hover)] transition-colors align-top">
                                                <td className="px-6 py-4 align-top">
                                                    <div className="font-semibold text-[var(--color-text-primary)]">{h.holiday_name}</div>
                                                </td>
                                                <td className="px-6 py-4 align-top">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getTypeColor(h.holiday_type_name)}`}>
                                                        {getTypeIcon(h.holiday_type_name)}
                                                        {h.holiday_type_name}
                                                    </span>
                                                </td>

                                                <td className="px-6 py-4 align-top">
                                                    {h.holiday_paid === "1" ? (
                                                        <span className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full">Paid</span>
                                                    ) : (
                                                        <span className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-full">Unpaid</span>
                                                    )}
                                                </td>

                                                <td className="px-6 py-4 align-top max-w-[280px]">
                                                    <div className="flex flex-wrap gap-1 text-xs max-h-20 overflow-y-auto pr-2">
                                                        {dates.map((d, idx) => (
                                                            <span key={idx} className="px-2 py-0.5 bg-primary-50 text-primary-700 rounded border border-primary-200">
                                                                {d}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4 text-sm text-[var(--color-text-secondary)] max-w-xs align-top">
                                                    <div className="truncate">{h.description || "-"}</div>
                                                </td>
                                                <td className="px-6 py-4 align-top">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleView(h)}
                                                            className="p-2 text-[var(--color-primary)] hover:bg-[var(--color-primary-lightest)] rounded-lg transition-colors"
                                                            title="View Details"
                                                        >
                                                            <Eye size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleEdit(h)}
                                                            className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                                            title="Edit"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteDialog({ isOpen: true, holidayId: h.holiday_id, holidayName: h.holiday_name })}
                                                            className="p-2 text-[var(--color-error)] hover:bg-[var(--color-error-light)] rounded-lg transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="py-16 text-center">
                                            <Calendar className="h-12 w-12 mx-auto mb-4 text-[var(--color-text-muted)]" />
                                            <p className="font-semibold text-[var(--color-text-primary)] text-lg mb-1">No holidays found</p>
                                            <p className="text-[var(--color-text-secondary)] text-sm mb-4">Get started by adding your first holiday</p>
                                            <button
                                                onClick={() => {
                                                    resetForm();
                                                    setCreateModal(true);
                                                }}
                                                className="inline-flex items-center gap-2 bg-[var(--color-primary)] text-white px-5 py-2.5 rounded-lg hover:bg-[var(--color-primary-dark)] transition-colors font-medium"
                                            >
                                                <Plus size={18} />
                                                Add Holiday
                                            </button>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Create/Edit Modal */}
                {createModal && (
                    <Modal onClose={() => { setCreateModal(false); resetForm(); }} title={editingId ? "Edit Holiday" : "Add New Holiday"}>
                        <div className="space-y-5">
                            <InputField
                                label="Holiday Name"
                                required
                                value={formData.holiday_name}
                                onChange={(e) => setFormData({ ...formData, holiday_name: e.target.value })}
                                placeholder="e.g., Diwali, Christmas"
                                icon={<Calendar size={16} />}
                            />

                            <div>
                                <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                                    Holiday Type <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.holiday_type_id}
                                    onChange={(e) => setFormData({ ...formData, holiday_type_id: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-[var(--color-border-secondary)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-none transition-all bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)]"
                                >
                                    <option value="">Select Type</option>
                                    {holidayTypes.map((t) => (
                                        <option key={t.holiday_type_id} value={t.holiday_type_id}>
                                            {t.holiday_type_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                                    Select Dates <span className="text-red-500">*</span>
                                </label>
                                <div className="border border-[var(--color-border-secondary)] rounded-lg p-4 bg-[var(--color-bg-primary)]">
                                    <DatePickerComponent selectedDates={selectedDates} setSelectedDates={setSelectedDates} />
                                </div>

                                {selectedDates.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {selectedDates.map((d) => (
                                            <span key={d} className="inline-flex items-center gap-2 bg-primary-50 text-primary-700 border border-primary-200 px-3 py-1.5 rounded-lg text-sm font-medium">
                                                <Calendar size={14} />
                                                {d}
                                                <button type="button" onClick={() => setSelectedDates((prev) => prev.filter((x) => x !== d))} className="hover:bg-primary-100 rounded-full p-0.5 transition-colors">
                                                    <X size={14} />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <InputField
                                label="Description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Optional description..."
                                textarea
                            />

                            {/* Holiday Paid radio group */}
                            <div>
                                <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">Holiday Paid?</label>
                                <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="holiday_paid"
                                            value="1"
                                            checked={formData.holiday_paid === "1"}
                                            onChange={(e) => setFormData({ ...formData, holiday_paid: e.target.value })}
                                        />
                                        <span className="text-[var(--color-text-primary)] text-sm">Paid Holiday</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="holiday_paid"
                                            value="2"
                                            checked={formData.holiday_paid === "2"}
                                            onChange={(e) => setFormData({ ...formData, holiday_paid: e.target.value })}
                                        />
                                        <span className="text-[var(--color-text-primary)] text-sm">Unpaid Holiday</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-6 border-t border-[var(--color-border-primary)] mt-6">
                            <button
                                type="button"
                                onClick={() => { setCreateModal(false); resetForm(); }}
                                className="px-5 py-2.5 bg-[var(--color-bg-primary)] hover:bg-[var(--color-bg-hover)] rounded-lg text-[var(--color-text-primary)] font-medium transition-colors border border-[var(--color-border-secondary)]"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                className="px-5 py-2.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] rounded-lg text-white font-semibold transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Submitting...' : (editingId ? "Update Holiday" : "Add Holiday")}
                            </button>
                        </div>
                    </Modal>
                )}

                {/* View Modal */}
                {viewModal.isOpen && viewModal.holidayData && (
                    <Modal onClose={() => setViewModal({ isOpen: false, holidayData: null })} title="Holiday Details">
                        <div className="space-y-5">
                            <div>
                                <h3 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
                                    {viewModal.holidayData.holiday_name}
                                </h3>
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border ${getTypeColor(viewModal.holidayData.holiday_type_name)}`}>
                                    {getTypeIcon(viewModal.holidayData.holiday_type_name)}
                                    {viewModal.holidayData.holiday_type_name}
                                </span>
                            </div>

                            <div className="bg-[var(--color-bg-primary)] rounded-lg p-4 border border-[var(--color-border-secondary)]">
                                <div className="flex items-start gap-3">
                                    <Calendar className="text-[var(--color-primary)] mt-1 flex-shrink-0" size={20} />
                                    <div>
                                        <p className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">Holiday Dates</p>
                                        <div className="flex flex-wrap gap-2">
                                            {(() => {
                                                const dates = Array.isArray(viewModal.holidayData.holiday_dates) ? viewModal.holidayData.holiday_dates : (viewModal.holidayData.holiday_dates ? viewModal.holidayData.holiday_dates.split(',') : []);
                                                return dates.map((date, idx) => (
                                                    <span key={idx} className="inline-block bg-[var(--color-bg-secondary)] px-3 py-1 rounded-md text-sm font-medium text-[var(--color-text-primary)] border border-[var(--color-border-secondary)]">
                                                        {date}
                                                    </span>
                                                ));
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {viewModal.holidayData.description && (
                                <div>
                                    <p className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">Description</p>
                                    <p className="text-[var(--color-text-secondary)] leading-relaxed bg-[var(--color-bg-primary)] p-4 rounded-lg border border-[var(--color-border-secondary)]">
                                        {viewModal.holidayData.description}
                                    </p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[var(--color-border-primary)]">
                                <div>
                                    <p className="text-xs font-medium text-[var(--color-text-secondary)] mb-1">Year</p>
                                    <p className="text-lg font-semibold text-[var(--color-text-primary)]">{viewModal.holidayData.year || currentYear}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-[var(--color-text-secondary)] mb-1">Total Days</p>
                                    <p className="text-lg font-semibold text-[var(--color-text-primary)]">
                                        {(() => {
                                            const dates = Array.isArray(viewModal.holidayData.holiday_dates) ? viewModal.holidayData.holiday_dates : (viewModal.holidayData.holiday_dates ? viewModal.holidayData.holiday_dates.split(',') : []);
                                            return dates.length;
                                        })()}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs font-medium text-[var(--color-text-secondary)] mb-1">Paid</p>
                                    <p className="text-lg font-semibold text-[var(--color-text-primary)]">
                                        {viewModal.holidayData.holiday_paid === "1" ? "Paid" : "Unpaid"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Modal>
                )}

                <ConfirmDialog
                    isOpen={deleteDialog.isOpen}
                    onClose={() => setDeleteDialog({ isOpen: false, holidayId: null, holidayName: "" })}
                    onConfirm={handleDelete}
                    title="Delete Holiday"
                    message={`Are you sure you want to delete "${deleteDialog.holidayName}"? This action cannot be undone.`}
                    confirmText="Delete"
                    cancelText="Cancel"
                    type="danger"
                />

                <ConfirmDialog
                    isOpen={editDialog.isOpen}
                    onClose={() => setEditDialog({ isOpen: false, holidayData: null })}
                    onConfirm={confirmEdit}
                    title="Edit Holiday"
                    message={`Do you want to edit "${editDialog.holidayData?.holiday_name}"?`}
                    confirmText="Edit"
                    cancelText="Cancel"
                    type="info"
                />
            </div>
        </div>
    );
}

/* --- Statistics Card Component --- */
function StatCard({ title, value, icon, color }) {
    const colorMap = {
        primary: "bg-primary-50 text-primary-600 border-primary-200",
        green: "bg-green-50 text-green-600 border-green-200",
        amber: "bg-amber-50 text-amber-600 border-amber-200",
        purple: "bg-purple-50 text-purple-600 border-purple-200",
    };

    return (
        <div className="bg-[var(--color-bg-secondary)] rounded-xl p-5 shadow-sm border border-[var(--color-border-primary)] hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-1">{title}</p>
                    <p className="text-3xl font-bold text-[var(--color-text-primary)]">{value}</p>
                </div>
                <div className={`p-3 rounded-lg border ${colorMap[color]}`}>
                    {icon}
                </div>
            </div>
        </div>
    );
}

/* --- Calendar Component --- */
function CalendarComponent({ currentMonth, setCurrentMonth, getHolidayForDate }) {
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days = [];
        for (let i = 0; i < startingDayOfWeek; i++) days.push(null);
        for (let day = 1; day <= daysInMonth; day++) days.push(new Date(year, month, day));
        return days;
    };

    const days = getDaysInMonth(currentMonth);

    const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));

    const getHolidayColor = (date) => {
        const holidaysOnDate = getHolidayForDate(date);
        if (holidaysOnDate.length === 0) return null;
        const type = holidaysOnDate[0].holiday_type_name;
        if (type === "Public Holiday" || type === "Company Holiday") return "bg-primary-500";
        if (type === "National") return "bg-green-500";
        if (type === "Festival") return "bg-pink-500";
        return "bg-amber-500";
    };

    return (
        <div className="bg-[var(--color-bg-secondary)]">
            <div className="flex items-center justify-between mb-6">
                <button type="button" onClick={prevMonth} className="p-2 hover:bg-[var(--color-bg-hover)] rounded-lg transition-colors">
                    <ChevronLeft size={20} className="text-[var(--color-text-secondary)]" />
                </button>
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                    {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </h3>
                <button type="button" onClick={nextMonth} className="p-2 hover:bg-[var(--color-bg-hover)] rounded-lg transition-colors">
                    <ChevronRight size={20} className="text-[var(--color-text-secondary)]" />
                </button>
            </div>

            <div className="grid grid-cols-7 gap-2">
                {dayNames.map(day => (
                    <div key={day} className="text-center font-semibold text-[var(--color-text-secondary)] text-sm py-2">
                        {day}
                    </div>
                ))}

                {days.map((date, idx) => {
                    if (!date) return <div key={`empty-${idx}`} className="aspect-square"></div>;
                    const holidaysOnDate = getHolidayForDate(date);
                    const holidayColor = getHolidayColor(date);
                    const isToday = date.toDateString() === new Date().toDateString();

                    return (
                        <div
                            key={idx}
                            className={`aspect-square p-2 border rounded-lg relative group cursor-pointer hover:bg-[var(--color-bg-hover)] transition-colors ${isToday ? 'border-[var(--color-primary)] border-2 bg-[var(--color-primary-lightest)]' : 'border-[var(--color-border-secondary)]'}`}
                        >
                            <div className={`text-sm font-medium ${isToday ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-primary)]'}`}>
                                {date.getDate()}
                            </div>
                            {holidayColor && <div className={`w-2 h-2 ${holidayColor} rounded-full absolute bottom-2 right-2`}></div>}
                            {holidaysOnDate.length > 0 && (
                                <div className="hidden group-hover:block absolute z-10 bg-gray-900 text-white text-xs rounded-lg p-3 left-0 top-full mt-2 w-56 shadow-xl">
                                    {holidaysOnDate.map(h => (
                                        <div key={h.holiday_id} className="mb-2 last:mb-0">
                                            <div className="font-semibold">{h.holiday_name}</div>
                                            <div className="text-gray-300 text-xs mt-0.5">{h.holiday_type_name}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/* --- Date Picker Component for Modal --- */
function DatePickerComponent({ selectedDates, setSelectedDates }) {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const formatDate = (date) => {
        const d = String(date.getDate()).padStart(2, '0');
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const y = date.getFullYear();
        return `${d}/${m}/${y}`;
    };

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const dayNames = ["S", "M", "T", "W", "T", "F", "S"];

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days = [];
        for (let i = 0; i < startingDayOfWeek; i++) days.push(null);
        for (let day = 1; day <= daysInMonth; day++) days.push(new Date(year, month, day));
        return days;
    };

    const days = getDaysInMonth(currentMonth);
    const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));

    const handleDateClick = (date) => {
        const formatted = formatDate(date);
        setSelectedDates(prev => {
            let newDates;
            if (prev.includes(formatted)) {
                newDates = prev.filter(d => d !== formatted);
            } else {
                newDates = [...prev, formatted];
            }

            // Sort dates in ascending order (DD/MM/YYYY format)
            return newDates.sort((a, b) => {
                const [dayA, monthA, yearA] = a.split('/').map(Number);
                const [dayB, monthB, yearB] = b.split('/').map(Number);

                // Compare year first, then month, then day
                if (yearA !== yearB) return yearA - yearB;
                if (monthA !== monthB) return monthA - monthB;
                return dayA - dayB;
            });
        });
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <button onClick={prevMonth} type="button" className="p-2 hover:bg-[var(--color-bg-hover)] rounded-lg transition-colors">
                    <ChevronLeft size={18} className="text-[var(--color-text-secondary)]" />
                </button>
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                    {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </h3>
                <button onClick={nextMonth} type="button" className="p-2 hover:bg-[var(--color-bg-hover)] rounded-lg transition-colors">
                    <ChevronRight size={18} className="text-[var(--color-text-secondary)]" />
                </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center">
                {dayNames.map((day, idx) => (
                    <div key={idx} className="font-semibold text-[var(--color-text-secondary)] text-xs py-2">{day}</div>
                ))}

                {days.map((date, idx) => {
                    if (!date) return <div key={`empty-${idx}`} className="aspect-square"></div>;
                    const formatted = formatDate(date);
                    const isSelected = selectedDates.includes(formatted);

                    return (
                        <button
                            key={idx}
                            type="button"
                            onClick={() => handleDateClick(date)}
                            className={`aspect-square text-sm rounded-lg border flex items-center justify-center transition-all font-medium
                                ${isSelected ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-sm" : "border-[var(--color-border-secondary)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-primary)]"}`}
                        >
                            {date.getDate()}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

/* --- Reusable InputField Component --- */
function InputField({ label, value, onChange, placeholder, textarea, required, icon }) {
    return (
        <div>
            <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
                {icon && <div className="absolute left-3 top-3 text-[var(--color-text-muted)]">{icon}</div>}
                {textarea ? (
                    <textarea
                        value={value}
                        onChange={onChange}
                        placeholder={placeholder}
                        className={`w-full ${icon ? 'pl-10' : 'pl-4'} pr-4 py-2.5 border border-[var(--color-border-secondary)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-none resize-none transition-all bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]`}
                        rows="3"
                    />
                ) : (
                    <input
                        type="text"
                        value={value}
                        onChange={onChange}
                        placeholder={placeholder}
                        className={`w-full ${icon ? 'pl-10' : 'pl-4'} pr-4 py-2.5 border border-[var(--color-border-secondary)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-none transition-all bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]`}
                    />
                )}
            </div>
        </div>
    );
}

/* --- Modal Component --- */
function Modal({ onClose, title, children }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-[var(--color-bg-secondary)] rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto border border-[var(--color-border-primary)]">
                <div className="flex justify-between items-center border-b border-[var(--color-border-primary)] px-6 py-4 sticky top-0 bg-[var(--color-bg-secondary)] rounded-t-2xl">
                    <h2 className="text-xl font-bold text-[var(--color-text-primary)]">{title}</h2>
                    <button type="button" onClick={onClose} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] rounded-lg p-1.5 transition-colors">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-8">{children}</div>
            </div>
        </div>
    );
}
