import React from 'react';
import { Document, Page, Text, View, StyleSheet, pdf, Font } from '@react-pdf/renderer';

// (Optional) external font; Helvetica is available by default as fallback.
Font.register({
    family: 'Helvetica',
    fonts: [
        { src: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxK.woff2', fontWeight: 'normal' },
        { src: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlfBBc4.woff2', fontWeight: 'bold' }
    ]
});

/** --------- PAGE + LAYOUT CONSTANTS (A4 landscape ≈ 842 x 595pt) ---------- */
const PAGE_H = 595;
const PAGE_PADDING = 20;
const INNER_H = PAGE_H - PAGE_PADDING * 2;

// conservative visual heights to keep content away from footer & header
const HEADER_H = 76;        // title + range + company/printed + hr
const FILTERS_H = 52;       // only on first page when filters exist
const TABLE_HDR_H = 18;     // header row height
const ROW_H = 22;           // increased from 18 to accommodate exit info
const FOOTER_H = 32;        // footer block height
const CONTENT_BOTTOM_SAFE = 8; // extra gap above footer

/** --------- STYLES ---------- */
const styles = StyleSheet.create({
    page: {
        fontFamily: 'Helvetica',
        fontSize: 8,
        padding: PAGE_PADDING,
        backgroundColor: '#ffffff',
        color: '#000000'
    },

    // Header (title centered, range centered, company left / printed right, hr)
    headerContainer: { marginBottom: 8 },
    reportTitle: { fontSize: 12, fontWeight: 'bold', textAlign: 'center', color: '#000', marginBottom: 2 },
    reportDateRange: { fontSize: 9, textAlign: 'center', color: '#000', marginBottom: 6 },
    headerInfoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    companyInfo: { fontSize: 8, color: '#000' },
    printedOnInfo: { fontSize: 8, color: '#000', textAlign: 'right' },
    hrLine: { height: 1, backgroundColor: '#000', marginBottom: 8 },

    // Content container leaves space so it never collides with footer
    content: { marginBottom: FOOTER_H + CONTENT_BOTTOM_SAFE },

    // Filters (first page only)
    filtersSection: {
        marginBottom: 10,
        padding: 6,
        backgroundColor: '#f5f5f5',
        borderWidth: 1,
        borderColor: '#cccccc',
        borderStyle: 'solid'
    },
    filtersTitle: { fontSize: 9, fontWeight: 'bold', marginBottom: 4 },
    filtersText: { fontSize: 8, lineHeight: 1.3 },

    // Table
    table: {
        display: 'table',
        width: '100%',
        borderWidth: 1,
        borderColor: '#000',
        borderStyle: 'solid'
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 0.5,
        borderBottomColor: '#cccccc',
        borderBottomStyle: 'solid',
        minHeight: ROW_H,
        alignItems: 'center'
    },
    tableHeaderRow: {
        backgroundColor: '#f0f0f0',
        fontWeight: 'bold',
        minHeight: TABLE_HDR_H
    },
    zebra: { backgroundColor: '#fbfbfb' },
    tableCol: {
        borderRightWidth: 0.5,
        borderRightColor: '#cccccc',
        borderRightStyle: 'solid',
        paddingVertical: 2,
        paddingHorizontal: 3,
        justifyContent: 'center'
    },

    // Column widths - adjusted to accommodate new columns
    col1: { width: '14%' }, // Employee Name
    col2: { width: '8%' },  // Code
    col3: { width: '11%' }, // Department
    col4: { width: '11%' }, // Designation
    col5: { width: '9%' },  // Branch
    col6: { width: '14%' }, // Contact (email/phone)
    col7: { width: '7%' },  // Join Date
    col8: { width: '7%' },  // Status
    col9: { width: '7%' },  // Last Working Date
    col10: { width: '12%' }, // Exit Reason

    th: { fontSize: 8, fontWeight: 'bold', textAlign: 'center' },
    tdCenter: { fontSize: 7, textAlign: 'center', lineHeight: 1.2 },
    tdLeft: { fontSize: 7, textAlign: 'left', lineHeight: 1.2 },
    contactInfo: { fontSize: 6.2, lineHeight: 1.1, textAlign: 'center' },
    exitInfo: { fontSize: 6.5, lineHeight: 1.2, textAlign: 'left', color: '#333' },
    inactiveStatus: { color: '#d32f2f', fontWeight: 'bold' },

    // Footer
    footer: {
        position: 'absolute',
        bottom: PAGE_PADDING,
        left: PAGE_PADDING,
        right: PAGE_PADDING,
        textAlign: 'center',
        fontSize: 7,
        color: '#666666',
        borderTopWidth: 1,
        borderTopColor: '#cccccc',
        borderTopStyle: 'solid',
        paddingTop: 5
    }
});

/** ---------- HELPERS ---------- */
const pad2 = (n) => (n < 10 ? `0${n}` : String(n));

const formatAsHeaderDate = (d) => {
    const dt = typeof d === 'string' ? new Date(d) : d;
    const y = dt.getFullYear();
    const m = dt.toLocaleString('en-US', { month: 'short' });
    const day = pad2(dt.getDate());
    return `${m} ${day} ${y}`;
};

const formatPrintedOn = (dt = new Date()) => {
    const d = typeof dt === 'string' ? new Date(dt) : dt;
    const y = d.getFullYear();
    const m = d.toLocaleString('en-US', { month: 'short' });
    const day = pad2(d.getDate());
    const hh = pad2(d.getHours());
    const mm = pad2(d.getMinutes());
    return `${m} ${day} ${y} ${hh}:${mm}`;
};

const formatDateCell = (dateString) => {
    if (!dateString || dateString === '0000-00-00') return '--';
    try {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit', month: '2-digit', year: '2-digit'
        });
    } catch { return '--'; }
};

