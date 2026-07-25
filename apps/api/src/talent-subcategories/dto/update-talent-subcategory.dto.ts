import { PartialType } from "@nestjs/mapped-types";

import { CreateTalentSubCategoryDto } from "./create-talent-subcategory.dto";

export class UpdateTalentSubCategoryDto extends PartialType(
  CreateTalentSubCategoryDto,
) {}
