import React from 'react';
import { Document, Page, Text, View, StyleSheet, pdf, Font } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';

// ---------- CONSTANTS: FIT EXACTLY INSIDE A4 LANDSCAPE INNER WIDTH ----------
const GRID_COLS = 31;

const A4_LANDSCAPE_WIDTH = 841.89;
const PAGE_PADDING = 15;
const INNER_W = A4_LANDSCAPE_WIDTH - (PAGE_PADDING * 2);
const SLACK = 0.5;
const GRID_W = INNER_W - SLACK;
const LABEL_W = 40;
const TOTAL_COL_W = 44;
const CELL_W = (GRID_W - LABEL_W - TOTAL_COL_W) / GRID_COLS;

// Register Roboto with ALL variants needed (normal + italic) to avoid
// "@react-pdf/renderer: Could not resolve font" errors.
// Using fonts.gstatic.com direct TTF links which are stable and always available.
Font.register({
    family: 'Roboto',
    fonts: [
        {
            src: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5Q.ttf',
            fontWeight: 300,
            fontStyle: 'normal'
        },
        {
            src: 'https://fonts.gstatic.com/s/roboto/v30/KFOkCnqEu92Fr1MmgWxP.ttf',
            fontWeight: 300,
            fontStyle: 'italic'
        },
        {
            src: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu72xP.ttf',
            fontWeight: 400,
            fontStyle: 'normal'
        },
        {
            src: 'https://fonts.gstatic.com/s/roboto/v30/KFOkCnqEu92Fr1MmejxP.ttf',
            fontWeight: 400,
            fontStyle: 'italic'
        },
        {
            src: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmEU9vAw.ttf',
            fontWeight: 500,
            fontStyle: 'normal'
        },
        {
            src: 'https://fonts.gstatic.com/s/roboto/v30/KFOjCnqEu92Fr1MmjqkPCrQ.ttf',
            fontWeight: 500,
            fontStyle: 'italic'
        },
        {
            src: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlvAw.ttf',
            fontWeight: 700,
            fontStyle: 'normal'
        },
        {
            src: 'https://fonts.gstatic.com/s/roboto/v30/KFOjCnqEu92Fr1MmjqkPFrQ.ttf',
            fontWeight: 700,
            fontStyle: 'italic'
        }
    ]
});

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 15,
        fontSize: 8,
        fontFamily: 'Roboto'
    },

    // ── Header ──────────────────────────────────────────────
    headerContainer: {
        marginBottom: 4
    },
    reportTitle: {
        fontSize: 12,
        fontWeight: 700,
        textAlign: 'center',
        color: '#000',
        marginBottom: 2
    },
    reportDateRange: {
        fontSize: 9,
        fontWeight: 500,
        textAlign: 'center',
        color: '#000',
        marginBottom: 4
    },
    headerInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 3
    },
    companyInfo: { fontSize: 8, color: '#000' },
    printedOnInfo: { fontSize: 8, color: '#000' },
    hrLine: {
        height: 1,
        backgroundColor: '#000',
        marginBottom: 4
    },

    // ── Employee section ─────────────────────────────────────
    // NO marginBottom — tight stacking between employees
    employeeSection: {
        marginBottom: 3,
        border: '0.5 solid #000000'
    },
    employeeHeader: {
        backgroundColor: '#F0F0F0',
        paddingVertical: 2,
        paddingHorizontal: 3,
        borderBottom: '0.5 solid #000000',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    employeeName: {
        fontSize: 8,
        fontWeight: 700,
        color: '#000000'
    },
    employeeId: {
        fontSize: 6,
        color: '#333333'
    },

    // ── Grid ─────────────────────────────────────────────────
    blockContainer: {
        flexDirection: 'column',
        alignItems: 'flex-start'
    },
    fixedRow: {
        width: GRID_W,
        alignSelf: 'flex-start',
        flexDirection: 'row'
    },
    blockHeaderRow: {
        backgroundColor: '#E0E0E0',
        borderBottom: '0.5 solid #000000'
    },
    blockDayRow: {
        borderBottom: '0.25 solid #BBBBBB'
    },

    // Label column
    labelCol: {
        width: LABEL_W,
        padding: 2,
        borderRight: '0.5 solid #000000',
        fontSize: 5.5,
        fontWeight: 600,
        backgroundColor: '#F7F7F7',
        flexGrow: 0,
        flexShrink: 0
    },

    // Day header cell
    dayCellHeader: {
        width: CELL_W,
        textAlign: 'center',
        paddingVertical: 1,
        paddingHorizontal: 0.5,
        borderRight: '0.5 solid #AAAAAA',
        fontSize: 5.5,
        fontWeight: 700,
        flexGrow: 0,
        flexShrink: 0
    },

    // Day data cell
    dayCell: {
        width: CELL_W,
        textAlign: 'center',
        paddingVertical: 1,
        paddingHorizontal: 0.5,
        borderRight: '0.25 solid #CCCCCC',
        fontSize: 5.5,
        flexGrow: 0,
        flexShrink: 0
    },

    // Total column
    totalCellHeader: {
        width: TOTAL_COL_W,
        textAlign: 'center',
        paddingVertical: 1,
        paddingHorizontal: 2,
        borderLeft: '1 solid #000000',
        fontSize: 5.5,
        fontWeight: 700,
        backgroundColor: '#D0D0D0',
        flexGrow: 0,
        flexShrink: 0
    },
    totalCell: {
        width: TOTAL_COL_W,
        textAlign: 'center',
        paddingVertical: 1,
        paddingHorizontal: 2,
        borderLeft: '1 solid #000000',
        fontSize: 5.5,
        fontWeight: 600,
        backgroundColor: '#F0F0F0',
        flexGrow: 0,
        flexShrink: 0
    },

    // Row separators
    dataRow: {
        borderBottom: '0.25 solid #DDDDDD'
    },

    // Thin divider between blocks (when date > 31 days; replaces the fat emptyrow)
    blockDivider: {
        width: GRID_W,
        height: 1,
        backgroundColor: '#AAAAAA',
        alignSelf: 'flex-start'
    },

    // Status text colours — NO fontStyle:italic to avoid font-resolve errors
    statusPresent: { color: '#000000', fontWeight: 600 },
    statusAbsent: { color: '#555555', fontWeight: 600 },
    statusWeekOff: { color: '#999999', fontWeight: 400 },
    statusOther: { color: '#333333', fontWeight: 500 },

    // Footer
    footer: {
        position: 'absolute',
        bottom: 10,
        left: 15,
        right: 15,
        borderTop: '0.5 solid #000000',
        paddingTop: 2,
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    footerText: { fontSize: 5, color: '#666666' }
});

