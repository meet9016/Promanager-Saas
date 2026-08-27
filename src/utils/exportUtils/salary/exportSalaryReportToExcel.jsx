// utils/exportUtils/salary/exportSalaryReportToExcel.jsx — Brand Purple Theme
import { exportToStyledExcel } from '../commonExcelExport';

// Group data by employee (if needed for payroll)
export const groupPayrollDataByEmployee = (data) => {
    const grouped = {};

    data.forEach(record => {
        const employeeKey = record.employee_code || record.id;
        if (!grouped[employeeKey]) {
            grouped[employeeKey] = {
                employee_code: record.employee_code || record.id,
                employee_name: record.employee_name || record.name || record.Name,
                department: record.department || '',
                designation: record.designation || '',
                records: []
            };
        }
        grouped[employeeKey].records.push(record);
    });

    return grouped;
};

// Calculate payroll summary statistics
export const calculatePayrollSummary = (data) => {
    const totalEmployees = data.length;
    const totalBaseSalary = data.reduce((sum, r) => sum + parseFloat(r.employee_salary || 0), 0);
    const totalWorkingDays = data.reduce((sum, r) => sum + parseFloat(r.working_days || 0), 0);
    const totalWeekOffDays = data.reduce((sum, r) => sum + parseFloat(r.week_off_days || 0), 0);
    const totalPresentDays = data.reduce((sum, r) => sum + parseFloat(r.present_days || 0), 0);
    const totalAbsentDays = data.reduce((sum, r) => sum + parseFloat(r.absent_days || 0), 0);
    const totalOvertimeDays = data.reduce((sum, r) => sum + parseFloat(r.overtime_days || 0), 0);
    const totalSubtotalSalary = data.reduce((sum, r) => sum + parseFloat(r.subtotal_salary || 0), 0);
    const totalOvertimeSalary = data.reduce((sum, r) => sum + parseFloat(r.overtime_salary || 0), 0);
    const totalWeekOffSalary = data.reduce((sum, r) => sum + parseFloat(r.week_off_salary || 0), 0);
    const totalNetSalary = data.reduce((sum, r) => sum + parseFloat(r.total_salary || 0), 0);

    return {
        totalEmployees,
        totalBaseSalary: totalBaseSalary.toFixed(2),
        totalWorkingDays: totalWorkingDays.toFixed(0),
        totalWeekOffDays: totalWeekOffDays.toFixed(0),
        totalPresentDays: totalPresentDays.toFixed(0),
        totalAbsentDays: totalAbsentDays.toFixed(0),
        totalOvertimeDays: totalOvertimeDays.toFixed(0),
        totalSubtotalSalary: totalSubtotalSalary.toFixed(2),
        totalOvertimeSalary: totalOvertimeSalary.toFixed(2),
        totalWeekOffSalary: totalWeekOffSalary.toFixed(2),
        totalNetSalary: totalNetSalary.toFixed(2)
    };
};

// Format currency for display
export const formatCurrency = (amount) => {
    return parseFloat(amount || 0).toFixed(2);
};

