// utils/exportUtils/salary/excelExportSalaryGenerationStatus.js — Brand Purple Theme
import { exportToStyledExcel } from '../commonExcelExport';

const getVal = (val, fallback = 0) => {
    const num = parseFloat(val);
    return isNaN(num) ? fallback : num;
};

export const exportSalaryStatusToExcel = async (
    data,
    filters,
    apiSummary,
    filename = 'Salary_Generation_Status',
    companyName = 'Your Company Name'
) => {
    if (!data || !data.length) throw new Error('No data to export');

    const monthText = filters?.month_year
        ? new Date(filters.month_year + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        : 'Current Period';

    const summaryCards = [
        { label: 'Total Employees', value: apiSummary?.total_employees ?? data.length },
        { label: 'Generated Count', value: apiSummary?.generated_count ?? 0 },
        { label: 'Pending Count', value: apiSummary?.pending_count ?? (data.length - (apiSummary?.generated_count || 0)) },
        { label: 'Paid Count', value: apiSummary?.paid_count ?? 0 },
        { label: 'Generated Total', value: `₹${getVal(apiSummary?.generated_total_salary).toFixed(2)}` },
        { label: 'Total Paid', value: `₹${getVal(apiSummary?.paid_total_salary).toFixed(2)}` },
    ];

    const headers = [
        { key: 'sr_no', label: 'S.No' },
        { key: 'employee_name', label: 'Employee Name' },
        { key: 'employee_code', label: 'Employee Code' },
        { key: 'monthly_salary', label: 'Monthly Salary' },
        { key: 'final_salary', label: 'Final Salary' },
        { key: 'net_payable', label: 'Net Payable' },
        { key: 'total_paid', label: 'Total Paid' },
        { key: 'balance_due', label: 'Balance Due' },
        { key: 'generated_at', label: 'Generated At' },
        { key: 'generation_status', label: 'Generation Status' },
        { key: 'payment_status', label: 'Payment Status' },
    ];

    const formattedRows = data.map((emp, i) => {
        const isGen = String(emp.salary_generation_status || '').toLowerCase() === 'generated';
        const genStatus = isGen ? 'Generated' : 'Pending';

        return {
            sr_no: i + 1,
            employee_name: emp.employee_name || '--',
            employee_code: emp.employee_code || '--',
            monthly_salary: `₹${getVal(emp.monthly_salary).toFixed(2)}`,
            final_salary: isGen ? `₹${getVal(emp.final_salary).toFixed(2)}` : '--',
            net_payable: isGen ? `₹${getVal(emp.net_payable).toFixed(2)}` : '--',
            total_paid: getVal(emp.total_paid) > 0 ? `₹${getVal(emp.total_paid).toFixed(2)}` : '--',
            balance_due: isGen ? `₹${getVal(emp.balance_due).toFixed(2)}` : '--',
            generated_at: emp.generated_at ? new Date(emp.generated_at).toLocaleDateString('en-IN') : '--',
            generation_status: genStatus,
            payment_status: emp.payment_status_label || 'Not Generated',
        };
    });

    const safeMonth = (filters?.month_year || 'report').replace('-', '_');

    await exportToStyledExcel({
        title: 'SALARY GENERATION STATUS REPORT',
        companyName: companyName || 'Your Company Name',
        dateRangeText: `Period: ${monthText}`,
        summaryCards,
        headers,
        data: formattedRows,
        filename: `${filename}_${safeMonth}`,
        sheetName: 'Salary Status',
    });
};