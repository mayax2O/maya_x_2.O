import { ArrayMinSize, IsArray, IsUUID } from "class-validator";

/** Reorders assets within a single folder (or the unfiled "no folder" bucket). */
export class ReorderMediaDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID("4", { each: true })
  mediaIds!: string[];
}
