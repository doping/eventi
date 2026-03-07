import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  Calendar,
  Euro,
  MapPin,
  Music,
  Plus,
  Ticket,
  Trash2,
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

type NewCategory = {
  name: string;
  description: string;
  price: string;
  quantity: string;
};

export default function PartnerDashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const utils = trpc.useUtils();
  const [activeTab, setActiveTab] = useState("events");
  const [createOpen, setCreateOpen] = useState(false);

  // Create event form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventEndDate, setEventEndDate] = useState("");
  const [venueName, setVenueName] = useState("");
  const [venueAddress, setVenueAddress] = useState("");
  const [venueCity, setVenueCity] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [newCategories, setNewCategories] = useState<NewCategory[]>([
    { name: "Platea", description: "", price: "25", quantity: "100" },
  ]);

  const { data: myEvents, isLoading: eventsLoading } = trpc.events.myEvents.useQuery(undefined, {
    enabled: isAuthenticated && (user?.role === "partner" || user?.role === "admin"),
  });

  const createEvent = trpc.events.create.useMutation({
    onSuccess: () => {
      toast.success(
        user?.role === "admin"
          ? "Evento creato e pubblicato!"
          : "Evento inviato per approvazione!"
      );
      utils.events.myEvents.invalidate();
      setCreateOpen(false);
      resetForm();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteEvent = trpc.events.delete.useMutation({
    onSuccess: () => {
      toast.success("Evento eliminato.");
      utils.events.myEvents.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategory("");
    setEventDate("");
    setEventEndDate("");
    setVenueName("");
    setVenueAddress("");
    setVenueCity("");
    setImageUrl("");
    setNewCategories([{ name: "Platea", description: "", price: "25", quantity: "100" }]);
  };

  const handleAddCategory = () => {
    setNewCategories((prev) => [
      ...prev,
      { name: "", description: "", price: "0", quantity: "50" },
    ]);
  };

  const handleRemoveCategory = (index: number) => {
    setNewCategories((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCategoryChange = (index: number, field: keyof NewCategory, value: string) => {
    setNewCategories((prev) =>
      prev.map((cat, i) => (i === index ? { ...cat, [field]: value } : cat))
    );
  };

  const handleCreate = () => {
    if (!title || !description || !category || !eventDate || !venueName || !venueAddress || !venueCity) {
      toast.error("Compila tutti i campi obbligatori");
      return;
    }
    if (newCategories.length === 0) {
      toast.error("Aggiungi almeno una categoria biglietti");
      return;
    }
    for (const cat of newCategories) {
      if (!cat.name || !cat.price || !cat.quantity) {
        toast.error("Compila tutti i campi delle categorie biglietti");
        return;
      }
    }

    createEvent.mutate({
      title,
      description,
      category: category as any,
      eventDate,
      eventEndDate: eventEndDate || undefined,
      venueName,
      venueAddress,
      venueCity,
      imageUrl: imageUrl || undefined,
      ticketCategories: newCategories.map((c) => ({
        name: c.name,
        description: c.description || undefined,
        price: parseFloat(c.price) || 0,
        quantity: parseInt(c.quantity) || 1,
      })),
    });
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; className: string; icon: any }> = {
      approved: { label: "Pubblicato", className: "bg-green-100 text-green-800", icon: CheckCircle },
      pending: { label: "In Attesa", className: "bg-yellow-100 text-yellow-800", icon: Clock },
      rejected: { label: "Rifiutato", className: "bg-red-100 text-red-800", icon: XCircle },
      draft: { label: "Bozza", className: "bg-gray-100 text-gray-800", icon: Clock },
      cancelled: { label: "Annullato", className: "bg-red-100 text-red-800", icon: XCircle },
    };
    const s = map[status] || { label: status, className: "bg-gray-100 text-gray-800", icon: Clock };
    const Icon = s.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${s.className}`}>
        <Icon className="h-3 w-3" />
        {s.label}
      </span>
    );
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
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <Music className="h-12 w-12 mx-auto text-primary mb-4" />
            <CardTitle>Accedi per continuare</CardTitle>
            <CardDescription>Devi accedere per gestire i tuoi eventi.</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <a href={getLoginUrl()}>
              <Button>Accedi</Button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user?.role !== "partner" && user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle>Accesso Partner Richiesto</CardTitle>
            <CardDescription>
              Il tuo account non ha i permessi partner. Contatta l'amministratore per richiedere l'accesso.
            </CardDescription>
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

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
                <ArrowLeft className="h-5 w-5" />
                <Music className="h-6 w-6" />
                <span className="font-bold">EventiPro</span>
              </Link>
              <div className="h-6 w-px bg-border" />
              <span className="font-semibold">
                {user?.role === "admin" ? "Gestione Eventi" : "Area Partner"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">{user?.name}</span>
              <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nuovo Evento
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Crea Nuovo Evento</DialogTitle>
                    <DialogDescription>
                      {user?.role === "admin"
                        ? "L'evento verrà pubblicato immediatamente."
                        : "L'evento sarà inviato per approvazione all'amministratore."}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-2">
                    <div className="space-y-1">
                      <Label>Titolo *</Label>
                      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Es. Concerto Sinfonico" />
                    </div>

                    <div className="space-y-1">
                      <Label>Descrizione *</Label>
                      <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrizione dell'evento..." rows={3} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label>Categoria *</Label>
                        <Select value={category} onValueChange={setCategory}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleziona..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="classica">Musica Classica</SelectItem>
                            <SelectItem value="lirica">Opera Lirica</SelectItem>
                            <SelectItem value="teatro">Teatro</SelectItem>
                            <SelectItem value="danza">Danza</SelectItem>
                            <SelectItem value="altro">Altro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label>Data e Ora *</Label>
                        <Input type="datetime-local" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label>Nome Venue *</Label>
                        <Input value={venueName} onChange={(e) => setVenueName(e.target.value)} placeholder="Es. Teatro Regio" />
                      </div>
                      <div className="space-y-1">
                        <Label>Città *</Label>
                        <Input value={venueCity} onChange={(e) => setVenueCity(e.target.value)} placeholder="Es. Torino" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label>Indirizzo *</Label>
                      <Input value={venueAddress} onChange={(e) => setVenueAddress(e.target.value)} placeholder="Es. Piazza Castello 215" />
                    </div>

                    <div className="space-y-1">
                      <Label>URL Immagine</Label>
                      <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
                    </div>

                    {/* Ticket Categories */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-semibold">Categorie Biglietti *</Label>
                        <Button type="button" variant="outline" size="sm" onClick={handleAddCategory} className="gap-1 h-8">
                          <Plus className="h-3 w-3" />
                          Aggiungi
                        </Button>
                      </div>

                      {newCategories.map((cat, index) => (
                        <div key={index} className="p-3 border rounded-lg space-y-2 bg-muted/30">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground">Categoria {index + 1}</span>
                            {newCategories.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveCategory(index)}
                                className="h-6 w-6 p-0 text-destructive"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <Label className="text-xs">Nome *</Label>
                              <Input
                                value={cat.name}
                                onChange={(e) => handleCategoryChange(index, "name", e.target.value)}
                                placeholder="Es. Platea"
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Descrizione</Label>
                              <Input
                                value={cat.description}
                                onChange={(e) => handleCategoryChange(index, "description", e.target.value)}
                                placeholder="Es. Prima fila"
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Prezzo (€) *</Label>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={cat.price}
                                onChange={(e) => handleCategoryChange(index, "price", e.target.value)}
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Posti Disponibili *</Label>
                              <Input
                                type="number"
                                min="1"
                                value={cat.quantity}
                                onChange={(e) => handleCategoryChange(index, "quantity", e.target.value)}
                                className="h-8 text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button variant="outline" className="flex-1" onClick={() => setCreateOpen(false)}>
                        Annulla
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={handleCreate}
                        disabled={createEvent.isPending}
                      >
                        {createEvent.isPending
                          ? "Creazione..."
                          : user?.role === "admin"
                          ? "Pubblica Evento"
                          : "Invia per Approvazione"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="events">I Miei Eventi</TabsTrigger>
            <TabsTrigger value="stats">Statistiche</TabsTrigger>
          </TabsList>

          {/* ===== EVENTS TAB ===== */}
          <TabsContent value="events">
            {eventsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
                ))}
              </div>
            ) : myEvents && myEvents.length > 0 ? (
              <div className="space-y-4">
                {myEvents.map((event) => (
                  <Card key={event.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex items-stretch">
                        {event.imageUrl && (
                          <div className="w-32 flex-shrink-0 hidden md:block">
                            <img
                              src={event.imageUrl}
                              alt={event.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold truncate">{event.title}</h3>
                                {getStatusBadge(event.status)}
                              </div>
                              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3.5 w-3.5" />
                                  {new Date(event.eventDate).toLocaleDateString("it-IT", {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3.5 w-3.5" />
                                  {event.venueName}, {event.venueCity}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Ticket className="h-3.5 w-3.5 capitalize" />
                                  {event.category}
                                </span>
                              </div>
                              {event.status === "pending" && (
                                <p className="text-xs text-yellow-700 mt-1">
                                  In attesa di approvazione dall'amministratore
                                </p>
                              )}
                              {event.status === "rejected" && (
                                <p className="text-xs text-red-700 mt-1">
                                  Evento rifiutato. Modifica e reinvia.
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                              <Link href={`/events/${event.id}/edit`}>
                                <Button size="sm" variant="outline">
                                  Modifica
                                </Button>
                              </Link>
                              <Link href={`/events/${event.id}`}>
                                <Button size="sm" variant="ghost">
                                  Vedi
                                </Button>
                              </Link>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => {
                                  if (confirm("Sei sicuro di voler eliminare questo evento?")) {
                                    deleteEvent.mutate({ id: event.id });
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-16 text-center">
                  <Music className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Nessun evento ancora</h3>
                  <p className="text-muted-foreground mb-6">
                    Crea il tuo primo evento e inizia a vendere biglietti!
                  </p>
                  <Button onClick={() => setCreateOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Crea Primo Evento
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ===== STATS TAB ===== */}
          <TabsContent value="stats">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Totale Eventi
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{myEvents?.length ?? 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {myEvents?.filter((e) => e.status === "approved").length ?? 0} pubblicati
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    In Attesa
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-yellow-600">
                    {myEvents?.filter((e) => e.status === "pending").length ?? 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">In revisione dall'admin</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Prossimi Eventi
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">
                    {myEvents?.filter(
                      (e) => e.status === "approved" && new Date(e.eventDate) > new Date()
                    ).length ?? 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Futuri e attivi</p>
                </CardContent>
              </Card>
            </div>

            {myEvents && myEvents.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Riepilogo per Evento</CardTitle>
                  <CardDescription>
                    Clicca su "Modifica" per gestire biglietti e disponibilità
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {myEvents.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{event.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(event.eventDate).toLocaleDateString("it-IT")} ·{" "}
                            {event.venueCity}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          {getStatusBadge(event.status)}
                          <Link href={`/events/${event.id}/edit`}>
                            <Button size="sm" variant="outline">
                              Gestisci
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">
                    Crea il tuo primo evento per vedere le statistiche
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
