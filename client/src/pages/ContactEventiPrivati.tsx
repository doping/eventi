import ContactLanding from "./ContactLanding";
import { Lock } from "lucide-react";

export default function ContactEventiPrivati() {
  return (
    <ContactLanding
      slug="eventi-privati"
      defaultTitle="Eventi Privati"
      defaultSubtitle="Organizziamo eventi esclusivi su misura per te"
      defaultBody={"Sei alla ricerca di un'esperienza musicale o culturale esclusiva per il tuo evento privato?\n\nChe si tratti di una cena di gala, un matrimonio, una festa aziendale o una celebrazione speciale, il nostro team è a tua disposizione per creare un'esperienza indimenticabile.\n\nContattaci per discutere le tue esigenze e ricevere un preventivo personalizzato."}
      defaultCta="Richiedi informazioni"
      icon={<Lock className="h-8 w-8" />}
    />
  );
}
