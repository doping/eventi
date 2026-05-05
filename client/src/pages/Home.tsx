import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import Navbar from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { CalendarIcon, MapPin, Music, Search, Ticket, X } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import NewsletterBanner from "@/components/NewsletterBanner";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const siteSettings = useSiteSettings();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [selectedCity, setSelectedCity] = useState<string | undefined>();
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [calendarOpen, setCalendarOpen] = useState(false);

  const { data: events, isLoading } = trpc.events.list.useQuery({
    search: searchQuery || undefined,
    category: selectedCategory && selectedCategory !== "all" ? selectedCategory : undefined,
    city: selectedCity || undefined,
    dateFrom: dateRange?.from ? dateRange.from.toISOString() : undefined,
    dateTo: dateRange?.to ? dateRange.to.toISOString() : undefined,
  });

  const hasFilters = !!(selectedCategory && selectedCategory !== "all") || !!selectedCity || !!searchQuery || !!dateRange;

  const clearFilters = () => {
    setSelectedCategory(undefined);
    setSelectedCity(undefined);
    setSearchQuery("");
    setDateRange(undefined);
  };

  const getMinPrice = (event: any) => {
    // Events from list query don't include categories, show placeholder
    return null;
  };

  const formatDateRange = () => {
    if (!dateRange?.from) return "Seleziona date";
    if (!dateRange.to) return format(dateRange.from, "d MMM yyyy", { locale: it });
    return `${format(dateRange.from, "d MMM", { locale: it })} – ${format(dateRange.to, "d MMM yyyy", { locale: it })}`;
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section
        className="relative py-20"
        style={{
          background: `linear-gradient(135deg, ${siteSettings.colorHeroFrom} 0%, ${siteSettings.colorHeroTo} 100%)`,
        }}
      >
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white drop-shadow-lg">
              {siteSettings.heroTitle}
            </h1>
            <p className="text-xl text-white/80 mb-8">
              {siteSettings.heroSubtitle}
            </p>

            {/* Search Bar */}
            <div className="flex gap-2 max-w-2xl mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Cerca eventi, artisti, luoghi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 bg-white/95"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters Bar */}
      <section className="border-b bg-white shadow-sm sticky top-[64px] z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap gap-3 items-center">
            {/* Category filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutte le categorie</SelectItem>
                <SelectItem value="classica">Musica Classica</SelectItem>
                <SelectItem value="lirica">Opera Lirica</SelectItem>
                <SelectItem value="teatro">Teatro</SelectItem>
                <SelectItem value="danza">Danza</SelectItem>
                <SelectItem value="altro">Altro</SelectItem>
              </SelectContent>
            </Select>

            {/* City filter */}
            <Input
              type="text"
              placeholder="Città..."
              value={selectedCity || ""}
              onChange={(e) => setSelectedCity(e.target.value || undefined)}
              className="w-[160px]"
            />

            {/* Date range picker */}
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`w-[220px] justify-start text-left font-normal gap-2 ${!dateRange ? "text-muted-foreground" : ""}`}
                >
                  <CalendarIcon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{formatDateRange()}</span>
                  {dateRange && (
                    <X
                      className="h-3 w-3 ml-auto shrink-0 opacity-60 hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDateRange(undefined);
                      }}
                    />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={(range) => {
                    setDateRange(range);
                    if (range?.from && range?.to) setCalendarOpen(false);
                  }}
                  numberOfMonths={2}
                  locale={it}
                  disabled={{ before: new Date() }}
                  initialFocus
                />
                <div className="flex justify-end p-2 border-t gap-2">
                  <Button variant="ghost" size="sm" onClick={() => { setDateRange(undefined); setCalendarOpen(false); }}>
                    Cancella
                  </Button>
                  <Button size="sm" onClick={() => setCalendarOpen(false)}>
                    Applica
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            {/* Active filters + clear */}
            {hasFilters && (
              <div className="flex items-center gap-2">
                {selectedCategory && selectedCategory !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    {selectedCategory}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedCategory(undefined)} />
                  </Badge>
                )}
                {selectedCity && (
                  <Badge variant="secondary" className="gap-1">
                    {selectedCity}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedCity(undefined)} />
                  </Badge>
                )}
                {searchQuery && (
                  <Badge variant="secondary" className="gap-1">
                    "{searchQuery}"
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchQuery("")} />
                  </Badge>
                )}
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground hover:text-foreground">
                  Cancella tutto
                </Button>
              </div>
            )}

            <div className="ml-auto text-sm text-muted-foreground hidden md:block">
              {!isLoading && events ? `${events.length} event${events.length === 1 ? "o" : "i"} trovati` : ""}
            </div>
          </div>
        </div>
      </section>

      {/* Events Grid */}
      <section className="py-12 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8">
            {hasFilters ? "Risultati della ricerca" : "Eventi in Programma"}
          </h2>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="overflow-hidden animate-pulse">
                  <div className="h-48 bg-muted" />
                  <CardHeader>
                    <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : events && events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <Link key={event.id} href={`/events/${event.id}`} className="block h-full">
                  <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 h-full group cursor-pointer flex flex-col">
                    {event.imageUrl ? (
                      <div className="h-48 overflow-hidden shrink-0">
                        <img
                          src={event.imageUrl}
                          alt={event.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="h-48 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0">
                        <Music className="h-16 w-16 text-primary/40" />
                      </div>
                    )}

                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors text-lg leading-tight">
                          {event.title}
                        </CardTitle>
                        <Badge variant="outline" className="shrink-0 text-xs capitalize">
                          {event.category}
                        </Badge>
                      </div>
                      <CardDescription className="line-clamp-2 text-sm">
                        {event.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-2 pb-3 flex-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CalendarIcon className="h-4 w-4 shrink-0" />
                        <span>
                          {new Date(event.eventDate).toLocaleDateString("it-IT", {
                            weekday: "short",
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 shrink-0" />
                        <span className="line-clamp-1">{event.venueName}, {event.venueCity}</span>
                      </div>
                    </CardContent>

                    <CardFooter className="pt-0">
                      <Button
                        className="w-full rounded-full font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                        size="lg"
                      >
                        <Ticket className="h-4 w-4 mr-2" />
                        Acquista Biglietti
                      </Button>
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Music className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nessun evento trovato</h3>
              <p className="text-muted-foreground mb-4">
                {hasFilters ? "Prova a modificare i filtri di ricerca" : "Torna più tardi per nuovi eventi"}
              </p>
              {hasFilters && (
                <Button variant="outline" onClick={clearFilters}>
                  Rimuovi tutti i filtri
                </Button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Newsletter */}
      <NewsletterBanner />

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8 text-sm">
            <div>
              <h4 className="font-semibold mb-3">Collabora</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link href="/eventi-privati" className="hover:text-foreground transition-colors">Eventi Privati</Link></li>
                <li><Link href="/sei-una-location" className="hover:text-foreground transition-colors">Sei una Location?</Link></li>
                <li><Link href="/sei-un-artista" className="hover:text-foreground transition-colors">Sei un Artista?</Link></li>
                <li><Link href="/sei-un-creator" className="hover:text-foreground transition-colors">Sei un Creator?</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Azienda</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link href="/lavora-con-noi" className="hover:text-foreground transition-colors">Lavora con Noi</Link></li>
                <li><Link href="/termini-e-condizioni" className="hover:text-foreground transition-colors">Termini & Condizioni</Link></li>
                <li><Link href="/termini-e-condizioni" className="hover:text-foreground transition-colors">FAQ</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-6 text-center text-xs text-muted-foreground">
            <p>&copy; 2026 EventiPro. Tutti i diritti riservati.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
