import React from 'react';
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';

// Create black and white styles for PDF
const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 15,
        fontSize: 8,
    },
    header: {
        flexDirection: 'row',
        marginBottom: 15,
        paddingBottom: 8,
        borderBottomWidth: 2,
        borderBottomColor: '#000000',
    },
    headerLeft: {
        flex: 1,
        fontSize: 10,
        fontWeight: 'bold',
        color: '#000000',
        textAlign: 'center',
    },
    headerCenter: {
        flex: 2,
        textAlign: 'center',
        fontSize: 14,
        fontWeight: 'bold',
        color: '#000000',
    },
    headerRight: {
        flex: 1,
        textAlign: 'center',
        fontSize: 8,
        color: '#000000',
    },
    filterSection: {
        marginBottom: 12,
        padding: 8,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#000000',
    },
    filterTitle: {
        fontSize: 9,
        fontWeight: 'bold',
        marginBottom: 3,
        color: '#000000',
        textAlign: 'left',
    },
    filterText: {
        fontSize: 8,
        color: '#000000',
        textAlign: 'left',
    },
    table: {
        display: 'table',
        width: '100%',
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: '#000000',
        marginBottom: 10,
    },
    tableRow: {
        flexDirection: 'row',
        minHeight: 24,
    },

    // Header columns with better proportions
    tableColHeaderSr: {
        width: '5%',
        borderRightWidth: 1,
        borderRightColor: '#000000',
        borderBottomWidth: 1,
        borderBottomColor: '#000000',
        backgroundColor: '#ffffff',
        padding: 3,
        justifyContent: 'center',
    },
    tableColHeaderEmployee: {
        width: '20%',
        borderRightWidth: 1,
        borderRightColor: '#000000',
        borderBottomWidth: 1,
        borderBottomColor: '#000000',
        backgroundColor: '#ffffff',
        padding: 3,
        justifyContent: 'center',
    },
    tableColHeaderSalary: {
        width: '10%',
        borderRightWidth: 1,
        borderRightColor: '#000000',
        borderBottomWidth: 1,
        borderBottomColor: '#000000',
        backgroundColor: '#ffffff',
        padding: 3,
        justifyContent: 'center',
    },
    tableColHeaderDays: {
        width: '7%',
        borderRightWidth: 1,
        borderRightColor: '#000000',
        borderBottomWidth: 1,
        borderBottomColor: '#000000',
        backgroundColor: '#ffffff',
        padding: 3,
        justifyContent: 'center',
    },
    tableColHeaderAmount: {
        width: '9%',
        borderRightWidth: 1,
        borderRightColor: '#000000',
        borderBottomWidth: 1,
        borderBottomColor: '#000000',
        backgroundColor: '#ffffff',
        padding: 3,
        justifyContent: 'center',
    },
    tableColHeaderSubtotal: {
        width: '10%',
        borderRightWidth: 1,
        borderRightColor: '#000000',
        borderBottomWidth: 1,
        borderBottomColor: '#000000',
        backgroundColor: '#ffffff',
        padding: 3,
        justifyContent: 'center',
    },
    tableColHeaderTotal: {
        width: '12%',
        borderBottomWidth: 1,
        borderBottomColor: '#000000',
        backgroundColor: '#ffffff',
        padding: 3,
        justifyContent: 'center',
    },

    // Data columns
    tableColSr: {
        width: '5%',
        borderRightWidth: 1,
        borderRightColor: '#000000',
        borderBottomWidth: 1,
        borderBottomColor: '#000000',
        padding: 3,
        justifyContent: 'center',
    },
    tableColEmployee: {
        width: '20%',
        borderRightWidth: 1,
        borderRightColor: '#000000',
        borderBottomWidth: 1,
        borderBottomColor: '#000000',
        padding: 3,
        justifyContent: 'center',
    },
    tableColSalary: {
        width: '10%',
        borderRightWidth: 1,
        borderRightColor: '#000000',
        borderBottomWidth: 1,
        borderBottomColor: '#000000',
        padding: 3,
        justifyContent: 'center',
    },
    tableColDays: {
        width: '7%',
        borderRightWidth: 1,
        borderRightColor: '#000000',
        borderBottomWidth: 1,
        borderBottomColor: '#000000',
        padding: 3,
        justifyContent: 'center',
    },
    tableColAmount: {
        width: '9%',
        borderRightWidth: 1,
        borderRightColor: '#000000',
        borderBottomWidth: 1,
        borderBottomColor: '#000000',
        padding: 3,
        justifyContent: 'center',
    },
    tableColSubtotal: {
        width: '10%',
        borderRightWidth: 1,
        borderRightColor: '#000000',
        borderBottomWidth: 1,
        borderBottomColor: '#000000',
        padding: 3,
        justifyContent: 'center',
    },
    tableColTotal: {
        width: '12%',
        borderBottomWidth: 1,
        borderBottomColor: '#000000',
        padding: 3,
        justifyContent: 'center',
    },

    // Text styles
    tableCellHeader: {
        fontSize: 7,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#000000',
        lineHeight: 1.2,
    },
    tableCell: {
        fontSize: 7,
        textAlign: 'center',
        color: '#000000',
        lineHeight: 1.2,
    },
    employeeName: {
        fontSize: 7,
        fontWeight: 'bold',
        marginBottom: 1,
        color: '#000000',
        textAlign: 'center',
    },
    employeeCode: {
        fontSize: 6,
        color: '#000000',
        textAlign: 'center',
    },
    currencyCell: {
        fontSize: 7,
        textAlign: 'center',
        fontWeight: 'bold',
        color: '#000000',
    },
    footer: {
        position: 'absolute',
        bottom: 15,
        left: 15,
        right: 15,
        textAlign: 'center',
        fontSize: 7,
        color: '#000000',
        borderTopWidth: 1,
        borderTopColor: '#000000',
        paddingTop: 5,
    },
});

