import { useState, useRef, useCallback } from "react";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ImageUploadProps {
  value?: string | null;
  onChange: (url: string) => void;
  onClear?: () => void;
  label?: string;
  hint?: string;
  className?: string;
  aspectRatio?: "square" | "landscape" | "auto";
}

export default function ImageUpload({
  value,
  onChange,
  onClear,
  label = "Carica Immagine",
  hint = "JPEG, PNG, WebP fino a 10MB",
  className = "",
  aspectRatio = "landscape",
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const aspectClass =
    aspectRatio === "square"
      ? "aspect-square"
      : aspectRatio === "landscape"
      ? "aspect-video"
      : "";

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

        const { url } = await res.json();
        onChange(url);
        toast.success("Immagine caricata con successo");
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
    // Reset input so same file can be re-selected
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
        <p className="text-sm font-medium text-foreground">{label}</p>
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
                  onClick={onClear}
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
              <p className="text-sm text-muted-foreground">Caricamento in corso...</p>
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
                <p className="text-xs text-muted-foreground mt-1">{hint}</p>
              </div>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
