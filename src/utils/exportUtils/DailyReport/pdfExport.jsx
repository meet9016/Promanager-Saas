// utils/exportUtils/DailyReport/pdfExport.js
import React from 'react';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import {
    commonPdfStyles as styles,
    formatAsHeaderDate,
    paginate,
    PDFHeaderBanner,
    PDFFiltersSection,
    PDFFooter,
    downloadPdfDocument
} from '../commonPdfExport';

// PDF Document Component
const AttendancePDFDocument = ({ data, selectedDate, companyName = 'Your Company Name', appliedFilters = {}, filterLabels = {} }) => {
    const formatDate = (date) => formatAsHeaderDate(date);
    const formatTime = (time) => (!time || time === '--' ? '--' : time);

    const hasAppliedFilters = appliedFilters && Object.values(appliedFilters).some(v => v !== '' && v !== null && v !== undefined);

    const getActiveFiltersList = () => {
        if (!hasAppliedFilters) return [];
        const active = [];
        if (appliedFilters.attendance_status_id && filterLabels.attendance_status) active.push(`Status: ${filterLabels.attendance_status}`);
        if (appliedFilters.branch_id && filterLabels.branch) active.push(`Branch: ${filterLabels.branch}`);
        if (appliedFilters.department_id && filterLabels.department) active.push(`Department: ${filterLabels.department}`);
        if (appliedFilters.designation_id && filterLabels.designation) active.push(`Designation: ${filterLabels.designation}`);
        if (appliedFilters.shift_id && filterLabels.shift) active.push(`Shift: ${filterLabels.shift}`);
        return active;
    };

    const activeFiltersList = getActiveFiltersList();
    const pages = paginate(data || [], activeFiltersList.length > 0);

    return (
        <Document>
            {pages.map((chunk, pageIndex) => (
                <Page key={pageIndex} size="A4" orientation="landscape" style={styles.page}>
                    {/* Header */}
                    <PDFHeaderBanner
                        title="DAILY ATTENDANCE REPORT"
                        companyName={companyName}
                        dateRangeText={`Date: ${formatDate(selectedDate)}`}
                    />

                    <View style={styles.content}>
                        {pageIndex === 0 && activeFiltersList.length > 0 && (
                            <PDFFiltersSection appliedFilters={activeFiltersList} />
                        )}

                        {/* Table */}
                        <View style={styles.table}>
                            <View style={[styles.tableRow, styles.tableHeaderRow]}>
                                <View style={[styles.tableCol, { width: '4%' }]}><Text style={styles.th}>S.No</Text></View>
                                <View style={[styles.tableCol, { width: '18%' }]}><Text style={styles.th}>Employee Name</Text></View>
                                <View style={[styles.tableCol, { width: '10%' }]}><Text style={styles.th}>Code</Text></View>
                                <View style={[styles.tableCol, { width: '12%' }]}><Text style={styles.th}>Shift</Text></View>
                                <View style={[styles.tableCol, { width: '8%' }]}><Text style={styles.th}>Clock In</Text></View>
                                <View style={[styles.tableCol, { width: '8%' }]}><Text style={styles.th}>Clock Out</Text></View>
                                <View style={[styles.tableCol, { width: '7%' }]}><Text style={styles.th}>Work Hrs</Text></View>
                                <View style={[styles.tableCol, { width: '7%' }]}><Text style={styles.th}>Att Hrs</Text></View>
                                <View style={[styles.tableCol, { width: '7%' }]}><Text style={styles.th}>Rem Hrs</Text></View>
                                <View style={[styles.tableCol, { width: '7%' }]}><Text style={styles.th}>OT Hrs</Text></View>
                                <View style={[styles.tableCol, { width: '12%', borderRightWidth: 0 }]}><Text style={styles.th}>Status</Text></View>
                            </View>

                            {/* Table Rows */}
                            {chunk.map((employee, index) => {
                                const isAbsent = (employee.status || '').toLowerCase().includes('absent');
                                return (
                                    <View style={[styles.tableRow, index % 2 === 1 && styles.zebra]} key={index}>
                                        <View style={[styles.tableCol, { width: '4%' }]}><Text style={styles.tdCenter}>{(pageIndex * 30) + index + 1}</Text></View>
                                        <View style={[styles.tableCol, { width: '18%' }]}><Text style={styles.empNameText}>{employee.employee_name || '--'}</Text></View>
                                        <View style={[styles.tableCol, { width: '10%' }]}><Text style={styles.tdCenter}>{employee.employee_code || '--'}</Text></View>
                                        <View style={[styles.tableCol, { width: '12%' }]}><Text style={styles.tdCenter}>{employee.shift_name || '--'}</Text></View>
                                        <View style={[styles.tableCol, { width: '8%' }]}><Text style={styles.tdCenter}>{formatTime(employee.attandance_first_clock_in)}</Text></View>
                                        <View style={[styles.tableCol, { width: '8%' }]}><Text style={styles.tdCenter}>{formatTime(employee.attandance_last_clock_out)}</Text></View>
                                        <View style={[styles.tableCol, { width: '7%' }]}><Text style={styles.tdCenter}>{employee.shift_working_hours || '--'}</Text></View>
                                        <View style={[styles.tableCol, { width: '7%' }]}><Text style={styles.tdCenter}>{employee.attandance_hours || '--'}</Text></View>
                                        <View style={[styles.tableCol, { width: '7%' }]}><Text style={styles.tdCenter}>{employee.late_hours && parseFloat(employee.late_hours) > 0 ? `${employee.late_hours}` : '--'}</Text></View>
                                        <View style={[styles.tableCol, { width: '7%' }]}><Text style={styles.tdCenter}>{employee.overtime_hours && parseFloat(employee.overtime_hours) > 0 ? `${employee.overtime_hours}` : '--'}</Text></View>
                                        <View style={[styles.tableCol, { width: '12%', borderRightWidth: 0 }]}>
                                            <Text style={[styles.tdCenter, isAbsent ? styles.inactiveStatus : styles.activeStatus]}>
                                                {employee.status || '--'}
                                            </Text>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    </View>

                    <PDFFooter totalCount={data.length} itemLabel="Records" />
                </Page>
            ))}
        </Document>
    );
};

// Export function
export const exportToPDF = async (data, selectedDate, companyName = 'Your Company Name', filename = 'daily_attendance_report', appliedFilters = {}, filterLabels = {}) => {
    try {
        if (!data || data.length === 0) {
            throw new Error('No data available to export');
        }

        const doc = (
            <AttendancePDFDocument
                data={data}
                selectedDate={selectedDate}
                companyName={companyName}
                appliedFilters={appliedFilters}
                filterLabels={filterLabels}
            />
        );

        const dateStr = selectedDate ? new Date(selectedDate).toISOString().split('T')[0] : 'report';
        await downloadPdfDocument(doc, `${filename}_${dateStr}.pdf`);
        return { success: true, message: 'PDF exported successfully!' };
    } catch (error) {
        console.error('PDF Export Error:', error);
        throw new Error(`Failed to export PDF: ${error.message}`);
    }
};