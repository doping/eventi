import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generateTicketPDF } from "@/lib/ticketPDF";
import { trpc } from "@/lib/trpc";
import {
  Calendar,
  CheckCircle,
  Download,
  Loader2,
  MapPin,
  Ticket,
  XCircle,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import QRCode from "react-qr-code";
import { Link, useSearch } from "wouter";

export default function CheckoutSuccess() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const sessionId = params.get("session_id");
  const orderNumber = params.get("order_number");

  const { user, isAuthenticated, loading } = useAuth();

  const [orderId, setOrderId] = useState<number | null>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [autoDownloaded, setAutoDownloaded] = useState(false);
  const confirmCalledRef = useRef(false);

  // Confirm order + generate tickets in one call
  const confirmOrder = trpc.orders.confirm.useMutation({
    onSuccess: async (data) => {
      setOrderId(data.orderId);
      setTickets(data.tickets || []);
      setConfirmed(true);
    },
    onError: (err) => {
      if (err.message.includes("already") || err.message.includes("completed")) {
        setConfirmed(true);
      } else {
        setConfirmError(err.message);
      }
    },
  });

  // Load order details (for PDF enrichment)
  const { data: orderData } = trpc.orders.getById.useQuery(
    { id: orderId! },
    { enabled: !!orderId && confirmed }
  );

  // Trigger confirmation once auth is ready
  useEffect(() => {
    if (
      !confirmCalledRef.current &&
      sessionId &&
      orderNumber &&
      isAuthenticated &&
      !loading
    ) {
      confirmCalledRef.current = true;
      confirmOrder.mutate({ orderNumber, sessionId });
    }
  }, [isAuthenticated, loading, sessionId, orderNumber]);

  // Auto-generate PDF once tickets are ready
  useEffect(() => {
    if (!autoDownloaded && tickets.length > 0 && orderData) {
      setAutoDownloaded(true);
      handleDownloadPDF(tickets, orderData);
    }
  }, [tickets, orderData, autoDownloaded]);

  // PDF generation
  const handleDownloadPDF = async (ticketList?: any[], od?: typeof orderData) => {
    const tks = ticketList || (orderData?.tickets ?? []);
    const od2 = od || orderData;
    if (!tks.length || !od2) return;
    setPdfLoading(true);
    try {
      const enriched = await Promise.all(
        tks.map(async (ticket, idx) => {
          try {
            const res = await fetch(
              `/api/trpc/tickets.checkStatus?input=${encodeURIComponent(
                JSON.stringify({ json: { qrCode: ticket.qrCode } })
              )}`
            );
            const json = await res.json();
            const data = json?.result?.data?.json;
            const event = data?.event;
            const category = data?.category;
            return {
              qrCode: ticket.qrCode,
              holderName: ticket.holderName,
              holderEmail: ticket.holderEmail,
              eventTitle: event?.title ?? "Evento",
              eventDate: event?.eventDate ? new Date(event.eventDate) : new Date(),
              venueName: event?.venueName ?? "",
              venueCity: event?.venueCity ?? "",
              venueAddress: event?.venueAddress ?? null,
              categoryName: category?.name ?? "Biglietto",
              categoryPrice: category?.price ?? "0",
              orderNumber: od2.order.orderNumber,
              ticketIndex: idx + 1,
              totalTickets: tks.length,
            };
          } catch {
            return {
              qrCode: ticket.qrCode,
              holderName: ticket.holderName,
              holderEmail: ticket.holderEmail,
              eventTitle: "Evento",
              eventDate: new Date(),
              venueName: "",
              venueCity: "",
              venueAddress: null,
              categoryName: "Biglietto",
              categoryPrice: "0",
              orderNumber: od2.order.orderNumber,
              ticketIndex: idx + 1,
              totalTickets: tks.length,
            };
          }
        })
      );
      await generateTicketPDF(enriched);
    } catch (err) {
      console.error("PDF generation error:", err);
    } finally {
      setPdfLoading(false);
    }
  };

  // ── Render states ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle>Accedi per vedere il tuo ordine</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/">
              <Button>Torna alla Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (confirmError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <XCircle className="h-16 w-16 mx-auto text-destructive mb-4" />
            <CardTitle>Errore nella conferma</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">{confirmError}</p>
            <p className="text-sm text-muted-foreground">
              Se il pagamento è andato a buon fine, i tuoi biglietti sono disponibili in "I Miei Biglietti".
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/my-tickets">
                <Button>I Miei Biglietti</Button>
              </Link>
              <Link href="/">
                <Button variant="outline">Home</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!confirmed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-muted/20">
        <div className="text-center space-y-3">
          <Loader2 className="h-14 w-14 animate-spin text-primary mx-auto" />
          <h2 className="text-2xl font-bold font-serif">Conferma ordine in corso...</h2>
          <p className="text-muted-foreground">
            Stiamo elaborando il tuo pagamento e preparando i biglietti.
          </p>
        </div>
      </div>
    );
  }

  const order = orderData?.order;
  const displayTickets = orderData?.tickets?.length ? orderData.tickets : tickets;

  return (
    <div className="min-h-screen bg-muted/20">
      <Navbar />

      <div className="container mx-auto px-4 py-10 max-w-3xl">
        {/* Success Banner */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold font-serif mb-2">Pagamento Completato!</h1>
          <p className="text-muted-foreground text-lg">
            I tuoi biglietti sono pronti. Il PDF è stato scaricato automaticamente.
          </p>
          {order && (
            <p className="text-sm text-muted-foreground mt-2">
              Ordine: <span className="font-mono font-semibold">{order.orderNumber}</span>{" "}
              · Totale: <span className="font-semibold">€{parseFloat(order.totalAmount).toFixed(2)}</span>
            </p>
          )}
        </div>

        {/* Download PDF Button */}
        {displayTickets.length > 0 && (
          <div className="flex justify-center mb-8">
            <Button
              onClick={() => handleDownloadPDF()}
              disabled={pdfLoading}
              size="lg"
              className="gap-2 px-8"
            >
              {pdfLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Download className="h-5 w-5" />
              )}
              {pdfLoading ? "Generazione PDF in corso..." : "Scarica Biglietti PDF"}
            </Button>
          </div>
        )}

        {/* Tickets with QR codes */}
        {displayTickets.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Loader2 className="h-12 w-12 mx-auto text-primary animate-spin mb-3" />
              <p className="text-muted-foreground mb-4">
                Caricamento biglietti in corso...
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {displayTickets.map((ticket, index) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                index={index}
                totalTickets={displayTickets.length}
                orderNumber={order?.orderNumber ?? ""}
              />
            ))}
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-4 justify-center mt-10">
          <Link href="/my-tickets">
            <Button variant="outline" className="gap-2">
              <Ticket className="h-4 w-4" />
              I Miei Biglietti
            </Button>
          </Link>
          <Link href="/">
            <Button variant="ghost">Torna alla Home</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Ticket Card ──────────────────────────────────────────────────
function TicketCard({
  ticket,
  index,
  totalTickets,
  orderNumber,
}: {
  ticket: any;
  index: number;
  totalTickets: number;
  orderNumber: string;
}) {
  const { data: ticketDetails } = trpc.tickets.checkStatus.useQuery(
    { qrCode: ticket.qrCode },
    { enabled: !!ticket.qrCode }
  );
  const [pdfLoading, setPdfLoading] = useState(false);

  const event = ticketDetails?.event;
  const category = ticketDetails?.category;

  const handleSinglePDF = async () => {
    if (!event || !category) return;
    setPdfLoading(true);
    try {
      await generateTicketPDF([
        {
          qrCode: ticket.qrCode,
          holderName: ticket.holderName,
          holderEmail: ticket.holderEmail,
          eventTitle: event.title,
          eventDate: new Date(event.eventDate),
          venueName: event.venueName,
          venueCity: event.venueCity,
          venueAddress: event.venueAddress,
          categoryName: category.name,
          categoryPrice: category.price,
          orderNumber,
          ticketIndex: index + 1,
          totalTickets,
        },
      ]);
    } catch (err) {
      alert("Errore nella generazione del PDF.");
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <Card className="overflow-hidden border-2 border-primary/20">
      <div className="bg-primary/5 border-b border-primary/10 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Ticket className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">
            Biglietto #{index + 1}
            {category && ` — ${category.name}`}
          </span>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleSinglePDF}
          disabled={pdfLoading || !event}
          className="gap-1.5 text-xs"
        >
          {pdfLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
          PDF
        </Button>
      </div>

      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* QR Code */}
          <div className="flex-shrink-0 flex flex-col items-center gap-2">
            <div className="bg-white p-3 rounded-lg border-2 border-primary/20 shadow-sm">
              <QRCode value={ticket.qrCode} size={120} />
            </div>
            <p className="text-xs text-muted-foreground font-mono text-center break-all max-w-[140px]">
              {ticket.qrCode}
            </p>
          </div>

          {/* Ticket Details */}
          <div className="flex-1 space-y-3">
            {event ? (
              <>
                <h3 className="font-bold text-lg font-serif leading-tight">{event.title}</h3>
                <div className="space-y-1.5 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 flex-shrink-0" />
                    <span>
                      {new Date(event.eventDate).toLocaleDateString("it-IT", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span>{event.venueName}, {event.venueCity}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                    {category?.name}
                  </span>
                  {category?.price && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                      €{parseFloat(category.price).toFixed(2)}
                    </span>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Caricamento dettagli...</span>
              </div>
            )}
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                Intestatario: <span className="font-medium text-foreground">{ticket.holderName}</span>
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
