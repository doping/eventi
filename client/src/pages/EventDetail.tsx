import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Calendar, MapPin, Music, Minus, Plus, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { Link, useParams, useLocation } from "wouter";
import { toast } from "sonner";

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const eventId = parseInt(id || "0");

  const { data, isLoading } = trpc.events.getById.useQuery({ id: eventId });
  const createCheckout = trpc.orders.createCheckout.useMutation();

  // Cart state: { categoryId: quantity }
  const [cart, setCart] = useState<Record<number, number>>({});

  const incrementQuantity = (categoryId: number, maxQuantity: number) => {
    setCart((prev) => {
      const current = prev[categoryId] || 0;
      if (current < maxQuantity) {
        return { ...prev, [categoryId]: current + 1 };
      }
      return prev;
    });
  };

  const decrementQuantity = (categoryId: number) => {
    setCart((prev) => {
      const current = prev[categoryId] || 0;
      if (current > 0) {
        const newCart = { ...prev };
        if (current === 1) {
          delete newCart[categoryId];
        } else {
          newCart[categoryId] = current - 1;
        }
        return newCart;
      }
      return prev;
    });
  };

  const getTotalPrice = () => {
    if (!data?.categories) return 0;
    return Object.entries(cart).reduce((total, [categoryId, quantity]) => {
      const category = data.categories.find((c) => c.id === parseInt(categoryId));
      if (category) {
        return total + parseFloat(category.price) * quantity;
      }
      return total;
    }, 0);
  };

  const getTotalItems = () => {
    return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  };

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      toast.error("Devi effettuare l'accesso per acquistare biglietti");
      window.location.href = getLoginUrl();
      return;
    }

    const items = Object.entries(cart).map(([categoryId, quantity]) => ({
      ticketCategoryId: parseInt(categoryId),
      quantity,
    }));

    if (items.length === 0) {
      toast.error("Seleziona almeno un biglietto");
      return;
    }

    try {
      const result = await createCheckout.mutateAsync({
        items,
        origin: window.location.origin,
      });

      // Open Stripe checkout in new tab
      if (result.checkoutUrl) {
        window.open(result.checkoutUrl, "_blank");
        toast.success("Reindirizzamento al checkout...");
        
        // Redirect to order confirmation page
        setTimeout(() => {
          setLocation(`/orders/${result.orderId}`);
        }, 1000);
      }
    } catch (error: any) {
      toast.error(error.message || "Errore durante la creazione dell'ordine");
    }
  };

  if (isLoading) {
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
        <div className="container mx-auto px-4 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-96 bg-muted rounded-lg" />
            <div className="h-8 bg-muted rounded w-2/3" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (!data?.event) {
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
          <h1 className="text-3xl font-bold mb-4">Evento non trovato</h1>
          <Link href="/">
            <a>
              <Button>Torna alla Home</Button>
            </a>
          </Link>
        </div>
      </div>
    );
  }

  const { event, categories } = data;
  const eventDate = new Date(event.eventDate);
  const totalPrice = getTotalPrice();
  const totalItems = getTotalItems();

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
            <Link href="/">
              <a>
                <Button variant="ghost">← Torna al Catalogo</Button>
              </a>
            </Link>
          </div>
        </div>
      </nav>

      {/* Event Hero */}
      <section className="relative">
        {event.imageUrl ? (
          <div className="h-96 overflow-hidden relative">
            <img
              src={event.imageUrl}
              alt={event.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          </div>
        ) : (
          <div className="h-96 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <Music className="h-32 w-32 text-primary/40" />
          </div>
        )}
      </section>

      {/* Event Details */}
      <section className="container mx-auto px-4 -mt-32 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
                  {event.category.charAt(0).toUpperCase() + event.category.slice(1)}
                </div>
                <CardTitle className="text-4xl">{event.title}</CardTitle>
                <CardDescription className="text-lg mt-4">
                  {event.description}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Informazioni Evento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-semibold">Data e Ora</p>
                    <p className="text-muted-foreground">
                      {eventDate.toLocaleDateString("it-IT", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                      {" alle "}
                      {eventDate.toLocaleTimeString("it-IT", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-semibold">{event.venueName}</p>
                    <p className="text-muted-foreground">
                      {event.venueAddress}
                      <br />
                      {event.venueCity}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ticket Categories */}
            <Card>
              <CardHeader>
                <CardTitle>Seleziona Biglietti</CardTitle>
                <CardDescription>
                  Scegli la categoria e la quantità di biglietti desiderati
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:border-primary transition-colors"
                  >
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">{category.name}</h4>
                      {category.description && (
                        <p className="text-sm text-muted-foreground">
                          {category.description}
                        </p>
                      )}
                      <p className="text-2xl font-bold text-primary mt-2">
                        €{parseFloat(category.price).toFixed(2)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {category.availableQuantity} biglietti disponibili
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => decrementQuantity(category.id)}
                        disabled={!cart[category.id]}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="text-xl font-semibold w-8 text-center">
                        {cart[category.id] || 0}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          incrementQuantity(category.id, category.availableQuantity)
                        }
                        disabled={
                          (cart[category.id] || 0) >= category.availableQuantity
                        }
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Cart Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Riepilogo Ordine
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {totalItems === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nessun biglietto selezionato
                  </p>
                ) : (
                  <>
                    <div className="space-y-2">
                      {Object.entries(cart).map(([categoryId, quantity]) => {
                        const category = categories.find(
                          (c) => c.id === parseInt(categoryId)
                        );
                        if (!category) return null;
                        return (
                          <div
                            key={categoryId}
                            className="flex justify-between text-sm"
                          >
                            <span>
                              {quantity}x {category.name}
                            </span>
                            <span className="font-semibold">
                              €{(parseFloat(category.price) * quantity).toFixed(2)}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex justify-between text-lg font-bold">
                        <span>Totale</span>
                        <span className="text-primary">€{totalPrice.toFixed(2)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {totalItems} {totalItems === 1 ? "biglietto" : "biglietti"}
                      </p>
                    </div>

                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handleCheckout}
                      disabled={createCheckout.isPending}
                    >
                      {createCheckout.isPending
                        ? "Elaborazione..."
                        : "Procedi al Pagamento"}
                    </Button>

                    {!isAuthenticated && (
                      <p className="text-xs text-center text-muted-foreground">
                        Devi effettuare l'accesso per completare l'acquisto
                      </p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
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
