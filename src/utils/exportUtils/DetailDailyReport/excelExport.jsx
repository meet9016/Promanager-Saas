import { exportToStyledExcel } from '../commonExcelExport';

/**
 * Excel export function for Detailed Daily Attendance Report - Brand Purple Theme
 * @param {Array|Object} dataOrGrouped - Array of attendance objects or grouped by date object
 * @param {string} dateFrom - Start date of range
 * @param {string} dateTo - End date of range
 * @param {string} filename - Name of the file (without extension)
 * @param {Object} options - Additional options including companyName
 */
export const exportDetailRangeToExcel = async (
    dataOrGrouped,
    dateFrom,
    dateTo,
    filename = "detailed_daily_attendance_range",
    options = {}
) => {
    if (!dataOrGrouped || (Array.isArray(dataOrGrouped) && dataOrGrouped.length === 0)) {
        throw new Error("No data available to export");
    }

    const flatData = Array.isArray(dataOrGrouped)
        ? dataOrGrouped
        : Object.values(dataOrGrouped).flat();

    if (!flatData || flatData.length === 0) {
        throw new Error("No data available to export");
    }

    const s = (v, fallback = "--") => {
        if (v === 0) return "0";
        if (v == null) return fallback;
        const str = String(v).trim();
        return str.length ? str : fallback;
    };

    const hourish = (v) => {
        const str = s(v, "");
        if (["0", "0.0", "0.00", "00:00", ""].includes(str)) return "--";
        return str;
    };

    const buildPunchRecords = (history) => {
        if (!Array.isArray(history) || history.length === 0) return "--";
        const segs = [];
        history.forEach((record, index) => {
            const dateTime = (record.clock_date_time || "").trim();
            if (!dateTime) return;
            const parts = dateTime.split(" ");
            if (parts.length < 3) return;
            const time = parts[parts.length - 2];
            const period = parts[parts.length - 1];
            const timePart = `${time} ${period}`;
            const type = index % 2 === 0 ? "in" : "out";
            segs.push(`${timePart}:${type}`);
        });
        return segs.length > 0 ? segs.join(", ") : "--";
    };

    const formattedRows = flatData.map((row, idx) => ({
        'S.No.': row.sno ?? row["S.No."] ?? (idx + 1),
        'E. Code': s(row.employee_code || row["Employee Code"] || row["E. Code"], "--"),
        'Employee Name': s(row.employee_name || row["Employee"] || row["Employee Name"], "--"),
        'Shift': s(row.shift_name || row["Shift"], "--"),
        'Shift In': s(row.shift_from_time || row["Shift Time"]?.split?.(" - ")?.[0], "--"),
        'Shift Out': s(row.shift_to_time || row["Shift Time"]?.split?.(" - ")?.[1], "--"),
        'Clock In': s(row.attandance_first_clock_in || row["Clock In (First)"], "--"),
        'Clock Out': s(row.attandance_last_clock_out || row["Clock Out (Last)"], "--"),
        'Shift Hours': hourish(row.shift_working_hours || row["Working Hours"]),
        'Total Hours': hourish(row.attandance_hours || row["Attendance Hours"]),
        'Remaining Hours': hourish(row.late_hours || row["Remaining Hours"]),
        'Overtime Hours': hourish(row.overtime_hours || row["Overtime Hours"]),
        'Early Going': hourish(row.early_going_by || row["EarlyGoingBy"]),
        'Status': s(row.status || row["Status"], "N/A"),
        'Punch Records': buildPunchRecords(row.attendance_history),
    }));

    const totalEmployees = formattedRows.length;
    const presentCount = formattedRows.filter(r => (r.Status || '').toLowerCase() === 'present').length;
    const absentCount = formattedRows.filter(r => (r.Status || '').toLowerCase() === 'absent').length;
    const weekOffCount = formattedRows.filter(r => (r.Status || '').toLowerCase() === 'week off').length;
    const lateCount = formattedRows.filter(r => r['Remaining Hours'] !== '--' && parseFloat(r['Remaining Hours']) > 0).length;
    const overtimeCount = formattedRows.filter(r => r['Overtime Hours'] !== '--' && parseFloat(r['Overtime Hours']) > 0).length;

    const summaryCards = [
        { label: 'Total Employees', value: totalEmployees },
        { label: 'Present', value: presentCount },
        { label: 'Absent', value: absentCount },
        { label: 'Week Off', value: weekOffCount },
        { label: 'Late Employees', value: lateCount },
        { label: 'Overtime Employees', value: overtimeCount },
    ];

    let dateRangeText = '';
    if (dateFrom && dateTo) {
        if (dateFrom === dateTo) {
            dateRangeText = `Date: ${dateFrom}`;
        } else {
            dateRangeText = `Date Range: ${dateFrom} to ${dateTo}`;
        }
    } else if (dateFrom) {
        dateRangeText = `Date: ${dateFrom}`;
    }

    await exportToStyledExcel({
        title: 'DAILY ATTENDANCE DETAILS REPORT',
        companyName: options.companyName || 'Your Company Name',
        dateRangeText,
        summaryCards,
        data: formattedRows,
        filename: filename || 'detailed_daily_attendance',
        sheetName: 'Attendance Details',
    });
};

