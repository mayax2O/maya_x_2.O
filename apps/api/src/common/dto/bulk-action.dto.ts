import { ArrayMinSize, IsArray, IsIn, IsUUID } from "class-validator";

export type BulkAction = "activate" | "deactivate" | "delete";

/** Shared body shape for every table's bulk activate/deactivate/delete action. */
export class BulkActionDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID("4", { each: true })
  ids!: string[];

  @IsIn(["activate", "deactivate", "delete"])
  action!: BulkAction;
}

export interface BulkActionResult {
  requested: number;
  affected: number;
}
