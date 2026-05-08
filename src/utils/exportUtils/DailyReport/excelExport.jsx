/**
 * Excel export function for Daily Attendance Report - Black & White Theme
 * @param {Array} data - Array of attendance objects to export
 * @param {string} reportDate - Selected date for the report
 * @param {string} filename - Name of the file (without extension)
 */
export const exportToExcel = (data, reportDate, filename) => {
    if (!data || data.length === 0) {
        console.error('No data to export');
        throw new Error('No data available to export');
    }

    // Get headers from the first object
    const headers = Object.keys(data[0]);

    // Calculate summary statistics
    const totalEmployees = data.length;
    const presentCount = data.filter(emp => emp.Status === 'Present').length;
    const absentCount = data.filter(emp => emp.Status === 'Absent').length;
    const weekOffCount = data.filter(emp => emp.Status === 'Week Off').length;
    const lateCount = data.filter(emp => emp['Remaining Hours'] !== '--' && parseFloat(emp['Remaining Hours']) > 0).length;
    const overtimeCount = data.filter(emp => emp['Overtime Hours'] !== '--' && parseFloat(emp['Overtime Hours']) > 0).length;

    // Prepare data for Excel export
    const excelData = [];

    // Format date properly
    const formattedDate = new Date(reportDate).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });

    // Add report header
    excelData.push(['', '',  '', '',
        `Daily Attendance Report ${formattedDate}`, '', '', '', '', '', ''
    ]);
    excelData.push([
        '',
        `Date: ${formattedDate}`,
        `Generated: ${new Date().toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })} ${new Date().toLocaleTimeString()}`,
        '',
        '',
        `Total Employees: ${totalEmployees}`,
        '', '', '', '', '', ''
    ]);

    // Add empty row
    excelData.push(['']);

    // Add summary statistics
    excelData.push(['Summary Statistics', '', '', '', '', '', '', '', '', '', '', '']);
    excelData.push(['Present', presentCount, '', 'Absent', absentCount, '', 'Week Off', weekOffCount, '', '', '', '']);
    excelData.push(['Late Employees', lateCount, '', 'Overtime Employees', overtimeCount, '', '', '', '', '', '', '']);

    // Add empty row
    excelData.push(['']);

    // Add table headers
    excelData.push(headers);

    // Add employee data rows
    data.forEach(employee => {
        excelData.push(headers.map(header => {
            const value = employee[header];

            // Return empty string for null, undefined, or empty values
            if (value === null || value === undefined || value === '') {
                return '';
            }

            return value;
        }));
    });

    // Convert to HTML table format with black and white theme
    const tableHTML = `
        <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; border: 2px solid #000;">
            <tbody>
                ${excelData.map((row, rowIndex) => `
                    <tr>
                        ${row.map((cell, cellIndex) => {
        // Base style for all cells
        let cellStyle = "border: 1px solid #000; padding: 8px; text-align: center;";

        // Report title row
        if (rowIndex === 0 && cellIndex === 4) {
            cellStyle += "  color: #000; font-weight: bold; font-size: 20px; text-align: center; border: 2px solid #000;";
        }
        // Date and generated info row
        else if (rowIndex === 1 && (cellIndex === 1 || cellIndex === 2 || cellIndex === 5)) {
            cellStyle += " font-weight: bold; font-size: 15px; border: 1px solid #666;";
        }
        // Summary statistics header
        else if (cell === 'Summary Statistics') {
            cellStyle += " background-color: #f0f0f0; font-weight: bold; font-size: 16px; text-align: center; border: 2px solid #000;";
        }
        // Summary statistics data rows
        else if ((rowIndex === 4 || rowIndex === 5) && cell !== '' && cell !== 'Present' && cell !== 'Absent' && cell !== 'Week Off' && cell !== 'Late Employees' && cell !== 'Overtime Employees') {
            if (typeof cell === 'number') {
                cellStyle += " font-weight: bold; font-size: 14px; border: 1px solid #333;";
            }
        }
        // Summary statistics labels
        else if (cell === 'Present' || cell === 'Absent' || cell === 'Week Off' || cell === 'Late Employees' || cell === 'Overtime Employees') {
            cellStyle += " font-weight: bold; text-align: left; border: 1px solid #333;";
        }
        // Table headers row
        else if (rowIndex === 7) {
            cellStyle += " background-color: #000; color: #fff; font-weight: bold; text-align: center; border: 2px solid #000; font-size: 14px;";
        }
        // Status column styling for data rows
        else if (rowIndex > 7 && cellIndex === headers.indexOf('Status')) {
            if (cell === 'Present') {
                cellStyle += " background-color: #f9f9f9; font-weight: bold; text-align: center; border: 1px solid #333;";
            } else if (cell === 'Absent') {
                cellStyle += " background-color: #e0e0e0; font-weight: bold; text-align: center; border: 2px solid #666;";
            } else if (cell === 'Week Off') {
                cellStyle += " background-color: #f5f5f5; font-style: italic; font-weight: bold; text-align: center; border: 1px solid #333;";
            }
        }
        // Remaining Hours column styling
        else if (rowIndex > 7 && cellIndex === headers.indexOf('Remaining Hours')) {
            if (cell !== '--' && parseFloat(cell) > 0) {
                cellStyle += " background-color: #f0f0f0; font-weight: bold; text-align: center; border: 2px solid #333;";
            }
        }
        // Overtime Hours column styling
        else if (rowIndex > 7 && cellIndex === headers.indexOf('Overtime Hours')) {
            if (cell !== '--' && parseFloat(cell) > 0) {
                cellStyle += " background-color: #f8f8f8; font-weight: bold; text-align: center; border: 2px solid #333;";
            }
        }
        // Employee ID/Name columns (first few columns) - make them stand out
        else if (rowIndex > 7 && cellIndex < 2) {
            cellStyle += " font-weight: bold; text-align: left; border: 1px solid #333;";
        }
        // Regular data cells
        else if (rowIndex > 7) {
            cellStyle += " text-align: center; border: 1px solid #666;";
        }

        return `<td style="${cellStyle}">${cell || ''}</td>`;
    }).join('')}
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    // Generate filename with formatted date
    const filenameSuffix = new Date(reportDate).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }).replace(/,/g, '').replace(/\s/g, '_');

    // Create and download file
    const blob = new Blob([tableHTML], {
        type: 'application/vnd.ms-excel;charset=utf-8;'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Daily_Attendance_Report_${filenameSuffix}.xls`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};