// ────────────────────────────────────────────────────────────
// Utilities
// ────────────────────────────────────────────────────────────
const toKeyDate = (d) => {
    const dt = typeof d === 'string' ? new Date(d) : d;
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const day = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

const parseDate = (d) => (typeof d === 'string' ? new Date(d) : d);

const addDays = (date, n) => {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    return d;
};

const eachDayOfInterval = (start, end) => {
    const s = parseDate(start);
    const e = parseDate(end);
    const days = [];
    for (let d = new Date(s); d <= e; d = addDays(d, 1)) days.push(new Date(d));
    return days;
};

const chunk = (arr, size) => {
    const out = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
};

const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' });
};

const pad2 = (n) => (n < 10 ? `0${n}` : String(n));

const formatPrintedOnHeader = (dt) => {
    const d = typeof dt === 'string' ? new Date(dt) : dt;
    const y = d.getFullYear();
    const mo = d.toLocaleString('en-US', { month: 'short' });
    const day = pad2(d.getDate());
    const hh = pad2(d.getHours());
    const mm = pad2(d.getMinutes());
    return `${mo} ${day} ${y} ${hh}:${mm}`;
};

const formatTime = (timeString) => {
    if (!timeString || timeString === '' || timeString === '00:00:00') return '-';
    if (timeString.includes('AM') || timeString.includes('PM')) return timeString;
    const [hoursStr, minutes] = timeString.split(':');
    const hours = parseInt(hoursStr, 10);
    const hour12 = hours % 12 || 12;
    const ampm = hours < 12 ? 'AM' : 'PM';
    return `${hour12}:${minutes} ${ampm}`;
};

