// utils/exportUtils/salary/pdfExportPayMonthlySalary.js
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: { flexDirection: 'column', backgroundColor: '#FFFFFF', padding: 20, fontSize: 8 },
    header: { marginBottom: 10, borderBottomWidth: 2, borderBottomColor: '#000', paddingBottom: 8 },
    title: { fontSize: 14, fontWeight: 'bold', color: '#000', textAlign: 'center', marginBottom: 4 },
    subTitle: { fontSize: 9, color: '#333', textAlign: 'center', marginBottom: 2 },
    metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
    metaText: { fontSize: 7, color: '#333' },
    summaryBox: { flexDirection: 'row', gap: 6, marginBottom: 10, flexWrap: 'wrap' },
    summaryCard: { flex: 1, borderWidth: 1, borderColor: '#000', padding: 5, borderRadius: 2, minWidth: 60 },
    summaryLabel: { fontSize: 6, color: '#555', marginBottom: 2 },
    summaryValue: { fontSize: 10, fontWeight: 'bold', color: '#000' },
    // Main table
    table: { width: '100%', borderWidth: 1, borderColor: '#000' },
    tableHeaderRow: { flexDirection: 'row', backgroundColor: '#000', borderBottomWidth: 2, borderBottomColor: '#000' },
    tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#ccc' },
    totalRow: { flexDirection: 'row', backgroundColor: '#e0e0e0', borderTopWidth: 2, borderTopColor: '#000' },
    cell: { borderRightWidth: 1, borderRightColor: '#bbb', padding: 3, justifyContent: 'center', alignItems: 'center' },
    headerCell: { borderRightWidth: 1, borderRightColor: '#555', padding: 3, justifyContent: 'center', alignItems: 'center' },
    cellText: { fontSize: 6.5, textAlign: 'center', color: '#222' },
    cellLeft: { fontSize: 6.5, textAlign: 'left', color: '#222' },
    boldCell: { fontSize: 6.5, textAlign: 'center', color: '#000', fontWeight: 'bold' },
    headerText: { fontSize: 6.5, textAlign: 'center', color: '#fff', fontWeight: 'bold' },
    totalText: { fontSize: 6.5, textAlign: 'center', color: '#000', fontWeight: 'bold' },
    // Breakdown section (per employee, shown after main row if has items)
    breakdownSection: { marginTop: 4, marginBottom: 6, borderWidth: 1, borderColor: '#ccc', padding: 6 },
    breakdownTitle: { fontSize: 7, fontWeight: 'bold', color: '#000', marginBottom: 4, borderBottomWidth: 1, borderBottomColor: '#ccc', paddingBottom: 2 },
    breakdownGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
    breakdownBlock: { width: '30%', borderWidth: 1, borderColor: '#ccc', padding: 4, marginBottom: 4 },
    breakdownBlockTitle: { fontSize: 6.5, fontWeight: 'bold', color: '#000', marginBottom: 3, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 2 },
    breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
    breakdownLabel: { fontSize: 6, color: '#444', flex: 1 },
    breakdownValue: { fontSize: 6, color: '#000', fontWeight: 'bold' },
    calcStrip: { marginTop: 4, flexDirection: 'row', flexWrap: 'wrap', gap: 4, borderTopWidth: 1, borderTopColor: '#ccc', paddingTop: 4 },
    calcItem: { fontSize: 6, color: '#333' },
    calcTotal: { fontSize: 7, fontWeight: 'bold', color: '#000', marginLeft: 'auto' },
    // Footer
    pageNumber: { position: 'absolute', fontSize: 7, bottom: 15, left: 0, right: 0, textAlign: 'center', color: '#888' },
    footer: { position: 'absolute', fontSize: 7, bottom: 28, left: 0, right: 0, textAlign: 'center', color: '#888' },
});

