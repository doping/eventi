import ContactLanding from "./ContactLanding";
import { Video } from "lucide-react";

export default function ContactCreator() {
  return (
    <ContactLanding
      slug="sei-un-creator"
      defaultTitle="Sei un Creator?"
      defaultSubtitle="Collabora con noi per raccontare la cultura dal vivo"
      defaultBody={"Sei un content creator, un fotografo, un videomaker o un giornalista culturale?\n\nCerchiamo collaboratori creativi che vogliano documentare, promuovere e raccontare i nostri eventi attraverso i loro canali e il loro stile unico.\n\nSe hai una community interessata alla musica, al teatro e alla cultura dal vivo, vogliamo conoscerti."}
      defaultCta="Collabora con noi"
      icon={<Video className="h-8 w-8" />}
    />
  );
}
