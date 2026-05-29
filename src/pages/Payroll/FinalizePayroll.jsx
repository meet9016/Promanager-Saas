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
import CustomSelect from '../../Components/comman/CustomSelect';
import CustomInput from '../../Components/comman/CustomInput';

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
  const [showSalaryDetailsModal, setShowSalaryDetailsModal] = useState(false);
  const [salaryDetails, setSalaryDetails] = useState(null);
  const [salaryDetailsLoading, setSalaryDetailsLoading] = useState(false);



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

  console.log(permissions, "a")

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
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
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
        <div className="bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-primary-dark)] overflow-hidden shadow-sm">
          {/* Header section */}
          <div className="px-6 py-4 border-b border-[var(--color-primary-light)] bg-[var(--color-primary-lighter)]">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <IndianRupee className="h-6 w-6 text-[var(--color-primary-darker)] mr-2" />
                <h3 className="text-lg font-medium text-[var(--color-primary-darker)]">
                  Employee Salary Records
                </h3>
              </div>


              <div className="flex items-center gap-3">
                {/* Month Filter */}
                <div className="relative w-full sm:w-64">

                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)] z-10" />

                  <CustomInput
                    type="text"
                    name="searchQuery"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search records..."
                    clearable={true}
                    className="!h-[37px] [&_input]:!h-[37px] [&_input]:!pl-10 [&_input]:!pr-4 [&_input]:!rounded-md"
                  />

                </div>
                <div className="relative">
                  {/* <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="appearance-none bg-[var(--color-bg-secondary)] border border-[var(--color-border-secondary)] rounded-md px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-text-white)] focus:border-[var(--color-border-primary)]"
                  >
                    {monthOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select> */}

                  <CustomSelect
                    name="selectedMonth"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    options={monthOptions.map((option) => ({
                      value: option.value,
                      label: option.label,
                    }))}
                    searchable={false}
                    className="!h-[37px] [&_button]:!h-[37px] [&_button]:!min-h-[34px] text-sm"
                  />
                  {/* <ChevronDown className="absolute right-2 top-2.5 h-4 w-4 text-[var(--color-text-muted)] pointer-events-none" /> */}
                </div>

                {/* Year Filter */}
                <div className="relative">
                  {/* <select
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
                  <ChevronDown className="absolute right-2 top-2.5 h-4 w-4 text-[var(--color-text-muted)] pointer-events-none" /> */}
                  <CustomSelect
                    name="selectedYear"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    options={yearOptions.map((option) => ({
                      value: option.value,
                      label: option.label,
                    }))}
                    searchable={false}
                    className="!h-[37px] [&_button]:!h-[37px] [&_button]:!min-h-[34px] text-sm"
                  />
                </div>

                {/* Search */}
                {/* <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    placeholder="Search records..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-[var(--color-border-secondary)] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-text-white)] focus:border-[var(--color-border-primary)] text-sm"
                  />
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--color-text-muted)]" />

                </div> */}


                {/* Monthly Payroll Button */}
                {(permissions?.salary_view || permissions?.salary_create) && (
                  <button
                    onClick={() => navigate('/monthly-payroll')}
                    className="flex items-center gap-2 bg-[var(--color-bg-secondary)] hover:bg-[var(--color-primary-lightest)] text-[var(--color-primary-dark)] border border-[var(--color-border-secondary)] px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm whitespace-nowrap"
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
                  <thead className="bg-[var(--color-primary-dark)]">
                    <tr>
                      {[
                        { key: COLUMN_KEYS.FULL_NAME, label: 'Full Name' },
                        { key: COLUMN_KEYS.DEPARTMENT, label: 'Department' },
                        { key: COLUMN_KEYS.MONTH_YEAR, label: 'Month/Year' },
                        { key: COLUMN_KEYS.TOTAL_PAY_SALARY, label: 'Base Salary' },
                        { key: COLUMN_KEYS.week_of_salary, label: 'Weak of salary' },
                        { key: COLUMN_KEYS.overtime_salary, label: 'OverTime Salary' },
                        { key: COLUMN_KEYS.total_allowance_amount, label: 'Allowance' },
                        { key: COLUMN_KEYS.total_deduction_amount, label: 'Deduction' },
                        { key: COLUMN_KEYS.total_advance_amount, label: 'Advance Salary' },
                        { key: COLUMN_KEYS.total_loan_amount, label: 'Loan Amount' },
                        { key: COLUMN_KEYS.total_holiday_amount, label: 'Holiday Amount' },
                        { key: COLUMN_KEYS.TOTAL_SALARY, label: 'Total Pay' },
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
                            {formatCurrency(record.total_pay_salary)}
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-success-dark)] font-semibold">
                            {formatCurrency(record.total_salary)}
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
                                {permissions?.salary_delete && (
                                  <button
                                    onClick={() => openDeleteModal(record)}
                                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-100 hover:scale-110 hover:shadow-md transition-all duration-200"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-4 h-4" strokeWidth={2.5} />
                                  </button>
                                )}




                                {permissions?.salary_view && record.payment_status === PAYMENT_STATUS.PAID && (
                                  <button
                                    onClick={() => handleViewSalarySlip(record)}
                                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:scale-110 hover:shadow-md transition-all duration-200"
                                    title="View"
                                  >
                                    <Eye className="w-4 h-4" strokeWidth={2.5} />
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





      {showSalaryDetailsModal && salaryDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-2xl bg-[var(--color-bg-secondary)] shadow-2xl border border-[var(--color-primary-dark)] flex flex-col animate-in zoom-in-95 duration-200">

            {/* Premium Editorial Header */}
            <div className="relative bg-gradient-to-r from-[var(--color-primary-dark)] to-[var(--color-primary-darker)] p-6 text-[var(--color-text-white)] shrink-0">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,white,transparent_50%)]" />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[var(--color-bg-secondary-20)] backdrop-blur-md rounded-xl flex items-center justify-center border border-white/10 shadow-inner">
                    <Users className="w-6 h-6 text-[var(--color-text-white)]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold tracking-widest bg-white/15 px-2 py-0.5 rounded-md text-white/90">
                        {salaryDetails.employee_salary?.month_year ? formatMonthYear(salaryDetails.employee_salary.month_year) : '--'}
                      </span>
                      <span className="text-[10px] uppercase font-bold tracking-widest bg-[var(--color-success-light)] text-[var(--color-text-success)] px-2 py-0.5 rounded-md">
                        {salaryDetails.employee_salary?.payment_status === '2' ? 'Paid' : 'Unpaid'}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold tracking-tight mt-1">{salaryDetails.employee?.full_name || 'Salary Statement'}</h3>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowSalaryDetailsModal(false);
                    setSalaryDetails(null);
                  }}
                  className="rounded-xl p-2 text-[var(--color-text-white)] opacity-80 hover:opacity-100 hover:bg-white/10 transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Grid Content Space */}
            <div className="p-6 overflow-y-auto bg-[var(--color-bg-primary)] space-y-6 flex-1">

              {/* Core Employee Card Deck */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Department', value: salaryDetails.employee?.department_name || '--', icon: <Users className="w-3.5 h-3.5" /> },
                  { label: 'Mobile Number', value: salaryDetails.employee?.mobile_number || '--', icon: <Search className="w-3.5 h-3.5" /> },
                  { label: 'Email ID', value: salaryDetails.employee?.email || '--', icon: <AlertCircle className="w-3.5 h-3.5" /> },
                  { label: 'Branch / Location', value: salaryDetails.employee?.branch_name || '--', icon: <Calendar className="w-3.5 h-3.5" /> }
                ].map((item, idx) => (
                  <div key={idx} className="bg-[var(--color-bg-secondary)] border border-[var(--color-primary-light)]/40 p-3.5 rounded-xl shadow-sm hover:border-[var(--color-primary-dark)]/30 transition-all">
                    <p className="text-[12px]  font-bold tracking-wider text-[var(--color-text-muted)] flex items-center gap-1.5 mb-1">
                      <span className="text-[var(--color-primary-dark)]">{item.icon}</span>
                      {item.label}
                    </p>
                    <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Dynamic Bento Box Financial Overview Layout */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                {/* Main Net Pay Hero Tile */}
                <div className="md:col-span-1 bg-gradient-to-br from-[var(--color-primary-dark)] to-[var(--color-primary-darker)] p-5 rounded-2xl text-[var(--color-text-white)] shadow-md flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-white/5 rounded-full blur-xl" />
                  <div>
                    <span className="text-[12px]  font-bold tracking-widest text-white/70">Net Take-Home Salary</span>
                    <h2 className="text-3xl font-black mt-2 tracking-tight">
                      {formatCurrency(salaryDetails.employee_salary?.total_pay_salary)}
                    </h2>
                  </div>
                  <div className="mt-6 pt-4 border-t border-white/10 grid grid-cols-2 gap-2 text-xs text-white/80">
                    <div>
                      <p className="opacity-70 text-[10px] ">Base Scale</p>
                      <p className="font-semibold">{formatCurrency(salaryDetails.employee_salary?.total_salary)}</p>
                    </div>
                    <div>
                      <p className="opacity-70 text-[10px] ">Final Gross</p>
                      <p className="font-semibold">{formatCurrency(salaryDetails.employee_salary?.final_salary)}</p>
                    </div>
                  </div>
                </div>

                {/* Sub Totals Accumulators Container */}
                <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4 bg-[var(--color-primary-lighter)]/30 border border-[var(--color-primary-light)] p-4 rounded-2xl">
                  {[
                    { label: 'Week of Salary', val: salaryDetails.employee_salary?.week_of_salary, pos: true },
                    { label: 'Overtime Earnings', val: salaryDetails.employee_salary?.overtime_salary, pos: true },
                    { label: 'Allowance Sum', val: salaryDetails.employee_salary?.total_allowance_amount, pos: true },
                    { label: 'Holiday Inclusions', val: salaryDetails.employee_salary?.total_holiday_amount, pos: true },
                    { label: 'Deductions Sum', val: salaryDetails.employee_salary?.total_deduction_amount, pos: false },
                    { label: 'Loan Installment', val: salaryDetails.employee_salary?.total_loan_amount, pos: false },
                    { label: 'Advance Deduction', val: salaryDetails.employee_salary?.total_advance_amount, pos: false }
                  ].map((card, idx) => (
                    <div key={idx} className="bg-[var(--color-bg-secondary)] border border-[var(--color-primary-light)]/60 rounded-xl p-3 shadow-xs">
                      <p className="text-[12px] font-bold text-[var(--color-text-muted)] tracking-wide truncate">{card.label}</p>
                      <p className={`text-base font-bold mt-1 ${card.pos ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-error)]'}`}>
                        {formatCurrency(card.val)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live Attendance Shift Micro Panel */}
              {salaryDetails.employee_salary_attedance?.map((shift, idx) => (
                <div key={idx} className="bg-[var(--color-bg-secondary)] border-l-4 border-[var(--color-primary-dark)] rounded-r-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[var(--color-primary-lighter)] flex items-center justify-center text-[var(--color-primary-dark)]">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-md font-bold text-[var(--color-text-primary)]  tracking-wider">{shift.shift_name || 'Active Shift Profile'}</h4>
                      <p className="text-sm text-[var(--color-text-muted)] mt-0.5">Calculated Working Structure metrics for this cycle.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-center">
                    <div>
                      <p className="text-[12px]  font-bold text-[var(--color-text-muted)]">Days Worked</p>
                      <p className="text-sm font-bold text-[var(--color-text-primary)] mt-0.5">{shift.total_working_days} Days</p>
                    </div>
                    <div className="border-l border-[var(--color-border-divider)] pl-6">
                      <p className="text-[12px]  font-bold text-[var(--color-text-muted)]">Total Hours</p>
                      <p className="text-sm font-bold text-[var(--color-text-primary)] mt-0.5">{shift.total_working_hours} Hrs</p>
                    </div>
                    <div className="border-l border-[var(--color-border-divider)] pl-6">
                      <p className="text-[12px]  font-bold text-[var(--color-text-muted)]">Base Calculated</p>
                      <p className="text-sm font-bold text-[var(--color-primary-darker)] mt-0.5">{formatCurrency(shift.total_salary)}</p>
                    </div>
                  </div>
                </div>
              ))}

              {/* Detailed Itemized Breakdowns Stack */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Additions Bucket Block */}
                <div className="space-y-4">
                  {/* Allowances Table Section */}
                  <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-primary-light)]/70 rounded-xl p-4 shadow-xs">
                    <h4 className="text-md font-bold  text-[var(--color-primary-darker)] tracking-wider mb-3 flex items-center gap-2">
                      <span className="w-1.5 h-3 rounded-full bg-[var(--color-primary-dark)]" />
                      Allowances Breakdown
                    </h4>
                    <div className="overflow-hidden border border-[var(--color-border-divider)] rounded-lg text-xs">
                      <table className="w-full text-left">
                        <thead className="bg-[var(--color-primary-lighter)]  text-[var(--color-primary-darker)] font-bold">
                          <tr>
                            <th className="p-2.5">Allowance Name</th>
                            <th className="p-2.5 text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-border-divider)] text-[var(--color-text-secondary)]">
                          {salaryDetails.employee_salary_allowance?.length > 0 ? (
                            salaryDetails.employee_salary_allowance.map((item, index) => (
                              <tr key={index} className="hover:bg-[var(--color-bg-primary)]">
                                <td className="text-md p-2.5 font-medium">{item.allowance_name}</td>
                                <td className="text-md  p-2.5 text-right font-semibold text-[var(--color-text-primary)]">{formatCurrency(item.allowance_amount)}</td>
                              </tr>
                            ))
                          ) : (
                            <tr><td colSpan="2" className="p-3 text-center text-[var(--color-text-muted)] italic">No allowances captured.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Holiday Items Breakdown */}
                  <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-primary-light)]/70 rounded-xl p-4 shadow-xs">
                    <h4 className="text-md font-bold  text-[var(--color-primary-darker)] tracking-wider mb-3 flex items-center gap-2">
                      <span className="w-1.5 h-3 rounded-full bg-[var(--color-primary-dark)]" />
                      Holidays Compensation
                    </h4>
                    <div className="overflow-hidden border border-[var(--color-border-divider)] rounded-lg text-xs">
                      <table className="w-full text-left">
                        <thead className="bg-[var(--color-primary-lighter)] text-[var(--color-primary-darker)] font-bold">
                          <tr>
                            <th className="p-2.5">Occasion</th>
                            <th className="p-2.5">Date</th>
                            <th className="p-2.5 text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-border-divider)] text-[var(--color-text-secondary)]">
                          {salaryDetails.employee_salary_holiday?.length > 0 ? (
                            salaryDetails.employee_salary_holiday.map((item, index) => (
                              <tr key={index} className="hover:bg-[var(--color-bg-primary)]">
                                <td className="p-2.5 font-medium">{item.holiday_name}</td>
                                <td className="p-2.5 text-[var(--color-text-muted)]">{item.holiday_date}</td>
                                <td className="p-2.5 text-right font-semibold text-[var(--color-text-primary)]">{formatCurrency(item.holiday_amount)}</td>
                              </tr>
                            ))
                          ) : (
                            <tr><td colSpan="3" className="p-3 text-center text-[var(--color-text-muted)] italic">No holidays listed.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Deductions & Liabilities Columns */}
                <div className="space-y-4">
                  {/* Standard Deductions Block */}
                  <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-primary-light)]/70 rounded-xl p-4 shadow-xs">
                    <h4 className="text-md font-bold  text-[var(--color-text-error)] tracking-wider mb-3 flex items-center gap-2">
                      <span className="w-1.5 h-3 rounded-full bg-[var(--color-error)]" />
                      Deductions Breakdown
                    </h4>
                    <div className="overflow-hidden border border-[var(--color-border-divider)] rounded-lg text-xs">
                      <table className="w-full text-left">
                        <thead className="bg-red-50 text-[var(--color-text-error)] font-bold">
                          <tr>
                            <th className="p-2.5">Deduction Description</th>
                            <th className="p-2.5 text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-border-divider)] text-[var(--color-text-secondary)]">
                          {salaryDetails.employee_salary_deduction?.length > 0 ? (
                            salaryDetails.employee_salary_deduction.map((item, index) => (
                              <tr key={index} className="hover:bg-[var(--color-bg-primary)]">
                                <td className="p-2.5 font-medium">{item.deduction_name}</td>
                                <td className="p-2.5 text-right font-semibold text-[var(--color-text-error)]">{formatCurrency(item.deduction_amount)}</td>
                              </tr>
                            ))
                          ) : (
                            <tr><td colSpan="2" className="p-3 text-center text-[var(--color-text-muted)] italic">No deductions registered.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Active Loan Ledger Segment */}
                  <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-primary-light)]/70 rounded-xl p-4 shadow-xs">
                    <h4 className="text-md font-bold  text-[var(--color-text-secondary)] tracking-wider mb-3 flex items-center gap-2">
                      <span className="w-1.5 h-3 rounded-full bg-amber-500" />
                      Loan Installments & Advances Recovery
                    </h4>
                    <div className="space-y-3 text-xs">
                      {/* Active Loans Mapping loops */}
                      <div>
                        <p className="text-[11px] font-bold  tracking-wider text-[var(--color-text-muted)] mb-1.5">Loans Ledger</p>
                        {salaryDetails.employee_salary_loan?.length > 0 ? (
                          <div className="border border-[var(--color-border-divider)] rounded-lg divide-y divide-[var(--color-border-divider)]">
                            {salaryDetails.employee_salary_loan.map((loan, idx) => (
                              <div key={idx} className="p-2.5 flex justify-between items-center bg-[var(--color-bg-primary)]/40">
                                <div>
                                  <span className="bg-amber-100 text-amber-800 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded mr-1.5">{loan.loan_priority_name || 'Standard'} Priority</span>
                                  <span className="text-[var(--color-text-muted)]">{loan.loan_payment_date}</span>
                                </div>
                                <span className="font-bold text-[var(--color-text-error)]">{formatCurrency(loan.installment_amount)}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-[var(--color-text-muted)] italic">No running active loans.</p>
                        )}
                      </div>

                      {/* Dynamic Advances Loop mapping */}
                      <div className="pt-1">
                        <p className="text-[11px] font-bold  tracking-wider text-[var(--color-text-muted)] mb-1.5">Advances Ledger</p>
                        {salaryDetails.employee_salary_advance?.length > 0 ? (
                          <div className="border border-[var(--color-border-divider)] rounded-lg divide-y divide-[var(--color-border-divider)]">
                            {salaryDetails.employee_salary_advance.map((adv, idx) => (
                              <div key={idx} className="p-2.5 flex justify-between items-center bg-[var(--color-bg-primary)]/40">
                                <div>
                                  <span className="bg-blue-100 text-blue-800 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded mr-1.5">{adv.advance_priority_name || 'Advance'}</span>
                                  <span className="text-[var(--color-text-muted)]">{adv.advance_payment_date}</span>
                                </div>
                                <span className="font-bold text-[var(--color-text-error)]">{formatCurrency(adv.amount)}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-[var(--color-text-muted)] italic">No salary advances processed.</p>
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              </div>

            </div>

            {/* Sheet Action Footer */}
            <div className="p-4 bg-[var(--color-bg-secondary)] border-t border-[var(--color-border-divider)] flex justify-end shrink-0">
              <button
                onClick={() => {
                  setShowSalaryDetailsModal(false);
                  setSalaryDetails(null);
                }}
                className="px-5 py-2 text-xs font-semibold text-[var(--color-text-secondary)] bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)] hover:bg-[var(--color-bg-gray-light)] rounded-lg transition-colors"
              >
                Close View
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