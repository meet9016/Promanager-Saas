// utils/exportUtils/MonthlyReport/excelExportMonthly.js — Black & White Theme

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

// ─── Convert grouped data (from React component) → flat records ─────────────

/**
 * Converts the grouped employee format used by the React component into the
 * flat record array expected by groupDataByEmployee / calculateSummary.
 *
 * @param {Array}  groupedData  – array of { employee_code, employee_name, dailyAttendance }
 * @param {string} monthYear    – "YYYY-MM"  (used to build proper Date objects)
 */
export const convertGroupedDataToFlat = (groupedData, monthYear) => {
    const flatData = [];

    const [yearStr, monthStr] = monthYear
        ? monthYear.split("-")
        : [String(new Date().getFullYear()), String(new Date().getMonth() + 1)];

    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);

    groupedData.forEach(({ employee_code, employee_name, dailyAttendance }) => {
        Object.entries(dailyAttendance || {}).forEach(([day, record]) => {
            flatData.push({
                employee_code,
                employee_name,
                date: new Date(year, month - 1, parseInt(day, 10)),
                // short_status is stored as record.status in the grouped format
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

// ─── Group flat records by employee ─────────────────────────────────────────

export const groupDataByEmployee = (data) => {
    const grouped = {};

    data.forEach((record) => {
        const key = record.employee_code;
        if (!grouped[key]) {
            grouped[key] = {
                employee_code: record.employee_code,
                employee_name: record.employee_name,
                shift_name: record.shift_name,
                shift_from_time: record.shift_from_time,
                shift_to_time: record.shift_to_time,
                shift_working_hours: record.shift_working_hours,
                records: [],
            };
        }
        grouped[key].records.push(record);
    });

    // Calculate per-employee summary
    Object.values(grouped).forEach((emp) => {
        const { records } = emp;

        // Count statuses using the normalised value
        const presentCount = records.filter((r) => normalizeStatus(r.status) === "P").length;
        const absentCount = records.filter((r) => normalizeStatus(r.status) === "A").length;
        const weekOffCount = records.filter((r) => normalizeStatus(r.status) === "WO").length;
        const workingDays = records.filter((r) => r.shift_status === "Working Day").length;

        // Total working hours via shared parser
        const totalHours = records.reduce((sum, r) => sum + parseDurationToHours(r.attandance_hours), 0);
        const totalOvertime = records.reduce((sum, r) => sum + parseDurationToHours(r.overtime_hours), 0);
        const totalLate = records.reduce((sum, r) => sum + parseDurationToHours(r.late_hours), 0);

        const nonWeekOff = records.filter((r) => normalizeStatus(r.status) !== "WO").length;
        const attendance = nonWeekOff > 0 ? ((presentCount / nonWeekOff) * 100).toFixed(1) : "0.0";

        emp.summary = {
            totalDays: records.length,
            workingDays,
            presentDays: presentCount,
            absentDays: absentCount,
            weekOffDays: weekOffCount,
            totalHours: totalHours.toFixed(2),
            totalOvertimeHours: totalOvertime.toFixed(2),
            totalLateHours: totalLate.toFixed(2),
            attendancePercentage: attendance,
        };
    });

    return grouped;
};

// ─── Calculate summary statistics across all records ────────────────────────

export const calculateSummary = (data) => {
    const uniqueEmployees = new Set(data.map((r) => r.employee_code)).size;
    const workingDays = data.filter((r) => r.shift_status === "Working Day").length;
    const presentCount = data.filter((r) => normalizeStatus(r.status) === "P").length;
    const absentCount = data.filter((r) => normalizeStatus(r.status) === "A").length;
    const weekOffCount = data.filter((r) => normalizeStatus(r.status) === "WO").length;

    // "Late" = any record with non-zero late_hours
    const lateCount = data.filter((r) => parseDurationToHours(r.late_hours) > 0).length;
    const overtimeCount = data.filter((r) => parseDurationToHours(r.overtime_hours) > 0).length;

    const totalHours = data.reduce((s, r) => s + parseDurationToHours(r.attandance_hours), 0);
    const totalOvertime = data.reduce((s, r) => s + parseDurationToHours(r.overtime_hours), 0);
    const totalLate = data.reduce((s, r) => s + parseDurationToHours(r.late_hours), 0);

    return {
        totalRecords: data.length,
        uniqueEmployees,
        workingDays,
        presentCount,
        absentCount,
        weekOffCount,
        lateCount,
        overtimeCount,
        totalHours: totalHours.toFixed(2),
        totalOvertimeHours: totalOvertime.toFixed(2),
        totalLateHours: totalLate.toFixed(2),
    };
};

// ─── Date formatting ────────────────────────────────────────────────────────

export const formatDate = (dateInput) => {
    const date = new Date(dateInput);
    if (Object.prototype.toString.call(date) !== "[object Date]" || isNaN(date.getTime())) {
        return "Invalid Date";
    }
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
};

// ─── Main export function ────────────────────────────────────────────────────

/**
 * Exports attendance data to an Excel-compatible HTML file.
 *
 * @param {Array}  attendanceData  – grouped or flat records
 * @param {Date}   startDate
 * @param {Date}   endDate
 * @param {string} filename        – without extension
 * @param {Object} options
 * @param {string} [monthYear]     – "YYYY-MM", used when converting grouped data
 */
export const exportToExcel = (
    attendanceData,
    startDate,
    endDate,
    filename = "attendance_report",
    options = {},
    monthYear
) => {
    if (!attendanceData || attendanceData.length === 0) {
        throw new Error("No data available to export");
    }

    // ── Convert grouped format to flat if necessary ──────────────────────────
    let processedData = attendanceData;
    if (attendanceData.length > 0 && attendanceData[0].dailyAttendance) {
        // Derive monthYear from startDate when not provided explicitly
        const my =
            monthYear ||
            (startDate
                ? `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, "0")}`
                : new Date().toISOString().slice(0, 7));
        processedData = convertGroupedDataToFlat(attendanceData, my);
    }

    const defaultOptions = {
        showTitle: true,
        showSummary: true,
        showEmployeeDetails: true,
        reportTitle: "Employee Attendance Report",
    };
    const finalOptions = { ...defaultOptions, ...options };

    const groupedData = groupDataByEmployee(processedData);
    const reportSummary = calculateSummary(processedData);

    const excelData = [];

    const formattedStartDate = formatDate(startDate);
    const formattedEndDate = formatDate(endDate);
    const currentDate = new Date().toLocaleDateString("en-GB");
    const currentTime = new Date().toLocaleTimeString();

    // ── Report header ────────────────────────────────────────────────────────
    if (finalOptions.showTitle) {
        excelData.push(["", "", "", "", finalOptions.reportTitle, "", "", "", "", "", ""]);
        excelData.push([
            "",
            `Period: ${formattedStartDate} to ${formattedEndDate}`,
            `Generated: ${currentDate} ${currentTime}`,
            "",
            `Total Records: ${reportSummary.totalRecords}`,
            `Total Employees: ${reportSummary.uniqueEmployees}`,
            "", "", "", "", "",
        ]);
    }

    excelData.push([""]);

    // ── Summary statistics ───────────────────────────────────────────────────
    if (finalOptions.showSummary) {
        excelData.push(["Summary Statistics", "", "", "", "", "", "", "", "", "", ""]);
        excelData.push([
            "Present Days", reportSummary.presentCount, "",
            "Absent Days", reportSummary.absentCount, "",
            "Week Off Days", reportSummary.weekOffCount, "", "", "",
        ]);
        excelData.push([
            "Working Days", reportSummary.workingDays, "",
            "Late Days", reportSummary.lateCount, "",
            "Overtime Days", reportSummary.overtimeCount, "", "", "",
        ]);
        excelData.push([
            "Total Hours", reportSummary.totalHours, "",
            "Overtime Hours", reportSummary.totalOvertimeHours, "",
            "Late Hours", reportSummary.totalLateHours, "", "", "",
        ]);
    }

    excelData.push([""]);
    excelData.push([""]);

    // ── Per-employee detail ──────────────────────────────────────────────────
    if (finalOptions.showEmployeeDetails) {
        Object.values(groupedData).forEach((empData) => {
            excelData.push([
                `Employee: ${empData.employee_name} (${empData.employee_code})`,
                `Shift: ${empData.shift_name || "--"}`,
                `Time: ${empData.shift_from_time || "--"} - ${empData.shift_to_time || "--"}`,
                `Attendance: ${empData.summary.attendancePercentage}%`,
                `Present: ${empData.summary.presentDays}`,
                `Working Days: ${empData.summary.workingDays}`,
                `Hours: ${empData.summary.totalHours}`,
                `Overtime: ${empData.summary.totalOvertimeHours}`,
                "", "", "",
            ]);

            excelData.push([
                "Date", "Status", "Clock In", "Clock Out",
                "Working Hours", "Overtime Hours", "Late Hours", "Remarks",
                "", "", "",
            ]);

            empData.records.forEach((record) => {
                excelData.push([
                    formatDate(record.date),
                    record.status || "--",
                    record.attandance_first_clock_in || "--",
                    record.attandance_last_clock_out || "--",
                    record.attandance_hours || "0h 0m",
                    record.overtime_hours || "0h 0m",
                    record.late_hours || "0h 0m",
                    record.remarks || "--",
                    "", "", "",
                ]);
            });

            excelData.push([""]);
            excelData.push([""]);
        });
    }

    // ── Build HTML table ─────────────────────────────────────────────────────
    const tableHTML = `
        <table border="1" cellpadding="5" cellspacing="0"
               style="border-collapse:collapse;width:100%;font-family:Arial,sans-serif;border:2px solid #000;">
            <tbody>
                ${excelData
            .map((row, rowIndex) => `
                        <tr>
                            ${row
                    .map((cell, cellIndex) => {
                        let cellStyle =
                            "border:1px solid #000;padding:8px;text-align:center;";

                        // Report title
                        if (rowIndex === 0 && cellIndex === 4) {
                            cellStyle +=
                                "color:#000;font-weight:bold;font-size:20px;text-align:center;border:2px solid #000;";
                        }
                        // Date / generated row
                        else if (
                            rowIndex === 1 &&
                            [1, 2, 4, 5].includes(cellIndex)
                        ) {
                            cellStyle +=
                                "font-weight:bold;font-size:14px;border:1px solid #666;";
                        }
                        // Summary header
                        else if (cell === "Summary Statistics") {
                            cellStyle +=
                                "background-color:#f0f0f0;font-weight:bold;font-size:16px;text-align:center;border:2px solid #000;";
                        }
                        // Summary labels
                        else if (
                            [
                                "Present Days", "Absent Days", "Week Off Days",
                                "Working Days", "Late Days", "Overtime Days",
                                "Total Hours", "Overtime Hours", "Late Hours",
                            ].includes(cell)
                        ) {
                            cellStyle +=
                                "font-weight:bold;text-align:left;border:1px solid #333;";
                        }
                        // Employee header row
                        else if (
                            typeof cell === "string" &&
                            cell.startsWith("Employee:")
                        ) {
                            cellStyle +=
                                "background-color:#f5f5f5;font-weight:bold;font-size:16px;text-align:left;border:2px solid #000;";
                        }
                        // Employee info cells (Shift, Time, etc.)
                        else if (
                            typeof cell === "string" &&
                            (
                                cell.startsWith("Shift:") ||
                                cell.startsWith("Time:") ||
                                cell.startsWith("Attendance:") ||
                                cell.startsWith("Present:") ||
                                cell.startsWith("Working Days:") ||
                                cell.startsWith("Hours:") ||
                                cell.startsWith("Overtime:")
                            )
                        ) {
                            cellStyle +=
                                "background-color:#f8f8f8;font-weight:bold;font-size:14px;text-align:left;border:1px solid #333;";
                        }
                        // Column headers
                        else if (
                            [
                                "Date", "Status", "Clock In", "Clock Out",
                                "Working Hours", "Overtime Hours", "Late Hours", "Remarks",
                            ].includes(cell)
                        ) {
                            cellStyle +=
                                "background-color:#000;color:#fff;font-weight:bold;text-align:center;border:2px solid #000;font-size:14px;";
                        }
                        // Status-specific cell colours
                        else if (cell === "P") {
                            cellStyle +=
                                "background-color:#f9f9f9;font-weight:bold;text-align:center;border:1px solid #333;";
                        }
                        else if (cell === "P/INC") {
                            cellStyle +=
                                "background-color:#f5f5f5;font-weight:bold;text-align:center;border:1px solid #333;";
                        }
                        else if (cell === "A") {
                            cellStyle +=
                                "background-color:#e0e0e0;font-weight:bold;text-align:center;border:2px solid #666;";
                        }
                        else if (cell === "WO") {
                            cellStyle +=
                                "background-color:#f5f5f5;font-style:italic;font-weight:bold;text-align:center;border:1px solid #333;";
                        }
                        else if (cell === "½P") {
                            cellStyle +=
                                "background-color:#fafafa;font-weight:bold;text-align:center;border:1px solid #555;";
                        }
                        // Regular data cells
                        else if (cell !== "" && rowIndex > 0) {
                            cellStyle +=
                                "text-align:center;border:1px solid #666;";
                        }

                        return `<td style="${cellStyle}">${cell || ""}</td>`;
                    })
                    .join("")}
                        </tr>
                    `)
            .join("")}
            </tbody>
        </table>
    `;

    // ── Download ─────────────────────────────────────────────────────────────
    const safeFmt = (s) => String(s).replace(/\//g, "_");
    const filenameSuffix = `${safeFmt(formattedStartDate)}_to_${safeFmt(formattedEndDate)}`;

    const blob = new Blob([tableHTML], {
        type: "application/vnd.ms-excel;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}_${filenameSuffix}.xls`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};