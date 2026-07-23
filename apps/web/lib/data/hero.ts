import { apiFetch } from "../api/client";
import type { HeroSettings } from "../types";

const DEFAULT_HERO_SETTINGS: HeroSettings = { mode: "image", media: [] };

/**
 * The one real (non-mock) data call on the home page — admin controls the
 * Hero background dynamically, so it can't be static mock JSON like the
 * rest of this page's content. Falls back to the default (gradient-only,
 * no media) look on any failure, so a Hero misconfiguration or the API
 * being briefly unreachable never breaks the home page.
 */
export async function getHeroSettings(): Promise<HeroSettings> {
  try {
    return await apiFetch<HeroSettings>("/public/hero");
  } catch {
    return DEFAULT_HERO_SETTINGS;
  }
}
