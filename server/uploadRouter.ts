import { Router, Express } from "express";
import multer from "multer";
import { nanoid } from "nanoid";
import { storagePut } from "./storage";
import { sdk } from "./_core/sdk";
import sharp from "sharp";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Solo immagini sono consentite (JPEG, PNG, WebP)"));
    }
  },
});

/**
 * Ottimizza un'immagine con Sharp:
 * - Converte in WebP per massima compressione
 * - Genera versione full (1200px wide max) e thumbnail (480px wide)
 * - Ritorna entrambi i buffer
 */
async function optimizeImage(buffer: Buffer): Promise<{
  fullBuffer: Buffer;
  thumbBuffer: Buffer;
  width: number;
  height: number;
  originalSize: number;
  fullSize: number;
  thumbSize: number;
}> {
  const meta = await sharp(buffer).metadata();
  const originalSize = buffer.length;

  // Full size: max 1200px wide, WebP quality 82
  const fullBuffer = await sharp(buffer)
    .resize({ width: 1200, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();

  // Thumbnail: max 480px wide, WebP quality 75
  const thumbBuffer = await sharp(buffer)
    .resize({ width: 480, withoutEnlargement: true })
    .webp({ quality: 75 })
    .toBuffer();

  return {
    fullBuffer,
    thumbBuffer,
    width: meta.width || 0,
    height: meta.height || 0,
    originalSize,
    fullSize: fullBuffer.length,
    thumbSize: thumbBuffer.length,
  };
}

export function registerUploadRoutes(app: Express) {
  const uploadRouter = Router();

  // POST /api/upload/image — upload a single image, returns { url, thumbUrl, meta }
  uploadRouter.post(
    "/image",
    upload.single("file"),
    async (req, res) => {
      try {
        // Require authentication via SDK
        let user = null;
        try {
          user = await sdk.authenticateRequest(req as any);
        } catch {
          user = null;
        }

        if (!user) {
          res.status(401).json({ error: "Non autorizzato. Effettua il login per caricare immagini." });
          return;
        }

        if (!req.file) {
          res.status(400).json({ error: "Nessun file caricato" });
          return;
        }

        const baseKey = `uploads/images/${user.id}-${nanoid(10)}`;

        // Optimize image
        const { fullBuffer, thumbBuffer, width, height, originalSize, fullSize, thumbSize } =
          await optimizeImage(req.file.buffer);

        // Upload full size
        const { url } = await storagePut(`${baseKey}.webp`, fullBuffer, "image/webp");

        // Upload thumbnail
        const { url: thumbUrl } = await storagePut(`${baseKey}-thumb.webp`, thumbBuffer, "image/webp");

        const savings = Math.round((1 - fullSize / originalSize) * 100);

        res.json({
          url,
          thumbUrl,
          meta: {
            width,
            height,
            originalSize,
            fullSize,
            thumbSize,
            savings: savings > 0 ? savings : 0,
          },
        });
      } catch (err: any) {
        console.error("[Upload] Error:", err);
        res.status(500).json({ error: err.message || "Errore durante l'upload" });
      }
    }
  );

  app.use("/api/upload", uploadRouter);
}
