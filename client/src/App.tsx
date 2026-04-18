import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
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

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/events/:id"} component={EventDetail} />
      <Route path={"/my-tickets"} component={MyTickets} />
      <Route path={"/admin"} component={AdminDashboard} />
      <Route path={"/events/:id/edit"} component={EventEdit} />
      <Route path={"/partner"} component={PartnerDashboard} />
      <Route path={"/checkout/success"} component={CheckoutSuccess} />
      <Route path={"/checkout/cancel"} component={CheckoutCancel} />
      <Route path={"/events/new"} component={EventNew} />
      <Route path={"/verify/:qrCode"} component={TicketVerify} />
      <Route path={"/site-settings"} component={SiteSettings} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
