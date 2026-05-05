import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FileText, HelpCircle } from "lucide-react";

export default function TermsAndFaq() {
  const { data: termsSetting } = trpc.siteSettings.get.useQuery({ key: "terms_content" });
  const { data: faqSetting } = trpc.siteSettings.get.useQuery({ key: "faq_content" });

  const termsContent = termsSetting?.settingValue || DEFAULT_TERMS;
  const faqContent: { q: string; a: string }[] = (() => {
    try {
      return faqSetting?.settingValue ? JSON.parse(faqSetting.settingValue) : DEFAULT_FAQ;
    } catch {
      return DEFAULT_FAQ;
    }
  })();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Navbar />

      <section className="py-16 bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Termini, Condizioni & FAQ</h1>
          <p className="text-xl text-muted-foreground">
            Tutto quello che devi sapere prima di acquistare
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <Tabs defaultValue="terms">
            <TabsList className="mb-8 w-full sm:w-auto">
              <TabsTrigger value="terms" className="gap-2">
                <FileText className="h-4 w-4" />
                Termini e Condizioni
              </TabsTrigger>
              <TabsTrigger value="faq" className="gap-2">
                <HelpCircle className="h-4 w-4" />
                FAQ
              </TabsTrigger>
            </TabsList>

            <TabsContent value="terms">
              <div className="prose prose-lg max-w-none">
                {termsContent.split("\n").map((line, i) => {
                  if (line.startsWith("## ")) {
                    return <h2 key={i} className="text-2xl font-bold mt-8 mb-4">{line.replace("## ", "")}</h2>;
                  }
                  if (line.startsWith("# ")) {
                    return <h1 key={i} className="text-3xl font-bold mb-6">{line.replace("# ", "")}</h1>;
                  }
                  if (line.trim() === "") return <br key={i} />;
                  return <p key={i} className="mb-3 text-muted-foreground leading-relaxed">{line}</p>;
                })}
              </div>
            </TabsContent>

            <TabsContent value="faq">
              <Accordion type="single" collapsible className="space-y-2">
                {faqContent.map((item, i) => (
                  <AccordionItem key={i} value={`item-${i}`} className="border rounded-lg px-4">
                    <AccordionTrigger className="text-left font-semibold hover:no-underline">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <footer className="border-t bg-muted/30 py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2026 EventiPro. Tutti i diritti riservati.</p>
        </div>
      </footer>
    </div>
  );
}

const DEFAULT_TERMS = `# Termini e Condizioni di Vendita

## 1. Acquisto dei Biglietti

I biglietti acquistati tramite questa piattaforma sono nominativi e non trasferibili. L'acquirente è responsabile della custodia del biglietto e del codice QR associato.

## 2. Politica di Rimborso

I biglietti non sono rimborsabili salvo in caso di cancellazione o rinvio dell'evento da parte degli organizzatori. In caso di cancellazione, verrà emesso un rimborso integrale entro 14 giorni lavorativi.

## 3. Accesso all'Evento

L'accesso all'evento è consentito esclusivamente previa esibizione del biglietto con codice QR valido. Il biglietto deve essere presentato in formato digitale o stampato in modo leggibile.

## 4. Responsabilità

L'organizzatore si riserva il diritto di modificare il programma dell'evento per cause di forza maggiore. In tali casi, verrà data comunicazione tempestiva agli acquirenti.

## 5. Privacy e Dati Personali

I dati personali forniti al momento dell'acquisto vengono trattati nel rispetto del GDPR (Regolamento UE 2016/679). I dati non vengono ceduti a terzi senza consenso esplicito.

## 6. Contatti

Per qualsiasi informazione o reclamo, è possibile contattarci tramite il modulo di contatto presente sul sito.`;

const DEFAULT_FAQ: { q: string; a: string }[] = [
  {
    q: "Come ricevo il mio biglietto dopo l'acquisto?",
    a: "Dopo il completamento del pagamento, riceverai una email di conferma con il tuo biglietto in formato PDF allegato. Il biglietto contiene un codice QR univoco per l'accesso all'evento.",
  },
  {
    q: "Posso acquistare biglietti senza registrarmi?",
    a: "Per completare l'acquisto è necessario creare un account o accedere con Google, Apple o Microsoft. Questo ci permette di associare il biglietto alla tua identità e garantire la sicurezza della transazione.",
  },
  {
    q: "Posso trasferire il biglietto a un'altra persona?",
    a: "I biglietti sono nominativi e non trasferibili. In caso di impossibilità a partecipare, contattaci e valuteremo la situazione caso per caso.",
  },
  {
    q: "Cosa succede se l'evento viene cancellato?",
    a: "In caso di cancellazione dell'evento, riceverai un rimborso integrale entro 14 giorni lavorativi sul metodo di pagamento utilizzato. Ti invieremo una comunicazione via email.",
  },
  {
    q: "Come posso contattare l'assistenza?",
    a: "Puoi contattarci tramite il modulo presente nella sezione 'Contatti' del sito, oppure scrivendo direttamente alla nostra email. Rispondiamo entro 24 ore nei giorni lavorativi.",
  },
  {
    q: "I pagamenti sono sicuri?",
    a: "Sì. Tutti i pagamenti vengono processati tramite Stripe, una delle piattaforme di pagamento più sicure al mondo. Non conserviamo i dati della tua carta di credito.",
  },
];
