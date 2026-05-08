/**
 * Excel export function for Geolocation Attendance Report - Black & White Theme
 * @param {Array} data - Array of attendance objects to export
 * @param {string} reportDate - Selected date for the report
 * @param {string} filename - Name of the file (without extension)
 */
export const exportGeolocationToExcel = (data, reportDate, filename) => {
    if (!data || data.length === 0) {
        console.error('No data to export');
        throw new Error('No data available to export');
    }

    // Calculate summary statistics
    const totalEmployees = data.length;
    const presentCount = data.filter(emp => emp.status === 'Present').length;
    const absentCount = data.filter(emp => emp.status === 'Absent').length;
    const weekOffCount = data.filter(emp => emp.status === 'Week Off').length;
    const lateCount = data.filter(emp => parseFloat(emp.late_hours || 0) > 0).length;
    const overtimeCount = data.filter(emp => parseFloat(emp.overtime_hours || 0) > 0).length;

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
    excelData.push(['', '', '', '', '',
        `Geolocation Attendance Report ${formattedDate}`, '', '', '', '', ''
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
        '', '', '', '', ''
    ]);

    // Add empty row
    excelData.push(['']);

    // Add summary statistics
    excelData.push(['Summary Statistics', '', '', '', '', '', '', '', '', '', '']);
    excelData.push(['Present', presentCount, '', 'Absent', absentCount, '', 'Week Off', weekOffCount, '', '', '']);
    excelData.push(['Late Employees', lateCount, '', 'Overtime Employees', overtimeCount, '', '', '', '', '', '']);

    // Add empty row
    excelData.push(['']);

    // Add table headers
    const headers = [
        'S.No',
        'Emp Code',
        'Name',
        'Shift',
        'Device Type',
        'Check-in Time',
        'Check-in Location',
        'Check-out Time',
        'Check-out Location',
        'Total Hours'
    ];
    excelData.push(headers);

    // Helper function to get device type name
    const getDeviceTypeName = (type, typeName) => {
        if (typeName) return typeName;
        switch (type) {
            case 1: return "Web Browser";
            case 2: return "Desktop App";
            case 3: return "Mobile Device";
            default: return "Unknown";
        }
    };

    // Helper function to format location with clickable link
    const formatLocation = (mapLink) => {
        if (!mapLink || mapLink === "https://www.google.com/maps?q=,") {
            return "No Location";
        }
        return `<a href="${mapLink}" target="_blank" style="color:#065f46; text-decoration:underline;">View Map</a>`;
    };


    // Add employee data rows
    data.forEach((employee, index) => {
        // Process attendance_history - alternating in/out pattern
        const pairs = [];
        if (Array.isArray(employee.attendance_history) && employee.attendance_history.length > 0) {
            for (let i = 0; i < employee.attendance_history.length; i += 2) {
                const clockIn = employee.attendance_history[i];
                const clockOut = employee.attendance_history[i + 1];

                pairs.push({
                    clock_in: clockIn?.clock_date_time || '--',
                    clock_out: clockOut?.clock_date_time || '--',
                    clock_in_type: clockIn?.clock_type,
                    clock_in_type_name: clockIn?.clock_type_name,
                    clock_in_map_link: clockIn?.map_link,
                    clock_out_type: clockOut?.clock_type,
                    clock_out_type_name: clockOut?.clock_type_name,
                    clock_out_map_link: clockOut?.map_link
                });
            }
        }

        // Get the first entry for primary data
        const primaryEntry = pairs.length > 0 ? pairs[0] : {};

        const deviceType = getDeviceTypeName(
            primaryEntry.clock_in_type,
            primaryEntry.clock_in_type_name
        );

        const checkInLocation = formatLocation(primaryEntry.clock_in_map_link);
        const checkOutLocation = formatLocation(primaryEntry.clock_out_map_link);

        // Add main employee row
        excelData.push([
            index + 1, // S.No
            employee.employee_code || '--', // Emp Code
            employee.employee_name || '--', // Name
            employee.shift_name || '--', // Shift
            deviceType, // Device Type
            primaryEntry.clock_in || employee.attandance_first_clock_in || '--', // Check-in Time
            checkInLocation, // Check-in Location
            primaryEntry.clock_out || employee.attandance_last_clock_out || '--', // Check-out Time
            checkOutLocation, // Check-out Location
            employee.attandance_hours || '--' // Total Hours
        ]);

        // Add additional pairs if they exist (sub-rows)
        if (pairs.length > 1) {
            for (let i = 1; i < pairs.length; i++) {
                const entry = pairs[i];
                const subDeviceType = getDeviceTypeName(entry.clock_in_type, entry.clock_in_type_name);
                const subCheckInLocation = formatLocation(entry.clock_in_map_link);
                const subCheckOutLocation = formatLocation(entry.clock_out_map_link);

                excelData.push([
                    '', // Empty S.No for sub-entries
                    '', // Empty Emp Code
                    '', // Empty Name
                    '', // Empty Shift
                    subDeviceType, // Device Type
                    entry.clock_in || '--', // Check-in Time
                    subCheckInLocation, // Check-in Location
                    entry.clock_out || '--', // Check-out Time
                    subCheckOutLocation, // Check-out Location
                    '' // Empty Total Hours for sub-entries
                ]);
            }
        }
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
        // Date and generated info row
        else if (rowIndex === 1 && (cellIndex === 1 || cellIndex === 2 || cellIndex === 5)) {
            cellStyle += " font-weight: bold; font-size: 15px; border: 1px solid #666;";
        }
        // Summary statistics header
        else if (cell === 'Summary Statistics') {
            cellStyle += " background-color: #f0f0f0; font-weight: bold; font-size: 16px; text-align: center; border: 2px solid #000;";
        }
        // Summary statistics data rows
        else if ((rowIndex === 4 || rowIndex === 5) && cell !== '' && typeof cell === 'number') {
            cellStyle += " font-weight: bold; font-size: 14px; border: 1px solid #333;";
        }
        // Summary statistics labels
        else if (cell === 'Present' || cell === 'Absent' || cell === 'Week Off' || cell === 'Late Employees' || cell === 'Overtime Employees') {
            cellStyle += " font-weight: bold; text-align: left; border: 1px solid #333;";
        }
        // Table headers row (assuming it's at row 7)
        else if (rowIndex === 7) {
            cellStyle += " background-color: #000; color: #fff; font-weight: bold; text-align: center; border: 2px solid #000; font-size: 14px;";
        }
        // Data rows
        else if (rowIndex > 7) {
            // S.No column
            if (cellIndex === 0 && cell !== '') {
                cellStyle += " font-weight: bold; text-align: center; border: 1px solid #333; background-color: #f8f9fa;";
            }
            // Employee Code column
            else if (cellIndex === 1 && cell !== '') {
                cellStyle += " font-weight: bold; text-align: left; border: 1px solid #333;";
            }
            // Employee Name column
            else if (cellIndex === 2 && cell !== '') {
                cellStyle += " font-weight: bold; text-align: left; border: 1px solid #333;";
            }
            // Shift column
            else if (cellIndex === 3) {
                cellStyle += " text-align: center; border: 1px solid #666;";
            }
            // Device Type column
            else if (cellIndex === 4) {
                if (cell === 'Web Browser') {
                    cellStyle += " background-color: #e3f2fd; color: #1565c0; font-weight: bold; text-align: center; border: 1px solid #333;";
                } else if (cell === 'Desktop App') {
                    cellStyle += " background-color: #e8f5e8; color: #2e7d32; font-weight: bold; text-align: center; border: 1px solid #333;";
                } else if (cell === 'Mobile Device') {
                    cellStyle += " background-color: #f3e5f5; color: #7b1fa2; font-weight: bold; text-align: center; border: 1px solid #333;";
                } else {
                    cellStyle += " text-align: center; border: 1px solid #666;";
                }
            }
            // Check-in Time column
            else if (cellIndex === 5) {
                if (cell !== '--' && cell !== '') {
                    cellStyle += " font-weight: bold; text-align: center; border: 1px solid #333; background-color: #f0f9ff;";
                } else {
                    cellStyle += " text-align: center; border: 1px solid #666; color: #999;";
                }
            }
            // Check-in Location column
            else if (cellIndex === 6) {
                if (cell === 'View Map') {
                    cellStyle += " background-color: #ecfdf5; color: #065f46; font-weight: bold; text-align: center; border: 1px solid #333;";
                } else {
                    cellStyle += " text-align: center; border: 1px solid #666; color: #999;";
                }
            }
            // Check-out Time column
            else if (cellIndex === 7) {
                if (cell !== '--' && cell !== '') {
                    cellStyle += " font-weight: bold; text-align: center; border: 1px solid #333; background-color: #fef3c7;";
                } else {
                    cellStyle += " text-align: center; border: 1px solid #666; color: #999;";
                }
            }
            // Check-out Location column
            else if (cellIndex === 8) {
                if (cell === 'View Map') {
                    cellStyle += " background-color: #fef3c7; color: #92400e; font-weight: bold; text-align: center; border: 1px solid #333;";
                } else {
                    cellStyle += " text-align: center; border: 1px solid #666; color: #999;";
                }
            }
            // Total Hours column
            else if (cellIndex === 9) {
                if (cell !== '--' && cell !== '') {
                    cellStyle += " font-weight: bold; text-align: center; border: 1px solid #333; background-color: #f0f0f0;";
                } else {
                    cellStyle += " text-align: center; border: 1px solid #666;";
                }
            }
            // Default for other data cells
            else {
                cellStyle += " text-align: center; border: 1px solid #666;";
            }
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
    link.setAttribute('download', `Geolocation_Attendance_Report_${filenameSuffix}.xls`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};