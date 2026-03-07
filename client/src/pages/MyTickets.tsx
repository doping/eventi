import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { generateTicketPDF } from "@/lib/ticketPDF";
import { trpc } from "@/lib/trpc";
import { Calendar, Download, Loader2, MapPin, Music, Ticket } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function MyTickets() {
  const { user, isAuthenticated, loading } = useAuth();
  const { data: orders, isLoading } = trpc.orders.myOrders.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const handleDownloadPDF = async (orderId: number, orderNumber: string) => {
    setDownloadingId(orderId);
    try {
      toast.info("Generazione PDF in corso...");

      // Fetch full order details
      const res = await fetch(
        `/api/trpc/orders.getById?input=${encodeURIComponent(
          JSON.stringify({ json: { id: orderId } })
        )}`
      );
      const json = await res.json();
      const orderData = json?.result?.data?.json;

      if (!orderData?.tickets?.length) {
        toast.error("Nessun biglietto trovato per questo ordine.");
        return;
      }

      // Fetch event/category details for each ticket
      const enriched = await Promise.all(
        orderData.tickets.map(async (ticket: any, idx: number) => {
          try {
            const tRes = await fetch(
              `/api/trpc/tickets.checkStatus?input=${encodeURIComponent(
                JSON.stringify({ json: { qrCode: ticket.qrCode } })
              )}`
            );
            const tJson = await tRes.json();
            const tData = tJson?.result?.data?.json;
            const event = tData?.event;
            const category = tData?.category;
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
              orderNumber,
              ticketIndex: idx + 1,
              totalTickets: orderData.tickets.length,
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
              orderNumber,
              ticketIndex: idx + 1,
              totalTickets: orderData.tickets.length,
            };
          }
        })
      );

      await generateTicketPDF(enriched);
      toast.success("PDF scaricato con successo!");
    } catch (error: any) {
      console.error(error);
      toast.error("Errore durante la generazione del PDF. Riprova.");
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen">
        <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-primary">
              <Music className="h-7 w-7" />
              <span>EventiPro</span>
            </Link>
          </div>
        </nav>
        <div className="container mx-auto px-4 py-12 text-center">
          <Ticket className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-3xl font-bold mb-4">Accesso Richiesto</h1>
          <p className="text-muted-foreground mb-6">
            Devi effettuare l'accesso per visualizzare i tuoi biglietti
          </p>
          <a href={getLoginUrl()}>
            <Button size="lg">Accedi</Button>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-primary">
              <Music className="h-7 w-7" />
              <span>EventiPro</span>
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">{user?.name}</span>
              <Link href="/">
                <Button variant="ghost">Catalogo Eventi</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="bg-gradient-to-br from-primary/10 via-accent/5 to-background py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 mb-2">
            <Ticket className="h-10 w-10 text-primary" />
            <h1 className="text-4xl font-bold">I Miei Biglietti</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Visualizza e scarica i biglietti dei tuoi eventi
          </p>
        </div>
      </section>

      {/* Orders List */}
      <section className="container mx-auto px-4 py-12">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-1/3 mb-2" />
                  <div className="h-4 bg-muted rounded w-1/4" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : orders && orders.length > 0 ? (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order.id} className="overflow-hidden">
                <CardHeader className="bg-muted/30">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        Ordine #{order.orderNumber}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {new Date(order.createdAt).toLocaleDateString("it-IT", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div
                        className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                          order.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : order.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {order.status === "completed"
                          ? "Completato"
                          : order.status === "pending"
                          ? "In attesa"
                          : "Annullato"}
                      </div>
                      <p className="text-2xl font-bold text-primary mt-2">
                        €{parseFloat(order.totalAmount).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardHeader>

                {order.status === "completed" && (
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Ticket className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">Biglietti disponibili</p>
                          <p className="text-sm text-muted-foreground">
                            Scarica i tuoi biglietti in formato PDF
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleDownloadPDF(order.id, order.orderNumber)}
                        variant="outline"
                        disabled={downloadingId === order.id}
                      >
                        {downloadingId === order.id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4 mr-2" />
                        )}
                        {downloadingId === order.id ? "Generazione..." : "Scarica PDF"}
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Ticket className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nessun biglietto</h3>
              <p className="text-muted-foreground mb-6">
                Non hai ancora acquistato biglietti per eventi
              </p>
              <Link href="/">
                <Button>Esplora Eventi</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2026 EventiPro. Tutti i diritti riservati.</p>
        </div>
      </footer>
    </div>
  );
}
