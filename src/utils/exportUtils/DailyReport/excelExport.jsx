import { exportToStyledExcel } from '../commonExcelExport';

/**
 * Excel export function for Daily Attendance Report - Styled Purple Theme
 * @param {Array} data - Array of attendance objects to export
 * @param {string|Date} reportDate - Selected date for the report
 * @param {string} filename - Name of the file (without extension)
 * @param {Object} options - Additional options including companyName
 */
export const exportToExcel = async (data, reportDate, filename, options = {}) => {
    if (!data || data.length === 0) {
        throw new Error('No data available to export');
    }

    const headers = Object.keys(data[0]);

    // Calculate summary statistics
    const totalEmployees = data.length;
    const presentCount = data.filter(emp => emp.Status === 'Present' || emp.Status === 'P').length;
    const absentCount = data.filter(emp => emp.Status === 'Absent' || emp.Status === 'A').length;
    const weekOffCount = data.filter(emp => emp.Status === 'Week Off' || emp.Status === 'WO').length;
    const lateCount = data.filter(emp => emp['Remaining Hours'] !== '--' && emp['Remaining Hours'] !== undefined && parseFloat(emp['Remaining Hours']) > 0).length;
    const overtimeCount = data.filter(emp => emp['Overtime Hours'] !== '--' && emp['Overtime Hours'] !== undefined && parseFloat(emp['Overtime Hours']) > 0).length;

    const summaryCards = [
        { label: 'Total Employees', value: totalEmployees },
        { label: 'Present', value: presentCount },
        { label: 'Absent', value: absentCount },
        { label: 'Week Off', value: weekOffCount },
        { label: 'Late', value: lateCount },
        { label: 'Overtime', value: overtimeCount },
    ];

    let formattedDate = '';
    if (reportDate) {
        try {
            formattedDate = new Date(reportDate).toLocaleDateString('en-GB', {
                weekday: 'short',
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            });
        } catch (e) {
            formattedDate = String(reportDate);
        }
    }

    await exportToStyledExcel({
        title: 'DAILY ATTENDANCE REPORT',
        companyName: options.companyName || 'Your Company Name',
        dateRangeText: formattedDate ? `Date: ${formattedDate}` : '',
        summaryCards,
        headers,
        data,
        filename: filename || `daily_attendance_report_${formattedDate.replace(/,/g, '').replace(/\s+/g, '_')}`,
        sheetName: 'Daily Attendance',
    });
};