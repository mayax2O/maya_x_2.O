import { authedFetch } from "../api/authFetch";
import type { HeroSettings } from "../types";

export function getHeroSettings(): Promise<HeroSettings> {
  return authedFetch<HeroSettings>("/admin/hero");
}

export function updateHeroSettings(payload: {
  mode: HeroSettings["mode"];
  mediaIds: string[];
}): Promise<HeroSettings> {
  return authedFetch<HeroSettings>("/admin/hero", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
