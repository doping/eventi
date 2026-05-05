import ContactLanding from "./ContactLanding";
import { Music } from "lucide-react";

export default function ContactArtisti() {
  return (
    <ContactLanding
      slug="sei-un-artista"
      defaultTitle="Sei un Artista?"
      defaultSubtitle="Porta la tua musica e il tuo talento sul nostro palco"
      defaultBody={"Sei un musicista, un direttore d'orchestra, un solista, un ensemble o una compagnia teatrale?\n\nSiamo sempre alla ricerca di nuovi talenti e artisti affermati per arricchire la nostra programmazione. Che tu sia all'inizio della carriera o un professionista consolidato, vogliamo sentire la tua proposta.\n\nInviaci il tuo profilo artistico e ti risponderemo al più presto."}
      defaultCta="Proponi la tua candidatura"
      icon={<Music className="h-8 w-8" />}
    />
  );
}
