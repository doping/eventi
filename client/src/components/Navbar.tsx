import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { Menu, Music, Ticket, X, Settings, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [location] = useLocation();

  // Chiudi menu al cambio pagina
  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  // Blocca scroll quando menu aperto
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const isAdmin = user?.role === "admin";
  const isPartner = user?.role === "partner" || user?.role === "admin";
  const siteSettings = useSiteSettings();

  return (
    <>
      <nav className="border-b bg-white/90 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2 text-xl font-bold text-primary flex-shrink-0"
            >
              {siteSettings.siteLogoUrl ? (
                <img
                  src={siteSettings.siteLogoUrl}
                  alt={siteSettings.siteName}
                  className="h-8 w-auto object-contain max-w-[120px]"
                />
              ) : (
                <>
                  <Music className="h-6 w-6" />
                  <span className="font-serif">{siteSettings.siteName}</span>
                </>
              )}
            </Link>

            {/* Desktop menu */}
            <div className="hidden md:flex items-center gap-1">
              {isAuthenticated ? (
                <>
                  {isAdmin && (
                    <>
                      <Link href="/admin">
                        <Button variant="ghost" size="sm">
                          Dashboard Admin
                        </Button>
                      </Link>
                      <Link href="/site-settings">
                        <Button variant="ghost" size="sm" className="gap-1.5">
                          <Settings className="h-4 w-4" />
                          Impostazioni
                        </Button>
                      </Link>
                    </>
                  )}

              <Link href="/my-tickets">
                <Button variant="ghost" size="sm" className="gap-1.5">
                  <Ticket className="h-4 w-4" />
                  I Miei Biglietti
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1">
                    Collabora <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild><Link href="/eventi-privati">🔒 Eventi Privati</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link href="/sei-una-location">📍 Sei una Location?</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link href="/sei-un-artista">🎵 Sei un Artista?</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link href="/sei-un-creator">🎬 Sei un Creator?</Link></DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild><Link href="/lavora-con-noi">💼 Lavora con Noi</Link></DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild><Link href="/termini-e-condizioni">📄 Termini & FAQ</Link></DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <div className="ml-2 pl-2 border-l flex items-center gap-2">
                    <span className="text-sm text-muted-foreground max-w-[140px] truncate">
                      {user?.name}
                    </span>
                    <Button variant="outline" size="sm" onClick={() => logout()}>
                      Esci
                    </Button>
                  </div>
                </>
              ) : (
                <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-1">
                      Collabora <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild><Link href="/eventi-privati">🔒 Eventi Privati</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link href="/sei-una-location">📍 Sei una Location?</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link href="/sei-un-artista">🎵 Sei un Artista?</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link href="/sei-un-creator">🎬 Sei un Creator?</Link></DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild><Link href="/lavora-con-noi">💼 Lavora con Noi</Link></DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild><Link href="/termini-e-condizioni">📄 Termini & FAQ</Link></DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <a href={getLoginUrl()}>
                  <Button size="sm">Accedi</Button>
                </a>
              </>
              )}
            </div>

            {/* Language switcher (desktop) */}
            <div className="hidden md:block">
              <LanguageSwitcher />
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg hover:bg-muted transition-colors"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? "Chiudi menu" : "Apri menu"}
            >
              {menuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-72 max-w-[85vw] bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-in-out md:hidden ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-2 text-primary font-bold font-serif">
            {siteSettings.siteLogoUrl ? (
              <img
                src={siteSettings.siteLogoUrl}
                alt={siteSettings.siteName}
                className="h-7 w-auto object-contain max-w-[100px]"
              />
            ) : (
              <>
                <Music className="h-5 w-5" />
                <span>{siteSettings.siteName}</span>
              </>
            )}
          </div>
          <button
            onClick={() => setMenuOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Language switcher (mobile) */}
        <div className="px-4 py-2 border-b">
          <LanguageSwitcher />
        </div>

        {/* Drawer content */}
        <div className="flex flex-col p-4 gap-1">
          {isAuthenticated ? (
            <>
              {/* User info */}
              <div className="px-3 py-3 mb-2 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">
                  Accesso come
                </p>
                <p className="font-medium text-sm truncate">{user?.name}</p>
                {user?.email && (
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                )}
              </div>

              <Link href="/">
                <button className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-sm font-medium">
                  🎭 Esplora Eventi
                </button>
              </Link>

              <Link href="/my-tickets">
                <button className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-sm font-medium">
                  🎫 I Miei Biglietti
                </button>
              </Link>

              <Link href="/orders">
                <button className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-sm font-medium">
                  🛍️ I Miei Ordini
                </button>
              </Link>

              {isPartner && (
                <Link href="/partner">
                  <button className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-sm font-medium">
                    📅 I Miei Eventi
                  </button>
                </Link>
              )}

              {isAdmin && (
                <>
                  <Link href="/admin">
                    <button className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-sm font-medium">
                      ⚙️ Dashboard Admin
                    </button>
                  </Link>
                  <Link href="/site-settings">
                    <button className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-sm font-medium">
                      🎨 Impostazioni Sito
                    </button>
                  </Link>
                </>
              )}

              <div className="mt-3 pt-3 border-t">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                  }}
                >
                  Esci dall'account
                </Button>
              </div>
            </>
          ) : (
            <>
              <Link href="/">
                <button className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-sm font-medium">
                  🎭 Esplora Eventi
                </button>
              </Link>
              <Link href="/eventi-privati">
                <button className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-sm font-medium">
                  🔒 Eventi Privati
                </button>
              </Link>
              <Link href="/sei-una-location">
                <button className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-sm font-medium">
                  📍 Sei una Location?
                </button>
              </Link>
              <Link href="/sei-un-artista">
                <button className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-sm font-medium">
                  🎵 Sei un Artista?
                </button>
              </Link>
              <Link href="/sei-un-creator">
                <button className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-sm font-medium">
                  🎬 Sei un Creator?
                </button>
              </Link>
              <Link href="/lavora-con-noi">
                <button className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-sm font-medium">
                  💼 Lavora con Noi
                </button>
              </Link>
              <Link href="/termini-e-condizioni">
                <button className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-sm font-medium">
                  📄 Termini & FAQ
                </button>
              </Link>
              <div className="mt-4 pt-4 border-t">
                <a href={getLoginUrl()} className="block">
                  <Button className="w-full">Accedi</Button>
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
