import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Mail, CheckCircle } from "lucide-react";

export default function NewsletterBanner() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const subscribe = trpc.newsletter.subscribe.useMutation({
    onSuccess: () => {
      setSubscribed(true);
      toast.success("Iscrizione completata! Grazie.");
    },
    onError: (err) => toast.error(err.message || "Errore nell'iscrizione"),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    await subscribe.mutateAsync({ email, name: name || undefined });
  };

  return (
    <section className="bg-primary/5 border-t border-primary/10 py-12">
      <div className="container mx-auto px-4 max-w-2xl text-center">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Mail className="h-6 w-6 text-primary" />
          </div>
        </div>
        <h2 className="text-2xl font-bold mb-2">Ricevi i Prossimi Eventi</h2>
        <p className="text-muted-foreground mb-6">
          Iscriviti alla newsletter e non perdere nessun evento. Niente spam, solo cultura.
        </p>

        {subscribed ? (
          <div className="flex items-center justify-center gap-2 text-green-600 font-semibold">
            <CheckCircle className="h-5 w-5" />
            Sei iscritto! A presto.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
            <Input
              type="text"
              placeholder="Il tuo nome (opzionale)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="sm:w-40 shrink-0"
            />
            <Input
              type="email"
              placeholder="La tua email *"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1"
            />
            <Button type="submit" disabled={subscribe.isPending} className="shrink-0">
              {subscribe.isPending ? "..." : "Iscriviti"}
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}
