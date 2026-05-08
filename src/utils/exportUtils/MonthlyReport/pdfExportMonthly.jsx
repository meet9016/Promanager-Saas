// utils/exportUtils/MonthlyReport/pdfExportMonthly.js
import React from "react";
import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer";

/** ----------------- Styles (unchanged layout) ----------------- **/
const styles = StyleSheet.create({
    page: {
        backgroundColor: "#FFFFFF",
        paddingTop: 15,
        paddingBottom: 15,
        paddingLeft: 15,
        paddingRight: 15,
        fontSize: 7,
        fontFamily: "Helvetica",
    },
    headerContainer: { marginBottom: 6 },
    reportTitle: { fontSize: 12, fontWeight: "bold", textAlign: "center", marginBottom: 4 },
    dateRange: { fontSize: 10, textAlign: "center", marginBottom: 6 },
    headerInfoRow: {
        flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4,
    },
    companyInfo: { fontSize: 8, fontWeight: "normal" },
    printedOnInfo: { fontSize: 8, fontWeight: "normal" },
    hr: { borderBottomColor: "#000", borderBottomWidth: 1, marginBottom: 4 },

    filtersRow: { marginTop: 2, marginBottom: 2 },
    filtersText: { fontSize: 7 },

    daysContainer: { flexDirection: "column", marginBottom: 3 },
    daysRow: { flexDirection: "row", marginBottom: 1 },
    dayCellHeader: {
        width: 24, height: 14, textAlign: "center", borderWidth: 0.5, borderColor: "#000",
        paddingVertical: 1, backgroundColor: "#E8E8E8", fontWeight: "bold", fontSize: 6,
        justifyContent: "center", alignItems: "center",
    },
    totalCellHeader: {
        width: 60, height: 14, textAlign: "center", borderWidth: 0.5, borderColor: "#000",
        paddingVertical: 1, backgroundColor: "#E8E8E8", fontWeight: "bold", fontSize: 6,
        justifyContent: "center", alignItems: "center",
    },
    dayCell: {
        width: 24, height: 14, textAlign: "center", borderWidth: 0.5, borderColor: "#000",
        paddingVertical: 1, fontSize: 5, justifyContent: "center", alignItems: "center",
    },
    totaldayCell: {
        width: 60, height: 14, textAlign: "center", borderWidth: 0.5, borderColor: "#000",
        paddingVertical: 1, fontSize: 5, justifyContent: "center", alignItems: "center",
    },
    totalCell: {
        width: 60,
        height: 14,
        paddingVertical: 1,
        paddingHorizontal: 2,
        borderWidth: 0.5,
        borderColor: "#000",
        backgroundColor: "#F0F0F0",
        fontSize: 5,
        fontWeight: "bold",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
    },

    employeeBlock: { marginTop: 4, marginBottom: 6 },
    empHeader: { fontSize: 7, marginBottom: 3, fontWeight: "bold" },
    rowLabelAndCells: { flexDirection: "row", alignItems: "stretch", marginBottom: 0.5 },
    labelCell: {
        minWidth: 45, maxWidth: 50, height: 14, paddingVertical: 2, paddingHorizontal: 2,
        borderWidth: 0.5, borderColor: "#000", backgroundColor: "#F5F5F5", fontSize: 6,
        fontWeight: "bold", justifyContent: "center", alignItems: "center",
    },
    valueCell: {
        width: 24, height: 14, textAlign: "center", borderWidth: 0.5, borderColor: "#000",
        paddingVertical: 1, fontSize: 5, justifyContent: "center", alignItems: "center",
    },

    footerLine: { marginTop: 4, fontSize: 7 },
    footer: {
        position: "absolute", left: 15, right: 15, bottom: 8, fontSize: 5,
        textAlign: "center", color: "#333",
    },
});

/** ----------------- Helpers ----------------- **/
const pad2 = (n) => (n < 10 ? `0${n}` : String(n));

const formatPrintedOn = (dt) => {
    try {
        const d = typeof dt === "string" ? new Date(dt) : dt;
        const y = d.getFullYear();
        const m = d.toLocaleString("en-US", { month: "short" });
        const day = pad2(d.getDate());
        const hh = pad2(d.getHours());
        const mm = pad2(d.getMinutes());
        return `${m} ${day} ${y} ${hh}:${mm}`;
    } catch {
        return String(dt || "");
    }
};

