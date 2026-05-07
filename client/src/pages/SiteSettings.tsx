import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Settings, Palette, Type, Image, Save, RefreshCw, Eye, Globe, Phone, Mail, ChevronLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import ImageUpload from "@/components/ImageUpload";

// Default settings structure
const DEFAULT_SETTINGS = [
  // Identità
  { key: "site_name", value: "OperaMix", type: "text" as const, label: "Nome del sito", description: "Il nome visualizzato nella navbar e nel titolo del browser" },
  { key: "site_tagline", value: "La tua piattaforma per eventi culturali", type: "text" as const, label: "Tagline", description: "Sottotitolo nella homepage" },
  { key: "site_logo_url", value: "", type: "image" as const, label: "Logo del Sito", description: "Carica il logo che apparirà nella navbar e nel footer" },
  { key: "hero_title", value: "Scopri gli eventi più belli", type: "text" as const, label: "Titolo Hero", description: "Titolo principale della sezione hero in homepage" },
  { key: "hero_subtitle", value: "Musica classica, opera lirica e molto altro", type: "text" as const, label: "Sottotitolo Hero", description: "Testo sotto il titolo hero" },
  // Contatti
  { key: "contact_email", value: "", type: "text" as const, label: "Email di contatto", description: "Email mostrata nel footer e pagina contatti" },
  { key: "contact_phone", value: "", type: "text" as const, label: "Telefono", description: "Numero di telefono nel footer" },
  { key: "contact_address", value: "", type: "text" as const, label: "Indirizzo", description: "Indirizzo fisico nel footer" },
  // Social
  { key: "social_facebook", value: "", type: "text" as const, label: "Facebook URL", description: "Link alla pagina Facebook" },
  { key: "social_instagram", value: "", type: "text" as const, label: "Instagram URL", description: "Link al profilo Instagram" },
  { key: "social_youtube", value: "", type: "text" as const, label: "YouTube URL", description: "Link al canale YouTube" },
  // Colori
  { key: "color_primary", value: "#7c3aed", type: "color" as const, label: "Colore primario", description: "Colore principale dei pulsanti e accenti" },
  { key: "color_secondary", value: "#a855f7", type: "color" as const, label: "Colore secondario", description: "Colore secondario per gradienti" },
  { key: "color_accent", value: "#f59e0b", type: "color" as const, label: "Colore accento", description: "Colore per badge e dettagli" },
  { key: "color_hero_from", value: "#1e1b4b", type: "color" as const, label: "Hero gradiente inizio", description: "Colore iniziale del gradiente hero" },
  { key: "color_hero_to", value: "#4c1d95", type: "color" as const, label: "Hero gradiente fine", description: "Colore finale del gradiente hero" },
  // Email e notifiche
  { key: "site_url", value: "https://eventitix-yemokzo8.manus.space", type: "text" as const, label: "URL del sito", description: "Indirizzo web completo del sito (usato nei link delle email)" },
  { key: "notification_email", value: "", type: "text" as const, label: "Email notifiche ordini", description: "Ricevi una copia di ogni ordine completato a questo indirizzo" },
  { key: "smtp_from_name", value: "OperaMix", type: "text" as const, label: "Nome mittente email", description: "Nome visualizzato come mittente nelle email agli acquirenti" },
  // Commissioni
  { key: "default_commission", value: "10", type: "text" as const, label: "Commissione default (%)", description: "Percentuale di commissione predefinita per i partner" },
  { key: "currency_symbol", value: "€", type: "text" as const, label: "Simbolo valuta", description: "Simbolo della valuta usata nel sito" },
  // Footer
  { key: "footer_text", value: "© 2025 OperaMix. Tutti i diritti riservati.", type: "text" as const, label: "Testo footer", description: "Testo del copyright nel footer" },
  { key: "footer_about", value: "", type: "text" as const, label: "Testo 'Chi siamo' footer", description: "Breve descrizione nel footer" },
];

