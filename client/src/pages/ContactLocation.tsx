import ContactLanding from "./ContactLanding";
import { MapPin } from "lucide-react";

export default function ContactLocation() {
  return (
    <ContactLanding
      slug="sei-una-location"
      defaultTitle="Sei una Location?"
      defaultSubtitle="Parliamo di come valorizzare il tuo spazio con eventi di qualità"
      defaultBody={"Hai uno spazio unico — un teatro, una villa, un palazzo storico, un loft o qualsiasi luogo con carattere — e vuoi ospitare eventi culturali e musicali di alto livello?\n\nCollaboriamo con location di tutta Italia per portare esperienze indimenticabili nei posti più belli del paese.\n\nContattaci per scoprire come possiamo lavorare insieme."}
      defaultCta="Proponi la tua location"
      icon={<MapPin className="h-8 w-8" />}
    />
  );
}
