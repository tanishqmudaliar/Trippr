import type { MetadataRoute } from "next";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://tripprbytanishq.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/privacy", "/terms"],
      disallow: [
        "/dashboard",
        "/entries",
        "/invoice",
        "/setup",
        "/settings",
        "/statistics",
        "/oauth-callback",
      ],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
