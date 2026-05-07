import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { Ticket, Event, TicketCategory, Order } from '../drizzle/schema';

export interface TicketPDFData {
  ticket: Ticket;
  event: Event;
  category: TicketCategory;
  order: Order;
}

/**
 * Generate a PDF ticket with QR code
 * Returns base64 encoded PDF
 */
export async function generateTicketPDF(data: TicketPDFData): Promise<string> {
  const { ticket, event, category, order } = data;

  // Create new PDF document
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Set font
  doc.setFont('helvetica');

  // Add elegant header background
  doc.setFillColor(25, 25, 50); // Dark blue
  doc.rect(0, 0, 210, 40, 'F');

  // Add title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.text('OperaMix', 105, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text('Biglietto Evento', 105, 30, { align: 'center' });

  // Reset text color
  doc.setTextColor(0, 0, 0);

  // Event details section
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(event.title, 20, 55);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');

  // Event date
  const eventDate = new Date(event.eventDate);
  const formattedDate = eventDate.toLocaleDateString('it-IT', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = eventDate.toLocaleTimeString('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
  });

  doc.text(`Data: ${formattedDate}`, 20, 65);
  doc.text(`Ora: ${formattedTime}`, 20, 72);

  // Venue details
  doc.text(`Luogo: ${event.venueName}`, 20, 82);
  doc.text(`Indirizzo: ${event.venueAddress}`, 20, 89);
  doc.text(`Città: ${event.venueCity}`, 20, 96);

  // Separator line
  doc.setDrawColor(200, 200, 200);
  doc.line(20, 105, 190, 105);

  // Ticket details
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Dettagli Biglietto', 20, 115);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Categoria: ${category.name}`, 20, 125);
  doc.text(`Prezzo: €${category.price}`, 20, 132);
  doc.text(`Numero Ordine: ${order.orderNumber}`, 20, 139);

  if (ticket.holderName) {
    doc.text(`Intestatario: ${ticket.holderName}`, 20, 146);
  }

  // Generate QR code
  const qrCodeDataUrl = await QRCode.toDataURL(ticket.qrCode, {
    width: 200,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  });

  // Add QR code to PDF (centered)
  const qrSize = 60;
  const qrX = (210 - qrSize) / 2;
  doc.addImage(qrCodeDataUrl, 'PNG', qrX, 160, qrSize, qrSize);

  // QR code label
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.text('Scansiona questo codice QR all\'ingresso', 105, 230, { align: 'center' });

  // Ticket ID at bottom
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text(`ID Biglietto: ${ticket.id}`, 105, 280, { align: 'center' });
  doc.text(`Codice QR: ${ticket.qrCode}`, 105, 285, { align: 'center' });

  // Footer
  doc.setFontSize(9);
  doc.text('Conserva questo biglietto per l\'ingresso all\'evento', 105, 270, { align: 'center' });

  // Return base64 encoded PDF
  return doc.output('datauristring');
}

/**
 * Generate multiple tickets in a single PDF
 */
export async function generateMultipleTicketsPDF(ticketsData: TicketPDFData[]): Promise<string> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  for (let i = 0; i < ticketsData.length; i++) {
    if (i > 0) {
      doc.addPage();
    }

    const data = ticketsData[i];
    const { ticket, event, category, order } = data;

    // Set font
    doc.setFont('helvetica');

    // Add elegant header background
    doc.setFillColor(25, 25, 50);
    doc.rect(0, 0, 210, 40, 'F');

    // Add title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text('OperaMix', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text('Biglietto Evento', 105, 30, { align: 'center' });

    // Reset text color
    doc.setTextColor(0, 0, 0);

    // Event details
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(event.title, 20, 55);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');

    const eventDate = new Date(event.eventDate);
    const formattedDate = eventDate.toLocaleDateString('it-IT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const formattedTime = eventDate.toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit',
    });

    doc.text(`Data: ${formattedDate}`, 20, 65);
    doc.text(`Ora: ${formattedTime}`, 20, 72);
    doc.text(`Luogo: ${event.venueName}`, 20, 82);
    doc.text(`Indirizzo: ${event.venueAddress}`, 20, 89);
    doc.text(`Città: ${event.venueCity}`, 20, 96);

    doc.setDrawColor(200, 200, 200);
    doc.line(20, 105, 190, 105);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Dettagli Biglietto', 20, 115);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Categoria: ${category.name}`, 20, 125);
    doc.text(`Prezzo: €${category.price}`, 20, 132);
    doc.text(`Numero Ordine: ${order.orderNumber}`, 20, 139);

    if (ticket.holderName) {
      doc.text(`Intestatario: ${ticket.holderName}`, 20, 146);
    }

    // Generate QR code
    const qrCodeDataUrl = await QRCode.toDataURL(ticket.qrCode, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    const qrSize = 60;
    const qrX = (210 - qrSize) / 2;
    doc.addImage(qrCodeDataUrl, 'PNG', qrX, 160, qrSize, qrSize);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text('Scansiona questo codice QR all\'ingresso', 105, 230, { align: 'center' });

    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(`ID Biglietto: ${ticket.id}`, 105, 280, { align: 'center' });
    doc.text(`Codice QR: ${ticket.qrCode}`, 105, 285, { align: 'center' });

    doc.setFontSize(9);
    doc.text('Conserva questo biglietto per l\'ingresso all\'evento', 105, 270, { align: 'center' });

    // Add page number if multiple tickets
    if (ticketsData.length > 1) {
      doc.setFontSize(8);
      doc.text(`Biglietto ${i + 1} di ${ticketsData.length}`, 105, 290, { align: 'center' });
    }
  }

  return doc.output('datauristring');
}
