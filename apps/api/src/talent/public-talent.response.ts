import type { City, Talent } from "@prisma/client";

export type PublicTalentRow = Pick<
  Talent,
  "id" | "slug" | "displayName" | "tagline"
> & {
  city: Pick<City, "name" | "state">;
};

export interface PublicTalentResponse {
  id: string;
  slug: string;
  displayName: string;
  tagline: string | null;
  city: { name: string; state: string };
}

export function toPublicTalentResponse(
  talent: PublicTalentRow,
): PublicTalentResponse {
  return {
    id: talent.id,
    slug: talent.slug,
    displayName: talent.displayName,
    tagline: talent.tagline,
    city: { name: talent.city.name, state: talent.city.state },
  };
}
