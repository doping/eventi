import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import ImageUpload from "@/components/ImageUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Plus, Trash2, ArrowLeft, Save, Loader2, CalendarPlus, X, MapPin } from "lucide-react";
import { getLoginUrl } from "@/const";
import { Badge } from "@/components/ui/badge";
import { getErrorMessage } from "@/lib/errorMessages";

interface TicketCategory {
  id: string;
  name: string;
  description: string;
  price: string;
  quantity: string;
}

export default function EventNew() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const isAdmin = user?.role === "admin";
  const isPartner = user?.role === "partner" || user?.role === "admin";

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("");
  const [eventDate, setEventDate] = useState("");
  const [eventEndDate, setEventEndDate] = useState("");
  const [venueName, setVenueName] = useState("");
  const [venueAddress, setVenueAddress] = useState("");
  const [venueCity, setVenueCity] = useState("");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [ticketCategories, setTicketCategories] = useState<TicketCategory[]>([
    { id: "1", name: "Platea", description: "", price: "25", quantity: "100" },
  ]);

  // Recurring event state
  type RecurringType = 'single' | 'multi-date' | 'multi-location';
  const [recurringType, setRecurringType] = useState<RecurringType>('single');

  interface ExtraDate {
    id: string;
    startDate: string;
    endDate: string;
    label: string;
  }
  interface ExtraLocation {
    id: string;
    venueName: string;
    venueAddress: string;
    venueCity: string;
    startDate: string;
    endDate: string;
  }
  const [extraDates, setExtraDates] = useState<ExtraDate[]>([]);
  const [extraLocations, setExtraLocations] = useState<ExtraLocation[]>([]);

  const addExtraDate = () => setExtraDates(prev => [...prev, { id: Date.now().toString(), startDate: '', endDate: '', label: '' }]);
  const removeExtraDate = (id: string) => setExtraDates(prev => prev.filter(d => d.id !== id));
  const updateExtraDate = (id: string, field: keyof ExtraDate, value: string) =>
    setExtraDates(prev => prev.map(d => d.id === id ? { ...d, [field]: value } : d));

  const addExtraLocation = () => setExtraLocations(prev => [...prev, { id: Date.now().toString(), venueName: '', venueAddress: '', venueCity: '', startDate: '', endDate: '' }]);
  const removeExtraLocation = (id: string) => setExtraLocations(prev => prev.filter(l => l.id !== id));
  const updateExtraLocation = (id: string, field: keyof ExtraLocation, value: string) =>
    setExtraLocations(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l));

  const addDateMutation = trpc.eventDates.add.useMutation();

  const createEvent = trpc.events.create.useMutation({
    onSuccess: async (event) => {
      // Add extra dates if recurring
      if (recurringType === 'multi-date' && extraDates.length > 0) {
        for (const d of extraDates) {
          if (d.startDate) {
            await addDateMutation.mutateAsync({
              eventId: event.id,
              startDate: d.startDate,
              endDate: d.endDate || undefined,
              label: d.label || undefined,
            });
          }
        }
      }
      toast.success("Evento creato con successo!");
      navigate(`/events/${event.id}/edit`);
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const addTicketCategory = () => {
    setTicketCategories((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: "",
        description: "",
        price: "0",
        quantity: "50",
      },
    ]);
  };

  const removeTicketCategory = (id: string) => {
    if (ticketCategories.length <= 1) {
      toast.error("Devi avere almeno una categoria di biglietti");
      return;
    }
    setTicketCategories((prev) => prev.filter((c) => c.id !== id));
  };

  const updateCategory = (id: string, field: keyof TicketCategory, value: string) => {
    setTicketCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) { toast.error("Inserisci il titolo dell'evento"); return; }
    if (!description.trim()) { toast.error("Inserisci la descrizione"); return; }
    if (!category) { toast.error("Seleziona la categoria"); return; }
    if (!eventDate) { toast.error("Inserisci la data dell'evento"); return; }
    if (!venueName.trim()) { toast.error("Inserisci il nome del venue"); return; }
    if (!venueAddress.trim()) { toast.error("Inserisci l'indirizzo"); return; }
    if (!venueCity.trim()) { toast.error("Inserisci la città"); return; }

    for (const cat of ticketCategories) {
      if (!cat.name.trim()) { toast.error("Inserisci il nome per tutte le categorie biglietti"); return; }
      if (isNaN(parseFloat(cat.price)) || parseFloat(cat.price) < 0) {
        toast.error("Inserisci un prezzo valido per tutte le categorie"); return;
      }
      if (isNaN(parseInt(cat.quantity)) || parseInt(cat.quantity) < 1) {
        toast.error("Inserisci una quantità valida per tutte le categorie"); return;
      }
    }

    createEvent.mutate({
      title: title.trim(),
      description: description.trim(),
      category: category as any,
      eventDate,
      eventEndDate: eventEndDate || undefined,
      venueName: venueName.trim(),
      venueAddress: venueAddress.trim(),
      venueCity: venueCity.trim(),
      imageUrl: imageUrl || undefined,
      ticketCategories: ticketCategories.map((c) => ({
        name: c.name.trim(),
        description: c.description.trim() || undefined,
        price: parseFloat(c.price),
        quantity: parseInt(c.quantity),
      })),
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-serif font-bold">Accesso richiesto</h2>
            <p className="text-muted-foreground">Devi effettuare il login per creare eventi.</p>
            <a href={getLoginUrl()}>
              <Button>Accedi</Button>
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (!isPartner) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-serif font-bold">Accesso negato</h2>
            <p className="text-muted-foreground">Solo admin e partner possono creare eventi.</p>
            <Button variant="outline" onClick={() => navigate("/")}>Torna alla Home</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(isAdmin ? "/admin" : "/partner")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Indietro
          </Button>
          <div>
            <h1 className="text-3xl font-serif font-bold">Crea Nuovo Evento</h1>
            <p className="text-muted-foreground mt-1">
              {isAdmin
                ? "L'evento sarà pubblicato immediatamente."
                : "L'evento sarà inviato per approvazione all'amministratore."}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Informazioni principali */}
          <Card>
            <CardHeader>
              <CardTitle className="font-serif">Informazioni Principali</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="title">Titolo Evento *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="es. La Traviata — Teatro alla Scala"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrizione *</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descrivi l'evento, il programma, gli artisti..."
                  rows={5}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoria *</Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona categoria" />
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

              <ImageUpload
                value={imageUrl}
                onChange={setImageUrl}
                onClear={() => setImageUrl("")}
                label="Immagine Evento"
                    aspectRatio="landscape"
              />
            </CardContent>
          </Card>

          {/* Date e orari */}
          <Card>
            <CardHeader>
              <CardTitle className="font-serif">Data e Orario</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="eventDate">Data e Ora Inizio *</Label>
                  <Input
                    id="eventDate"
                    type="datetime-local"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eventEndDate">Data e Ora Fine (opzionale)</Label>
                  <Input
                    id="eventEndDate"
                    type="datetime-local"
                    value={eventEndDate}
                    onChange={(e) => setEventEndDate(e.target.value)}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Per eventi con più repliche, potrai aggiungere date aggiuntive dopo la creazione dalla pagina di modifica.
              </p>
            </CardContent>
          </Card>

          {/* Tipo Evento */}
          <Card>
            <CardHeader>
              <CardTitle className="font-serif">Tipo di Evento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {([
                  { value: 'single', label: 'Evento Singolo', desc: 'Un unico appuntamento', icon: '🎭' },
                  { value: 'multi-date', label: 'Date Multiple', desc: 'Stesso evento, date diverse', icon: '📅' },
                  { value: 'multi-location', label: 'Location Multiple', desc: 'Stesso evento, location diverse', icon: '📍' },
                ] as const).map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRecurringType(opt.value)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      recurringType === opt.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/40'
                    }`}
                  >
                    <div className="text-2xl mb-1">{opt.icon}</div>
                    <div className="font-semibold text-sm">{opt.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{opt.desc}</div>
                  </button>
                ))}
              </div>

              {/* Multi-date: add extra dates */}
              {recurringType === 'multi-date' && (
                <div className="space-y-3 pt-2">
                  <p className="text-sm text-muted-foreground">
                    La data principale è quella inserita sopra. Aggiungi qui le repliche:
                  </p>
                  {extraDates.map((d, i) => (
                    <div key={d.id} className="p-3 border rounded-lg bg-muted/20 space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">Replica {i + 1}</Badge>
                        <button type="button" onClick={() => removeExtraDate(d.id)} className="text-destructive hover:opacity-70">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Data Inizio *</Label>
                          <Input type="datetime-local" value={d.startDate} onChange={e => updateExtraDate(d.id, 'startDate', e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Data Fine</Label>
                          <Input type="datetime-local" value={d.endDate} onChange={e => updateExtraDate(d.id, 'endDate', e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Etichetta</Label>
                          <Input placeholder="es. Serata 2" value={d.label} onChange={e => updateExtraDate(d.id, 'label', e.target.value)} />
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addExtraDate} className="gap-2">
                    <CalendarPlus className="h-4 w-4" />
                    Aggiungi Replica
                  </Button>
                </div>
              )}

              {/* Multi-location: add extra locations */}
              {recurringType === 'multi-location' && (
                <div className="space-y-3 pt-2">
                  <p className="text-sm text-muted-foreground">
                    La location principale è quella inserita sotto. Aggiungi qui le location aggiuntive:
                  </p>
                  {extraLocations.map((l, i) => (
                    <div key={l.id} className="p-3 border rounded-lg bg-muted/20 space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">Location {i + 1}</Badge>
                        <button type="button" onClick={() => removeExtraLocation(l.id)} className="text-destructive hover:opacity-70">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Nome Venue *</Label>
                          <Input placeholder="es. Teatro Regio" value={l.venueName} onChange={e => updateExtraLocation(l.id, 'venueName', e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Città *</Label>
                          <Input placeholder="es. Torino" value={l.venueCity} onChange={e => updateExtraLocation(l.id, 'venueCity', e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Indirizzo</Label>
                          <Input placeholder="es. Piazza Castello, 215" value={l.venueAddress} onChange={e => updateExtraLocation(l.id, 'venueAddress', e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Data</Label>
                          <Input type="datetime-local" value={l.startDate} onChange={e => updateExtraLocation(l.id, 'startDate', e.target.value)} />
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addExtraLocation} className="gap-2">
                    <MapPin className="h-4 w-4" />
                    Aggiungi Location
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Nota: le location aggiuntive saranno visibili come note nella pagina di modifica evento.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Venue */}
          <Card>
            <CardHeader>
              <CardTitle className="font-serif">Location{recurringType === 'multi-location' ? ' Principale' : ''}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="venueName">Nome del Venue *</Label>
                <Input
                  id="venueName"
                  value={venueName}
                  onChange={(e) => setVenueName(e.target.value)}
                  placeholder="es. Teatro alla Scala"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="venueAddress">Indirizzo *</Label>
                <Input
                  id="venueAddress"
                  value={venueAddress}
                  onChange={(e) => setVenueAddress(e.target.value)}
                  placeholder="es. Via Filodrammatici, 2"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="venueCity">Città *</Label>
                <Input
                  id="venueCity"
                  value={venueCity}
                  onChange={(e) => setVenueCity(e.target.value)}
                  placeholder="es. Milano"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Categorie biglietti */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-serif">Categorie Biglietti</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={addTicketCategory} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Aggiungi Categoria
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {ticketCategories.map((cat, idx) => (
                <div key={cat.id} className="p-4 border rounded-lg space-y-3 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">
                      Categoria {idx + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTicketCategory(cat.id)}
                      className="text-destructive hover:text-destructive h-7 w-7 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Nome *</Label>
                      <Input
                        value={cat.name}
                        onChange={(e) => updateCategory(cat.id, "name", e.target.value)}
                        placeholder="es. Platea, Palco, Galleria"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Descrizione (opzionale)</Label>
                      <Input
                        value={cat.description}
                        onChange={(e) => updateCategory(cat.id, "description", e.target.value)}
                        placeholder="es. Fila A-M, vista frontale"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Prezzo (€) *</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.50"
                        value={cat.price}
                        onChange={(e) => updateCategory(cat.id, "price", e.target.value)}
                        placeholder="25.00"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Posti Disponibili *</Label>
                      <Input
                        type="number"
                        min="1"
                        value={cat.quantity}
                        onChange={(e) => updateCategory(cat.id, "quantity", e.target.value)}
                        placeholder="100"
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-3 justify-end pb-8">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(isAdmin ? "/admin" : "/partner")}
            >
              Annulla
            </Button>
            <Button
              type="submit"
              disabled={createEvent.isPending}
              className="gap-2 min-w-[160px]"
            >
              {createEvent.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creazione...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Crea Evento
                </>
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
