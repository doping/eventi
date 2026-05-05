import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Calendar, MapPin, Music, Minus, Plus, ShoppingCart, Ticket, ChevronLeft, Clock, AlertTriangle } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useParams, useLocation } from "wouter";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import ReviewsSection from "@/components/ReviewsSection";

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const eventId = parseInt(id || "0");

  const { data, isLoading } = trpc.events.getById.useQuery({ id: eventId });
  const createCheckout = trpc.orders.createCheckout.useMutation();

  // Cart state: { categoryId: quantity }
  const [cart, setCart] = useState<Record<number, number>>({});

  // ===== CART TIMER (5 minutes) =====
  const CART_TIMEOUT_SECONDS = 5 * 60; // 5 minutes
  const [cartTimer, setCartTimer] = useState<number | null>(null); // seconds remaining
  const [cartExpired, setCartExpired] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCartTimer(CART_TIMEOUT_SECONDS);
    setCartExpired(false);
    timerRef.current = setInterval(() => {
      setCartTimer(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timerRef.current!);
          setCartExpired(true);
          setCart({});
          toast.error("Il tempo è scaduto! Il carrello è stato svuotato.");
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCartTimer(null);
    setCartExpired(false);
  }, []);

  // Start timer when first item is added, stop when cart is empty
  useEffect(() => {
    const totalItems = Object.values(cart).reduce((s, q) => s + q, 0);
    if (totalItems > 0 && cartTimer === null && !cartExpired) {
      startTimer();
    } else if (totalItems === 0 && cartTimer !== null) {
      stopTimer();
    }
  }, [cart, cartTimer, cartExpired, startTimer, stopTimer]);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };
  // ===== END CART TIMER =====

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

  const getMinPrice = () => {
    if (!data?.categories || data.categories.length === 0) return null;
    return Math.min(...data.categories.map((c) => parseFloat(c.price)));
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

      if (result.checkoutUrl) {
        window.open(result.checkoutUrl, "_blank");
        toast.success("Reindirizzamento al checkout...");
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
        <Navbar />
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
        <Navbar />
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-3xl font-bold mb-4">Evento non trovato</h1>
          <Link href="/">
            <Button>Torna alla Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { event, categories } = data;
  const eventDate = new Date(event.eventDate);
  const totalPrice = getTotalPrice();
  const totalItems = getTotalItems();
  const minPrice = getMinPrice();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pb-24 lg:pb-0">
      <Navbar />

      {/* Back button */}
      <div className="container mx-auto px-4 pt-4">
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-4 w-4" />
            Torna al Catalogo
          </Button>
        </Link>
      </div>

      {/* Event Hero */}
      <section className="relative mt-2">
        {event.imageUrl ? (
          <div className="h-80 md:h-96 overflow-hidden relative">
            <img
              src={event.imageUrl}
              alt={event.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          </div>
        ) : (
          <div className="h-80 md:h-96 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <Music className="h-32 w-32 text-primary/40" />
          </div>
        )}
      </section>

      {/* Event Details */}
      <section className="container mx-auto px-4 -mt-24 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2 mb-3">
                  <Badge className="capitalize">{event.category}</Badge>
                </div>
                <CardTitle className="text-3xl md:text-4xl leading-tight">{event.title}</CardTitle>
                <CardDescription className="text-base mt-4 leading-relaxed">
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
                  <Calendar className="h-5 w-5 text-primary mt-0.5 shrink-0" />
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
                  <MapPin className="h-5 w-5 text-primary mt-0.5 shrink-0" />
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
                {categories.length === 0 ? (
                  <p className="text-muted-foreground text-center py-6">Nessuna categoria disponibile</p>
                ) : (
                  categories.map((category) => (
                    <div
                      key={category.id}
                      className={`flex items-center justify-between p-4 border rounded-xl transition-all ${
                        cart[category.id] ? "border-primary bg-primary/5 shadow-sm" : "hover:border-primary/50"
                      }`}
                    >
                      <div className="flex-1 min-w-0 mr-4">
                        <h4 className="font-semibold text-lg">{category.name}</h4>
                        {category.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {category.description}
                          </p>
                        )}
                        <p className="text-2xl font-bold text-primary mt-1">
                          €{parseFloat(category.price).toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {category.availableQuantity > 0
                            ? `${category.availableQuantity} disponibili`
                            : "Esaurito"}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <Button
                          variant="outline"
                          size="icon"
                          className="rounded-full h-9 w-9"
                          onClick={() => decrementQuantity(category.id)}
                          disabled={!cart[category.id]}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="text-xl font-bold w-8 text-center">
                          {cart[category.id] || 0}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="rounded-full h-9 w-9"
                          onClick={() => incrementQuantity(category.id, category.availableQuantity)}
                          disabled={
                            (cart[category.id] || 0) >= category.availableQuantity ||
                            category.availableQuantity === 0
                          }
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
            {/* Reviews Section */}
            <ReviewsSection eventId={eventId} />
          </div>

          {/* Sidebar - Cart Summary (desktop only) */}
          <div className="lg:col-span-1 hidden lg:block">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Riepilogo Ordine
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Timer banner — shown when cart has items */}
                {cartTimer !== null && (
                  <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                    cartTimer <= 60
                      ? 'bg-red-50 text-red-700 border border-red-200 animate-pulse'
                      : cartTimer <= 120
                      ? 'bg-orange-50 text-orange-700 border border-orange-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {cartTimer <= 60 ? <AlertTriangle className="h-4 w-4 shrink-0" /> : <Clock className="h-4 w-4 shrink-0" />}
                    <span>
                      {cartTimer <= 60
                        ? `Sbrigati! Scade tra ${formatTimer(cartTimer)}`
                        : `Completa l'acquisto entro ${formatTimer(cartTimer)}`}
                    </span>
                  </div>
                )}

                {totalItems === 0 ? (
                  <div className="text-center py-8 space-y-3">
                    <Ticket className="h-10 w-10 mx-auto text-muted-foreground/50" />
                    <p className="text-muted-foreground text-sm">
                      Nessun biglietto selezionato
                    </p>
                    {minPrice !== null && (
                      <p className="text-xs text-muted-foreground">
                        A partire da <span className="font-semibold text-primary">€{minPrice.toFixed(2)}</span>
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      {Object.entries(cart).map(([categoryId, quantity]) => {
                        const category = categories.find(
                          (c) => c.id === parseInt(categoryId)
                        );
                        if (!category) return null;
                        return (
                          <div key={categoryId} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              {quantity}× {category.name}
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
                      className="w-full rounded-full font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                      size="lg"
                      onClick={handleCheckout}
                      disabled={createCheckout.isPending}
                    >
                      {createCheckout.isPending ? "Elaborazione..." : "Procedi al Pagamento"}
                    </Button>

                    {!isAuthenticated && (
                      <p className="text-xs text-center text-muted-foreground">
                        Accedi per completare l'acquisto
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

      {/* ===== STICKY BOTTOM BAR — MOBILE ONLY ===== */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
        {/* Timer strip above the bar */}
        {cartTimer !== null && (
          <div className={`flex items-center justify-center gap-2 px-4 py-1.5 text-xs font-semibold ${
            cartTimer <= 60
              ? 'bg-red-600 text-white animate-pulse'
              : cartTimer <= 120
              ? 'bg-orange-500 text-white'
              : 'bg-amber-500 text-white'
          }`}>
            {cartTimer <= 60 ? <AlertTriangle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
            {cartTimer <= 60
              ? `⚠️ Sbrigati! Scade tra ${formatTimer(cartTimer)}`
              : `⏱ Completa l'acquisto entro ${formatTimer(cartTimer)}`}
          </div>
        )}
        <div className="bg-white/95 backdrop-blur-md border-t shadow-2xl px-4 py-3">
          {totalItems === 0 ? (
            /* No items selected — show "from price" CTA */
            <Button
              className="w-full rounded-full font-bold text-base bg-blue-600 hover:bg-blue-700 text-white shadow-lg h-14"
              size="lg"
              onClick={() => {
                document.querySelector("[data-ticket-section]")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <Ticket className="h-5 w-5 mr-2" />
              {minPrice !== null
                ? `Acquista da €${minPrice.toFixed(2)}`
                : "Acquista Biglietti"}
            </Button>
          ) : (
            /* Items in cart — show total + checkout */
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">
                  {totalItems} {totalItems === 1 ? "biglietto" : "biglietti"}
                </p>
                <p className="text-lg font-bold text-primary">€{totalPrice.toFixed(2)}</p>
              </div>
              <Button
                className="flex-1 rounded-full font-bold text-base bg-blue-600 hover:bg-blue-700 text-white shadow-lg h-12"
                size="lg"
                onClick={handleCheckout}
                disabled={createCheckout.isPending}
              >
                {createCheckout.isPending ? "..." : "Acquista ora"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
