import { IsBoolean, IsOptional, IsUUID } from "class-validator";

/**
 * As of M6, gallery entries reference an existing MediaAsset (uploaded
 * separately via `POST /media/upload` or already in the library) rather
 * than carrying their own url/alt — see the TalentMedia model comment.
 */
export class CreateTalentMediaDto {
  @IsUUID("4")
  mediaAssetId!: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
