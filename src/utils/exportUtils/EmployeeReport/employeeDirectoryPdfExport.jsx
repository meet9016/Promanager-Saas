import React from 'react';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import {
    commonPdfStyles as styles,
    buildCenteredRange,
    getAppliedFilters,
    paginate,
    formatDateCell,
    PDFHeaderBanner,
    PDFFiltersSection,
    PDFFooter,
    downloadPdfDocument
} from '../commonPdfExport';

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
                    {/* Common Brand Header Banner */}
                    <PDFHeaderBanner
                        title="EMPLOYEE DIRECTORY REPORT"
                        companyName={companyName}
                        dateRangeText={centeredRangeText}
                    />

                    <View style={styles.content}>
                        {/* Filters only on first page */}
                        {pageIndex === 0 && showFilters && (
                            <PDFFiltersSection appliedFilters={appliedFilters} />
                        )}

                        {/* Table */}
                        <View style={styles.table}>
                            {/* Table Header (repeats on every page) */}
                            <View style={[styles.tableRow, styles.tableHeaderRow]}>
                                <View style={[styles.tableCol, { width: '14%' }]}><Text style={styles.th}>Employee Name</Text></View>
                                <View style={[styles.tableCol, { width: '8%' }]}><Text style={styles.th}>Code</Text></View>
                                <View style={[styles.tableCol, { width: '11%' }]}><Text style={styles.th}>Department</Text></View>
                                <View style={[styles.tableCol, { width: '11%' }]}><Text style={styles.th}>Designation</Text></View>
                                <View style={[styles.tableCol, { width: '9%' }]}><Text style={styles.th}>Branch</Text></View>
                                <View style={[styles.tableCol, { width: '14%' }]}><Text style={styles.th}>Contact</Text></View>
                                <View style={[styles.tableCol, { width: '7%' }]}><Text style={styles.th}>Join Date</Text></View>
                                <View style={[styles.tableCol, { width: '7%' }]}><Text style={styles.th}>Status</Text></View>
                                <View style={[styles.tableCol, { width: '7%' }]}><Text style={styles.th}>Exit Date</Text></View>
                                <View style={[styles.tableCol, { width: '12%', borderRightWidth: 0 }]}><Text style={styles.th}>Exit Reason</Text></View>
                            </View>

                            {/* Rows */}
                            {pageRows.map((employee, i) => {
                                const isInactive = employee.status === '2' || employee.status === 2;

                                return (
                                    <View
                                        key={employee.employee_id || `${pageIndex}-${i}`}
                                        style={[styles.tableRow, i % 2 === 1 && styles.zebra]}
                                    >
                                        <View style={[styles.tableCol, { width: '14%' }]}>
                                            <Text style={styles.empNameText}>{employee.full_name || '--'}</Text>
                                            {!!employee.gender && (
                                                <Text style={styles.genderText}>{employee.gender}</Text>
                                            )}
                                        </View>

                                        <View style={[styles.tableCol, { width: '8%' }]}>
                                            <Text style={styles.tdCenter}>{employee.employee_code || '--'}</Text>
                                        </View>

                                        <View style={[styles.tableCol, { width: '11%' }]}>
                                            <Text style={styles.tdCenter}>{employee.department_name || '--'}</Text>
                                        </View>

                                        <View style={[styles.tableCol, { width: '11%' }]}>
                                            <Text style={styles.tdCenter}>{employee.designation_name || '--'}</Text>
                                        </View>

                                        <View style={[styles.tableCol, { width: '9%' }]}>
                                            <Text style={styles.tdCenter}>{employee.branch_name || '--'}</Text>
                                        </View>

                                        <View style={[styles.tableCol, { width: '14%' }]}>
                                            {employee.email ? <Text style={styles.contactInfo}>{employee.email}</Text> : null}
                                            {employee.mobile_number ? <Text style={styles.contactInfo}>{employee.mobile_number}</Text> : null}
                                            {!employee.email && !employee.mobile_number ? (
                                                <Text style={styles.contactInfo}>N/A</Text>
                                            ) : null}
                                        </View>

                                        <View style={[styles.tableCol, { width: '7%' }]}>
                                            <Text style={styles.tdCenter}>{formatDateCell(employee.date_of_joining)}</Text>
                                        </View>

                                        <View style={[styles.tableCol, { width: '7%' }]}>
                                            <Text style={[styles.tdCenter, isInactive ? styles.inactiveStatus : styles.activeStatus]}>
                                                {employee.status === '1' || employee.status === 1
                                                    ? 'Active'
                                                    : employee.status === '2' || employee.status === 2
                                                        ? 'Inactive'
                                                        : '--'}
                                            </Text>
                                        </View>

                                        <View style={[styles.tableCol, { width: '7%' }]}>
                                            <Text style={styles.tdCenter}>
                                                {isInactive && employee.last_working_date && employee.last_working_date !== '0000-00-00'
                                                    ? formatDateCell(employee.last_working_date)
                                                    : '--'}
                                            </Text>
                                        </View>

                                        <View style={[styles.tableCol, { width: '12%', borderRightWidth: 0 }]}>
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

                    {/* Common Footer */}
                    <PDFFooter totalCount={data.length} itemLabel="Employees" />
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
    const ts = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    return await downloadPdfDocument(doc, `Employee_Directory_Report_${ts}.pdf`);
};