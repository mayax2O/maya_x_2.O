import type { MetadataRoute } from "next";

import { getTalentSlugs } from "../lib/data/talents";

const BASE_URL = "https://mayax.example";

const STATIC_ROUTES = [
  "",
  "/talent",
  "/membership",
  "/contact",
  "/about",
  "/login",
  "/register",
  "/quick-booking",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const talentSlugs = await getTalentSlugs();

  return [
    ...STATIC_ROUTES.map((route) => ({
      url: `${BASE_URL}${route}`,
      lastModified: new Date(),
    })),
    ...talentSlugs.map((slug) => ({
      url: `${BASE_URL}/talent/${slug}`,
      lastModified: new Date(),
    })),
  ];
}
