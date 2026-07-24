import React, { useState, useMemo, useEffect } from "react";
import { useSelector } from "react-redux";
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
    Edit,
    Filter,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Edit2,
    Check,
    Sun,
    Building2,
    Star,
    CheckCircle2,
    XCircle
} from "lucide-react";
import LoadingSpinner from "../../Components/Loader/LoadingSpinner";
import { ConfirmDialog } from "../../Components/comman/ConfirmDialog";
import { Toast } from "../../Components/ui/Toast";
import CustomSelect from "../../Components/comman/CustomSelect";
import { Table, TableHeader, TableBody, TableRow, TableHeaderRow, Th, Td } from '../../Components/ui/Table';
import CustomInput from "../../Components/comman/CustomInput";
import NoDataFound from "../../Components/comman/NoDataFound";

export default function HolidayManagement() {
    const { user } = useAuth();
    const permissions = useSelector(state => state.permissions) || {};

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
            fetchHolidayTypes();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const fetchHolidays = async () => {
        try {
            setIsLoading(true);
            const form = new FormData();

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
    }, [user, searchTerm, filterType]);

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
        <div className="h-[calc(100vh-64px)] overflow-hidden bg-[var(--color-bg-primary)]">
            {toast.show && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast({ show: false, message: "", type: "" })}
                />
            )}

            <div className="p-4 sm:p-8 lg:p-8 mx-auto h-full flex flex-col overflow-hidden w-full">

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <StatCard title="Total Holidays" value={stats.totalHolidays} icon={<Calendar size={24} />} color="primary" />
                    <StatCard title="Total Days Off" value={stats.totalDays} icon={<CalendarDays size={24} />} color="green" />
                    <StatCard title="Upcoming" value={stats.upcoming} icon={<Sun size={24} />} color="amber" />
                    <StatCard title="Public Holidays" value={stats.byType["Public Holiday"] || 0} icon={<Building2 size={24} />} color="purple" />
                </div>



                <section className="bg-[var(--color-bg-secondary)] rounded-xl shadow-sm border border-[var(--color-border-primary)] overflow-hidden flex flex-col flex-1 min-h-0">
                    <div className="px-6 py-4 border-b border-[var(--color-border-primary)] bg-[var(--color-primary-lighter)] ">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <h3 className="text-lg font-semibold text-[var(--color-primary-darker)] flex items-center gap-2">
                                <Calendar size={20} />
                                Holiday List
                            </h3>
                            <div className="flex gap-3">

                                {/* <div className="relative w-full sm:w-80">
                                    <input
                                        type="text"
                                        placeholder="Search holidays..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 border border-[var(--color-border-secondary)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] transition-all bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)]"
                                    />
                                    <Search className="absolute left-3 top-3 h-4 w-4 text-[var(--color-text-muted)]" />
                                </div> */}
                                <div className="relative w-full sm:w-80">

                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)] z-10" />

                                    <CustomInput
                                        type="text"
                                        name="searchTerm"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Search holidays..."
                                        clearable={true}
                                        className="!h-[42px] [&_input]:!h-[42px] [&_input]:!pl-10 [&_input]:!pr-4 [&_input]:!rounded-lg"
                                    />

                                </div>

                                <div className="relative w-full sm:w-[180px]">
                                    {/* <select
                                        className="pl-10 pr-5 py-2.5 border border-[var(--color-border-secondary)] font-medium rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-primary)] bg-[var(--color-bg-secondary)] text-[var(--color-primary-dark)] appearance-none cursor-pointer min-w-[100px]"
                                        value={filterType}
                                        onChange={(e) => setFilterType(e.target.value)}
                                    >
                                        <option value="">All Types</option>
                                        {holidayTypes.map((type) => (
                                            <option key={type.holiday_type_id} value={type.holiday_type_id}>
                                                {type.holiday_type_name}
                                            </option>
                                        ))}
                                    </select> */}
                                    <CustomSelect
                                        name="filterType"
                                        value={filterType}
                                        onChange={(e) => setFilterType(e.target.value)}
                                        options={[
                                            {
                                                value: '',
                                                label: 'All Types',
                                            },
                                            ...holidayTypes.map((type) => ({
                                                value: type.holiday_type_id,
                                                label: type.holiday_type_name,
                                            })),
                                        ]}
                                        searchable={false}
                                        className="w-full min-w-[180px] !h-[40px] [&_button]:!h-[40px] [&_button]:!min-h-[40px]"

                                    />
                                    {/* <Filter className="absolute left-3 top-3 h-4 w-4 text-[var(--color-primary-dark)] pointer-events-none" /> */}
                                </div>

                                <button
                                    onClick={() => setShowCalendarView(!showCalendarView)}
                                    className="flex items-center gap-2 px-4 py-2 bg-white text-[var(--color-primary-dark)] rounded-lg transition-colors font-medium text-sm shadow-sm"
                                >
                                    <CalendarDays size={18} />
                                    {showCalendarView ? "List View" : "Calendar View"}
                                </button>

                                {permissions['holiday_create'] && (
                                    <button
                                        onClick={() => {
                                            resetForm();
                                            setCreateModal(true);
                                        }}
                                        className="flex items-center gap-2 bg-white text-[var(--color-primary-dark)] px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm"
                                    >
                                        <Plus size={18} /> Add Holiday
                                    </button>
                                )}

                                {/* <div className="relative w-full sm:w-auto">
                                    <select
                                        className="pl-10 pr-5 py-2.5 border border-[var(--color-border-secondary)] font-medium rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-primary)] bg-[var(--color-bg-secondary)] text-[var(--color-primary-dark)] appearance-none cursor-pointer min-w-[100px]"
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
                                  
                                    <Filter className="absolute left-3 top-3 h-4 w-4 text-[var(--color-primary-dark)] pointer-events-none" />
                                </div> */}
                            </div>
                        </div>
                    </div>

                    {showCalendarView ? (
                        <div className="relative flex-1 overflow-y-auto custom-scrollbar">
                            {/* Soft ambient backdrop */}
                            <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-bg-secondary)] via-[var(--color-bg-primary)] to-[var(--color-bg-secondary)] pointer-events-none" />
                            <div className="absolute top-0 left-1/3 w-72 h-72 bg-[var(--color-primary)]/5 rounded-full blur-3xl pointer-events-none" />

                            <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-10 p-8 lg:p-4">

                                {/* LEFT — Editorial header + Calendar */}
                                <div className="lg:col-span-8">
                                    {/* Editorial month header */}
                                    {/* <div className="flex items-end justify-between mb-10 pb-6 border-b border-[var(--color-border-primary)]">
                                        <div>
                                            <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-text-muted)] mb-2">
                                                Holiday Calendar
                                            </p>
                                            <h2 className="text-5xl lg:text-6xl font-light text-[var(--color-text-primary)] leading-none tracking-tight">
                                                {currentMonth.toLocaleString('default', { month: 'long' })}
                                                <span className="text-[var(--color-primary)] font-serif italic ml-3">
                                                    {currentMonth.getFullYear()}
                                                </span>
                                            </h2>
                                        </div>
                                        <div className="hidden sm:flex items-center gap-1">
                                            <button
                                                type="button"
                                                onClick={() => setCurrentMonth(new Date())}
                                                className="px-4 py-2 text-xs uppercase tracking-widest text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
                                            >
                                                Today
                                            </button>
                                        </div>
                                    </div> */}

                                    {/* Calendar */}
                                    <CalendarComponent
                                        holidays={holidays}
                                        currentMonth={currentMonth}
                                        setCurrentMonth={setCurrentMonth}
                                        getHolidayForDate={getHolidayForDate}
                                    />
                                </div>

                                {/* RIGHT — Agenda timeline */}
                                <aside className="lg:col-span-4 lg:border-l lg:border-[var(--color-border-primary)] lg:pl-10">
                                    <div className="sticky top-6">


                                        {/* Upcoming agenda — timeline style */}
                                        <p className="text-md text-[var(--color-text-muted)] mb-5">
                                            Upcoming
                                        </p>
                                        <div className="relative">
                                            {/* vertical timeline line */}
                                            <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gradient-to-b from-[var(--color-primary)]/40 via-[var(--color-border-primary)] to-transparent" />

                                            <div className="space-y-5">
                                                {holidays.slice(0, 5).map((holiday) => {
                                                    const dates = Array.isArray(holiday.holiday_dates) ? holiday.holiday_dates : (holiday.holiday_dates ? holiday.holiday_dates.split(',') : []);
                                                    const dt = dates[0] ? new Date(dates[0]) : null;
                                                    const dotColor = holiday.holiday_type_name === "Public Holiday" ? "bg-primary-500"
                                                        : holiday.holiday_type_name === "National" ? "bg-green-500"
                                                            : holiday.holiday_type_name === "Festival" ? "bg-pink-500"
                                                                : "bg-amber-500";
                                                    return (
                                                        <div key={holiday.holiday_id} className="relative pl-8 group cursor-default">
                                                            <span className={`absolute left-0 top-1.5 w-[22px] h-[22px] rounded-full ${dotColor} ring-4 ring-[var(--color-bg-primary)] group-hover:scale-110 transition-transform`} />
                                                            <div className="flex items-baseline justify-between gap-2">
                                                                <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate group-hover:text-[var(--color-primary)] transition-colors">
                                                                    {holiday.holiday_name}
                                                                </p>
                                                                {dt && (
                                                                    <span className="text-xs font-mono text-[var(--color-text-muted)] flex-shrink-0">
                                                                        {dt.toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-[11px] tracking-wider text-[var(--color-text-secondary)] mt-0.5">
                                                                {holiday.holiday_type_name}
                                                            </p>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Legend — inline pills */}
                                        <div className="mt-10 pt-6 border-t border-[var(--color-border-primary)]">
                                            <p className="text-sm text-[var(--color-text-muted)] mb-4">
                                                Legend
                                            </p>
                                            <div className="flex flex-wrap gap-x-4 gap-y-2">
                                                {[
                                                    { label: "Public", c: "bg-primary-500" },
                                                    { label: "National", c: "bg-green-500" },
                                                    { label: "Festival", c: "bg-pink-500" },
                                                    { label: "Other", c: "bg-amber-500" },
                                                ].map((t) => (
                                                    <span key={t.label} className="inline-flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                                                        <span className={`w-2 h-2 rounded-full ${t.c}`} />
                                                        {t.label}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </aside>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-6 py-4 bg-[var(--color-primary-dark)] border-b border-[var(--color-border-primary)]">
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
                            </div> */}

                            <div className="flex-1 overflow-auto flex flex-col bg-[#FBF9FD]">
                                <Table className="min-w-full divide-y divide-[var(--color-border-divider)]">
                                    <TableHeader className="bg-[var(--color-primary-dark)]">
                                        <TableHeaderRow>
                                            {["Holiday Name", "Type", "Paid", "Dates", "Description", "Actions"].map((head) => (
                                                <Th key={head} className="px-6 py-3 text-left font-semibold">
                                                    {head}
                                                </Th>
                                            ))}
                                        </TableHeaderRow>
                                    </TableHeader>
                                    {holidays.length > 0 && (
                                        <TableBody className="bg-[var(--color-bg-secondary)] divide-y divide-[var(--color-border-divider)]">
                                            {holidays.map((h) => {
                                                const dates = Array.isArray(h.holiday_dates) ? h.holiday_dates : (h.holiday_dates ? h.holiday_dates.split(',') : []);
                                                return (
                                                    <TableRow key={h.holiday_id} className="hover:bg-[var(--color-bg-hover)] transition-colors align-top">
                                                        <Td className="px-6 py-4 align-top">
                                                            <div className="font-semibold text-[var(--color-text-primary)]">{h.holiday_name}</div>
                                                        </Td>
                                                        <Td className="px-6 py-4 align-top">
                                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getTypeColor(h.holiday_type_name)}`}>
                                                                {getTypeIcon(h.holiday_type_name)}
                                                                {h.holiday_type_name}
                                                            </span>
                                                        </Td>

                                                        <Td className="px-6 py-4 align-top">
                                                            {h.holiday_paid === "1" ? (
                                                                <span className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full">Paid</span>
                                                            ) : (
                                                                <span className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-full">Unpaid</span>
                                                            )}
                                                        </Td>

                                                        <Td className="px-6 py-4 align-top max-w-[280px]">
                                                            <div className="flex flex-wrap gap-1 text-xs max-h-20 overflow-y-auto pr-2">
                                                                {dates.map((d, idx) => (
                                                                    <span key={idx} className="px-2 py-0.5 bg-primary-50 text-primary-700 rounded border border-primary-200">
                                                                        {d}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </Td>

                                                        <Td className="px-6 py-4 text-sm text-[var(--color-text-secondary)] max-w-xs align-top">
                                                            <div className="truncate">{h.description || "-"}</div>
                                                        </Td>
                                                        <Td className="px-6 py-4 align-top">
                                                            <div className="flex items-center gap-3">
                                                                {permissions['holiday_view'] && (
                                                                    <button
                                                                        onClick={() => handleView(h)}
                                                                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:scale-110 hover:shadow-md transition-all duration-200"
                                                                        title="View Details"
                                                                    >
                                                                        <Eye size={16} strokeWidth={2.5} />
                                                                    </button>
                                                                )}
                                                                {permissions['holiday_edit'] && (
                                                                    <button
                                                                        onClick={() => handleEdit(h)}
                                                                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 hover:scale-110 hover:shadow-md transition-all duration-200"
                                                                        title="Edit"
                                                                    >
                                                                        <Edit size={16} strokeWidth={2.5} />
                                                                    </button>
                                                                )}
                                                                {permissions['holiday_delete'] && (
                                                                    <button
                                                                        onClick={() => setDeleteDialog({ isOpen: true, holidayId: h.holiday_id, holidayName: h.holiday_name })}
                                                                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-100 hover:scale-110 hover:shadow-md transition-all duration-200"
                                                                        title="Delete"
                                                                    >
                                                                        <Trash2 size={16} strokeWidth={2.5} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </Td>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    )}
                                </Table>

                                {holidays.length === 0 && (
                                    <div className="flex-1 flex items-center justify-center bg-[#FBF9FD]">
                                        <NoDataFound
                                            title="No Holidays Found"
                                            subtitle="Get started by adding your first holiday."
                                        >
                                            {permissions['holiday_create'] && (
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
                                            )}
                                        </NoDataFound>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </section>

                {/* Create/Edit Modal */}
                {createModal && (
                    <Modal onClose={() => { setCreateModal(false); resetForm(); }} title={editingId ? "Edit Holiday" : "Add New Holiday"}>
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                                    <CustomSelect
                                        name="holiday_type_id"
                                        value={formData.holiday_type_id}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                holiday_type_id: e.target.value,
                                            })
                                        }
                                        options={holidayTypes.map((t) => ({
                                            value: t.holiday_type_id,
                                            label: t.holiday_type_name,
                                        }))}
                                        placeholder="Select Type"
                                        searchable={true}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                                    Select Dates <span className="text-red-500">*</span>
                                </label>

                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                                    {/* Calendar Left Side */}
                                    <div className="lg:col-span-7 border border-[var(--color-border-secondary)] rounded-xl p-2 bg-[var(--color-bg-primary)] shadow-sm transition-all flex justify-center">
                                        <DatePickerComponent
                                            selectedDates={selectedDates}
                                            setSelectedDates={setSelectedDates}
                                        />
                                    </div>

                                    {/* Selected Dates Right Side */}
                                    <div className="lg:col-span-5 bg-[var(--color-bg-secondary)] border border-[var(--color-border-secondary)] rounded-xl p-4 shadow-sm flex flex-col h-[300px]">
                                        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--color-border-primary)]">
                                            <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">
                                                Selected Dates
                                            </h4>
                                            <span className="bg-[var(--color-primary-lighter)] text-[var(--color-primary-dark)] py-0.5 px-2.5 rounded-full text-xs font-bold">
                                                {selectedDates.length}
                                            </span>
                                        </div>

                                        {selectedDates.length === 0 ? (
                                            <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                                                <div className="w-12 h-12 bg-[var(--color-primary-lightest)] rounded-full flex items-center justify-center mb-3">
                                                    <CalendarDays className="w-6 h-6 text-[var(--color-primary-light)]" />
                                                </div>
                                                <p className="text-sm text-[var(--color-text-secondary)] font-medium">No dates selected</p>
                                                <p className="text-xs text-[var(--color-text-secondary)] mt-1 opacity-70">Click on the calendar to select holidays</p>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
                                                    {selectedDates.map((d) => (
                                                        <div
                                                            key={d}
                                                            className="flex items-center justify-between bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)] hover:border-[var(--color-primary-light)] px-3 py-2.5 rounded-lg text-sm transition-all group shadow-sm hover:shadow"
                                                        >
                                                            <div className="flex items-center gap-2.5 text-[var(--color-text-primary)] font-medium">
                                                                <CalendarDays size={16} className="text-[var(--color-primary)]" />
                                                                <span>{d}</span>
                                                            </div>

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setSelectedDates((prev) =>
                                                                        prev.filter((x) => x !== d)
                                                                    )
                                                                }
                                                                className="text-[var(--color-text-secondary)] hover:text-red-500 hover:bg-red-50 rounded-full p-1.5 transition-colors opacity-70 hover:opacity-100"
                                                                title="Remove Date"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>

                                                {selectedDates.length > 1 && (
                                                    <div className="pt-3 mt-2 border-t border-[var(--color-border-primary)]">
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedDates([])}
                                                            className="w-full text-xs text-red-500 hover:text-red-600 font-medium py-1 transition-colors text-center"
                                                        >
                                                            Clear All Dates
                                                        </button>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <InputField
                                label="Description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Optional description..."
                                textarea
                            />

                            {/* Holiday Paid radio group - Styled as cards */}
                            <div>
                                <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-3">Holiday Status</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <label className={`flex items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all ${formData.holiday_paid === "1" ? 'border-[var(--color-primary)] bg-[var(--color-primary-lighter)] text-[var(--color-primary-dark)] shadow-md' : 'border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] hover:border-[var(--color-primary-light)] text-[var(--color-text-secondary)] hover:shadow-sm'}`}>
                                        <input
                                            type="radio"
                                            name="holiday_paid"
                                            value="1"
                                            className="hidden"
                                            checked={formData.holiday_paid === "1"}
                                            onChange={(e) => setFormData({ ...formData, holiday_paid: e.target.value })}
                                        />
                                        <div className="flex items-center gap-2 font-semibold">
                                            <CheckCircle2 size={20} className={formData.holiday_paid === "1" ? 'text-[var(--color-primary)]' : 'text-gray-400'} />
                                            Paid Holiday
                                        </div>
                                    </label>
                                    <label className={`flex items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all ${formData.holiday_paid === "2" ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-md' : 'border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] hover:border-orange-300 text-[var(--color-text-secondary)] hover:shadow-sm'}`}>
                                        <input
                                            type="radio"
                                            name="holiday_paid"
                                            value="2"
                                            className="hidden"
                                            checked={formData.holiday_paid === "2"}
                                            onChange={(e) => setFormData({ ...formData, holiday_paid: e.target.value })}
                                        />
                                        <div className="flex items-center gap-2 font-semibold">
                                            <XCircle size={20} className={formData.holiday_paid === "2" ? 'text-orange-500' : 'text-gray-400'} />
                                            Unpaid Holiday
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-6 border-t border-[var(--color-border-primary)] mt-8">
                            <button
                                type="button"
                                onClick={() => { setCreateModal(false); resetForm(); }}
                                className="px-6 py-2.5 bg-[var(--color-bg-primary)] hover:bg-[var(--color-bg-hover)] rounded-xl text-[var(--color-text-primary)] font-semibold transition-all border border-[var(--color-border-secondary)] shadow-sm hover:shadow-md"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                className="px-6 py-2.5 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] hover:from-[var(--color-primary-dark)] hover:to-[var(--color-primary-darker)] rounded-xl text-white font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <Check size={18} />
                                        {editingId ? "Update Holiday" : "Add Holiday"}
                                    </>
                                )}
                            </button>
                        </div>
                    </Modal>
                )}


                {/* View Modal */}
                {viewModal.isOpen && viewModal.holidayData && (
                    <Modal onClose={() => setViewModal({ isOpen: false, holidayData: null })} title="Holiday Details">
                        <div className="space-y-6">

                            {/* Top Card */}
                            <div className="border border-[var(--color-border-primary)] rounded-2xl overflow-hidden">

                                <div className="px-6 py-5 bg-[var(--color-bg-primary)] border-b border-[var(--color-border-primary)]">
                                    <div className="flex justify-between items-start gap-4">

                                        <div>
                                            <h3 className="text-2xl font-bold text-[var(--color-text-primary)]">
                                                {viewModal.holidayData.holiday_name}
                                            </h3>

                                            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                                                Holiday Information
                                            </p>
                                        </div>

                                        <span
                                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border ${getTypeColor(
                                                viewModal.holidayData.holiday_type_name
                                            )}`}
                                        >
                                            {getTypeIcon(viewModal.holidayData.holiday_type_name)}
                                            {viewModal.holidayData.holiday_type_name}
                                        </span>

                                    </div>
                                </div>

                                <div className="p-6">

                                    <div className="grid lg:grid-cols-3 gap-5">

                                        {/* Left Content */}
                                        <div className="lg:col-span-2 space-y-5">

                                            {/* Dates */}
                                            <div>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <Calendar
                                                        size={18}
                                                        className="text-[var(--color-primary)]"
                                                    />
                                                    <h4 className="font-semibold text-[var(--color-text-primary)]">
                                                        Holiday Dates
                                                    </h4>
                                                </div>

                                                <div className="flex flex-wrap gap-2">
                                                    {(() => {
                                                        const dates = Array.isArray(
                                                            viewModal.holidayData.holiday_dates
                                                        )
                                                            ? viewModal.holidayData.holiday_dates
                                                            : viewModal.holidayData.holiday_dates
                                                                ? viewModal.holidayData.holiday_dates.split(",")
                                                                : [];

                                                        return dates.map((date, idx) => (
                                                            <span
                                                                key={idx}
                                                                className="px-3 py-2 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)] text-sm"
                                                            >
                                                                {date}
                                                            </span>
                                                        ));
                                                    })()}
                                                </div>
                                            </div>

                                            {/* Description */}
                                            {viewModal.holidayData.description && (
                                                <div>
                                                    <h4 className="font-semibold text-[var(--color-text-primary)] mb-3">
                                                        Description
                                                    </h4>

                                                    <div className="p-4 rounded-xl bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)] h-[150px]">
                                                        <p className="leading-relaxed text-[var(--color-text-secondary)]">
                                                            {viewModal.holidayData.description}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Right Stats */}
                                        <div className="space-y-3">

                                            <div className="rounded-xl border border-[var(--color-border-primary)] p-4">
                                                <p className="text-xs uppercase tracking-wide text-[var(--color-text-secondary)]">
                                                    Year
                                                </p>
                                                <h4 className="text-2xl font-bold text-[var(--color-text-primary)] mt-1">
                                                    {viewModal.holidayData.year || currentYear}
                                                </h4>
                                            </div>

                                            <div className="rounded-xl border border-[var(--color-border-primary)] p-4">
                                                <p className="text-xs uppercase tracking-wide text-[var(--color-text-secondary)]">
                                                    Total Days
                                                </p>

                                                <h4 className="text-2xl font-bold text-[var(--color-text-primary)] mt-1">
                                                    {(() => {
                                                        const dates = Array.isArray(
                                                            viewModal.holidayData.holiday_dates
                                                        )
                                                            ? viewModal.holidayData.holiday_dates
                                                            : viewModal.holidayData.holiday_dates
                                                                ? viewModal.holidayData.holiday_dates.split(",")
                                                                : [];

                                                        return dates.length;
                                                    })()}
                                                </h4>
                                            </div>

                                            <div className="rounded-xl border border-[var(--color-border-primary)] p-4">
                                                <p className="text-xs uppercase tracking-wide text-[var(--color-text-secondary)]">
                                                    Payment
                                                </p>

                                                <h4 className="text-lg font-semibold mt-1">
                                                    {viewModal.holidayData.holiday_paid === "1"
                                                        ? "Paid Holiday"
                                                        : "Unpaid Holiday"}
                                                </h4>
                                            </div>
                                        </div>

                                    </div>

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
    const goToday = () => setCurrentMonth(new Date());

    const getHolidayGradient = (date) => {
        const holidaysOnDate = getHolidayForDate(date);
        if (holidaysOnDate.length === 0) return null;
        const type = holidaysOnDate[0].holiday_type_name;
        if (type === "Public Holiday" || type === "Company Holiday") return "from-violet-500 to-purple-600";
        if (type === "National") return "from-emerald-500 to-teal-600";
        if (type === "Festival") return "from-pink-500 to-rose-600";
        return "from-amber-500 to-orange-600";
    };

    return (
        <div className="bg-white">
            <div className="relative bg-[var(--color-primary-dark)] px-6 py-4 overflow-hidden">
                <div className="absolute inset-0 opacity-20"></div>

                <div className="relative flex items-center justify-between">
                    <button
                        type="button"
                        onClick={prevMonth}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/15 text-white"
                    >
                        <ChevronLeft size={20} />
                    </button>

                    <div className="flex items-center gap-4">
                        <span
                            className="text-3xl text-white"
                        >
                            {monthNames[currentMonth.getMonth()]}
                        </span>

                        <span className="text-white/80 text-lg font-medium">
                            {currentMonth.getFullYear()}
                        </span>

                        {/* <button
                type="button"
                onClick={goToday}
                className="px-3 py-1 rounded-full bg-white/20 text-white text-xs"
            >
                Today
            </button> */}
                    </div>

                    <button
                        type="button"
                        onClick={nextMonth}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/15 text-white"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* Day name pills */}
            <div className="grid grid-cols-7 gap-1.5 px-4 sm:px-6 pt-5 pb-2">
                {dayNames.map((day, i) => (
                    <div
                        key={day}
                        className={`text-center text-[11px] sm:text-sm font-bold  tracking-wider py-2 rounded-lg ${i === 0 || i === 6
                            ? "text-rose-500 bg-rose-50/60"
                            : "text-violet-700 bg-violet-50/60"
                            }`}
                    >
                        {day}
                    </div>
                ))}
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7 gap-1.5 px-4 sm:px-6 pb-6">
                {days.map((date, idx) => {
                    if (!date) return <div key={`empty-${idx}`} className="aspect-square sm:aspect-[1/0.95]"></div>;

                    const holidaysOnDate = getHolidayForDate(date);
                    const holidayGrad = getHolidayGradient(date);
                    const hasHoliday = holidaysOnDate.length > 0;
                    const isToday = date.toDateString() === new Date().toDateString();
                    const dow = date.getDay();
                    const isWeekend = dow === 0 || dow === 6;

                    return (
                        <div
                            key={idx}
                            className={`relative aspect-square sm:aspect-[1/0.95] rounded-xl border p-2 group cursor-pointer transition-all duration-300 overflow-hidden
                                ${hasHoliday
                                    ? `bg-gradient-to-br ${holidayGrad} text-white border-transparent shadow-md hover:shadow-xl hover:-translate-y-0.5`
                                    : isToday
                                        ? "border-violet-500 border-2 bg-gradient-to-br from-violet-50 to-purple-50 hover:shadow-md"
                                        : isWeekend
                                            ? "border-[var(--color-border-secondary)] bg-rose-50/30 hover:bg-rose-50 hover:border-rose-200"
                                            : "border-[var(--color-border-secondary)] bg-white hover:bg-violet-50/40 hover:border-violet-200 hover:shadow-md hover:-translate-y-0.5"
                                }`}
                        >
                            {/* Shine decoration for holidays */}
                            {hasHoliday && (
                                <div className="absolute inset-0 opacity-30 pointer-events-none" style={{
                                    backgroundImage: "radial-gradient(circle at top right, rgba(255,255,255,0.4), transparent 60%)"
                                }}></div>
                            )}

                            {/* Date number */}
                            <div className="relative flex items-start justify-between">
                                <div className={`text-sm sm:text-base font-bold leading-none
                                    ${hasHoliday
                                        ? "text-white"
                                        : isToday
                                            ? "text-violet-700"
                                            : isWeekend
                                                ? "text-rose-500"
                                                : "text-[var(--color-text-primary)]"
                                    }`}>
                                    {date.getDate()}
                                </div>
                                {isToday && !hasHoliday && (
                                    <span className="flex h-2 w-2 relative">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
                                    </span>
                                )}
                                {isToday && hasHoliday && (
                                    <span className="text-[9px] font-bold uppercase tracking-wide bg-white/30 backdrop-blur-sm px-1.5 py-0.5 rounded-full">
                                        Today
                                    </span>
                                )}
                            </div>

                            {/* Holiday name chip */}
                            {hasHoliday && (
                                <div className="absolute bottom-1.5 left-1.5 right-1.5">
                                    <div className="text-[10px] sm:text-[11px] font-semibold text-white truncate bg-white/20 backdrop-blur-sm rounded-md px-1.5 py-0.5">
                                        {holidaysOnDate[0].holiday_name}
                                    </div>
                                    {holidaysOnDate.length > 1 && (
                                        <div className="text-[9px] text-white/90 mt-0.5 font-medium pl-1">
                                            +{holidaysOnDate.length - 1} more
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Hover tooltip */}
                            {hasHoliday && (
                                <div className="hidden group-hover:block absolute z-20 bg-gray-900 text-white text-xs rounded-xl p-3 left-1/2 -translate-x-1/2 top-full mt-2 w-56 shadow-2xl ring-1 ring-white/10">
                                    <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-gray-900 rotate-45"></div>
                                    {holidaysOnDate.map(h => (
                                        <div key={h.holiday_id} className="mb-2 last:mb-0 pb-2 last:pb-0 border-b border-white/10 last:border-0">
                                            <div className="font-semibold text-white">{h.holiday_name}</div>
                                            <div className="text-gray-300 text-[11px] mt-0.5">{h.holiday_type_name}</div>
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
        const d = String(date.getDate()).padStart(2, "0");
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const y = date.getFullYear();
        return `${d}/${m}/${y}`;
    };

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const dayNames = ["S", "M", "T", "W", "T", "F", "S"];

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days = [];

        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            days.push(new Date(year, month, day));
        }

        return days;
    };

    const days = getDaysInMonth(currentMonth);

    const nextMonth = () => {
        setCurrentMonth(
            new Date(
                currentMonth.getFullYear(),
                currentMonth.getMonth() + 1,
                1
            )
        );
    };

    const prevMonth = () => {
        setCurrentMonth(
            new Date(
                currentMonth.getFullYear(),
                currentMonth.getMonth() - 1,
                1
            )
        );
    };

    const handleDateClick = (date) => {
        const formatted = formatDate(date);

        setSelectedDates((prev) => {
            let newDates;

            if (prev.includes(formatted)) {
                newDates = prev.filter((d) => d !== formatted);
            } else {
                newDates = [...prev, formatted];
            }

            return newDates.sort((a, b) => {
                const [dayA, monthA, yearA] = a.split("/").map(Number);
                const [dayB, monthB, yearB] = b.split("/").map(Number);

                if (yearA !== yearB) return yearA - yearB;
                if (monthA !== monthB) return monthA - monthB;

                return dayA - dayB;
            });
        });
    };

    return (
        <div className="w-full max-w-[280px]">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <button
                    onClick={prevMonth}
                    type="button"
                    className="p-1 hover:bg-[var(--color-bg-hover)] rounded-md transition-colors"
                >
                    <ChevronLeft
                        size={16}
                        className="text-[var(--color-text-secondary)]"
                    />
                </button>

                <h3 className="text-xs font-semibold text-[var(--color-text-primary)]">
                    {monthNames[currentMonth.getMonth()]}{" "}
                    {currentMonth.getFullYear()}
                </h3>

                <button
                    onClick={nextMonth}
                    type="button"
                    className="p-1 hover:bg-[var(--color-bg-hover)] rounded-md transition-colors"
                >
                    <ChevronRight
                        size={16}
                        className="text-[var(--color-text-secondary)]"
                    />
                </button>
            </div>

            {/* Days */}
            <div className="grid grid-cols-7 gap-1 text-center">
                {dayNames.map((day, idx) => (
                    <div
                        key={idx}
                        className="text-[10px] font-semibold text-[var(--color-text-secondary)] py-1"
                    >
                        {day}
                    </div>
                ))}

                {days.map((date, idx) => {
                    if (!date) {
                        return (
                            <div
                                key={`empty-${idx}`}
                                className="w-8 h-8"
                            ></div>
                        );
                    }

                    const formatted = formatDate(date);
                    const isSelected =
                        selectedDates.includes(formatted);

                    return (
                        <button
                            key={idx}
                            type="button"
                            onClick={() => handleDateClick(date)}
                            className={`w-8 h-8 text-xs rounded-md border flex items-center justify-center transition-all font-medium
                            
                            ${isSelected
                                    ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                                    : "border-[var(--color-border-secondary)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-primary)]"
                                }`}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-4">
            <div className="w-full max-w-3xl bg-[var(--color-bg-secondary)] rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] overflow-hidden">

                <div className="flex items-center justify-between px-8 py-5 border-b border-[var(--color-border-primary)] bg-[var(--color-primary-dark)]">
                    <div>
                        <h2 className="text-xl font-bold text-white">
                            {title}
                        </h2>
                        <p className="text-sm text-white mt-1">
                            View complete holiday information
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-[var(--color-bg-hover)] transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 max-h-[85vh] overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
}

