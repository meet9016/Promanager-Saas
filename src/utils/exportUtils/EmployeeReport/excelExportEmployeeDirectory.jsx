import { exportToStyledExcel } from '../commonExcelExport';
import { buildCenteredRange } from '../commonPdfExport';

/**
 * Excel export function for Employee Directory Report - Brand Purple Theme
 * @param {Array} data - Array of employee objects to export
 * @param {string} filename - Name of the file (without extension)
 * @param {Object} options - Additional options including companyName, filters
 */
export const exportToExcel = async (data, filename, options = {}) => {
    if (!data || data.length === 0) {
        throw new Error('No data available to export');
    }

    const headers = Object.keys(data[0]);
    const totalEmployees = data.length;
    const activeEmployees = data.filter(emp => emp.Status === 'Active').length;
    const inactiveEmployees = data.filter(emp => emp.Status === 'Inactive').length;

    const summaryCards = [
        { label: 'Total Employees', value: totalEmployees },
        { label: 'Active Employees', value: activeEmployees },
        { label: 'Inactive Employees', value: inactiveEmployees },
    ];

    const dateRangeText = buildCenteredRange(options.filters || {});

    await exportToStyledExcel({
        title: 'EMPLOYEE DIRECTORY REPORT',
        companyName: options.companyName || 'Your Company Name',
        dateRangeText,
        summaryCards,
        headers,
        data,
        filename: filename || 'Employee_Directory_Report',
        sheetName: 'Employee Directory',
    });
};