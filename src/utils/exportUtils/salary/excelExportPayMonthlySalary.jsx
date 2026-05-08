// utils/exportUtils/salary/excelExportPayMonthlySalary.js

export const exportPaySalaryToExcel = (data, filters, apiSummary, filename = 'Paid_Salary_Report') => {
    if (!data || !data.length) throw new Error('No data to export');

    const ml = filters?.month_year
        ? new Date(filters.month_year + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        : '';

    const fmt = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v || 0);
    const fmtRaw = (v) => parseFloat(v || 0);

    const payModeName = (m) => ({ '1': 'Cash', '2': 'Bank Transfer', '3': 'Cheque' }[String(m)] || `Mode ${m}`);

    const payStatusStyle = (label) => {
        const l = String(label || '').toLowerCase();
        if (l === 'paid') return 'background:#e8f5e9;color:#1b5e20;font-weight:bold;';
        if (l === 'partially paid') return 'background:#e3f2fd;color:#0d47a1;font-weight:bold;';
        return 'background:#fff9e6;color:#795548;';
    };

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

    const mainHeaders = [
        'S.No', 'Employee Name', 'Employee Code',
        'Monthly Salary', 'Attendance Salary',
        '+ Allowances', '- Deductions', '- Loan', '- Advance', '+ Holiday',
        'Net Payable', 'Total Paid', 'Payment Status', 'Remark'
    ];

    const mainRows = data.map((emp, i) => [
        i + 1,
        emp.employee_name || '--',
        emp.employee_code || '--',
        fmtRaw(emp.monthly_salary),
        fmtRaw(emp.total_salary),
        fmtRaw(emp.total_allowance_amount) || '--',
        fmtRaw(emp.total_deduction_amount) || '--',
        fmtRaw(emp.total_loan_amount) || '--',
        fmtRaw(emp.total_advance_amount) || '--',
        fmtRaw(emp.total_holiday_amount) || '--',
        fmtRaw(emp.net_payable),
        fmtRaw(emp.total_paid) > 0 ? fmtRaw(emp.total_paid) : '--',
        emp.payment_status_label || 'Unpaid',
        emp.remark || '--',
    ]);

    const currencyCols = new Set(['Monthly Salary', 'Attendance Salary', 'Net Payable', 'Total Paid']);
    const plusCols = new Set(['+ Allowances', '+ Holiday']);
    const minusCols = new Set(['- Deductions', '- Loan', '- Advance']);

    // Build breakdown HTML per employee
    const buildBreakdown = (emp) => {
        const allowances = emp.allowance_arr || [];
        const deductions = emp.deduction_arr || [];
        const loans = emp.loan_arr || [];
        const advances = emp.advance_arr || [];
        const holidays = emp.holiday_arr || [];
        const payments = emp.payment_arr || [];
        const hasAny = allowances.length || deductions.length || loans.length || advances.length || holidays.length || payments.length;
        if (!hasAny) return '';

        const blockStyle = 'border:1px solid #ccc;padding:5px;margin:2px;display:inline-block;vertical-align:top;min-width:160px;font-size:10px;';
        const blockTitleStyle = 'font-weight:bold;font-size:11px;border-bottom:1px solid #eee;padding-bottom:2px;margin-bottom:4px;';
        const rowStyle = 'display:flex;justify-content:space-between;margin-bottom:2px;';

        let blocks = '';

        if (allowances.length) {
            blocks += `<div style="${blockStyle}background:#f1f8e9;">
              <div style="${blockTitleStyle}color:#2e7d32;">+ Allowances (${fmt(emp.total_allowance_amount)})</div>
              ${allowances.map(a => `<div style="${rowStyle}"><span>${a.allowance_name}</span><strong style="color:#2e7d32;">${fmt(a.allowance_amount)}</strong></div>`).join('')}
            </div>`;
        }
        if (deductions.length) {
            blocks += `<div style="${blockStyle}background:#fce4e4;">
              <div style="${blockTitleStyle}color:#c62828;">- Deductions (${fmt(emp.total_deduction_amount)})</div>
              ${deductions.map(d => `<div style="${rowStyle}"><span>${d.deduction_name}</span><strong style="color:#c62828;">-${fmt(d.deduction_amount)}</strong></div>`).join('')}
            </div>`;
        }
        if (holidays.length) {
            blocks += `<div style="${blockStyle}background:#f3e5f5;">
              <div style="${blockTitleStyle}color:#6a1b9a;">+ Holidays (${fmt(emp.total_holiday_amount)})</div>
              ${holidays.map(h => `<div style="${rowStyle}"><span>${h.holiday_name || 'Holiday'}</span><strong>${fmt(h.holiday_amount)}</strong></div>`).join('')}
            </div>`;
        }
        if (loans.length) {
            blocks += `<div style="${blockStyle}background:#fff3e0;">
              <div style="${blockTitleStyle}color:#e65100;">- Loan Deductions (${fmt(emp.total_loan_amount)})</div>
              ${loans.map(l => `<div style="${rowStyle}"><span>Loan #${l.loan_id} ${l.loan_priority_name ? `(${l.loan_priority_name})` : ''}</span><strong style="color:#e65100;">-${fmt(l.installment_amount)}</strong></div>`).join('')}
            </div>`;
        }
        if (advances.length) {
            blocks += `<div style="${blockStyle}background:#fffde7;">
              <div style="${blockTitleStyle}color:#f57f17;">- Advance Deductions (${fmt(emp.total_advance_amount)})</div>
              ${advances.map(a => `<div style="${rowStyle}"><span>${a.advance_name || `Advance #${a.advance_id}`}</span><strong>-${fmt(a.advance_amount || a.installment_amount)}</strong></div>`).join('')}
            </div>`;
        }
        if (payments.length) {
            blocks += `<div style="${blockStyle}background:#e3f2fd;">
              <div style="${blockTitleStyle}color:#0d47a1;">Payments Made (${fmt(emp.total_paid)})</div>
              ${payments.map(p => `<div style="${rowStyle}"><span>${payModeName(p.payment_mode)}${p.payment_date ? ` – ${new Date(p.payment_date).toLocaleDateString('en-IN')}` : ''}</span><strong style="color:#0d47a1;">${fmt(p.pay_salary)}</strong></div>`).join('')}
            </div>`;
        }

        // Calculation strip
        let calcParts = [`<span>Att. Salary: <strong>${fmt(emp.total_salary)}</strong></span>`];
        if (fmtRaw(emp.total_allowance_amount) > 0) calcParts.push(`<span style="color:#2e7d32;"> + Allowance: <strong>${fmt(emp.total_allowance_amount)}</strong></span>`);
        if (fmtRaw(emp.total_deduction_amount) > 0) calcParts.push(`<span style="color:#c62828;"> − Deduction: <strong>${fmt(emp.total_deduction_amount)}</strong></span>`);
        if (fmtRaw(emp.total_loan_amount) > 0) calcParts.push(`<span style="color:#e65100;"> − Loan: <strong>${fmt(emp.total_loan_amount)}</strong></span>`);
        if (fmtRaw(emp.total_advance_amount) > 0) calcParts.push(`<span style="color:#f57f17;"> − Advance: <strong>${fmt(emp.total_advance_amount)}</strong></span>`);
        if (fmtRaw(emp.total_holiday_amount) > 0) calcParts.push(`<span style="color:#6a1b9a;"> + Holiday: <strong>${fmt(emp.total_holiday_amount)}</strong></span>`);
        const calcStrip = `<div style="background:#f5f5f5;border:1px solid #ddd;padding:5px;margin-top:4px;font-size:11px;border-radius:3px;">
          ${calcParts.join('')} <span style="float:right;"><strong style="font-size:12px;color:#1b5e20;">= Net Payable: ${fmt(emp.net_payable)}</strong></span>
        </div>`;

        return `<tr style="background:#fafafa;">
          <td colspan="${mainHeaders.length}" style="padding:8px;border:1px solid #ddd;">
            <div style="display:flex;flex-wrap:wrap;gap:4px;">${blocks}</div>
            ${calcStrip}
          </td>
        </tr>`;
    };

    const tableHTML = `
<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%;font-family:Arial,sans-serif;font-size:12px;">
<tbody>
  <!-- Title -->
  <tr>
    <td colspan="${mainHeaders.length}" style="text-align:center;font-weight:bold;font-size:18px;padding:10px;border:2px solid #000;background:#000;color:#fff;">
      Paid Salary Report
    </td>
  </tr>
  <tr>
    <td colspan="${mainHeaders.length}" style="text-align:center;font-size:13px;padding:6px;border:1px solid #888;background:#f0f0f0;font-weight:bold;">
      ${ml}
    </td>
  </tr>
  <tr>
    <td colspan="${Math.ceil(mainHeaders.length / 2)}" style="padding:5px;border:1px solid #bbb;font-size:11px;color:#333;">
      Generated: ${new Date().toLocaleString()}
    </td>
    <td colspan="${Math.floor(mainHeaders.length / 2)}" style="padding:5px;border:1px solid #bbb;font-size:11px;color:#333;text-align:right;">
      Total Records: ${data.length}
    </td>
  </tr>
  <tr><td colspan="${mainHeaders.length}" style="border:none;height:8px;"></td></tr>

  <!-- Summary from API -->
  <tr>
    <td colspan="${mainHeaders.length}" style="font-weight:bold;font-size:13px;padding:6px;border:2px solid #000;background:#333;color:#fff;">
      Summary
    </td>
  </tr>
  <tr>
    <td colspan="2" style="padding:5px;border:1px solid #bbb;background:#f5f5f5;font-weight:bold;font-size:11px;">Total Employees</td>
    <td colspan="2" style="padding:5px;border:1px solid #bbb;font-weight:bold;">${apiSummary?.total_employees ?? data.length}</td>
    <td colspan="2" style="padding:5px;border:1px solid #bbb;background:#f1f8e9;font-weight:bold;">Total Allowances</td>
    <td colspan="2" style="padding:5px;border:1px solid #bbb;font-weight:bold;color:#2e7d32;">${fmt(apiSummary?.grand_total_allowance ?? GT.allowance)}</td>
    <td colspan="2" style="padding:5px;border:1px solid #bbb;background:#fce4e4;font-weight:bold;">Total Deductions</td>
    <td colspan="2" style="padding:5px;border:1px solid #bbb;font-weight:bold;color:#c62828;">${fmt(apiSummary?.grand_total_deduction ?? GT.deduction)}</td>
    <td style="border:1px solid #bbb;"></td>
    <td style="border:1px solid #bbb;"></td>
  </tr>
  <tr>
    <td colspan="2" style="padding:5px;border:1px solid #bbb;background:#fff3e0;font-weight:bold;">Total Loans</td>
    <td colspan="2" style="padding:5px;border:1px solid #bbb;font-weight:bold;color:#e65100;">${fmt(apiSummary?.grand_total_loan ?? GT.loan)}</td>
    <td colspan="2" style="padding:5px;border:1px solid #bbb;background:#fffde7;font-weight:bold;">Total Advance</td>
    <td colspan="2" style="padding:5px;border:1px solid #bbb;font-weight:bold;color:#f57f17;">${fmt(apiSummary?.grand_total_advance ?? GT.advance)}</td>
    <td colspan="2" style="padding:5px;border:1px solid #bbb;background:#e8f5e9;font-weight:bold;">Grand Net Payable</td>
    <td colspan="2" style="padding:5px;border:1px solid #bbb;font-weight:bold;color:#1b5e20;font-size:13px;">${fmt(apiSummary?.grand_net_payable ?? GT.netPayable)}</td>
    <td colspan="2" style="padding:5px;border:1px solid #bbb;font-weight:bold;">Total Paid: ${fmt(apiSummary?.grand_total_paid ?? GT.totalPaid)}</td>
  </tr>
  <tr><td colspan="${mainHeaders.length}" style="border:none;height:8px;"></td></tr>

  <!-- Table header -->
  <tr>
    ${mainHeaders.map(h => `<td style="background:#000;color:#fff;font-weight:bold;font-size:12px;padding:7px;border:2px solid #000;text-align:center;">${h}</td>`).join('')}
  </tr>

  <!-- Data rows + breakdown -->
  ${data.map((emp, i) => {
        const row = mainRows[i];
        const payLabel = emp.payment_status_label || 'Unpaid';
        const mainRowHTML = `<tr style="background:${i % 2 === 0 ? '#fff' : '#f8f8f8'};">
      ${row.map((cell, ci) => {
            const h = mainHeaders[ci];
            let style = 'border:1px solid #bbb;padding:6px;text-align:center;font-size:11px;';
            if (h === 'Employee Name') style += 'text-align:left;font-weight:bold;';
            if (h === 'Employee Code') style += 'font-weight:bold;';
            if (h === 'Net Payable') style += 'font-weight:bold;color:#1b5e20;';
            if (h === 'Total Paid' && cell !== '--') style += 'font-weight:bold;color:#0d47a1;';
            if (h === 'Payment Status') style += payStatusStyle(payLabel);
            if (plusCols.has(h) && cell !== '--') style += 'color:#2e7d32;';
            if (minusCols.has(h) && cell !== '--') style += 'color:#c62828;';
            const display = currencyCols.has(h) && cell !== '--' ? fmt(cell) : cell;
            return `<td style="${style}">${display}</td>`;
        }).join('')}
    </tr>`;
        return mainRowHTML + buildBreakdown(emp);
    }).join('')}

  <!-- Grand total row -->
  <tr style="background:#e0e0e0;border-top:3px solid #000;">
    ${mainHeaders.map((h, ci) => {
        let val = '';
        let style = 'border:2px solid #000;padding:7px;text-align:center;font-weight:bold;font-size:12px;background:#e0e0e0;';
        if (ci === 0) val = 'TOTAL';
        else if (h === 'Employee Name') { val = `${data.length} Employees`; style += 'text-align:left;'; }
        else if (h === 'Monthly Salary') val = fmt(GT.monthly);
        else if (h === 'Attendance Salary') val = fmt(GT.attSalary);
        else if (h === '+ Allowances') { val = GT.allowance > 0 ? fmt(GT.allowance) : '--'; style += 'color:#2e7d32;'; }
        else if (h === '- Deductions') { val = GT.deduction > 0 ? fmt(GT.deduction) : '--'; style += 'color:#c62828;'; }
        else if (h === '- Loan') { val = GT.loan > 0 ? fmt(GT.loan) : '--'; style += 'color:#e65100;'; }
        else if (h === '- Advance') { val = GT.advance > 0 ? fmt(GT.advance) : '--'; style += 'color:#f57f17;'; }
        else if (h === '+ Holiday') { val = GT.holiday > 0 ? fmt(GT.holiday) : '--'; style += 'color:#6a1b9a;'; }
        else if (h === 'Net Payable') { val = fmt(GT.netPayable); style += 'color:#1b5e20;font-size:13px;'; }
        else if (h === 'Total Paid') { val = GT.totalPaid > 0 ? fmt(GT.totalPaid) : '--'; style += 'color:#0d47a1;'; }
        return `<td style="${style}">${val}</td>`;
    }).join('')}
  </tr>
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