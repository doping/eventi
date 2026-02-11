import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Calendar, Download, MapPin, Music, Ticket } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function MyTickets() {
  const { user, isAuthenticated, loading } = useAuth();
  const { data: orders, isLoading } = trpc.orders.myOrders.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const downloadPDF = trpc.tickets.downloadPDF.useQuery;

  const handleDownloadPDF = async (orderId: number) => {
    try {
      toast.info("Generazione PDF in corso...");
      const result = await downloadPDF({ orderId });
      
      if (result.data?.pdf) {
        // Convert base64 to blob and download
        const link = document.createElement("a");
        link.href = result.data.pdf;
        link.download = `biglietti-ordine-${orderId}.pdf`;
        link.click();
        toast.success("PDF scaricato con successo!");
      }
    } catch (error: any) {
      toast.error(error.message || "Errore durante il download del PDF");
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
            <Link href="/">
              <a className="flex items-center gap-2 text-2xl font-bold text-primary">
                <Music className="h-7 w-7" />
                <span>EventiPro</span>
              </a>
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
            <Link href="/">
              <a className="flex items-center gap-2 text-2xl font-bold text-primary">
                <Music className="h-7 w-7" />
                <span>EventiPro</span>
              </a>
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">{user?.name}</span>
              <Link href="/">
                <a>
                  <Button variant="ghost">Catalogo Eventi</Button>
                </a>
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
                        onClick={() => handleDownloadPDF(order.id)}
                        variant="outline"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Scarica PDF
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
                <a>
                  <Button>Esplora Eventi</Button>
                </a>
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
