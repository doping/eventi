import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import {
  BarChart3,
  Calendar,
  CheckCircle,
  Clock,
  Euro,
  Music,
  QrCode,
  ShieldCheck,
  Ticket,
  Users,
  XCircle,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

export default function AdminDashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [qrInput, setQrInput] = useState("");
  const [validationResult, setValidationResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");

  const utils = trpc.useUtils();

  const { data: stats, isLoading: statsLoading } = trpc.admin.stats.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  const { data: allEvents, isLoading: eventsLoading } = trpc.admin.allEvents.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin" && activeTab === "events",
  });

  const { data: allOrders, isLoading: ordersLoading } = trpc.admin.allOrders.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin" && activeTab === "orders",
  });

  const { data: allUsers, isLoading: usersLoading } = trpc.admin.allUsers.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin" && activeTab === "users",
  });

  const { data: pendingEvents } = trpc.events.pending.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  const approveEvent = trpc.events.approve.useMutation({
    onSuccess: () => {
      toast.success("Evento approvato con successo!");
      utils.events.pending.invalidate();
      utils.admin.allEvents.invalidate();
      utils.admin.stats.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const rejectEvent = trpc.events.reject.useMutation({
    onSuccess: () => {
      toast.success("Evento rifiutato.");
      utils.events.pending.invalidate();
      utils.admin.allEvents.invalidate();
      utils.admin.stats.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const validateTicket = trpc.tickets.validate.useMutation({
    onSuccess: (data) => {
      setValidationResult({ success: true, data });
      toast.success("Biglietto validato con successo!");
    },
    onError: (err) => {
      setValidationResult({ success: false, error: err.message });
      toast.error(err.message);
    },
  });

  const updateUserRole = trpc.admin.updateUserRole.useMutation({
    onSuccess: () => {
      toast.success("Ruolo aggiornato con successo!");
      utils.admin.allUsers.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleValidateTicket = () => {
    if (!qrInput.trim()) {
      toast.error("Inserisci un codice QR");
      return;
    }
    setValidationResult(null);
    validateTicket.mutate({ qrCode: qrInput.trim() });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <ShieldCheck className="h-12 w-12 mx-auto text-destructive mb-4" />
            <CardTitle>Accesso Negato</CardTitle>
            <CardDescription>
              Devi essere un amministratore per accedere a questa pagina.
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
                <Music className="h-7 w-7" />
                <span className="text-xl font-bold">EventiPro</span>
              </Link>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <span className="font-semibold">Dashboard Admin</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {pendingEvents && pendingEvents.length > 0 && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                  <AlertCircle className="h-4 w-4" />
                  {pendingEvents.length} eventi in attesa
                </span>
              )}
              <span className="text-sm text-muted-foreground">{user?.name}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8">
            <TabsTrigger value="overview">Panoramica</TabsTrigger>
            <TabsTrigger value="events" className="relative">
              Eventi
              {pendingEvents && pendingEvents.length > 0 && (
                <span className="ml-2 inline-flex items-center justify-center w-5 h-5 bg-yellow-500 text-white rounded-full text-xs">
                  {pendingEvents.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="orders">Ordini</TabsTrigger>
            <TabsTrigger value="users">Utenti</TabsTrigger>
            <TabsTrigger value="validate">Valida Biglietti</TabsTrigger>
          </TabsList>

          {/* ===== OVERVIEW TAB ===== */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Totale Incassi
                  </CardTitle>
                  <Euro className="h-5 w-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">
                    {statsLoading ? "..." : `€${(stats?.totalRevenue ?? 0).toFixed(2)}`}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Da ordini completati</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Biglietti Venduti
                  </CardTitle>
                  <Ticket className="h-5 w-5 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {statsLoading ? "..." : stats?.totalTickets ?? 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    In {stats?.totalOrders ?? 0} ordini
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Totale Eventi
                  </CardTitle>
                  <Calendar className="h-5 w-5 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {statsLoading ? "..." : stats?.totalEvents ?? 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats?.pendingEvents ?? 0} in attesa di approvazione
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Utenti Registrati
                  </CardTitle>
                  <Users className="h-5 w-5 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {statsLoading ? "..." : stats?.totalUsers ?? 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Totale utenti piattaforma</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Ordini Completati
                  </CardTitle>
                  <BarChart3 className="h-5 w-5 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {statsLoading ? "..." : stats?.totalOrders ?? 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Pagamenti confermati</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    In Attesa Approvazione
                  </CardTitle>
                  <Clock className="h-5 w-5 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-yellow-600">
                    {statsLoading ? "..." : stats?.pendingEvents ?? 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats?.pendingEvents && stats.pendingEvents > 0
                      ? "Richiede attenzione"
                      : "Nessun evento in attesa"}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Pending Events Quick Actions */}
            {pendingEvents && pendingEvents.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    Eventi Partner in Attesa di Approvazione
                  </CardTitle>
                  <CardDescription>
                    Questi eventi sono stati inviati dai partner e richiedono la tua approvazione
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pendingEvents.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center justify-between p-4 border rounded-lg bg-yellow-50 border-yellow-200"
                      >
                        <div>
                          <h4 className="font-semibold">{event.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {event.venueCity} ·{" "}
                            {new Date(event.eventDate).toLocaleDateString("it-IT")}
                          </p>
                          <span className="inline-block mt-1 px-2 py-0.5 bg-muted rounded text-xs">
                            {event.category}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => approveEvent.mutate({ id: event.id })}
                            disabled={approveEvent.isPending}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approva
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => rejectEvent.mutate({ id: event.id })}
                            disabled={rejectEvent.isPending}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Rifiuta
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ===== EVENTS TAB ===== */}
          <TabsContent value="events">
            <Card>
              <CardHeader>
                <CardTitle>Tutti gli Eventi</CardTitle>
                <CardDescription>
                  Gestisci tutti gli eventi della piattaforma
                </CardDescription>
              </CardHeader>
              <CardContent>
                {eventsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 bg-muted rounded animate-pulse" />
                    ))}
                  </div>
                ) : allEvents && allEvents.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-2 font-semibold">Titolo</th>
                          <th className="text-left py-3 px-2 font-semibold">Categoria</th>
                          <th className="text-left py-3 px-2 font-semibold">Città</th>
                          <th className="text-left py-3 px-2 font-semibold">Data</th>
                          <th className="text-left py-3 px-2 font-semibold">Stato</th>
                          <th className="text-left py-3 px-2 font-semibold">Tipo</th>
                          <th className="text-left py-3 px-2 font-semibold">Azioni</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allEvents.map((event) => (
                          <tr key={event.id} className="border-b hover:bg-muted/30">
                            <td className="py-3 px-2 font-medium max-w-[200px] truncate">
                              {event.title}
                            </td>
                            <td className="py-3 px-2 capitalize">{event.category}</td>
                            <td className="py-3 px-2">{event.venueCity}</td>
                            <td className="py-3 px-2">
                              {new Date(event.eventDate).toLocaleDateString("it-IT")}
                            </td>
                            <td className="py-3 px-2">
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  event.status === "approved"
                                    ? "bg-green-100 text-green-800"
                                    : event.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : event.status === "rejected"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {event.status === "approved"
                                  ? "Approvato"
                                  : event.status === "pending"
                                  ? "In attesa"
                                  : event.status === "rejected"
                                  ? "Rifiutato"
                                  : event.status}
                              </span>
                            </td>
                            <td className="py-3 px-2">
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs ${
                                  event.isPartnerEvent
                                    ? "bg-purple-100 text-purple-800"
                                    : "bg-blue-100 text-blue-800"
                                }`}
                              >
                                {event.isPartnerEvent ? "Partner" : "Proprio"}
                              </span>
                            </td>
                            <td className="py-3 px-2">
                              <div className="flex gap-1">
                                {event.status === "pending" && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 text-xs text-green-700 border-green-300 hover:bg-green-50"
                                      onClick={() => approveEvent.mutate({ id: event.id })}
                                    >
                                      Approva
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 text-xs text-red-700 border-red-300 hover:bg-red-50"
                                      onClick={() => rejectEvent.mutate({ id: event.id })}
                                    >
                                      Rifiuta
                                    </Button>
                                  </>
                                )}
                                <Link href={`/events/${event.id}/edit`}>
                                  <Button size="sm" variant="outline" className="h-7 text-xs">
                                    Modifica
                                  </Button>
                                </Link>
                                <Link href={`/events/${event.id}`}>
                                  <Button size="sm" variant="ghost" className="h-7 text-xs">
                                    Vedi
                                  </Button>
                                </Link>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">Nessun evento trovato</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== ORDERS TAB ===== */}
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Tutti gli Ordini</CardTitle>
                <CardDescription>Ultimi 100 ordini della piattaforma</CardDescription>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 bg-muted rounded animate-pulse" />
                    ))}
                  </div>
                ) : allOrders && allOrders.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-2 font-semibold">N° Ordine</th>
                          <th className="text-left py-3 px-2 font-semibold">Cliente</th>
                          <th className="text-left py-3 px-2 font-semibold">Totale</th>
                          <th className="text-left py-3 px-2 font-semibold">Commissione</th>
                          <th className="text-left py-3 px-2 font-semibold">Stato</th>
                          <th className="text-left py-3 px-2 font-semibold">Data</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allOrders.map((order) => (
                          <tr key={order.id} className="border-b hover:bg-muted/30">
                            <td className="py-3 px-2 font-mono text-xs">{order.orderNumber}</td>
                            <td className="py-3 px-2">
                              <div>
                                <p className="font-medium">{order.userName || "—"}</p>
                                <p className="text-xs text-muted-foreground">{order.userEmail}</p>
                              </div>
                            </td>
                            <td className="py-3 px-2 font-semibold text-primary">
                              €{parseFloat(order.totalAmount).toFixed(2)}
                            </td>
                            <td className="py-3 px-2 text-muted-foreground">
                              €{parseFloat(order.commissionAmount).toFixed(2)}
                            </td>
                            <td className="py-3 px-2">
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
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
                              </span>
                            </td>
                            <td className="py-3 px-2 text-muted-foreground">
                              {new Date(order.createdAt).toLocaleDateString("it-IT")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">Nessun ordine trovato</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== USERS TAB ===== */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Gestione Utenti</CardTitle>
                <CardDescription>
                  Visualizza e modifica i ruoli degli utenti. Promuovi un utente a "partner" per
                  permettergli di inserire eventi.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 bg-muted rounded animate-pulse" />
                    ))}
                  </div>
                ) : allUsers && allUsers.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-2 font-semibold">Nome</th>
                          <th className="text-left py-3 px-2 font-semibold">Email</th>
                          <th className="text-left py-3 px-2 font-semibold">Ruolo Attuale</th>
                          <th className="text-left py-3 px-2 font-semibold">Registrato</th>
                          <th className="text-left py-3 px-2 font-semibold">Cambia Ruolo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allUsers.map((u) => (
                          <tr key={u.id} className="border-b hover:bg-muted/30">
                            <td className="py-3 px-2 font-medium">{u.name || "—"}</td>
                            <td className="py-3 px-2 text-muted-foreground">{u.email || "—"}</td>
                            <td className="py-3 px-2">
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  u.role === "admin"
                                    ? "bg-red-100 text-red-800"
                                    : u.role === "partner"
                                    ? "bg-purple-100 text-purple-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {u.role === "admin"
                                  ? "Admin"
                                  : u.role === "partner"
                                  ? "Partner"
                                  : "Utente"}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-muted-foreground">
                              {new Date(u.createdAt).toLocaleDateString("it-IT")}
                            </td>
                            <td className="py-3 px-2">
                              {u.id !== user?.id ? (
                                <Select
                                  value={u.role}
                                  onValueChange={(role: any) =>
                                    updateUserRole.mutate({ userId: u.id, role })
                                  }
                                >
                                  <SelectTrigger className="w-[130px] h-8 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="user">Utente</SelectItem>
                                    <SelectItem value="partner">Partner</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                  </SelectContent>
                                </Select>
                              ) : (
                                <span className="text-xs text-muted-foreground italic">
                                  (tu)
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">Nessun utente trovato</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== VALIDATE TICKETS TAB ===== */}
          <TabsContent value="validate">
            <div className="max-w-lg mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <QrCode className="h-6 w-6 text-primary" />
                    Validazione Biglietti
                  </CardTitle>
                  <CardDescription>
                    Inserisci il codice QR del biglietto per validarlo all'ingresso. Il codice
                    inizia con "TKT-" seguito da 16 caratteri.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Es. TKT-abc123def456ghi7"
                      value={qrInput}
                      onChange={(e) => {
                        setQrInput(e.target.value);
                        setValidationResult(null);
                      }}
                      onKeyDown={(e) => e.key === "Enter" && handleValidateTicket()}
                      className="font-mono"
                    />
                    <Button
                      onClick={handleValidateTicket}
                      disabled={validateTicket.isPending || !qrInput.trim()}
                    >
                      {validateTicket.isPending ? "..." : "Valida"}
                    </Button>
                  </div>

                  {validationResult && (
                    <div
                      className={`p-4 rounded-lg border ${
                        validationResult.success
                          ? "bg-green-50 border-green-200"
                          : "bg-red-50 border-red-200"
                      }`}
                    >
                      {validationResult.success ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-green-700 font-semibold">
                            <CheckCircle className="h-5 w-5" />
                            Biglietto Valido!
                          </div>
                          <div className="text-sm space-y-1">
                            <p>
                              <span className="font-medium">Evento:</span>{" "}
                              {validationResult.data?.event?.title}
                            </p>
                            <p>
                              <span className="font-medium">Categoria:</span>{" "}
                              {validationResult.data?.category?.name}
                            </p>
                            <p>
                              <span className="font-medium">Intestatario:</span>{" "}
                              {validationResult.data?.ticket?.holderName || "—"}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-red-700 font-semibold">
                          <XCircle className="h-5 w-5" />
                          {validationResult.error === "Ticket already validated"
                            ? "Biglietto già utilizzato!"
                            : validationResult.error === "Ticket not found"
                            ? "Biglietto non trovato"
                            : validationResult.error}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold text-sm mb-2">Come funziona:</h4>
                    <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                      <li>L'utente mostra il QR code dal biglietto PDF</li>
                      <li>Scansiona il QR code o inserisci il codice manualmente</li>
                      <li>Il sistema verifica la validità e segna il biglietto come usato</li>
                      <li>I biglietti già usati vengono rifiutati automaticamente</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