// Build "Aug 01 2025  To  Aug 31 2025" from "YYYY-MM"
const buildDateRangeText = (monthYear) => {
    if (!monthYear) return "";
    const [yStr, mStr] = monthYear.split("-");
    const y = parseInt(yStr, 10);
    const m = parseInt(mStr, 10); // 1..12

    const first = new Date(y, m - 1, 1);
    const last = new Date(y, m, 0);

    const fmt = (d) =>
        `${d.toLocaleString("en-US", { month: "short" })} ${pad2(d.getDate())} ${d.getFullYear()}`;

    return `${fmt(first)}  To  ${fmt(last)}`;
};

// Optional one-line filters summary
const buildFilterLines = (filters = {}, options = {}) => {
    const parts = [];
    if (filters.branch_name) parts.push(`Branch: ${filters.branch_name}`);
    if (filters.department_name) parts.push(`Department: ${filters.department_name}`);
    if (filters.designation_name) parts.push(`Designation: ${filters.designation_name}`);
    // Employee label (when single employee export)
    if (filters.employee_name) {
        parts.push(`Employee: ${filters.employee_name}`);
    } else if (options.employeeLabel) {
        parts.push(`Employee: ${options.employeeLabel}`);
    }
    return parts;
};

const weekdayToken = (date) => {
    switch (date.getDay()) {
        case 0: return "S";
        case 1: return "M";
        case 2: return "T";
        case 3: return "W";
        case 4: return "Th";
        case 5: return "F";
        case 6: return "St";
        default: return "";
    }
};

const buildDaysMeta = (year, month) => {
    const lastDay = new Date(year, month, 0).getDate();
    const arr = [];
    for (let d = 1; d <= lastDay; d++) {
        const cur = new Date(year, month - 1, d);
        arr.push({ day: d, wd: weekdayToken(cur) });
    }
    return arr;
};

/** Truncate a cell value for display */
const v = (s) => {
    if (s === undefined || s === null || s === "") return "";
    const str = String(s);
    if (str.includes(":")) {
        try {
            const parts = str.split(":");
            if (parts.length >= 2) return `${parts[0]}:${parts[1]}`;
        } catch {
            /* ignore */
        }
    }
    return str.length > 8 ? str.substring(0, 6) + ".." : str;
};

/**
 * Normalises any short_status variant into a consistent key.
 * Must match the logic in MonthlyReport.jsx.
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

/** Formats decimal hours → "Xh Ym" */
const formatHours = (decimalHours) => {
    const h = Math.floor(decimalHours);
    const m = Math.round((decimalHours - h) * 60);
    return `${h}h ${m}m`;
};

/**
 * Computes status counts and total hours for one employee's day map.
 * Works for both the grouped format (from React) and the flat format.
 *
 * @param {Object} days  – { [dayNumber]: { in, out, total, status } }
 * @returns {{ P, 'P/INC', A, L, WO, '½P', H, totalHours, summaryText }}
 */
const computeTotals = (days) => {
    const totals = { P: 0, "P/INC": 0, A: 0, L: 0, WO: 0, "½P": 0, H: 0, totalHours: 0 };

    Object.values(days || {}).forEach((record) => {
        const norm = normalizeStatus(record.status);
        if (norm !== null) {
            if (Object.prototype.hasOwnProperty.call(totals, norm)) {
                totals[norm] += 1;
            } else {
                totals[norm] = (totals[norm] || 0) + 1;
            }
        }
        totals.totalHours += parseDurationToHours(record.total);
    });

    // Build compact summary string for the PDF total cell
    const parts = [];
    if (totals.P > 0) parts.push(`P:${totals.P}`);
    if (totals["P/INC"] > 0) parts.push(`P/INC:${totals["P/INC"]}`);
    if (totals.A > 0) parts.push(`A:${totals.A}`);
    if (totals.L > 0) parts.push(`L:${totals.L}`);
    if (totals.WO > 0) parts.push(`WO:${totals.WO}`);
    if (totals["½P"] > 0) parts.push(`½P:${totals["½P"]}`);
    if (totals.H > 0) parts.push(`H:${totals.H}`);

    totals.summaryText = `${parts.join(", ")}  ||  Total: ${formatHours(totals.totalHours)}`;

    return totals;
};

