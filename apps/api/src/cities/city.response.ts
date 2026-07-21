import type { City } from "@prisma/client";

export interface CityResponse {
  id: string;
  name: string;
  state: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export function toCityResponse(city: City): CityResponse {
  return {
    id: city.id,
    name: city.name,
    state: city.state,
    isActive: city.isActive,
    displayOrder: city.displayOrder,
    createdAt: city.createdAt,
    updatedAt: city.updatedAt,
  };
}
