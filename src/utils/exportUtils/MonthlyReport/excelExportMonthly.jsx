// utils/exportUtils/MonthlyReport/excelExportMonthly.js — Brand Purple Theme (Horizontal Matrix)
import { exportToStyledExcel } from '../commonExcelExport';

// ─── Shared helpers (must mirror MonthlyReport.jsx & pdfExportMonthly.js) ───

/**
 * Normalises any status variant to a consistent display key.
 *   "1/2P" | "HalfP" | "Half Day"  → "½P"
 *   everything else                 → unchanged
 */
const normalizeStatus = (status) => {
    if (!status) return null;
    const s = String(status).trim();
    switch (s) {
        case "1/2P":
        case "HalfP":
        case "Half Day":
            return "½P";
        default:
            return s;
    }
};

/**
 * Parses "8h 44m", "8h", "44m", "0h 0m" → decimal hours.
 * Falls back to 0 for empty / "--" values.
 */
const parseDurationToHours = (str) => {
    if (!str || str === "--") return 0;
    const s = String(str);
    const hMatch = s.match(/(\d+)\s*h/i);
    const mMatch = s.match(/(\d+)\s*m/i);
    const h = hMatch ? parseInt(hMatch[1], 10) : 0;
    const m = mMatch ? parseInt(mMatch[1], 10) : 0;
    return h + m / 60;
};

const formatDate = (dateInput) => {
    const date = new Date(dateInput);
    if (Object.prototype.toString.call(date) !== "[object Date]" || isNaN(date.getTime())) {
        return "Invalid Date";
    }
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
};

/**
 * Ensures attendance data is converted into array of employee objects with dailyAttendance dictionary.
 */
export const ensureGroupedEmployees = (attendanceData) => {
    if (!attendanceData || attendanceData.length === 0) return [];

    if (attendanceData[0]?.dailyAttendance) {
        return attendanceData.map((emp) => ({
            ...emp,
            employee_code: emp.employee_code || emp.empCode || 'N/A',
            employee_name: emp.employee_name || emp.empName || 'N/A',
        }));
    }

    const map = {};
    attendanceData.forEach((rec) => {
        if (!rec) return;
        const empCode = rec.employee_code || rec.empCode || rec.employee_id || 'N/A';
        if (!map[empCode]) {
            map[empCode] = {
                employee_code: empCode,
                employee_name: rec.employee_name || rec.empName || 'N/A',
                dailyAttendance: {},
            };
        }

        let dayNum = null;
        if (rec.date instanceof Date) {
            dayNum = rec.date.getDate();
        } else if (typeof rec.date === 'string') {
            const d = new Date(rec.date);
            if (!isNaN(d.getTime())) dayNum = d.getDate();
        } else if (typeof rec.day === 'number') {
            dayNum = rec.day;
        }

        if (dayNum) {
            map[empCode].dailyAttendance[dayNum] = {
                status: rec.status,
                inTime: rec.attandance_first_clock_in || rec.inTime,
                outTime: rec.attandance_last_clock_out || rec.outTime,
                totalHours: rec.attandance_hours || rec.totalHours,
            };
        }
    });

    return Object.values(map);
};

export const convertGroupedDataToFlat = (groupedData, monthYear) => {
    const flatData = [];

    const [yearStr, monthStr] = monthYear
        ? monthYear.split("-")
        : [String(new Date().getFullYear()), String(new Date().getMonth() + 1)];

    const year = parseInt(yearStr, 10) || new Date().getFullYear();
    const month = parseInt(monthStr, 10) || (new Date().getMonth() + 1);

    groupedData.forEach(({ employee_code, employee_name, dailyAttendance }) => {
        Object.entries(dailyAttendance || {}).forEach(([day, record]) => {
            flatData.push({
                employee_code: employee_code || '--',
                employee_name: employee_name || '--',
                date: new Date(year, month - 1, parseInt(day, 10)),
                status: normalizeStatus(record.status || record.fullStatus) || "--",
                attandance_first_clock_in: record.inTime || "--",
                attandance_last_clock_out: record.outTime || "--",
                attandance_hours: record.totalHours || "0h 0m",
                overtime_hours: "0h 0m",
                late_hours: "0h 0m",
                shift_status: "Working Day",
                shift_name: "--",
                shift_from_time: "--",
                shift_to_time: "--",
                shift_working_hours: "--",
                remarks: "--",
            });
        });
    });

    return flatData;
};

// ─── Main export function (Horizontal Matrix) ────────────────────────────────

/**
 * Exports monthly attendance data horizontally across day columns using commonExcelExport.
 *
 * @param {Array}  attendanceData  – grouped or flat records
 * @param {Date}   startDate
 * @param {Date}   endDate
 * @param {string} filename        – without extension
 * @param {Object} options
 * @param {string} [monthYear]     – "YYYY-MM", used when converting grouped data
 */
