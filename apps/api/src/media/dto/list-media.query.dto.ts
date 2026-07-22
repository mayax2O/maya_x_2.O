import { Transform } from "class-transformer";
import { IsBoolean, IsIn, IsOptional, IsString, IsUUID } from "class-validator";

export class ListMediaQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsUUID("4")
  folderId?: string;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  perPage?: number = 24;

  @IsOptional()
  @IsIn(["newest", "oldest", "name"])
  sort?: "newest" | "oldest" | "name" = "newest";

  // List Trash (soft-deleted assets) instead of active ones.
  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  @IsBoolean()
  trashed?: boolean;
}
