import { ArrayMinSize, IsArray, IsUUID } from "class-validator";

export class BulkDeleteMediaDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID("4", { each: true })
  mediaIds!: string[];
}