const currentDateGB = () =>
    new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

const buildCenteredRange = (filters) => {
    const start = filters?.start_date || filters?.from_date || filters?.join_start_date;
    const end = filters?.end_date || filters?.to_date || filters?.join_end_date;
    if (start && end) return `${formatAsHeaderDate(start)}  To  ${formatAsHeaderDate(end)}`;
    return `As on ${formatAsHeaderDate(new Date())}`;
};

const getAppliedFilters = (filters = {}) => {
    const f = [];
    if (filters.branch_name && filters.branch_name !== 'All Branches') f.push(`Branch: ${filters.branch_name}`);
    if (filters.department_name && filters.department_name !== 'All Departments') f.push(`Department: ${filters.department_name}`);
    if (filters.designation_name && filters.designation_name !== 'All Designations') f.push(`Designation: ${filters.designation_name}`);
    if (filters.employee_type_name && filters.employee_type_name !== 'All Employee Types') f.push(`Employee Type: ${filters.employee_type_name}`);
    if (filters.salary_type_name && filters.salary_type_name !== 'All Salary Types') f.push(`Salary Type: ${filters.salary_type_name}`);
    if (filters.gender_name && filters.gender_name !== 'All Genders') f.push(`Gender: ${filters.gender_name}`);
    if (filters.status_name && filters.status_name !== 'All Status') f.push(`Status: ${filters.status_name}`);
    if (filters.search && String(filters.search).trim() !== '') f.push(`Search: ${filters.search}`);
    return f;
};

/** ---------- HEIGHT-AWARE PAGINATION ---------- */
const rowsPerPage = (hasFilters) => {
    const head = HEADER_H + (hasFilters ? FILTERS_H : 0);
    const usable = INNER_H - head - FOOTER_H - CONTENT_BOTTOM_SAFE;
    // reserve room for table header on each page
    const roomForRows = usable - TABLE_HDR_H;
    return Math.max(1, Math.floor(roomForRows / ROW_H));
};

const paginate = (rows, hasFilters) => {
    const first = rowsPerPage(hasFilters);
    const next = rowsPerPage(false);
    const pages = [];

    if (rows.length <= first) {
        pages.push(rows);
        return pages;
    }
    pages.push(rows.slice(0, first));
    let cursor = first;
    while (cursor < rows.length) {
        pages.push(rows.slice(cursor, cursor + next));
        cursor += next;
    }
    return pages;
};

