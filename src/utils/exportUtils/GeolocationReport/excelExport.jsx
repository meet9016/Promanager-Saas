import { exportToStyledExcel } from '../commonExcelExport';

/**
 * Excel export function for Geolocation Attendance Report - Styled Purple Theme
 * @param {Array} data - Array of attendance objects to export
 * @param {string|Date} reportDate - Selected date for the report
 * @param {string} filename - Name of the file (without extension)
 * @param {Object} options - Additional options including companyName
 */
export const exportGeolocationToExcel = async (data, reportDate, filename, options = {}) => {
    if (!data || data.length === 0) {
        throw new Error('No data available to export');
    }

    // Calculate summary statistics
    const totalEmployees = data.length;
    const presentCount = data.filter(emp => (emp.status || emp.Status) === 'Present').length;
    const absentCount = data.filter(emp => (emp.status || emp.Status) === 'Absent').length;
    const weekOffCount = data.filter(emp => (emp.status || emp.Status) === 'Week Off').length;
    const lateCount = data.filter(emp => parseFloat(emp.late_hours || 0) > 0).length;
    const overtimeCount = data.filter(emp => parseFloat(emp.overtime_hours || 0) > 0).length;

    const summaryCards = [
        { label: 'Total Employees', value: totalEmployees },
        { label: 'Present', value: presentCount },
        { label: 'Absent', value: absentCount },
        { label: 'Week Off', value: weekOffCount },
        { label: 'Late Employees', value: lateCount },
        { label: 'Overtime Employees', value: overtimeCount },
    ];

    const getDeviceTypeName = (type, typeName) => {
        if (typeName) return typeName;
        switch (type) {
            case 1: return "Web Browser";
            case 2: return "Desktop App";
            case 3: return "Mobile Device";
            default: return "Unknown";
        }
    };

    const formatLocation = (mapLink) => {
        if (!mapLink || mapLink === "https://www.google.com/maps?q=," || mapLink === "--") {
            return "No Location";
        }
        return mapLink;
    };

    const excelRows = [];

    data.forEach((employee, index) => {
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

        const primaryEntry = pairs.length > 0 ? pairs[0] : {};

        const deviceType = getDeviceTypeName(
            primaryEntry.clock_in_type,
            primaryEntry.clock_in_type_name
        );

        const checkInLoc = formatLocation(primaryEntry.clock_in_map_link);
        const checkOutLoc = formatLocation(primaryEntry.clock_out_map_link);

        excelRows.push({
            'S.No.': index + 1,
            'Emp Code': employee.employee_code || '--',
            'Employee Name': employee.employee_name || '--',
            'Shift': employee.shift_name || '--',
            'Device Type': deviceType,
            'Check-in Time': primaryEntry.clock_in || employee.attandance_first_clock_in || '--',
            'Check-in Location': checkInLoc,
            'Check-out Time': primaryEntry.clock_out || employee.attandance_last_clock_out || '--',
            'Check-out Location': checkOutLoc,
            'Total Hours': employee.attandance_hours || '--',
            'Status': employee.status || employee.Status || '--'
        });

        if (pairs.length > 1) {
            for (let i = 1; i < pairs.length; i++) {
                const entry = pairs[i];
                const subDeviceType = getDeviceTypeName(entry.clock_in_type, entry.clock_in_type_name);
                const subCheckInLoc = formatLocation(entry.clock_in_map_link);
                const subCheckOutLoc = formatLocation(entry.clock_out_map_link);

                excelRows.push({
                    'S.No.': '',
                    'Emp Code': '',
                    'Employee Name': '',
                    'Shift': '',
                    'Device Type': subDeviceType,
                    'Check-in Time': entry.clock_in || '--',
                    'Check-in Location': subCheckInLoc,
                    'Check-out Time': entry.clock_out || '--',
                    'Check-out Location': subCheckOutLoc,
                    'Total Hours': '',
                    'Status': ''
                });
            }
        }
    });

    const headers = [
        { key: 'S.No.', label: 'S.No.' },
        { key: 'Emp Code', label: 'Emp Code' },
        { key: 'Employee Name', label: 'Employee Name' },
        { key: 'Shift', label: 'Shift' },
        { key: 'Device Type', label: 'Device Type' },
        { key: 'Check-in Time', label: 'Check-in Time' },
        { key: 'Check-in Location', label: 'Check-in Location' },
        { key: 'Check-out Time', label: 'Check-out Time' },
        { key: 'Check-out Location', label: 'Check-out Location' },
        { key: 'Total Hours', label: 'Total Hours' },
        { key: 'Status', label: 'Status' }
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
        title: 'GEOLOCATION ATTENDANCE REPORT',
        companyName: options.companyName || 'Your Company Name',
        dateRangeText: formattedDate ? `Date: ${formattedDate}` : '',
        summaryCards,
        headers,
        data: excelRows,
        filename: filename || `geolocation_attendance_report_${formattedDate.replace(/,/g, '').replace(/\s+/g, '_')}`,
        sheetName: 'Geolocation Attendance',
    });
};