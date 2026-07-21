import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

/**
 * `url` is a plain string, not `@IsUrl()` — it must also accept the
 * relative "/mock/..." paths pre-Cloudinary seed/demo data uses. See the
 * TalentMedia model comment for why gallery entries are URL-managed
 * rather than real file upload in this milestone.
 */
export class CreateTalentMediaDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2048)
  url!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  alt!: string;

  @IsOptional()
  @IsIn(["image", "video"])
  assetType?: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
