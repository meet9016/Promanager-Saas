// utils/exportUtils/MonthlyMuster/pdfExport.js
import React from 'react';
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';

/** ============ Styles ============ **/
const styles = StyleSheet.create({
    page: {
        backgroundColor: '#FFFFFF',
        paddingTop: 16,
        paddingBottom: 16,
        paddingLeft: 16,
        paddingRight: 16,
        fontSize: 7,
        fontFamily: 'Helvetica',
    },

    headerWrap: { marginBottom: 6 },
    title: { fontSize: 12, fontWeight: 'bold', textAlign: 'center', marginBottom: 4 },
    period: { fontSize: 10, textAlign: 'center', marginBottom: 6 },
    headRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    headText: { fontSize: 8 },
    filtersRow: { marginTop: 2, marginBottom: 4 },
    filtersText: { fontSize: 7 },
    hr: { borderBottomColor: '#000', borderBottomWidth: 1, marginBottom: 6 },

    // Table
    table: { flexDirection: 'column' },
    thead: { flexDirection: 'row' },
    tbodyRow: { flexDirection: 'row' },

    th: {
        borderWidth: 0.5, borderColor: '#000',
        textAlign: 'center', backgroundColor: '#E8E8E8',
        paddingVertical: 3, paddingHorizontal: 2, fontWeight: 'bold',
    },
    td: {
        borderWidth: 0.5, borderColor: '#000',
        textAlign: 'center', paddingVertical: 2, paddingHorizontal: 2,
    },

    // Column widths
    colEmpCode: { width: 60, textAlign: 'left' },
    colEmpName: { width: 140, textAlign: 'left' },
    colDay: { width: 18 },
    colTotal: { width: 28 },

    // Footer
    footerLine: { marginTop: 6, fontSize: 7 },
    footer: {
        position: 'absolute', left: 16, right: 16, bottom: 8, fontSize: 6,
        textAlign: 'center', color: '#333',
    },
});

/** ============ Helpers ============ **/
const pad2 = (n) => (n < 10 ? `0${n}` : String(n));

const buildDateRangeText = (monthYear) => {
    if (!monthYear) return '';
    const [yStr, mStr] = monthYear.split('-');
    const y = parseInt(yStr, 10);
    const m = parseInt(mStr, 10);
    const first = new Date(y, m - 1, 1);
    const last = new Date(y, m, 0);
    const fmt = (d) =>
        `${d.toLocaleString('en-US', { month: 'short' })} ${pad2(d.getDate())} ${d.getFullYear()}`;
    return `${fmt(first)}  To  ${fmt(last)}`;
};

const formatPrintedOn = (dt) => {
    const d = typeof dt === 'string' ? new Date(dt) : dt;
    if (!(d instanceof Date) || isNaN(d)) return String(dt || '');
    const y = d.getFullYear();
    const m = d.toLocaleString('en-US', { month: 'short' });
    const day = pad2(d.getDate());
    const hh = pad2(d.getHours());
    const mm = pad2(d.getMinutes());
    return `${m} ${day} ${y} ${hh}:${mm}`;
};

// Trim day code to 2 chars to keep cells compact
const showCode = (code) => {
    if (!code) return '';
    const s = String(code);
    return s.length > 2 ? s.slice(0, 2) : s;
};

/** ============ Constants ============ **/
const TOTALS_ORDER = ['P', 'A', 'L', 'H', 'HP', 'WO', 'WOP', '½P'];
const TOTALS_LABELS = {
    P: 'P', A: 'A', L: 'L', H: 'H', HP: 'HP', WO: 'WO', WOP: 'WOP', '½P': '½P',
};

/** ============ Table Header ============ **/
const HeaderRow = ({ daysCount }) => (
    <View style={styles.thead} wrap={false}>
        <Text style={[styles.th, styles.colEmpCode]}>Emp. Code</Text>
        <Text style={[styles.th, styles.colEmpName]}>Employee Name</Text>
        {Array.from({ length: daysCount }, (_, i) => (
            <Text key={`d-${i + 1}`} style={[styles.th, styles.colDay]}>{i + 1}</Text>
        ))}
        {TOTALS_ORDER.map((k) => (
            <Text key={`t-${k}`} style={[styles.th, styles.colTotal]}>{TOTALS_LABELS[k]}</Text>
        ))}
    </View>
);

