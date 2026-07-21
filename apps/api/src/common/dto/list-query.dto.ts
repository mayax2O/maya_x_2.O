import { IsIn, IsOptional, IsString } from "class-validator";

import { PaginationQueryDto } from "./pagination-query.dto";

/** Adds free-text search and sorting on top of page/perPage — the shared shape every admin list endpoint accepts. */
export class ListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsIn(["asc", "desc"])
  sortOrder?: "asc" | "desc" = "asc";
}
