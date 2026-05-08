import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  IndianRupee,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Users,
  Calendar,
  RefreshCw,
  Search,
  CreditCard,
  X,
  CheckCircle,
  Trash2,
  Eye
} from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosInstance';
import { Toast } from '../../Components/ui/Toast';
import { useSelector } from 'react-redux';
import Pagination from '../../Components/Pagination';
import LoadingSpinner from "../../Components/Loader/LoadingSpinner"

const SORT_DIRECTIONS = {
  ASCENDING: 'ascending',
  DESCENDING: 'descending'
};

const COLUMN_KEYS = {
  EMPLOYEE_CODE: 'employee_code',
  FULL_NAME: 'full_name',
  DEPARTMENT: 'department_name',
  MONTH_YEAR: 'month_year',
  TOTAL_SALARY: 'total_salary',
  FINAL_SALARY: 'final_salary',
  TOTAL_PAY_SALARY: 'total_pay_salary',
  PAYMENT_STATUS: 'payment_status'
};

const PAYMENT_STATUS = {
  UNPAID: '1',
  PAID: '2'
};

const PAYMENT_MODES = {
  '1': 'Cash',
  '2': 'Bank Transfer',
  '3': 'Check',
  '4': 'Online'
};

export default function FinalizePayroll() {
  const [salaryRecords, setSalaryRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paginationLoading, setPaginationLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [paymentData, setPaymentData] = useState({
    payment_mode: '1',
    remark: ''
  });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const permissions = useSelector(state => state.permissions) || {};

  const navigate = useNavigate();
  const [toast, setToast] = useState(null);

  // Set default to current month and year
  const currentDate = new Date();
  const currentMonth = (currentDate.getMonth() + 1).toString().padStart(2, '0');
  const currentYear = currentDate.getFullYear().toString();

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: SORT_DIRECTIONS.ASCENDING
  });

  const { user, isAuthenticated, logout } = useAuth();

  // Generate month options
  const monthOptions = [
    { value: '', label: 'All Months' },
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  // Generate year options (current year and previous 5 years)
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = 0; i <= 5; i++) {
      years.push({
        value: (currentYear - i).toString(),
        label: (currentYear - i).toString()
      });
    }
    return years;
  }, []);
  const isCurrentOrFutureMonth = useCallback((selectedYear, selectedMonth) => {
    if (!selectedYear || !selectedMonth) return false;

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // getMonth() returns 0-11

    const selectedYearNum = parseInt(selectedYear);
    const selectedMonthNum = parseInt(selectedMonth);

    // Check if selected year is future
    if (selectedYearNum > currentYear) return true;

    // Check if selected year is current and month is current or future
    if (selectedYearNum === currentYear && selectedMonthNum > currentMonth) return true;

    return false;
  }, []);

  const isFutureMonth = useCallback((selectedYear, selectedMonth) => {
    if (!selectedYear || !selectedMonth) return false;

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // getMonth() returns 0-11

    const selectedYearNum = parseInt(selectedYear);
    const selectedMonthNum = parseInt(selectedMonth);

    // Check if selected year is future
    if (selectedYearNum > currentYear) return true;

    // Check if selected year is current and month is future
    if (selectedYearNum === currentYear && selectedMonthNum > currentMonth) return true;

    return false;
  }, []);

  // Fetch salary records with backend search and pagination
  const fetchSalaryRecords = useCallback(async (page = 1, search = '', resetData = false) => {
    try {
      if (isFutureMonth(selectedYear, selectedMonth)) {
        setSalaryRecords([]);
        setTotalPages(1);
        setTotalRecords(0);
        setCurrentPage(1);
        setError("Salary records for the future months are not yet available. Please select a previous month to view the data.");
        setLoading(false);
        setPaginationLoading(false);
        return;
      }

      if (resetData) {
        setLoading(true);
        setCurrentPage(1);
        page = 1;
      } else {
        setPaginationLoading(true);
      }
      setError(null);

      if (!user?.user_id) {
        throw new Error('User ID is required');
      }

      const formData = new FormData();
      formData.append('page', page.toString());

      // Add search parameter if search query exists
      if (search && search.trim() !== '') {
        formData.append('search', search.trim());
      }

      // Add year_month parameter in format YYYY-MM
      if (selectedYear && selectedMonth) {
        const yearMonth = `${selectedYear}-${selectedMonth.padStart(2, '0')}`;
        formData.append('year_month', yearMonth);
      } else if (selectedYear) {
        // If only year is selected, we might need to handle this differently
        // For now, we'll pass the year with current month
        const yearMonth = `${selectedYear}-${currentMonth}`;
        formData.append('year_month', yearMonth);
      }

      const response = await api.post('employee_salary_list', formData);

      if (response.data?.success) {
        const data = response.data.data || response.data.salaries || [];
        setSalaryRecords(Array.isArray(data) ? data : []);

        // Set pagination data
        setTotalPages(response.data.total_pages || 1);
        setTotalRecords(response.data.total_records || 0);
        setCurrentPage(response.data.current_page || page);
      } else {
        throw new Error(response.data?.message || 'Failed to fetch salary records');
      }

    } catch (error) {
      console.error("Fetch salary records error:", error);
      const errorMessage = error.response?.data?.message || error.message || "An unexpected error occurred";

      if (error.response?.status === 401) {
        showToast("Your session has expired. Please login again.", 'error');
        setTimeout(() => logout?.(), 2000);
      } else if (error.response?.status === 403) {
        showToast("You don't have permission to view salary records.", 'error');
      } else if (error.response?.status >= 500) {
        showToast("Server error. Please try again later.", 'error');
      } else {
        showToast(errorMessage, 'error');
      }

      setError(errorMessage);
      setSalaryRecords([]);
    } finally {
      setLoading(false);
      setPaginationLoading(false);
    }
  }, [user, logout, selectedYear, selectedMonth, searchQuery, isCurrentOrFutureMonth]);

  // Show toast notification
  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
  }, []);

  // Hide toast notification
  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  // Handle search with debounce
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchQuery !== '') {
        fetchSalaryRecords(1, searchQuery, true);
      } else {
        fetchSalaryRecords(1, '', true);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, fetchSalaryRecords]);

  // Handle month/year filter changes
  useEffect(() => {
    if (isAuthenticated() && user?.user_id) {
      fetchSalaryRecords(1, searchQuery, true);
    }
  }, [selectedMonth, selectedYear]);

  // Initial load
  useEffect(() => {
    if (isAuthenticated() && user?.user_id) {
      fetchSalaryRecords(1, '', true);
    }
  }, [isAuthenticated, user?.user_id]);

  // Handle pagination
  const handlePageChange = useCallback((page) => {
    fetchSalaryRecords(page, searchQuery);
  }, [fetchSalaryRecords, searchQuery]);

  // Update the handlePayment function
  const handlePayment = useCallback(async () => {
    if (!selectedRecord || !user?.user_id) return;

    try {
      setPaymentLoading(true);

      const formData = new FormData();
      formData.append('employee_salary_id', selectedRecord.employee_salary_id);
      formData.append('pay_salary', selectedRecord.total_pay_salary);
      formData.append('payment_mode', paymentData.payment_mode);
      formData.append('remark', paymentData.remark);

      const response = await api.post('add_salary_payment', formData);

      if (response.data?.success) {
        fetchSalaryRecords(currentPage, searchQuery);

        setShowPaymentModal(false);
        setSelectedRecord(null);
        setPaymentData({ payment_mode: '1', remark: '' });

        // Show success toast
        showToast('Payment processed successfully!', 'success');
      } else {
        throw new Error(response.data?.message || 'Payment failed');
      }

    } catch (error) {
      console.error("Payment error:", error);
      const errorMessage = error.response?.data?.message || error.message || "Payment failed";
      showToast(errorMessage, 'error');
    } finally {
      setPaymentLoading(false);
    }
  }, [selectedRecord, user, paymentData, showToast, fetchSalaryRecords, currentPage, searchQuery]);

  // Handle delete
  const handleDelete = useCallback(async () => {
    if (!selectedRecord || !user?.user_id) return;

    try {
      setDeleteLoading(true);

      const formData = new FormData();
      formData.append('employee_salary_id', selectedRecord.employee_salary_id);

      const response = await api.post('employee_salary_delete', formData);

      if (response.data?.success) {
        // Refresh the current page data
        fetchSalaryRecords(currentPage, searchQuery);

        setShowDeleteModal(false);
        setSelectedRecord(null);

        // Show success toast
        showToast('Salary record deleted successfully!', 'success');
      } else {
        throw new Error(response.data?.message || 'Delete failed');
      }

    } catch (error) {
      console.error("Delete error:", error);
      const errorMessage = error.response?.data?.message || error.message || "Delete failed";
      showToast(errorMessage, 'error');
    } finally {
      setDeleteLoading(false);
    }
  }, [selectedRecord, user, showToast, fetchSalaryRecords, currentPage, searchQuery]);

  // Open payment modal
  const openPaymentModal = useCallback((record) => {
    setSelectedRecord(record);
    setPaymentData({
      payment_mode: '1',
      remark: formatMonthYear(record.month_year)
    });
    setShowPaymentModal(true);
  }, []);

  // Close payment modal
  const closePaymentModal = useCallback(() => {
    setShowPaymentModal(false);
    setSelectedRecord(null);
    setPaymentData({ payment_mode: '1', remark: '' });
  }, []);

  // Open delete modal
  const openDeleteModal = useCallback((record) => {
    setSelectedRecord(record);
    setShowDeleteModal(true);
  }, []);

  // Close delete modal
  const closeDeleteModal = useCallback(() => {
    setShowDeleteModal(false);
    setSelectedRecord(null);
  }, []);

  // Handle view salary slip - open in new tab
  const handleViewSalarySlip = useCallback((record) => {
    if (record.salary_slip) {
      window.open(record.salary_slip, '_blank');
    } else {
      showToast('Salary slip URL not available', 'error');
    }
  }, [showToast]);

  // Get payment status display
  const getPaymentStatusDisplay = useCallback((status) => {
    if (status === PAYMENT_STATUS.PAID) {
      return {
        text: 'Paid',
        className: 'bg-[var(--color-success-light)] text-[var(--color-text-success)] border-[var(--color-text-success)]',
        icon: <CheckCircle className="w-4 h-4" />
      };
    } else {
      return {
        text: 'Unpaid',
        className: 'bg-[var(--color-error)] text-[var(--color-text-white)] border-[var(--color-text-error)]',
        icon: <AlertCircle className="w-4 h-4" />
      };
    }
  }, []);

  // Sorting functionality (removed as it's now handled by backend)
  const requestSort = useCallback((key) => {
    setSortConfig(prevConfig => {
      const direction = prevConfig.key === key && prevConfig.direction === SORT_DIRECTIONS.ASCENDING
        ? SORT_DIRECTIONS.DESCENDING
        : SORT_DIRECTIONS.ASCENDING;
      return { key, direction };
    });
  }, []);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(parseFloat(amount) || 0);
  };

  // Format month year for display
  const formatMonthYear = (monthYear) => {
    if (!monthYear) return '--';

    try {
      const [year, month] = monthYear.split('-');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${monthNames[parseInt(month) - 1]} ${year}`;
    } catch (error) {

      return monthYear;
    }
  };

  // Render sort icon
  const renderSortIcon = useCallback((key) => {
    if (sortConfig.key !== key) {
      return <ChevronDown className="ml-1 h-4 w-4 text-[var(--color-text-muted)]" />;
    }
    return sortConfig.direction === SORT_DIRECTIONS.ASCENDING ?
      <ChevronUp className="ml-1 h-4 w-4 text-[var(--color-primary)]" /> :
      <ChevronDown className="ml-1 h-4 w-4 text-[var(--color-primary)]" />;
  }, [sortConfig]);

  // Redirect if not authenticated
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      <div className="p-8  mx-auto">
        {/* Header Section */}
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
                    Finalize Payroll
                  </h1>
                  {totalRecords > 0 && (
                    <p className="text-[var(--color-text-white)] text-sm mt-1">
                      Total Records: {totalRecords} | Page {currentPage} of {totalPages}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-primary-dark)] overflow-hidden shadow-sm">
          {/* Header section */}
          <div className="px-6 py-4 border-b border-[var(--color-primary-light)] bg-[var(--color-primary-dark)]">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <IndianRupee className="h-6 w-6 text-[var(--color-text-white)] mr-2" />
                <h3 className="text-lg font-medium text-[var(--color-text-white)]">
                  Employee Salary Records
                </h3>
              </div>

              <div className="flex items-center gap-3">
                {/* Month Filter */}
                <div className="relative">
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="appearance-none bg-[var(--color-bg-secondary)] border border-[var(--color-border-secondary)] rounded-md px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-text-white)] focus:border-[var(--color-border-primary)]"
                  >
                    {monthOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-2.5 h-4 w-4 text-[var(--color-text-muted)] pointer-events-none" />
                </div>

                {/* Year Filter */}
                <div className="relative">
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="appearance-none bg-[var(--color-bg-secondary)] border border-[var(--color-border-secondary)] rounded-md px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-text-white)] focus:border-[var(--color-border-primary)]"
                  >
                    {yearOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-2.5 h-4 w-4 text-[var(--color-text-muted)] pointer-events-none" />
                </div>

                {/* Search */}
                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    placeholder="Search records..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-[var(--color-border-secondary)] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-text-white)] focus:border-[var(--color-border-primary)] text-sm"
                  />
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--color-text-muted)]" />

                </div>
              </div>
            </div>
          </div>

          {/* Content section */}
          {loading ? (
            <div className="">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <div className="px-6 py-12 text-center">
              <div className="bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] rounded-lg p-8">
                <div className="w-16 h-16 bg-[var(--color-bg-gray-light)] rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-[var(--color-text-muted)]" />
                </div>
                <p className="text-[var(--color-text-secondary)] text-lg font-medium mb-2">
                  Unable to Load Salary Records
                </p>
                <p className="text-[var(--color-text-secondary)] text-sm mb-4">
                  {error || "We couldn't retrieve the salary records at this time. Please try again later or select a different month."}
                </p>
              </div>
            </div>
          ) : salaryRecords.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] rounded-lg p-8">
                <div className="w-16 h-16 bg-[var(--color-bg-gray-light)] rounded-full flex items-center justify-center mx-auto mb-4">
                  <IndianRupee className="w-8 h-8 text-[var(--color-text-muted)]" />
                </div>
                <p className="text-[var(--color-text-secondary)] text-lg font-medium mb-2">No Salary Records Found</p>
                <p className="text-[var(--color-text-secondary)] text-sm mb-4">
                  {searchQuery ? 'No records match your search criteria.' : 'No salary records have been generated yet.'}
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[var(--color-border-divider)]">
                  <thead className="bg-[var(--color-primary-lightest)]">
                    <tr>
                      {[
                        { key: COLUMN_KEYS.FULL_NAME, label: 'Full Name' },
                        { key: COLUMN_KEYS.DEPARTMENT, label: 'Department' },
                        { key: COLUMN_KEYS.MONTH_YEAR, label: 'Month/Year' },
                        { key: COLUMN_KEYS.TOTAL_SALARY, label: 'Base Salary' },
                        { key: COLUMN_KEYS.TOTAL_PAY_SALARY, label: 'Total Pay' },
                        { key: COLUMN_KEYS.PAYMENT_STATUS, label: 'Payment Status' }
                      ].map(({ key, label }) => (
                        <th key={`header-${key}`} className="px-6 py-3 text-left">
                          <button
                            className="flex items-center text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider hover:text-[var(--color-text-secondary)]"
                            onClick={() => requestSort(key)}
                          >
                            {label}
                            {renderSortIcon(key)}
                          </button>
                        </th>
                      ))}
                      <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                        Mobile
                      </th>
                      {(permissions?.add_salary_payment || permissions?.salary_delete || permissions?.salary_view) && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-[var(--color-bg-secondary)] divide-y divide-[var(--color-border-divider)]">
                    {salaryRecords.map((record, index) => {
                      const recordId = record.employee_salary_id || `record-${index}`;
                      const paymentStatus = getPaymentStatusDisplay(record.payment_status);

                      return (
                        <tr
                          key={`salary-${recordId}`}
                          className="hover:bg-[var(--color-bg-primary)] transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-primary)]">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-[var(--color-primary-lighter)] rounded-full flex items-center justify-center">
                                <Users className="w-4 h-4 text-[var(--color-primary-dark)]" />
                              </div>
                              <span>{record.full_name || 'Unnamed Employee'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-secondary)]">
                            {record.department_name || '--'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-secondary)]">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4 text-[var(--color-text-muted)]" />
                              <span>{formatMonthYear(record.month_year)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-primary)] font-medium">
                            {formatCurrency(record.total_salary)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-success-dark)] font-semibold">
                            {formatCurrency(record.total_pay_salary)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${paymentStatus.className}`}>
                              {paymentStatus.icon}
                              <span>{paymentStatus.text}</span>
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-secondary)]">
                            {record.mobile_number || '--'}
                          </td>
                          {(permissions?.add_salary_payment || permissions?.salary_delete || permissions?.salary_view) && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-secondary)]">
                              <div className="flex items-center space-x-2">
                                {permissions?.add_salary_payment && record.payment_status === PAYMENT_STATUS.UNPAID && (
                                  <button
                                    onClick={() => openPaymentModal(record)}
                                    className="inline-flex items-center space-x-1 bg-[var(--color-primary-dark)] text-[var(--color-text-white)] px-3 py-1 rounded-md text-xs font-medium hover:bg-[var(--color-primary-darker)] transition-colors"
                                  >
                                    <CreditCard className="w-4 h-4" />
                                    <span>Pay</span>
                                  </button>
                                )}
                                {permissions?.salary_delete && (
                                  <button
                                    onClick={() => openDeleteModal(record)}
                                    className="inline-flex items-center space-x-1 bg-[var(--color-error)] text-[var(--color-text-white)] px-3 py-1 rounded-md text-xs font-medium hover:bg-[var(--color-error-dark)] transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    <span>Delete</span>
                                  </button>
                                )}
                                {permissions?.salary_view && record.payment_status === PAYMENT_STATUS.PAID && (
                                  <button
                                    onClick={() => handleViewSalarySlip(record)}
                                    className="inline-flex items-center space-x-1 bg-[var(--color-success-medium)] text-[var(--color-text-white)] px-3 py-1 rounded-md text-xs font-medium hover:bg-[var(--color-success-dark)] transition-colors"
                                  >
                                    <Eye className="w-4 h-4" />
                                    <span>View</span>
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

              {/* Pagination */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                loading={paginationLoading}
              />
            </>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[var(--color-bg-secondary)] rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-8 border-b">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Process Payment</h3>
              <button
                onClick={closePaymentModal}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-8">
              <div className="mb-6">
                <div className="bg-[var(--color-bg-primary)] p-4 rounded-lg">
                  <h4 className="font-medium text-[var(--color-text-primary)] mb-2">Payment Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[var(--color-text-secondary)]">Employee:</span>
                      <span className="font-medium">{selectedRecord.full_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--color-text-secondary)]">Employee Code:</span>
                      <span className="font-medium">{selectedRecord.employee_code}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--color-text-secondary)]">Department:</span>
                      <span className="font-medium">{selectedRecord.department_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--color-text-secondary)]">Month/Year:</span>
                      <span className="font-medium">{formatMonthYear(selectedRecord.month_year)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--color-text-secondary)]">Mobile:</span>
                      <span className="font-medium">{selectedRecord.mobile_number}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-[var(--color-text-secondary)]">Amount:</span>
                      <span className="font-semibold text-[var(--color-success-dark)]">{formatCurrency(selectedRecord.total_pay_salary)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={paymentData.payment_mode}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, payment_mode: e.target.value }))}
                    className="w-full border border-[var(--color-border-secondary)] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
                  >
                    {Object.entries(PAYMENT_MODES).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    Remark
                  </label>
                  <textarea
                    value={paymentData.remark}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, remark: e.target.value }))}
                    className="w-full border border-[var(--color-border-secondary)] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
                    rows="3"
                    placeholder="Enter payment remark..."
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 p-8 border-t">
              <button
                onClick={closePaymentModal}
                className="px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] bg-[var(--color-bg-gradient-start)] hover:bg-[var(--color-bg-gray-light)] rounded-md transition-colors"
                disabled={paymentLoading}
              >
                Cancel
              </button>
              <button
                onClick={handlePayment}
                disabled={paymentLoading}
                className="px-4 py-2 text-sm font-medium text-[var(--color-text-white)] bg-[var(--color-primary-dark)] hover:bg-[var(--color-primary-darker)] rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {paymentLoading ? (
                  <div className="flex items-center space-x-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  'Process Payment'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[var(--color-bg-secondary)] rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-8 border-b">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Delete Salary Record</h3>
              <button
                onClick={closeDeleteModal}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-8">
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-10 w-10 text-[var(--color-error)]" />
                </div>
                <div>
                  <h4 className="text-lg font-medium text-[var(--color-text-primary)]">
                    Are you sure you want to delete this record?
                  </h4>
                  <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                    This action cannot be undone. The salary record will be permanently removed.
                  </p>
                </div>
              </div>

              <div className="bg-[var(--color-bg-primary)] p-4 rounded-lg">
                <h5 className="font-medium text-[var(--color-text-primary)] mb-2">Record Details</h5>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">Employee:</span>
                    <span className="font-medium">{selectedRecord.full_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">Employee Code:</span>
                    <span className="font-medium">{selectedRecord.employee_code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">Department:</span>
                    <span className="font-medium">{selectedRecord.department_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">Month/Year:</span>
                    <span className="font-medium">{formatMonthYear(selectedRecord.month_year)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">Total Pay:</span>
                    <span className="font-medium text-[var(--color-text-error)]">{formatCurrency(selectedRecord.total_pay_salary)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 p-8 border-t">
              <button
                onClick={closeDeleteModal}
                className="px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] bg-[var(--color-bg-gradient-start)] hover:bg-[var(--color-bg-gray-light)] rounded-md transition-colors"
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="px-4 py-2 text-sm font-medium text-[var(--color-text-white)] bg-[var(--color-error)] hover:bg-[var(--color-error-dark)] rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleteLoading ? (
                  <div className="flex items-center space-x-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Deleting...</span>
                  </div>
                ) : (
                  'Delete Record'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
    </div>
  );
}