import { Router, Express } from "express";
import multer from "multer";
import { nanoid } from "nanoid";
import { storagePut } from "./storage";
import { sdk } from "./_core/sdk";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Solo immagini sono consentite (JPEG, PNG, WebP, GIF, SVG)"));
    }
  },
});

export function registerUploadRoutes(app: Express) {
  const uploadRouter = Router();

  // POST /api/upload/image — upload a single image, returns { url }
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

        const ext = req.file.originalname.split(".").pop() || "jpg";
        const key = `uploads/images/${user.id}-${nanoid(10)}.${ext}`;

        const { url } = await storagePut(key, req.file.buffer, req.file.mimetype);

        res.json({ url, key });
      } catch (err: any) {
        console.error("[Upload] Error:", err);
        res.status(500).json({ error: err.message || "Errore durante l'upload" });
      }
    }
  );

  app.use("/api/upload", uploadRouter);
}
