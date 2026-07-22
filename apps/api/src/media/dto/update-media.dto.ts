import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
} from "class-validator";

export class UpdateMediaDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  altText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  originalFilename?: string;

  // Explicit null clears the folder assignment (moves to "no folder");
  // omitting the field leaves it unchanged.
  @ValidateIf((_dto, value) => value !== null)
  @IsOptional()
  @IsUUID("4")
  folderId?: string | null;
}
