import { ArrayMinSize, IsArray, IsOptional, IsUUID } from "class-validator";

export class BulkMoveMediaDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID("4", { each: true })
  mediaIds!: string[];

  // Omit/null to move into "no folder".
  @IsOptional()
  @IsUUID("4")
  folderId?: string | null;
}