/** ----------------- Employee Block ----------------- **/
const EmployeeBlock = ({ empCode, empName, daysMeta, days }) => {
    const totals = computeTotals(days);

    return (
        <View style={styles.employeeBlock} wrap={false}>
            <Text style={styles.empHeader}>
                Emp. Code: {empCode || "-"}   Emp. Name: {empName || "-"}
            </Text>

            {/* InTime row */}
            <View style={styles.rowLabelAndCells}>
                <Text style={styles.labelCell}>InTime</Text>
                {daysMeta.map(({ day }) => (
                    <Text key={`in-${day}`} style={styles.valueCell}>{v(days[day]?.in)}</Text>
                ))}
                <Text style={styles.totalCell}>Total</Text>
            </View>

            {/* OutTime row — summary in Total cell */}
            <View style={styles.rowLabelAndCells}>
                <Text style={styles.labelCell}>OutTime</Text>
                {daysMeta.map(({ day }) => (
                    <Text key={`out-${day}`} style={styles.valueCell}>{v(days[day]?.out)}</Text>
                ))}
                <Text style={styles.totalCell}>{totals.summaryText}</Text>
            </View>

            {/* Total hours row */}
            <View style={styles.rowLabelAndCells}>
                <Text style={styles.labelCell}>Total</Text>
                {daysMeta.map(({ day }) => (
                    <Text key={`tot-${day}`} style={styles.valueCell}>{v(days[day]?.total)}</Text>
                ))}
                <Text style={styles.totalCell}></Text>
            </View>

            {/* Status row */}
            <View style={styles.rowLabelAndCells}>
                <Text style={styles.labelCell}>Status</Text>
                {daysMeta.map(({ day }) => (
                    <Text key={`st-${day}`} style={styles.valueCell}>{v(days[day]?.status)}</Text>
                ))}
                <Text style={styles.totalCell}></Text>
            </View>
        </View>
    );
};

/** ----------------- PDF Document ----------------- **/
const MonthlyBasicWorkDurationPDF = ({
    month,
    year,
    dateRangeText,
    companyName,
    department,
    printedOn,
    employees,
    filterLines = [],
}) => {
    const daysMeta = buildDaysMeta(year, month);
    const printedOnText = formatPrintedOn(printedOn);

    return (
        <Document>
            <Page size="A4" orientation="landscape" style={styles.page}>
                {/* Header */}
                <View style={styles.headerContainer}>
                    <Text style={styles.reportTitle}>Monthly Status Report (Basic Work Duration)</Text>
                    <Text style={styles.dateRange}>{dateRangeText}</Text>
                    <View style={styles.headerInfoRow}>
                        <Text style={styles.companyInfo}>Company: {companyName}</Text>
                        <Text style={styles.printedOnInfo}>Printed On : {printedOnText}</Text>
                    </View>
                    {filterLines.length > 0 && (
                        <View style={styles.filtersRow}>
                            <Text style={styles.filtersText}>{filterLines.join("   •   ")}</Text>
                        </View>
                    )}
                </View>
                <View style={styles.hr} />

                {/* Days header */}
                <View style={styles.daysContainer}>
                    <View style={styles.daysRow}>
                        <Text style={styles.labelCell}>Date</Text>
                        {daysMeta.map(({ day }) => (
                            <Text key={`dnum-${day}`} style={styles.dayCellHeader}>{day}</Text>
                        ))}
                        <Text style={styles.totalCellHeader}>Total</Text>
                    </View>

                    <View style={styles.daysRow}>
                        <Text style={styles.labelCell}>Day</Text>
                        {daysMeta.map(({ day, wd }) => (
                            <Text key={`dwd-${day}`} style={styles.dayCell}>{wd}</Text>
                        ))}
                        <Text style={styles.totaldayCell}>Summary</Text>
                    </View>
                </View>

                {/* Employees */}
                {employees.map((e, idx) => (
                    <EmployeeBlock
                        key={`${e.empCode}-${idx}`}
                        empCode={e.empCode}
                        empName={e.empName}
                        daysMeta={daysMeta}
                        days={e.days}
                    />
                ))}

                {!!department && <Text style={styles.footerLine}>Department: {department}</Text>}
                <Text style={styles.footer}>Monthly Status Report • {companyName}</Text>
            </Page>
        </Document>
    );
};

