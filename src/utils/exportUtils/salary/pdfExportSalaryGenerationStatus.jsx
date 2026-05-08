// utils/exportUtils/salary/pdfExportSalaryGenerationStatus.js
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: { flexDirection: 'column', backgroundColor: '#FFFFFF', padding: 20, fontSize: 8 },
    header: { marginBottom: 10, borderBottomWidth: 2, borderBottomColor: '#000', paddingBottom: 8 },
    title: { fontSize: 14, fontWeight: 'bold', color: '#000', textAlign: 'center', marginBottom: 4 },
    subTitle: { fontSize: 9, color: '#333', textAlign: 'center', marginBottom: 2 },
    metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
    metaText: { fontSize: 7, color: '#333' },
    summaryBox: { flexDirection: 'row', gap: 6, marginBottom: 10, flexWrap: 'wrap' },
    summaryCard: { flex: 1, borderWidth: 1, borderColor: '#000', padding: 5, borderRadius: 2, minWidth: 70 },
    summaryLabel: { fontSize: 6, color: '#555', marginBottom: 2 },
    summaryValue: { fontSize: 11, fontWeight: 'bold', color: '#000' },
    table: { width: '100%', borderWidth: 1, borderColor: '#000', fontSize: 7 },
    tableHeaderRow: { flexDirection: 'row', backgroundColor: '#000', borderBottomWidth: 2, borderBottomColor: '#000' },
    tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#ccc' },
    totalRow: { flexDirection: 'row', backgroundColor: '#e0e0e0', borderTopWidth: 2, borderTopColor: '#000' },
    cell: { borderRightWidth: 1, borderRightColor: '#ccc', padding: 4, justifyContent: 'center', alignItems: 'center' },
    headerCell: { borderRightWidth: 1, borderRightColor: '#555', padding: 4, justifyContent: 'center', alignItems: 'center' },
    cellText: { fontSize: 7, textAlign: 'center', color: '#222' },
    cellTextLeft: { fontSize: 7, textAlign: 'left', color: '#222' },
    boldCell: { fontSize: 7, textAlign: 'center', color: '#000', fontWeight: 'bold' },
    headerText: { fontSize: 7, textAlign: 'center', color: '#fff', fontWeight: 'bold' },
    pageNumber: { position: 'absolute', fontSize: 7, bottom: 15, left: 0, right: 0, textAlign: 'center', color: '#888' },
    footer: { position: 'absolute', fontSize: 7, bottom: 28, left: 0, right: 0, textAlign: 'center', color: '#888' },
});

const fmt = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v || 0);
const monthLabel = (my) => my ? new Date(my + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '';

const normalizeGen = (raw) => {
    const s = String(raw || '').toLowerCase();
    if (s === 'generated') return 'Generated';
    return 'Pending';
};

const COLS = [
    { label: '#', width: '4%', get: (e, i) => String(i + 1) },
    { label: 'Employee Name', width: '20%', get: (e) => e.employee_name || '--', left: true },
    { label: 'Code', width: '8%', get: (e) => e.employee_code || '--' },
    { label: 'Monthly Salary', width: '10%', get: (e) => fmt(e.monthly_salary), bold: true },
    { label: 'Final Salary', width: '10%', get: (e) => normalizeGen(e.salary_generation_status) === 'Generated' ? fmt(e.final_salary) : '--' },
    { label: 'Net Payable', width: '10%', get: (e) => normalizeGen(e.salary_generation_status) === 'Generated' ? fmt(e.net_payable) : '--', bold: true },
    { label: 'Total Paid', width: '10%', get: (e) => parseFloat(e.total_paid || 0) > 0 ? fmt(e.total_paid) : '--', bold: true },
    { label: 'Balance Due', width: '10%', get: (e) => normalizeGen(e.salary_generation_status) === 'Generated' ? fmt(e.balance_due) : '--' },
    { label: 'Generated At', width: '10%', get: (e) => e.generated_at ? new Date(e.generated_at).toLocaleDateString('en-IN') : '--' },
    { label: 'Gen. Status', width: '9%', get: (e) => normalizeGen(e.salary_generation_status) },
    { label: 'Pay Status', width: '9%', get: (e) => e.payment_status_label || 'Not Generated' },
];

const StatusPDFDoc = ({ data, filters, apiSummary }) => {
    const ml = monthLabel(filters?.month_year);
    const chunkSize = 25;
    const chunks = [];
    for (let i = 0; i < data.length; i += chunkSize) chunks.push(data.slice(i, i + chunkSize));
    if (!chunks.length) chunks.push([]);

    const summaryCards = apiSummary ? [
        { label: 'Total Employees', value: apiSummary.total_employees },
        { label: 'Generated', value: apiSummary.generated_count },
        { label: 'Pending', value: apiSummary.pending_count },
        { label: 'Paid', value: apiSummary.paid_count },
        { label: 'Generated Total', value: fmt(apiSummary.generated_total_salary) },
        { label: 'Total Paid', value: fmt(apiSummary.paid_total_salary) },
    ] : [];

    return (
        <Document>
            {chunks.map((chunk, pi) => (
                <Page key={pi} size="A4" orientation="landscape" style={styles.page}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Salary Generation Status Report</Text>
                        {ml ? <Text style={styles.subTitle}>{ml}</Text> : null}
                        <View style={styles.metaRow}>
                            <Text style={styles.metaText}>Generated: {new Date().toLocaleString()}</Text>
                            <Text style={styles.metaText}>Total Records: {data.length}</Text>
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

                    <View style={styles.table}>
                        <View style={styles.tableHeaderRow}>
                            {COLS.map(c => (
                                <View key={c.label} style={[styles.headerCell, { width: c.width }]}>
                                    <Text style={styles.headerText}>{c.label}</Text>
                                </View>
                            ))}
                        </View>
                        {chunk.map((emp, idx) => (
                            <View key={idx} style={[styles.tableRow, { backgroundColor: idx % 2 === 0 ? '#fff' : '#f5f5f5' }]}>
                                {COLS.map(col => {
                                    const val = col.get(emp, pi * chunkSize + idx);
                                    return (
                                        <View key={col.label} style={[styles.cell, { width: col.width }]}>
                                            <Text style={col.bold ? styles.boldCell : col.left ? styles.cellTextLeft : styles.cellText}>{val}</Text>
                                        </View>
                                    );
                                })}
                            </View>
                        ))}
                    </View>

                    <Text style={styles.footer}>Salary Generation Status Report | {ml}</Text>
                    <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} fixed />
                </Page>
            ))}
        </Document>
    );
};

export const exportSalaryStatusToPDF = async (data, filters, apiSummary) => {
    if (!data || !data.length) throw new Error('No data to export');
    const blob = await pdf(<StatusPDFDoc data={data} filters={filters} apiSummary={apiSummary} />).toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Salary_Generation_Status_${(filters?.month_year || 'report').replace('-', '_')}.pdf`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url);
    return { success: true };
};