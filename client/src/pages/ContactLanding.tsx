import { useState } from "react";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Mail, Send, CheckCircle } from "lucide-react";
import { Link } from "wouter";

interface ContactLandingProps {
  slug: string;
  defaultTitle: string;
  defaultSubtitle: string;
  defaultBody: string;
  defaultCta: string;
  icon?: React.ReactNode;
}

export default function ContactLanding({
  slug,
  defaultTitle,
  defaultSubtitle,
  defaultBody,
  defaultCta,
  icon,
}: ContactLandingProps) {
  const { data: page } = trpc.contactPages.get.useQuery({ slug });
  const submitMutation = trpc.contactPages.submit.useMutation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const title = page?.title || defaultTitle;
  const subtitle = page?.subtitle || defaultSubtitle;
  const body = page?.bodyText || defaultBody;
  const cta = page?.ctaLabel || defaultCta;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("Compila tutti i campi");
      return;
    }
    try {
      await submitMutation.mutateAsync({
        pageSlug: slug,
        senderName: name,
        senderEmail: email,
        message,
      });
      setSubmitted(true);
      toast.success("Messaggio inviato! Ti risponderemo presto.");
    } catch (err: any) {
      toast.error(err.message || "Errore nell'invio del messaggio");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Navbar />

      {/* Hero */}
      <section className="py-20 bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          {icon && (
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                {icon}
              </div>
            </div>
          )}
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">{title}</h1>
          {subtitle && (
            <p className="text-xl text-muted-foreground mb-6">{subtitle}</p>
          )}
        </div>
      </section>

      {/* Content + Form */}
      <section className="py-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Left: body text */}
            <div>
              {body && (
                <div className="prose prose-lg max-w-none text-foreground">
                  {body.split("\n").map((paragraph, i) =>
                    paragraph.trim() ? (
                      <p key={i} className="mb-4 text-muted-foreground leading-relaxed">
                        {paragraph}
                      </p>
                    ) : null
                  )}
                </div>
              )}
            </div>

            {/* Right: contact form */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  {cta}
                </CardTitle>
                <CardDescription>
                  Compila il modulo e ti risponderemo al più presto
                </CardDescription>
              </CardHeader>
              <CardContent>
                {submitted ? (
                  <div className="text-center py-8 space-y-4">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                    <h3 className="text-xl font-semibold">Messaggio inviato!</h3>
                    <p className="text-muted-foreground">
                      Grazie per averci contattato. Ti risponderemo entro 24 ore.
                    </p>
                    <Button variant="outline" onClick={() => setSubmitted(false)}>
                      Invia un altro messaggio
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome e Cognome *</Label>
                      <Input
                        id="name"
                        placeholder="Il tuo nome"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="tua@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">Messaggio *</Label>
                      <Textarea
                        id="message"
                        placeholder="Raccontaci di te e di cosa hai bisogno..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={5}
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full gap-2"
                      disabled={submitMutation.isPending}
                    >
                      <Send className="h-4 w-4" />
                      {submitMutation.isPending ? "Invio in corso..." : "Invia Messaggio"}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2026 EventiPro. Tutti i diritti riservati.</p>
        </div>
      </footer>
    </div>
  );
}
