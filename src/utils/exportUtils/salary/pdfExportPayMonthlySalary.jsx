// utils/exportUtils/salary/pdfExportPayMonthlySalary.js
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
const payModeName = (m) => ({ '1': 'Cash', '2': 'Bank Transfer', '3': 'Cheque' }[String(m)] || `Mode ${m}`);

const MAIN_COLS = [
    { label: '#', width: '3%', get: (e, i) => String(i + 1) },
    { label: 'Employee', width: '14%', get: (e) => e.employee_name || '--', left: true },
    { label: 'Code', width: '6%', get: (e) => e.employee_code || '--' },
    { label: 'Monthly Salary', width: '9%', get: (e) => fmt(e.monthly_salary), bold: true },
    { label: 'Att. Salary', width: '8%', get: (e) => fmt(e.total_salary) },
    { label: '+Allowance', width: '8%', get: (e) => parseFloat(e.total_allowance_amount || 0) > 0 ? `+${fmt(e.total_allowance_amount)}` : '--' },
    { label: '-Deduction', width: '8%', get: (e) => parseFloat(e.total_deduction_amount || 0) > 0 ? `-${fmt(e.total_deduction_amount)}` : '--' },
    { label: '-Loan', width: '8%', get: (e) => parseFloat(e.total_loan_amount || 0) > 0 ? `-${fmt(e.total_loan_amount)}` : '--' },
    { label: '-Advance', width: '7%', get: (e) => parseFloat(e.total_advance_amount || 0) > 0 ? `-${fmt(e.total_advance_amount)}` : '--' },
    { label: 'Net Payable', width: '9%', get: (e) => fmt(e.net_payable), bold: true },
    { label: 'Total Paid', width: '9%', get: (e) => parseFloat(e.total_paid || 0) > 0 ? fmt(e.total_paid) : '--', bold: true },
    { label: 'Pay Status', width: '11%', get: (e) => e.payment_status_label || 'Unpaid' },
];

const PaySalaryPDFDoc = ({ data, filters, companyName = 'Your Company Name' }) => {
    const ml = monthLabel(filters?.month_year);
    const chunkSize = 20;
    const chunks = [];
    for (let i = 0; i < data.length; i += chunkSize) chunks.push(data.slice(i, i + chunkSize));
    if (!chunks.length) chunks.push([]);

    const grandTotals = {
        monthly: data.reduce((s, e) => s + parseFloat(e.monthly_salary || 0), 0),
        attSalary: data.reduce((s, e) => s + parseFloat(e.total_salary || 0), 0),
        allowance: data.reduce((s, e) => s + parseFloat(e.total_allowance_amount || 0), 0),
        deduction: data.reduce((s, e) => s + parseFloat(e.total_deduction_amount || 0), 0),
        loan: data.reduce((s, e) => s + parseFloat(e.total_loan_amount || 0), 0),
        advance: data.reduce((s, e) => s + parseFloat(e.total_advance_amount || 0), 0),
        netPayable: data.reduce((s, e) => s + parseFloat(e.net_payable || 0), 0),
        totalPaid: data.reduce((s, e) => s + parseFloat(e.total_paid || 0), 0),
    };

    return (
        <Document>
            {chunks.map((chunk, pi) => (
                <Page key={pi} size="A4" orientation="landscape" style={styles.page}>
                    <PDFHeaderBanner
                        title="PAID SALARY REPORT"
                        companyName={companyName}
                        dateRangeText={ml ? `Period: ${ml}` : `Net Payable: ${fmt(grandTotals.netPayable)}`}
                    />

                    <View style={styles.content}>
                        <View style={styles.table}>
                            <View style={[styles.tableRow, styles.tableHeaderRow]}>
                                {MAIN_COLS.map((c, cIdx) => (
                                    <View key={c.label} style={[styles.tableCol, { width: c.width }, cIdx === MAIN_COLS.length - 1 && { borderRightWidth: 0 }]}>
                                        <Text style={styles.th}>{c.label}</Text>
                                    </View>
                                ))}
                            </View>

                            {chunk.map((emp, idx) => (
                                <View key={idx} style={[styles.tableRow, idx % 2 === 1 && styles.zebra]}>
                                    {MAIN_COLS.map((col, cIdx) => (
                                        <View key={col.label} style={[styles.tableCol, { width: col.width }, cIdx === MAIN_COLS.length - 1 && { borderRightWidth: 0 }]}>
                                            <Text style={col.bold ? styles.empNameText : col.left ? styles.tdLeft : styles.tdCenter}>
                                                {col.get(emp, pi * chunkSize + idx)}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            ))}

                            {pi === chunks.length - 1 && (
                                <View style={[styles.tableRow, { backgroundColor: '#f3e8ff' }]}>
                                    {MAIN_COLS.map((col, ci) => {
                                        let val = '';
                                        if (ci === 0) val = 'TOTAL';
                                        else if (col.label === 'Monthly Salary') val = fmt(grandTotals.monthly);
                                        else if (col.label === 'Att. Salary') val = fmt(grandTotals.attSalary);
                                        else if (col.label === '+Allowance') val = grandTotals.allowance > 0 ? `+${fmt(grandTotals.allowance)}` : '--';
                                        else if (col.label === '-Deduction') val = grandTotals.deduction > 0 ? `-${fmt(grandTotals.deduction)}` : '--';
                                        else if (col.label === '-Loan') val = grandTotals.loan > 0 ? `-${fmt(grandTotals.loan)}` : '--';
                                        else if (col.label === '-Advance') val = grandTotals.advance > 0 ? `-${fmt(grandTotals.advance)}` : '--';
                                        else if (col.label === 'Net Payable') val = fmt(grandTotals.netPayable);
                                        else if (col.label === 'Total Paid') val = grandTotals.totalPaid > 0 ? fmt(grandTotals.totalPaid) : '--';
                                        return (
                                            <View key={col.label} style={[styles.tableCol, { width: col.width }, ci === MAIN_COLS.length - 1 && { borderRightWidth: 0 }]}>
                                                <Text style={[styles.empNameText, styles.tdCenter]}>{val}</Text>
                                            </View>
                                        );
                                    })}
                                </View>
                            )}
                        </View>
                    </View>

                    <PDFFooter totalCount={data.length} itemLabel="Records" />
                </Page>
            ))}
        </Document>
    );
};

export const exportPaySalaryToPDF = async (data, filters, companyName = 'Your Company Name') => {
    if (!data || !data.length) throw new Error('No data to export');
    const doc = <PaySalaryPDFDoc data={data} filters={filters} companyName={companyName} />;
    const fn = `Paid_Salary_Report_${(filters?.month_year || 'report').replace('-', '_')}.pdf`;
    await downloadPdfDocument(doc, fn);
    return { success: true };
};