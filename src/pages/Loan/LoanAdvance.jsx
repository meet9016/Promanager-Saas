import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Eye, Search, RefreshCw, XCircle, CreditCard, ChevronDown, ChevronUp, Users, IndianRupee, ArrowLeft, Trash2 } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosInstance';
import { useSelector } from 'react-redux';
import { Toast } from '../../Components/ui/Toast';
import { LoanDetailsModal } from '../../Components/ui/LoanDetailsModal';
import { AdvanceDetailsModal } from '../../Components/ui/AdvanceDetailsModal';
import { ConfirmDialog } from '../../Components/ui/ConfirmDialog';
import LoadingSpinner from "../../Components/Loader/LoadingSpinner";

const SORT_DIRECTIONS = {
    ASCENDING: 'ascending',
    DESCENDING: 'descending'
};

const COLUMN_KEYS = {
    EMPLOYEE_NAME: 'employee_name',
    LOAN_TYPE: 'loan_type',
    AMOUNT: 'amount',
    INTEREST_RATE: 'interest_rate',
    TENURE: 'tenure',
    INSTALLMENT: 'installment_amount',
    OUTSTANDING: 'outstanding',
    STATUS: 'loan_status'
};

const KEY_MAPPING = {
    [COLUMN_KEYS.EMPLOYEE_NAME]: 'employee_full_name',
    [COLUMN_KEYS.LOAN_TYPE]: 'loan_type_name',
    [COLUMN_KEYS.AMOUNT]: 'amount',
    [COLUMN_KEYS.INTEREST_RATE]: 'interest_rate',
    [COLUMN_KEYS.TENURE]: 'tenure',
    [COLUMN_KEYS.INSTALLMENT]: 'installment_amount',
    [COLUMN_KEYS.STATUS]: 'loan_status'
};

