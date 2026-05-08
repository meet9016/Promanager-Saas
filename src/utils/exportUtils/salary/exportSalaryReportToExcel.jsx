// utils/payrollExcelExport.js

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

// Export payroll to Excel function
export const exportPayrollToExcel = (
    payrollData,
    monthYear = null,
    filename = 'payroll_report',
    title = 'Monthly Salary Report',
    getMonthYearDisplay = null
) => {
    if (!payrollData || payrollData.length === 0) {
        console.error('No data to export');
        return;
    }

    const payrollSummary = calculatePayrollSummary(payrollData);
    const monthDisplay = getMonthYearDisplay ? getMonthYearDisplay(monthYear) : (monthYear || 'Current Period');

    // Prepare data for Excel export
    const excelData = [];

    // Add report header
    excelData.push(['', '',
        title, '', '', '',
    ]);
    excelData.push([
        '',
        `Period: ${monthDisplay}`,
        `Generated: ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString()}`,
        '',
        `Total Employees: ${payrollSummary.totalEmployees}`,
        `Total Net Salary: ₹${payrollSummary.totalNetSalary}`
    ]);

    // Add empty row
    excelData.push(['']);

    // Add summary statistics
    excelData.push(['Payroll Summary', '', '', '', '', '']);
    excelData.push(['Payroll Month', monthDisplay, '', 'Total Employees', payrollSummary.totalEmployees, '']);
    excelData.push(['Total Base Salary', `₹${payrollSummary.totalBaseSalary}`, '', 'Total Working Days', payrollSummary.totalWorkingDays, '']);
    excelData.push(['Total Present Days', payrollSummary.totalPresentDays, '', 'Total Absent Days', payrollSummary.totalAbsentDays, '']);
    excelData.push(['Total Week Off Days', payrollSummary.totalWeekOffDays, '', 'Total Overtime Days', payrollSummary.totalOvertimeDays, '']);
    excelData.push(['Total Subtotal Salary', `₹${payrollSummary.totalSubtotalSalary}`, '', 'Total Overtime Salary', `₹${payrollSummary.totalOvertimeSalary}`, '']);
    excelData.push(['Total Week Off Salary', `₹${payrollSummary.totalWeekOffSalary}`, '', 'NET PAYROLL AMOUNT', `₹${payrollSummary.totalNetSalary}`, '']);

    // Add empty row
    excelData.push(['']);
    excelData.push(['']);

    // Add detailed payroll data headers
    excelData.push([
        'NO.',
        'Employee Code',
        'Employee Name',
        'Base Salary',
        'Working Days',
        'Week Off Days',
        'Present Days',
        'Absent Days',
        'Overtime Days',
        'Subtotal Salary',
        'Overtime Salary',
        'Week Off Salary',
        'Total Salary'
    ]);

    // Add payroll data rows
    payrollData.forEach((record, index) => {
        excelData.push([
            index + 1,
            record.employee_code || '',
            record.employee_name || '',
            `₹${formatCurrency(record.employee_salary)}`,
            record.working_days || 0,
            record.week_off_days || 0,
            record.present_days || 0,
            record.absent_days || 0,
            record.overtime_days || 0,
            `₹${formatCurrency(record.subtotal_salary)}`,
            `₹${formatCurrency(record.overtime_salary)}`,
            `₹${formatCurrency(record.week_off_salary)}`,
            `₹${formatCurrency(record.total_salary)}`
        ]);
    });

    // Add totals row
    excelData.push([
        '',
        '',
        'TOTAL',
        `₹${payrollSummary.totalBaseSalary}`,
        payrollSummary.totalWorkingDays,
        payrollSummary.totalWeekOffDays,
        payrollSummary.totalPresentDays,
        payrollSummary.totalAbsentDays,
        payrollSummary.totalOvertimeDays,
        `₹${payrollSummary.totalSubtotalSalary}`,
        `₹${payrollSummary.totalOvertimeSalary}`,
        `₹${payrollSummary.totalWeekOffSalary}`,
        `₹${payrollSummary.totalNetSalary}`
    ]);

    // Convert to HTML table format
    const tableHTML = `
        <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif;text-align: center;">
            <tbody>
                ${excelData.map((row, rowIndex) => `
                    <tr>
                        ${row.map((cell, cellIndex) => {
        // Style for headers and important rows
        let cellStyle = "border: 1px solid #ccc; padding: 8px; text-align: center;";

        // Report title row
        if (rowIndex === 0 && cellIndex === 2) {
            cellStyle += " background-color: #340B90; color: white; font-weight: bold; font-size: 25px; text-align: center;";
        }
        // Payroll summary header
        else if (cell === 'Payroll Summary') {
            cellStyle += " background-color: #f8fafc; font-weight: bold; color: #340B90; text-align: center;font-size: 20px;";
        }
        // Table headers
        else if (cell === 'NO.' || cell === 'Employee Code' || cell === 'Employee Name' || cell === 'Base Salary' ||
            cell === 'Working Days' || cell === 'Week Off Days' || cell === 'Present Days' || cell === 'Absent Days' ||
            cell === 'Overtime Days' || cell === 'Subtotal Salary' || cell === 'Overtime Salary' ||
            cell === 'Week Off Salary' || cell === 'Total Salary') {
            cellStyle += " background-color: #340B90; color: white; font-weight: bold; text-align: center;";
        }
        // Totals row
        else if (cell === 'TOTAL') {
            cellStyle += " background-color: #f8fafc; font-weight: bold; color: #340B90; text-align: center;";
        }
        // NET PAYROLL AMOUNT highlight
        else if (cell === 'NET PAYROLL AMOUNT') {
            cellStyle += " background-color: #f8fafc; font-weight: bold; color: #340B90; text-align: center;";
        }
        // Payroll Month highlight
        else if (cell === 'Payroll Month') {
            cellStyle += " background-color: #f8fafc; font-weight: bold; color: #340B90; text-align: center;";
        }
        // Currency cells alignment
        else if (typeof cell === 'string' && cell.includes('₹')) {
            cellStyle += " text-align: right;";
        }
        // Number cells alignment
        else if (typeof cell === 'number' || (!isNaN(cell) && cell !== '')) {
            cellStyle += " text-align: right;";
        }

        return `<td style="${cellStyle}">${cell}</td>`;
    }).join('')}
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    // Create and download file
    const blob = new Blob([tableHTML], {
        type: 'application/vnd.ms-excel;charset=utf-8;'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.xls`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

export const handlePayrollExportExcel = async (
    reportData,
    filters,
    summaryStats,
    showToast,
    setExportDropdown,
    getMonthYearDisplay
) => {
    try {
        if (!reportData || reportData.length === 0) {
            showToast('No data available to export', 'error');
            return;
        }

        const fileName = `monthly_salary_report_${filters.month_year || 'current'}`;
        const title = `Monthly Salary Report`;

        exportPayrollToExcel(
            reportData,
            filters.month_year,
            fileName,
            title,
            getMonthYearDisplay
        );

        showToast('Excel file exported successfully!', 'success');
        setExportDropdown(false);

    } catch (error) {
        console.error('Error in handlePayrollExportExcel:', error);
        showToast('Failed to export Excel: ' + error.message, 'error');
        setExportDropdown(false);
    }
};