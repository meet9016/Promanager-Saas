/**
 * Excel export for Detailed Attendance (DATE RANGE) - Black & White
 *
 * Fixes:
 * - Detects date from MANY key names (case-insensitive): date, attendance_date,
 *   report_date, att_date, Date, Attendance Date, etc.
 * - Parses many date formats: "YYYY-MM-DD", "DD-MM-YYYY", "28-Dec-2017",
 *   "Dec 26 2017", "26/12/2017".
 * - If still missing, you can force all rows into a single date via options.forceSingleDate
 *   (defaults to dateFrom).
 *
 * Usage (group already):
 *   exportDetailRangeToExcel(grouped, "2025-09-01", "2025-09-05");
 *
 * Usage (flat array; auto-group):
 *   exportDetailRangeToExcel(rows, "2025-09-01", "2025-09-05");
 *
 * Usage (flat array; no per-row date; force one):
 *   exportDetailRangeToExcel(rows, "2025-09-01", "2025-09-05", "att_range", {
 *     forceSingleDate: "2025-09-01"
 *   });
 */
export const exportDetailRangeToExcel = (
    dataOrGrouped,
    dateFrom,
    dateTo,
    filename = "detailed_daily_attendance_range",
    options = {}
) => {
    if (!dataOrGrouped || (Array.isArray(dataOrGrouped) && dataOrGrouped.length === 0)) {
        throw new Error("No data available to export");
    }

    // ---------- Options & helpers ----------
    const opt = {
        // Try these keys (case-insensitive) to extract date from a row
        dateKeyCandidates: [
            "date", "attendance_date", "report_date", "att_date",
            "attendanceDate", "Date", "Attendance Date", "attDate", "reportDate",
        ],
        // If row has no date, we can force a single date (string). Default: dateFrom.
        forceSingleDate: options.forceSingleDate ?? dateFrom,
        ...options,
    };

    const pad2 = (n) => (n < 10 ? `0${n}` : String(n));
    const toJSDate = (v) => (typeof v === "string" ? new Date(v) : v instanceof Date ? v : null);

    // Loose parser that tolerates many common formats
    const parseLooseDate = (input) => {
        if (!input) return null;

        // Direct Date or ISO-like
        const direct = toJSDate(input);
        if (direct && !isNaN(direct.getTime())) return direct;

        const str = String(input).trim();

        // Try YYYY-MM-DD or YYYY/MM/DD
        {
            const m = str.match(/^(\d{4})[-\/](\d{2})[-\/](\d{2})$/);
            if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
        }
        // Try DD-MM-YYYY or DD/MM/YYYY
        {
            const m = str.match(/^(\d{2})[-\/](\d{2})[-\/](\d{4})$/);
            if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
        }
        // Try 28-Dec-2017 (DD-Mon-YYYY)
        {
            const m = str.match(/^(\d{1,2})[-\s]([A-Za-z]{3})[-\s](\d{4})$/);
            if (m) {
                const mon = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]
                    .indexOf(m[2].toLowerCase());
                if (mon >= 0) return new Date(Number(m[3]), mon, Number(m[1]));
            }
        }
        // Try "Dec 26 2017" or "Dec 26, 2017"
        {
            const m = str.match(/^([A-Za-z]{3,})\s+(\d{1,2}),?\s+(\d{4})$/);
            if (m) {
                const mon = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"]
                    .indexOf(m[1].toLowerCase());
                if (mon >= 0) return new Date(Number(m[3]), mon, Number(m[2]));
                const mon3 = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]
                    .indexOf(m[1].slice(0, 3).toLowerCase());
                if (mon3 >= 0) return new Date(Number(m[3]), mon3, Number(m[2]));
            }
        }
        // Last resort: let Date try again (may be locale-dependent)
        const d = new Date(str);
        if (!isNaN(d.getTime())) return d;

        return null;
    };

    const fmtHdrDate = (d) =>
        parseLooseDate(d)?.toLocaleDateString("en-US", {
            month: "short", day: "2-digit", year: "numeric",
        }).replace(",", "") || String(d);

    const fmtAttendanceDate = (d) => {
        const dt = parseLooseDate(d);
        if (!dt) return String(d);
        return `${pad2(dt.getDate())}-${dt.toLocaleString("en-US", { month: "short" })}-${dt.getFullYear()}`;
    };

    const s = (v, fallback = "--") => {
        if (v === 0) return "0";
        if (v == null) return fallback;
        const str = String(v).trim();
        return str.length ? str : fallback;
    };
    const hourish = (v) => {
        const str = s(v, "");
        if (["0", "0.0", "0.00", "00:00", ""].includes(str)) return "--";
        return str;
    };
    const buildPunchRecords = (history) => {
        if (!Array.isArray(history) || history.length === 0) return "";
        const segs = [];

        history.forEach((record, index) => {
            const dateTime = (record.clock_date_time || "").trim();
            if (!dateTime) return;

            // Extract time from "30-10-2025 11:08 AM" format
            // Split by space and get last 2 parts (time and AM/PM)
            const parts = dateTime.split(" ");
            if (parts.length < 3) return; // Skip if format is unexpected

            const time = parts[parts.length - 2]; // "11:08"
            const period = parts[parts.length - 1]; // "AM" or "PM"
            const timePart = `${time} ${period}`;

            // Alternate: even index (0, 2, 4...) = IN, odd index (1, 3, 5...) = OUT
            const type = index % 2 === 0 ? "in" : "out";
            segs.push(`${timePart}:${type}`);
        });

        return segs.join(", ");
    };

    // Find a date value on a row using candidate keys (case-insensitive)
    const pickRowDate = (row) => {
        const keys = Object.keys(row || {});
        if (keys.length === 0) return null;
        const map = {};
        keys.forEach((k) => (map[k.toLowerCase()] = k));

        for (const cand of opt.dateKeyCandidates) {
            const k = map[cand.toLowerCase()];
            if (k && row[k] != null && String(row[k]).trim() !== "") {
                return row[k];
            }
        }
        return null;
    };

    // ---------- Normalize/group input ----------
    const grouped = {};

    if (Array.isArray(dataOrGrouped)) {
        // Flat list → group by discovered date; if none, force one date
        dataOrGrouped.forEach((row) => {
            let raw = pickRowDate(row);
            if (!raw && opt.forceSingleDate) raw = opt.forceSingleDate;

            const jsd = parseLooseDate(raw);
            if (!jsd) return; // skip rows w/out usable date

            const key = `${jsd.getFullYear()}-${pad2(jsd.getMonth() + 1)}-${pad2(jsd.getDate())}`; // YYYY-MM-DD
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(row);
        });
    } else {
        // Already grouped (object): try to coerce keys to valid dates
        Object.entries(dataOrGrouped).forEach(([k, rows]) => {
            const jsd = parseLooseDate(k);
            const key =
                jsd && !isNaN(jsd.getTime())
                    ? `${jsd.getFullYear()}-${pad2(jsd.getMonth() + 1)}-${pad2(jsd.getDate())}`
                    : k; // keep original if we can't parse
            grouped[key] = rows || [];
        });
    }

    const dateKeys = Object.keys(grouped).filter((k) => (grouped[k] || []).length > 0).sort();
    if (dateKeys.length === 0) {
        // Final safeguard: if all else fails, throw a more helpful message
        throw new Error(
            "No dated groups found to export. Tip: pass options.forceSingleDate or ensure rows include a date field (e.g., `attendance_date`)."
        );
    }

    // ---------- Build Excel rows (arrays) ----------
    const excelRows = [];

    // Report header (top)
    const hdrFrom = fmtHdrDate(dateFrom);
    const hdrTo = fmtHdrDate(dateTo);
    const printed = `${new Date().toLocaleDateString("en-US", {
        year: "numeric", month: "short", day: "2-digit",
    })} ${new Date().toLocaleTimeString()}`.replace(",", "");

    excelRows.push(["", "", `Daily Attendance Report (Detailed) ${hdrFrom}  To  ${hdrTo}`, "", "", "", "", "", "", "", "", "", "", "", ""]);
    excelRows.push(["", `Generated: ${printed}`, "", "", "", "", "", "", "", "", "", "", "", "", ""]);
    excelRows.push([""]); // spacer

    const COLS = [
        { key: "sno", label: "SNo" },
        { key: "employee_code", label: "E. Code" },
        { key: "employee_name", label: "Name" },
        { key: "shift_name", label: "Shift" },
        { key: "shift_from_time", label: "S. InTime" },
        { key: "shift_to_time", label: "S. OutTime" },
        { key: "attandance_first_clock_in", label: "A. InTime" },
        { key: "attandance_last_clock_out", label: "A. OutTime" },
        { key: "shift_working_hours", label: "Work Dur." },
        { key: "overtime_hours", label: "OT" },
        { key: "attandance_hours", label: "Tot. Dur." },
        { key: "late_hours", label: "Remain Hrs" },
        { key: "early_going_by", label: "EarlyGoingBy" },
        { key: "status", label: "Status" },
        { key: "punch_records", label: "Punch Records" },
    ];

    // Grand totals
    let grandTotal = 0,
        grandPresent = 0,
        grandAbsent = 0,
        grandWeekOff = 0,
        grandLate = 0,
        grandOT = 0;

    // For each date block
    dateKeys.forEach((dateKey, blockIdx) => {
        const rows = grouped[dateKey] || [];
        const dateTitle = `Attendance Date : ${fmtAttendanceDate(dateKey)}`;

        const presentCount = rows.filter((r) => (r.status || "").toLowerCase() === "present").length;
        const absentCount = rows.filter((r) => (r.status || "").toLowerCase() === "absent").length;
        const weekOffCount = rows.filter((r) => (r.status || "").toLowerCase() === "week off").length;
        const lateCount = rows.filter((r) => parseFloat(r.late_hours || 0) > 0).length;
        const overtimeCount = rows.filter((r) => parseFloat(r.overtime_hours || 0) > 0).length;

        grandTotal += rows.length;
        grandPresent += presentCount;
        grandAbsent += absentCount;
        grandWeekOff += weekOffCount;
        grandLate += lateCount;
        grandOT += overtimeCount;

        // Section title + summary
        excelRows.push([dateTitle]);


        // Headers
        excelRows.push(COLS.map((c) => c.label));

        // Body
        rows.forEach((row, idx) => {
            const adapted = {
                sno: row.sno ?? row["S.No."] ?? idx + 1,
                employee_code: s(row.employee_code || row["Employee Code"] || row["E. Code"], ""),
                employee_name:
                    s(
                        row.employee_name ||
                        row["Employee"] ||
                        row["Employee Name"] ||
                        `${row.employee_name || ""}${row.employee_code ? ` (${row.employee_code})` : ""}`,
                        ""
                    ),
                shift_name: s(row.shift_name || row["Shift"], ""),
                shift_from_time: s(row.shift_from_time || row["Shift Time"]?.split?.(" - ")?.[0], "--"),
                shift_to_time: s(row.shift_to_time || row["Shift Time"]?.split?.(" - ")?.[1], "--"),
                attandance_first_clock_in: s(row.attandance_first_clock_in || row["Clock In (First)"], "--"),
                attandance_last_clock_out: s(row.attandance_last_clock_out || row["Clock Out (Last)"], "--"),
                shift_working_hours: hourish(row.shift_working_hours || row["Working Hours"]),
                overtime_hours: hourish(row.overtime_hours || row["Overtime Hours"]),
                attandance_hours: hourish(row.attandance_hours || row["Attendance Hours"]),
                late_hours: hourish(row.late_hours || row["Remaining Hours"]),
                early_going_by: hourish(row.early_going_by || row["EarlyGoingBy"]),
                status: s(row.status || row["Status"], "N/A"),
                punch_records: buildPunchRecords(row.attendance_history),
            };

            excelRows.push(COLS.map((c) => adapted[c.key] ?? ""));
        });

        if (blockIdx !== dateKeys.length - 1) excelRows.push([""]); // spacer
    });

    // Grand Totals section
    excelRows.push([""]);
    excelRows.push([
        "Grand Totals", "", "Employees", grandTotal, "",
        "Present", grandPresent, "", "Absent", grandAbsent, "",
        "Week Off", grandWeekOff, "", "Late", grandLate, "", "Overtime", grandOT
    ]);

    // ---------- HTML (B/W theme) ----------
    const html = `
<table border="1" cellpadding="5" cellspacing="0" style="border-collapse:collapse;width:100%;font-family:Arial,sans-serif;border:2px solid #000;">
  <tbody>
    ${excelRows.map((row, rIdx) => `
      <tr>
        ${row.map((cell, cIdx) => {
        let st = "border:1px solid #000;padding:8px;text-align:center;";
        if (rIdx === 0 && cIdx === 2) {
            st += "font-weight:bold;font-size:18px;border:2px solid #000;";
        } else if (rIdx === 1 && cIdx === 1) {
            st += "font-weight:bold;font-size:13px;border:1px solid #666;text-align:left;";
        } else if (String(row[0] || "").startsWith("Attendance Date :") && cIdx === 0) {
            st += "font-weight:bold;font-size:14px;text-align:left;border:2px solid #000;background:#f5f5f5;";
        } else if (row[0] === "Summary Statistics" && cIdx === 0) {
            st += "font-weight:bold;text-align:left;border:2px solid #000;background:#f0f0f0;";
        } else if (
            Array.isArray(row) && row.length >= 5 &&
            row[0] === "SNo" && row[1] === "E. Code" && row[2] === "Name"
        ) {
            st += "background:#000;color:#fff;font-weight:bold;text-align:center;border:2px solid #000;font-size:13px;";
        }
        return `<td style="${st}">${cell != null ? cell : ""}</td>`;
    }).join("")}
      </tr>
    `).join("")}
  </tbody>
</table>`;

    const nameSuffix = `${fmtHdrDate(dateFrom)}_to_${fmtHdrDate(dateTo)}`.replace(/\s/g, "_");
    const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}_${nameSuffix}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