export default function SiteSettings() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const { data: settingsData, isLoading, refetch } = trpc.siteSettings.getAll.useQuery();
  const setBulkMutation = trpc.siteSettings.setBulk.useMutation();

  const [values, setValues] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Redirect if not admin
  useEffect(() => {
    if (!isAuthenticated) return;
    if (user && user.role !== "admin") {
      navigate("/");
    }
  }, [user, isAuthenticated]);

  // Load settings into state
  useEffect(() => {
    const initial: Record<string, string> = {};
    DEFAULT_SETTINGS.forEach(s => {
      initial[s.key] = s.value;
    });
    if (settingsData) {
      settingsData.forEach(s => {
        initial[s.settingKey] = s.settingValue || "";
      });
    }
    setValues(initial);
  }, [settingsData]);

  const handleChange = (key: string, value: string) => {
    setValues(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const settingsToSave = DEFAULT_SETTINGS.map(s => ({
        key: s.key,
        value: values[s.key] ?? null,
        type: s.type,
        label: s.label,
      }));
      await setBulkMutation.mutateAsync(settingsToSave);
      setIsDirty(false);
      toast.success("Impostazioni salvate con successo!");
      refetch();
    } catch (e) {
      toast.error("Errore nel salvataggio delle impostazioni");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    const initial: Record<string, string> = {};
    DEFAULT_SETTINGS.forEach(s => { initial[s.key] = s.value; });
    setValues(initial);
    setIsDirty(true);
    toast.info("Valori predefiniti ripristinati. Clicca Salva per confermare.");
  };

  const renderField = (setting: typeof DEFAULT_SETTINGS[0]) => {
    const val = values[setting.key] ?? "";
    if (setting.type === "image") {
      return (
        <ImageUpload
          value={val || null}
          onChange={(url) => handleChange(setting.key, url)}
          onClear={() => handleChange(setting.key, "")}
          label=""
          aspectRatio="auto"
        />
      );
    }
    if (setting.type === "color") {
      return (
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={val || "#7c3aed"}
            onChange={e => handleChange(setting.key, e.target.value)}
            className="w-12 h-10 rounded cursor-pointer border border-border"
          />
          <Input
            value={val}
            onChange={e => handleChange(setting.key, e.target.value)}
            placeholder="#7c3aed"
            className="font-mono text-sm"
          />
          {val && (
            <div
              className="w-8 h-8 rounded-full border border-border shrink-0"
              style={{ backgroundColor: val }}
            />
          )}
        </div>
      );
    }
    return (
      <Input
        value={val}
        onChange={e => handleChange(setting.key, e.target.value)}
        placeholder={setting.value || setting.label}
      />
    );
  };

  const identitySettings = DEFAULT_SETTINGS.filter(s => ["site_name","site_tagline","site_logo_url","hero_title","hero_subtitle"].includes(s.key));
  const colorSettings = DEFAULT_SETTINGS.filter(s => s.type === "color");
  const contactSettings = DEFAULT_SETTINGS.filter(s => s.key.startsWith("contact_") || s.key.startsWith("social_") || s.key === "footer_text" || s.key === "footer_about");
  const businessSettings = DEFAULT_SETTINGS.filter(s => ["default_commission","currency_symbol"].includes(s.key));
  const emailSettings = DEFAULT_SETTINGS.filter(s => ["site_url","notification_email","smtp_from_name"].includes(s.key));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="gap-2">
                <ChevronLeft className="w-4 h-4" />
                Dashboard Admin
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Settings className="w-6 h-6 text-primary" />
                Impostazioni Sito
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Personalizza l'aspetto e i contenuti del sito senza toccare il codice
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isDirty && (
              <Badge variant="secondary" className="text-orange-600 bg-orange-50 border-orange-200">
                Modifiche non salvate
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={handleReset} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Ripristina
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !isDirty} className="gap-2">
              <Save className="w-4 h-4" />
              {isSaving ? "Salvataggio..." : "Salva tutto"}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="identity">
          <TabsList className="mb-6">
            <TabsTrigger value="identity" className="gap-2">
              <Globe className="w-4 h-4" />
              Identità
            </TabsTrigger>
            <TabsTrigger value="colors" className="gap-2">
              <Palette className="w-4 h-4" />
              Colori
            </TabsTrigger>
            <TabsTrigger value="contacts" className="gap-2">
              <Phone className="w-4 h-4" />
              Contatti & Social
            </TabsTrigger>
          <TabsTrigger value="business" className="gap-2">
            <Settings className="w-4 h-4" />
            Business
          </TabsTrigger>
          <TabsTrigger value="email" className="gap-2">
            <Mail className="w-4 h-4" />
            Email
          </TabsTrigger>
          </TabsList>

          {/* IDENTITY TAB */}
          <TabsContent value="identity">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Type className="w-5 h-5" />
                  Identità del Sito
                </CardTitle>
                <CardDescription>Nome, logo e testi principali della homepage</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {identitySettings.map(setting => (
                  <div key={setting.key} className="space-y-2">
                    <Label htmlFor={setting.key} className="font-medium">
                      {setting.label}
                    </Label>
                    {renderField(setting)}
                    <p className="text-xs text-muted-foreground">{setting.description}</p>
                  </div>
                ))}
                {/* Logo preview */}
                {values["site_logo_url"] && (
                  <div className="mt-4 p-4 border rounded-lg bg-muted/30">
                    <p className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      Anteprima Logo
                    </p>
                    <img
                      src={values["site_logo_url"]}
                      alt="Logo preview"
                      className="h-12 object-contain"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* COLORS TAB */}
          <TabsContent value="colors">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Palette Colori
                </CardTitle>
                <CardDescription>Personalizza i colori principali del sito</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {colorSettings.map(setting => (
                  <div key={setting.key} className="space-y-2">
                    <Label htmlFor={setting.key} className="font-medium">
                      {setting.label}
                    </Label>
                    {renderField(setting)}
                    <p className="text-xs text-muted-foreground">{setting.description}</p>
                  </div>
                ))}
                <Separator />
                {/* Color preview */}
                <div>
                  <p className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Anteprima Palette
                  </p>
                  <div className="flex gap-3 flex-wrap">
                    {colorSettings.map(s => (
                      <div key={s.key} className="text-center">
                        <div
                          className="w-12 h-12 rounded-full border-2 border-white shadow-md mx-auto mb-1"
                          style={{ backgroundColor: values[s.key] || s.value }}
                        />
                        <p className="text-xs text-muted-foreground">{s.label.replace("Colore ", "").replace("Hero gradiente ", "")}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-4 rounded-lg text-white text-center text-sm font-medium"
                  style={{ background: `linear-gradient(135deg, ${values["color_hero_from"] || "#1e1b4b"}, ${values["color_hero_to"] || "#4c1d95"})` }}>
                  Anteprima gradiente hero
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CONTACTS TAB */}
          <TabsContent value="contacts">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Contatti & Social
                </CardTitle>
                <CardDescription>Informazioni di contatto e link ai social network</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {contactSettings.map(setting => (
                  <div key={setting.key} className="space-y-2">
                    <Label htmlFor={setting.key} className="font-medium">
                      {setting.label}
                    </Label>
                    {renderField(setting)}
                    <p className="text-xs text-muted-foreground">{setting.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* EMAIL TAB */}
          <TabsContent value="email">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Impostazioni Email
                </CardTitle>
                <CardDescription>
                  Configura le email automatiche inviate agli acquirenti dopo ogni ordine.
                  Per attivare l'invio email, imposta le credenziali SMTP nelle variabili d'ambiente del server
                  (<code className="text-xs bg-muted px-1 rounded">SMTP_HOST</code>, <code className="text-xs bg-muted px-1 rounded">SMTP_USER</code>, <code className="text-xs bg-muted px-1 rounded">SMTP_PASS</code>).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-blue-800 mb-1">Come funziona</p>
                  <p className="text-sm text-blue-700">
                    Dopo ogni acquisto completato, il sistema invia automaticamente:
                  </p>
                  <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
                    <li>Una email di conferma all'acquirente con i codici QR dei biglietti</li>
                    <li>Una copia di notifica all'indirizzo configurato qui sotto</li>
                  </ul>
                </div>
                {emailSettings.map(setting => (
                  <div key={setting.key} className="space-y-2">
                    <Label htmlFor={setting.key} className="font-medium">
                      {setting.label}
                    </Label>
                    {renderField(setting)}
                    <p className="text-xs text-muted-foreground">{setting.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* BUSINESS TAB */}
          <TabsContent value="business">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Impostazioni Business
                </CardTitle>
                <CardDescription>Commissioni e valuta</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {businessSettings.map(setting => (
                  <div key={setting.key} className="space-y-2">
                    <Label htmlFor={setting.key} className="font-medium">
                      {setting.label}
                    </Label>
                    {renderField(setting)}
                    <p className="text-xs text-muted-foreground">{setting.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save button bottom */}
        <div className="mt-6 flex justify-end">
          <Button onClick={handleSave} disabled={isSaving || !isDirty} size="lg" className="gap-2">
            <Save className="w-5 h-5" />
            {isSaving ? "Salvataggio in corso..." : "Salva tutte le impostazioni"}
          </Button>
        </div>
      </div>
    </div>
  );
}
