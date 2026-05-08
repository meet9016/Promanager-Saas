// utils/exportUtils/DailyReport/pdfExport.js
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';

// Create styles for PDF
const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 20,
        fontSize: 8,
    },
    header: {
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#000000',
        paddingBottom: 10,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    companyName: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#000000',
    },
    dateText: {
        fontSize: 10,
        color: '#000000',
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000000',
        textAlign: 'center',
        marginBottom: 5,
    },
    filtersSection: {
        marginTop: 10,
        marginBottom: 10,
        padding: 8,
        backgroundColor: '#f8f9fa',
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    filtersTitle: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#000000',
        marginBottom: 5,
    },
    filtersText: {
        fontSize: 9,
        color: '#000000',
        lineHeight: 1.4,
    },
    table: {
        width: '100%',
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: '#000000',
        fontSize: 7,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#000000',
    },
    tableHeader: {
        backgroundColor: '#f0f0f0',
        fontWeight: 'bold',
    },
    tableCell: {
        borderRightWidth: 1,
        borderRightColor: '#000000',
        padding: 4,
        textAlign: 'center',
        justifyContent: 'center',
        alignItems: 'center',
    },
    tableColSno: {
        width: '4%',
    },
    tableColName: {
        width: '18%',
    },
    tableColCode: {
        width: '10%',
    },
    tableColShift: {
        width: '12%',
    },
    tableColTime: {
        width: '8%',
    },
    tableColHours: {
        width: '7%',
    },
    tableColStatus: {
        width: '8%',
    },
    presentText: {
        color: '#000000',
        fontWeight: 'bold',
    },
    absentText: {
        color: '#000000',
        fontWeight: 'bold',
    },
    weekoffText: {
        color: '#000000',
        fontWeight: 'bold',
    },
    lateText: {
        color: '#000000',
        fontWeight: 'bold',
    },
    overtimeText: {
        color: '#000000',
        fontWeight: 'bold',
    },
    footer: {
        position: 'absolute',
        fontSize: 8,
        bottom: 30,
        left: 0,
        right: 0,
        textAlign: 'center',
        color: '#000000',
    },
    pageNumber: {
        position: 'absolute',
        fontSize: 8,
        bottom: 15,
        left: 0,
        right: 0,
        textAlign: 'center',
        color: '#000000',
    }
});

