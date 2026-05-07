/**
 * Generates a SEO-friendly slug from event title, city and date.
 * Example: "Ludovico Einaudi" + "Roma" + 2026-05-09 → "ludovico-einaudi-roma-2026-05-09"
 */
export function generateEventSlug(title: string, city: string, date: Date | string): string {
  const d = new Date(date);
  const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const raw = `${title} ${city} ${dateStr}`;
  return raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^a-z0-9\s-]/g, "")   // keep only alphanumeric, spaces, hyphens
    .trim()
    .replace(/\s+/g, "-")            // spaces → hyphens
    .replace(/-+/g, "-")             // collapse multiple hyphens
    .substring(0, 280);              // max length
}

/**
 * Appends the event ID to the slug to guarantee uniqueness.
 * Example: "ludovico-einaudi-roma-2026-05-09-42"
 */
export function generateUniqueEventSlug(title: string, city: string, date: Date | string, id: number): string {
  return `${generateEventSlug(title, city, date)}-${id}`;
}

/**
 * Extracts the numeric event ID from the end of a slug.
 * "ludovico-einaudi-roma-2026-05-09-42" → 42
 */
export function extractIdFromSlug(slug: string): number | null {
  const parts = slug.split("-");
  const last = parts[parts.length - 1];
  const id = parseInt(last, 10);
  return isNaN(id) ? null : id;
}
