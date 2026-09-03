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
  Eye,
  HandCoins
} from 'lucide-react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosInstance';
import { Toast } from '../../Components/ui/Toast';
import { useSelector } from 'react-redux';
import Pagination from '../../Components/Pagination';
import LoadingSpinner from "../../Components/Loader/LoadingSpinner"
import CustomSelect from '../../Components/comman/CustomSelect';
import CustomInput from '../../Components/comman/CustomInput';
import NoDataFound from '../../Components/comman/NoDataFound';

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
  TOTAL_PAID_LEAVE_AMOUNT: 'total_paid_leave_amount',
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
  const [showSalaryDetailsModal, setShowSalaryDetailsModal] = useState(false);
  const [salaryDetails, setSalaryDetails] = useState(null);
  const [salaryDetailsLoading, setSalaryDetailsLoading] = useState(false);
  const [expandedShifts, setExpandedShifts] = useState({});
  const toggleShiftExpand = useCallback((idx) => {
    setExpandedShifts((prev) => ({ ...prev, [idx]: !prev[idx] }));
  }, []);



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
  const location = useLocation();
  const [toast, setToast] = useState(null);

  // Set default to previous month and year relative to current date
  const currentDate = new Date();
  const previousDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
  const previousMonth = (previousDate.getMonth() + 1).toString().padStart(2, '0');
  const previousYear = previousDate.getFullYear().toString();

  const [selectedMonth, setSelectedMonth] = useState(previousMonth);
  const [selectedYear, setSelectedYear] = useState(previousYear);
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: SORT_DIRECTIONS.ASCENDING
  });

  const { user, isAuthenticated, logout } = useAuth();

  // Auto-open salary details modal when navigated from Navbar search
  useEffect(() => {
    const state = location.state;
    if (state?.openViewModal && state?.salaryDetailsData) {
      setSalaryDetails(state.salaryDetailsData);
      setShowSalaryDetailsModal(true);
      // Clear the navigation state so refreshing doesn't re-open the modal
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

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
        // For now, we'll pass the year with previous month
        const yearMonth = `${selectedYear}-${previousMonth}`;
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

  // Handle filters and search with debounce
  useEffect(() => {
    if (!isAuthenticated() || !user?.user_id) return;

    const delayDebounce = setTimeout(() => {
      fetchSalaryRecords(1, searchQuery, true);
    }, 500);

    return () => clearTimeout(delayDebounce);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedMonth, selectedYear, isAuthenticated, user?.user_id]);

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





  const handleViewSalaryDetails = async (record) => {
    try {
      setSalaryDetailsLoading(true);

      const formData = new FormData();
      formData.append('employee_salary_id', record.employee_salary_id);

      const response = await api.post(
        'single_employee_salary_list',
        formData
      );

      if (response.data?.success) {
        setSalaryDetails(response.data.data);
        setShowSalaryDetailsModal(true);
      } else {
        showToast(response.data?.message || 'Failed to fetch details', 'error');
      }
    } catch (error) {
      showToast(
        error.response?.data?.message || 'Failed to fetch salary details',
        'error'
      );
    } finally {
      setSalaryDetailsLoading(false);
    }
  };




  return (
    <div className="h-[calc(100vh-64px)] overflow-hidden bg-[var(--color-bg-primary)]">
      <div className="p-8  mx-auto">
        {/* Header Section */}
        {/* <div className="bg-[var(--color-bg-secondary)] rounded-2xl shadow-xl mb-8 overflow-hidden">
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
        </div> */}

        {/* Main Content */}
        <div className="bg-[var(--color-bg-secondary)] h-[87vh] rounded-lg border border-[var(--color-primary-dark)] overflow-hidden shadow-sm flex flex-col">
          {/* Header section */}
          <div className="px-6 py-4 border-b border-[var(--color-primary-light)] bg-[var(--color-primary-lighter)] shrink-0">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <IndianRupee className="h-6 w-6 text-[var(--color-primary-darker)] mr-2" />
                <h3 className="text-lg font-medium text-[var(--color-primary-darker)]">
                  Employee Salary Records
                </h3>
              </div>


              <div className="flex items-center gap-3">
                {/* Search */}
                <div className="relative w-full sm:w-64 flex items-center">
                  <CustomInput
                    type="text"
                    name="searchQuery"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search records..."
                    clearable={true}
                    icon={<Search className="w-4 h-4 text-[var(--color-text-secondary)] shrink-0" />}
                    className="!h-[40px] [&_input]:!h-[40px] [&_input]:!leading-[40px] [&_input]:!py-0 [&_input]:!rounded-xl [&_input]:!text-xs sm:[&_input]:!text-sm"
                  />
                </div>

                {/* Month Filter */}
                <div className="relative">
                  <CustomSelect
                    name="selectedMonth"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    options={monthOptions}
                    searchable={false}
                    className="!w-24 sm:!w-28 [&_button]:!h-[40px] [&_button]:!py-0 [&_button]:!rounded-xl [&_button]:!text-xs sm:[&_button]:!text-sm"
                  />
                </div>

                {/* Year Filter */}
                <div className="relative">
                  <CustomSelect
                    name="selectedYear"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    options={yearOptions}
                    searchable={false}
                    className="!w-24 sm:!w-28 [&_button]:!h-[40px] [&_button]:!py-0 [&_button]:!rounded-xl [&_button]:!text-xs sm:[&_button]:!text-sm"
                  />
                </div>

                {(permissions?.salary_view || permissions?.salary_create || permissions?.salary_process) && (
                  <button
                    onClick={() => navigate('/monthly-payroll')}
                    className="flex items-center justify-center gap-2 bg-[var(--color-bg-secondary)] hover:bg-[var(--color-primary-lightest)] text-[var(--color-primary-dark)] border border-[var(--color-border-secondary)] px-4 h-[40px] py-0 rounded-xl text-xs sm:text-sm font-medium transition-colors shadow-sm whitespace-nowrap shrink-0"
                  >
                    <IndianRupee className="h-4 w-4" />
                    Monthly Salary
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Content section */}
          {loading ? (
            <div className="flex-1 flex items-center justify-center min-h-0">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center min-h-0 px-6 py-12 text-center">
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
            <div className="flex-1 flex flex-col items-center justify-center min-h-0 bg-[#FBF9FD]">
              <NoDataFound
                title="No Salary Records Found"
                subtitle={searchQuery ? 'No records match your search criteria.' : 'No salary records have been generated yet.'}
              />
            </div>
          ) : (
            <>
              <div className="h-[770px] overflow-y-auto overflow-x-auto custom-scrollbar">
                <table className="min-w-full divide-y divide-[var(--color-border-divider)]">
                  <thead className="sticky top-0 z-20 bg-[var(--color-primary-dark)]">
                    <tr>
                      {[
                        { key: COLUMN_KEYS.FULL_NAME, label: 'Full Name' },
                        { key: COLUMN_KEYS.DEPARTMENT, label: 'Department' },
                        { key: COLUMN_KEYS.MONTH_YEAR, label: 'Month/Year' },
                        { key: COLUMN_KEYS.total_salary, label: 'Base Salary' },
                        { key: COLUMN_KEYS.week_of_salary, label: 'Weak of salary' },
                        { key: COLUMN_KEYS.overtime_salary, label: 'OverTime Salary' },
                        { key: COLUMN_KEYS.total_allowance_amount, label: 'Allowance' },
                        { key: COLUMN_KEYS.total_deduction_amount, label: 'Deduction' },
                        { key: COLUMN_KEYS.total_advance_amount, label: 'Advance Salary' },
                        { key: COLUMN_KEYS.total_loan_amount, label: 'Loan Amount' },
                        { key: COLUMN_KEYS.total_holiday_amount, label: 'Holiday Amount' },
                        { key: COLUMN_KEYS.TOTAL_PAID_LEAVE_AMOUNT, label: 'Paid Leave Amount' },
                        { key: COLUMN_KEYS.total_pay_salary, label: 'Total Pay' },
                        { key: COLUMN_KEYS.PAYMENT_STATUS, label: 'Payment Status' }
                      ].map(({ key, label }) => (
                        <th key={`header-${key}`} className="px-6 py-3 text-left">
                          <button
                            className="flex items-center text-xs font-medium text-white uppercase tracking-wider "
                            onClick={() => requestSort(key)}
                          >
                            {label}
                            {renderSortIcon(key)}
                          </button>
                        </th>
                      ))}
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        Mobile
                      </th>
                      {(permissions?.add_salary_payment || permissions?.salary_delete || permissions?.salary_view) && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-[var(--color-bg-secondary)] divide-y divide-[var(--color-border-divider)] ">
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-primary)] font-medium">
                            {formatCurrency(record.week_of_salary)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-primary)] font-medium">
                            {formatCurrency(record.overtime_salary)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-success-dark)] font-medium">
                            {formatCurrency(record.total_allowance_amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-red-500 font-medium">
                            {formatCurrency(record.total_deduction_amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-red-500 font-medium">
                            {formatCurrency(record.total_advance_amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-red-500 font-medium">
                            {formatCurrency(record.total_loan_amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-success-dark)] font-medium">
                            {formatCurrency(record.total_holiday_amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-success-dark)] font-medium">
                            {formatCurrency(record.total_paid_leave_amount)}
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
                              <div className="flex items-center space-x-3">


                                <button
                                  onClick={() => handleViewSalaryDetails(record)}
                                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 hover:scale-110 hover:shadow-md transition-all duration-200"
                                  title="View"
                                >
                                  <Eye className="w-4 h-4" strokeWidth={2.5} />
                                </button>


                                {permissions?.add_salary_payment && record.payment_status === PAYMENT_STATUS.UNPAID && (
                                  <button
                                    onClick={() => openPaymentModal(record)}
                                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-purple-50 text-purple-600 hover:bg-purple-100 hover:scale-110 hover:shadow-md transition-all duration-200"
                                    title="Pay"
                                  >
                                    <CreditCard className="w-4 h-4" strokeWidth={2.5} />
                                  </button>
                                )}





                                {permissions?.salary_view && record.payment_status === PAYMENT_STATUS.PAID && (
                                  <button
                                    onClick={() => handleViewSalarySlip(record)}
                                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:scale-110 hover:shadow-md transition-all duration-200"
                                    title="View"
                                  >
                                    <HandCoins className="w-4 h-4" strokeWidth={2.5} />
                                  </button>
                                )}


                                {permissions?.salary_delete && (
                                  <button
                                    onClick={() => openDeleteModal(record)}
                                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-100 hover:scale-110 hover:shadow-md transition-all duration-200"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-4 h-4" strokeWidth={2.5} />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-[var(--color-bg-secondary)] shadow-2xl ring-1 ring-black/5 animate-in zoom-in-95 duration-200">
            {/* Decorative gradient header */}
            <div className="relative bg-gradient-to-br from-[var(--color-primary-dark)] via-[var(--color-primary)] to-[var(--color-primary-darker)] px-6 pt-6 pb-16">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,white,transparent_60%)]" />
              <div className="relative flex items-start justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur px-3 py-1 text-xs font-medium text-white/90 mb-3">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
                    Secure Payment
                  </div>
                  <h3 className="text-xl font-semibold text-white tracking-tight">Process Payment</h3>
                  <p className="text-sm text-white/70 mt-1">Review and confirm the transaction</p>
                </div>
                <button
                  onClick={closePaymentModal}
                  className="rounded-full p-2 text-white/80 hover:text-white hover:bg-white/15 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Amount card – floats over the header */}
            <div className="px-6 -mt-12 relative">
              <div className="rounded-xl bg-[var(--color-bg-primary)] shadow-lg ring-1 ring-black/5 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">Total Amount</p>
                    <p className="text-3xl font-bold text-[var(--color-success-dark)] mt-1">
                      {formatCurrency(selectedRecord.total_pay_salary)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[var(--color-text-muted)]">Period</p>
                    <p className="text-sm font-semibold text-[var(--color-text-primary)] mt-1">
                      {formatMonthYear(selectedRecord.month_year)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Employee details */}
            <div className="px-6 pt-5">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Employee', value: selectedRecord.full_name },
                  { label: 'Code', value: selectedRecord.employee_code },
                  { label: 'Department', value: selectedRecord.department_name },
                  { label: 'Mobile', value: selectedRecord.mobile_number },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg bg-[var(--color-bg-primary)] px-3 py-2.5 border border-[var(--color-border-secondary)]/50">
                    <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">{item.label}</p>
                    <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate mt-0.5">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Form */}
            <div className="px-6 pt-5 pb-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] mb-1.5">
                  Payment Mode
                </label>
                <CustomSelect
                  name="payment_mode"
                  value={paymentData.payment_mode}
                  onChange={(e) =>
                    setPaymentData((prev) => ({ ...prev, payment_mode: e.target.value }))
                  }
                  options={Object.entries(PAYMENT_MODES).map(([value, label]) => ({ value, label }))}
                  searchable={false}
                  className="w-full h-[42px]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] mb-1.5">
                  Remark
                </label>
                <textarea
                  value={paymentData.remark}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, remark: e.target.value }))}
                  className="w-full border border-[var(--color-border-secondary)] rounded-lg px-3 py-2.5 text-sm bg-[var(--color-bg-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition resize-none"
                  rows="3"
                  placeholder="Add a note for this payment..."
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-6 py-4 bg-[var(--color-bg-primary)]/50 border-t border-[var(--color-border-secondary)]/50">
              <button
                onClick={closePaymentModal}
                disabled={paymentLoading}
                className="px-4 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-gray-light)] rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handlePayment}
                disabled={paymentLoading}
                className="group relative px-5 py-2.5 text-sm font-semibold text-[var(--color-text-white)] bg-gradient-to-r from-[var(--color-primary-dark)] to-[var(--color-primary-darker)] rounded-lg shadow-md shadow-[var(--color-primary)]/30 hover:shadow-lg hover:shadow-[var(--color-primary)]/40 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {paymentLoading ? (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>Confirm Payment</span>
                    <span className="opacity-70 group-hover:translate-x-0.5 transition-transform">→</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>

      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedRecord && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--color-bg-secondary)] rounded-xl shadow-xl max-w-md w-full overflow-hidden ">

            {/* Header - Simple & Formal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-text-muted)]/10 bg-[var(--color-primary-dark)]  ">
              <div className="flex items-center space-x-2.5">
                <AlertCircle className="h-5 w-5 text-white" />
                <h3 className="font-semibold text-white">
                  Delete Salary Record
                </h3>
              </div>
              <button
                onClick={closeDeleteModal}
                className="text-white transition-colors p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6">
              <div className="mb-5">
                <h4 className="text-md font-medium text-[var(--color-text-primary)]">
                  Are you sure you want to delete this record?
                </h4>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                  This action is permanent and cannot be undone.
                </p>
              </div>

              {/* Record Details - Clean & Sobar Minimalist Table */}
              <div className="border border-[var(--color-text-muted)]/10 rounded-lg divide-y divide-[var(--color-text-muted)]/5 bg-[var(--color-bg-primary)]/50">

                <div className="flex justify-between items-center px-4 py-2.5 text-xs">
                  <span className="text-[var(--color-text-secondary)]">Employee Name</span>
                  <span className="font-semibold text-[var(--color-text-primary)]">{selectedRecord.full_name}</span>
                </div>

                <div className="flex justify-between items-center px-4 py-2.5 text-xs">
                  <span className="text-[var(--color-text-secondary)]">Employee Code</span>
                  <span className="font-medium text-[var(--color-text-primary)]">{selectedRecord.employee_code}</span>
                </div>

                <div className="flex justify-between items-center px-4 py-2.5 text-xs">
                  <span className="text-[var(--color-text-secondary)]">Department</span>
                  <span className="font-medium text-[var(--color-text-primary)]">{selectedRecord.department_name}</span>
                </div>

                <div className="flex justify-between items-center px-4 py-2.5 text-xs">
                  <span className="text-[var(--color-text-secondary)]">Month / Year</span>
                  <span className="font-medium text-[var(--color-text-primary)]">{formatMonthYear(selectedRecord.month_year)}</span>
                </div>

                <div className="flex justify-between items-center px-4 py-3 text-xs bg-[var(--color-primary-lighter)]/20">
                  <span className="font-medium text-[var(--color-text-primary)]">Total Amount</span>
                  <span className="font-bold text-sm text-[var(--color-text-error)]">
                    {formatCurrency(selectedRecord.total_pay_salary)}
                  </span>
                </div>

              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex justify-end items-center space-x-2 px-6 py-4 bg-[var(--color-bg-primary)] border-t border-[var(--color-text-muted)]/10">
              <button
                onClick={closeDeleteModal}
                className="px-4 py-3 text-sm font-medium bg-transparent text-[var(--color-primary)] border-2 hover:bg-[var(--color-primary-lightest)] border-[var(--color-primary)] rounded-lg hover:bg-[var(--color-bg-hover)]  transition-colors"
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="px-4 py-3 text-sm font-medium text-white bg-[var(--color-primary-dark)]   rounded-md transition-colors disabled:opacity-50"
              >
                {deleteLoading ? (
                  <div className="flex items-center space-x-1.5">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
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





      {showSalaryDetailsModal && salaryDetails && (() => {
        const emp = salaryDetails.employee || {};
        const sal = salaryDetails.employee_salary || {};
        const attendanceShifts = salaryDetails.employee_salary_attedance || [];
        const allowances = salaryDetails.employee_salary_allowance || [];
        const holidays = salaryDetails.employee_salary_holiday || [];
        const paidLeaves = salaryDetails.employee_salary_paid_leave || [];
        const deductions = salaryDetails.employee_salary_deduction || [];
        const loans = salaryDetails.employee_salary_loan || [];
        const advances = salaryDetails.employee_salary_advance || [];

        const num = (v) => Number(v || 0);
        const totalEarnings =
          num(sal.total_salary) +
          num(sal.overtime_salary) +
          num(sal.total_allowance_amount) +
          num(sal.total_holiday_amount) +
          num(sal.total_paid_leave_amount);
        const totalDeducts =
          num(sal.total_deduction_amount) +
          num(sal.total_loan_amount) +
          num(sal.total_advance_amount);
        const totalBar = totalEarnings + totalDeducts || 1;

        const initials = (emp.full_name || '?')
          .split(' ')
          .map((s) => s[0])
          .slice(0, 2)
          .join('')
          .toUpperCase();

        const isPaid = sal.payment_status === '2';

        // Status -> tone for attendance day pill
        const statusTone = (sid) => {
          switch (String(sid)) {
            case '3': return { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'P' };
            case '2': return { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500', label: 'I' };
            case '1': return { bg: 'bg-rose-100', text: 'text-rose-700', dot: 'bg-rose-500', label: 'A' };
            default: return { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400', label: '–' };
          }
        };

        const closeModal = () => {
          setShowSalaryDetailsModal(false);
          setSalaryDetails(null);
        };

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200">
            <div className="relative w-full max-w-7xl max-h-[94vh] overflow-hidden rounded-2xl bg-[var(--color-bg-primary)] shadow-2xl border border-[var(--color-primary-light)] flex flex-col lg:flex-row animate-in zoom-in-95 duration-200">

              {/* ============ LEFT IDENTITY RAIL ============ */}
              <aside className="relative lg:w-[300px] shrink-0 bg-gradient-to-br from-[var(--color-primary-darker)] via-[var(--color-primary-dark)] to-[var(--color-primary-darker)] text-[var(--color-text-white)] p-6 flex flex-col overflow-y-auto">
                {/* decorative orbs */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-10 -left-10 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />

                <div className="relative flex items-start justify-between mb-6">
                  <span className="text-[12.5px]  font-bold  text-white/60">
                    Payslip · {sal.month_year ? formatMonthYear(sal.month_year) : '--'}
                  </span>
                  <button
                    onClick={closeModal}
                    className="lg:hidden rounded-lg p-1.5 hover:bg-white/10 transition"
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="relative flex flex-col items-center text-center">
                  <div className="w-20 h-20 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-2xl font-black tracking-wider border border-white/20 shadow-inner">
                    {initials}
                  </div>
                  <h3 className="mt-3 text-lg font-bold tracking-tight leading-tight">{emp.full_name || '--'}</h3>
                  <p className="text-xs text-white/70 mt-0.5">
                    {emp.department_name || '--'} · {emp.branch_name || '--'}
                  </p>

                  <span
                    className={`mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${isPaid
                      ? 'bg-emerald-400/20 text-emerald-200 border border-emerald-300/30'
                      : 'bg-amber-400/20 text-amber-200 border border-amber-300/30'
                      }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isPaid ? 'bg-emerald-300' : 'bg-amber-300'}`} />
                    {isPaid ? 'Paid' : 'Unpaid'}
                  </span>
                </div>

                {/* net pay */}
                <div className="relative mt-6 p-4 rounded-xl bg-white/10 border border-white/10 backdrop-blur-sm">
                  <p className="text-[12.5px]  font-md text-white/60">Net Take Home</p>
                  <p className="text-2xl font-black tracking-tight mt-1">
                    {formatCurrency(sal.total_pay_salary)}
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <p className="text-white/65  text-[12.5px] font-semibold">Base</p>
                      <p className="font-semibold">{formatCurrency(sal.total_salary)}</p>
                    </div>
                    <div>
                      <p className="text-white/65  text-[12.5px] font-semibold">Final Gross</p>
                      <p className="font-semibold">{formatCurrency(sal.final_salary)}</p>
                    </div>
                  </div>
                </div>

                {/* employee meta */}
                <div className="relative mt-6 space-y-3 text-xs">
                  {[
                    { label: 'Employee Code', value: emp.employee_code || sal.employee_id || '--' },
                    { label: 'Mobile', value: emp.mobile_number || '--' },
                    { label: 'Email', value: emp.email || '--' },
                    { label: 'Gender', value: emp.gender_name || '--' },
                    { label: 'Generated', value: sal.created_at || '--' }
                  ].map((m, i) => (
                    <div key={i} className="flex items-start justify-between gap-3 border-b border-white/10 pb-2 last:border-0">
                      <span className="text-white/65 font-semibold  tracking-wider text-[12px]">{m.label}</span>
                      <span className="text-white/95 font-medium text-right break-all">{m.value}</span>
                    </div>
                  ))}
                </div>

                <div className="relative mt-auto pt-6 hidden lg:block">
                  <button
                    onClick={closeModal}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-md font-md transition-all flex items-center justify-center gap-2"
                  >
                    <X className="w-3.5 h-3.5" /> Close Statement
                  </button>
                </div>
              </aside>

              {/* ============ RIGHT CANVAS ============ */}
              <div className="flex-1 flex flex-col min-w-0 bg-[var(--color-bg-primary)]">
                {/* canvas header */}
                <div className="hidden lg:flex items-center justify-between px-6 py-4 border-b border-[var(--color-border-divider)] bg-[var(--color-bg-secondary)]">
                  <div>
                    <h2 className="text-[25px] font-bold text-[var(--color-primary-dark)] ">Salary Statement</h2>
                    <p className="text-md text-[#45484c]">Complete breakdown of earnings, deductions and attendance.</p>
                  </div>
                  <button
                    onClick={closeModal}
                    className="rounded-lg p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-primary)] transition"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">

                  {/* ===== Pay Visualization Bar ===== */}
                  <section className="bg-[var(--color-bg-secondary)] border border-[var(--color-primary-light)]/60 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-md font-bold text-[var(--color-text-primary)] tracking-tight flex items-center gap-2">
                          <IndianRupee className="w-4 h-4 text-[var(--color-primary-dark)]" />
                          Pay Composition
                        </h4>
                        <p className="text-[15px] text-[#45484c] mt-0.5">Proportional view of earnings vs. deductions for this cycle.</p>
                      </div>
                      <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded-md bg-[var(--color-primary-lighter)] text-[var(--color-primary-darker)]">
                        {sal.month_year ? formatMonthYear(sal.month_year) : '--'}
                      </span>
                    </div>

                    {/* stacked bar */}
                    <div className="w-full h-3 rounded-full bg-[var(--color-bg-primary)] overflow-hidden flex">
                      <div className="h-full bg-emerald-500" style={{ width: `${(num(sal.total_salary) / totalBar) * 100}%` }} />
                      <div className="h-full bg-teal-400" style={{ width: `${(num(sal.overtime_salary) / totalBar) * 100}%` }} />
                      <div className="h-full bg-sky-400" style={{ width: `${(num(sal.total_allowance_amount) / totalBar) * 100}%` }} />
                      <div className="h-full bg-indigo-400" style={{ width: `${(num(sal.total_holiday_amount) / totalBar) * 100}%` }} />
                      <div className="h-full bg-purple-400" style={{ width: `${(num(sal.total_paid_leave_amount) / totalBar) * 100}%` }} />
                      <div className="h-full bg-rose-400" style={{ width: `${(num(sal.total_deduction_amount) / totalBar) * 100}%` }} />
                      <div className="h-full bg-amber-400" style={{ width: `${(num(sal.total_loan_amount) / totalBar) * 100}%` }} />
                      <div className="h-full bg-orange-500" style={{ width: `${(num(sal.total_advance_amount) / totalBar) * 100}%` }} />
                    </div>

                    {/* legend tiles */}
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                      {[
                        { c: 'bg-emerald-500', l: 'Base Salary', v: sal.total_salary },
                        { c: 'bg-teal-400', l: 'Overtime', v: sal.overtime_salary },
                        { c: 'bg-sky-400', l: 'Allowances', v: sal.total_allowance_amount },
                        { c: 'bg-indigo-400', l: 'Holidays', v: sal.total_holiday_amount },
                        { c: 'bg-purple-400', l: 'Paid Leaves', v: sal.total_paid_leave_amount },
                        { c: 'bg-rose-400', l: 'Deductions', v: sal.total_deduction_amount, minus: true },
                        { c: 'bg-amber-400', l: 'Loan Recovery', v: sal.total_loan_amount, minus: true },
                        { c: 'bg-orange-500', l: 'Advance Recovery', v: sal.total_advance_amount, minus: true },
                        { c: 'bg-[var(--color-primary-dark)]', l: 'Week of Salary', v: sal.week_of_salary }
                      ].map((t, i) => (
                        <div key={i} className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border-divider)]">
                          <span className={`w-2.5 h-2.5 rounded-sm ${t.c}`} />
                          <div className="min-w-0 flex-1">
                            <p className="text-[12px] font-semibold text-[#45484c] truncate">{t.l}</p>
                            <p className={`text-xs font-bold ${t.minus ? 'text-[var(--color-text-error)]' : 'text-[var(--color-text-primary)]'}`}>
                              {t.minus ? '− ' : ''}{formatCurrency(t.v)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>







                  {/* ===== Earnings & Deductions Two-Col Ledger ===== */}
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

                    {/* EARNINGS column */}
                    <section className="bg-[var(--color-bg-secondary)] border border-emerald-200/70 rounded-2xl shadow-sm overflow-hidden">
                      <header className="px-5 py-3 bg-gradient-to-r from-emerald-50 to-transparent border-b border-emerald-100 flex items-center gap-2">
                        <span className="w-1 h-5 rounded-full bg-emerald-500" />
                        <h4 className="text-md font-bold text-emerald-700 tracking-tight">Earnings Ledger</h4>
                      </header>

                      {/* allowances */}
                      <div className="p-4 border-b border-[var(--color-border-divider)]">
                        <p className="text-[13px]  font-bold  text-[#45484c] mb-2">Allowances</p>
                        {allowances.length > 0 ? (
                          <ul className="space-y-1.5">
                            {allowances.map((it, i) => (
                              <li key={i} className="flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border-divider)]">
                                <span className="font-medium text-[var(--color-text-primary)]">{it.allowance_name}</span>
                                <span className="font-bold text-emerald-600">+ {formatCurrency(it.allowance_amount)}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-[11px] italic text-[var(--color-text-muted)] px-3 py-2">No allowances recorded.</p>
                        )}
                      </div>

                      <div className="p-4 border-b border-[var(--color-border-divider)]">
                        <p className="text-[13px]  font-bold text-[#45484c] mb-2">Holidays Compensation</p>
                        {holidays.length > 0 ? (
                          <ul className="space-y-1.5">
                            {holidays.map((it, i) => (
                              <li key={i} className="flex items-center justify-between gap-3 text-xs px-3 py-2 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border-divider)]">
                                <div className="min-w-0">
                                  <p className="font-medium text-[var(--color-text-primary)] truncate">{it.holiday_name}</p>
                                  <p className="text-[11px] text-[var(--color-text-muted)]">{it.holiday_date}</p>
                                </div>
                                <span className="font-bold text-emerald-600 shrink-0">+ {formatCurrency(it.holiday_amount)}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-[11px] italic text-[var(--color-text-muted)] px-3 py-2">No holidays in this cycle.</p>
                        )}
                      </div>

                      {/* paid leaves */}
                      <div className="p-4">
                        <p className="text-[13px] font-bold text-[#45484c] mb-2">Paid Leaves Compensation</p>
                        {paidLeaves.length > 0 ? (
                          <ul className="space-y-1.5">
                            {paidLeaves.map((it, i) => (
                              <li key={i} className="flex items-center justify-between gap-3 text-xs px-3 py-2 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border-divider)]">
                                <div className="min-w-0 flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                  <div>
                                    <p className="font-medium text-[var(--color-text-primary)] truncate">{new Date(it.leave_date).toLocaleDateString('en-GB')}</p>
                                    <p className="text-[11px] text-[var(--color-text-muted)]">Paid Leave</p>
                                  </div>
                                </div>
                                <span className="font-bold text-emerald-600 shrink-0">+ {formatCurrency(it.paid_leave_amount)}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-[11px] italic text-[var(--color-text-muted)] px-3 py-2">No paid leaves in this cycle.</p>
                        )}
                      </div>

                      <footer className="px-5 py-3 bg-emerald-50/60 border-t border-emerald-100 flex items-center justify-between">
                        <span className="text-[15px]  font-md  text-emerald-700">Total Earnings</span>
                        <span className="text-sm font-black text-emerald-700">{formatCurrency(totalEarnings)}</span>
                      </footer>
                    </section>

                    {/* DEDUCTIONS column */}
                    <section className="bg-[var(--color-bg-secondary)] border border-rose-200/70 rounded-2xl shadow-sm overflow-hidden">
                      <header className="px-5 py-3 bg-gradient-to-r from-rose-50 to-transparent border-b border-rose-100 flex items-center gap-2">
                        <span className="w-1 h-5 rounded-full bg-rose-500" />
                        <h4 className="text-md font-bold text-rose-700 tracking-tight">Deductions & Recoveries</h4>
                      </header>

                      {/* deductions */}
                      <div className="p-4 border-b border-[var(--color-border-divider)]">
                        <p className="text-[13px]  font-bold text-[#45484c] mb-2">Standard Deductions</p>
                        {deductions.length > 0 ? (
                          <ul className="space-y-1.5">
                            {deductions.map((it, i) => (
                              <li key={i} className="flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border-divider)]">
                                <span className="font-medium text-[var(--color-text-primary)]">{it.deduction_name}</span>
                                <span className="font-bold text-rose-600">− {formatCurrency(it.deduction_amount)}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-[11px] italic text-[var(--color-text-muted)] px-3 py-2">No deductions registered.</p>
                        )}
                      </div>

                      {/* loans */}
                      <div className="p-4 border-b border-[var(--color-border-divider)]">
                        <p className="text-[13px]  font-bold text-[#45484c] mb-2">Loan Installments</p>
                        {loans.length > 0 ? (
                          <ul className="space-y-1.5">
                            {loans.map((it, i) => (
                              <li key={i} className="flex items-center justify-between gap-3 text-xs px-3 py-2 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border-divider)]">
                                <div className="min-w-0 flex items-center gap-2 flex-wrap">
                                  <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[9px] font-bold uppercase tracking-wider">
                                    {it.loan_priority_name || 'Standard'}
                                  </span>
                                  <span className="text-[var(--color-text-muted)]">{it.loan_payment_date || '--'}</span>
                                </div>
                                <span className="font-bold text-rose-600 shrink-0">− {formatCurrency(it.installment_amount || it.amount)}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-[11px] italic text-[var(--color-text-muted)] px-3 py-2">No active loans.</p>
                        )}
                      </div>

                      {/* advances */}
                      <div className="p-4">
                        <p className="text-[13px]  font-bold text-[#45484c] mb-2">Advance Recoveries</p>
                        {advances.length > 0 ? (
                          <ul className="space-y-1.5">
                            {advances.map((it, i) => (
                              <li key={i} className="flex items-center justify-between gap-3 text-xs px-3 py-2 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border-divider)]">
                                <div className="min-w-0 flex items-center gap-2 flex-wrap">
                                  <span className="px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 text-[9px] font-bold uppercase tracking-wider">
                                    {it.advance_priority_name || 'Advance'}
                                  </span>
                                  <span className="text-[var(--color-text-muted)]">{it.advance_payment_date || '--'}</span>
                                </div>
                                <span className="font-bold text-rose-600 shrink-0">− {formatCurrency(it.amount)}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-[11px] italic text-[var(--color-text-muted)] px-3 py-2">No advances recorded.</p>
                        )}
                      </div>

                      <footer className="px-5 py-3 bg-rose-50/60 border-t border-rose-100 flex items-center justify-between">
                        <span className="text-[15px]  font-md  text-rose-700">Total Deductions</span>
                        <span className="text-sm font-black text-rose-700">− {formatCurrency(totalDeducts)}</span>
                      </footer>
                    </section>
                  </div>









                  {/* ===== Attendance Per-Shift ===== */}
                  {attendanceShifts.map((shift, sIdx) => {
                    const days = shift.attendance_arr || [];
                    const isOpen = !!expandedShifts[sIdx];
                    return (
                      <section key={sIdx} className="bg-[var(--color-bg-secondary)] border border-[var(--color-primary-light)]/60 rounded-2xl p-5 shadow-sm">
                        <div
                          role="button"
                          tabIndex={0}
                          aria-expanded={isOpen}
                          onClick={() => toggleShiftExpand(sIdx)}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleShiftExpand(sIdx); } }}
                          className={`flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none ${isOpen ? 'mb-4' : ''}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-[var(--color-primary-lighter)] flex items-center justify-center text-[var(--color-primary-darker)]">
                              <Calendar className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="text-md font-bold text-[var(--color-text-primary)] ht">
                                {shift.shift_name || 'Shift'} · Attendance
                              </h4>
                              <p className="text-[12px] text-[#45484c]">Daily attendance log with working hours and overtime.</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-[12.5px] font-md ">
                            <span className="px-2 py-1 rounded-md bg-[var(--color-bg-primary)] border border-[var(--color-border-divider)] text-[var(--color-text-primary)]">
                              Days: <b>{shift.total_working_days || 0}</b>
                            </span>
                            <span className="px-2 py-1 rounded-md bg-[var(--color-bg-primary)] border border-[var(--color-border-divider)] text-[var(--color-text-primary)]">
                              Hours: <b>{shift.total_working_hours || 0}</b>
                            </span>
                            <span className="px-2 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700">
                              Base: <b>{formatCurrency(shift.total_salary)}</b>
                            </span>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); toggleShiftExpand(sIdx); }}
                              aria-label={isOpen ? 'Collapse attendance' : 'Expand attendance'}
                              className="w-7 h-7 flex items-center justify-center rounded-md border border-[var(--color-border-divider)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] hover:bg-[var(--color-primary-lighter)] transition"
                            >
                              {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {isOpen && (
                          <>
                            {/* attendance table */}
                            {days.length > 0 && (
                              <div className="overflow-x-auto rounded-xl border border-[var(--color-border-divider)] mb-4">
                                <table className="w-full text-[11px] border-collapse">
                                  <thead>
                                    <tr className="bg-[var(--color-bg-primary)] text-[#45484c]  text-[12.5px]">
                                      <th className="px-3 py-2.5 text-left font-bold border-b border-[var(--color-border-divider)]">Date</th>
                                      <th className="px-3 py-2.5 text-left font-bold border-b border-[var(--color-border-divider)]">Status</th>
                                      <th className="px-3 py-2.5 text-left font-bold border-b border-[var(--color-border-divider)]">Actual Hours</th>
                                      <th className="px-3 py-2.5 text-right font-bold border-b border-[var(--color-border-divider)]">Hourly Rate</th>
                                      <th className="px-3 py-2.5 text-right font-bold border-b border-[var(--color-border-divider)]">Daily Salary</th>
                                      <th className="px-3 py-2.5 text-center font-bold border-b border-[var(--color-border-divider)]">Late (min)</th>
                                      <th className="px-3 py-2.5 text-center font-bold border-b border-[var(--color-border-divider)]">Early Out (min)</th>
                                      <th className="px-3 py-2.5 text-center font-bold border-b border-[var(--color-border-divider)]">Overtime</th>
                                      <th className="px-3 py-2.5 text-right font-bold border-b border-[var(--color-border-divider)]">OT Salary</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {days.map((d, dIdx) => {
                                      const t = statusTone(d.status_id);
                                      const dateStr = d.attendance_date || '';
                                      let dateLabel = dateStr;
                                      try {
                                        if (dateStr) {
                                          const dt = new Date(dateStr);
                                          if (!isNaN(dt)) {
                                            dateLabel = dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                                          }
                                        }
                                      } catch (_) { }
                                      const otVal = Number(d.overtime || 0);
                                      const lateVal = Number(d.late_coming_minutes || 0);
                                      const earlyVal = Number(d.early_going_minutes || 0);
                                      const dailySal = Number(d.daily_salary_for_day || 0);
                                      const hourlySal = Number(d.hourly_salary_for_day || 0);
                                      const otSal = Number(d.overtime_salary_for_day || 0);

                                      return (
                                        <tr key={dIdx} className="hover:bg-[var(--color-bg-primary)]/60 transition border-b border-[var(--color-border-divider)] last:border-0">
                                          <td className="px-3 py-2 font-semibold text-[var(--color-text-primary)] whitespace-nowrap">{dateLabel}</td>
                                          <td className="px-3 py-2">
                                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full ${t.bg} ${t.text} font-bold text-[10px]`}>
                                              <span className={`w-1.5 h-1.5 rounded-full ${t.dot}`} />
                                              {d.status_name || '—'}
                                            </span>
                                          </td>
                                          <td className="px-3 py-2 text-[var(--color-text-primary)] font-medium whitespace-nowrap">{d.actual_hours || '0h 0m'}</td>
                                          <td className="px-3 py-2 text-right text-[var(--color-text-primary)] tabular-nums">{hourlySal ? formatCurrency(hourlySal) : '—'}</td>
                                          <td className="px-3 py-2 text-right font-semibold text-emerald-700 tabular-nums">{dailySal ? formatCurrency(dailySal) : '—'}</td>
                                          <td className={`px-3 py-2 text-center tabular-nums ${lateVal > 0 ? 'text-rose-600 font-bold' : 'text-[var(--color-text-primary)]'}`}>
                                            {d?.late_coming_minutes}
                                          </td>
                                          <td className={`px-3 py-2 text-center tabular-nums ${earlyVal > 0 ? 'text-amber-600 font-bold' : 'text-[var(--color-text-primary)]'}`}>
                                            {d?.early_going_minutes}
                                          </td>
                                          <td className={`px-3 py-2 text-center tabular-nums ${otVal > 0 ? 'text-indigo-600 font-bold' : 'text-[var(--color-text-primary)]'}`}>
                                            {d?.overtime}
                                          </td>
                                          <td className={`px-3 py-2 text-right tabular-nums ${otSal > 0 ? 'text-indigo-700 font-semibold' : 'text-[var(--color-text-primary)]'}`}>
                                            {d.overtime_salary_for_day}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            )}

                            {/* attendance legend */}
                            <div className="flex flex-wrap gap-3 text-[10px] text-[var(--color-text-muted)] font-semibold">
                              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" />Complete hours</span>
                              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" />Incomplete hours</span>
                              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500" />Absent</span>
                              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-indigo-500" />Overtime applied</span>
                            </div>
                          </>
                        )}
                      </section>
                    );
                  })}




                  {/* ===== Final Net Pay Banner ===== */}
                  <section className="rounded-2xl bg-gradient-to-r from-[var(--color-primary-darker)] via-[var(--color-primary-dark)] to-[var(--color-primary-darker)] text-[var(--color-text-white)] p-5 flex flex-wrap items-center justify-between gap-4 shadow-md relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="relative">
                      <p className="text-[13px]  font-bold  text-white/60">Net Take-Home Pay</p>
                      <p className="text-3xl font-black tracking-tight mt-1">{formatCurrency(sal.total_pay_salary)}</p>
                      <p className="text-[11px] text-white/60 mt-1">
                        Earnings {formatCurrency(totalEarnings)} − Deductions {formatCurrency(totalDeducts)}
                      </p>
                    </div>
                    <div className="relative grid grid-cols-2 gap-3 text-xs">
                      <div className="px-4 py-2 rounded-xl bg-white/10 border border-white/15">
                        <p className="text-[12.5px] text-white/60 font-md">Status</p>
                        <p className="font-bold mt-0.5">{isPaid ? 'Paid' : 'Pending'}</p>
                      </div>
                      <div className="px-4 py-2 rounded-xl bg-white/10 border border-white/15">
                        <p className="text-[12.5px] text-white/60 font-md">Cycle</p>
                        <p className="font-bold mt-0.5">{sal.month_year ? formatMonthYear(sal.month_year) : '--'}</p>
                      </div>
                    </div>
                  </section>

                  {sal.remark_for_edit && (
                    <p className="text-[11px] text-[var(--color-text-muted)] italic px-1">
                      Note: {sal.remark_for_edit}
                    </p>
                  )}
                </div>

                {/* Footer actions */}
                <div className="px-5 py-3 bg-[var(--color-bg-secondary)] border-t border-[var(--color-border-divider)] flex justify-end shrink-0">
                  <button
                    onClick={closeModal}
                    className="px-5 py-2 text-md font-bold  text-[var(--color-primary)] bg-transparent border-2 border-[var(--color-primary)] rounded-xl hover:bg-[var(--color-primary-lightest)]"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}


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