const getDayNameShort = (d) =>
    new Date(d).toLocaleDateString('en-US', { weekday: 'short' });

/** Returns raw string e.g. "8h 8m"; hides zero values with '-' */
const formatHours = (hoursString) => {
    if (!hoursString || hoursString.trim() === '' || hoursString === '0h 0m' || hoursString === '0') return '-';
    return hoursString;
};

/** Parse "8h 8m" → total minutes */
const parseHoursToMinutes = (hoursString) => {
    if (!hoursString || hoursString.trim() === '') return 0;
    let total = 0;
    const hm = hoursString.match(/(\d+)h/);
    const mm = hoursString.match(/(\d+)m/);
    if (hm) total += parseInt(hm[1], 10) * 60;
    if (mm) total += parseInt(mm[1], 10);
    return total;
};

/** Total minutes → "Xh Ym" */
const formatMinutesToHours = (totalMinutes) => {
    if (totalMinutes === 0) return '-';
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return m === 0 ? `${h}h` : `${h}h ${m}m`;
};

const getStatusStyle = (shortStatus) => {
    const s = (shortStatus || '').toUpperCase();
    if (s === 'P') return styles.statusPresent;
    if (s === 'A') return styles.statusAbsent;
    if (s === 'WO') return styles.statusWeekOff;
    return styles.statusOther;
};

// ────────────────────────────────────────────────────────────
// Data helpers
// ────────────────────────────────────────────────────────────
const groupDataByEmployee = (data) => {
    const grouped = {};
    data.forEach(record => {
        const key = `${record.employee_name}_${record.employee_code}`;
        if (!grouped[key]) {
            grouped[key] = {
                employeeName: record.employee_name,
                employeeCode: record.employee_code,
                byDate: {}
            };
        }
        grouped[key].byDate[toKeyDate(record.date)] = record;
    });
    return grouped;
};

const buildDateBlocks = (startDate, endDate) =>
    chunk(eachDayOfInterval(startDate, endDate), GRID_COLS);

const padToGrid = (dates) => {
    const arr = dates.slice(0, GRID_COLS);
    while (arr.length < GRID_COLS) arr.push(null);
    return arr;
};

const computeEmployeeTotals = (employee, allDates) => {
    const statusCounts = {};
    let workMin = 0, otMin = 0, lateMin = 0;

    allDates.forEach(d => {
        if (!d) return;
        const rec = employee.byDate[toKeyDate(d)];
        if (!rec) return;
        const ss = (rec.short_status || '').trim();
        if (ss) statusCounts[ss] = (statusCounts[ss] || 0) + 1;
        workMin += parseHoursToMinutes(rec.attandance_hours);
        otMin += parseHoursToMinutes(rec.overtime_hours);
        lateMin += parseHoursToMinutes(rec.late_hours);
    });

    const statusLine = Object.entries(statusCounts)
        .map(([k, v]) => `${k}:${v}`)
        .join(', ');

    return {
        statusLine,
        totalWork: formatMinutesToHours(workMin),
        totalOT: formatMinutesToHours(otMin),
        totalLate: formatMinutesToHours(lateMin)
    };
};

