import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";

import type { TalentAvailability } from "@prisma/client";

import { PaginationQueryDto } from "../../common/dto/pagination-query.dto";

const AVAILABILITY_VALUES: TalentAvailability[] = [
  "available",
  "limited",
  "unavailable",
];
const SORT_VALUES = ["featured", "price-asc", "price-desc"] as const;
export type PublicTalentSort = (typeof SORT_VALUES)[number];

/**
 * GET /public/talent-catalog query params — the full public browse
 * experience (unlike GET /public/talent, which is a deliberately minimal
 * booking-flow lookup and is left untouched). `city` filters by name
 * (not cityId) so apps/web's existing city-name-based Filters UI needs no
 * changes.
 */
export class ListPublicTalentCatalogQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @IsOptional()
  @IsString()
  categorySlug?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsIn(AVAILABILITY_VALUES)
  availability?: TalentAvailability;

  @IsOptional()
  @IsIn(SORT_VALUES)
  sort?: PublicTalentSort;
}
