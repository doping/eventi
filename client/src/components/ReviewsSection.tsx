import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Star, MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

interface ReviewsSectionProps {
  eventId: number;
}

function StarRating({
  value,
  onChange,
  readonly = false,
  size = "md",
}: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
  size?: "sm" | "md";
}) {
  const [hovered, setHovered] = useState(0);
  const starSize = size === "sm" ? "h-4 w-4" : "h-6 w-6";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${starSize} transition-colors ${
            star <= (hovered || value)
              ? "fill-yellow-400 text-yellow-400"
              : "text-muted-foreground/30"
          } ${!readonly ? "cursor-pointer hover:scale-110 transition-transform" : ""}`}
          onClick={() => !readonly && onChange?.(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
        />
      ))}
    </div>
  );
}

export default function ReviewsSection({ eventId }: ReviewsSectionProps) {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.reviews.list.useQuery({ eventId });
  const { data: myReview } = trpc.reviews.myReview.useQuery(
    { eventId },
    { enabled: isAuthenticated }
  );
  const createReview = trpc.reviews.create.useMutation({
    onSuccess: () => {
      utils.reviews.list.invalidate({ eventId });
      utils.reviews.myReview.invalidate({ eventId });
      setRating(0);
      setComment("");
      toast.success("Recensione pubblicata!");
    },
    onError: (err) => toast.error(err.message || "Errore nella pubblicazione"),
  });

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Seleziona una valutazione");
      return;
    }
    await createReview.mutateAsync({ eventId, rating, comment: comment || undefined });
  };

  const reviews = data?.reviews || [];
  const avg = data?.avg || 0;
  const count = data?.count || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          Recensioni
          {count > 0 && (
            <Badge variant="secondary" className="ml-2 gap-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              {avg.toFixed(1)} ({count})
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Write a review */}
        {isAuthenticated ? (
          myReview ? (
            <div className="p-4 bg-muted/50 rounded-lg border">
              <p className="text-sm font-medium mb-2">La tua recensione</p>
              <StarRating value={myReview.rating} readonly size="sm" />
              {myReview.comment && (
                <p className="text-sm text-muted-foreground mt-2">{myReview.comment}</p>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3 p-4 bg-muted/30 rounded-lg border border-dashed">
              <p className="text-sm font-semibold">Scrivi una recensione</p>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Valutazione *</p>
                <StarRating value={rating} onChange={setRating} />
              </div>
              <Textarea
                placeholder="Condividi la tua esperienza (opzionale)..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                maxLength={1000}
              />
              <Button
                type="submit"
                size="sm"
                className="gap-2"
                disabled={createReview.isPending || rating === 0}
              >
                <Send className="h-3.5 w-3.5" />
                {createReview.isPending ? "Pubblicazione..." : "Pubblica Recensione"}
              </Button>
            </form>
          )
        ) : (
          <div className="p-4 bg-muted/30 rounded-lg border border-dashed text-center">
            <p className="text-sm text-muted-foreground mb-3">
              Accedi per lasciare una recensione
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => (window.location.href = getLoginUrl())}
            >
              Accedi
            </Button>
          </div>
        )}

        {/* Reviews list */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="flex gap-3 pb-4 border-b last:border-0 last:pb-0">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary font-bold text-sm">
                  {(review.authorName || "U").charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-medium text-sm">{review.authorName || "Utente"}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(review.createdAt).toLocaleDateString("it-IT", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <StarRating value={review.rating} readonly size="sm" />
                  {review.comment && (
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                      {review.comment}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Star className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Nessuna recensione ancora. Sii il primo!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