// ────────────────────────────────────────────────────────────
// Employee Grid Block
// ────────────────────────────────────────────────────────────
const EmployeeGridBlock = ({ employee, dates, isLastBlock, totals, showDivider }) => {
    const paddedDates = padToGrid(dates);
    const dateKeys = paddedDates.map(d => (d ? toKeyDate(d) : null));

    const TotalHdr = ({ children }) => (
        <Text style={styles.totalCellHeader}>{children}</Text>
    );
    const TotalVal = ({ children, extraStyle }) => (
        <Text style={[styles.totalCell, extraStyle]}>{children}</Text>
    );

    return (
        <View style={styles.blockContainer} wrap={false}>
            {/* thin divider between blocks (only when range > 31 days) */}
            {showDivider && <View style={styles.blockDivider} />}

            {/* Date numbers row */}
            <View style={[styles.fixedRow, styles.blockHeaderRow]}>
                <Text style={styles.labelCol}>Date</Text>
                {paddedDates.map((d, i) => (
                    <Text key={`dn-${i}`} style={styles.dayCellHeader}>
                        {d ? String(d.getDate()).padStart(2, '0') : ''}
                    </Text>
                ))}
                <TotalHdr>{isLastBlock ? 'Total' : ''}</TotalHdr>
            </View>

            {/* Weekday row */}
            <View style={[styles.fixedRow, styles.blockDayRow]}>
                <Text style={styles.labelCol}>Day</Text>
                {paddedDates.map((d, i) => (
                    <Text key={`dw-${i}`} style={styles.dayCell}>
                        {d ? getDayNameShort(d) : ''}
                    </Text>
                ))}
                <TotalVal />
            </View>

            {/* In */}
            <View style={[styles.fixedRow, styles.dataRow]}>
                <Text style={styles.labelCol}>In</Text>
                {dateKeys.map((k, i) => {
                    const rec = k ? employee.byDate[k] : null;
                    return <Text key={`in-${i}`} style={styles.dayCell}>{rec ? formatTime(rec.attandance_first_clock_in) : '-'}</Text>;
                })}
                <TotalVal />
            </View>

            {/* Out */}
            <View style={[styles.fixedRow, styles.dataRow]}>
                <Text style={styles.labelCol}>Out</Text>
                {dateKeys.map((k, i) => {
                    const rec = k ? employee.byDate[k] : null;
                    return <Text key={`out-${i}`} style={styles.dayCell}>{rec ? formatTime(rec.attandance_last_clock_out) : '-'}</Text>;
                })}
                <TotalVal />
            </View>

            {/* Working Hours */}
            <View style={[styles.fixedRow, styles.dataRow]}>
                <Text style={styles.labelCol}>Working Hrs</Text>
                {dateKeys.map((k, i) => {
                    const rec = k ? employee.byDate[k] : null;
                    return <Text key={`wh-${i}`} style={styles.dayCell}>{rec ? formatHours(rec.attandance_hours) : '-'}</Text>;
                })}
                <TotalVal>{isLastBlock ? totals.totalWork : ''}</TotalVal>
            </View>

            {/* Remaining Hours */}
            <View style={[styles.fixedRow, styles.dataRow]}>
                <Text style={styles.labelCol}>Remain Hrs</Text>
                {dateKeys.map((k, i) => {
                    const rec = k ? employee.byDate[k] : null;
                    return <Text key={`rh-${i}`} style={styles.dayCell}>{rec ? formatHours(rec.late_hours) : '-'}</Text>;
                })}
                <TotalVal>{isLastBlock ? totals.totalLate : ''}</TotalVal>
            </View>

            {/* OT */}
            <View style={[styles.fixedRow, styles.dataRow]}>
                <Text style={styles.labelCol}>OT</Text>
                {dateKeys.map((k, i) => {
                    const rec = k ? employee.byDate[k] : null;
                    return <Text key={`ot-${i}`} style={styles.dayCell}>{rec ? formatHours(rec.overtime_hours) : '-'}</Text>;
                })}
                <TotalVal>{isLastBlock ? totals.totalOT : ''}</TotalVal>
            </View>

            {/* Status — short_status */}
            <View style={[styles.fixedRow, styles.dataRow]}>
                <Text style={styles.labelCol}>Status</Text>
                {dateKeys.map((k, i) => {
                    const rec = k ? employee.byDate[k] : null;
                    const txt = rec?.short_status || '-';
                    return (
                        <Text key={`st-${i}`} style={[styles.dayCell, getStatusStyle(rec?.short_status)]}>
                            {txt}
                        </Text>
                    );
                })}
                <TotalVal extraStyle={{ fontSize: 4.5, textAlign: 'left', paddingHorizontal: 2 }}>
                    {isLastBlock ? totals.statusLine : ''}
                </TotalVal>
            </View>
        </View>
    );
};

