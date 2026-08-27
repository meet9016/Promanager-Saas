// utils/exportUtils/MonthlyReport/pdfExportMonthly.js
import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import {
    commonPdfStyles as styles,
    PDF_COLORS,
    PDFHeaderBanner,
    PDFFiltersSection,
    PDFFooter,
    downloadPdfDocument
} from "../commonPdfExport";

const monthlyStyles = StyleSheet.create({
    empCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: PDF_COLORS.purpleLight,
        borderColor: PDF_COLORS.purpleBorder,
        borderWidth: 1,
        paddingVertical: 3,
        paddingHorizontal: 6,
        borderTopLeftRadius: 3,
        borderTopRightRadius: 3,
        marginTop: 6,
    },
    empTitleText: {
        fontSize: 7.5,
        fontWeight: 'bold',
        color: PDF_COLORS.primaryDark,
    },
    empSummaryText: {
        fontSize: 6.5,
        fontWeight: 'bold',
        color: PDF_COLORS.purpleText,
    },
    labelCell: {
        width: 52,
        fontSize: 6.5,
        fontWeight: 'bold',
        color: PDF_COLORS.textDark,
        backgroundColor: '#f1f5f9',
        borderRightWidth: 1,
        borderRightColor: PDF_COLORS.purpleBorder,
        borderBottomWidth: 1,
        borderBottomColor: PDF_COLORS.purpleBorder,
        padding: 2,
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
    },
    dayValCell: {
        width: 22,
        fontSize: 5.5,
        color: PDF_COLORS.textDark,
        borderRightWidth: 1,
        borderRightColor: '#e2e8f0',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        padding: 2,
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
    },
    summaryValCell: {
        width: 68,
        fontSize: 5.5,
        color: PDF_COLORS.textDark,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        padding: 2,
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
    },
    statusCellP: {
        color: '#15803d',
        fontWeight: 'bold',
    },
    statusCellA: {
        color: '#b91c1c',
        fontWeight: 'bold',
    },
    statusCellWO: {
        color: '#7e22ce',
        fontWeight: 'bold',
    },
    statusCellHalf: {
        color: '#c2410c',
        fontWeight: 'bold',
    }
});

const pad2 = (n) => (n < 10 ? `0${n}` : String(n));

const buildDateRangeText = (monthYear) => {
    if (!monthYear) return "";
    const [yStr, mStr] = monthYear.split("-");
    const y = parseInt(yStr, 10);
    const m = parseInt(mStr, 10);
    const first = new Date(y, m - 1, 1);
    const last = new Date(y, m, 0);
    const fmt = (d) =>
        `${d.toLocaleString("en-US", { month: "short" })} ${pad2(d.getDate())} ${d.getFullYear()}`;
    return `${fmt(first)}  To  ${fmt(last)}`;
};

const buildFilterLines = (filters = {}, options = {}) => {
    const parts = [];
    if (filters.branch_name) parts.push(`Branch: ${filters.branch_name}`);
    if (filters.department_name) parts.push(`Department: ${filters.department_name}`);
    if (filters.designation_name) parts.push(`Designation: ${filters.designation_name}`);
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

const parseDurationToHours = (str) => {
    if (!str || str === "--") return 0;
    const s = String(str);
    const hMatch = s.match(/(\d+)\s*h/i);
    const mMatch = s.match(/(\d+)\s*m/i);
    const h = hMatch ? parseInt(hMatch[1], 10) : 0;
    const m = mMatch ? parseInt(mMatch[1], 10) : 0;
    return h + m / 60;
};

const formatHours = (decimalHours) => {
    const h = Math.floor(decimalHours);
    const m = Math.round((decimalHours - h) * 60);
    return `${h}h ${m}m`;
};

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

    const parts = [];
    if (totals.P > 0) parts.push(`P:${totals.P}`);
    if (totals["P/INC"] > 0) parts.push(`P/INC:${totals["P/INC"]}`);
    if (totals.A > 0) parts.push(`A:${totals.A}`);
    if (totals.L > 0) parts.push(`L:${totals.L}`);
    if (totals.WO > 0) parts.push(`WO:${totals.WO}`);
    if (totals["½P"] > 0) parts.push(`½P:${totals["½P"]}`);
    if (totals.H > 0) parts.push(`H:${totals.H}`);

    totals.summaryText = `${parts.join(", ")} | Total: ${formatHours(totals.totalHours)}`;
    return totals;
};

const getStatusStyle = (st) => {
    const norm = normalizeStatus(st);
    if (norm === 'P' || norm === 'P/INC') return monthlyStyles.statusCellP;
    if (norm === 'A') return monthlyStyles.statusCellA;
    if (norm === 'WO' || norm === 'WOP') return monthlyStyles.statusCellWO;
    if (norm === '½P' || norm === 'L') return monthlyStyles.statusCellHalf;
    return {};
};