/** ============ Table Row ============ **/
const BodyRow = ({ emp, daysCount }) => (
    <View style={styles.tbodyRow} wrap={false}>
        <Text style={[styles.td, styles.colEmpCode, { textAlign: 'left' }]}>{emp.employee_code || ''}</Text>
        <Text style={[styles.td, styles.colEmpName, { textAlign: 'left' }]}>{emp.employee_name || ''}</Text>

        {Array.from({ length: daysCount }, (_, i) => (
            <Text key={`dc-${i}`} style={[styles.td, styles.colDay]}>
                {showCode(emp.dayCodes?.[i] || '')}
            </Text>
        ))}

        {TOTALS_ORDER.map((k) => {
            const v = emp.totals?.[k] || 0;
            const val = Number.isInteger(v) ? v : Number(v).toFixed(1);
            return (
                <Text key={`tv-${k}`} style={[styles.td, styles.colTotal]}>
                    {val}
                </Text>
            );
        })}
    </View>
);

/** ============ Main Doc ============ **/
const MusterPDFDoc = ({
    monthYear,
    monthLabel,
    companyName,
    printedOn,
    rows,
    dayCount,
    filterLabels,
    departmentName,
}) => {
    const dateRangeText = buildDateRangeText(monthYear);
    const printedOnText = formatPrintedOn(printedOn || new Date());

    const parts = [];
    if (filterLabels?.branch) parts.push(`Branch: ${filterLabels.branch}`);
    if (filterLabels?.department) parts.push(`Department: ${filterLabels.department}`);
    if (filterLabels?.designation) parts.push(`Designation: ${filterLabels.designation}`);
    if (filterLabels?.employee) parts.push(`Employee: ${filterLabels.employee}`);

    return (
        <Document>
            <Page size="A4" orientation="landscape" style={styles.page}>
                {/* Header */}
                <View style={styles.headerWrap}>
                    <Text style={styles.title}>Monthly Attendance Muster (Summary)</Text>
                    <Text style={styles.period}>{dateRangeText}</Text>
                    <View style={styles.headRow}>
                        <Text style={styles.headText}>Company: {companyName || 'Company'}</Text>
                        <Text style={styles.headText}>Printed On : {printedOnText}</Text>
                    </View>
                    {!!parts.length && (
                        <View style={styles.filtersRow}>
                            <Text style={styles.filtersText}>{parts.join('   •   ')}</Text>
                        </View>
                    )}
                </View>
                <View style={styles.hr} />

                {/* Table */}
                <View style={styles.table}>
                    <HeaderRow daysCount={dayCount} />
                    {rows.map((emp, idx) => (
                        <BodyRow key={`${emp.employee_code}-${idx}`} emp={emp} daysCount={dayCount} />
                    ))}
                </View>

                {/* Footer */}
                {!!departmentName && <Text style={styles.footerLine}>Department: {departmentName}</Text>}
                <Text style={styles.footer}>Monthly Attendance Muster • {companyName || 'Company'}</Text>
            </Page>
        </Document>
    );
};

/** ============ Export API ============ **/
/**
 * exportMusterToPDF({
 *   rows: [{ employee_code, employee_name, dayCodes: [...], totals: {P,A,L,H,HP,WO,WOP,'½P'} }...],
 *   monthYear: 'YYYY-MM',
 *   monthLabel: 'August 2025',         // optional, not required
 *   companyName: 'Your Company Name',
 *   dayMeta: [{day,isWeekend}...],     // from UI, used for length
 *   filterLabels: { branch, department, designation, employee },
 *   fileName: 'monthly_attendance_muster_August_2025'
 * })
 */
export const exportMusterToPDF = async ({
    rows,
    monthYear,
    monthLabel,
    companyName,
    dayMeta,
    filterLabels,
    fileName,
    printedOn,
    departmentName,
} = {}) => {
    if (!Array.isArray(rows) || !rows.length) {
        throw new Error('No data available to export');
    }
    const dayCount = Array.isArray(dayMeta) && dayMeta.length ? dayMeta.length : (rows[0]?.dayCodes?.length || 31);

    const doc = (
        <MusterPDFDoc
            monthYear={monthYear}
            monthLabel={monthLabel}
            companyName={companyName}
            printedOn={printedOn}
            rows={rows}
            dayCount={dayCount}
            filterLabels={filterLabels}
            departmentName={departmentName || filterLabels?.department || ''}
        />
    );

    const blob = await pdf(doc).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (fileName || `monthly_attendance_muster_${monthYear || ''}`) + '.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};
