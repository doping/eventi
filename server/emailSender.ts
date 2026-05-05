import nodemailer from "nodemailer";

// ============================================================
// EMAIL SENDER HELPER
// Usa le credenziali SMTP configurate nelle variabili d'ambiente.
// Se non configurate, logga un warning e non invia.
// ============================================================

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export const SMTP_FROM = process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@eventipro.it";

// ============================================================
// TEMPLATE EMAIL ACQUIRENTE
// ============================================================

export function buildBuyerEmailHtml(params: {
  buyerName: string;
  orderNumber: string;
  eventTitle: string;
  eventDate: string;
  eventVenue: string;
  tickets: { qrCode: string; categoryName: string; holderName: string | null }[];
  totalAmount: string;
  siteName: string;
  siteUrl: string;
}): string {
  const ticketRows = params.tickets
    .map(
      (t, i) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#374151;">${i + 1}. ${t.categoryName}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#374151;">${t.holderName || params.buyerName}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-family:monospace;font-size:12px;color:#6b7280;">${t.qrCode}</td>
      </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        
        <!-- HEADER -->
        <tr>
          <td style="background:linear-gradient(135deg,#1e1b4b 0%,#3730a3 100%);padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#fbbf24;font-size:28px;font-weight:700;letter-spacing:1px;">${params.siteName}</h1>
            <p style="margin:8px 0 0;color:#c7d2fe;font-size:14px;">Conferma Acquisto Biglietti</p>
          </td>
        </tr>

        <!-- BODY -->
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 16px;color:#111827;font-size:16px;">Ciao <strong>${params.buyerName}</strong>,</p>
            <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
              Il tuo acquisto è stato completato con successo! Di seguito trovi i dettagli del tuo ordine e i codici QR dei biglietti.
            </p>

            <!-- RIEPILOGO ORDINE -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f7ff;border-radius:8px;margin-bottom:28px;">
              <tr>
                <td style="padding:20px 24px;">
                  <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Riepilogo Ordine</p>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:4px 0;color:#374151;font-size:14px;">Numero ordine</td>
                      <td style="padding:4px 0;text-align:right;font-weight:600;color:#1e1b4b;font-family:monospace;">${params.orderNumber}</td>
                    </tr>
                    <tr>
                      <td style="padding:4px 0;color:#374151;font-size:14px;">Evento</td>
                      <td style="padding:4px 0;text-align:right;font-weight:600;color:#1e1b4b;">${params.eventTitle}</td>
                    </tr>
                    <tr>
                      <td style="padding:4px 0;color:#374151;font-size:14px;">Data</td>
                      <td style="padding:4px 0;text-align:right;color:#374151;">${params.eventDate}</td>
                    </tr>
                    <tr>
                      <td style="padding:4px 0;color:#374151;font-size:14px;">Luogo</td>
                      <td style="padding:4px 0;text-align:right;color:#374151;">${params.eventVenue}</td>
                    </tr>
                    <tr>
                      <td style="padding:8px 0 0;color:#374151;font-size:14px;font-weight:600;border-top:1px solid #e5e7eb;">Totale pagato</td>
                      <td style="padding:8px 0 0;text-align:right;font-weight:700;color:#059669;font-size:16px;border-top:1px solid #e5e7eb;">€${params.totalAmount}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- BIGLIETTI -->
            <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">I Tuoi Biglietti</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:28px;">
              <tr style="background:#f9fafb;">
                <th style="padding:10px 12px;text-align:left;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;">Categoria</th>
                <th style="padding:10px 12px;text-align:left;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;">Intestatario</th>
                <th style="padding:10px 12px;text-align:left;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;">Codice QR</th>
              </tr>
              ${ticketRows}
            </table>

            <!-- CTA -->
            <div style="text-align:center;margin-bottom:28px;">
              <a href="${params.siteUrl}/my-tickets" style="display:inline-block;background:linear-gradient(135deg,#3730a3,#4f46e5);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;">
                Visualizza e Scarica i Biglietti PDF
              </a>
            </div>

            <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;">
              Presenta il codice QR all'ingresso dell'evento. Puoi scaricare il PDF completo accedendo alla sezione <strong>"I Miei Biglietti"</strong> sul sito.
            </p>
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">
              ${params.siteName} · <a href="${params.siteUrl}" style="color:#6366f1;text-decoration:none;">${params.siteUrl}</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ============================================================
// TEMPLATE EMAIL NOTIFICA ADMIN
// ============================================================

export function buildAdminNotificationEmailHtml(params: {
  orderNumber: string;
  buyerName: string;
  buyerEmail: string;
  eventTitle: string;
  ticketCount: number;
  totalAmount: string;
  siteName: string;
  siteUrl: string;
}): string {
  return `<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        
        <tr>
          <td style="background:#1e1b4b;padding:24px 32px;">
            <h2 style="margin:0;color:#fbbf24;font-size:20px;">🎟️ Nuovo Ordine Ricevuto</h2>
            <p style="margin:4px 0 0;color:#c7d2fe;font-size:13px;">${params.siteName}</p>
          </td>
        </tr>

        <tr>
          <td style="padding:32px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f7ff;border-radius:8px;">
              <tr><td style="padding:20px 24px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:5px 0;color:#6b7280;font-size:14px;width:140px;">Ordine</td>
                    <td style="padding:5px 0;font-weight:700;color:#1e1b4b;font-family:monospace;">${params.orderNumber}</td>
                  </tr>
                  <tr>
                    <td style="padding:5px 0;color:#6b7280;font-size:14px;">Acquirente</td>
                    <td style="padding:5px 0;color:#374151;">${params.buyerName}</td>
                  </tr>
                  <tr>
                    <td style="padding:5px 0;color:#6b7280;font-size:14px;">Email</td>
                    <td style="padding:5px 0;color:#374151;">${params.buyerEmail}</td>
                  </tr>
                  <tr>
                    <td style="padding:5px 0;color:#6b7280;font-size:14px;">Evento</td>
                    <td style="padding:5px 0;color:#374151;">${params.eventTitle}</td>
                  </tr>
                  <tr>
                    <td style="padding:5px 0;color:#6b7280;font-size:14px;">Biglietti</td>
                    <td style="padding:5px 0;color:#374151;">${params.ticketCount}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0 0;color:#6b7280;font-size:14px;font-weight:600;border-top:1px solid #e5e7eb;">Totale</td>
                    <td style="padding:8px 0 0;font-weight:700;color:#059669;font-size:16px;border-top:1px solid #e5e7eb;">€${params.totalAmount}</td>
                  </tr>
                </table>
              </td></tr>
            </table>

            <div style="text-align:center;margin-top:24px;">
              <a href="${params.siteUrl}/admin" style="display:inline-block;background:#3730a3;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;">
                Vai alla Dashboard Admin
              </a>
            </div>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ============================================================
// FUNZIONE PRINCIPALE DI INVIO
// ============================================================

export async function sendEmail(params: {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<boolean> {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn("[Email] SMTP non configurato. Imposta SMTP_HOST, SMTP_USER, SMTP_PASS nelle variabili d'ambiente.");
    return false;
  }

  try {
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || "EventiPro"}" <${SMTP_FROM}>`,
      to: Array.isArray(params.to) ? params.to.join(", ") : params.to,
      subject: params.subject,
      html: params.html,
      replyTo: params.replyTo,
    });
    console.log(`[Email] Inviata a: ${Array.isArray(params.to) ? params.to.join(", ") : params.to}`);
    return true;
  } catch (err) {
    console.error("[Email] Errore invio:", err);
    return false;
  }
}
