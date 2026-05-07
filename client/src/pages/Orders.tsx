import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Calendar, Ticket, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";

export default function Orders() {
  const { isAuthenticated } = useAuth();
  const { data: orders, isLoading } = trpc.orders.myOrders.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-3xl font-bold mb-4">I tuoi Ordini</h1>
          <p className="text-muted-foreground mb-6">Accedi per vedere i tuoi ordini</p>
          <Button onClick={() => (window.location.href = getLoginUrl())}>Accedi</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Navbar />
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="flex items-center gap-3 mb-8">
          <ShoppingBag className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">I tuoi Ordini</h1>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />)}
          </div>
        ) : orders && orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order: any) => (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-lg">Ordine #{order.id}</span>
                        <Badge
                          variant={order.status === "completed" ? "default" : order.status === "pending" ? "secondary" : "destructive"}
                        >
                          {order.status === "completed" ? "Completato" : order.status === "pending" ? "In attesa" : order.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(order.createdAt).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xl font-bold text-primary">
                        €{parseFloat(order.totalAmount || "0").toFixed(2)}
                      </span>
                      <Link href="/my-tickets">
                        <Button variant="outline" size="sm" className="gap-2">
                          <Ticket className="h-4 w-4" />
                          Vedi biglietti
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nessun ordine trovato</h3>
            <p className="text-muted-foreground mb-6">Non hai ancora effettuato nessun acquisto</p>
            <Link href="/">
              <Button>Scopri gli eventi</Button>
            </Link>
          </div>
        )}
      </div>

      <footer className="border-t bg-muted/30 py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2026 OperaMix. Tutti i diritti riservati.</p>
        </div>
      </footer>
    </div>
  );
}
