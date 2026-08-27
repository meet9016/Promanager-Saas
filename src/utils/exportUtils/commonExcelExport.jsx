import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export const EXCEL_COLORS = {
    primaryDark: '3B0764',
    primary: '4C1D95',
    purpleLight: 'F3E8FF',
    purpleBorder: 'D8B4FE',
    zebraBg: 'FAF5FF',
    textDark: '1E1B4B',
    textWhite: 'FFFFFF',
    activeBg: 'DCFCE7',
    activeText: '15803D',
    inactiveBg: 'FEE2E2',
    inactiveText: 'B91C1C',
};

/**
 * Common Styled Excel Export Function for ProManager SaaS
 */
export const exportToStyledExcel = async ({
    title = 'REPORT',
    companyName = 'Your Company Name',
    dateRangeText = '',
    summaryCards = [],
    headers = [],
    data = [],
    filename = 'report',
    sheetName = 'Report',
}) => {
    if (!data || data.length === 0) {
        throw new Error('No data available to export');
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    // 1. Determine columns and keys
    let colKeys = [];
    let colLabels = [];

    if (headers.length > 0 && typeof headers[0] === 'object') {
        colKeys = headers.map((h) => h.key);
        colLabels = headers.map((h) => h.label);
    } else if (headers.length > 0) {
        colLabels = headers;
        colKeys = headers;
    } else {
        colKeys = Object.keys(data[0]);
        colLabels = colKeys;
    }

    const totalCols = Math.max(colLabels.length, 6);

    // 2. Title Banner Row (Rows 1-2 merged)
    worksheet.mergeCells(1, 1, 2, totalCols);
    const titleCell = worksheet.getCell(1, 1);
    titleCell.value = `${companyName.toUpperCase()} — ${title.toUpperCase()}`;
    titleCell.font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B0764' } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

    // 3. Subheader Date & Metadata (Row 3)
    worksheet.mergeCells(3, 1, 3, totalCols);
    const subCell = worksheet.getCell(3, 1);
    const genDate = new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    subCell.value = `Generated on: ${genDate}${dateRangeText ? `   |   ${dateRangeText}` : ''}`;
    subCell.font = { name: 'Arial', size: 9, italic: true, color: { argb: 'FF475569' } };
    subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    subCell.alignment = { vertical: 'middle', horizontal: 'center' };

    let currentRowIdx = 5;

    // 4. Summary Cards Section (if provided)
    if (summaryCards && summaryCards.length > 0) {
        worksheet.mergeCells(currentRowIdx, 1, currentRowIdx, totalCols);
        const sumHeader = worksheet.getCell(currentRowIdx, 1);
        sumHeader.value = 'SUMMARY OVERVIEW';
        sumHeader.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF3B0764' } };
        sumHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3E8FF' } };
        sumHeader.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
        currentRowIdx++;

        const cardRow = worksheet.getRow(currentRowIdx);
        cardRow.height = 22;
        summaryCards.forEach((card, cIdx) => {
            const cell = cardRow.getCell(cIdx + 1);
            cell.value = `${card.label}: ${card.value}`;
            cell.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FF4C1D95' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFAF5FF' } };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.border = {
                top: { style: 'thin', color: { argb: 'FFD8B4FE' } },
                bottom: { style: 'thin', color: { argb: 'FFD8B4FE' } },
                left: { style: 'thin', color: { argb: 'FFD8B4FE' } },
                right: { style: 'thin', color: { argb: 'FFD8B4FE' } },
            };
        });
        currentRowIdx += 2;
    }

    // 5. Table Header Row
    const headerRow = worksheet.getRow(currentRowIdx);
    headerRow.height = 24;
    colLabels.forEach((label, idx) => {
        const cell = headerRow.getCell(idx + 1);
        cell.value = label;
        cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4C1D95' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
            top: { style: 'medium', color: { argb: 'FF3B0764' } },
            bottom: { style: 'medium', color: { argb: 'FF3B0764' } },
            left: { style: 'thin', color: { argb: 'FFD8B4FE' } },
            right: { style: 'thin', color: { argb: 'FFD8B4FE' } },
        };
    });
    currentRowIdx++;

    // 6. Data Rows
    data.forEach((rowObj, rIdx) => {
        const row = worksheet.getRow(currentRowIdx);
        row.height = 20;
        const isZebra = rIdx % 2 === 1;

        colKeys.forEach((key, colIdx) => {
            const cell = row.getCell(colIdx + 1);
            const rawVal = typeof rowObj === 'object' ? rowObj[key] : rowObj;
            const val = (rawVal === null || rawVal === undefined) ? '' : rawVal;
            cell.value = val;

            // Base font & alignment
            let cellFillHex = isZebra ? 'FFFAF5FF' : 'FFFFFFFF';
            let cellFontColor = 'FF1E1B4B';
            let isBold = false;

            // Status cell styling
            const sStr = String(val).trim().toLowerCase();
            const isStatusKey = key === 'Status' || key === 'status' || String(key).startsWith('day_') || String(key).startsWith('Day');
            if (isStatusKey) {
                if (sStr === 'active' || sStr === '1' || sStr === 'present' || sStr === 'p' || sStr === 'p/inc' || sStr === 'wop') {
                    cellFillHex = 'FFDCFCE7';
                    cellFontColor = 'FF15803D';
                    isBold = true;
                } else if (sStr === 'inactive' || sStr === '2' || sStr === 'absent' || sStr === 'a') {
                    cellFillHex = 'FFFEE2E2';
                    cellFontColor = 'FFB91C1C';
                    isBold = true;
                } else if (sStr === 'week off' || sStr === 'half day' || sStr === 'leave' || sStr === 'wo' || sStr === '½p' || sStr === '1/2p' || sStr === 'halfp' || sStr === 'l' || sStr === 'h' || sStr === 'hp') {
                    cellFillHex = 'FFFEF3C7';
                    cellFontColor = 'FFB45309';
                    isBold = true;
                }
            }

            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: cellFillHex } };
            cell.font = { name: 'Arial', size: 9, bold: isBold, color: { argb: cellFontColor } };
            cell.alignment = { vertical: 'middle', horizontal: typeof val === 'number' ? 'right' : 'center' };

            cell.border = {
                top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            };
        });

        currentRowIdx++;
    });

    // 7. Auto Column Widths
    colLabels.forEach((label, idx) => {
        let maxLen = (label || '').toString().length;
        data.forEach((rowObj) => {
            const k = colKeys[idx];
            const val = rowObj ? (typeof rowObj === 'object' ? rowObj[k] : rowObj) : '';
            if (val !== null && val !== undefined) {
                maxLen = Math.max(maxLen, String(val).length);
            }
        });
        const targetCol = worksheet.getColumn(idx + 1);
        targetCol.width = Math.min(Math.max(maxLen + 4, 12), 40);
    });

    // Generate buffer & trigger download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const cleanFileName = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
    saveAs(blob, cleanFileName);
};