// PDF Document Component
const MonthlySalaryReportPDF = ({ reportData, filters, companyName = 'Your Company' }) => {

    const formatNumber = (amount) => {
        const num = parseFloat(amount || 0);
        return new Intl.NumberFormat('en-IN', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(num);
    };

    const formatShortNumber = (amount) => {
        const num = parseFloat(amount || 0);
        if (num >= 10000000) {
            return `${(num / 10000000).toFixed(1)}Cr`;
        } else if (num >= 100000) {
            return `${(num / 100000).toFixed(1)}L`;
        } else if (num >= 1000) {
            return `${(num / 1000).toFixed(1)}K`;
        } else {
            return `${num}`;
        }
    };

    const getMonthYearDisplay = (monthYear) => {
        if (!monthYear) return 'All Months';
        const date = new Date(monthYear + '-01');
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    const getCurrentDate = () => {
        return new Date().toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Calculate summary statistics
    const hasFilters = filters.month_year;

    // Split data into chunks for pagination (25 rows per page for better readability)
    const chunkSize = 25;
    const dataChunks = [];
    for (let i = 0; i < reportData.length; i += chunkSize) {
        dataChunks.push(reportData.slice(i, i + chunkSize));
    }

    return (
        <Document>
            {dataChunks.map((chunk, pageIndex) => (
                <Page key={pageIndex} size="A4" orientation="landscape" style={styles.page}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerLeft}>{companyName}</Text>
                        <Text style={styles.headerCenter}>Monthly Salary Report</Text>
                        <Text style={styles.headerRight}>Generated: {getCurrentDate()}</Text>
                    </View>

                    {/* Filters Section - Only on first page if filters exist */}
                    {pageIndex === 0 && hasFilters && (
                        <View style={styles.filterSection}>
                            <Text style={styles.filterTitle}>Applied Filters:</Text>
                            <Text style={styles.filterText}>
                                Report Period: {getMonthYearDisplay(filters.month_year)} | Total Employees: {reportData.length}
                            </Text>
                        </View>
                    )}

                    {/* Table */}
                    <View style={styles.table}>
                        {/* Table Header */}
                        <View style={styles.tableRow}>
                            <View style={styles.tableColHeaderSr}>
                                <Text style={styles.tableCellHeader}>Sr.{'\n'}No.</Text>
                            </View>
                            <View style={styles.tableColHeaderEmployee}>
                                <Text style={styles.tableCellHeader}>Employee{'\n'}Details</Text>
                            </View>
                            <View style={styles.tableColHeaderSalary}>
                                <Text style={styles.tableCellHeader}>Base{'\n'}Salary</Text>
                            </View>
                            <View style={styles.tableColHeaderDays}>
                                <Text style={styles.tableCellHeader}>Work{'\n'}Days</Text>
                            </View>
                            <View style={styles.tableColHeaderDays}>
                                <Text style={styles.tableCellHeader}>Present{'\n'}Days</Text>
                            </View>
                            <View style={styles.tableColHeaderDays}>
                                <Text style={styles.tableCellHeader}>Absent{'\n'}Days</Text>
                            </View>
                            <View style={styles.tableColHeaderDays}>
                                <Text style={styles.tableCellHeader}>OT{'\n'}Days</Text>
                            </View>
                            <View style={styles.tableColHeaderAmount}>
                                <Text style={styles.tableCellHeader}>Overtime{'\n'}Pay</Text>
                            </View>
                            <View style={styles.tableColHeaderDays}>
                                <Text style={styles.tableCellHeader}>Week Off{'\n'}Days</Text>
                            </View>
                            <View style={styles.tableColHeaderAmount}>
                                <Text style={styles.tableCellHeader}>Week Off{'\n'}Pay</Text>
                            </View>
                            <View style={styles.tableColHeaderSubtotal}>
                                <Text style={styles.tableCellHeader}>Subtotal{'\n'}Amount</Text>
                            </View>
                            <View style={styles.tableColHeaderTotal}>
                                <Text style={styles.tableCellHeader}>Final{'\n'}Salary</Text>
                            </View>
                        </View>

                        {/* Table Data */}
                        {chunk.map((employee, index) => {
                            const globalIndex = pageIndex * chunkSize + index + 1;

                            return (
                                <View
                                    key={employee.employee_code || index}
                                    style={styles.tableRow}
                                >
                                    <View style={styles.tableColSr}>
                                        <Text style={styles.tableCell}>
                                            {globalIndex}
                                        </Text>
                                    </View>
                                    <View style={styles.tableColEmployee}>
                                        <Text style={styles.employeeName}>
                                            {employee.employee_name || '--'}
                                        </Text>
                                        <Text style={styles.employeeCode}>
                                            ID: {employee.employee_code || '--'}
                                        </Text>
                                    </View>
                                    <View style={styles.tableColSalary}>
                                        <Text style={styles.currencyCell}>
                                            {formatNumber(employee.employee_salary)}
                                        </Text>
                                    </View>
                                    <View style={styles.tableColDays}>
                                        <Text style={styles.tableCell}>
                                            {employee.working_days || 0}
                                        </Text>
                                    </View>
                                    <View style={styles.tableColDays}>
                                        <Text style={styles.tableCell}>
                                            {employee.present_days || 0}
                                        </Text>
                                    </View>
                                    <View style={styles.tableColDays}>
                                        <Text style={styles.tableCell}>
                                            {employee.absent_days || 0}
                                        </Text>
                                    </View>
                                    <View style={styles.tableColDays}>
                                        <Text style={styles.tableCell}>
                                            {employee.overtime_days || 0}
                                        </Text>
                                    </View>
                                    <View style={styles.tableColAmount}>
                                        <Text style={styles.currencyCell}>
                                            {formatNumber(employee.overtime_salary)}
                                        </Text>
                                    </View>
                                    <View style={styles.tableColDays}>
                                        <Text style={styles.tableCell}>
                                            {employee.week_off_days || 0}
                                        </Text>
                                    </View>
                                    <View style={styles.tableColAmount}>
                                        <Text style={styles.currencyCell}>
                                            {formatNumber(employee.week_off_salary)}
                                        </Text>
                                    </View>
                                    <View style={styles.tableColSubtotal}>
                                        <Text style={styles.currencyCell}>
                                            {formatNumber(employee.subtotal_salary)}
                                        </Text>
                                    </View>
                                    <View style={styles.tableColTotal}>
                                        <Text style={styles.currencyCell}>
                                            {formatNumber(employee.total_salary)}
                                        </Text>
                                    </View>
                                </View>
                            );
                        })}
                    </View>

                    {/* Footer */}
                    <Text style={styles.footer}>
                        Page {pageIndex + 1} of {dataChunks.length} | Total Records: {reportData.length} |
                        Monthly Salary Report - {getMonthYearDisplay(filters.month_year)} |
                        Generated on {getCurrentDate()}
                    </Text>
                </Page>
            ))}
        </Document>
    );
};

// Export function remains the same
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

        const asPdf = pdf(doc);
        const blob = await asPdf.toBlob();

        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;

        // Generate filename
        const monthYear = filters.month_year || 'all-months';
        const timestamp = new Date().toISOString().split('T')[0];
        link.download = `monthly-salary-report-${monthYear}-${timestamp}.pdf`;

        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up
        URL.revokeObjectURL(url);

        showToast('PDF downloaded successfully', 'success');
    } catch (error) {
        console.error('PDF Export Error:', error);
        showToast('Failed to generate PDF', 'error');
    }
};