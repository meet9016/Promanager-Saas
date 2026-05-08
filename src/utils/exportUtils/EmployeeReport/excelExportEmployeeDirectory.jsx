/**
 * Excel export function for Employee Directory Report - Black & White Theme
 * @param {Array} data - Array of employee objects to export
 * @param {string} filename - Name of the file (without extension)
 */
export const exportToExcel = (data, filename) => {
    if (!data || data.length === 0) {
        console.error('No data to export');
        throw new Error('No data available to export');
    }

    // Get headers from the first object
    const headers = Object.keys(data[0]);

    // Calculate summary statistics
    const totalEmployees = data.length;
    const activeEmployees = data.filter(emp => emp.Status === 'Active').length;
    const inactiveEmployees = data.filter(emp => emp.Status === 'Inactive').length;
    const unknownStatusEmployees = data.filter(emp => emp.Status === 'Unknown' || !emp.Status).length;

    // Prepare data for Excel export
    const excelData = [];

    // Add report header
    excelData.push(['', '', '', '', '',
        'Employee Directory Report', '', '', '', '', '', '', ''
    ]);
    excelData.push([
        '',
        `Generated: ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString()}`,
        '',
        '',
        `Total Employees: ${totalEmployees}`,
        '',
        '', '', '', '', '', '', ''
    ]);

    // Add empty row
    excelData.push(['']);

    // Add summary statistics
    excelData.push(['Employee Summary', '', '', '', '', '', '', '', '', '', '', '', '']);
    excelData.push(['Active Employees', activeEmployees, '', 'Inactive Employees', inactiveEmployees, '', 'Unknown Status', unknownStatusEmployees, '', '', '', '', '']);

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
        if (rowIndex === 0 && cellIndex === 5) {
            cellStyle += " color: #000; font-weight: bold; font-size: 20px; text-align: center; border: 2px solid #000;";
        }
        // Generated info row
        else if (rowIndex === 1 && (cellIndex === 1 || cellIndex === 4)) {
            cellStyle += " font-weight: bold; font-size: 14px; border: 1px solid #666;";
        }
        // Employee Summary header
        else if (cell === 'Employee Summary') {
            cellStyle += " background-color: #f0f0f0; font-weight: bold; font-size: 16px; text-align: center; border: 2px solid #000;";
        }
        // Summary statistics data
        else if (rowIndex === 4 && cell !== '' &&
            cell !== 'Active Employees' && cell !== 'Inactive Employees' && cell !== 'Unknown Status') {
            if (typeof cell === 'number' || (!isNaN(parseFloat(cell)) && isFinite(cell))) {
                cellStyle += " font-weight: bold; font-size: 14px; border: 1px solid #333;";
            }
        }
        // Summary statistics labels
        else if (cell === 'Active Employees' || cell === 'Inactive Employees' || cell === 'Unknown Status') {
            cellStyle += " font-weight: bold; text-align: left; border: 1px solid #333;";
        }
        // Table headers row
        else if (rowIndex === 6) {
            cellStyle += " background-color: #000; color: #fff; font-weight: bold; text-align: center; border: 2px solid #000; font-size: 14px;";
        }
        // Status column styling for data rows
        else if (rowIndex > 6 && cellIndex === headers.indexOf('Status')) {
            if (cell === 'Active') {
                cellStyle += " background-color: #f9f9f9; font-weight: bold; text-align: center; border: 1px solid #333;";
            } else if (cell === 'Inactive') {
                cellStyle += " background-color: #e0e0e0; font-weight: bold; text-align: center; border: 2px solid #666;";
            } else if (cell === 'Unknown' || cell === '') {
                cellStyle += " background-color: #f5f5f5; font-style: italic; font-weight: bold; text-align: center; border: 1px solid #333;";
            }
        }
        // Exit Date column styling (Last Working Date)
        else if (rowIndex > 6 && (headers[cellIndex] === 'Exit Date' || headers[cellIndex] === 'Last Working Date' ||
            headers[cellIndex] === 'last_working_date')) {
            if (cell && cell !== '' && cell !== '0000-00-00') {
                cellStyle += " background-color: #ffe6e6; font-weight: bold; text-align: center; border: 1px solid #cc0000;";
            } else {
                cellStyle += " background-color: #f9f9f9; text-align: center; border: 1px solid #666;";
            }
        }
        // Exit Reason column styling (Deactivate Reason)
        else if (rowIndex > 6 && (headers[cellIndex] === 'Exit Reason' || headers[cellIndex] === 'Deactivate Reason' ||
            headers[cellIndex] === 'deactivate_reason')) {
            if (cell && cell !== '') {
                cellStyle += " background-color: #fff3e6; font-weight: bold; text-align: left; border: 1px solid #ff9900; padding-left: 10px;";
            } else {
                cellStyle += " background-color: #f9f9f9; text-align: center; border: 1px solid #666;";
            }
        }
        // Employee ID/Name columns (first few columns) - make them stand out
        else if (rowIndex > 6 && cellIndex < 2) {
            cellStyle += " font-weight: bold; text-align: left; border: 1px solid #333;";
        }
        // Department/Position highlighting
        else if (rowIndex > 6 && (headers[cellIndex] === 'Department' || headers[cellIndex] === 'Position' ||
            headers[cellIndex] === 'designation_name' || headers[cellIndex] === 'department_name')) {
            cellStyle += " background-color: #f8f8f8; font-weight: bold; text-align: center; border: 1px solid #333;";
        }
        // Email/Phone highlighting
        else if (rowIndex > 6 && (headers[cellIndex] === 'Email' || headers[cellIndex] === 'Phone' ||
            headers[cellIndex] === 'email' || headers[cellIndex] === 'phone' ||
            headers[cellIndex] === 'mobile_number' || headers[cellIndex] === 'contact')) {
            cellStyle += " background-color: #f0f0f0; text-align: left; border: 1px solid #666;";
        }
        // Regular data cells
        else if (rowIndex > 6) {
            cellStyle += " text-align: center; border: 1px solid #666;";
        }

        return `<td style="${cellStyle}">${cell || ''}</td>`;
    }).join('')}
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    // Generate filename with timestamp
    const timestamp = new Date().toLocaleDateString('en-GB').replace(/\//g, '_');

    // Create and download file
    const blob = new Blob([tableHTML], {
        type: 'application/vnd.ms-excel;charset=utf-8;'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${timestamp}.xls`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};