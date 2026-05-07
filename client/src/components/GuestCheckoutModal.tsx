import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, UserCheck, LogIn } from "lucide-react";
import { getLoginUrl } from "@/const";

// Top 50 countries + Italy first
const COUNTRIES = [
  { code: "IT", name: "Italia" },
  { code: "ES", name: "Spagna" },
  { code: "FR", name: "Francia" },
  { code: "DE", name: "Germania" },
  { code: "GB", name: "Regno Unito" },
  { code: "US", name: "Stati Uniti" },
  { code: "RU", name: "Russia" },
  { code: "AR", name: "Argentina" },
  { code: "AU", name: "Australia" },
  { code: "AT", name: "Austria" },
  { code: "BE", name: "Belgio" },
  { code: "BR", name: "Brasile" },
  { code: "CA", name: "Canada" },
  { code: "CL", name: "Cile" },
  { code: "CN", name: "Cina" },
  { code: "CO", name: "Colombia" },
  { code: "HR", name: "Croazia" },
  { code: "CZ", name: "Repubblica Ceca" },
  { code: "DK", name: "Danimarca" },
  { code: "EG", name: "Egitto" },
  { code: "FI", name: "Finlandia" },
  { code: "GR", name: "Grecia" },
  { code: "HU", name: "Ungheria" },
  { code: "IN", name: "India" },
  { code: "ID", name: "Indonesia" },
  { code: "IE", name: "Irlanda" },
  { code: "IL", name: "Israele" },
  { code: "JP", name: "Giappone" },
  { code: "MX", name: "Messico" },
  { code: "NL", name: "Paesi Bassi" },
  { code: "NZ", name: "Nuova Zelanda" },
  { code: "NO", name: "Norvegia" },
  { code: "PL", name: "Polonia" },
  { code: "PT", name: "Portogallo" },
  { code: "RO", name: "Romania" },
  { code: "SA", name: "Arabia Saudita" },
  { code: "ZA", name: "Sudafrica" },
  { code: "KR", name: "Corea del Sud" },
  { code: "SE", name: "Svezia" },
  { code: "CH", name: "Svizzera" },
  { code: "TH", name: "Tailandia" },
  { code: "TR", name: "Turchia" },
  { code: "UA", name: "Ucraina" },
  { code: "AE", name: "Emirati Arabi" },
  { code: "VE", name: "Venezuela" },
];

export interface GuestInfo {
  firstName: string;
  lastName: string;
  email: string;
  country: string;
}

interface GuestCheckoutModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (guestInfo: GuestInfo) => void;
  loading?: boolean;
  returnPath?: string;
}

export default function GuestCheckoutModal({
  open,
  onClose,
  onConfirm,
  loading = false,
  returnPath,
}: GuestCheckoutModalProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [emailConfirm, setEmailConfirm] = useState("");
  const [country, setCountry] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!firstName.trim()) newErrors.firstName = "Il nome è obbligatorio";
    if (!lastName.trim()) newErrors.lastName = "Il cognome è obbligatorio";
    if (!email.trim()) newErrors.email = "L'email è obbligatoria";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = "Email non valida";
    if (!emailConfirm.trim()) newErrors.emailConfirm = "Conferma l'email";
    else if (email !== emailConfirm) newErrors.emailConfirm = "Le email non corrispondono";
    if (!country) newErrors.country = "Seleziona il paese";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onConfirm({ firstName, lastName, email, country });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Completa l'acquisto</DialogTitle>
          <DialogDescription>
            Inserisci i tuoi dati per procedere come ospite, oppure accedi per un'esperienza completa.
          </DialogDescription>
        </DialogHeader>

        {/* Login option */}
        <div className="bg-muted/50 rounded-lg p-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Hai già un account?</p>
            <p className="text-xs text-muted-foreground">Accedi per salvare i biglietti nel tuo profilo</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 gap-2"
            onClick={() => {
              window.location.href = getLoginUrl(returnPath);
            }}
          >
            <LogIn className="h-4 w-4" />
            Accedi
          </Button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">oppure continua come ospite</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="firstName">Nome *</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Mario"
                className={errors.firstName ? "border-destructive" : ""}
              />
              {errors.firstName && <p className="text-xs text-destructive">{errors.firstName}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="lastName">Cognome *</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Rossi"
                className={errors.lastName ? "border-destructive" : ""}
              />
              {errors.lastName && <p className="text-xs text-destructive">{errors.lastName}</p>}
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="country">Paese *</Label>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger className={errors.country ? "border-destructive" : ""}>
                <SelectValue placeholder="Seleziona il tuo paese" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {COUNTRIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.country && <p className="text-xs text-destructive">{errors.country}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="mario.rossi@email.com"
              className={errors.email ? "border-destructive" : ""}
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="emailConfirm">Conferma Email *</Label>
            <Input
              id="emailConfirm"
              type="email"
              value={emailConfirm}
              onChange={(e) => setEmailConfirm(e.target.value)}
              onPaste={(e) => e.preventDefault()} // Block paste on confirm field
              placeholder="Riscrivi la tua email"
              className={errors.emailConfirm ? "border-destructive" : ""}
            />
            {errors.emailConfirm && <p className="text-xs text-destructive">{errors.emailConfirm}</p>}
            <p className="text-xs text-muted-foreground">Non è possibile incollare l'email in questo campo</p>
          </div>

          <Button type="submit" className="w-full gap-2" disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserCheck className="h-4 w-4" />
            )}
            {loading ? "Elaborazione..." : "Procedi al pagamento"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
