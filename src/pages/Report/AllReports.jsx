import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Calendar,
    Clock,
    Users,
    TrendingUp,
    BarChart3,
    Activity,
    CheckCircle,
    Eye,
    ArrowLeft,
    Target,
    IndianRupee,
    AlertCircle,
    Globe,
    AlertTriangle
} from 'lucide-react';
import { Toast } from '../../Components/ui/Toast';

const AllReports = () => {
    const navigate = useNavigate();
    const [toast, setToast] = useState(null);

    const availableReports = [
        {
            id: 'employee-list',
            title: 'Employee Directory',
            icon: Users,
            color: 'from-[var(--color-primary-dark)] to-[var(--color-primary-darker)]',
            path: '/reports/employee-directory',
            category: 'employees',
            isAvailable: true,
            features: [
                'Employee profiles with detailed information',
                'Contact and job role details',
                'Department and branch assignments',
                'Employee ID and employment status tracking',
                'Multi-format export (Excel, PDF)',
                'Professional PDF reports with branding'
            ]
        },
        {
            id: 'daily-attendance',
            title: 'Daily Attendance',
            icon: Calendar,
            color: 'from-[var(--color-primary-dark)] to-[var(--color-primary-darker)]',
            path: '/reports/daily-attendance',
            category: 'attendance',
            isAvailable: true,
            features: [
                'Daily clock in/out timestamps',
                'Working hours and overtime tracking',
                'Late arrival and absence reports',
                'Department-wise filtering',
                'Date range selection',
                'Export as Excel or PDF'
            ]
        },
        {
            id: 'daily-attendance-detailed',
            title: 'Daily Attendance – Detailed',
            icon: Calendar,
            color: 'from-[var(--color-primary-dark)] to-[var(--color-primary-darker)]',
            path: '/reports/daily-attendance-detailed',
            category: 'attendance',
            isAvailable: true,
            features: [
                'All punch records per employee',
                'Working hours, late and overtime insights',
                'Clean A4 PDF export with pro layout',
                'Department/branch/designation filters',
                'Compact records view, less spacing',
                'Export as Excel or PDF'
            ]
        },
        {
            id: 'geolocation-report',
            title: 'Geolocation Attendance Report',
            icon: Globe,
            color: 'from-[var(--color-primary-dark)] to-[var(--color-primary-darker)]',
            path: '/reports/geolocation-report',
            category: 'attendance',
            isAvailable: true,
            features: [
                'Location-verified attendance tracking',
                'GPS coordinates for clock in/out events',
                'Interactive timeline with geolocation details',
                'Device type identification (Web, Desktop, Mobile)',
                'Face photo verification with timestamps',
                'Google Maps integration for location viewing'
            ]
        },
        {
            id: 'attendance-exception',
            title: 'Attendance Exception Report',
            icon: AlertTriangle,
            color: 'from-[var(--color-primary-dark)] to-[var(--color-primary-darker)]',
            path: '/reports/attendance-exception',
            category: 'attendance',
            isAvailable: true,
            features: [
                'Late Coming – employees past shift start time',
                'Early Going – employees leaving before shift end',
                'Short Hours – worked fewer than required hours',
                'Missed Punch – incomplete clock in/out records',
                'Tab-wise view with exception counts',
                'Export as Excel or PDF per exception type'
            ]
        },
        {
            id: 'monthly-exception',
            title: 'Monthly Exception Report',
            icon: AlertTriangle,
            color: 'from-[var(--color-primary-dark)] to-[var(--color-primary-darker)]',
            path: '/reports/monthly-exception',
            category: 'attendance',
            isAvailable: true,
            features: [
                'Monthly aggregated late coming with total late time',
                'Early going days and cumulative early time',
                'Short hours days and total shortfall per employee',
                'Missed punch days across the month',
                'Tab-wise view with per-employee monthly counts',
                'Branch / Department / Designation / Employee filters'
            ]
        },
        {
            id: 'monthly-attendance',
            title: 'Monthly Attendance Summary',
            icon: BarChart3,
            color: 'from-[var(--color-primary-dark)] to-[var(--color-primary-darker)]',
            path: '/reports/monthly-attendance',
            category: 'attendance',
            isAvailable: true,
            features: [
                'Monthly attendance overview',
                'Attendance rate and percentage metrics',
                'Leave and holiday summaries',
                'Employee-wise breakdowns',
                'Visual indicators for status',
                'Export as Excel or PDF'
            ]
        },
        {
            id: 'monthly-attendance-muster',
            title: 'Monthly Attendance Muster – Summary',
            icon: BarChart3,
            color: 'from-[var(--color-primary-dark)] to-[var(--color-primary-darker)]',
            path: '/reports/monthly-attendance-muster',
            category: 'attendance',
            isAvailable: true,
            features: [
                'Grid: employees × days (1–31)',
                'Weekend shading & legend codes',
                'Row-wise totals (P, A, L, H, HP, WO, WOP, ½P)',
                'Sticky employee columns for easy scroll',
                'Excel (.xls) + PDF exports',
                'Department/Branch/Designation filters'
            ]
        },
        {
            id: 'monthly-salary-report',
            title: 'Monthly Salary Report',
            icon: IndianRupee,
            color: 'from-[var(--color-primary-dark)] to-[var(--color-primary-darker)]',
            path: '/reports/monthly-salary',
            category: 'payroll',
            isAvailable: true,
            features: [
                'Monthly employee salary calculations',
                'Basic, allowance, and deduction breakdown',
                'Attendance-integrated pay automation',
                'Overtime and leave deduction handling',
                'PDF salary slips and export-ready reports',
                'Summary of total payout'
            ]
        },
        {
            id: 'pay-monthly-salary-report',
            title: 'Paid Salary Report (BETA)',
            icon: IndianRupee,
            color: 'from-[var(--color-primary-dark)] to-[var(--color-primary-darker)]',
            path: '/reports/pay-monthly-salary',
            category: 'payroll',
            isAvailable: true,
            features: [
                'List of employees who received salary',
                'Base salary, overtime and week-off breakdown',
                'Attendance-integrated pay details',
                'Subtotal and final net payable amounts',
                'Branch / Department / Designation filters',
                'Export as Excel or PDF'
            ]
        },
        {
            id: 'salary-generation-status',
            title: 'Salary Generation Status (BETA)',
            icon: CheckCircle,
            color: 'from-[var(--color-primary-dark)] to-[var(--color-primary-darker)]',
            path: '/reports/salary-generation-status',
            category: 'payroll',
            isAvailable: true,
            features: [
                'Overview of salary generation status per employee',
                'Generated vs pending vs failed at a glance',
                'Employee department, branch and designation info',
                'Base salary reference for each employee',
                'Branch / Department / Designation filters',
                'Export as Excel or PDF'
            ]
        },
        {
            id: 'date-range-report',
            title: 'Attendance – Custom Range',
            icon: Calendar,
            color: 'from-[var(--color-primary-dark)] to-[var(--color-primary-darker)]',
            path: '/reports/daterangereport',
            category: 'attendance',
            isAvailable: true,
            features: [
                'Attendance tracking within custom date range',
                'Employee-wise summaries and trends',
                'Overtime and late arrival insights',
                'Clock in/out history with status',
                'Clean, exportable PDF format'
            ]
        }
    ];

    const comingSoonReports = [
        {
            id: 'payroll-summary',
            title: 'Payroll Summary',
            icon: IndianRupee,
            color: 'from-[var(--color-primary-dark)] to-[var(--color-primary-darker)]',
            category: 'payroll',
            isAvailable: false,
            plannedFeatures: [
                'Salary calculations',
                'Deductions tracking',
                'Tax calculations',
                'Pay slip generation',
                'Bonus calculations'
            ]
        },
        {
            id: 'performance-reports',
            title: 'Performance Reports',
            icon: TrendingUp,
            color: 'from-[var(--color-primary-dark)] to-[var(--color-primary-darker)]',
            category: 'performance',
            isAvailable: false,
            plannedFeatures: [
                'Performance metrics',
                'Goal tracking',
                'Evaluation reports',
                'Growth analysis',
                'KPI dashboard'
            ]
        }
    ];

    const showToast = (message, type = 'info') => setToast({ message, type });
    const hideToast = () => setToast(null);

    const handleReportClick = (report) => {
        if (!report.isAvailable) {
            showToast('This report is not available yet.', 'warning');
            return;
        }
        try {
            navigate(report.path);
        } catch (err) {
            showToast('Failed to navigate to report. Please try again.', err);
        }
    };

    const handleNavigateBack = () => {
        try {
            navigate(-1);
        } catch (err) {
            showToast('Failed to navigate back. Please try again.', err);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--color-bg-primary)]">
            {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

            <div className="p-8  mx-auto">
                {/* Header */}
                <div className="bg-[var(--color-bg-secondary)] rounded-2xl shadow-xl mb-8 overflow-hidden">
                    <div className="bg-gradient-to-r from-[var(--color-primary-dark)] to-[var(--color-primary-darker)] p-8">
                        <div className="flex items-center gap-4">
                            <button
                                type="button"
                                onClick={handleNavigateBack}
                                className="flex items-center gap-2 text-[var(--color-text-white)] transition-colors bg-[var(--color-bg-secondary-20)] hover:bg-[var(--color-bg-secondary-30)] px-4 py-2 rounded-lg backdrop-blur-sm"
                                aria-label="Go back"
                            >
                                <ArrowLeft size={18} />
                                Back
                            </button>
                            <h1 className="text-2xl font-bold text-[var(--color-text-white)]">Reports Dashboard</h1>
                        </div>
                    </div>
                </div>

                {/* Available Reports */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-[var(--color-primary-lighter)] rounded-lg">
                            <CheckCircle className="h-5 w-5 text-[var(--color-primary-dark)]" />
                        </div>
                        <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Available Reports</h2>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                        {availableReports.map((report) => (
                            <div
                                key={report.id}
                                className="bg-[var(--color-bg-secondary)] rounded-xl shadow-sm border border-[var(--color-border-primary)] overflow-hidden hover:shadow-md transition-all duration-300 hover:scale-105 flex flex-col h-full"
                            >
                                <div className={`bg-gradient-to-r ${report.color} p-8 min-h-[88px] flex items-center`}>
                                    <div className="flex items-center gap-3 w-full">
                                        <div className="p-2 bg-white/20 rounded-lg flex-shrink-0">
                                            <report.icon className="h-6 w-6 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-lg font-semibold text-white line-clamp-1">{report.title}</h3>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 flex-1 flex flex-col">
                                    <div className="flex-1">
                                        <h4 className="font-medium text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
                                            <Activity className="h-4 w-4 text-[var(--color-primary-dark)]" />
                                            Features:
                                        </h4>
                                        <ul className="text-sm text-[var(--color-text-secondary)] space-y-2">
                                            {report.features.map((feature, i) => (
                                                <li key={i} className="flex items-center gap-2">
                                                    <CheckCircle className="h-3 w-3 text-[var(--color-primary-dark)] flex-shrink-0" />
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-[var(--color-border-primary)]">
                                        <div className="flex items-center gap-2 text-sm text-[var(--color-primary-dark)]">
                                            <CheckCircle className="h-4 w-4" />
                                            <span className="font-medium">Available</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleReportClick(report)}
                                            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary-dark)] text-[var(--color-text-white)] rounded-lg hover:bg-[var(--color-primary-darker)] transition-colors"
                                            aria-label={`Open ${report.title}`}
                                        >
                                            <Eye className="h-4 w-4" />
                                            View Report
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Coming Soon */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-[var(--color-bg-gray-light)] rounded-lg">
                            <Clock className="h-5 w-5 text-[var(--color-text-muted)]" />
                        </div>
                        <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Coming Soon</h2>
                        <div className="flex items-center gap-2 px-3 py-1 bg-[var(--color-bg-gray-light)] rounded-full">
                            <span className="text-sm font-medium text-[var(--color-text-muted)]">
                                {comingSoonReports.length} Reports
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {comingSoonReports.map((report) => (
                            <div
                                key={report.id}
                                className="bg-[var(--color-bg-secondary)] rounded-xl shadow-sm border border-[var(--color-border-primary)] overflow-hidden opacity-75 hover:opacity-85 transition-opacity"
                                aria-disabled="true"
                            >
                                <div className={`bg-gradient-to-r ${report.color} p-8 relative`}>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white/20 rounded-lg">
                                            <report.icon className="h-6 w-6 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-white">{report.title}</h3>
                                        </div>
                                    </div>
                                    <div className="absolute top-3 right-3">
                                        <div className="px-2 py-1 bg-white/20 rounded-full text-xs text-white font-medium">Soon</div>
                                    </div>
                                </div>

                                <div className="p-8">
                                    <div className="mb-4">
                                        <h4 className="font-medium text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
                                            <Target className="h-4 w-4 text-[var(--color-text-muted)]" />
                                            Planned Features:
                                        </h4>
                                        <ul className="text-sm text-[var(--color-text-secondary)] space-y-2">
                                            {report.plannedFeatures.map((feature, i) => (
                                                <li key={i} className="flex items-center gap-2">
                                                    <Clock className="h-3 w-3 text-[var(--color-text-muted)] flex-shrink-0" />
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border-primary)]">
                                        <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                                            <Clock className="h-4 w-4" />
                                            <span className="font-medium">Coming Soon</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setToast({ message: 'This report is not available yet.', type: 'warning' })}
                                            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-bg-gray-light)] text-[var(--color-text-muted)] rounded-lg cursor-not-allowed"
                                            aria-label="Not available"
                                        >
                                            <AlertCircle className="h-4 w-4" />
                                            Not Available
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AllReports;