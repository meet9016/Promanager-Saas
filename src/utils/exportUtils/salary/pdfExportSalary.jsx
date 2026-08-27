import React from 'react';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import {
    commonPdfStyles as styles,
    PDF_COLORS,
    PDFHeaderBanner,
    PDFFiltersSection,
    PDFFooter,
    downloadPdfDocument
} from '../commonPdfExport';

const COLS = [
    { label: 'Sr.#', width: '4%' },
    { label: 'Employee Details', width: '18%' },
    { label: 'Base Salary', width: '10%' },
    { label: 'Work Days', width: '6%' },
    { label: 'Present', width: '6%' },
    { label: 'Absent', width: '6%' },
    { label: 'OT Days', width: '6%' },
    { label: 'OT Pay', width: '8%' },
    { label: 'WO Days', width: '6%' },
    { label: 'WO Pay', width: '8%' },
    { label: 'Subtotal', width: '10%' },
    { label: 'Final Salary', width: '12%' },
];

const formatNumber = (amount) => {
    const num = parseFloat(amount || 0);
    return new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(num);
};

const getMonthYearDisplay = (monthYear) => {
    if (!monthYear) return 'All Months';
    const date = new Date(monthYear + '-01');
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

const MonthlySalaryReportPDF = ({ reportData, filters, companyName = 'Your Company' }) => {
    const monthYearText = getMonthYearDisplay(filters.month_year);
    const filterText = filters.month_year ? [`Period: ${monthYearText}`, `Total Employees: ${reportData.length}`] : [];

    const chunkSize = 25;
    const dataChunks = [];
    for (let i = 0; i < reportData.length; i += chunkSize) {
        dataChunks.push(reportData.slice(i, i + chunkSize));
    }
    if (!dataChunks.length) dataChunks.push([]);

    return (
        <Document>
            {dataChunks.map((chunk, pageIndex) => (
                <Page key={pageIndex} size="A4" orientation="landscape" style={styles.page}>
                    {/* Header */}
                    <PDFHeaderBanner
                        title="MONTHLY SALARY REPORT"
                        companyName={companyName}
                        dateRangeText={`Period: ${monthYearText}`}
                    />

                    <View style={styles.content}>
                        {pageIndex === 0 && filterText.length > 0 && (
                            <PDFFiltersSection appliedFilters={filterText} />
                        )}

                        {/* Table */}
                        <View style={styles.table}>
                            {/* Table Header */}
                            <View style={[styles.tableRow, styles.tableHeaderRow]}>
                                {COLS.map((c, cIdx) => (
                                    <View key={c.label} style={[styles.tableCol, { width: c.width }, cIdx === COLS.length - 1 && { borderRightWidth: 0 }]}>
                                        <Text style={styles.th}>{c.label}</Text>
                                    </View>
                                ))}
                            </View>

                            {/* Table Data */}
                            {chunk.map((employee, index) => {
                                const globalIndex = pageIndex * chunkSize + index + 1;
                                return (
                                    <View key={employee.employee_code || index} style={[styles.tableRow, index % 2 === 1 && styles.zebra]}>
                                        <View style={[styles.tableCol, { width: '4%' }]}>
                                            <Text style={styles.tdCenter}>{globalIndex}</Text>
                                        </View>
                                        <View style={[styles.tableCol, { width: '18%' }]}>
                                            <Text style={styles.empNameText}>{employee.employee_name || '--'}</Text>
                                            <Text style={[styles.tdLeft, { fontSize: 6, color: PDF_COLORS.textMuted }]}>ID: {employee.employee_code || '--'}</Text>
                                        </View>
                                        <View style={[styles.tableCol, { width: '10%' }]}>
                                            <Text style={[styles.tdCenter, { fontWeight: 'bold' }]}>{formatNumber(employee.employee_salary)}</Text>
                                        </View>
                                        <View style={[styles.tableCol, { width: '6%' }]}>
                                            <Text style={styles.tdCenter}>{employee.working_days || 0}</Text>
                                        </View>
                                        <View style={[styles.tableCol, { width: '6%' }]}>
                                            <Text style={[styles.tdCenter, styles.activeStatus]}>{employee.present_days || 0}</Text>
                                        </View>
                                        <View style={[styles.tableCol, { width: '6%' }]}>
                                            <Text style={[styles.tdCenter, employee.absent_days > 0 && styles.inactiveStatus]}>{employee.absent_days || 0}</Text>
                                        </View>
                                        <View style={[styles.tableCol, { width: '6%' }]}>
                                            <Text style={styles.tdCenter}>{employee.overtime_days || 0}</Text>
                                        </View>
                                        <View style={[styles.tableCol, { width: '8%' }]}>
                                            <Text style={styles.tdCenter}>{formatNumber(employee.overtime_salary)}</Text>
                                        </View>
                                        <View style={[styles.tableCol, { width: '6%' }]}>
                                            <Text style={styles.tdCenter}>{employee.week_off_days || 0}</Text>
                                        </View>
                                        <View style={[styles.tableCol, { width: '8%' }]}>
                                            <Text style={styles.tdCenter}>{formatNumber(employee.week_off_salary)}</Text>
                                        </View>
                                        <View style={[styles.tableCol, { width: '10%' }]}>
                                            <Text style={styles.tdCenter}>{formatNumber(employee.subtotal_salary)}</Text>
                                        </View>
                                        <View style={[styles.tableCol, { width: '12%', borderRightWidth: 0 }]}>
                                            <Text style={[styles.tdCenter, { fontWeight: 'bold', color: PDF_COLORS.primaryDark }]}>{formatNumber(employee.total_salary)}</Text>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    </View>

                    {/* Footer */}
                    <PDFFooter totalCount={reportData.length} itemLabel="Records" />
                </Page>
            ))}
        </Document>
    );
};

export const handleSalaryReportPDFExport = async (reportData, filters, showToast, companyName = 'Your Company') => {
    try {
        if (!reportData || reportData.length === 0) {
            showToast('No data available for export', 'error');
            return;
        }

        showToast('Generating PDF...', 'info');

        const doc = <MonthlySalaryReportPDF
            reportData={reportData}
            filters={filters}
            companyName={companyName}
        />;

        const monthYear = filters.month_year || 'all-months';
        const timestamp = new Date().toISOString().split('T')[0];
        await downloadPdfDocument(doc, `monthly-salary-report-${monthYear}-${timestamp}.pdf`);

        showToast('PDF downloaded successfully', 'success');
    } catch (error) {
        console.error('PDF Export Error:', error);
        showToast('Failed to generate PDF', 'error');
    }
};