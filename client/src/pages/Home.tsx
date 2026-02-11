import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Calendar, MapPin, Music, Search, Ticket } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [selectedCity, setSelectedCity] = useState<string | undefined>();

  const { data: events, isLoading } = trpc.events.list.useQuery({
    search: searchQuery || undefined,
    category: selectedCategory,
    city: selectedCity,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className="min-h-screen">
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
            
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <>
                  {user?.role === 'admin' && (
                    <Link href="/admin">
                      <a>
                        <Button variant="ghost">Dashboard Admin</Button>
                      </a>
                    </Link>
                  )}
                  {(user?.role === 'partner' || user?.role === 'admin') && (
                    <Link href="/partner">
                      <a>
                        <Button variant="ghost">I Miei Eventi</Button>
                      </a>
                    </Link>
                  )}
                  <Link href="/my-tickets">
                    <a>
                      <Button variant="ghost">I Miei Biglietti</Button>
                    </a>
                  </Link>
                  <span className="text-sm text-muted-foreground">{user?.name}</span>
                </>
              ) : (
                <a href={getLoginUrl()}>
                  <Button>Accedi</Button>
                </a>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-accent/5 to-background py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-foreground">
              Esperienze Culturali Indimenticabili
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Scopri concerti di musica classica, opere liriche e spettacoli teatrali nella tua città
            </p>
            
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex gap-2 max-w-2xl mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Cerca eventi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>
              <Button type="submit" size="lg" className="h-12 px-8">
                Cerca
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="border-b bg-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-wrap gap-4 items-center">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[200px]">
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

            <Input
              type="text"
              placeholder="Città..."
              value={selectedCity || ""}
              onChange={(e) => setSelectedCity(e.target.value || undefined)}
              className="w-[200px]"
            />

            {(selectedCategory || selectedCity || searchQuery) && (
              <Button
                variant="ghost"
                onClick={() => {
                  setSelectedCategory(undefined);
                  setSelectedCity(undefined);
                  setSearchQuery("");
                }}
              >
                Cancella filtri
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Events Grid */}
      <section className="py-12 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8">Eventi in Programma</h2>
          
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
                <Link key={event.id} href={`/events/${event.id}`}>
                  <a>
                    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 h-full group">
                      {event.imageUrl ? (
                        <div className="h-48 overflow-hidden">
                          <img
                            src={event.imageUrl}
                            alt={event.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ) : (
                        <div className="h-48 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                          <Music className="h-16 w-16 text-primary/40" />
                        </div>
                      )}
                      
                      <CardHeader>
                        <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
                          {event.title}
                        </CardTitle>
                        <CardDescription className="line-clamp-2">
                          {event.description}
                        </CardDescription>
                      </CardHeader>
                      
                      <CardContent className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {new Date(event.eventDate).toLocaleDateString('it-IT', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span className="line-clamp-1">{event.venueName}, {event.venueCity}</span>
                        </div>
                      </CardContent>
                      
                      <CardFooter>
                        <Button className="w-full" variant="outline">
                          <Ticket className="h-4 w-4 mr-2" />
                          Acquista Biglietti
                        </Button>
                      </CardFooter>
                    </Card>
                  </a>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Music className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nessun evento trovato</h3>
              <p className="text-muted-foreground">
                Prova a modificare i filtri di ricerca o torna più tardi
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2026 EventiPro. Tutti i diritti riservati.</p>
        </div>
      </footer>
    </div>
  );
}