const EmployeeBlock = ({ empCode, empName, daysMeta, days }) => {
    const totals = computeTotals(days);

    return (
        <View style={{ marginBottom: 6 }} wrap={false}>
            {/* Employee Header Banner */}
            <View style={monthlyStyles.empCardHeader}>
                <Text style={monthlyStyles.empTitleText}>
                    Code: {empCode || "-"}   |   Name: {empName || "-"}
                </Text>
                <Text style={monthlyStyles.empSummaryText}>
                    {totals.summaryText}
                </Text>
            </View>

            {/* Table */}
            <View style={[styles.table, { borderTopWidth: 0 }]}>
                {/* InTime row */}
                <View style={[styles.tableRow, { backgroundColor: '#faf5ff' }]}>
                    <Text style={monthlyStyles.labelCell}>InTime</Text>
                    {daysMeta.map(({ day }) => (
                        <Text key={`in-${day}`} style={monthlyStyles.dayValCell}>{v(days[day]?.in)}</Text>
                    ))}
                    <Text style={monthlyStyles.summaryValCell}>Total</Text>
                </View>

                {/* OutTime row */}
                <View style={styles.tableRow}>
                    <Text style={monthlyStyles.labelCell}>OutTime</Text>
                    {daysMeta.map(({ day }) => (
                        <Text key={`out-${day}`} style={monthlyStyles.dayValCell}>{v(days[day]?.out)}</Text>
                    ))}
                    <Text style={monthlyStyles.summaryValCell}>{totals.summaryText}</Text>
                </View>

                {/* Total hours row */}
                <View style={[styles.tableRow, { backgroundColor: '#faf5ff' }]}>
                    <Text style={monthlyStyles.labelCell}>Total Hrs</Text>
                    {daysMeta.map(({ day }) => (
                        <Text key={`tot-${day}`} style={monthlyStyles.dayValCell}>{v(days[day]?.total)}</Text>
                    ))}
                    <Text style={monthlyStyles.summaryValCell}></Text>
                </View>

                {/* Status row */}
                <View style={styles.tableRow}>
                    <Text style={monthlyStyles.labelCell}>Status</Text>
                    {daysMeta.map(({ day }) => {
                        const st = v(days[day]?.status);
                        return (
                            <Text key={`st-${day}`} style={[monthlyStyles.dayValCell, getStatusStyle(st)]}>{st}</Text>
                        );
                    })}
                    <Text style={monthlyStyles.summaryValCell}></Text>
                </View>
            </View>
        </View>
    );
};

const MonthlyBasicWorkDurationPDF = ({
    month,
    year,
    dateRangeText,
    companyName,
    employees,
    filterLines = [],
}) => {
    const daysMeta = buildDaysMeta(year, month);
    const EMP_PER_PAGE = 3;
    const empChunks = [];
    for (let i = 0; i < employees.length; i += EMP_PER_PAGE) {
        empChunks.push(employees.slice(i, i + EMP_PER_PAGE));
    }
    if (!empChunks.length) empChunks.push([]);

    return (
        <Document>
            {empChunks.map((chunk, pIdx) => (
                <Page key={pIdx} size="A4" orientation="landscape" style={styles.page}>
                    <PDFHeaderBanner
                        title="MONTHLY ATTENDANCE REPORT (BASIC WORK DURATION)"
                        companyName={companyName}
                        dateRangeText={dateRangeText}
                    />

                    <View style={styles.content}>
                        {pIdx === 0 && filterLines.length > 0 && <PDFFiltersSection appliedFilters={filterLines} />}

                        {/* Top Days Header Bar */}
                        <View style={[styles.tableRow, styles.tableHeaderRow, { marginTop: 4 }]}>
                            <Text style={[styles.th, { width: 52 }]}>Date / Day</Text>
                            {daysMeta.map(({ day, wd }) => (
                                <Text key={`dnum-${day}`} style={[styles.th, { width: 22, fontSize: 5 }]}>{day}{'\n'}{wd}</Text>
                            ))}
                            <Text style={[styles.th, { width: 68 }]}>Summary</Text>
                        </View>

                        {/* Employee Blocks */}
                        {chunk.map((e, idx) => (
                            <EmployeeBlock
                                key={`${e.empCode}-${idx}`}
                                empCode={e.empCode}
                                empName={e.empName}
                                daysMeta={daysMeta}
                                days={e.days}
                            />
                        ))}
                    </View>

                    <PDFFooter totalCount={employees.length} itemLabel="Employees" />
                </Page>
            ))}
        </Document>
    );
};

const empKey = (row) => {
    const code = (row?.employee_code ?? row?.employee_id ?? "").toString().trim();
    const name = (row?.employee_name ?? "").toString().trim();
    return `${code}||${name}`;
};

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
            status: row.short_status || row.status || "",
        };
    });
    return days;
};

const adaptEmployeeDaysFromGrouped = (dailyAttendance) => {
    const days = {};
    Object.entries(dailyAttendance || {}).forEach(([day, record]) => {
        days[parseInt(day, 10)] = {
            in: record.inTime || "",
            out: record.outTime || "",
            total: record.totalHours || "",
            status: record.status || record.fullStatus || "",
        };
    });
    return days;
};

const buildEmployeesFromAllData = (reportData) => {
    if (reportData.length > 0 && reportData[0].dailyAttendance) {
        return reportData.map((employee) => ({
            empCode: employee.employee_code,
            empName: employee.employee_name,
            days: adaptEmployeeDaysFromGrouped(employee.dailyAttendance),
        }));
    }

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
            companyName={options.companyName || "Your Company Name"}
            department={filters.department_name || ""}
            printedOn={options.printedOn || new Date()}
            employees={employees}
            filterLines={filterLines}
        />
    );

    try {
        const fileName = options.fileName || `Monthly_Attendance_Report_${monthYear}.pdf`;
        await downloadPdfDocument(doc, fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`);
        return { success: true, message: "PDF exported successfully!" };
    } catch (error) {
        console.error("PDF generation error:", error);
        return { success: false, message: "Failed to generate PDF: " + error.message };
    }
};