// PDF Document Component
const AttendancePDFDocument = ({ data, selectedDate, companyName = 'Your Company Name', appliedFilters = {}, filterLabels = {} }) => {
    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const formatTime = (time) => {
        if (!time || time === '--') return '--';
        return time;
    };

    const getStatusStyle = (status) => {
        // All status text in black for printable format
        return { color: '#000000', fontWeight: 'bold' };
    };

    // Check if any filters are applied
    const hasAppliedFilters = appliedFilters && Object.values(appliedFilters).some(value => value !== '' && value !== null && value !== undefined);

    // Format applied filters for display
    const formatAppliedFilters = () => {
        if (!hasAppliedFilters) return '';

        const activeFilters = [];

        if (appliedFilters.attendance_status_id && filterLabels.attendance_status) {
            activeFilters.push(`Status: ${filterLabels.attendance_status}`);
        }
        if (appliedFilters.branch_id && filterLabels.branch) {
            activeFilters.push(`Branch: ${filterLabels.branch}`);
        }
        if (appliedFilters.department_id && filterLabels.department) {
            activeFilters.push(`Department: ${filterLabels.department}`);
        }
        if (appliedFilters.designation_id && filterLabels.designation) {
            activeFilters.push(`Designation: ${filterLabels.designation}`);
        }
        if (appliedFilters.shift_id && filterLabels.shift) {
            activeFilters.push(`Shift: ${filterLabels.shift}`);
        }

        return activeFilters.join(' | ');
    };

    // Split data into chunks for pagination (35 rows per page for better space usage)
    const chunkSize = hasAppliedFilters ? 32 : 35; // Reduce rows if filters are shown
    const dataChunks = [];
    for (let i = 0; i < data.length; i += chunkSize) {
        dataChunks.push(data.slice(i, i + chunkSize));
    }

    return (
        <Document>
            {dataChunks.map((chunk, pageIndex) => (
                <Page key={pageIndex} size="A4" orientation="landscape" style={styles.page}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerRow}>
                            <Text style={styles.companyName}>{companyName}</Text>
                            <Text style={styles.dateText}>Date: {formatDate(selectedDate)}</Text>
                        </View>
                        <Text style={styles.title}>Daily Attendance Report</Text>

                        {/* Applied Filters Section - Only show if filters are applied */}
                        {hasAppliedFilters && (
                            <View style={styles.filtersSection}>
                                <Text style={styles.filtersTitle}>Applied Filters:</Text>
                                <Text style={styles.filtersText}>{formatAppliedFilters()}</Text>
                            </View>
                        )}
                    </View>

                    {/* Table */}
                    <View style={styles.table}>
                        {/* Table Header */}
                        <View style={[styles.tableRow, styles.tableHeader]}>
                            <View style={[styles.tableCell, styles.tableColSno]}>
                                <Text>S.No</Text>
                            </View>
                            <View style={[styles.tableCell, styles.tableColName]}>
                                <Text>Employee Name</Text>
                            </View>
                            <View style={[styles.tableCell, styles.tableColCode]}>
                                <Text>Code</Text>
                            </View>
                            <View style={[styles.tableCell, styles.tableColShift]}>
                                <Text>Shift</Text>
                            </View>
                            <View style={[styles.tableCell, styles.tableColTime]}>
                                <Text>Clock In</Text>
                            </View>
                            <View style={[styles.tableCell, styles.tableColTime]}>
                                <Text>Clock Out</Text>
                            </View>
                            <View style={[styles.tableCell, styles.tableColHours]}>
                                <Text>Work Hrs</Text>
                            </View>
                            <View style={[styles.tableCell, styles.tableColHours]}>
                                <Text>Att Hrs</Text>
                            </View>
                            <View style={[styles.tableCell, styles.tableColHours]}>
                                <Text>Remaining Hrs</Text>
                            </View>
                            <View style={[styles.tableCell, styles.tableColHours]}>
                                <Text>OT Hrs</Text>
                            </View>
                            <View style={[styles.tableCell, styles.tableColStatus, { borderRightWidth: 0 }]}>
                                <Text>Status</Text>
                            </View>
                        </View>

                        {/* Table Rows */}
                        {chunk.map((employee, index) => (
                            <View style={styles.tableRow} key={index}>
                                <View style={[styles.tableCell, styles.tableColSno]}>
                                    <Text>{(pageIndex * chunkSize) + index + 1}</Text>
                                </View>
                                <View style={[styles.tableCell, styles.tableColName]}>
                                    <Text>{employee.employee_name}</Text>
                                </View>
                                <View style={[styles.tableCell, styles.tableColCode]}>
                                    <Text>{employee.employee_code || '--'}</Text>
                                </View>
                                <View style={[styles.tableCell, styles.tableColShift]}>
                                    <Text>{employee.shift_name}</Text>
                                </View>
                                <View style={[styles.tableCell, styles.tableColTime]}>
                                    <Text>{formatTime(employee.attandance_first_clock_in)}</Text>
                                </View>
                                <View style={[styles.tableCell, styles.tableColTime]}>
                                    <Text>{formatTime(employee.attandance_last_clock_out)}</Text>
                                </View>
                                <View style={[styles.tableCell, styles.tableColHours]}>
                                    <Text>{employee.shift_working_hours}</Text>
                                </View>
                                <View style={[styles.tableCell, styles.tableColHours]}>
                                    <Text>{employee.attandance_hours}</Text>
                                </View>
                                <View style={[styles.tableCell, styles.tableColHours]}>
                                    <Text>
                                        {employee.late_hours && parseFloat(employee.late_hours) > 0
                                            ? `${employee.late_hours}`
                                            : '--'}
                                    </Text>
                                </View>
                                <View style={[styles.tableCell, styles.tableColHours]}>
                                    <Text>
                                        {employee.overtime_hours && parseFloat(employee.overtime_hours) > 0
                                            ? `${employee.overtime_hours}`
                                            : '--'}
                                    </Text>
                                </View>

                                <View style={[styles.tableCell, styles.tableColStatus, { borderRightWidth: 0 }]}>
                                    <Text style={getStatusStyle(employee.status)}>
                                        {employee.status || '--'}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>

                    {/* Page Number */}
                    <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) =>
                        `Page ${pageNumber} of ${totalPages}`
                    } fixed />
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

        const doc = <AttendancePDFDocument
            data={data}
            selectedDate={selectedDate}
            companyName={companyName}
            appliedFilters={appliedFilters}
            filterLabels={filterLabels}
        />;

        const asPdf = pdf(doc);
        const blob = await asPdf.toBlob();

        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}_${new Date(selectedDate).toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        return { success: true, message: 'PDF exported successfully!' };
    } catch (error) {
        console.error('PDF Export Error:', error);
        throw new Error(`Failed to export PDF: ${error.message}`);
    }
};