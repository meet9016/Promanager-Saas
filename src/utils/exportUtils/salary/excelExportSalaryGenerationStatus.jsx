// utils/exportUtils/salary/excelExportSalaryGenerationStatus.js

export const exportSalaryStatusToExcel = (data, filters, apiSummary, filename = 'Salary_Generation_Status') => {
    if (!data || !data.length) throw new Error('No data to export');

    const ml = filters?.month_year
        ? new Date(filters.month_year + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        : '';

    const fmt = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v || 0);

    const normalizeGen = (raw) => String(raw || '').toLowerCase() === 'generated' ? 'Generated' : 'Pending';

    const schema = [
        { header: 'S.No', get: (e, i) => i + 1 },
        { header: 'Employee Name', get: (e) => e.employee_name || '--' },
        { header: 'Employee Code', get: (e) => e.employee_code || '--' },
        { header: 'Monthly Salary', get: (e) => parseFloat(e.monthly_salary || 0) },
        { header: 'Final Salary', get: (e) => normalizeGen(e.salary_generation_status) === 'Generated' ? parseFloat(e.final_salary || 0) : '--' },
        { header: 'Net Payable', get: (e) => normalizeGen(e.salary_generation_status) === 'Generated' ? parseFloat(e.net_payable || 0) : '--' },
        { header: 'Total Paid', get: (e) => parseFloat(e.total_paid || 0) > 0 ? parseFloat(e.total_paid) : '--' },
        { header: 'Balance Due', get: (e) => normalizeGen(e.salary_generation_status) === 'Generated' ? parseFloat(e.balance_due || 0) : '--' },
        { header: 'Generated At', get: (e) => e.generated_at ? new Date(e.generated_at).toLocaleDateString('en-IN') : '--' },
        { header: 'Generation Status', get: (e) => normalizeGen(e.salary_generation_status) },
        { header: 'Payment Status', get: (e) => e.payment_status_label || 'Not Generated' },
    ];
    const headers = schema.map(s => s.header);
    const currencyCols = new Set(['Monthly Salary', 'Final Salary', 'Net Payable', 'Total Paid', 'Balance Due']);

    const genStatusStyle = (s) => s === 'Generated' ? 'background:#e8f5e9;font-weight:bold;' : 'background:#fff9e6;color:#666;';
    const payStatusStyle = (s) => {
        const l = String(s || '').toLowerCase();
        if (l === 'paid') return 'background:#e3f2fd;font-weight:bold;color:#1565c0;';
        if (l === 'partially paid') return 'background:#e8f5e9;color:#2e7d32;';
        return 'background:#fff3e0;color:#795548;';
    };

    const tableHTML = `
<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%;font-family:Arial,sans-serif;font-size:12px;">
<tbody>
  <!-- Title -->
  <tr>
    <td colspan="${headers.length}" style="text-align:center;font-weight:bold;font-size:18px;padding:10px;border:2px solid #000;background:#000;color:#fff;">
      Salary Generation Status Report
    </td>
  </tr>
  <tr>
    <td colspan="${headers.length}" style="text-align:center;font-size:13px;padding:6px;border:1px solid #888;background:#f0f0f0;font-weight:bold;">
      ${ml}
    </td>
  </tr>
  <tr>
    <td colspan="${Math.ceil(headers.length / 2)}" style="padding:5px;border:1px solid #bbb;font-size:11px;color:#333;">
      Generated: ${new Date().toLocaleString()}
    </td>
    <td colspan="${Math.floor(headers.length / 2)}" style="padding:5px;border:1px solid #bbb;font-size:11px;color:#333;text-align:right;">
      Total Records: ${data.length}
    </td>
  </tr>
  <tr><td colspan="${headers.length}" style="border:none;height:8px;"></td></tr>

  <!-- Summary -->
  <tr>
    <td colspan="${headers.length}" style="font-weight:bold;font-size:13px;padding:6px;border:2px solid #000;background:#333;color:#fff;">
      Summary
    </td>
  </tr>
  ${apiSummary ? `
  <tr>
    <td colspan="2" style="padding:5px;border:1px solid #bbb;background:#f5f5f5;font-weight:bold;font-size:11px;">Total Employees</td>
    <td colspan="2" style="padding:5px;border:1px solid #bbb;font-weight:bold;font-size:11px;">${apiSummary.total_employees}</td>
    <td colspan="2" style="padding:5px;border:1px solid #bbb;background:#e8f5e9;font-weight:bold;font-size:11px;">Generated</td>
    <td colspan="2" style="padding:5px;border:1px solid #bbb;font-weight:bold;font-size:11px;">${apiSummary.generated_count}</td>
    <td colspan="3" style="padding:5px;border:1px solid #bbb;background:#fff9e6;font-weight:bold;font-size:11px;">Pending</td>
  </tr>
  <tr>
    <td colspan="2" style="padding:5px;border:1px solid #bbb;background:#e3f2fd;font-weight:bold;font-size:11px;">Paid Count</td>
    <td colspan="2" style="padding:5px;border:1px solid #bbb;font-weight:bold;font-size:11px;">${apiSummary.paid_count}</td>
    <td colspan="2" style="padding:5px;border:1px solid #bbb;background:#e8f5e9;font-weight:bold;font-size:11px;">Generated Total</td>
    <td colspan="2" style="padding:5px;border:1px solid #bbb;font-weight:bold;font-size:11px;">${fmt(apiSummary.generated_total_salary)}</td>
    <td colspan="3" style="padding:5px;border:1px solid #bbb;font-weight:bold;font-size:11px;">Total Paid: ${fmt(apiSummary.paid_total_salary)}</td>
  </tr>` : ''}
  <tr><td colspan="${headers.length}" style="border:none;height:8px;"></td></tr>

  <!-- Table header -->
  <tr>
    ${headers.map(h => `<td style="background:#000;color:#fff;font-weight:bold;font-size:12px;padding:7px;border:2px solid #000;text-align:center;">${h}</td>`).join('')}
  </tr>

  <!-- Data rows -->
  ${data.map((emp, i) => {
        const row = schema.map(s => s.get(emp, i));
        const genStatus = normalizeGen(emp.salary_generation_status);
        const payLabel = emp.payment_status_label || 'Not Generated';
        return `<tr style="background:${i % 2 === 0 ? '#fff' : '#f8f8f8'};">
      ${row.map((cell, ci) => {
            const h = headers[ci];
            let style = 'border:1px solid #bbb;padding:6px;text-align:center;font-size:11px;';
            if (h === 'Employee Name') style += 'text-align:left;font-weight:bold;';
            if (h === 'Employee Code') style += 'font-weight:bold;';
            if (h === 'Net Payable') style += 'font-weight:bold;';
            if (h === 'Generation Status') style += genStatusStyle(genStatus);
            if (h === 'Payment Status') style += payStatusStyle(payLabel);
            if (h === 'Balance Due' && parseFloat(emp.balance_due || 0) > 0 && genStatus === 'Generated') style += 'color:#c62828;font-weight:bold;';
            const display = currencyCols.has(h) && cell !== '--' ? fmt(cell) : cell;
            return `<td style="${style}">${display}</td>`;
        }).join('')}
    </tr>`;
    }).join('')}
</tbody>
</table>`;

    const safeMonth = (filters?.month_year || 'report').replace('-', '_');
    const blob = new Blob([tableHTML], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${filename}_${safeMonth}.xls`;
    a.style.visibility = 'hidden';
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
};