import { createContext, useContext, useEffect, ReactNode } from "react";
import { trpc } from "@/lib/trpc";

interface SiteSettings {
  siteName: string;
  siteTagline: string;
  siteLogoUrl: string;
  heroTitle: string;
  heroSubtitle: string;
  colorPrimary: string;
  colorSecondary: string;
  colorAccent: string;
  colorHeroFrom: string;
  colorHeroTo: string;
  footerText: string;
  contactEmail: string;
  contactPhone: string;
  socialFacebook: string;
  socialInstagram: string;
  socialYoutube: string;
  defaultCommission: string;
  currencySymbol: string;
}

const defaultSettings: SiteSettings = {
  siteName: "EventiPro",
  siteTagline: "La tua piattaforma per eventi culturali",
  siteLogoUrl: "",
  heroTitle: "Esperienze Culturali Indimenticabili",
  heroSubtitle: "Scopri concerti di musica classica, opere liriche e spettacoli teatrali nella tua città",
  colorPrimary: "#7c3aed",
  colorSecondary: "#a855f7",
  colorAccent: "#f59e0b",
  colorHeroFrom: "#1e1b4b",
  colorHeroTo: "#4c1d95",
  footerText: "© 2025 EventiPro. Tutti i diritti riservati.",
  contactEmail: "",
  contactPhone: "",
  socialFacebook: "",
  socialInstagram: "",
  socialYoutube: "",
  defaultCommission: "10",
  currencySymbol: "€",
};

const SiteSettingsContext = createContext<SiteSettings>(defaultSettings);

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const { data: settingsData } = trpc.siteSettings.getAll.useQuery(undefined, {
    staleTime: 1000 * 60 * 5, // cache 5 minutes
    refetchOnWindowFocus: false,
  });

  // Build merged settings object
  const settings: SiteSettings = { ...defaultSettings };
  if (settingsData) {
    const map: Record<string, string> = {};
    settingsData.forEach(s => { map[s.settingKey] = s.settingValue || ""; });

    if (map.site_name) settings.siteName = map.site_name;
    if (map.site_tagline) settings.siteTagline = map.site_tagline;
    if (map.site_logo_url) settings.siteLogoUrl = map.site_logo_url;
    if (map.hero_title) settings.heroTitle = map.hero_title;
    if (map.hero_subtitle) settings.heroSubtitle = map.hero_subtitle;
    if (map.color_primary) settings.colorPrimary = map.color_primary;
    if (map.color_secondary) settings.colorSecondary = map.color_secondary;
    if (map.color_accent) settings.colorAccent = map.color_accent;
    if (map.color_hero_from) settings.colorHeroFrom = map.color_hero_from;
    if (map.color_hero_to) settings.colorHeroTo = map.color_hero_to;
    if (map.footer_text) settings.footerText = map.footer_text;
    if (map.contact_email) settings.contactEmail = map.contact_email;
    if (map.contact_phone) settings.contactPhone = map.contact_phone;
    if (map.social_facebook) settings.socialFacebook = map.social_facebook;
    if (map.social_instagram) settings.socialInstagram = map.social_instagram;
    if (map.social_youtube) settings.socialYoutube = map.social_youtube;
    if (map.default_commission) settings.defaultCommission = map.default_commission;
    if (map.currency_symbol) settings.currencySymbol = map.currency_symbol;
  }

  // Apply CSS variables to :root whenever settings change
  useEffect(() => {
    const root = document.documentElement;

    // Convert hex to OKLCH for Tailwind 4 compatibility
    // We apply them as direct CSS custom properties used by inline styles
    root.style.setProperty("--brand-primary", settings.colorPrimary);
    root.style.setProperty("--brand-secondary", settings.colorSecondary);
    root.style.setProperty("--brand-accent", settings.colorAccent);
    root.style.setProperty("--brand-hero-from", settings.colorHeroFrom);
    root.style.setProperty("--brand-hero-to", settings.colorHeroTo);

    // Also update the Tailwind primary color variable (used by bg-primary, text-primary etc.)
    // Convert hex to RGB components for CSS variable
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}`
        : null;
    };

    // Update document title
    document.title = settings.siteName;

    // Update favicon if logo is set
    if (settings.siteLogoUrl) {
      const link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
      if (link) link.href = settings.siteLogoUrl;
    }
  }, [settings.colorPrimary, settings.colorSecondary, settings.colorAccent, settings.colorHeroFrom, settings.colorHeroTo, settings.siteName, settings.siteLogoUrl]);

  return (
    <SiteSettingsContext.Provider value={settings}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}