// ────────────────────────────────────────────────────────────
// PDF Document
// ────────────────────────────────────────────────────────────
const AttendanceReportDocument = ({ data, startDate, endDate }) => {
    const grouped = groupDataByEmployee(data);
    const employeeKeys = Object.keys(grouped).sort();
    const dateBlocks = buildDateBlocks(startDate, endDate);
    const allDates = eachDayOfInterval(startDate, endDate);

    const EMP_PER_PAGE = 2;
    const pages = [];
    for (let i = 0; i < employeeKeys.length; i += EMP_PER_PAGE) {
        pages.push(employeeKeys.slice(i, i + EMP_PER_PAGE));
    }

    return (
        <Document>
            {pages.map((empSlice, pageIndex) => (
                <Page key={pageIndex} size="A4" style={styles.page} orientation="landscape">

                    {/* Header — first page only */}
                    {pageIndex === 0 && (
                        <View style={styles.headerContainer}>
                            <Text style={styles.reportTitle}>Custom Date Range Report (Work Duration)</Text>
                            <Text style={styles.reportDateRange}>
                                {new Date(startDate).toLocaleString('en-US', { month: 'short' })} {pad2(new Date(startDate).getDate())} {new Date(startDate).getFullYear()}
                                {' To '}
                                {new Date(endDate).toLocaleString('en-US', { month: 'short' })} {pad2(new Date(endDate).getDate())} {new Date(endDate).getFullYear()}
                            </Text>
                            <View style={styles.headerInfoRow}>
                                <Text style={styles.companyInfo}>Company: Your Company Name</Text>
                                <Text style={styles.printedOnInfo}>Printed On: {formatPrintedOnHeader(new Date())}</Text>
                            </View>
                            <View style={styles.hrLine} />
                        </View>
                    )}

                    {/* Employee blocks */}
                    {empSlice.map((ekey) => {
                        const employee = grouped[ekey];
                        const totals = computeEmployeeTotals(employee, allDates);

                        return (
                            <View key={ekey} style={styles.employeeSection} wrap={false}>
                                <View style={styles.employeeHeader}>
                                    <Text style={styles.employeeName}>{employee.employeeName}</Text>
                                    <Text style={styles.employeeId}>Code: {employee.employeeCode}</Text>
                                </View>

                                {dateBlocks.map((dates, bi) => (
                                    <EmployeeGridBlock
                                        key={`blk-${ekey}-${bi}`}
                                        employee={employee}
                                        dates={dates}
                                        isLastBlock={bi === dateBlocks.length - 1}
                                        totals={totals}
                                        showDivider={bi > 0}   // thin line only between blocks, not before the first
                                    />
                                ))}
                            </View>
                        );
                    })}

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>
                            Generated: {new Date().toLocaleDateString('en-GB')} {new Date().toLocaleTimeString()}
                        </Text>
                        <Text style={styles.footerText}>Page {pageIndex + 1} of {pages.length}</Text>
                    </View>
                </Page>
            ))}
        </Document>
    );
};

// ────────────────────────────────────────────────────────────
// Export
// ────────────────────────────────────────────────────────────
export const exportToPDF = async (data, startDate, endDate) => {
    try {
        if (!data || data.length === 0) throw new Error('No attendance data available for export');

        const doc = <AttendanceReportDocument data={data} startDate={startDate} endDate={endDate} />;
        const asPdf = pdf(doc);
        const blob = await asPdf.toBlob();
        const fileName = `Attendance_Report_${formatDate(startDate)}_to_${formatDate(endDate)}.pdf`;
        saveAs(blob, fileName);

        return {
            success: true,
            message: `PDF exported successfully! Report contains ${data.length} records.`,
            recordCount: data.length,
            employeeCount: [...new Set(data.map(r => r.employee_code))].length
        };
    } catch (error) {
        console.error('PDF Export Error:', error);
        throw new Error(`Failed to export PDF: ${error.message}`);
    }
};