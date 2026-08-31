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

    const fmtTime = (t) => {
        if (!t || t === '00:00:00' || t === '--') return '--';
        if (t.includes('AM') || t.includes('PM')) return t;
        const [hh, mm] = t.split(':');
        const H = parseInt(hh, 10);
        if (isNaN(H)) return t;
        const h12 = H % 12 || 12;
        const ap = H < 12 ? 'AM' : 'PM';
        return `${h12}:${mm} ${ap}`;
    };

    const fmtShort = (t) => {
        if (!t || t === '00:00:00') return '';
        if (t.includes('AM') || t.includes('PM')) {
            const parts = t.split(' ');
            if (parts.length === 2) {
                const [time] = parts;
                const [hh, mm] = time.split(':');
                return `${hh}:${mm}`;
            }
        }
        if (t.includes(':')) {
            const [hh, mm] = t.split(':');
            const H = parseInt(hh, 10);
            const h12 = H % 12 || 12;
            return `${h12}:${mm}`;
        }
        return t;
    };

    const buildPunchChips = (history) => {
        if (!Array.isArray(history) || history.length === 0) return "--";
        const list = history;
        const chips = [];
        for (let i = 0; i < list.length; i += 2) {
            const inRecord = list[i];
            const outRecord = list[i + 1];
            if (!inRecord) continue;

            const extractTime = (dateTimeStr) => {
                if (!dateTimeStr) return '';
                const parts = dateTimeStr.split(' ');
                if (parts.length < 3) return '';
                return `${parts[parts.length - 2]} ${parts[parts.length - 1]}`;
            };

            const inTime = fmtShort(extractTime(inRecord.clock_date_time));
            const outTime = outRecord ? fmtShort(extractTime(outRecord.clock_date_time)) : '';

            if (inTime && outTime) {
                chips.push(`${inTime}–${outTime}`);
            } else if (inTime) {
                chips.push(`${inTime}→`);
            }
        }
        return chips.length > 0 ? chips.join(', ') : '--';
    };

    const statusSuffix = (emp) => {
        const arr = Array.isArray(emp.attendance_history) ? emp.attendance_history : [];
        if (!arr.length) return '';
        const hasOpenPunch = arr.length % 2 !== 0;
        return hasOpenPunch ? ' (No OutPunch)' : '';
    };

    const formattedRows = flatData.map((row, idx) => {
        const shiftFrom = row.shift_from_time || row["Shift In"];
        const shiftTo = row.shift_to_time || row["Shift Out"];
        const shiftTimeStr = shiftFrom && shiftTo ? `${shiftFrom} - ${shiftTo}` : (row["Shift Time"] || '--');
        const statusVal = s(row.status || row["Status"], "N/A");
        const statusWithNote = `${statusVal}${statusSuffix(row)}`;

        return {
            'S.No.': row.sno ?? row["S.No."] ?? (idx + 1),
            'Employee Name': s(row.employee_name || row["Employee"] || row["Employee Name"], "--"),
            'Employee Code': s(row.employee_code || row["Employee Code"] || row["E. Code"], "--"),
            'Shift': s(row.shift_name || row["Shift"], "--"),
            'Shift Time': shiftTimeStr,
            'Clock In': fmtTime(row.attandance_first_clock_in || row["Clock In"]),
            'Clock Out': fmtTime(row.attandance_last_clock_out || row["Clock Out"]),
            'Work Duration': hourish(row.shift_working_hours || row["Working Hours"]),
            'Total Duration': hourish(row.attandance_hours || row["Attendance Hours"]),
            'Remaining Hours': hourish(row.late_hours || row["Remaining Hours"]),
            'Overtime Hours': hourish(row.overtime_hours || row["Overtime Hours"]),
            'Early Going': hourish(row.early_going_by || row["EarlyGoingBy"]),
            'Status': statusWithNote,
            'Punch Records': buildPunchChips(row.attendance_history),
        };
    });

    const totalEmployees = formattedRows.length;
    const presentCount = formattedRows.filter(r => (r.Status || '').toLowerCase().includes('present')).length;
    const absentCount = formattedRows.filter(r => (r.Status || '').toLowerCase().includes('absent')).length;
    const weekOffCount = formattedRows.filter(r => (r.Status || '').toLowerCase().includes('week off') || (r.Status || '').toLowerCase().includes('weekoff')).length;
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

