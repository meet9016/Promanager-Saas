import { useState, useEffect } from "react";
import { Toast } from '../ui/Toast';
import { Calendar, Plus, History } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axiosInstance";
import CustomSelect from "../comman/CustomSelect";
import NoDataFound from "../comman/NoDataFound";

const PaidLeave = () => {
    const [toast, setToast] = useState(null);

    const { user, isAuthenticated } = useAuth();
    const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(true);
    const [isLoadingLogs, setIsLoadingLogs] = useState(false);
    const [employeeId, setEmployeeId] = useState();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [dropdownOptions, setDropdownOptions] = useState([]);

    // Paid Leave state from response
    const [currentBalance, setCurrentBalance] = useState("0");
    const [transactionLogs, setTransactionLogs] = useState([]);

    // Add New Paid Leave Form State
    const [totalDays, setTotalDays] = useState("");
    const [remark, setRemark] = useState("");
    const [transactionType, setTransactionType] = useState("1");

    // Fetch employee dropdown data
    useEffect(() => {
        const fetchEmployeeList = async () => {
            try {
                if (!isAuthenticated() || !user?.user_id) {
                    setToast({
                        message: 'User authentication required. Please login again.',
                        type: 'error'
                    });
                    setIsLoadingDropdowns(false);
                    return;
                }

                setIsLoadingDropdowns(true);
                const formData = new FormData();

                const response = await api.post('/increment_employee_list', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                if (response.data.success) {
                    const data = response.data.data.employee_list;
                    setDropdownOptions(data);
                } else {
                    setToast({
                        message: response.data.message || 'Failed to load employee dropdown options.',
                        type: 'error'
                    });
                }
            } catch (error) {
                console.error('Error fetching employee dropdown data:', error);
                setToast({
                    message: 'Failed to load employee dropdown options. Please refresh the page.',
                    type: 'error'
                });
            } finally {
                setIsLoadingDropdowns(false);
            }
        };

        fetchEmployeeList();
    }, [user, isAuthenticated]);

    // Fetch existing paid leave log records for employee
    const fetchPaidLeaveLogs = async () => {
        if (!employeeId) return;
        try {
            if (!isAuthenticated() || !user?.user_id) {
                setToast({
                    message: 'User authentication required. Please login again.',
                    type: 'error'
                });
                return;
            }

            setIsLoadingLogs(true);
            const formData = new FormData();
            formData.append('employee_id', employeeId);

            const response = await api.post('/employee_paid_leave_log_list', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data.success) {
                setCurrentBalance(response.data.current_balance || "0");
                setTransactionLogs(response.data.data || []);
            } else {
                setToast({
                    message: response.data.message || 'Failed to load paid leave logs.',
                    type: 'error'
                });
            }
        } catch (error) {
            console.error('Error fetching paid leave logs:', error);
            setToast({
                message: 'Failed to load paid leave logs. Please refresh the page.',
                type: 'error'
            });
        } finally {
            setIsLoadingLogs(false);
        }
    };

    useEffect(() => {
        fetchPaidLeaveLogs();
    }, [user, isAuthenticated, employeeId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!employeeId) {
            setToast({ message: "Employee is required", type: "error" });
            return;
        }

        if (!totalDays || parseFloat(totalDays) <= 0) {
            setToast({ message: "Days count must be greater than 0", type: "error" });
            return;
        }

        try {
            if (!isAuthenticated() || !user?.user_id) {
                setToast({
                    message: 'User authentication required. Please login again.',
                    type: 'error'
                });
                return;
            }
            if (isSubmitting) return;

            setIsSubmitting(true);

            const formData = new FormData();
            formData.append('employee_id', employeeId);
            formData.append('transaction_type', transactionType);
            formData.append('total_days', totalDays);
            formData.append('remark', remark);

            const response = await api.post('/employee_paid_leave_transaction', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data.success) {
                setToast({
                    message: response.data.message || 'Add paid leave successfully.',
                    type: 'success'
                });
                setTotalDays("");
                setRemark("");
                // Refresh log list and balance
                fetchPaidLeaveLogs();
            } else {
                setToast({
                    message: response.data.message || 'Failed to add paid leave.',
                    type: 'error'
                });
            }
        } catch (error) {
            console.error('Error submitting paid leave:', error);
            setToast({
                message: 'Failed to save paid leave. Please refresh the page.',
                type: 'error'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-full bg-[var(--color-bg-primary)]">
            <div className="mx-auto">
                <div className="space-y-4 md:space-y-6">
                    <div className="bg-[var(--color-bg-secondary)] min-h-[calc(100vh-120px)] flex flex-col rounded-xl shadow-sm border border-[var(--color-primary-dark)] w-full relative">
                        {/* Header */}
                        <div className="relative shrink-0">
                            <div className="bg-[var(--color-primary-dark)] px-4 sm:px-6 py-4 rounded-t-xl">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-[var(--color-bg-secondary-20)] rounded-lg">
                                        <Calendar className="w-5 h-5 text-[var(--color-text-white)]" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-[var(--color-text-white)]">
                                        Paid Leave Management
                                    </h3>
                                </div>
                            </div>
                        </div>

                        {/* Main Body */}
                        <div className="p-4 sm:p-6 lg:p-8 bg-[var(--color-bg-secondary)] flex-1 flex flex-col gap-6 rounded-b-xl">
                            {/* Employee Select */}
                            <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-primary)] rounded-xl p-4 sm:p-6 shadow-sm">
                                <div className="w-full sm:max-w-md">
                                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                        Select Employee <span className="text-[var(--color-error)]">*</span>
                                    </label>
                                    <CustomSelect
                                        name="employee_id"
                                        value={employeeId || ""}
                                        onChange={(e) => setEmployeeId(e.target.value)}
                                        options={dropdownOptions.map(option => ({
                                            value: option.employee_id,
                                            label: option.full_name,
                                        }))}
                                        placeholder="Select Employee"
                                        required
                                        searchable={true}
                                    />
                                </div>
                            </div>

                            {employeeId ? (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
                                    {/* Left Panel: Form & Balance */}
                                    <div className="lg:col-span-1 space-y-6">
                                        {/* Balance Card */}
                                        <div className="bg-gradient-to-br from-[var(--color-primary-dark)] to-[var(--color-primary-darkest)] border border-[var(--color-primary-dark)] rounded-xl p-6 shadow-lg text-[var(--color-text-white)] relative overflow-hidden">
                                            <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-4 translate-y-4">
                                                <Calendar className="w-32 h-32" />
                                            </div>
                                            <div className="relative z-10 space-y-2">
                                                <span className="text-xs font-semibold uppercase tracking-wider opacity-85">Current Paid Leave Balance</span>
                                                <div className="flex items-baseline space-x-2">
                                                    <span className="text-4xl font-extrabold">{currentBalance}</span>
                                                    <span className="text-lg opacity-90">Days</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Form */}
                                        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-primary)] rounded-xl p-4 sm:p-6 shadow-sm">
                                            <h4 className="text-md font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
                                                <Plus className="w-5 h-5 text-[var(--color-primary)]" />
                                                Add Paid Leave Transaction
                                            </h4>
                                            <form onSubmit={handleSubmit} className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                                                        Transaction Type <span className="text-[var(--color-error)]">*</span>
                                                    </label>
                                                    <CustomSelect
                                                        name="transaction_type"
                                                        value={transactionType}
                                                        onChange={(e) => setTransactionType(e.target.value)}
                                                        options={[
                                                            { value: "1", label: "Credit (+)" },
                                                            { value: "2", label: "Debit (-)" }
                                                        ]}
                                                        placeholder="Select Transaction Type"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                                                        Total Days <span className="text-[var(--color-error)]">*</span>
                                                    </label>
                                                    <input
                                                        type="number"
                                                        step="0.5"
                                                        value={totalDays}
                                                        onChange={(e) => setTotalDays(e.target.value)}
                                                        className="w-full px-3 py-2 border border-[var(--color-border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]"
                                                        placeholder="e.g. 7"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                                                        Remark / Notes
                                                    </label>
                                                    <textarea
                                                        value={remark}
                                                        onChange={(e) => setRemark(e.target.value)}
                                                        className="w-full px-3 py-2 border border-[var(--color-border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]"
                                                        placeholder="Add leaves remark"
                                                        rows="3"
                                                    />
                                                </div>
                                                <button
                                                    type="submit"
                                                    disabled={isSubmitting}
                                                    className="w-full py-2 bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] rounded-lg transition-all shadow-sm hover:shadow-md font-medium text-sm disabled:opacity-50"
                                                >
                                                    {isSubmitting ? "Processing..." : (transactionType === "1" ? "Credit Leaves" : "Debit Leaves")}
                                                </button>
                                            </form>
                                        </div>
                                    </div>

                                    {/* Right Panel: Transaction Log */}
                                    <div className="lg:col-span-2 bg-[var(--color-bg-card)] border border-[var(--color-border-primary)] rounded-xl p-4 sm:p-6 shadow-sm flex flex-col min-h-[400px]">
                                        <h4 className="text-md font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
                                            <History className="w-5 h-5 text-[var(--color-primary)]" />
                                            Transaction History Log
                                        </h4>

                                        {isLoadingLogs ? (
                                            <div className="flex-1 flex items-center justify-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]"></div>
                                            </div>
                                        ) : transactionLogs.length === 0 ? (
                                            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-[var(--color-border-primary)] rounded-xl bg-[var(--color-bg-primary)]">
                                                <Calendar className="w-12 h-12 text-[var(--color-text-secondary)] opacity-50 mb-3" />
                                                <h5 className="text-sm font-semibold text-[var(--color-text-primary)]">No Transaction Found</h5>
                                                <p className="text-xs text-[var(--color-text-secondary)] mt-1">Leaves transaction logs will appear here once added or used.</p>
                                            </div>
                                        ) : (
                                            <div className="flex-1 overflow-x-auto custom-scrollbar">
                                                <table className="w-full text-sm text-left">
                                                    <thead>
                                                        <tr className="border-b border-[var(--color-border-primary)] text-[var(--color-text-secondary)] font-medium bg-[var(--color-bg-primary)]">
                                                            <th className="py-3 px-4 rounded-l-lg">Date</th>
                                                            <th className="py-3 px-4">Description</th>
                                                            <th className="py-3 px-4 text-center">Type</th>
                                                            <th className="py-3 px-4 text-center">Days</th>
                                                            <th className="py-3 px-4 rounded-r-lg">Created By</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-[var(--color-border-primary)]">
                                                        {transactionLogs.map((log) => {
                                                            const isCredit = log.transaction_type === "1";
                                                            return (
                                                                <tr key={log.id} className="hover:bg-[var(--color-bg-hover)] transition-colors">
                                                                    <td className="py-3 px-4 font-medium text-[var(--color-text-primary)]">
                                                                        {log.created_at}
                                                                    </td>
                                                                    <td className="py-3 px-4">
                                                                        <div className="font-semibold text-[var(--color-text-primary)]">{log.source_type_name}</div>
                                                                        {log.remark && <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">{log.remark}</div>}
                                                                    </td>
                                                                    <td className="py-3 px-4 text-center">
                                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${isCredit
                                                                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                                                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                                                            }`}>
                                                                            {log.transaction_type_name}
                                                                        </span>
                                                                    </td>
                                                                    <td className={`py-3 px-4 text-center font-bold ${isCredit ? "text-green-600" : "text-red-600"
                                                                        }`}>
                                                                        {isCredit ? `+${log.total_days}` : `-${log.total_days}`}
                                                                    </td>
                                                                    <td className="py-3 px-4 text-[var(--color-text-secondary)]">
                                                                        {log.created_by_name}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 flex items-center justify-center bg-[#FBF9FD] border border-[var(--color-border-primary)] rounded-xl p-4 sm:p-6 shadow-sm">
                                    <NoDataFound
                                        title="No Employee Selected"
                                        subtitle="Please select an employee to view or add paid leave transactions."
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default PaidLeave;
