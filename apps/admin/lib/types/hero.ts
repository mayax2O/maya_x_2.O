export interface HeroMediaItem {
  id: string;
  url: string;
  resourceType: string;
  altText: string | null;
}

export type HeroMode = "image" | "video" | "slider";

export interface HeroSettings {
  mode: HeroMode;
  media: HeroMediaItem[];
}
