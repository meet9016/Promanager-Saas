// utils/exportUtils/salary/excelExportPayMonthlySalary.js — Brand Purple Theme
import { exportToStyledExcel } from '../commonExcelExport';

export const exportPaySalaryToExcel = async (
  data,
  filters,
  apiSummary,
  filename = 'Paid_Salary_Report',
  companyName = 'Your Company Name'
) => {
  if (!data || !data.length) throw new Error('No data to export');

  const monthText = filters?.month_year
    ? new Date(filters.month_year + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Current Period';

  const fmtRaw = (v) => parseFloat(v || 0);

  // Grand totals
  const GT = {
    monthly: data.reduce((s, e) => s + fmtRaw(e.monthly_salary), 0),
    attSalary: data.reduce((s, e) => s + fmtRaw(e.total_salary), 0),
    allowance: data.reduce((s, e) => s + fmtRaw(e.total_allowance_amount), 0),
    deduction: data.reduce((s, e) => s + fmtRaw(e.total_deduction_amount), 0),
    loan: data.reduce((s, e) => s + fmtRaw(e.total_loan_amount), 0),
    advance: data.reduce((s, e) => s + fmtRaw(e.total_advance_amount), 0),
    holiday: data.reduce((s, e) => s + fmtRaw(e.total_holiday_amount), 0),
    netPayable: data.reduce((s, e) => s + fmtRaw(e.net_payable), 0),
    totalPaid: data.reduce((s, e) => s + fmtRaw(e.total_paid), 0),
  };

  const getVal = (val, fallback) => {
    const num = parseFloat(val);
    return isNaN(num) ? fallback : num;
  };

  const summaryCards = [
    { label: 'Total Employees', value: apiSummary?.total_employees ?? data.length },
    { label: 'Total Allowances', value: `₹${getVal(apiSummary?.grand_total_allowance, GT.allowance).toFixed(2)}` },
    { label: 'Total Deductions', value: `₹${getVal(apiSummary?.grand_total_deduction, GT.deduction).toFixed(2)}` },
    { label: 'Grand Net Payable', value: `₹${getVal(apiSummary?.grand_net_payable, GT.netPayable).toFixed(2)}` },
    { label: 'Total Paid', value: `₹${getVal(apiSummary?.grand_total_paid, GT.totalPaid).toFixed(2)}` },
  ];

  const headers = [
    { key: 'sr_no', label: '#' },
    { key: 'employee_name', label: 'Employee' },
    { key: 'employee_code', label: 'Code' },
    { key: 'monthly_salary', label: 'Monthly Salary' },
    { key: 'attendance_salary', label: 'Att. Salary' },
    { key: 'allowance', label: '+Allowance' },
    { key: 'deduction', label: '-Deduction' },
    { key: 'loan', label: '-Loan' },
    { key: 'advance', label: '-Advance' },
    { key: 'net_payable', label: 'Net Payable' },
    { key: 'total_paid', label: 'Total Paid' },
    { key: 'payment_status', label: 'Pay Status' },
  ];

  const formattedRows = data.map((emp, i) => ({
    sr_no: i + 1,
    employee_name: emp.employee_name || '--',
    employee_code: emp.employee_code || '--',
    monthly_salary: `₹${fmtRaw(emp.monthly_salary).toFixed(2)}`,
    attendance_salary: `₹${fmtRaw(emp.total_salary).toFixed(2)}`,
    allowance: fmtRaw(emp.total_allowance_amount) > 0 ? `+₹${fmtRaw(emp.total_allowance_amount).toFixed(2)}` : '--',
    deduction: fmtRaw(emp.total_deduction_amount) > 0 ? `-₹${fmtRaw(emp.total_deduction_amount).toFixed(2)}` : '--',
    loan: fmtRaw(emp.total_loan_amount) > 0 ? `-₹${fmtRaw(emp.total_loan_amount).toFixed(2)}` : '--',
    advance: fmtRaw(emp.total_advance_amount) > 0 ? `-₹${fmtRaw(emp.total_advance_amount).toFixed(2)}` : '--',
    net_payable: `₹${fmtRaw(emp.net_payable).toFixed(2)}`,
    total_paid: fmtRaw(emp.total_paid) > 0 ? `₹${fmtRaw(emp.total_paid).toFixed(2)}` : '--',
    payment_status: emp.payment_status_label || 'Unpaid',
  }));

  formattedRows.push({
    sr_no: '',
    employee_name: 'TOTAL',
    employee_code: `${data.length} Employees`,
    monthly_salary: `₹${GT.monthly.toFixed(2)}`,
    attendance_salary: `₹${GT.attSalary.toFixed(2)}`,
    allowance: GT.allowance > 0 ? `+₹${GT.allowance.toFixed(2)}` : '--',
    deduction: GT.deduction > 0 ? `-₹${GT.deduction.toFixed(2)}` : '--',
    loan: GT.loan > 0 ? `-₹${GT.loan.toFixed(2)}` : '--',
    advance: GT.advance > 0 ? `-₹${GT.advance.toFixed(2)}` : '--',
    net_payable: `₹${GT.netPayable.toFixed(2)}`,
    total_paid: GT.totalPaid > 0 ? `₹${GT.totalPaid.toFixed(2)}` : '--',
    payment_status: '',
  });

  const safeMonth = (filters?.month_year || 'report').replace('-', '_');

  await exportToStyledExcel({
    title: 'PAID SALARY REPORT',
    companyName: companyName || 'Your Company Name',
    dateRangeText: `Period: ${monthText}`,
    summaryCards,
    headers,
    data: formattedRows,
    filename: `${filename}_${safeMonth}`,
    sheetName: 'Paid Salary',
  });
};