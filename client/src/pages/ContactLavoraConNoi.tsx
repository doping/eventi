import ContactLanding from "./ContactLanding";
import { Briefcase } from "lucide-react";

export default function ContactLavoraConNoi() {
  return (
    <ContactLanding
      slug="lavora-con-noi"
      defaultTitle="Lavora con Noi"
      defaultSubtitle="Entra a far parte del nostro team"
      defaultBody={"Siamo una realtà in crescita nel settore degli eventi culturali e musicali. Cerchiamo persone appassionate, creative e motivate che vogliano contribuire a portare esperienze straordinarie al pubblico.\n\nLe posizioni aperte variano da ruoli tecnici e organizzativi a posizioni nel marketing, nella comunicazione e nelle relazioni con gli artisti.\n\nInviaci il tuo curriculum e una lettera di presentazione: anche se non ci sono posizioni aperte al momento, terremo il tuo profilo in considerazione per future opportunità."}
      defaultCta="Invia la tua candidatura"
      icon={<Briefcase className="h-8 w-8" />}
    />
  );
}
