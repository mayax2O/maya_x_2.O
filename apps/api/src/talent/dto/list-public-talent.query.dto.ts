import { IsOptional, IsString, MaxLength } from "class-validator";

import { PaginationQueryDto } from "../../common/dto/pagination-query.dto";

/**
 * GET /public/talent query params. Deliberately minimal — this endpoint
 * exists only so the booking flows (apps/web) can resolve a real, bookable
 * talentId; it isn't the full public Talent Catalog browse experience the
 * REST API Specification §4.1 describes (that remains a later milestone,
 * apps/web's talent listing/profile pages still use M2 mock data).
 */
export class ListPublicTalentQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;
}
