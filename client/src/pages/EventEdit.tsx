import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  Euro,
  Music,
  Plus,
  Save,
  Ticket,
  Trash2,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { toast } from "sonner";

type CategoryForm = {
  id?: number;
  name: string;
  description: string;
  price: string;
  totalQuantity: string;
  availableQuantity: string;
  isNew?: boolean;
};

export default function EventEdit() {
  const { id } = useParams<{ id: string }>();
  const eventId = parseInt(id);
  const { user, isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  // Event form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("");
  const [eventDate, setEventDate] = useState("");
  const [eventEndDate, setEventEndDate] = useState("");
  const [venueName, setVenueName] = useState("");
  const [venueAddress, setVenueAddress] = useState("");
  const [venueCity, setVenueCity] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [status, setStatus] = useState<string>("");

  // Categories state
  const [categories, setCategories] = useState<CategoryForm[]>([]);
  const [deletedCategoryIds, setDeletedCategoryIds] = useState<number[]>([]);

  const { data, isLoading } = trpc.events.getById.useQuery(
    { id: eventId },
    { enabled: !!eventId && !isNaN(eventId) }
  );

  // Populate form when data loads
  useEffect(() => {
    if (data?.event) {
      const e = data.event;
      setTitle(e.title);
      setDescription(e.description);
      setCategory(e.category);
      setEventDate(new Date(e.eventDate).toISOString().slice(0, 16));
      setEventEndDate(e.eventEndDate ? new Date(e.eventEndDate).toISOString().slice(0, 16) : "");
      setVenueName(e.venueName);
      setVenueAddress(e.venueAddress);
      setVenueCity(e.venueCity);
      setImageUrl(e.imageUrl || "");
      setStatus(e.status);
    }
    if (data?.categories) {
      setCategories(
        data.categories.map((c) => ({
          id: c.id,
          name: c.name,
          description: c.description || "",
          price: parseFloat(c.price).toString(),
          totalQuantity: c.totalQuantity.toString(),
          availableQuantity: c.availableQuantity.toString(),
        }))
      );
    }
  }, [data]);

  const updateEvent = trpc.events.update.useMutation({
    onSuccess: () => {
      toast.success("Evento aggiornato con successo!");
      utils.events.getById.invalidate({ id: eventId });
      utils.admin.allEvents.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateCategory = trpc.events.updateCategory.useMutation({
    onError: (err) => toast.error(`Errore categoria: ${err.message}`),
  });

  const addCategory = trpc.events.addCategory.useMutation({
    onError: (err) => toast.error(`Errore aggiunta categoria: ${err.message}`),
  });

  const deleteCategory = trpc.events.deleteCategory.useMutation({
    onError: (err) => toast.error(`Errore eliminazione: ${err.message}`),
  });

  const handleAddCategory = () => {
    setCategories((prev) => [
      ...prev,
      {
        name: "",
        description: "",
        price: "0",
        totalQuantity: "100",
        availableQuantity: "100",
        isNew: true,
      },
    ]);
  };

  const handleRemoveCategory = (index: number) => {
    const cat = categories[index];
    if (cat.id) {
      setDeletedCategoryIds((prev) => [...prev, cat.id!]);
    }
    setCategories((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCategoryChange = (
    index: number,
    field: keyof CategoryForm,
    value: string
  ) => {
    setCategories((prev) =>
      prev.map((cat, i) => (i === index ? { ...cat, [field]: value } : cat))
    );
  };

  const handleSave = async () => {
    try {
      // 1. Update event fields
      await updateEvent.mutateAsync({
        id: eventId,
        title,
        description,
        category: category as any,
        eventDate,
        eventEndDate: eventEndDate || undefined,
        venueName,
        venueAddress,
        venueCity,
        imageUrl: imageUrl || undefined,
        status: status as any,
      });

      // 2. Delete removed categories
      for (const catId of deletedCategoryIds) {
        await deleteCategory.mutateAsync({ id: catId });
      }
      setDeletedCategoryIds([]);

      // 3. Update existing / create new categories
      for (const cat of categories) {
        if (cat.isNew) {
          await addCategory.mutateAsync({
            eventId,
            name: cat.name,
            description: cat.description || undefined,
            price: parseFloat(cat.price) || 0,
            quantity: parseInt(cat.totalQuantity) || 1,
          });
        } else if (cat.id) {
          await updateCategory.mutateAsync({
            id: cat.id,
            name: cat.name,
            description: cat.description,
            price: parseFloat(cat.price) || 0,
            totalQuantity: parseInt(cat.totalQuantity) || 0,
            availableQuantity: parseInt(cat.availableQuantity) || 0,
          });
        }
      }

      utils.events.getById.invalidate({ id: eventId });
      toast.success("Tutte le modifiche salvate!");
    } catch (err: any) {
      toast.error(err.message || "Errore durante il salvataggio");
    }
  };

  const isSaving =
    updateEvent.isPending ||
    updateCategory.isPending ||
    addCategory.isPending ||
    deleteCategory.isPending;

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAuthenticated || (user?.role !== "admin" && user?.role !== "partner")) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle>Accesso Negato</CardTitle>
            <CardDescription>
              Devi essere admin o partner per modificare gli eventi.
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

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle>Evento non trovato</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/admin">
              <Button>Torna alla Dashboard</Button>
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
              <Link href={user?.role === "admin" ? "/admin" : "/partner"} className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
                <ArrowLeft className="h-5 w-5" />
                <Music className="h-6 w-6" />
                <span className="font-bold">EventiPro</span>
              </Link>
              <div className="h-6 w-px bg-border" />
              <span className="font-semibold text-muted-foreground">
                Modifica Evento
              </span>
            </div>
            <Button onClick={handleSave} disabled={isSaving} className="gap-2">
              <Save className="h-4 w-4" />
              {isSaving ? "Salvataggio..." : "Salva Modifiche"}
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Event Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Informazioni Evento</CardTitle>
              <CardDescription>
                Modifica i dettagli principali dell'evento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 space-y-1">
                  <Label htmlFor="title">Titolo Evento *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Es. La Traviata - Giuseppe Verdi"
                  />
                </div>

                <div className="md:col-span-2 space-y-1">
                  <Label htmlFor="description">Descrizione *</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descrizione dettagliata dell'evento..."
                    rows={4}
                  />
                </div>

                <div className="space-y-1">
                  <Label>Categoria *</Label>
                  <Select value={category} onValueChange={setCategory}>
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

                {user?.role === "admin" && (
                  <div className="space-y-1">
                    <Label>Stato Pubblicazione</Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Bozza</SelectItem>
                        <SelectItem value="pending">In Attesa</SelectItem>
                        <SelectItem value="approved">Approvato</SelectItem>
                        <SelectItem value="rejected">Rifiutato</SelectItem>
                        <SelectItem value="cancelled">Annullato</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-1">
                  <Label htmlFor="eventDate">Data e Ora Inizio *</Label>
                  <Input
                    id="eventDate"
                    type="datetime-local"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="eventEndDate">Data e Ora Fine</Label>
                  <Input
                    id="eventEndDate"
                    type="datetime-local"
                    value={eventEndDate}
                    onChange={(e) => setEventEndDate(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="venueName">Nome Venue *</Label>
                  <Input
                    id="venueName"
                    value={venueName}
                    onChange={(e) => setVenueName(e.target.value)}
                    placeholder="Es. Teatro alla Scala"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="venueCity">Città *</Label>
                  <Input
                    id="venueCity"
                    value={venueCity}
                    onChange={(e) => setVenueCity(e.target.value)}
                    placeholder="Es. Milano"
                  />
                </div>

                <div className="md:col-span-2 space-y-1">
                  <Label htmlFor="venueAddress">Indirizzo Venue *</Label>
                  <Input
                    id="venueAddress"
                    value={venueAddress}
                    onChange={(e) => setVenueAddress(e.target.value)}
                    placeholder="Es. Via Filodrammatici 2"
                  />
                </div>

                <div className="md:col-span-2 space-y-1">
                  <Label htmlFor="imageUrl">URL Immagine</Label>
                  <Input
                    id="imageUrl"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://..."
                  />
                  {imageUrl && (
                    <div className="mt-2 rounded-lg overflow-hidden h-32 w-full">
                      <img
                        src={imageUrl}
                        alt="Anteprima"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ticket Categories Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Ticket className="h-5 w-5 text-primary" />
                    Categorie Biglietti
                  </CardTitle>
                  <CardDescription>
                    Gestisci tipologie, prezzi e disponibilità dei posti
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddCategory}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Aggiungi Categoria
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {categories.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed rounded-lg">
                  <Ticket className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground mb-3">
                    Nessuna categoria biglietti. Aggiungine una per iniziare.
                  </p>
                  <Button variant="outline" onClick={handleAddCategory} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Aggiungi Prima Categoria
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {categories.map((cat, index) => (
                    <div
                      key={cat.id || `new-${index}`}
                      className={`p-4 border rounded-lg space-y-3 ${
                        cat.isNew ? "border-primary/40 bg-primary/5" : "bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-muted-foreground">
                          {cat.isNew ? "✨ Nuova categoria" : `Categoria #${index + 1}`}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveCategory(index)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Nome Categoria *</Label>
                          <Input
                            value={cat.name}
                            onChange={(e) =>
                              handleCategoryChange(index, "name", e.target.value)
                            }
                            placeholder="Es. Platea, Palco, Galleria..."
                            className="h-9"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs">Descrizione</Label>
                          <Input
                            value={cat.description}
                            onChange={(e) =>
                              handleCategoryChange(index, "description", e.target.value)
                            }
                            placeholder="Es. Prima fila, vista palco..."
                            className="h-9"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs flex items-center gap-1">
                            <Euro className="h-3 w-3" />
                            Prezzo (€) *
                          </Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={cat.price}
                            onChange={(e) =>
                              handleCategoryChange(index, "price", e.target.value)
                            }
                            placeholder="0.00"
                            className="h-9"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            Posti Totali *
                          </Label>
                          <Input
                            type="number"
                            min="0"
                            value={cat.totalQuantity}
                            onChange={(e) => {
                              handleCategoryChange(index, "totalQuantity", e.target.value);
                              // If new category, keep available in sync
                              if (cat.isNew) {
                                handleCategoryChange(index, "availableQuantity", e.target.value);
                              }
                            }}
                            placeholder="100"
                            className="h-9"
                          />
                        </div>

                        {!cat.isNew && (
                          <div className="space-y-1">
                            <Label className="text-xs flex items-center gap-1">
                              <Ticket className="h-3 w-3" />
                              Posti Disponibili
                            </Label>
                            <Input
                              type="number"
                              min="0"
                              max={parseInt(cat.totalQuantity) || 9999}
                              value={cat.availableQuantity}
                              onChange={(e) =>
                                handleCategoryChange(
                                  index,
                                  "availableQuantity",
                                  e.target.value
                                )
                              }
                              placeholder="100"
                              className="h-9"
                            />
                            <p className="text-xs text-muted-foreground">
                              Venduti:{" "}
                              {Math.max(
                                0,
                                parseInt(cat.totalQuantity) -
                                  parseInt(cat.availableQuantity)
                              )}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Save Button Bottom */}
          <div className="flex justify-end gap-3">
            <Link href={user?.role === "admin" ? "/admin" : "/partner"}>
              <Button variant="outline">Annulla</Button>
            </Link>
            <Button onClick={handleSave} disabled={isSaving} className="gap-2 px-8">
              <Save className="h-4 w-4" />
              {isSaving ? "Salvataggio in corso..." : "Salva Tutte le Modifiche"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