/** ---------- PDF COMPONENT ---------- */
const EmployeeDirectoryPDF = ({ data, filters = {}, companyName = 'Your Company' }) => {
    const appliedFilters = getAppliedFilters(filters);
    const showFilters = appliedFilters.length > 0;
    const pages = paginate(data || [], showFilters);
    const centeredRangeText = buildCenteredRange(filters);

    return (
        <Document>
            {pages.map((pageRows, pageIndex) => (
                <Page key={pageIndex} size="A4" style={styles.page} orientation="landscape">
                    {/* Header */}
                    <View style={styles.headerContainer}>
                        <Text style={styles.reportTitle}>Employee Directory Report</Text>
                        <Text style={styles.reportDateRange}>{centeredRangeText}</Text>
                        <View style={styles.headerInfoRow}>
                            <Text style={styles.companyInfo}>Company: {companyName}</Text>
                            <Text style={styles.printedOnInfo}>Printed On : {formatPrintedOn()}</Text>
                        </View>
                        <View style={styles.hrLine} />
                    </View>

                    <View style={styles.content}>
                        {/* Filters only on first page */}
                        {pageIndex === 0 && showFilters && (
                            <View style={styles.filtersSection}>
                                <Text style={styles.filtersTitle}>Applied Filters:</Text>
                                <Text style={styles.filtersText}>{appliedFilters.join(' | ')}</Text>
                            </View>
                        )}

                        {/* Table */}
                        <View style={styles.table}>
                            {/* Table Header (repeats on every page) */}
                            <View style={[styles.tableRow, styles.tableHeaderRow]}>
                                <View style={[styles.tableCol, styles.col1]}><Text style={styles.th}>Employee Name</Text></View>
                                <View style={[styles.tableCol, styles.col2]}><Text style={styles.th}>Code</Text></View>
                                <View style={[styles.tableCol, styles.col3]}><Text style={styles.th}>Department</Text></View>
                                <View style={[styles.tableCol, styles.col4]}><Text style={styles.th}>Designation</Text></View>
                                <View style={[styles.tableCol, styles.col5]}><Text style={styles.th}>Branch</Text></View>
                                <View style={[styles.tableCol, styles.col6]}><Text style={styles.th}>Contact</Text></View>
                                <View style={[styles.tableCol, styles.col7]}><Text style={styles.th}>Join Date</Text></View>
                                <View style={[styles.tableCol, styles.col8]}><Text style={styles.th}>Status</Text></View>
                                <View style={[styles.tableCol, styles.col9]}><Text style={styles.th}>Exit Date</Text></View>
                                <View style={[styles.tableCol, styles.col10]}><Text style={styles.th}>Exit Reason</Text></View>
                            </View>

                            {/* Rows */}
                            {pageRows.map((employee, i) => {
                                const isInactive = employee.status === '2' || employee.status === 2;
                                const hasExitInfo = isInactive && (employee.last_working_date || employee.deactivate_reason);

                                return (
                                    <View
                                        key={employee.employee_id || `${pageIndex}-${i}`}
                                        style={[styles.tableRow, i % 2 === 1 && styles.zebra]}
                                    >
                                        <View style={[styles.tableCol, styles.col1]}>
                                            <Text style={styles.tdLeft}>{employee.full_name || '--'}</Text>
                                            {!!employee.gender && (
                                                <Text style={[styles.tdLeft, { fontSize: 6, color: '#666' }]}>{employee.gender}</Text>
                                            )}
                                        </View>

                                        <View style={[styles.tableCol, styles.col2]}>
                                            <Text style={styles.tdCenter}>{employee.employee_code || '--'}</Text>
                                        </View>

                                        <View style={[styles.tableCol, styles.col3]}>
                                            <Text style={styles.tdCenter}>{employee.department_name || '--'}</Text>
                                        </View>

                                        <View style={[styles.tableCol, styles.col4]}>
                                            <Text style={styles.tdCenter}>{employee.designation_name || '--'}</Text>
                                        </View>

                                        <View style={[styles.tableCol, styles.col5]}>
                                            <Text style={styles.tdCenter}>{employee.branch_name || '--'}</Text>
                                        </View>

                                        <View style={[styles.tableCol, styles.col6]}>
                                            {employee.email ? <Text style={styles.contactInfo}>{employee.email}</Text> : null}
                                            {employee.mobile_number ? <Text style={styles.contactInfo}>{employee.mobile_number}</Text> : null}
                                            {!employee.email && !employee.mobile_number ? (
                                                <Text style={styles.contactInfo}>N/A</Text>
                                            ) : null}
                                        </View>

                                        <View style={[styles.tableCol, styles.col7]}>
                                            <Text style={styles.tdCenter}>{formatDateCell(employee.date_of_joining)}</Text>
                                        </View>

                                        <View style={[styles.tableCol, styles.col8]}>
                                            <Text style={[styles.tdCenter, isInactive && styles.inactiveStatus]}>
                                                {employee.status === '1' || employee.status === 1
                                                    ? 'Active'
                                                    : employee.status === '2' || employee.status === 2
                                                        ? 'Inactive'
                                                        : '--'}
                                            </Text>
                                        </View>

                                        <View style={[styles.tableCol, styles.col9]}>
                                            <Text style={styles.tdCenter}>
                                                {isInactive && employee.last_working_date && employee.last_working_date !== '0000-00-00'
                                                    ? formatDateCell(employee.last_working_date)
                                                    : '--'}
                                            </Text>
                                        </View>

                                        <View style={[styles.tableCol, styles.col10]}>
                                            <Text style={styles.exitInfo}>
                                                {isInactive && employee.deactivate_reason
                                                    ? employee.deactivate_reason
                                                    : '--'}
                                            </Text>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    </View>

                    {/* Footer (fixed) */}
                    <Text
                        style={styles.footer}
                        render={({ pageNumber, totalPages }) =>
                            `Page ${pageNumber} of ${totalPages} | Total Employees: ${data.length} | Generated on ${currentDateGB()}`
                        }
                        fixed
                    />
                </Page>
            ))}
        </Document>
    );
};

export default EmployeeDirectoryPDF;

// -------- Export helper (browser download) --------
export const exportEmployeeDirectoryToPDF = async (data, filters = {}, companyName = 'Your Company') => {
    if (!data || data.length === 0) throw new Error('No data available for export');

    const doc = <EmployeeDirectoryPDF data={data} filters={filters} companyName={companyName} />;
    const blob = await pdf(doc).toBlob();

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const ts = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    a.download = `Employee_Directory_Report_${ts}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
};