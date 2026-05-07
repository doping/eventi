import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { CheckCircle, XCircle, Clock, Ticket, Calendar, MapPin, User, Tag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

/**
 * Public ticket verification page
 * Accessible at /verify/:qrCode
 * Shows ticket status without requiring login
 */
export default function TicketVerify() {
  const [location] = useLocation();
  const qrCode = location.split("/verify/")[1]?.split("?")[0] || "";

  const { data, isLoading, error } = trpc.tickets.checkStatus.useQuery(
    { qrCode },
    { enabled: !!qrCode, retry: false }
  );

  const validateMutation = trpc.tickets.validate.useMutation();

  if (!qrCode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-white/10 backdrop-blur border-white/20 text-white">
          <CardContent className="pt-8 pb-8 text-center">
            <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Codice non valido</h2>
            <p className="text-white/70">Nessun codice biglietto trovato nell'URL.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-white/10 backdrop-blur border-white/20 text-white">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-16 h-16 rounded-full border-4 border-purple-400 border-t-transparent animate-spin mx-auto mb-4" />
            <p className="text-white/70">Verifica biglietto in corso...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-white/10 backdrop-blur border-white/20 text-white">
          <CardContent className="pt-8 pb-8 text-center">
            <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Biglietto non trovato</h2>
            <p className="text-white/70 mb-6">Questo codice QR non corrisponde a nessun biglietto valido nel sistema.</p>
            <Link href="/">
              <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                Torna alla homepage
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { ticket, event, category } = data;
  const isValidated = ticket.isValidated;

  const formatDate = (date: Date | string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("it-IT", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-4">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 text-white/60 text-sm mb-2">
            <Ticket className="w-4 h-4" />
            <span>OperaMix — Verifica Biglietto</span>
          </div>
        </div>

        {/* Status Card */}
        <Card className={`border-2 ${isValidated ? "border-red-500/50 bg-red-950/30" : "border-green-500/50 bg-green-950/30"} backdrop-blur text-white`}>
          <CardContent className="pt-8 pb-8 text-center">
            {isValidated ? (
              <>
                <XCircle className="w-20 h-20 text-red-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-red-300 mb-2">Biglietto Già Usato</h2>
                <p className="text-white/70 text-sm">
                  Questo biglietto è stato già validato e non può essere riutilizzato.
                </p>
                {ticket.validatedAt && (
                  <p className="text-red-300/70 text-xs mt-2">
                    Validato il: {formatDate(ticket.validatedAt)}
                  </p>
                )}
              </>
            ) : (
              <>
                <CheckCircle className="w-20 h-20 text-green-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-green-300 mb-2">Biglietto Valido</h2>
                <p className="text-white/70 text-sm">
                  Questo biglietto è autentico e non è ancora stato utilizzato.
                </p>
                <Badge className="mt-3 bg-green-500/20 text-green-300 border-green-500/30">
                  <Clock className="w-3 h-3 mr-1" />
                  In attesa di validazione
                </Badge>
              </>
            )}
          </CardContent>
        </Card>

        {/* Ticket Details */}
        <Card className="bg-white/10 backdrop-blur border-white/20 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-white/90">Dettagli Biglietto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {event && (
              <>
                <div className="flex items-start gap-3">
                  <Ticket className="w-4 h-4 text-purple-300 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-white/50 uppercase tracking-wide">Evento</p>
                    <p className="font-semibold">{event.title}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-purple-300 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-white/50 uppercase tracking-wide">Data</p>
                    <p className="text-sm">{formatDate(event.eventDate)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-purple-300 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-white/50 uppercase tracking-wide">Luogo</p>
                    <p className="text-sm">{event.venueName}, {event.venueCity}</p>
                  </div>
                </div>
              </>
            )}
            {category && (
              <div className="flex items-start gap-3">
                <Tag className="w-4 h-4 text-purple-300 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-white/50 uppercase tracking-wide">Categoria</p>
                  <p className="text-sm">{category.name}</p>
                </div>
              </div>
            )}
            {ticket.holderName && (
              <div className="flex items-start gap-3">
                <User className="w-4 h-4 text-purple-300 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-white/50 uppercase tracking-wide">Intestatario</p>
                  <p className="text-sm">{ticket.holderName}</p>
                </div>
              </div>
            )}
            <div className="pt-2 border-t border-white/10">
              <p className="text-xs text-white/40 font-mono break-all">{ticket.qrCode}</p>
            </div>
          </CardContent>
        </Card>

        {/* Admin validation note */}
        {!isValidated && (
          <p className="text-center text-white/40 text-xs">
            La validazione definitiva avviene tramite la Dashboard Admin
          </p>
        )}

        <div className="text-center">
          <Link href="/">
            <Button variant="ghost" className="text-white/50 hover:text-white hover:bg-white/10 text-sm">
              ← Torna alla homepage
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
