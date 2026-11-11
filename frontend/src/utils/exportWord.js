const COLORS = {
  primary: "B4232F",
  dark: "261417",
  pale: "F8ECEE",
  border: "D8C9CC",
  white: "FFFFFF",
  muted: "66585B"
};

const chartColors = {
  pending: "#d97706", approved: "#1677e8", completed: "#0d9b63",
  rejected: "#d92d20", cancelled: "#64748b", waiting: "#d97706",
  called: "#1677e8", serving: "#7c3aed", skipped: "#64748b"
};

const reportDate = () => new Intl.DateTimeFormat("en-PH", {
  timeZone: "Asia/Manila", year: "numeric", month: "long", day: "numeric",
  hour: "numeric", minute: "2-digit"
}).format(new Date());

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const createChartImage = async (title, statuses, data) => {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 570;
  const context = canvas.getContext("2d");
  const counts = new Map((data || []).map((item) => [item._id || "unknown", item.count]));
  const values = statuses.map((status) => ({ status, count: counts.get(status) || 0 }));
  const maximum = Math.max(...values.map(({ count }) => count), 1);

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#261417";
  context.font = "bold 38px Arial";
  context.fillText(title, 55, 65);
  context.fillStyle = "#66585b";
  context.font = "22px Arial";
  context.fillText("Distribution by current status", 55, 100);

  values.forEach(({ status, count }, index) => {
    const y = 150 + index * 76;
    const width = Math.max((count / maximum) * 760, count ? 12 : 0);
    context.fillStyle = "#4c353a";
    context.font = "bold 23px Arial";
    context.fillText(status.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()), 55, y + 27);
    context.fillStyle = "#f3e6e8";
    context.fillRect(250, y, 760, 34);
    context.fillStyle = chartColors[status] || "#b4232f";
    context.fillRect(250, y, width, 34);
    context.fillStyle = "#261417";
    context.font = "bold 24px Arial";
    context.fillText(String(count), 1040, y + 27);
  });

  const response = await fetch(canvas.toDataURL("image/png"));
  return new Uint8Array(await response.arrayBuffer());
};

export const exportAnalyticsDocx = async ({ report, generatedBy, filename, appointmentStatuses, queueStatuses }) => {
  const docx = await import("docx");
  const {
    AlignmentType, BorderStyle, Document, HeadingLevel, ImageRun, Packer,
    Paragraph, ShadingType, Table, TableCell, TableRow, TextRun, WidthType
  } = docx;

  const appointmentChart = await createChartImage("Appointment Statuses", appointmentStatuses, report.appointmentStatuses);
  const queueChart = await createChartImage("Queue Statuses", queueStatuses, report.queueStatuses);
  const border = { style: BorderStyle.SINGLE, size: 1, color: COLORS.border };
  const cellBorders = { top: border, bottom: border, left: border, right: border };
  const totals = [
    ["Total Users", report.totals.users], ["Total Patients", report.totals.patients],
    ["Appointments", report.totals.appointments], ["Queue Tickets", report.totals.queueTickets],
    ["Low / Out of Stock", report.totals.lowStock]
  ];

  const summaryTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: totals.map(([label]) => new TableCell({
        shading: { fill: COLORS.primary, type: ShadingType.CLEAR }, borders: cellBorders,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: label, bold: true, color: COLORS.white, size: 18 })] })]
      })) }),
      new TableRow({ children: totals.map(([, value]) => new TableCell({
        shading: { fill: COLORS.pale, type: ShadingType.CLEAR }, borders: cellBorders,
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(value), bold: true, color: COLORS.dark, size: 28 })] })]
      })) })
    ]
  });

  const signatureTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: ["Prepared by", "Reviewed by", "Approved by"].map((label, index) => new TableCell({
        borders: { top: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, bottom: border },
        children: [new Paragraph({ spacing: { before: 700 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: index === 0 ? generatedBy || " " : " ", bold: true })] }), new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: label, italics: true, color: COLORS.muted })] })]
      })) })
    ]
  });

  const documentFile = new Document({
    creator: "Barangay Pag-Asa Health Center",
    title: "Reports and Analytics",
    sections: [{
      properties: { page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } } },
      children: [
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "BARANGAY PAG-ASA HEALTH CENTER", bold: true, color: COLORS.primary, size: 34 })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, heading: HeadingLevel.TITLE, children: [new TextRun({ text: "Reports and Analytics", bold: true, color: COLORS.dark })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 240 }, children: [new TextRun({ text: "Operational performance and service-status summary", italics: true, color: COLORS.muted })] }),
        new Paragraph({ children: [new TextRun({ text: "Generated: ", bold: true }), new TextRun(reportDate())] }),
        new Paragraph({ spacing: { after: 260 }, children: [new TextRun({ text: "Prepared by: ", bold: true }), new TextRun(generatedBy || "Health Center Administrator")] }),
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: "Executive Summary", color: COLORS.primary })] }),
        summaryTable,
        new Paragraph({ spacing: { before: 300 }, heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: "Visual Analytics", color: COLORS.primary })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new ImageRun({ data: appointmentChart, type: "png", transformation: { width: 650, height: 309 } })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new ImageRun({ data: queueChart, type: "png", transformation: { width: 650, height: 309 } })] }),
        new Paragraph({ spacing: { before: 260 }, heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: "Certification", color: COLORS.primary })] }),
        new Paragraph({ children: [new TextRun("The figures in this report reflect the records available in the health center system at the generation time shown above.")] }),
        signatureTable
      ]
    }]
  });

  downloadBlob(await Packer.toBlob(documentFile), filename);
};