const LoanAdvance = () => {
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredLoans, setFilteredLoans] = useState([]);
    const [filter, setFilter] = useState('All Loans/Advances');
    const [toast, setToast] = useState(null);
    const [sortConfig, setSortConfig] = useState({
        key: null,
        direction: SORT_DIRECTIONS.ASCENDING
    });

    const [dropdownData, setDropdownData] = useState({
        loan_type_list: [],
        loan_priority_list: [],
        loan_status_list: []
    });
    const [dropdownLoading, setDropdownLoading] = useState(false);

    // Loan modal states
    const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
    const [loanDetails, setLoanDetails] = useState([]);
    const [loanModalLoading, setLoanModalLoading] = useState(false);

    // Advance modal states
    const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
    const [advanceDetails, setAdvanceDetails] = useState(null);
    const [advanceModalLoading, setAdvanceModalLoading] = useState(false);
    const [currentAdvanceId, setCurrentAdvanceId] = useState(null);

    // Delete confirmation modal states
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [loanToDelete, setLoanToDelete] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const navigate = useNavigate();
    const { user, isAuthenticated, logout } = useAuth();
    const permissions = useSelector(state => state.permissions) || {};

    const showToast = useCallback((message, type = 'info') => {
        setToast({ message, type });
    }, []);

    const hideToast = useCallback(() => {
        setToast(null);
    }, []);

    const getFilterOptions = useMemo(() => {
        const baseOptions = ['All Loans/Advances'];
        const statusOptions = dropdownData.loan_status_list.map(status => status.name);
        return [...baseOptions, ...statusOptions];
    }, [dropdownData.loan_status_list]);

    const calculateOutstandingAmount = useCallback((loan) => {
        try {
            const amount = parseFloat(loan.amount || 0);

            if (loan.loan_status === 'Closed' || loan.status === '0') {
                return 0;
            }

            return amount;
        } catch (error) {
            console.error('Error calculating outstanding amount:', error);
            return 0;
        }
    }, []);

    const fetchDropdownData = useCallback(async () => {
        try {
            setDropdownLoading(true);
            const response = await api.post('loan_drop_down_list');

            if (response.data.success) {
                const data = response.data.data;
                setDropdownData({
                    loan_type_list: data.loan_type_list || [],
                    loan_priority_list: data.loan_priority_list || [],
                    loan_status_list: data.loan_status_list || []
                });
            } else {
                showToast(response.data.message || 'Failed to fetch dropdown data', 'error');
            }
        } catch (err) {
            console.error('Error fetching dropdown data:', err);
            showToast('Failed to load dropdown data', 'error');
        } finally {
            setDropdownLoading(false);
        }
    }, [showToast]);

    const fetchLoanData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            if (!user?.user_id) {
                throw new Error('User ID is required');
            }

            const formData = new FormData();
            formData.append('user_id', user.user_id);

            const response = await api.post('loan_list', formData);

            if (response.data?.success) {
                const loanData = response.data.data || response.data.loans || [];
                setLoans(Array.isArray(loanData) ? loanData : []);
            } else if (Array.isArray(response.data)) {
                setLoans(response.data);
            } else {
                throw new Error(response.data?.message || 'Failed to fetch loan data');
            }

        } catch (error) {
            console.error("Fetch loans error:", error);
            const errorMessage = error.response?.data?.message || error.message || "An unexpected error occurred";

            if (error.response?.status === 401) {
                setError("Your session has expired. Please login again.");
                setTimeout(() => logout?.(), 2000);
            } else if (error.response?.status === 403) {
                setError("You don't have permission to view loans.");
            } else if (error.response?.status >= 500) {
                setError("Server error. Please try again later.");
            } else {
                setError(errorMessage);
            }
            setLoans([]);
        } finally {
            setLoading(false);
        }
    }, [user, logout]);

    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            let filtered = loans;

            if (filter !== 'All Loans/Advances') {
                filtered = filtered.filter(loan => loan.loan_status === filter);
            }

            if (searchQuery) {
                filtered = filtered.filter(loan => {
                    return Object.values(loan).some(value =>
                        String(value).toLowerCase().includes(searchQuery.toLowerCase())
                    );
                });
            }

            setFilteredLoans(filtered);
        }, 300);

        return () => clearTimeout(delayDebounce);
    }, [searchQuery, loans, filter]);

    useEffect(() => {
        fetchDropdownData();
    }, [fetchDropdownData]);

    useEffect(() => {
        if (isAuthenticated() && user?.user_id) {
            fetchLoanData();
        }
    }, [isAuthenticated, fetchLoanData, user?.user_id]);

    const requestSort = useCallback((key) => {
        setSortConfig(prevConfig => {
            const direction = prevConfig.key === key && prevConfig.direction === SORT_DIRECTIONS.ASCENDING
                ? SORT_DIRECTIONS.DESCENDING
                : SORT_DIRECTIONS.ASCENDING;
            return { key, direction };
        });
    }, []);

    const sortedLoans = useMemo(() => {
        const source = filteredLoans;

        if (!sortConfig.key) return source;

        return [...source].sort((a, b) => {
            const actualKey = KEY_MAPPING[sortConfig.key] || sortConfig.key;
            let aValue = a[actualKey] || '';
            let bValue = b[actualKey] || '';

            if (['amount', 'interest_rate', 'tenure', 'installment_amount'].includes(actualKey)) {
                aValue = parseFloat(aValue) || 0;
                bValue = parseFloat(bValue) || 0;
            }

            if (aValue < bValue) {
                return sortConfig.direction === SORT_DIRECTIONS.ASCENDING ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === SORT_DIRECTIONS.ASCENDING ? 1 : -1;
            }
            return 0;
        });
    }, [filteredLoans, sortConfig]);

    const handleAddLoanRedirect = useCallback(() => {
        navigate('/add-loan-advance');
    }, [navigate]);

    // Handle view details based on loan type
    const handleViewDetails = useCallback(async (loan) => {
        try {
            if (!user?.user_id) {
                showToast('User information not available', 'error');
                return;
            }

            const isAdvance = loan.loan_type_name?.toLowerCase() === 'advance';

            if (isAdvance) {
                // Fetch advance details
                setIsAdvanceModalOpen(true);
                setAdvanceModalLoading(true);
                setAdvanceDetails(null);
                setCurrentAdvanceId(loan.loan_id);

                const formData = new FormData();
                formData.append('user_id', user.user_id);
                formData.append('loan_id', loan.loan_id);

                const response = await api.post('single_advance_list', formData);

                if (response.data.success) {
                    setAdvanceDetails(response.data.data);
                } else {
                    showToast(response.data.message || 'Failed to fetch advance details', 'error');
                    setAdvanceDetails(null);
                }
                setAdvanceModalLoading(false);
            } else {
                // Fetch loan details
                setIsLoanModalOpen(true);
                setLoanModalLoading(true);
                setLoanDetails([]);

                const formData = new FormData();
                formData.append('user_id', user.user_id);
                formData.append('loan_id', loan.loan_id);

                const response = await api.post('single_loan_list', formData);

                if (response.data.success) {
                    const responseData = response.data.data;
                    // Extract loan_list from the nested data structure
                    const loanList = responseData.loan_list || [];
                    const validDetails = Array.isArray(loanList) ? loanList : [];

                    // Store summary data along with loan details
                    setLoanDetails({
                        summary: {
                            total_amount: responseData.total_amount,
                            paid_amount: responseData.paid_amount,
                            remaining_amount: responseData.remaining_amount,
                            total_installment: responseData.total_installment,
                            total_paid_installment: responseData.total_paid_installment,
                            total_unpaid_installment: responseData.total_unpaid_installment
                        },
                        installments: validDetails
                    });
                } else {
                    showToast(response.data.message || 'Failed to fetch loan details', 'error');
                    setLoanDetails({ summary: null, installments: [] });
                }
                setLoanModalLoading(false);
            }
        } catch (error) {
            console.error('Error fetching details:', error);
            showToast('Failed to load details', 'error');
            setLoanDetails([]);
            setAdvanceDetails(null);
            setLoanModalLoading(false);
            setAdvanceModalLoading(false);
        }
    }, [user, showToast]);

    // Handle add advance payment
    const handleAddAdvancePayment = useCallback(async (amount) => {
        try {
            if (!user?.user_id || !currentAdvanceId) {
                throw new Error('Required information missing');
            }

            const formData = new FormData();
            formData.append('user_id', user.user_id);
            formData.append('advance_id', currentAdvanceId);
            formData.append('amount', amount);

            const response = await api.post('add_advance_payment', formData);

            if (response.data.success) {
                showToast('Payment added successfully', 'success');

                // Refresh advance details
                const detailsFormData = new FormData();
                detailsFormData.append('user_id', user.user_id);
                detailsFormData.append('loan_id', currentAdvanceId);

                const detailsResponse = await api.post('single_advance_list', detailsFormData);
                if (detailsResponse.data.success) {
                    setAdvanceDetails(detailsResponse.data.data);
                }

                // Refresh loan list
                await fetchLoanData();
            } else {
                throw new Error(response.data.message || 'Failed to add payment');
            }
        } catch (error) {
            console.error('Error adding payment:', error);
            throw error;
        }
    }, [user, currentAdvanceId, showToast, fetchLoanData]);

    // Handle mark loan installment as paid
    const handleMarkLoanAsPaid = useCallback(async (loanItemsId) => {
        try {
            if (!user?.user_id) {
                throw new Error('User information not available');
            }

            const currentInstallment = loanDetails.installments?.find(
                detail => detail.loan_items_id === loanItemsId
            );

            if (!currentInstallment) {
                throw new Error('Installment not found');
            }

            const formData = new FormData();
            formData.append('user_id', user.user_id);
            formData.append('loan_items_id', loanItemsId);

            const response = await api.post('add_loan_payment', formData);

            if (response.data.success) {
                showToast('Installment marked as paid successfully', 'success');

                const currentLoanId = currentInstallment.loan_id;

                if (currentLoanId) {
                    const detailsFormData = new FormData();
                    detailsFormData.append('user_id', user.user_id);
                    detailsFormData.append('loan_id', currentLoanId);

                    const detailsResponse = await api.post('single_loan_list', detailsFormData);

                    if (detailsResponse.data.success) {
                        const responseData = detailsResponse.data.data;
                        const loanList = responseData.loan_list || [];
                        const validDetails = Array.isArray(loanList) ? loanList : [];

                        setLoanDetails({
                            summary: {
                                total_amount: responseData.total_amount,
                                paid_amount: responseData.paid_amount,
                                remaining_amount: responseData.remaining_amount,
                                total_installment: responseData.total_installment,
                                total_paid_installment: responseData.total_paid_installment,
                                total_unpaid_installment: responseData.total_unpaid_installment
                            },
                            installments: validDetails
                        });
                    }
                }

                await fetchLoanData();
            } else {
                throw new Error(response.data.message || 'Failed to mark as paid');
            }
        } catch (error) {
            console.error('Error marking as paid:', error);
            showToast(error.message || 'Failed to mark installment as paid', 'error');
        }
    }, [user, showToast, fetchLoanData, loanDetails]);


    const handleDeleteClick = useCallback((loan) => {
        setLoanToDelete(loan);
        setIsDeleteModalOpen(true);
    }, []);

    const handleDeleteConfirm = useCallback(async () => {
        if (!loanToDelete || !user?.user_id) {
            showToast('Unable to delete loan. Missing required information.', 'error');
            return;
        }

        try {
            setDeleteLoading(true);

            const formData = new FormData();
            formData.append('user_id', user.user_id);
            formData.append('loan_id', loanToDelete.loan_id);

            const response = await api.post('loan_delete', formData);

            if (response.data.success) {
                showToast('Loan deleted successfully', 'success');
                setLoans(prevLoans => prevLoans.filter(loan => loan.loan_id !== loanToDelete.loan_id));
                setIsDeleteModalOpen(false);
                setLoanToDelete(null);
            } else {
                showToast(response.data.message || 'Failed to delete loan', 'error');
            }
        } catch (error) {
            console.error('Error deleting loan:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to delete loan';
            showToast(errorMessage, 'error');
        } finally {
            setDeleteLoading(false);
        }
    }, [loanToDelete, user, showToast]);

    const handleDeleteCancel = useCallback(() => {
        setIsDeleteModalOpen(false);
        setLoanToDelete(null);
    }, []);

    const handleFilterChange = useCallback((newFilter) => {
        setFilter(newFilter);
    }, []);

    const closeLoanModal = useCallback(() => {
        setIsLoanModalOpen(false);
        setLoanDetails({ summary: null, installments: [] });
        setLoanModalLoading(false);
    }, []);

    const closeAdvanceModal = useCallback(() => {
        setIsAdvanceModalOpen(false);
        setAdvanceDetails(null);
        setAdvanceModalLoading(false);
        setCurrentAdvanceId(null);
    }, []);

    const renderSortIcon = useCallback((key) => {
        if (sortConfig.key !== key) {
            return <ChevronDown className="ml-1 h-4 w-4 text-[var(--color-text-muted)]" />;
        }
        return sortConfig.direction === SORT_DIRECTIONS.ASCENDING ?
            <ChevronUp className="ml-1 h-4 w-4 text-[var(--color-primary)]" /> :
            <ChevronDown className="ml-1 h-4 w-4 text-[var(--color-primary)]" />;
    }, [sortConfig]);

    const renderStatusBadge = useCallback((status) => {
        const statusColors = {
            'Approved': 'bg-green-100 text-green-800',
            'Rejected': 'bg-[var(--color-error-light)] text-red-800',
            'Pending': 'bg-yellow-100 text-yellow-800',
            'Under Review': 'bg-[var(--color-primary-lighter)] text-[var(--color-primary-darkest)]',
            'Closed': 'bg-[var(--color-bg-gradient-start)] text-gray-800'
        };

        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-[var(--color-bg-gradient-start)] text-gray-800'}`}>
                {status || 'Unknown'}
            </span>
        );
    }, []);

    const renderLoanTypeBadge = useCallback((loanType) => {
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${loanType === 'Loan'
                ? 'bg-[var(--color-primary-lighter)] text-[var(--color-twxt-white)]'
                : 'bg-green-100 text-green-800'
                }`}>
                {loanType || '--'}
            </span>
        );
    }, []);

    const formatCurrency = useCallback((amount) => {
        return `₹${parseFloat(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    }, []);

    if (!isAuthenticated()) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="min-h-screen bg-[var(--color-bg-primary)]">
            <div className="p-8  mx-auto">
                {toast && (
                    <Toast
                        message={toast.message}
                        type={toast.type}
                        onClose={hideToast}
                    />
                )}

                <LoanDetailsModal
                    isOpen={isLoanModalOpen}
                    onClose={closeLoanModal}
                    loanDetails={loanDetails}
                    loading={loanModalLoading}
                    onMarkAsPaid={handleMarkLoanAsPaid}
                />

                <AdvanceDetailsModal
                    isOpen={isAdvanceModalOpen}
                    onClose={closeAdvanceModal}
                    advanceDetails={advanceDetails}
                    loading={advanceModalLoading}
                    onAddPayment={handleAddAdvancePayment}
                />

                <ConfirmDialog
                    isOpen={isDeleteModalOpen}
                    onClose={handleDeleteCancel}
                    onConfirm={handleDeleteConfirm}
                    title="Delete Loan"
                    message={`Are you sure you want to delete the loan for ${loanToDelete?.employee_full_name || 'this employee'}? This action cannot be undone.`}
                    confirmText={deleteLoading ? "Deleting..." : "Delete"}
                    cancelText="Cancel"
                    type="danger"
                />

                <div className="bg-[var(--color-bg-secondary)] rounded-2xl shadow-xl mb-8 overflow-hidden">
                    <div className="bg-gradient-to-r from-[var(--color-primary-dark)] to-[var(--color-primary-darker)] p-8">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate(-1)}
                                className="flex items-center gap-2 text-[var(--color-text-white)] hover:text-[var(--color-text-white)] transition-colors bg-[var(--color-bg-secondary-20)] hover:bg-[var(--color-bg-secondary-30)] px-4 py-2 rounded-lg backdrop-blur-sm"
                            >
                                <ArrowLeft size={18} />
                                Back
                            </button>
                            <div className="flex items-center gap-3">
                                <div>
                                    <h1 className="text-2xl font-bold text-[var(--color-text-white)]">
                                        Loan & Advance Management
                                    </h1>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-primary-dark)] overflow-hidden shadow-sm">
                    <div className="px-6 py-3 border-b border-[var(--color-primary-light)] bg-[var(--color-primary-dark)]">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center">
                                <CreditCard className="h-6 w-6 text-[var(--color-text-white)] mr-2" />
                                <h3 className="text-lg font-medium text-[var(--color-text-white)]">
                                    Total Loans/Advances
                                </h3>
                            </div>

                            <div className="flex items-center gap-3">
                                <select
                                    value={filter}
                                    onChange={(e) => handleFilterChange(e.target.value)}
                                    className="px-3 py-2 border border-[var(--color-border-secondary)] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-text-white)] focus:border-[var(--color-border-primary)] text-sm"
                                    disabled={loading || dropdownLoading}
                                >
                                    {getFilterOptions.map(option => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>

                                <div className="relative w-full sm:w-64">
                                    <input
                                        type="text"
                                        placeholder="Search loans..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-[var(--color-border-secondary)] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-text-white)] focus:border-[var(--color-border-primary)] text-sm"
                                    />
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--color-text-muted)]" />
                                </div>

                                {permissions['loan_create'] && (
                                    <button
                                        onClick={handleAddLoanRedirect}
                                        className="flex items-center gap-2 bg-[var(--color-bg-secondary)] text-[var(--color-primary-dark)] hover:bg-[var(--color-bg-primary)] px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                        disabled={loading}
                                    >
                                        <Plus className="h-4 w-4" />
                                        Add Loan/Advance
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="">
                            <LoadingSpinner />
                        </div>
                    ) : error ? (
                        <div className="px-6 py-12 text-center">
                            <div className="bg-[var(--color-error-light)] border border-[var(--color-border-error)] rounded-lg p-8">
                                <XCircle className="w-12 h-12 text-[var(--color-error)] mx-auto mb-4" />
                                <p className="text-[var(--color-error-dark)] text-lg font-medium mb-2">Error Loading Loans</p>
                                <p className="text-[var(--color-text-error)] mb-4">{error}</p>
                                <button
                                    onClick={fetchLoanData}
                                    className="inline-flex items-center space-x-2 bg-[var(--color-error-light)] text-[var(--color-error-dark)] px-4 py-2 rounded-md hover:bg-[var(--color-error-lighter)] transition-colors"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    <span>Try Again</span>
                                </button>
                            </div>
                        </div>
                    ) : loans.length === 0 ? (
                        <div className="px-6 py-12 text-center">
                            <div className="bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] rounded-lg p-8">
                                <div className="w-16 h-16 bg-[var(--color-bg-gray-light)] rounded-full flex items-center justify-center mx-auto mb-4">
                                    <IndianRupee className="w-8 h-8 text-[var(--color-text-muted)]" />
                                </div>
                                <p className="text-[var(--color-text-secondary)] text-lg font-medium mb-2">No Loans Found</p>
                                <p className="text-[var(--color-text-secondary)] text-sm mb-4">
                                    You haven't added any loans or advances yet. Create your first loan to get started.
                                </p>
                                {permissions['loan_create'] && (
                                    <button
                                        onClick={handleAddLoanRedirect}
                                        className="inline-flex items-center space-x-2 bg-[var(--color-primary-dark)] text-[var(--color-text-white)] px-4 py-2 rounded-md hover:bg-[var(--color-primary-darker)] transition-colors"
                                    >
                                        <Plus className="w-4 h-4" />
                                        <span>Create First Loan</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : sortedLoans.length === 0 ? (
                        <div className="px-6 py-8 text-center text-[var(--color-text-secondary)]">
                            <IndianRupee className="h-12 w-12 mx-auto mb-4 text-[var(--color-text-muted)]" />
                            <p className="text-lg font-medium">No loans found for the selected filter</p>
                            <p className="text-sm">Try adjusting your search or filter criteria</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-[var(--color-border-divider)]">
                                <thead className="bg-[var(--color-primary-lightest)]">
                                    <tr>
                                        {[
                                            { key: COLUMN_KEYS.EMPLOYEE_NAME, label: 'Employee Name' },
                                            { key: COLUMN_KEYS.LOAN_TYPE, label: 'Loan Type' },
                                            { key: COLUMN_KEYS.AMOUNT, label: 'Amount' },
                                            { key: COLUMN_KEYS.INTEREST_RATE, label: 'Interest Rate' },
                                            { key: COLUMN_KEYS.TENURE, label: 'Tenure (Months)' },
                                            { key: COLUMN_KEYS.INSTALLMENT, label: 'Installment Amount' },
                                            { key: COLUMN_KEYS.OUTSTANDING, label: 'Outstanding Amount' },
                                            { key: COLUMN_KEYS.STATUS, label: 'Status' }
                                        ].map(({ key, label }) => (
                                            <th key={`header-${key}`} className="px-5 py-3 text-left">
                                                <button
                                                    className="flex items-center text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider hover:text-[var(--color-text-secondary)]"
                                                    onClick={() => requestSort(key)}
                                                >
                                                    {label}
                                                    {renderSortIcon(key)}
                                                </button>
                                            </th>
                                        ))}
                                        {(permissions?.loan_edit || permissions?.loan_view || permissions?.loan_delete) && (
                                            <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                                                Actions
                                            </th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="bg-[var(--color-bg-secondary)] divide-y divide-[var(--color-border-divider)]">
                                    {sortedLoans.map((loan, index) => {
                                        const loanId = loan.loan_id || `loan-${index}`;
                                        const outstandingAmount = calculateOutstandingAmount(loan);

                                        return (
                                            <tr
                                                key={`loan-${loanId}`}
                                                className="hover:bg-[var(--color-bg-primary)] transition-colors"
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-primary)]">
                                                    <div className="flex items-center space-x-2">
                                                        <div className="w-8 h-8 bg-[var(--color-primary-lighter)] rounded-full flex items-center justify-center">
                                                            <Users className="w-4 h-4 text-[var(--color-primary-dark)]" />
                                                        </div>
                                                        <span>{loan.employee_full_name || '--'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-primary)]">
                                                    {renderLoanTypeBadge(loan.loan_type_name)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[var(--color-text-primary)]">
                                                    {formatCurrency(loan.amount)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-primary)]">
                                                    {loan.interest_rate}%
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-primary)]">
                                                    {loan.tenure} months
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-primary)]">
                                                    {formatCurrency(loan.installment_amount)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[var(--color-text-primary)]">
                                                    {formatCurrency(outstandingAmount)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    {renderStatusBadge(loan.loan_status)}
                                                </td>
                                                {(permissions?.loan_edit || permissions?.loan_view || permissions?.loan_delete) && (
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <div className="flex space-x-2">
                                                            {permissions['loan_view'] && (
                                                                <button
                                                                    onClick={() => handleViewDetails(loan)}
                                                                    className="p-2 rounded-md transition-colors text-[var(--color-primary-dark)] hover:text-[var(--color-primary-darkest)] hover:bg-[var(--color-primary-lightest)]"
                                                                    title="View Details"
                                                                >
                                                                    <Eye className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                            {permissions['loan_delete'] && (
                                                                <button
                                                                    onClick={() => handleDeleteClick(loan)}
                                                                    className="p-2 rounded-md transition-colors text-[var(--color-text-error)] hover:text-red-900 hover:bg-[var(--color-error-light)]"
                                                                    title="Delete Loan"
                                                                    disabled={deleteLoading}
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LoanAdvance;