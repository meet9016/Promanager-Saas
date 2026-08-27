// utils/exportUtils/salary/pdfExportSalaryGenerationStatus.js
import React from 'react';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import {
    commonPdfStyles as styles,
    PDFHeaderBanner,
    PDFFooter,
    downloadPdfDocument
} from '../commonPdfExport';

const fmt = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v || 0);
const monthLabel = (my) => my ? new Date(my + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '';

const normalizeGen = (raw) => {
    const s = String(raw || '').toLowerCase();
    if (s === 'generated') return 'Generated';
    return 'Pending';
};

const COLS = [
    { label: '#', width: '4%', get: (e, i) => String(i + 1) },
    { label: 'Employee Name', width: '18%', get: (e) => e.employee_name || '--', left: true },
    { label: 'Code', width: '8%', get: (e) => e.employee_code || '--' },
    { label: 'Monthly Salary', width: '10%', get: (e) => fmt(e.monthly_salary), bold: true },
    { label: 'Final Salary', width: '10%', get: (e) => normalizeGen(e.salary_generation_status) === 'Generated' ? fmt(e.final_salary) : '--' },
    { label: 'Net Payable', width: '10%', get: (e) => normalizeGen(e.salary_generation_status) === 'Generated' ? fmt(e.net_payable) : '--', bold: true },
    { label: 'Total Paid', width: '10%', get: (e) => parseFloat(e.total_paid || 0) > 0 ? fmt(e.total_paid) : '--', bold: true },
    { label: 'Balance Due', width: '10%', get: (e) => normalizeGen(e.salary_generation_status) === 'Generated' ? fmt(e.balance_due) : '--' },
    { label: 'Gen. Status', width: '10%', get: (e) => normalizeGen(e.salary_generation_status) },
    { label: 'Pay Status', width: '10%', get: (e) => e.payment_status_label || 'Not Generated' },
];

const StatusPDFDoc = ({ data, filters, companyName = 'Your Company Name' }) => {
    const ml = monthLabel(filters?.month_year);
    const chunkSize = 25;
    const chunks = [];
    for (let i = 0; i < data.length; i += chunkSize) chunks.push(data.slice(i, i + chunkSize));
    if (!chunks.length) chunks.push([]);

    return (
        <Document>
            {chunks.map((chunk, pi) => (
                <Page key={pi} size="A4" orientation="landscape" style={styles.page}>
                    <PDFHeaderBanner
                        title="SALARY GENERATION STATUS REPORT"
                        companyName={companyName}
                        dateRangeText={ml ? `Period: ${ml}` : undefined}
                    />

                    <View style={styles.content}>
                        <View style={styles.table}>
                            <View style={[styles.tableRow, styles.tableHeaderRow]}>
                                {COLS.map((c, cIdx) => (
                                    <View key={c.label} style={[styles.tableCol, { width: c.width }, cIdx === COLS.length - 1 && { borderRightWidth: 0 }]}>
                                        <Text style={styles.th}>{c.label}</Text>
                                    </View>
                                ))}
                            </View>

                            {chunk.map((emp, idx) => (
                                <View key={idx} style={[styles.tableRow, idx % 2 === 1 && styles.zebra]}>
                                    {COLS.map((col, cIdx) => {
                                        const val = col.get(emp, pi * chunkSize + idx);
                                        const isGen = col.label === 'Gen. Status' && val === 'Generated';
                                        return (
                                            <View key={col.label} style={[styles.tableCol, { width: col.width }, cIdx === COLS.length - 1 && { borderRightWidth: 0 }]}>
                                                <Text style={col.bold ? styles.empNameText : col.left ? styles.tdLeft : isGen ? styles.activeStatus : styles.tdCenter}>
                                                    {val}
                                                </Text>
                                            </View>
                                        );
                                    })}
                                </View>
                            ))}
                        </View>
                    </View>

                    <PDFFooter totalCount={data.length} itemLabel="Records" />
                </Page>
            ))}
        </Document>
    );
};

export const exportSalaryStatusToPDF = async (data, filters, companyName = 'Your Company Name') => {
    if (!data || !data.length) throw new Error('No data to export');
    const doc = <StatusPDFDoc data={data} filters={filters} companyName={companyName} />;
    const fn = `Salary_Generation_Status_${(filters?.month_year || 'report').replace('-', '_')}.pdf`;
    await downloadPdfDocument(doc, fn);
    return { success: true };
};