// Format date
export const formatDate = (dateInput) => {
    const date = new Date(dateInput);

    if (Object.prototype.toString.call(date) !== '[object Date]' || isNaN(date.getTime())) {
        return 'Invalid Date';
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
};

// Export payroll to Excel function using commonExcelExport
export const exportPayrollToExcel = async (
    payrollData,
    monthYear = null,
    filename = 'payroll_report',
    title = 'Monthly Salary Report',
    getMonthYearDisplay = null,
    companyName = 'Your Company Name'
) => {
    if (!payrollData || payrollData.length === 0) {
        throw new Error('No data available to export');
    }

    const payrollSummary = calculatePayrollSummary(payrollData);
    const monthDisplay = getMonthYearDisplay ? getMonthYearDisplay(monthYear) : (monthYear || 'Current Period');

    const summaryCards = [
        { label: 'Total Employees', value: payrollSummary.totalEmployees },
        { label: 'Total Base Salary', value: `₹${payrollSummary.totalBaseSalary}` },
        { label: 'Total Present Days', value: payrollSummary.totalPresentDays },
        { label: 'Total Absent Days', value: payrollSummary.totalAbsentDays },
        { label: 'Total Net Salary', value: `₹${payrollSummary.totalNetSalary}` },
    ];

    const headers = [
        { key: 'sr_no', label: 'Sr.#' },
        { key: 'employee_code', label: 'Employee Code' },
        { key: 'employee_name', label: 'Employee Name' },
        { key: 'employee_salary', label: 'Base Salary' },
        { key: 'working_days', label: 'Work Days' },
        { key: 'present_days', label: 'Present' },
        { key: 'absent_days', label: 'Absent' },
        { key: 'overtime_days', label: 'OT Days' },
        { key: 'overtime_salary', label: 'OT Pay' },
        { key: 'week_off_days', label: 'WO Days' },
        { key: 'week_off_salary', label: 'WO Pay' },
        { key: 'subtotal_salary', label: 'Subtotal' },
        { key: 'total_salary', label: 'Final Salary' },
    ];

    const formattedRows = payrollData.map((record, index) => ({
        sr_no: index + 1,
        employee_code: record.employee_code || '--',
        employee_name: record.employee_name || '--',
        employee_salary: `₹${formatCurrency(record.employee_salary)}`,
        working_days: record.working_days || 0,
        present_days: record.present_days || 0,
        absent_days: record.absent_days || 0,
        overtime_days: record.overtime_days || 0,
        overtime_salary: `₹${formatCurrency(record.overtime_salary)}`,
        week_off_days: record.week_off_days || 0,
        week_off_salary: `₹${formatCurrency(record.week_off_salary)}`,
        subtotal_salary: `₹${formatCurrency(record.subtotal_salary)}`,
        total_salary: `₹${formatCurrency(record.total_salary)}`,
    }));

    formattedRows.push({
        sr_no: '',
        employee_code: '',
        employee_name: 'TOTAL',
        employee_salary: `₹${payrollSummary.totalBaseSalary}`,
        working_days: payrollSummary.totalWorkingDays,
        present_days: payrollSummary.totalPresentDays,
        absent_days: payrollSummary.totalAbsentDays,
        overtime_days: payrollSummary.totalOvertimeDays,
        overtime_salary: `₹${payrollSummary.totalOvertimeSalary}`,
        week_off_days: payrollSummary.totalWeekOffDays,
        week_off_salary: `₹${payrollSummary.totalWeekOffSalary}`,
        subtotal_salary: `₹${payrollSummary.totalSubtotalSalary}`,
        total_salary: `₹${payrollSummary.totalNetSalary}`,
    });

    await exportToStyledExcel({
        title: title ? title.toUpperCase() : 'MONTHLY SALARY REPORT',
        companyName: companyName || 'Your Company Name',
        dateRangeText: `Period: ${monthDisplay}`,
        summaryCards,
        headers,
        data: formattedRows,
        filename: filename || `monthly_salary_report_${monthYear || 'current'}`,
        sheetName: 'Monthly Salary',
    });
};

export const handlePayrollExportExcel = async (
    reportData,
    filters,
    summaryStats,
    showToast,
    setExportDropdown,
    getMonthYearDisplay,
    companyName = 'Your Company Name'
) => {
    try {
        if (!reportData || reportData.length === 0) {
            showToast('No data available to export', 'error');
            return;
        }

        const fileName = `monthly_salary_report_${filters.month_year || 'current'}`;
        const title = `Monthly Salary Report`;

        await exportPayrollToExcel(
            reportData,
            filters.month_year,
            fileName,
            title,
            getMonthYearDisplay,
            companyName
        );

        showToast('Excel file exported successfully!', 'success');
        setExportDropdown(false);

    } catch (error) {
        console.error('Error in handlePayrollExportExcel:', error);
        showToast('Failed to export Excel: ' + error.message, 'error');
        setExportDropdown(false);
    }
};