import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import {
  computeProLoanSimulationSummary,
  formatCurrencyEuro,
  type ProLoanSimulationForm
} from "@/lib/proLoanSimulation";

type PdfPalette = {
  navy: ReturnType<typeof rgb>;
  blue: ReturnType<typeof rgb>;
  ink: ReturnType<typeof rgb>;
  muted: ReturnType<typeof rgb>;
  line: ReturnType<typeof rgb>;
  card: ReturnType<typeof rgb>;
  positive: ReturnType<typeof rgb>;
  danger: ReturnType<typeof rgb>;
};

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN_X = 46;
const FOOTER_Y = 28;

const palette: PdfPalette = {
  navy: rgb(0.05, 0.14, 0.3),
  blue: rgb(0.11, 0.29, 0.58),
  ink: rgb(0.09, 0.12, 0.2),
  muted: rgb(0.39, 0.43, 0.5),
  line: rgb(0.84, 0.87, 0.92),
  card: rgb(0.97, 0.98, 1),
  positive: rgb(0.13, 0.52, 0.32),
  danger: rgb(0.73, 0.17, 0.16)
};

const sanitizeText = (value: string) =>
  value
    .replace(/’/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/—/g, "-")
    .replace(/\s+/g, " ")
    .trim();

const wrapText = (text: string, font: PDFFont, size: number, maxWidth: number) => {
  const words = sanitizeText(text).split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const trial = currentLine ? `${currentLine} ${word}` : word;
    const trialWidth = font.widthOfTextAtSize(trial, size);

    if (trialWidth <= maxWidth || !currentLine) {
      currentLine = trial;
      continue;
    }

    lines.push(currentLine);
    currentLine = word;
  }

  if (currentLine) lines.push(currentLine);
  return lines;
};

const drawWrappedText = ({
  page,
  text,
  x,
  y,
  maxWidth,
  size,
  lineHeight,
  font,
  color
}: {
  page: PDFPage;
  text: string;
  x: number;
  y: number;
  maxWidth: number;
  size: number;
  lineHeight: number;
  font: PDFFont;
  color: ReturnType<typeof rgb>;
}) => {
  const lines = wrapText(text, font, size, maxWidth);
  lines.forEach((line, index) => {
    page.drawText(line, {
      x,
      y: y - index * lineHeight,
      size,
      font,
      color
    });
  });

  return y - lines.length * lineHeight;
};

const fitText = (value: string, font: PDFFont, size: number, maxWidth: number) => {
  const source = sanitizeText(value || "-");
  if (font.widthOfTextAtSize(source, size) <= maxWidth) return source;

  let cut = source.length;
  while (cut > 0) {
    const candidate = `${source.slice(0, cut).trimEnd()}...`;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) return candidate;
    cut -= 1;
  }

  return "...";
};

const formatDateFr = (isoDate: string) => {
  if (!isoDate) return "Non renseignee";
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return isoDate;

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(parsed);
};

const drawFooter = ({ page, font }: { page: PDFPage; font: PDFFont }) => {
  const footerText =
    "Cabinet GP Finances - ORIAS 23003789 - RCS Nanterre 899 363 907 - Contact: gabriel.perbost@gp-finances.fr";

  page.drawLine({
    start: { x: MARGIN_X, y: FOOTER_Y + 10 },
    end: { x: PAGE_WIDTH - MARGIN_X, y: FOOTER_Y + 10 },
    thickness: 1,
    color: palette.line
  });

  page.drawText(footerText, {
    x: MARGIN_X,
    y: FOOTER_Y,
    size: 8,
    font,
    color: palette.muted
  });
};