const fmt = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v || 0);
const monthLabel = (my) => my ? new Date(my + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '';

// Payment mode label
const payModeName = (m) => ({ '1': 'Cash', '2': 'Bank Transfer', '3': 'Cheque' }[String(m)] || `Mode ${m}`);

// Main table columns (compact for landscape A4)
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

const PaySalaryPDFDoc = ({ data, filters, apiSummary }) => {
    const ml = monthLabel(filters?.month_year);
    const chunkSize = 20;
    const chunks = [];
    for (let i = 0; i < data.length; i += chunkSize) chunks.push(data.slice(i, i + chunkSize));
    if (!chunks.length) chunks.push([]);

    // Grand totals
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

    const summaryCards = apiSummary ? [
        { label: 'Employees', value: apiSummary.total_employees },
        { label: 'Grand Salary', value: fmt(apiSummary.grand_total_salary) },
        { label: 'Allowances', value: fmt(apiSummary.grand_total_allowance) },
        { label: 'Deductions', value: fmt(apiSummary.grand_total_deduction) },
        { label: 'Loans', value: fmt(apiSummary.grand_total_loan) },
        { label: 'Advances', value: fmt(apiSummary.grand_total_advance) },
        { label: 'Net Payable', value: fmt(apiSummary.grand_net_payable) },
        { label: 'Total Paid', value: fmt(apiSummary.grand_total_paid) },
    ] : [];

    return (
        <Document>
            {chunks.map((chunk, pi) => (
                <Page key={pi} size="A4" orientation="landscape" style={styles.page}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Paid Salary Report</Text>
                        {ml ? <Text style={styles.subTitle}>{ml}</Text> : null}
                        <View style={styles.metaRow}>
                            <Text style={styles.metaText}>Generated: {new Date().toLocaleString()}</Text>
                            <Text style={styles.metaText}>Total Employees: {data.length}</Text>
                            <Text style={styles.metaText}>Grand Net Payable: {fmt(grandTotals.netPayable)}</Text>
                        </View>
                    </View>

                    {pi === 0 && summaryCards.length > 0 && (
                        <View style={styles.summaryBox}>
                            {summaryCards.map((c, i) => (
                                <View key={i} style={styles.summaryCard}>
                                    <Text style={styles.summaryLabel}>{c.label}</Text>
                                    <Text style={styles.summaryValue}>{c.value}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Main table */}
                    <View style={styles.table}>
                        <View style={styles.tableHeaderRow}>
                            {MAIN_COLS.map(c => (
                                <View key={c.label} style={[styles.headerCell, { width: c.width }]}>
                                    <Text style={styles.headerText}>{c.label}</Text>
                                </View>
                            ))}
                        </View>

                        {chunk.map((emp, idx) => (
                            <View key={idx} style={[styles.tableRow, { backgroundColor: idx % 2 === 0 ? '#fff' : '#f5f5f5' }]}>
                                {MAIN_COLS.map(col => (
                                    <View key={col.label} style={[styles.cell, { width: col.width }]}>
                                        <Text style={col.bold ? styles.boldCell : col.left ? styles.cellLeft : styles.cellText}>
                                            {col.get(emp, pi * chunkSize + idx)}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        ))}

                        {/* Totals row on last page */}
                        {pi === chunks.length - 1 && (
                            <View style={styles.totalRow}>
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
                                        <View key={col.label} style={[styles.cell, { width: col.width }]}>
                                            <Text style={styles.totalText}>{val}</Text>
                                        </View>
                                    );
                                })}
                            </View>
                        )}
                    </View>

                    {/* Per-employee breakdown section */}
                    {chunk.map((emp, idx) => {
                        const allowances = emp.allowance_arr || [];
                        const deductions = emp.deduction_arr || [];
                        const loans = emp.loan_arr || [];
                        const advances = emp.advance_arr || [];
                        const holidays = emp.holiday_arr || [];
                        const payments = emp.payment_arr || [];
                        const hasBreakdown = allowances.length || deductions.length || loans.length || advances.length || holidays.length || payments.length;
                        if (!hasBreakdown) return null;
                        return (
                            <View key={`bd-${idx}`} style={styles.breakdownSection} wrap={false}>
                                <Text style={styles.breakdownTitle}>
                                    {emp.employee_name} ({emp.employee_code}) — Salary Breakdown
                                </Text>
                                <View style={styles.breakdownGrid}>
                                    {allowances.length > 0 && (
                                        <View style={styles.breakdownBlock}>
                                            <Text style={styles.breakdownBlockTitle}>+ Allowances ({fmt(emp.total_allowance_amount)})</Text>
                                            {allowances.map((a, i) => (
                                                <View key={i} style={styles.breakdownRow}>
                                                    <Text style={styles.breakdownLabel}>{a.allowance_name}</Text>
                                                    <Text style={styles.breakdownValue}>{fmt(a.allowance_amount)}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    )}
                                    {deductions.length > 0 && (
                                        <View style={styles.breakdownBlock}>
                                            <Text style={styles.breakdownBlockTitle}>- Deductions ({fmt(emp.total_deduction_amount)})</Text>
                                            {deductions.map((d, i) => (
                                                <View key={i} style={styles.breakdownRow}>
                                                    <Text style={styles.breakdownLabel}>{d.deduction_name}</Text>
                                                    <Text style={styles.breakdownValue}>-{fmt(d.deduction_amount)}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    )}
                                    {holidays.length > 0 && (
                                        <View style={styles.breakdownBlock}>
                                            <Text style={styles.breakdownBlockTitle}>+ Holidays ({fmt(emp.total_holiday_amount)})</Text>
                                            {holidays.map((h, i) => (
                                                <View key={i} style={styles.breakdownRow}>
                                                    <Text style={styles.breakdownLabel}>{h.holiday_name || 'Holiday'}</Text>
                                                    <Text style={styles.breakdownValue}>{fmt(h.holiday_amount)}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    )}
                                    {loans.length > 0 && (
                                        <View style={styles.breakdownBlock}>
                                            <Text style={styles.breakdownBlockTitle}>- Loan Deductions ({fmt(emp.total_loan_amount)})</Text>
                                            {loans.map((l, i) => (
                                                <View key={i} style={styles.breakdownRow}>
                                                    <Text style={styles.breakdownLabel}>Loan #{l.loan_id} {l.loan_priority_name ? `(${l.loan_priority_name})` : ''}</Text>
                                                    <Text style={styles.breakdownValue}>-{fmt(l.installment_amount)}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    )}
                                    {advances.length > 0 && (
                                        <View style={styles.breakdownBlock}>
                                            <Text style={styles.breakdownBlockTitle}>- Advance ({fmt(emp.total_advance_amount)})</Text>
                                            {advances.map((a, i) => (
                                                <View key={i} style={styles.breakdownRow}>
                                                    <Text style={styles.breakdownLabel}>{a.advance_name || `Advance #${a.advance_id}`}</Text>
                                                    <Text style={styles.breakdownValue}>-{fmt(a.advance_amount || a.installment_amount)}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    )}
                                    {payments.length > 0 && (
                                        <View style={styles.breakdownBlock}>
                                            <Text style={styles.breakdownBlockTitle}>Payments Made ({fmt(emp.total_paid)})</Text>
                                            {payments.map((p, i) => (
                                                <View key={i} style={styles.breakdownRow}>
                                                    <Text style={styles.breakdownLabel}>{payModeName(p.payment_mode)} {p.payment_date ? `– ${new Date(p.payment_date).toLocaleDateString('en-IN')}` : ''}</Text>
                                                    <Text style={styles.breakdownValue}>{fmt(p.pay_salary)}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    )}
                                </View>
                                {/* Calculation strip */}
                                <View style={styles.calcStrip}>
                                    <Text style={styles.calcItem}>Att.Salary: {fmt(emp.total_salary)}</Text>
                                    {parseFloat(emp.total_allowance_amount) > 0 && <Text style={styles.calcItem}> + Allowance: {fmt(emp.total_allowance_amount)}</Text>}
                                    {parseFloat(emp.total_deduction_amount) > 0 && <Text style={styles.calcItem}> - Deduction: {fmt(emp.total_deduction_amount)}</Text>}
                                    {parseFloat(emp.total_loan_amount) > 0 && <Text style={styles.calcItem}> - Loan: {fmt(emp.total_loan_amount)}</Text>}
                                    {parseFloat(emp.total_advance_amount) > 0 && <Text style={styles.calcItem}> - Advance: {fmt(emp.total_advance_amount)}</Text>}
                                    {parseFloat(emp.total_holiday_amount) > 0 && <Text style={styles.calcItem}> + Holiday: {fmt(emp.total_holiday_amount)}</Text>}
                                    <Text style={styles.calcTotal}> = Net Payable: {fmt(emp.net_payable)}</Text>
                                </View>
                            </View>
                        );
                    })}

                    <Text style={styles.footer}>Paid Salary Report | {ml}</Text>
                    <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} fixed />
                </Page>
            ))}
        </Document>
    );
};

export const exportPaySalaryToPDF = async (data, filters, apiSummary) => {
    if (!data || !data.length) throw new Error('No data to export');
    const blob = await pdf(<PaySalaryPDFDoc data={data} filters={filters} apiSummary={apiSummary} />).toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Paid_Salary_Report_${(filters?.month_year || 'report').replace('-', '_')}.pdf`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url);
    return { success: true };
};