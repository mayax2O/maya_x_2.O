import { ArrayMinSize, IsArray, IsUUID } from "class-validator";

/** Body for PATCH /talent/:id/media/reorder — `mediaIds` in the new display order (drag-and-drop result). */
export class ReorderTalentMediaDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID("4", { each: true })
  mediaIds!: string[];
}
