const COLORS = {
  primary: "B4232F",
  dark: "261417",
  pale: "F8ECEE",
  border: "D8C9CC",
  stripe: "FCF7F8",
  white: "FFFFFF",
  muted: "66585B"
};

const formatReportDate = (date = new Date()) => new Intl.DateTimeFormat("en-PH", {
  timeZone: "Asia/Manila",
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit"
}).format(date);

const downloadWorkbook = async (workbook, filename) => {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const addSignatureBlock = (worksheet, startRow, reportWidth, generatedBy) => {
  const groups = [
    { start: 1, end: 2, label: "Prepared by", name: generatedBy || "" },
    { start: 3, end: 4, label: "Reviewed by", name: "" },
    { start: 5, end: 6, label: "Approved by", name: "" }
  ];

  groups.forEach(({ start, end, label, name }) => {
    if (start > reportWidth) return;
    const safeEnd = Math.min(end, reportWidth);
    worksheet.mergeCells(startRow, start, startRow, safeEnd);
    worksheet.mergeCells(startRow + 1, start, startRow + 1, safeEnd);
    worksheet.mergeCells(startRow + 2, start, startRow + 2, safeEnd);

    const signatureCell = worksheet.getCell(startRow, start);
    signatureCell.border = { bottom: { style: "thin", color: { argb: COLORS.dark } } };
    worksheet.getCell(startRow + 1, start).value = name;
    worksheet.getCell(startRow + 2, start).value = label;

    [startRow, startRow + 1, startRow + 2].forEach((rowNumber) => {
      const cell = worksheet.getCell(rowNumber, start);
      cell.alignment = { horizontal: "center", vertical: "middle" };
    });
    worksheet.getCell(startRow + 1, start).font = { bold: true, size: 10, color: { argb: COLORS.dark } };
    worksheet.getCell(startRow + 2, start).font = { italic: true, size: 9, color: { argb: COLORS.muted } };
  });
};

export const exportToExcel = async ({ filename, title, subtitle, columns, rows, generatedBy, summary = [] }) => {
  const excelModule = await import("exceljs");
  const ExcelJS = excelModule.default || excelModule;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Barangay Pag-Asa Health Center";
  workbook.company = "Barangay Pag-Asa Health Center";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet("Report", {
    pageSetup: {
      orientation: columns.length > 5 ? "landscape" : "portrait",
      paperSize: 9,
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.35, right: 0.35, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 }
    },
    properties: { defaultRowHeight: 20 }
  });

  const reportWidth = Math.max(columns.length, 6);
  worksheet.columns = Array.from({ length: reportWidth }, (_, index) => ({
    width: columns[index]?.width || 18
  }));
  worksheet.mergeCells(1, 1, 1, reportWidth);
  worksheet.mergeCells(2, 1, 2, reportWidth);
  worksheet.mergeCells(3, 1, 3, reportWidth);

  worksheet.getCell("A1").value = "BARANGAY PAG-ASA HEALTH CENTER";
  worksheet.getCell("A1").font = { bold: true, size: 18, color: { argb: COLORS.white } };
  worksheet.getCell("A1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.dark } };
  worksheet.getCell("A1").alignment = { horizontal: "center", vertical: "middle" };
  worksheet.getRow(1).height = 32;

  worksheet.getCell("A2").value = title;
  worksheet.getCell("A2").font = { bold: true, size: 14, color: { argb: COLORS.primary } };
  worksheet.getCell("A2").alignment = { horizontal: "center", vertical: "middle" };
  worksheet.getRow(2).height = 26;

  worksheet.getCell("A3").value = subtitle;
  worksheet.getCell("A3").font = { italic: true, size: 10, color: { argb: COLORS.muted } };
  worksheet.getCell("A3").alignment = { horizontal: "center" };

  worksheet.getCell("A5").value = "Generated:";
  worksheet.getCell("B5").value = formatReportDate();
  worksheet.getCell("A6").value = "Total records:";
  worksheet.getCell("B6").value = rows.length;
  worksheet.getCell("A5").font = worksheet.getCell("A6").font = { bold: true, color: { argb: COLORS.dark } };

  summary.slice(0, 3).forEach(({ label, value }, index) => {
    const column = 3 + index;
    worksheet.getCell(5, column).value = label;
    worksheet.getCell(5, column).font = { bold: true, color: { argb: COLORS.dark } };
    worksheet.getCell(6, column).value = value;
  });

  const headerRowNumber = 8;
  const headerRow = worksheet.getRow(headerRowNumber);
  headerRow.values = columns.map((column) => column.label);
  headerRow.height = 26;
  headerRow.eachCell((cell, columnNumber) => {
    if (columnNumber > columns.length) return;
    cell.font = { bold: true, color: { argb: COLORS.white } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.primary } };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = { bottom: { style: "medium", color: { argb: COLORS.dark } } };
  });

  rows.forEach((row, rowIndex) => {
    const excelRow = worksheet.addRow(columns.map((column) => column.value(row)));
    excelRow.height = 22;
    excelRow.eachCell((cell, columnNumber) => {
      cell.alignment = {
        horizontal: columns[columnNumber - 1]?.align || "left",
        vertical: "middle",
        wrapText: true
      };
      cell.border = {
        bottom: { style: "hair", color: { argb: COLORS.border } }
      };
      if (rowIndex % 2 === 1) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.stripe } };
      }
    });
  });

  worksheet.autoFilter = {
    from: { row: headerRowNumber, column: 1 },
    to: { row: headerRowNumber, column: columns.length }
  };
  worksheet.views = [{ state: "frozen", ySplit: headerRowNumber, activeCell: "A9" }];

  const signatureStart = worksheet.rowCount + 4;
  worksheet.getRow(signatureStart).height = 38;
  addSignatureBlock(worksheet, signatureStart, reportWidth, generatedBy);

  const finalRow = signatureStart + 2;
  worksheet.pageSetup.printArea = `A1:${worksheet.getColumn(reportWidth).letter}${finalRow}`;
  worksheet.headerFooter.oddFooter = "&LBarangay Pag-Asa Health Center&COfficial System Report&RPage &P of &N";

  await downloadWorkbook(workbook, filename);
};

export const exportDateStamp = () => new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Manila",
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
}).format(new Date());
