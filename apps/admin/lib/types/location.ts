export interface Location {
  id: string;
  name: string;
  cityId: string;
  city: { id: string; name: string; state: string };
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLocationInput {
  name: string;
  cityId: string;
  isActive?: boolean;
  displayOrder?: number;
}

export type UpdateLocationInput = Partial<CreateLocationInput>;
