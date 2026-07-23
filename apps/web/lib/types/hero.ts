export interface HeroMediaItem {
  id: string;
  url: string;
  resourceType: string;
  altText: string | null;
}

export interface HeroSettings {
  mode: "image" | "video" | "slider";
  media: HeroMediaItem[];
}
