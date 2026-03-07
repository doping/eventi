import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { Menu, Music, Ticket, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";

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
              <Music className="h-6 w-6" />
              <span className="font-serif">EventiPro</span>
            </Link>

            {/* Desktop menu */}
            <div className="hidden md:flex items-center gap-1">
              {isAuthenticated ? (
                <>
                  {isAdmin && (
                    <Link href="/admin">
                      <Button variant="ghost" size="sm">
                        Dashboard Admin
                      </Button>
                    </Link>
                  )}
                  {isPartner && (
                    <Link href="/partner">
                      <Button variant="ghost" size="sm">
                        I Miei Eventi
                      </Button>
                    </Link>
                  )}
                  <Link href="/my-tickets">
                    <Button variant="ghost" size="sm" className="gap-1.5">
                      <Ticket className="h-4 w-4" />
                      I Miei Biglietti
                    </Button>
                  </Link>
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
                <a href={getLoginUrl()}>
                  <Button size="sm">Accedi</Button>
                </a>
              )}
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
            <Music className="h-5 w-5" />
            <span>EventiPro</span>
          </div>
          <button
            onClick={() => setMenuOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
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

              {isPartner && (
                <Link href="/partner">
                  <button className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-sm font-medium">
                    📅 I Miei Eventi
                  </button>
                </Link>
              )}

              {isAdmin && (
                <Link href="/admin">
                  <button className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-sm font-medium">
                    ⚙️ Dashboard Admin
                  </button>
                </Link>
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
