import { useAuth } from "@/_core/hooks/useAuth";
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
  Music,
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
  const utils = trpc.useUtils();

  const [orderId, setOrderId] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const confirmCalledRef = useRef(false);

  // Step 1: Confirm the order via the backend
  const confirmOrder = trpc.orders.confirm.useMutation({
    onSuccess: (data) => {
      setOrderId(data.orderId);
      setConfirmed(true);
    },
    onError: (err) => {
      // Order may already be confirmed (e.g. via webhook), try to find it anyway
      if (err.message.includes("already") || err.message.includes("completed")) {
        setConfirmed(true);
      } else {
        setConfirmError(err.message);
      }
    },
  });

  // Step 2: Load order details once we have orderId
  const { data: orderData, isLoading: orderLoading } = trpc.orders.getById.useQuery(
    { id: orderId! },
    { enabled: !!orderId && confirmed }
  );

  // Find orderId from myOrders if confirm didn't return it
  const { data: myOrders } = trpc.orders.myOrders.useQuery(undefined, {
    enabled: isAuthenticated && confirmed && !orderId,
  });

  useEffect(() => {
    if (confirmed && !orderId && myOrders && myOrders.length > 0) {
      const latest = [...myOrders].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];
      setOrderId(latest.id);
    }
  }, [confirmed, orderId, myOrders]);

  // Trigger confirmation once
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

  // ── PDF Download (client-side, no server) ──────────────────────
  const handleDownloadPDF = async () => {
    if (!orderData) return;
    setPdfLoading(true);
    try {
      const { order, tickets } = orderData;

      // Fetch event/category details for each ticket in parallel
      const ticketDataList = await Promise.all(
        tickets.map(async (ticket, idx) => {
          // Use the checkStatus query data already cached, or fetch via REST
          return {
            qrCode: ticket.qrCode,
            holderName: ticket.holderName,
            holderEmail: ticket.holderEmail,
            // These will be filled by the per-ticket fetch below
            eventTitle: "",
            eventDate: new Date(),
            venueName: "",
            venueCity: "",
            venueAddress: null,
            categoryName: "",
            categoryPrice: "0",
            orderNumber: order.orderNumber,
            ticketIndex: idx + 1,
            totalTickets: tickets.length,
          };
        })
      );

      // We need event/category data — fetch via tRPC checkStatus for each ticket
      // Since we can't call hooks in a callback, we use the raw fetch approach
      const enriched = await Promise.all(
        tickets.map(async (ticket, idx) => {
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
              orderNumber: orderData.order.orderNumber,
              ticketIndex: idx + 1,
              totalTickets: tickets.length,
            };
          } catch {
            return ticketDataList[idx];
          }
        })
      );

      await generateTicketPDF(enriched);
    } catch (err) {
      console.error("PDF generation error:", err);
      alert("Errore nella generazione del PDF. Riprova.");
    } finally {
      setPdfLoading(false);
    }
  };

  // ── Render states ───────────────────────────────────────────────
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

  if (!confirmed || (confirmed && orderId && orderLoading)) {
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
  const tickets = orderData?.tickets ?? [];

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity w-fit">
            <Music className="h-6 w-6" />
            <span className="font-bold text-lg">EventiPro</span>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-10 max-w-3xl">
        {/* Success Banner */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold font-serif mb-2">Pagamento Completato!</h1>
          <p className="text-muted-foreground text-lg">
            I tuoi biglietti sono pronti. Presentali all'ingresso con il QR code.
          </p>
          {order && (
            <p className="text-sm text-muted-foreground mt-2">
              Ordine: <span className="font-mono font-semibold">{order.orderNumber}</span>{" "}
              · Totale: <span className="font-semibold">€{parseFloat(order.totalAmount).toFixed(2)}</span>
            </p>
          )}
        </div>

        {/* Download PDF Button */}
        {tickets.length > 0 && (
          <div className="flex justify-center mb-8">
            <Button
              onClick={handleDownloadPDF}
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
        {tickets.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Ticket className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-4">
                I biglietti sono in fase di generazione...
              </p>
              <Link href="/my-tickets">
                <Button variant="outline">Vai a I Miei Biglietti</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {tickets.map((ticket, index) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                index={index}
                totalTickets={tickets.length}
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
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-muted-foreground hidden sm:block">{ticket.qrCode}</span>
          <Button
            size="sm"
            variant="outline"
            className="gap-1 h-7 text-xs"
            onClick={handleSinglePDF}
            disabled={pdfLoading || !event}
          >
            {pdfLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
            PDF
          </Button>
        </div>
      </div>

      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
          {/* QR Code */}
          <div className="flex-shrink-0">
            <div className="bg-white p-4 rounded-xl border-2 border-primary/20 shadow-sm">
              <QRCode
                value={ticket.qrCode}
                size={160}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                viewBox="0 0 256 256"
              />
            </div>
            <p className="text-xs text-center text-muted-foreground mt-2">
              Mostra all'ingresso
            </p>
          </div>

          {/* Event Details */}
          <div className="flex-1 space-y-3">
            {event ? (
              <>
                <h3 className="text-xl font-bold font-serif">{event.title}</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>
                      {new Date(event.eventDate).toLocaleDateString("it-IT", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}{" "}
                      alle{" "}
                      {new Date(event.eventDate).toLocaleTimeString("it-IT", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>{event.venueName}, {event.venueCity}</span>
                  </div>
                  {event.venueAddress && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>{event.venueAddress}</span>
                    </div>
                  )}
                </div>

                {category && (
                  <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-medium">
                    <Ticket className="h-3.5 w-3.5" />
                    {category.name}
                    {category.price && ` — €${parseFloat(category.price).toFixed(2)}`}
                  </div>
                )}

                {ticket.holderName && (
                  <p className="text-sm text-muted-foreground">
                    Intestato a:{" "}
                    <span className="font-medium text-foreground">{ticket.holderName}</span>
                  </p>
                )}
              </>
            ) : (
              <div className="space-y-2">
                <div className="h-6 bg-muted rounded animate-pulse w-48" />
                <div className="h-4 bg-muted rounded animate-pulse w-32" />
                <div className="h-4 bg-muted rounded animate-pulse w-40" />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