const drawSectionCard = ({
  page,
  x,
  y,
  width,
  height,
  title,
  body,
  titleFont,
  bodyFont
}: {
  page: PDFPage;
  x: number;
  y: number;
  width: number;
  height: number;
  title: string;
  body: string;
  titleFont: PDFFont;
  bodyFont: PDFFont;
}) => {
  page.drawRectangle({
    x,
    y,
    width,
    height,
    borderWidth: 1,
    borderColor: palette.line,
    color: palette.card
  });

  page.drawText(title, {
    x: x + 14,
    y: y + height - 22,
    size: 12,
    font: titleFont,
    color: palette.navy
  });

  drawWrappedText({
    page,
    text: body,
    x: x + 14,
    y: y + height - 40,
    maxWidth: width - 28,
    size: 10,
    lineHeight: 13,
    font: bodyFont,
    color: palette.ink
  });
};

export const generateProLoanSimulationPdf = async (form: ProLoanSimulationForm) => {
  const summary = computeProLoanSimulationSummary(form);

  const pdf = await PDFDocument.create();
  const regularFont = await pdf.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold);

  const clientFullName = sanitizeText(`${form.clientFirstName} ${form.clientLastName}`.trim()) || "Client non renseigne";

  const coverPage = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  coverPage.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - 245,
    width: PAGE_WIDTH,
    height: 245,
    color: palette.navy
  });
  coverPage.drawCircle({
    x: PAGE_WIDTH - 42,
    y: PAGE_HEIGHT - 32,
    size: 62,
    color: rgb(0.18, 0.4, 0.72),
    opacity: 0.25
  });

  coverPage.drawText("Simulation Assurance de Pret", {
    x: MARGIN_X,
    y: PAGE_HEIGHT - 105,
    size: 32,
    font: boldFont,
    color: rgb(1, 1, 1)
  });

  coverPage.drawText("Professionnel & Premium", {
    x: MARGIN_X,
    y: PAGE_HEIGHT - 140,
    size: 24,
    font: boldFont,
    color: rgb(0.84, 0.92, 1)
  });

  coverPage.drawText(`Client: ${clientFullName}`, {
    x: MARGIN_X,
    y: PAGE_HEIGHT - 186,
    size: 12,
    font: regularFont,
    color: rgb(0.9, 0.94, 1)
  });

  coverPage.drawText(`Date de simulation: ${formatDateFr(form.meetingDate)}`, {
    x: MARGIN_X,
    y: PAGE_HEIGHT - 205,
    size: 11,
    font: regularFont,
    color: rgb(0.83, 0.9, 1)
  });

  coverPage.drawRectangle({
    x: MARGIN_X,
    y: PAGE_HEIGHT - 430,
    width: PAGE_WIDTH - MARGIN_X * 2,
    height: 155,
    borderWidth: 1,
    borderColor: rgb(0.76, 0.83, 0.96),
    color: rgb(0.96, 0.98, 1)
  });

  coverPage.drawText("Economies estimees sur la duree restante", {
    x: MARGIN_X + 24,
    y: PAGE_HEIGHT - 323,
    size: 14,
    font: regularFont,
    color: palette.blue
  });

  coverPage.drawText(formatCurrencyEuro(summary.grossSavingsTotal), {
    x: MARGIN_X + 24,
    y: PAGE_HEIGHT - 366,
    size: 38,
    font: boldFont,
    color: summary.grossSavingsTotal >= 0 ? palette.positive : palette.danger
  });

  coverPage.drawText(
    "Document d'aide a la decision realise par GP Finances pour comparer votre assurance actuelle et la nouvelle proposition.",
    {
      x: MARGIN_X + 24,
      y: PAGE_HEIGHT - 398,
      size: 10,
      font: regularFont,
      color: palette.muted
    }
  );

  drawSectionCard({
    page: coverPage,
    x: MARGIN_X,
    y: PAGE_HEIGHT - 648,
    width: PAGE_WIDTH - MARGIN_X * 2,
    height: 170,
    title: "Presentation GP Finances",
    body: `${form.advisorName || "Cabinet GP Finances"} accompagne la substitution d'assurance emprunteur avec une approche de conseil premium: audit des garanties, pilotage administratif, optimisation economique et suivi jusqu'a la mise en place finale.`,
    titleFont: boldFont,
    bodyFont: regularFont
  });

  drawFooter({ page: coverPage, font: regularFont });

  const detailPage = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  detailPage.drawText("Detail de la simulation", {
    x: MARGIN_X,
    y: PAGE_HEIGHT - 64,
    size: 24,
    font: boldFont,
    color: palette.navy
  });

  detailPage.drawText("Informations emprunteur et caracteristiques des prets", {
    x: MARGIN_X,
    y: PAGE_HEIGHT - 84,
    size: 10,
    font: regularFont,
    color: palette.muted
  });

  drawSectionCard({
    page: detailPage,
    x: MARGIN_X,
    y: PAGE_HEIGHT - 252,
    width: 240,
    height: 140,
    title: "Client et dossier",
    body: `Nom: ${clientFullName}\nSociete: ${form.clientCompany || "Non renseignee"}\nBanque actuelle: ${form.currentBank || "Non renseignee"}\nEmprunteur(s): ${form.borrowers.length}\nSource: ${
      form.importedSimulationMeta
        ? `${form.importedSimulationMeta.insurerName || "PDF import"} ${form.importedSimulationMeta.quoteReference || ""}`.trim()
        : "Saisie manuelle"
    }`,
    titleFont: boldFont,
    bodyFont: regularFont
  });

  const borrowerLines = form.borrowers
    .map((borrower, index) => {
      const guarantees = borrower.guarantees.length > 0 ? borrower.guarantees.join(" / ") : "Aucune";
      return `${index + 1}. ${borrower.firstName || "Prenom"} ${borrower.lastName || "Nom"} - ${borrower.age} ans - Quotite ${borrower.quota}% - ${guarantees}`;
    })
    .join("\n");

  drawSectionCard({
    page: detailPage,
    x: MARGIN_X + 252,
    y: PAGE_HEIGHT - 252,
    width: PAGE_WIDTH - MARGIN_X * 2 - 252,
    height: 140,
    title: "Garanties et quotites",
    body: borrowerLines,
    titleFont: boldFont,
    bodyFont: regularFont
  });

  const tableX = MARGIN_X;
  const tableTopY = PAGE_HEIGHT - 300;
  const rowHeight = 26;
  const columns = [
    { title: "Pret", width: 74 },
    { title: "Banque", width: 74 },
    { title: "CRD", width: 72 },
    { title: "Duree", width: 48 },
    { title: "Actuelle", width: 72 },
    { title: "Proposee", width: 72 },
    { title: "Economie", width: 91 }
  ];

  detailPage.drawRectangle({
    x: tableX,
    y: tableTopY,
    width: columns.reduce((sum, col) => sum + col.width, 0),
    height: rowHeight,
    color: palette.navy
  });

  let cursorX = tableX;
  for (const column of columns) {
    detailPage.drawText(column.title, {
      x: cursorX + 6,
      y: tableTopY + 8,
      size: 9,
      font: boldFont,
      color: rgb(1, 1, 1)
    });
    cursorX += column.width;
  }

  const displayedLoans = summary.loans.slice(0, 8);
  displayedLoans.forEach((loan, rowIndex) => {
    const rowY = tableTopY - rowHeight * (rowIndex + 1);
    const isEven = rowIndex % 2 === 0;

    detailPage.drawRectangle({
      x: tableX,
      y: rowY,
      width: columns.reduce((sum, col) => sum + col.width, 0),
      height: rowHeight,
      color: isEven ? rgb(0.98, 0.99, 1) : rgb(1, 1, 1),
      borderWidth: 1,
      borderColor: palette.line
    });

    const values = [
      loan.label || "-",
      loan.bank || "-",
      formatCurrencyEuro(loan.outstandingCapital),
      `${loan.remainingMonths} m`,
      formatCurrencyEuro(loan.currentInsuranceMonthly),
      formatCurrencyEuro(loan.proposedInsuranceMonthly),
      formatCurrencyEuro(loan.totalSavings)
    ];

    let rowCursorX = tableX;
    columns.forEach((column, index) => {
      const maxCellWidth = column.width - 10;
      const fitted = fitText(values[index], regularFont, 8.5, maxCellWidth);
      detailPage.drawText(fitted, {
        x: rowCursorX + 5,
        y: rowY + 8,
        size: 8.5,
        font: regularFont,
        color: palette.ink
      });
      rowCursorX += column.width;
    });
  });

  const tableBottomY = tableTopY - rowHeight * (displayedLoans.length + 1);

  if (summary.loans.length > displayedLoans.length) {
    detailPage.drawText(
      `+ ${summary.loans.length - displayedLoans.length} pret(s) supplementaire(s) non affiche(s) dans ce tableau.`,
      {
        x: MARGIN_X,
        y: tableBottomY - 14,
        size: 9,
        font: regularFont,
        color: palette.muted
      }
    );
  }

  drawWrappedText({
    page: detailPage,
    text: `Totaux: cout actuel ${formatCurrencyEuro(summary.currentRemainingCostTotal)} | cout propose ${formatCurrencyEuro(summary.proposedRemainingCostTotal)} | economie brute ${formatCurrencyEuro(summary.grossSavingsTotal)}.`,
    x: MARGIN_X,
    y: tableBottomY - 32,
    maxWidth: PAGE_WIDTH - MARGIN_X * 2,
    size: 10,
    lineHeight: 13,
    font: boldFont,
    color: palette.navy
  });

  drawFooter({ page: detailPage, font: regularFont });

  const synthesisPage = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  synthesisPage.drawText("Synthese budgetaire et feuille de route", {
    x: MARGIN_X,
    y: PAGE_HEIGHT - 64,
    size: 24,
    font: boldFont,
    color: palette.navy
  });

  const kpiCards = [
    { label: "Economie mensuelle", value: formatCurrencyEuro(summary.monthlySavings) },
    { label: "Economie annuelle", value: formatCurrencyEuro(summary.annualSavings) },
    { label: "Economie totale", value: formatCurrencyEuro(summary.grossSavingsTotal) },
    { label: "Gain net client", value: formatCurrencyEuro(summary.netGain) }
  ];

  const kpiWidth = (PAGE_WIDTH - MARGIN_X * 2 - 14) / 2;
  const kpiHeight = 102;

  kpiCards.forEach((kpi, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = MARGIN_X + col * (kpiWidth + 14);
    const y = PAGE_HEIGHT - 206 - row * (kpiHeight + 12);

    synthesisPage.drawRectangle({
      x,
      y,
      width: kpiWidth,
      height: kpiHeight,
      borderWidth: 1,
      borderColor: palette.line,
      color: rgb(0.98, 0.99, 1)
    });

    synthesisPage.drawText(kpi.label, {
      x: x + 14,
      y: y + 74,
      size: 10,
      font: regularFont,
      color: palette.muted
    });

    synthesisPage.drawText(kpi.value, {
      x: x + 14,
      y: y + 36,
      size: 20,
      font: boldFont,
      color: kpi.label === "Gain net client" && summary.netGain < 0 ? palette.danger : palette.navy
    });
  });

  drawSectionCard({
    page: synthesisPage,
    x: MARGIN_X,
    y: PAGE_HEIGHT - 452,
    width: PAGE_WIDTH - MARGIN_X * 2,
    height: 108,
    title: "Frais et rentabilite",
    body: `Frais de dossier: ${formatCurrencyEuro(summary.totalFees - form.fees.advisoryFees - form.fees.additionalFees)}\nHonoraires du cabinet: ${formatCurrencyEuro(form.fees.advisoryFees)}\nAutres frais: ${formatCurrencyEuro(form.fees.additionalFees)}\nPoint de rentabilite: ${summary.breakEvenMonths === null ? "non atteint" : `${summary.breakEvenMonths} mois`}`,
    titleFont: boldFont,
    bodyFont: regularFont
  });

  const scheduleRows = summary.globalSchedule.slice(0, 5);
  const scheduleX = MARGIN_X;
  const scheduleY = PAGE_HEIGHT - 596;
  const scheduleWidth = PAGE_WIDTH - MARGIN_X * 2;
  const scheduleHeight = 132;
  const scheduleColumns = [
    { title: "Annee", width: 52 },
    { title: "CRD", width: 128 },
    { title: "Actuelle/an", width: 118 },
    { title: "Proposee/an", width: 118 },
    { title: "Economie/an", width: 87 }
  ];
  const scheduleHeaderY = scheduleY + scheduleHeight - 40;
  const scheduleRowHeight = 15;

  synthesisPage.drawRectangle({
    x: scheduleX,
    y: scheduleY,
    width: scheduleWidth,
    height: scheduleHeight,
    borderWidth: 1,
    borderColor: palette.line,
    color: palette.card
  });

  synthesisPage.drawText("Echeancier global (emprunteur unique ou co-emprunteurs)", {
    x: scheduleX + 14,
    y: scheduleY + scheduleHeight - 22,
    size: 11,
    font: boldFont,
    color: palette.navy
  });

  synthesisPage.drawRectangle({
    x: scheduleX + 12,
    y: scheduleHeaderY,
    width: scheduleColumns.reduce((sum, col) => sum + col.width, 0),
    height: 16,
    color: rgb(0.93, 0.96, 1)
  });

  let scheduleCursorX = scheduleX + 12;
  scheduleColumns.forEach((column) => {
    synthesisPage.drawText(column.title, {
      x: scheduleCursorX + 4,
      y: scheduleHeaderY + 4,
      size: 8.5,
      font: boldFont,
      color: palette.navy
    });
    scheduleCursorX += column.width;
  });

  scheduleRows.forEach((row, index) => {
    const rowY = scheduleHeaderY - scheduleRowHeight * (index + 1);
    const values = [
      `A${row.year}`,
      formatCurrencyEuro(row.outstandingCapital),
      formatCurrencyEuro(row.annualCurrentInsurance),
      formatCurrencyEuro(row.annualProposedInsurance),
      formatCurrencyEuro(row.annualSavings)
    ];

    let rowCursorX = scheduleX + 12;
    scheduleColumns.forEach((column, valueIndex) => {
      const fitted = fitText(values[valueIndex], regularFont, 8.2, column.width - 8);
      synthesisPage.drawText(fitted, {
        x: rowCursorX + 4,
        y: rowY + 4,
        size: 8.2,
        font: regularFont,
        color: valueIndex === 4 && row.annualSavings < 0 ? palette.danger : palette.ink
      });
      rowCursorX += column.width;
    });
  });

  if (summary.globalSchedule.length > scheduleRows.length) {
    synthesisPage.drawText(`+ ${summary.globalSchedule.length - scheduleRows.length} annee(s) supplementaire(s)`, {
      x: scheduleX + 14,
      y: scheduleY + 10,
      size: 8.2,
      font: regularFont,
      color: palette.muted
    });
  }

  drawWrappedText({
    page: synthesisPage,
    text: "Etapes suivantes: 1) Validation finale garanties/quotites, 2) Dossier de delegation et signatures, 3) Transmission banque et suivi, 4) Verification de l'economie effective.",
    x: MARGIN_X,
    y: PAGE_HEIGHT - 742,
    maxWidth: PAGE_WIDTH - MARGIN_X * 2,
    size: 9,
    lineHeight: 12,
    font: regularFont,
    color: palette.ink
  });

  drawWrappedText({
    page: synthesisPage,
    text: "Mentions: simulation indicative et non contractuelle etablie sur la base des informations communiquees. Toute proposition definitive reste soumise a acceptation de l'assureur et de la banque.",
    x: MARGIN_X,
    y: PAGE_HEIGHT - 786,
    maxWidth: PAGE_WIDTH - MARGIN_X * 2,
    size: 8.5,
    lineHeight: 11,
    font: regularFont,
    color: palette.muted
  });

  drawFooter({ page: synthesisPage, font: regularFont });

  return pdf.save();
};
