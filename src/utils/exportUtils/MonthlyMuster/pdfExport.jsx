// utils/exportUtils/MonthlyMuster/pdfExport.js
import React from 'react';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import {
    commonPdfStyles as styles,
    PDFHeaderBanner,
    PDFFiltersSection,
    PDFFooter,
    downloadPdfDocument
} from '../commonPdfExport';

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

const showCode = (code) => {
    if (!code) return '';
    const s = String(code);
    return s.length > 2 ? s.slice(0, 2) : s;
};

const TOTALS_ORDER = ['P', 'A', 'L', 'H', 'HP', 'WO', 'WOP', '½P'];
const TOTALS_LABELS = {
    P: 'P', A: 'A', L: 'L', H: 'H', HP: 'HP', WO: 'WO', WOP: 'WOP', '½P': '½P',
};

const HeaderRow = ({ daysCount }) => (
    <View style={[styles.tableRow, styles.tableHeaderRow]} wrap={false}>
        <Text style={[styles.th, { width: 55, textAlign: 'left' }]}>Emp. Code</Text>
        <Text style={[styles.th, { width: 130, textAlign: 'left' }]}>Employee Name</Text>
        {Array.from({ length: daysCount }, (_, i) => (
            <Text key={`d-${i + 1}`} style={[styles.th, { width: 16 }]}>{i + 1}</Text>
        ))}
        {TOTALS_ORDER.map((k) => (
            <Text key={`t-${k}`} style={[styles.th, { width: 24 }]}>{TOTALS_LABELS[k]}</Text>
        ))}
    </View>
);

const BodyRow = ({ emp, daysCount, index }) => (
    <View style={[styles.tableRow, index % 2 === 1 && styles.zebra]} wrap={false}>
        <Text style={[styles.tdLeft, { width: 55, paddingHorizontal: 2 }]}>{emp.employee_code || ''}</Text>
        <Text style={[styles.empNameText, { width: 130, paddingHorizontal: 2 }]}>{emp.employee_name || ''}</Text>

        {Array.from({ length: daysCount }, (_, i) => (
            <Text key={`dc-${i}`} style={[styles.tdCenter, { width: 16 }]}>
                {showCode(emp.dayCodes?.[i] || '')}
            </Text>
        ))}

        {TOTALS_ORDER.map((k) => {
            const v = emp.totals?.[k] || 0;
            const val = Number.isInteger(v) ? v : Number(v).toFixed(1);
            return (
                <Text key={`tv-${k}`} style={[styles.tdCenter, { width: 24 }]}>
                    {val}
                </Text>
            );
        })}
    </View>
);

const MusterPDFDoc = ({
    monthYear,
    companyName,
    rows,
    dayCount,
    filterLabels,
}) => {
    const dateRangeText = buildDateRangeText(monthYear);

    const parts = [];
    if (filterLabels?.branch) parts.push(`Branch: ${filterLabels.branch}`);
    if (filterLabels?.department) parts.push(`Department: ${filterLabels.department}`);
    if (filterLabels?.designation) parts.push(`Designation: ${filterLabels.designation}`);
    if (filterLabels?.employee) parts.push(`Employee: ${filterLabels.employee}`);

    return (
        <Document>
            <Page size="A4" orientation="landscape" style={styles.page}>
                <PDFHeaderBanner
                    title="MONTHLY ATTENDANCE MUSTER"
                    companyName={companyName}
                    dateRangeText={dateRangeText}
                />

                <View style={styles.content}>
                    {parts.length > 0 && <PDFFiltersSection appliedFilters={parts} />}

                    <View style={styles.table}>
                        <HeaderRow daysCount={dayCount} />
                        {rows.map((emp, idx) => (
                            <BodyRow key={`${emp.employee_code}-${idx}`} index={idx} emp={emp} daysCount={dayCount} />
                        ))}
                    </View>
                </View>

                <PDFFooter totalCount={rows.length} itemLabel="Employees" />
            </Page>
        </Document>
    );
};

export const exportMusterToPDF = async ({
    rows,
    monthYear,
    monthLabel,
    companyName,
    dayMeta,
    filterLabels,
    fileName,
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
            rows={rows}
            dayCount={dayCount}
            filterLabels={filterLabels}
        />
    );

    const fn = (fileName || `monthly_attendance_muster_${monthYear || ''}`) + '.pdf';
    await downloadPdfDocument(doc, fn);
};