/** ----------------- Data adapters ----------------- **/
const empKey = (row) => {
    const code = (row?.employee_code ?? row?.employee_id ?? "").toString().trim();
    const name = (row?.employee_name ?? "").toString().trim();
    return `${code}||${name}`;
};

/**
 * Adapts flat API rows → { [day]: { in, out, total, status } }
 * "status" is stored as the short_status value so computeTotals() can normalise it.
 */
const adaptEmployeeDays = (rowsForEmp) => {
    const days = {};
    (rowsForEmp || []).forEach((row) => {
        if (!row?.date) return;
        const dt = new Date(row.date);
        if (isNaN(dt)) return;
        const d = dt.getDate();
        days[d] = {
            in: row.attandance_first_clock_in || "",
            out: row.attandance_last_clock_out || "",
            total: row.attandance_hours ? String(row.attandance_hours) : "",
            // Prefer the short code; fall back to the full status string
            status: row.short_status || row.status || "",
        };
    });
    return days;
};

/**
 * Adapts grouped format (from React component) → { [day]: { in, out, total, status } }
 * The grouped data stores inTime/outTime/totalHours/status.
 */
const adaptEmployeeDaysFromGrouped = (dailyAttendance) => {
    const days = {};
    Object.entries(dailyAttendance || {}).forEach(([day, record]) => {
        days[parseInt(day, 10)] = {
            in: record.inTime || "",
            out: record.outTime || "",
            total: record.totalHours || "",
            // The React grouping stores short_status as record.status
            status: record.status || record.fullStatus || "",
        };
    });
    return days;
};

const buildEmployeesFromAllData = (reportData) => {
    // Grouped format (from React component — has dailyAttendance key)
    if (reportData.length > 0 && reportData[0].dailyAttendance) {
        return reportData.map((employee) => ({
            empCode: employee.employee_code,
            empName: employee.employee_name,
            days: adaptEmployeeDaysFromGrouped(employee.dailyAttendance),
        }));
    }

    // Flat format (original API response)
    const byEmp = new Map();
    for (const row of reportData || []) {
        if (!row) continue;
        if ((!row.employee_code && !row.employee_id && !row.employee_name) || !row.date) continue;

        const key = empKey(row);
        if (!byEmp.has(key)) byEmp.set(key, []);
        byEmp.get(key).push(row);
    }

    const employees = Array.from(byEmp.entries()).map(([key, rows]) => {
        const [code, name] = key.split("||");
        return {
            empCode: code || rows[0]?.employee_code || rows[0]?.employee_id || "",
            empName: name || rows[0]?.employee_name || "",
            days: adaptEmployeeDays(rows),
        };
    });

    employees.sort((a, b) => {
        const n = (a.empName || "").localeCompare(b.empName || "");
        return n !== 0 ? n : (a.empCode || "").localeCompare(b.empCode || "");
    });

    return employees;
};

/** ----------------- Public export function ----------------- **/
export const exportMonthlyReportToPDF = async (reportData, filters = {}, options = {}) => {
    if (!Array.isArray(reportData) || reportData.length === 0) {
        return { success: false, message: "No data available to export" };
    }

    const monthYear = filters.month_year || new Date().toISOString().slice(0, 7);
    const [yyStr, mmStr] = monthYear.split("-");
    const yy = parseInt(yyStr, 10);
    const mm = parseInt(mmStr, 10);
    const dateRangeText = buildDateRangeText(monthYear);

    const employees = buildEmployeesFromAllData(reportData);
    const filterLines = buildFilterLines(filters, { employeeLabel: options.employeeLabel });

    const doc = (
        <MonthlyBasicWorkDurationPDF
            month={mm}
            year={yy}
            dateRangeText={dateRangeText}
            companyName={options.companyName || "Company"}
            department={filters.department_name || ""}
            printedOn={options.printedOn || new Date()}
            employees={employees}
            filterLines={filterLines}
        />
    );

    try {
        const blob = await pdf(doc).toBlob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = options.fileName || `Monthly_BasicWork_DurationReport_${monthYear}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return { success: true, message: "PDF exported successfully!" };
    } catch (error) {
        console.error("PDF generation error:", error);
        return { success: false, message: "Failed to generate PDF: " + error.message };
    }
};