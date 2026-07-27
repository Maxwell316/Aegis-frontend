import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/siteConfig";
import { routing } from "@/i18n/routing";

const STATIC_ROUTES = ["", "/bridge", "/settings", "/simulate"];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return routing.locales.flatMap((locale) =>
    STATIC_ROUTES.map((route) => ({
      url: `${siteUrl}/${locale}${route}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: route === "" ? 1 : 0.8,
    })),
  );
}
