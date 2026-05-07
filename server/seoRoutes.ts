import { Express, Request, Response } from "express";
import { getDb } from "./db";
import { events, slugRedirects } from "../drizzle/schema";
import { eq, and, isNotNull } from "drizzle-orm";

/**
 * Registra le route SEO:
 * - GET /sitemap.xml  → sitemap dinamica con tutti gli eventi pubblicati
 * - GET /robots.txt   → robots con link alla sitemap
 * - GET /eventi/:slug → serve il frontend (gestito da Vite/static)
 *                       ma prima controlla se lo slug è un redirect
 * - GET /api/seo/redirect/:slug → controlla se esiste un redirect 301
 */
export function registerSeoRoutes(app: Express) {
  // ── robots.txt ──────────────────────────────────────────────────────────────
  app.get("/robots.txt", (_req: Request, res: Response) => {
    const baseUrl = process.env.SITE_URL || "https://www.operamix.com";
    res.type("text/plain").send(
      `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /site-settings\nDisallow: /api/\n\nSitemap: ${baseUrl}/sitemap.xml\n`
    );
  });

  // ── sitemap.xml ─────────────────────────────────────────────────────────────
  app.get("/sitemap.xml", async (_req: Request, res: Response) => {
    try {
      const baseUrl = process.env.SITE_URL || "https://www.operamix.com";
      const db = await getDb();
      if (!db) { res.type("application/xml").send("<?xml version=\"1.0\"?><urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\"></urlset>"); return; }
      const allEvents = await db
        .select({ id: events.id, slug: events.slug, updatedAt: events.createdAt })
        .from(events)
        .where(isNotNull(events.slug));

      const staticPages = [
        { url: "/", priority: "1.0", changefreq: "daily" },
        { url: "/eventi-privati", priority: "0.6", changefreq: "monthly" },
        { url: "/sei-una-location", priority: "0.6", changefreq: "monthly" },
        { url: "/sei-un-artista", priority: "0.6", changefreq: "monthly" },
        { url: "/sei-un-creator", priority: "0.6", changefreq: "monthly" },
        { url: "/lavora-con-noi", priority: "0.6", changefreq: "monthly" },
        { url: "/termini-e-condizioni", priority: "0.5", changefreq: "yearly" },
      ];

      const eventUrls = allEvents
        .filter((e: { slug: string | null }) => e.slug)
        .map((e: { id: number; slug: string | null; updatedAt: Date | null }) => ({
          url: `/eventi/${e.slug}`,
          priority: "0.9",
          changefreq: "weekly",
          lastmod: e.updatedAt
            ? new Date(e.updatedAt).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
        }));

      const allUrls = [...staticPages, ...eventUrls];

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map(
    (u) => `  <url>
    <loc>${baseUrl}${u.url}</loc>
    ${"lastmod" in u ? `<lastmod>${u.lastmod}</lastmod>` : ""}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

      res.type("application/xml").send(xml);
    } catch (err) {
      console.error("[SEO] sitemap error:", err);
      res.status(500).send("Error generating sitemap");
    }
  });

  // ── Redirect 301 per slug vecchi ─────────────────────────────────────────────
  // Questo endpoint viene chiamato dal frontend quando carica /eventi/:slug
  // e lo slug non corrisponde a nessun evento attivo.
  app.get("/api/seo/check-redirect/:slug", async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      const db = await getDb();
      if (!db) return res.json({ redirect: null });
      const redirect = await db
        .select({ newSlug: slugRedirects.newSlug })
        .from(slugRedirects)
        .where(eq(slugRedirects.oldSlug, slug))
        .limit(1);

      if (redirect.length > 0) {
        return res.json({ redirect: `/eventi/${redirect[0].newSlug}` });
      }
      return res.json({ redirect: null });
    } catch (err) {
      console.error("[SEO] redirect check error:", err);
      return res.status(500).json({ redirect: null });
    }
  });
}
