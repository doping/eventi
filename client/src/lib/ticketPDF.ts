import jsPDF from "jspdf";
import QRCode from "qrcode";

export interface TicketData {
  qrCode: string;
  holderName: string | null;
  holderEmail: string | null;
  eventTitle: string;
  eventDate: Date | string;
  venueName: string;
  venueCity: string;
  venueAddress?: string | null;
  categoryName: string;
  categoryPrice: string;
  orderNumber: string;
  ticketIndex: number;
  totalTickets: number;
}

/**
 * Generates a professional PDF ticket with QR code using jsPDF.
 * All rendering is done client-side — no server dependency.
 */
export async function generateTicketPDF(tickets: TicketData[]): Promise<void> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  for (let i = 0; i < tickets.length; i++) {
    const ticket = tickets[i];
    if (i > 0) doc.addPage();

    await renderTicketPage(doc, ticket);
  }

  const filename =
    tickets.length === 1
      ? `biglietto-${tickets[0].orderNumber}-${tickets[0].ticketIndex}.pdf`
      : `biglietti-${tickets[0].orderNumber}.pdf`;

  doc.save(filename);
}

async function renderTicketPage(doc: jsPDF, ticket: TicketData): Promise<void> {
  const pageW = 210;
  const pageH = 297;

  // ── Background ──────────────────────────────────────────────────
  // Deep navy header band
  doc.setFillColor(26, 26, 74); // #1a1a4a
  doc.rect(0, 0, pageW, 60, "F");

  // Light cream body
  doc.setFillColor(252, 250, 245); // #fcfaf5
  doc.rect(0, 60, pageW, pageH - 60, "F");

  // Decorative gold accent line under header
  doc.setFillColor(212, 175, 55); // #d4af37 gold
  doc.rect(0, 58, pageW, 3, "F");

  // ── Header Content ───────────────────────────────────────────────
  // Logo / Brand
  doc.setTextColor(212, 175, 55); // gold
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("♪  EVENTIPRO", 15, 18);

  // Event title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  const titleLines = doc.splitTextToSize(ticket.eventTitle, 130);
  doc.text(titleLines, 15, 32);

  // Category badge
  doc.setFillColor(212, 175, 55);
  doc.roundedRect(15, 46, 60, 8, 2, 2, "F");
  doc.setTextColor(26, 26, 74);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(ticket.categoryName.toUpperCase(), 45, 51.5, { align: "center" });

  // ── QR Code ──────────────────────────────────────────────────────
  const qrDataUrl = await QRCode.toDataURL(ticket.qrCode, {
    width: 400,
    margin: 1,
    color: { dark: "#1a1a4a", light: "#ffffff" },
  });

  // QR code box (right side)
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(148, 68, 50, 50, 3, 3, "F");
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.8);
  doc.roundedRect(148, 68, 50, 50, 3, 3, "S");
  doc.addImage(qrDataUrl, "PNG", 150, 70, 46, 46);

  // QR label
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("Mostra all'ingresso", 173, 124, { align: "center" });

  // QR code value (small monospace)
  doc.setFontSize(6);
  doc.setTextColor(140, 140, 140);
  doc.text(ticket.qrCode, 173, 129, { align: "center" });

  // ── Event Details ────────────────────────────────────────────────
  const detailX = 15;
  let y = 80;

  // Date & Time
  const eventDate = new Date(ticket.eventDate);
  const dateStr = eventDate.toLocaleDateString("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeStr = eventDate.toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
  });

  drawDetailRow(doc, detailX, y, "DATA", `${dateStr} — ore ${timeStr}`);
  y += 20;

  // Venue
  drawDetailRow(doc, detailX, y, "LUOGO", ticket.venueName);
  y += 12;
  if (ticket.venueAddress) {
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`${ticket.venueAddress}, ${ticket.venueCity}`, detailX + 2, y);
    y += 10;
  } else {
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(ticket.venueCity, detailX + 2, y);
    y += 10;
  }

  // Holder
  if (ticket.holderName) {
    drawDetailRow(doc, detailX, y, "INTESTATARIO", ticket.holderName);
    y += 14;
  }

  // Price
  const price = parseFloat(ticket.categoryPrice);
  drawDetailRow(
    doc,
    detailX,
    y,
    "PREZZO",
    price === 0 ? "Gratuito" : `€ ${price.toFixed(2)}`
  );
  y += 14;

  // ── Divider (perforated style) ───────────────────────────────────
  y = 145;
  doc.setDrawColor(200, 190, 170);
  doc.setLineWidth(0.3);
  doc.setLineDashPattern([2, 2], 0);
  doc.line(15, y, 195, y);
  doc.setLineDashPattern([], 0);

  // Scissors icon hint
  doc.setTextColor(180, 170, 150);
  doc.setFontSize(7);
  doc.text("✂  Ritaglia qui", 15, y + 4);

  // ── Bottom Stub ──────────────────────────────────────────────────
  y += 12;

  // Order info
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("ORDINE", 15, y);
  doc.setFont("helvetica", "normal");
  doc.text(ticket.orderNumber, 45, y);

  doc.setFont("helvetica", "bold");
  doc.text("BIGLIETTO", 100, y);
  doc.setFont("helvetica", "normal");
  doc.text(`${ticket.ticketIndex} di ${ticket.totalTickets}`, 130, y);

  y += 10;

  // Instructions box
  doc.setFillColor(240, 235, 220);
  doc.roundedRect(15, y, 180, 28, 2, 2, "F");

  doc.setTextColor(60, 60, 60);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("ISTRUZIONI PER L'INGRESSO", 105, y + 7, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);
  const instructions = [
    "• Presenta questo biglietto (digitale o stampato) all'ingresso",
    "• Il QR code verrà scansionato dal personale per la validazione",
    "• Ogni biglietto è valido per una sola persona e un solo ingresso",
  ];
  instructions.forEach((line, idx) => {
    doc.text(line, 20, y + 14 + idx * 5);
  });

  y += 35;

  // ── Footer ───────────────────────────────────────────────────────
  doc.setFillColor(26, 26, 74);
  doc.rect(0, pageH - 18, pageW, 18, "F");

  doc.setTextColor(212, 175, 55);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("OperaMix", 15, pageH - 9);

  doc.setTextColor(180, 180, 200);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(
    "Biglietto generato elettronicamente — Non sono necessarie firme o timbri",
    105,
    pageH - 9,
    { align: "center" }
  );

  doc.setTextColor(140, 140, 160);
  doc.text(`Emesso: ${new Date().toLocaleDateString("it-IT")}`, 195, pageH - 9, {
    align: "right",
  });
}

function drawDetailRow(
  doc: jsPDF,
  x: number,
  y: number,
  label: string,
  value: string
): void {
  // Label
  doc.setTextColor(26, 26, 74);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.text(label, x, y);

  // Gold underline for label
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.5);
  doc.line(x, y + 1, x + doc.getTextWidth(label), y + 1);

  // Value
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  const valueLines = doc.splitTextToSize(value, 120);
  doc.text(valueLines, x + 2, y + 8);
}
