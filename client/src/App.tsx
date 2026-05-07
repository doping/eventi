import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { SiteSettingsProvider } from "./contexts/SiteSettingsContext";
import Home from "./pages/Home";
import EventDetail from "./pages/EventDetail";
import MyTickets from "./pages/MyTickets";
import AdminDashboard from "./pages/AdminDashboard";
import EventEdit from "./pages/EventEdit";
import PartnerDashboard from "./pages/PartnerDashboard";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import CheckoutCancel from "./pages/CheckoutCancel";
import TicketVerify from "./pages/TicketVerify";
import EventNew from "./pages/EventNew";
import SiteSettings from "./pages/SiteSettings";
import ContactEventiPrivati from "./pages/ContactEventiPrivati";
import ContactLocation from "./pages/ContactLocation";
import ContactArtisti from "./pages/ContactArtisti";
import ContactCreator from "./pages/ContactCreator";
import ContactLavoraConNoi from "./pages/ContactLavoraConNoi";
import TermsAndFaq from "./pages/TermsAndFaq";
import Orders from "./pages/Orders";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/events/:id"} component={EventDetail} />
      {/* SEO-friendly slug route — /eventi/nome-evento-citta-data-id */}
      <Route path={"/eventi/:slug"} component={EventDetail} />
      <Route path={"/my-tickets"} component={MyTickets} />
      <Route path={"/orders"} component={Orders} />
      <Route path={"/admin"} component={AdminDashboard} />
      <Route path={"/events/:id/edit"} component={EventEdit} />
      <Route path={"/partner"} component={PartnerDashboard} />
      <Route path={"/checkout/success"} component={CheckoutSuccess} />
      <Route path={"/checkout/cancel"} component={CheckoutCancel} />
      <Route path={"/events/new"} component={EventNew} />
      <Route path={"/verify/:qrCode"} component={TicketVerify} />
      <Route path={"/site-settings"} component={SiteSettings} />
      {/* Contact landing pages */}
      <Route path={"/eventi-privati"} component={ContactEventiPrivati} />
      <Route path={"/sei-una-location"} component={ContactLocation} />
      <Route path={"/sei-un-artista"} component={ContactArtisti} />
      <Route path={"/sei-un-creator"} component={ContactCreator} />
      <Route path={"/lavora-con-noi"} component={ContactLavoraConNoi} />
      {/* Static pages */}
      <Route path={"/termini-e-condizioni"} component={TermsAndFaq} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <SiteSettingsProvider>
            <Router />
          </SiteSettingsProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
