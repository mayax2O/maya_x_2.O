import { IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

/** Non-file fields of `POST /media/upload` (multipart form fields alongside the file part). */
export class UploadMediaDto {
  @IsOptional()
  @IsUUID("4")
  folderId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  altText?: string;
}
