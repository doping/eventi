import { useState, useRef, useCallback } from "react";
import { Upload, X, Image as ImageIcon, Loader2, CheckCircle2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ImageMeta {
  width: number;
  height: number;
  originalSize: number;
  fullSize: number;
  thumbSize: number;
  savings: number;
}

interface ImageUploadProps {
  value?: string | null;
  onChange: (url: string, thumbUrl?: string) => void;
  onClear?: () => void;
  label?: string;
  className?: string;
  aspectRatio?: "square" | "landscape" | "auto";
  /** Recommended dimensions shown as hint, e.g. "1200 × 675 px" */
  recommendedSize?: string;
  /** Recommended aspect ratio label, e.g. "16:9" */
  recommendedAspect?: string;
}

export default function ImageUpload({
  value,
  onChange,
  onClear,
  label = "Immagine Evento",
  className = "",
  aspectRatio = "landscape",
  recommendedSize = "1200 × 675 px",
  recommendedAspect = "16:9",
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [meta, setMeta] = useState<ImageMeta | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const aspectClass =
    aspectRatio === "square"
      ? "aspect-square"
      : aspectRatio === "landscape"
      ? "aspect-video"
      : "";

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const uploadFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Solo immagini sono consentite");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Il file supera il limite di 10MB");
        return;
      }

      setUploading(true);
      setMeta(null);
      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload/image", {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Errore upload" }));
          throw new Error(err.error || "Errore durante l'upload");
        }

        const { url, thumbUrl, meta: uploadMeta } = await res.json();
        onChange(url, thumbUrl);
        setMeta(uploadMeta);
        toast.success(
          uploadMeta?.savings > 0
            ? `Immagine ottimizzata: risparmiato ${uploadMeta.savings}% di spazio`
            : "Immagine caricata con successo"
        );
      } catch (err: any) {
        toast.error(err.message || "Errore durante l'upload");
      } finally {
        setUploading(false);
      }
    },
    [onChange]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-foreground">{label}</p>
          {/* Format hint badge */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted rounded-md px-2 py-1 shrink-0">
            <Info className="h-3 w-3" />
            <span>{recommendedAspect} · {recommendedSize} · JPEG/PNG/WebP · max 10MB</span>
          </div>
        </div>
      )}

      {value ? (
        /* Preview with remove button */
        <div className={`relative rounded-lg overflow-hidden border bg-muted ${aspectClass}`}>
          <img
            src={value}
            alt="Anteprima"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors group flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                Cambia
              </Button>
              {onClear && (
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => { onClear(); setMeta(null); }}
                >
                  <X className="h-4 w-4" />
                  Rimuovi
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Drop zone */
        <div
          className={`
            relative rounded-lg border-2 border-dashed transition-colors cursor-pointer
            flex flex-col items-center justify-center gap-3 p-8 text-center
            ${aspectClass}
            ${dragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/30"
            }
            ${uploading ? "pointer-events-none opacity-60" : ""}
          `}
          onClick={() => !uploading && inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {uploading ? (
            <>
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Ottimizzazione e caricamento...</p>
            </>
          ) : (
            <>
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                <ImageIcon className="h-7 w-7 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  Trascina qui o{" "}
                  <span className="text-primary underline underline-offset-2">
                    seleziona un file
                  </span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Formato consigliato: <strong>{recommendedAspect}</strong> · {recommendedSize}
                </p>
                <p className="text-xs text-muted-foreground">
                  JPEG, PNG o WebP · max 10MB
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  L'immagine verrà ottimizzata automaticamente in WebP
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Optimization feedback */}
      {meta && value && (
        <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>
            {meta.width} × {meta.height}px · 
            Originale: {formatBytes(meta.originalSize)} → 
            Ottimizzata: {formatBytes(meta.fullSize)}
            {meta.savings > 0 && ` (−${meta.savings}%)`}
            {" · "}Thumbnail mobile: {formatBytes(meta.thumbSize)}
          </span>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
