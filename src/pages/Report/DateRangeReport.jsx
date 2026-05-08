import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosInstance';
import { Toast } from '../../Components/ui/Toast';

import {
    Calendar,
    Download,
    FileText,
    AlertCircle,
    Users,
    Clock,
    TrendingUp,
    CheckCircle,
    ArrowLeft,
    RefreshCw,
    XCircle
} from 'lucide-react';

import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// Import PDF export utility
import { exportToPDF } from '../../utils/exportUtils/DateRangeReport/PdfExportDateRange.jsx';
import { exportToExcel } from '../../utils/exportUtils/DateRangeReport/ExcelExportDateRange.jsx';

const DateRangeReport = () => {
    // Initialize with Date objects instead of strings
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState(null);
    const [exportType, setExportType] = useState('pdf');

    const navigate = useNavigate();
    const { user } = useAuth();

    // Toast helper functions
    const showToast = (message, type = 'info') => {
        setToast({ message, type });
    };

    const closeToast = () => {
        setToast(null);
    };

    // Helper function to format date for API
    const formatDateForAPI = (date) => {
        return date.toISOString().split('T')[0];
    };

    // Updated handleGenerateAndExport function
    const handleGenerateAndExport = useCallback(async () => {
        if (!startDate || !endDate) {
            showToast('Please select both start and end dates', 'error');
            return;
        }

        if (startDate > endDate) {
            showToast('Start date cannot be after end date', 'error');
            return;
        }

        if (!user?.user_id) {
            showToast('User not authenticated', 'error');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Step 1: Fetch data
            showToast('Fetching attendance data...', 'info');

            const formData = new FormData();
            formData.append('user_id', user.user_id);
            formData.append('start_date', formatDateForAPI(startDate));
            formData.append('end_date', formatDateForAPI(endDate));

            const response = await api.post('data_range_attendance_report_list', formData);

            if (!response.data?.success || !response.data.data) {
                throw new Error(response.data?.message || 'Failed to fetch attendance data');
            }

            const attendanceData = response.data.data;

            if (!attendanceData || attendanceData.length === 0) {
                showToast('No attendance data found for the selected date range', 'warning');
                return;
            }

            // Step 2: Process data
            showToast('Processing data...', 'info');

            // Step 3: Generate export based on selected type
            if (exportType === 'pdf') {
                showToast('Generating compact PDF...', 'info');

                const result = await exportToPDF(
                    attendanceData,
                    formatDateForAPI(startDate),
                    formatDateForAPI(endDate)
                );

                showToast(
                    `PDF generated successfully! Report contains ${result.recordCount} records for ${result.employeeCount} employees`,
                    'success'
                );
            } else if (exportType === 'excel') {
                showToast('Generating Excel file...', 'info');
                exportToExcel(attendanceData, formatDateForAPI(startDate), formatDateForAPI(endDate));

                // Group data to count employees for Excel
                const uniqueEmployees = [...new Set(attendanceData.map(record => record.employee_id))];
                showToast(
                    `Excel file generated successfully! Report contains ${attendanceData.length} records for ${uniqueEmployees.length} employees`,
                    'success'
                );
            }

        } catch (err) {
            const errorMessage = err.message || 'An error occurred while generating the report';
            setError(errorMessage);
            showToast(errorMessage, 'error');
            console.error('Export Error:', err);
        } finally {
            setLoading(false);
        }
    }, [user?.user_id, startDate, endDate, exportType]);

    // Handle retry
    const handleRetry = () => {
        setError(null);
        handleGenerateAndExport();
    };

    return (
        <div className="min-h-screen bg-[var(--color-bg-primary)]">

            {/* Toast Component */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={closeToast}
                />
            )}

            <div className="p-8  mx-auto">
                {/* Header Section */}
                <div className="bg-[var(--color-bg-secondary)] rounded-2xl shadow-xl mb-8 overflow-hidden">
                    <div className="bg-gradient-to-r from-[var(--color-primary-dark)] to-[var(--color-primary-darker)] p-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => navigate('/reports')}
                                    className="flex items-center gap-2 text-[var(--color-text-white)] hover:text-[var(--color-text-white)] transition-colors bg-[var(--color-bg-secondary-20)] hover:bg-[var(--color-bg-secondary-30)] px-4 py-2 rounded-lg backdrop-blur-sm"
                                >
                                    <ArrowLeft size={18} />
                                    Back
                                </button>
                                <div className="flex items-center gap-3">
                                    <div>
                                        <h1 className="text-2xl font-bold text-[var(--color-text-white)]">
                                            Date Range Report
                                        </h1>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Date Range Selection Card */}
                <div className="bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-primary-dark)] overflow-hidden shadow-sm mb-6">
                    <div className="px-6 py-4 border-b border-[var(--color-primary-light)] bg-[var(--color-primary-dark)]">
                        <div className="flex items-center">
                            <FileText className="h-6 w-6 text-[var(--color-text-white)] mr-2" />
                            <h3 className="text-lg font-medium text-[var(--color-text-white)]">
                                Export Settings
                            </h3>
                        </div>
                    </div>

                    <div className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                                    Start Date
                                </label>
                                <div className="flex items-center space-x-2 ">
                                    <Calendar className="w-5 h-5 text-[var(--color-bg)] " />
                                    <DatePicker
                                        selected={startDate}
                                        onChange={(date) => setStartDate(date)}
                                        dateFormat="dd-MM-yyyy"
                                        placeholderText="DD-MM-YYYY"
                                        className="custom-datepicker"
                                        maxDate={new Date()}
                                        showPopperArrow={false}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                                    End Date
                                </label>
                                <div className="flex items-center space-x-2">
                                    <Calendar className="w-5 h-5 text-[var(--color-bg)]" />
                                    <DatePicker
                                        selected={endDate}
                                        onChange={(date) => setEndDate(date)}
                                        dateFormat="dd-MM-yyyy"
                                        placeholderText="DD-MM-YYYY"
                                        className="custom-datepicker"
                                        minDate={startDate}
                                        maxDate={new Date()}
                                        showPopperArrow={false}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                                    Export Format
                                </label>
                                <select
                                    value={exportType}
                                    onChange={(e) => setExportType(e.target.value)}
                                    className="w-full px-4 py-3 border border-[var(--color-border-secondary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-dark)] focus:border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)]"
                                >
                                    <option value="pdf">PDF Report</option>
                                    <option value="excel">Excel Spreadsheet</option>
                                </select>
                            </div>
                        </div>

                        <div className="mt-6">
                            <button
                                onClick={handleGenerateAndExport}
                                disabled={loading}
                                className="w-full md:w-auto px-6 py-3 bg-[var(--color-primary-dark)] text-[var(--color-text-white)] rounded-lg hover:bg-[var(--color-primary-darker)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-medium"
                            >
                                {loading ? (
                                    <>
                                        <RefreshCw className="w-5 h-5 animate-spin" />
                                        Generating {exportType === 'pdf' ? 'PDF' : 'Excel'}...
                                    </>
                                ) : (
                                    <>
                                        <Download className="w-5 h-5" />
                                        Generate & Export {exportType === 'pdf' ? 'PDF' : 'Excel'}
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Status Messages */}
                        {loading && (
                            <div className="mt-6 bg-[var(--color-primary-lightest)] border border-[var(--color-primary-light)] rounded-lg p-4">
                                <div className="flex items-center gap-3">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[var(--color-primary-dark)]"></div>
                                    <p className="text-[var(--color-primary-dark)] font-medium">Processing your request...</p>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="mt-6 bg-[var(--color-error-light)] border border-[var(--color-border-error)] rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <XCircle className="w-5 h-5 text-[var(--color-error)]" />
                                        <div>
                                            <p className="text-[var(--color-error-dark)] font-medium">Error generating report</p>
                                            <p className="text-[var(--color-text-error)] text-sm mt-1">{error}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleRetry}
                                        className="flex items-center gap-2 bg-[var(--color-error-light)] text-[var(--color-error-dark)] px-4 py-2 rounded-lg hover:bg-[var(--color-error-lighter)] transition-colors"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        Try Again
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Features Overview */}
                <div className="bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-primary-dark)] overflow-hidden shadow-sm mb-6">
                    <div className="px-6 py-4 border-b border-[var(--color-primary-light)] bg-[var(--color-primary-dark)]">
                        <div className="flex items-center">
                            <TrendingUp className="h-6 w-6 text-[var(--color-text-white)] mr-2" />
                            <h3 className="text-lg font-medium text-[var(--color-text-white)]">
                                Report Features
                            </h3>
                        </div>
                    </div>

                    <div className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex items-start gap-4 p-4 bg-[var(--color-bg-primary)] rounded-lg border border-[var(--color-border-primary)]">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <Users className="w-6 h-6 text-green-600" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-[var(--color-text-primary)] mb-1">Employee-wise Organization</h4>
                                    <p className="text-sm text-[var(--color-text-secondary)]">Data grouped by employee with individual summaries and attendance patterns</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-4 bg-[var(--color-bg-primary)] rounded-lg border border-[var(--color-border-primary)]">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <TrendingUp className="w-6 h-6 text-purple-600" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-[var(--color-text-primary)] mb-1">Comprehensive Analytics</h4>
                                    <p className="text-sm text-[var(--color-text-secondary)]">Attendance percentages, hours worked, overtime tracking, and late arrival analysis</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-4 bg-[var(--color-bg-primary)] rounded-lg border border-[var(--color-border-primary)]">
                                <div className="p-2 bg-orange-100 rounded-lg">
                                    <Clock className="w-6 h-6 text-orange-600" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-[var(--color-text-primary)] mb-1">Daily Records</h4>
                                    <p className="text-sm text-[var(--color-text-secondary)]">Complete daily attendance records with clock in/out times and status tracking</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-4 bg-[var(--color-bg-primary)] rounded-lg border border-[var(--color-border-primary)]">
                                <div className="p-2 bg-primary-100 rounded-lg">
                                    <CheckCircle className="w-6 h-6 text-primary-600" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-[var(--color-text-primary)] mb-1">Professional Format</h4>
                                    <p className="text-sm text-[var(--color-text-secondary)]">Clean, print-ready PDF with professional styling and organized layout</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Instructions */}
                <div className="bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-primary-dark)] overflow-hidden shadow-sm">
                    <div className="px-6 py-4 border-b border-[var(--color-primary-light)] bg-[var(--color-primary-dark)]">
                        <div className="flex items-center">
                            <Download className="h-6 w-6 text-[var(--color-text-white)] mr-2" />
                            <h3 className="text-lg font-medium text-[var(--color-text-white)]">
                                How to Use
                            </h3>
                        </div>
                    </div>

                    <div className="p-8">
                        <div className="space-y-4">
                            <div className="flex items-start gap-4 p-4 bg-[var(--color-bg-primary)] rounded-lg border border-[var(--color-border-primary)]">
                                <div className="flex-shrink-0 w-8 h-8 bg-[var(--color-primary-dark)] text-[var(--color-text-white)] rounded-full flex items-center justify-center text-sm font-medium">1</div>
                                <div>
                                    <h4 className="font-medium text-[var(--color-text-primary)] mb-1">Select Date Range</h4>
                                    <p className="text-sm text-[var(--color-text-secondary)]">Choose your desired start and end dates for the report period using the date pickers above</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-4 bg-[var(--color-bg-primary)] rounded-lg border border-[var(--color-border-primary)]">
                                <div className="flex-shrink-0 w-8 h-8 bg-[var(--color-primary-dark)] text-[var(--color-text-white)] rounded-full flex items-center justify-center text-sm font-medium">2</div>
                                <div>
                                    <h4 className="font-medium text-[var(--color-text-primary)] mb-1">Choose Export Format</h4>
                                    <p className="text-sm text-[var(--color-text-secondary)]">Select whether you want to export as PDF or Excel spreadsheet format</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-4 bg-[var(--color-bg-primary)] rounded-lg border border-[var(--color-border-primary)]">
                                <div className="flex-shrink-0 w-8 h-8 bg-[var(--color-primary-dark)] text-[var(--color-text-white)] rounded-full flex items-center justify-center text-sm font-medium">3</div>
                                <div>
                                    <h4 className="font-medium text-[var(--color-text-primary)] mb-1">Generate Report</h4>
                                    <p className="text-sm text-[var(--color-text-secondary)]">Click "Generate & Export" to fetch attendance data and create the comprehensive report in your chosen format</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-4 bg-[var(--color-bg-primary)] rounded-lg border border-[var(--color-border-primary)]">
                                <div className="flex-shrink-0 w-8 h-8 bg-[var(--color-primary-dark)] text-[var(--color-text-white)] rounded-full flex items-center justify-center text-sm font-medium">4</div>
                                <div>
                                    <h4 className="font-medium text-[var(--color-text-primary)] mb-1">Processing</h4>
                                    <p className="text-sm text-[var(--color-text-secondary)]">The system will process the data and automatically open the print dialog in a new window</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-4 bg-[var(--color-bg-primary)] rounded-lg border border-[var(--color-border-primary)]">
                                <div className="flex-shrink-0 w-8 h-8 bg-[var(--color-primary-dark)] text-[var(--color-text-white)] rounded-full flex items-center justify-center text-sm font-medium">5</div>
                                <div>
                                    <h4 className="font-medium text-[var(--color-text-primary)] mb-1">Export</h4>
                                    <p className="text-sm text-[var(--color-text-secondary)]">Choose "Save as PDF" or your preferred printer to complete the export process</p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default DateRangeReport;