export const exportToExcel = async (
    attendanceData,
    startDate,
    endDate,
    filename = "monthly_attendance_report",
    options = {},
    monthYear
) => {
    if (!attendanceData || attendanceData.length === 0) {
        throw new Error("No data available to export");
    }

    let year = startDate && !isNaN(startDate.getTime()) ? startDate.getFullYear() : new Date().getFullYear();
    let month = startDate && !isNaN(startDate.getTime()) ? startDate.getMonth() + 1 : new Date().getMonth() + 1;

    if (monthYear && typeof monthYear === 'string') {
        const parts = monthYear.split('-');
        if (parts.length === 2) {
            const py = parseInt(parts[0], 10);
            const pm = parseInt(parts[1], 10);
            if (!isNaN(py) && !isNaN(pm)) {
                year = py;
                month = pm;
            }
        }
    }

    const daysInMonth = new Date(year, month, 0).getDate();
    const monthName = new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'long' });

    const groupedEmployees = ensureGroupedEmployees(attendanceData);

    const headers = [
        { key: 'emp_code', label: 'Emp Code' },
        { key: 'emp_name', label: 'Employee Name' },
        { key: 'row_type', label: 'Record Type' },
    ];

    for (let d = 1; d <= daysInMonth; d++) {
        headers.push({ key: `day_${d}`, label: String(d) });
    }

    headers.push(
        { key: 'total_p', label: 'Present (P)' },
        { key: 'total_a', label: 'Absent (A)' },
        { key: 'total_half', label: 'Half Day (½P)' },
        { key: 'total_wo', label: 'Week Off (WO)' },
        { key: 'total_hours', label: 'Total Hours' }
    );

    let grandPresent = 0;
    let grandAbsent = 0;
    let grandWeekOff = 0;
    let grandHalfDay = 0;
    let grandHours = 0;

    const formattedRows = [];

    groupedEmployees.forEach((emp) => {
        let pCount = 0;
        let aCount = 0;
        let woCount = 0;
        let halfCount = 0;
        let empHours = 0;

        const dailyAttendance = emp.dailyAttendance || {};

        for (let d = 1; d <= daysInMonth; d++) {
            const record = dailyAttendance[d];
            const statusKey = record ? normalizeStatus(record.status || record.fullStatus) || '--' : '--';

            if (statusKey === 'P' || statusKey === 'P/INC') pCount++;
            else if (statusKey === 'A') aCount++;
            else if (statusKey === 'WO') woCount++;
            else if (statusKey === '½P' || statusKey === '1/2P' || statusKey === 'HalfP') halfCount++;

            if (record && record.totalHours) {
                empHours += parseDurationToHours(record.totalHours);
            }
        }

        grandPresent += pCount;
        grandAbsent += aCount;
        grandWeekOff += woCount;
        grandHalfDay += halfCount;
        grandHours += empHours;

        const rowIn = {
            emp_code: emp.employee_code || '--',
            emp_name: emp.employee_name || '--',
            row_type: 'InTime',
        };
        const rowOut = {
            emp_code: emp.employee_code || '--',
            emp_name: emp.employee_name || '--',
            row_type: 'OutTime',
        };
        const rowTot = {
            emp_code: emp.employee_code || '--',
            emp_name: emp.employee_name || '--',
            row_type: 'Total Hrs',
        };
        const rowSt = {
            emp_code: emp.employee_code || '--',
            emp_name: emp.employee_name || '--',
            row_type: 'Status',
        };

        for (let d = 1; d <= daysInMonth; d++) {
            const rec = dailyAttendance[d];
            rowIn[`day_${d}`] = rec?.inTime || '--';
            rowOut[`day_${d}`] = rec?.outTime || '--';
            rowTot[`day_${d}`] = rec?.totalHours || '--';
            rowSt[`day_${d}`] = rec ? normalizeStatus(rec.status || rec.fullStatus) || '--' : '--';
        }

        rowIn.total_p = pCount;
        rowIn.total_a = aCount;
        rowIn.total_half = halfCount;
        rowIn.total_wo = woCount;
        rowIn.total_hours = empHours > 0 ? `${empHours.toFixed(1)} hrs` : '0.0 hrs';

        formattedRows.push(rowIn, rowOut, rowTot, rowSt);
    });

    const summaryCards = [
        { label: 'Total Employees', value: groupedEmployees.length },
        { label: 'Total Present Days', value: grandPresent },
        { label: 'Total Absent Days', value: grandAbsent },
        { label: 'Total Week Off Days', value: grandWeekOff },
        { label: 'Total Half Days', value: grandHalfDay },
        { label: 'Total Working Hours', value: `${grandHours.toFixed(1)} hrs` },
    ];

    const dateRangeText = `Month: ${monthName} ${year}   |   Total Days: ${daysInMonth}`;

    await exportToStyledExcel({
        title: options.reportTitle ? `${options.reportTitle.toUpperCase()} — ${monthName.toUpperCase()} ${year}` : `MONTHLY ATTENDANCE REPORT — ${monthName.toUpperCase()} ${year}`,
        companyName: options.companyName || 'Your Company Name',
        dateRangeText,
        summaryCards,
        headers,
        data: formattedRows,
        filename: filename || `monthly_attendance_report_${monthName.toLowerCase()}_${year}`,
        sheetName: `${monthName.slice(0, 3)} ${year}`,
    });
};
