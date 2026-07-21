import type { City, Location } from "@prisma/client";

export interface LocationResponse {
  id: string;
  name: string;
  cityId: string;
  city: { id: string; name: string; state: string };
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export function toLocationResponse(
  location: Location & { city: City },
): LocationResponse {
  return {
    id: location.id,
    name: location.name,
    cityId: location.cityId,
    city: {
      id: location.city.id,
      name: location.city.name,
      state: location.city.state,
    },
    isActive: location.isActive,
    displayOrder: location.displayOrder,
    createdAt: location.createdAt,
    updatedAt: location.updatedAt,
  };
}
