import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Music, XCircle } from "lucide-react";
import { Link } from "wouter";

export default function CheckoutCancel() {
  return (
    <div className="min-h-screen bg-muted/20">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/">
            <a className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity w-fit">
              <Music className="h-6 w-6" />
              <span className="font-bold text-lg">OperaMix</span>
            </a>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-20 max-w-md">
        <Card>
          <CardHeader className="text-center">
            <XCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <CardTitle className="text-2xl font-serif">Pagamento Annullato</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Il pagamento è stato annullato. Nessun addebito è stato effettuato.
            </p>
            <p className="text-sm text-muted-foreground">
              Puoi riprovare in qualsiasi momento tornando alla pagina dell'evento.
            </p>
            <div className="flex gap-3 justify-center pt-2">
              <Link href="/">
                <a>
                  <Button>Torna agli Eventi</Button>
                </a>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
