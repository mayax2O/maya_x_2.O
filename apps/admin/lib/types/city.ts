export interface City {
  id: string;
  name: string;
  state: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCityInput {
  name: string;
  state: string;
  isActive?: boolean;
  displayOrder?: number;
}

export type UpdateCityInput = Partial<CreateCityInput>;
